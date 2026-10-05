/**
 * Register this device for Web Push (when VAPID is configured on the server).
 * Safe to call repeatedly — no-ops if unsupported or not configured.
 */
export async function enableWebPush(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (typeof window === "undefined") return { ok: false, reason: "ssr" };
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" };
  }

  const { api } = await import("@/lib/api");
  const { data } = await api.get("/notifications/push/vapid-key");
  const publicKey = data.data?.publicKey as string | null;
  if (!publicKey) return { ok: false, reason: "not_configured" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };

  // Ensure a SW exists (reuse existing or register a minimal one)
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    reg =
      (await navigator.serviceWorker.register("/sw.js").catch(() => undefined)) ||
      undefined;
  }
  if (!reg) return { ok: false, reason: "no_sw" };

  await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, reason: "invalid_sub" };
  }

  await api.post("/notifications/push/subscribe", {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });
  await api.put("/notifications/prefs", { push: true });

  return { ok: true };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

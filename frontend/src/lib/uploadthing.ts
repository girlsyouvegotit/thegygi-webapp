import { generateReactHelpers } from "@uploadthing/react";

/**
 * UploadThing React helpers.
 *
 * Credentials must ONLY be sent to our own /api/uploadthing endpoint
 * (cookie auth). UploadThing's ingest CDN (*.ingest.uploadthing.com)
 * returns Access-Control-Allow-Origin: *, which browsers reject when
 * credentials mode is "include".
 */
export const API_UPLOADTHING_URL = `${
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
}/uploadthing`;

const isOurUploadThingApi = (input: RequestInfo | URL): boolean => {
  const raw =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  try {
    const target = new URL(raw, window.location.origin);
    const api = new URL(API_UPLOADTHING_URL, window.location.origin);
    return (
      target.origin === api.origin && target.pathname.includes("/uploadthing")
    );
  } catch {
    return typeof raw === "string" && raw.includes("/api/uploadthing");
  }
};

export const uploadThingFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const headers = new Headers(init?.headers);
  headers.delete("traceparent");
  headers.delete("tracestate");
  headers.delete("baggage");

  const toOurApi = isOurUploadThingApi(input);
  return fetch(input, {
    ...init,
    headers,
    credentials: toOurApi ? "include" : "omit",
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { useUploadThing } = generateReactHelpers<any>({
  url: API_UPLOADTHING_URL,
  fetch: uploadThingFetch,
});

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { NotificationProvider } from "@/hooks/NotificationProvider";
import { OfficialChatProvider } from "@/hooks/OfficialChatProvider";
import { OfficialChatBox } from "@/components/official-chat/OfficialChatBox";
import { GetInvolvedReplyProvider } from "@/hooks/GetInvolvedReplyProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <OfficialChatProvider>
            <GetInvolvedReplyProvider>
              <App />
              <OfficialChatBox />
            </GetInvolvedReplyProvider>
          </OfficialChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);

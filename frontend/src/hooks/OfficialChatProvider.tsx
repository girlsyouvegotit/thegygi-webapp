import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type OfficialChatOpenArgs = {
  threadId?: string;
  actionId?: string;
};

type OfficialChatContextValue = {
  isOpen: boolean;
  threadId?: string;
  actionId?: string;
  openOfficialChat: (args: OfficialChatOpenArgs) => void;
  closeOfficialChat: () => void;
};

const OfficialChatContext = createContext<OfficialChatContextValue | null>(
  null,
);

export function OfficialChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [actionId, setActionId] = useState<string | undefined>();

  const openOfficialChat = useCallback((args: OfficialChatOpenArgs) => {
    if (!args.threadId && !args.actionId) return;
    setThreadId(args.threadId);
    setActionId(args.actionId);
    setIsOpen(true);
  }, []);

  const closeOfficialChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      threadId,
      actionId,
      openOfficialChat,
      closeOfficialChat,
    }),
    [isOpen, threadId, actionId, openOfficialChat, closeOfficialChat],
  );

  return (
    <OfficialChatContext.Provider value={value}>
      {children}
    </OfficialChatContext.Provider>
  );
}

export function useOfficialChat() {
  const ctx = useContext(OfficialChatContext);
  if (!ctx) {
    throw new Error("useOfficialChat must be used within OfficialChatProvider");
  }
  return ctx;
}

/** Safe variant for places that may render outside the provider. */
export function useOfficialChatOptional() {
  return useContext(OfficialChatContext);
}

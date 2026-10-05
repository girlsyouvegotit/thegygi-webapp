import { useEffect, useState } from "react";
import { initializeSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = initializeSocket();
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socketInstance.off("connect");
      socketInstance.off("disconnect");
    };
  }, []);

  return {
    socket,
    isConnected,
  };
};

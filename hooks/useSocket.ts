import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const rawURL =
      process.env.EXPO_PUBLIC_SOCKET_URL || "https://smoker-be-api.onrender.com";
    // BỎ /api ở cuối để lấy origin
    const socketOrigin = rawURL.replace(/\/api\/?$/, "");

    const newSocket = io(socketOrigin, {
      path: "/api/socket.io",    
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("🔌 Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("🔌 Socket connection error:", error);
    });

    setSocket(newSocket);

    return () => {
      console.log("🔌 Disconnecting socket");
      newSocket.close();
    };
  }, []);

  return { socket, isConnected };
};
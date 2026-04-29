import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";

interface ChatHubOptions {
  /** Aktif sohbet edilen kullanıcının ID'si */
  activeUserId: string | null;
  /** Yeni mesaj geldiğinde çağrılacak callback */
  onMessageReceived: (message: any) => void;
  /** Kullanıcı listesindeki unread count güncellemesi */
  onUnreadCountUpdate?: (userId: string, count: number) => void;
  /** Bağlantı durumu değiştiğinde */
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * SignalR ChatHub hook'u.
 * Gerçek zamanlı mesajlaşma için `/hubs/chat` hub'ına bağlanır.
 * 
 * Backend events:
 * - ReceiveMessage(message): Yeni mesaj
 * - UserConnected(userId): Kullanıcı online oldu
 * - UserDisconnected(userId): Kullanıcı offline oldu
 * - UnreadCountUpdated(userId, count): Okunmamış sayısı güncellendi
 */
export const useChatHub = ({ activeUserId, onMessageReceived, onUnreadCountUpdate, onConnectionChange }: ChatHubOptions) => {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const activeUserIdRef = useRef(activeUserId);

  // activeUserId değiştiğinde ref'i güncelle (closure sorununu önler)
  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  useEffect(() => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL as string)?.replace("/api", "") || "http://localhost:5062";
    const token = localStorage.getItem("token");

    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Yeni mesaj gelince
    connection.on("ReceiveMessage", (message: any) => {
      onMessageReceived(message);
    });

    // Okunmamış sayı güncellemesi
    connection.on("UnreadCountUpdated", (userId: string, count: number) => {
      onUnreadCountUpdate?.(userId, count);
    });

    // Bağlantı durumu
    connection.onreconnecting(() => onConnectionChange?.(false));
    connection.onreconnected(() => onConnectionChange?.(true));
    connection.onclose(() => onConnectionChange?.(false));

    connection.start()
      .then(() => {
        onConnectionChange?.(true);
        // Aktif bir sohbet varsa o odaya katıl
        if (activeUserIdRef.current) {
          connection.invoke("JoinConversation", activeUserIdRef.current).catch(() => {});
        }
      })
      .catch((err) => {
        console.warn("ChatHub bağlantı hatası:", err);
        onConnectionChange?.(false);
      });

    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, []); // Sadece mount'ta bağlan

  // Aktif sohbet değiştiğinde odaya katıl/ayrıl
  useEffect(() => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;

    if (activeUserId) {
      conn.invoke("JoinConversation", activeUserId).catch(() => {});
    }

    return () => {
      if (activeUserId && conn.state === signalR.HubConnectionState.Connected) {
        conn.invoke("LeaveConversation", activeUserId).catch(() => {});
      }
    };
  }, [activeUserId]);

  /** Mesaj gönder (opsiyonel - HTTP yerine SignalR üzerinden) */
  const sendViaHub = useCallback(async (receiverId: string, content: string) => {
    const conn = connectionRef.current;
    if (conn && conn.state === signalR.HubConnectionState.Connected) {
      try {
        await conn.invoke("SendMessage", receiverId, content);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  return {
    connectionRef,
    sendViaHub,
    isConnected: () => connectionRef.current?.state === signalR.HubConnectionState.Connected,
  };
};

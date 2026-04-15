import { useState, useRef, useEffect, useCallback } from "react";
import { Card, Typography, Input, Button, Avatar, List, Badge, Grid, Spin, message as antMessage } from "antd";
import { SendOutlined, PaperClipOutlined, ArrowLeftOutlined, WifiOutlined, DisconnectOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { messageApi } from "../../api/messageApi";
import { useChatHub } from "../../hooks/useChatHub";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Messages = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [hubConnected, setHubConnected] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selected);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const colors = useThemeColors();
  const t = useT();

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const handleNewMessage = useCallback((msg: any) => {
    const senderId = msg.senderId || msg.from;
    // Aktif sohbette ise mesajı ekle
    if (selectedRef.current && (senderId === selectedRef.current || msg.receiverId === selectedRef.current)) {
      setMessages((prev) => {
        if (prev.some((m: any) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }
  }, []);

  useChatHub({
    activeUserId: selected,
    onMessageReceived: handleNewMessage,
    onConnectionChange: setHubConnected,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await messageApi.getTeachers();
        const data = res.data || res;
        setTeachers(Array.isArray(data) ? data : []);
      } catch { /* handled */ }
      finally { setLoadingTeachers(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const load = async () => {
      setLoadingMessages(true);
      try {
        const res = await messageApi.getConversation(selected);
        const data = res.data || res;
        const msgs = Array.isArray(data) ? data : [];
        setMessages(msgs);
        // Okunmamış mesajları okundu olarak işaretle
        const unreadIds = msgs.filter((m: any) => !m.isRead && m.from !== "student" && m.senderId !== "me").map((m: any) => m.id);
        for (const mid of unreadIds) {
          try { await messageApi.markAsRead(mid); } catch { /* ignore */ }
        }
      } catch { setMessages([]); }
      finally { setLoadingMessages(false); }
    };
    load();
  }, [selected]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selected) return;
    setSending(true);
    try {
      await messageApi.sendMessage({ receiverId: selected, content: input.trim() });
      setMessages((prev) => [...prev, { id: Date.now().toString(), senderId: "me", content: input.trim(), sentAt: new Date().toISOString(), from: "student" }]);
      setInput("");
    } catch (err: any) {
      antMessage.error(err?.response?.data?.message || "Mesaj gönderilemedi");
    } finally { setSending(false); }
  };

  const current = teachers.find((t: any) => (t.id || t.userId) === selected);

  const listContent = loadingTeachers ? (
    <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
  ) : (
    <List
      dataSource={teachers}
      locale={{ emptyText: "Öğretmen bulunamadı" }}
      renderItem={(teacher: any) => {
        const tid = teacher.id || teacher.userId;
        const name = teacher.fullName || teacher.name || `${teacher.firstName || ""} ${teacher.lastName || ""}`;
        const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
        return (
          <div onClick={() => setSelected(tid)} style={{
            padding: "14px 16px", cursor: "pointer", borderBottom: colors.listItemBorder,
            background: selected === tid ? colors.listItemHoverBg : "transparent",
            borderLeft: selected === tid ? `3px solid ${colors.accent}` : "3px solid transparent",
          }}>
            <div style={{ display: "flex", gap: 12 }}>
              <Avatar style={{ background: colors.accentBg, color: colors.accent, flexShrink: 0 }}>{initials}</Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: 500 }} ellipsis>{name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, flexShrink: 0 }}>{teacher.lastMessageTime || ""}</Text>
                </div>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{teacher.course || ""}</Text>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <Text style={{ color: colors.textDimmed, fontSize: 12 }} ellipsis>{teacher.lastMessage || ""}</Text>
                  {(teacher.unreadCount || 0) > 0 && <Badge count={teacher.unreadCount} size="small" />}
                </div>
              </div>
            </div>
          </div>
        );
      }}
    />
  );

  const chatContent = (
    <Card style={{ flex: 1, background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column", height: "100%" } }}>
      <div style={{ padding: "12px 16px", borderBottom: colors.borderSubtle, display: "flex", alignItems: "center", gap: 12 }}>
        {isMobile && <ArrowLeftOutlined onClick={() => setSelected(null)} style={{ color: colors.textSubtle, cursor: "pointer" }} />}
        <Avatar style={{ background: colors.accentBg, color: colors.accent }}>
          {(current?.fullName || current?.name || "").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
        </Avatar>
        <div style={{ flex: 1 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: 500, display: "block" }}>{current?.fullName || current?.name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{current?.course || ""}</Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {hubConnected ? <WifiOutlined style={{ color: "#52c41a", fontSize: 12 }} /> : <DisconnectOutlined style={{ color: colors.textDimmed, fontSize: 12 }} />}
          <Text style={{ color: hubConnected ? "#52c41a" : colors.textDimmed, fontSize: 10 }}>{hubConnected ? "Live" : "Offline"}</Text>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {loadingMessages ? <div style={{ textAlign: "center", padding: 40 }}><Spin /></div> :
          messages.map((msg: any) => {
            const isMe = msg.from === "student" || msg.senderId === "me" || msg.isMine;
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: isMobile ? "85%" : "70%", padding: "10px 14px",
                  borderRadius: isMe ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                  background: isMe ? colors.messageSentBg : colors.messageReceivedBg,
                  border: `1px solid ${isMe ? colors.messageSentBorder : colors.messageReceivedBorder}`,
                }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{msg.content || msg.text}</Text>
                  <Text style={{ color: colors.textDimmed, fontSize: 10, display: "block", marginTop: 4, textAlign: "right" }}>
                    {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : msg.time}
                  </Text>
                </div>
              </div>
            );
          })}
        <div ref={endRef} />
      </div>
      <div style={{ padding: 12, borderTop: colors.borderSubtle, display: "flex", gap: 8 }}>
        <Button type="text" icon={<PaperClipOutlined />} style={{ color: colors.textMuted }} />
        <Input value={input} onChange={(e) => setInput(e.target.value)} onPressEnter={handleSend} placeholder={t("typeMessage")}
          style={{ flex: 1, background: colors.inputBg, borderColor: colors.accentBorderSolid, borderRadius: 8 }} />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!input.trim()} loading={sending}
          style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none" }} />
      </div>
    </Card>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("messages")}</Title>
        <Text style={{ color: colors.textMuted }}>{t("messagesSubtitle")}</Text>
      </div>
      {!isMobile ? (
        <div style={{ display: "flex", gap: 16, height: "calc(100vh - 180px)", minHeight: 500 }}>
          <Card style={{ width: 300, flexShrink: 0, background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, overflow: "hidden" }}
            styles={{ body: { padding: 0, height: "100%", overflowY: "auto" } }}>{listContent}</Card>
          {selected ? chatContent : (
            <Card style={{ flex: 1, background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: colors.textMuted }}>{t("selectConversation") || "Bir sohbet seçin"}</Text>
            </Card>
          )}
        </div>
      ) : (
        <div style={{ height: "calc(100vh - 160px)", minHeight: 400 }}>
          {!selected ? (
            <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>{listContent}</Card>
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>{chatContent}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Messages;

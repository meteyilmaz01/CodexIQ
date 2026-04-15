import { useState, useRef, useEffect, useCallback } from "react";
import { Card, Typography, Input, Button, Avatar, List, Badge, Grid, Spin, message as antMessage } from "antd";
import { SendOutlined, PaperClipOutlined, ArrowLeftOutlined, WifiOutlined, DisconnectOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { messageApi } from "../../api/messageApi";
import { useChatHub } from "../../hooks/useChatHub";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const TeacherMessages = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [hubConnected, setHubConnected] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selected);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const colors = useThemeColors();
  const tFunc = useT();

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const handleNewMessage = useCallback((msg: any) => {
    const senderId = msg.senderId || msg.from;
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
        const res = await messageApi.getStudents();
        const data = res.data || res;
        setStudents(Array.isArray(data) ? data : []);
      } catch { /* handled */ }
      finally { setLoadingStudents(false); }
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
        setMessages(Array.isArray(data) ? data : []);
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
      setMessages((prev) => [...prev, { id: Date.now().toString(), senderId: "me", content: input.trim(), sentAt: new Date().toISOString(), from: "teacher" }]);
      setInput("");
    } catch (err: any) {
      antMessage.error(err?.response?.data?.message || "Mesaj gönderilemedi");
    } finally { setSending(false); }
  };

  const current = students.find((s: any) => (s.id || s.userId) === selected);

  const listContent = loadingStudents ? (
    <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
  ) : (
    <List
      dataSource={students}
      locale={{ emptyText: "Öğrenci bulunamadı" }}
      renderItem={(student: any) => {
        const sid = student.id || student.userId;
        const name = student.fullName || student.name || `${student.firstName || ""} ${student.lastName || ""}`;
        const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
        return (
          <div onClick={() => setSelected(sid)} style={{
            padding: "14px 16px", cursor: "pointer", borderBottom: colors.listItemBorder,
            background: selected === sid ? colors.listItemHoverBg : "transparent",
            borderLeft: selected === sid ? `3px solid ${colors.accent}` : "3px solid transparent",
          }}>
            <div style={{ display: "flex", gap: 12 }}>
              <Avatar style={{ background: colors.accentBg, color: colors.accent, flexShrink: 0 }}>{initials}</Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: 500 }} ellipsis>{name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, flexShrink: 0 }}>{student.lastMessageTime || ""}</Text>
                </div>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{student.studentNo || student.no || ""}</Text>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <Text style={{ color: colors.textDimmed, fontSize: 12 }} ellipsis>{student.lastMessage || ""}</Text>
                  {(student.unreadCount || 0) > 0 && <Badge count={student.unreadCount} size="small" />}
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
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{current?.studentNo || current?.no || ""}</Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {hubConnected ? <WifiOutlined style={{ color: "#52c41a", fontSize: 12 }} /> : <DisconnectOutlined style={{ color: colors.textDimmed, fontSize: 12 }} />}
          <Text style={{ color: hubConnected ? "#52c41a" : colors.textDimmed, fontSize: 10 }}>{hubConnected ? "Live" : "Offline"}</Text>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {loadingMessages ? <div style={{ textAlign: "center", padding: 40 }}><Spin /></div> :
          messages.map((msg: any) => {
            const isMe = msg.from === "teacher" || msg.senderId === "me" || msg.isMine;
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
        <Input value={input} onChange={(e) => setInput(e.target.value)} onPressEnter={handleSend} placeholder={tFunc("typeMessage")}
          style={{ flex: 1, background: colors.inputBg, borderColor: colors.accentBorderSolid, borderRadius: 8 }} />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!input.trim()} loading={sending}
          style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none" }} />
      </div>
    </Card>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{tFunc("messages")}</Title>
        <Text style={{ color: colors.textMuted }}>{tFunc("teacherMessagesSubtitle")}</Text>
      </div>
      {!isMobile ? (
        <div style={{ display: "flex", gap: 16, height: "calc(100vh - 180px)", minHeight: 500 }}>
          <Card style={{ width: 300, flexShrink: 0, background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, overflow: "hidden" }}
            styles={{ body: { padding: 0, height: "100%", overflowY: "auto" } }}>{listContent}</Card>
          {selected ? chatContent : (
            <Card style={{ flex: 1, background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: colors.textMuted }}>{tFunc("selectConversation") || "Bir sohbet seçin"}</Text>
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

export default TeacherMessages;
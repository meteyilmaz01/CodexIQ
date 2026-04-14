import { useState, useRef, useEffect } from "react";
import { Card, Typography, Input, Button, Avatar, List, Badge, Grid } from "antd";
import { SendOutlined, PaperClipOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface Message { id: number; from: "student" | "teacher"; text: string; time: string; }
interface Student { id: number; name: string; no: string; lastMessage: string; lastTime: string; unread: number; avatar: string; }

const mockStudents: Student[] = [
  { id: 1, name: "Ali Veli", no: "2021001", lastMessage: "Teşekkür ederim hocam.", lastTime: "10:20", unread: 1, avatar: "AV" },
  { id: 2, name: "Ayşe Kaya", no: "2021002", lastMessage: "Proje hakkında bir sorum var.", lastTime: "Dün", unread: 3, avatar: "AK" },
  { id: 3, name: "Mehmet Demir", no: "2021003", lastMessage: "Anladım hocam, teşekkürler.", lastTime: "Paz", unread: 0, avatar: "MD" },
  { id: 4, name: "Zeynep Yıldız", no: "2021004", lastMessage: "Quiz ne zaman olacak?", lastTime: "Cum", unread: 1, avatar: "ZY" },
];

const mockMessages: Record<number, Message[]> = {
  1: [{ id: 1, from: "teacher", text: "Merhaba Ali, final sınavını değerlendirdim.", time: "10:15" }, { id: 2, from: "teacher", text: "Genel olarak iyi. Linked list kısmında birkaç hata var.", time: "10:16" }, { id: 3, from: "student", text: "Teşekkür ederim hocam.", time: "10:20" }],
  2: [{ id: 1, from: "student", text: "Hocam proje hakkında bir sorum var. Veritabanı bağlantısı için hangi kütüphaneyi kullanmalıyız?", time: "Dün" }],
  3: [{ id: 1, from: "teacher", text: "Ödevinizi kontrol ettim, daha dikkatli olmanız gerekiyor.", time: "Paz" }, { id: 2, from: "student", text: "Anladım hocam, teşekkürler.", time: "Paz" }],
  4: [{ id: 1, from: "student", text: "Quiz ne zaman olacak?", time: "Cum" }],
};

const TeacherMessages = () => {
  const [selected, setSelected] = useState<number | null>(1);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const endRef = useRef<HTMLDivElement>(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const colors = useThemeColors();
  const tFunc = useT();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selected, messages]);

  const handleSend = () => {
    if (!input.trim() || !selected) return;
    const msg: Message = { id: Date.now(), from: "teacher", text: input.trim(), time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) };
    setMessages((p) => ({ ...p, [selected]: [...(p[selected] || []), msg] }));
    setInput("");
  };

  const current = mockStudents.find((s) => s.id === selected);
  const currentMsgs = selected ? messages[selected] || [] : [];

  const listContent = (
    <List dataSource={mockStudents} renderItem={(s) => (
      <div onClick={() => setSelected(s.id)} style={{ padding: "14px 16px", cursor: "pointer", borderBottom: colors.listItemBorder, background: selected === s.id ? colors.listItemHoverBg : "transparent", borderLeft: selected === s.id ? `3px solid ${colors.accent}` : "3px solid transparent" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Avatar style={{ background: colors.accentBg, color: colors.accent, flexShrink: 0 }}>{s.avatar}</Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: 500 }} ellipsis>{s.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, flexShrink: 0 }}>{s.lastTime}</Text>
            </div>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>{s.no}</Text>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <Text style={{ color: colors.textDimmed, fontSize: 12 }} ellipsis>{s.lastMessage}</Text>
              {s.unread > 0 && <Badge count={s.unread} size="small" />}
            </div>
          </div>
        </div>
      </div>
    )} />
  );

  const chatContent = (
    <Card style={{ flex: 1, background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }} styles={{ body: { padding: 0, display: "flex", flexDirection: "column", height: "100%" } }}>
      <div style={{ padding: "12px 16px", borderBottom: colors.borderSubtle, display: "flex", alignItems: "center", gap: 12 }}>
        {isMobile && <ArrowLeftOutlined onClick={() => setSelected(null)} style={{ color: colors.textSubtle, cursor: "pointer" }} />}
        <Avatar style={{ background: colors.accentBg, color: colors.accent }}>{current?.avatar}</Avatar>
        <div><Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: 500, display: "block" }}>{current?.name}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{current?.no}</Text></div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {currentMsgs.map((msg) => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "teacher" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: isMobile ? "85%" : "70%", padding: "10px 14px", borderRadius: msg.from === "teacher" ? "12px 12px 4px 12px" : "12px 12px 12px 4px", background: msg.from === "teacher" ? colors.messageSentBg : colors.messageReceivedBg, border: `1px solid ${msg.from === "teacher" ? colors.messageSentBorder : colors.messageReceivedBorder}` }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{msg.text}</Text>
              <Text style={{ color: colors.textDimmed, fontSize: 10, display: "block", marginTop: 4, textAlign: "right" }}>{msg.time}</Text>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding: 12, borderTop: colors.borderSubtle, display: "flex", gap: 8 }}>
        <Button type="text" icon={<PaperClipOutlined />} style={{ color: colors.textMuted }} />
        <Input value={input} onChange={(e) => setInput(e.target.value)} onPressEnter={handleSend} placeholder={tFunc("typeMessage")} style={{ flex: 1, background: colors.inputBg, borderColor: colors.accentBorderSolid, borderRadius: 8 }} />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!input.trim()} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none" }} />
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
          <Card style={{ width: 300, flexShrink: 0, background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, overflow: "hidden" }} styles={{ body: { padding: 0, height: "100%", overflowY: "auto" } }}>{listContent}</Card>
          {chatContent}
        </div>
      ) : (
        <div style={{ height: "calc(100vh - 160px)", minHeight: 400 }}>
          {!selected ? <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>{listContent}</Card>
            : <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>{chatContent}</div>}
        </div>
      )}
    </div>
  );
};

export default TeacherMessages;
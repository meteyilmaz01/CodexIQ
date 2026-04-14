import { useState, useRef, useEffect } from "react";
import { Card, Typography, Input, Button, Avatar, List, Badge, Grid } from "antd";
import { SendOutlined, PaperClipOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface Message { id: number; from: "student" | "teacher"; text: string; time: string; }
interface Teacher { id: number; name: string; course: string; lastMessage: string; lastTime: string; unread: number; avatar: string; }

const mockTeachers: Teacher[] = [
  { id: 1, name: "Prof. Dr. Ahmet Yılmaz", course: "Veri Yapıları", lastMessage: "Linked list konusunda daha dikkatli olmalısın.", lastTime: "10:30", unread: 2, avatar: "AY" },
  { id: 2, name: "Dr. Elif Kaya", course: "Algoritma", lastMessage: "Quiz sonuçları yayınlandı.", lastTime: "Dün", unread: 0, avatar: "EK" },
  { id: 3, name: "Doç. Dr. Mehmet Demir", course: "OOP", lastMessage: "Proje teslim tarihi uzatıldı.", lastTime: "Paz", unread: 1, avatar: "MD" },
];

const mockMessages: Record<number, Message[]> = {
  1: [
    { id: 1, from: "teacher", text: "Sınav sonucunu inceledim. Genel olarak iyi ama linked list kısmında hatalar var.", time: "10:15" },
    { id: 2, from: "teacher", text: "Özellikle delete fonksiyonunda NULL kontrolü eksik.", time: "10:16" },
    { id: 3, from: "student", text: "Teşekkür ederim hocam, düzelteceğim.", time: "10:20" },
    { id: 4, from: "teacher", text: "Linked list konusunda daha dikkatli olmalısın.", time: "10:30" },
  ],
  2: [
    { id: 1, from: "teacher", text: "Quiz sonuçları yayınlandı. İyi çalışmalar.", time: "Dün" },
  ],
  3: [
    { id: 1, from: "teacher", text: "Proje teslim tarihi 1 hafta uzatıldı.", time: "Paz" },
    { id: 2, from: "student", text: "Teşekkürler hocam.", time: "Paz" },
  ],
};

const Messages = () => {
  const [selected, setSelected] = useState<number | null>(1);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const endRef = useRef<HTMLDivElement>(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const colors = useThemeColors();
  const t = useT();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selected, messages]);

  const handleSend = () => {
    if (!input.trim() || !selected) return;
    const msg: Message = { id: Date.now(), from: "student", text: input.trim(), time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }), };
    setMessages((p) => ({ ...p, [selected]: [...(p[selected] || []), msg] }));
    setInput("");
  };

  const current = mockTeachers.find((t) => t.id === selected);
  const currentMsgs = selected ? messages[selected] || [] : [];

  const listContent = (
    <List
      dataSource={mockTeachers}
      renderItem={(teacher) => (
        <div
          onClick={() => setSelected(teacher.id)}
          style={{
            padding: "14px 16px", cursor: "pointer",
            borderBottom: colors.listItemBorder,
            background: selected === teacher.id ? colors.listItemHoverBg : "transparent",
            borderLeft: selected === teacher.id ? `3px solid ${colors.accent}` : "3px solid transparent",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <Avatar style={{ background: colors.accentBg, color: colors.accent, flexShrink: 0 }}>{teacher.avatar}</Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: 500 }} ellipsis>{teacher.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, flexShrink: 0 }}>{teacher.lastTime}</Text>
              </div>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{teacher.course}</Text>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <Text style={{ color: colors.textDimmed, fontSize: 12 }} ellipsis>{teacher.lastMessage}</Text>
                {teacher.unread > 0 && <Badge count={teacher.unread} size="small" />}
              </div>
            </div>
          </div>
        </div>
      )}
    />
  );

  const chatContent = (
    <Card
      style={{ flex: 1, background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column", height: "100%" } }}
    >
      <div style={{ padding: "12px 16px", borderBottom: colors.borderSubtle, display: "flex", alignItems: "center", gap: 12 }}>
        {isMobile && <ArrowLeftOutlined onClick={() => setSelected(null)} style={{ color: colors.textSubtle, cursor: "pointer" }} />}
        <Avatar style={{ background: colors.accentBg, color: colors.accent }}>{current?.avatar}</Avatar>
        <div>
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: 500, display: "block" }}>{current?.name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{current?.course}</Text>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {currentMsgs.map((msg) => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "student" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: isMobile ? "85%" : "70%", padding: "10px 14px",
              borderRadius: msg.from === "student" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
              background: msg.from === "student" ? colors.messageSentBg : colors.messageReceivedBg,
              border: `1px solid ${msg.from === "student" ? colors.messageSentBorder : colors.messageReceivedBorder}`,
            }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{msg.text}</Text>
              <Text style={{ color: colors.textDimmed, fontSize: 10, display: "block", marginTop: 4, textAlign: "right" }}>{msg.time}</Text>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding: 12, borderTop: colors.borderSubtle, display: "flex", gap: 8 }}>
        <Button type="text" icon={<PaperClipOutlined />} style={{ color: colors.textMuted }} />
        <Input value={input} onChange={(e) => setInput(e.target.value)} onPressEnter={handleSend} placeholder={t("typeMessage")} style={{ flex: 1, background: colors.inputBg, borderColor: colors.accentBorderSolid, borderRadius: 8 }} />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!input.trim()} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none" }} />
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
          <Card style={{ width: 300, flexShrink: 0, background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, overflow: "hidden" }} styles={{ body: { padding: 0, height: "100%", overflowY: "auto" } }}>
            {listContent}
          </Card>
          {chatContent}
        </div>
      ) : (
        <div style={{ height: "calc(100vh - 160px)", minHeight: 400 }}>
          {!selected ? (
            <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
              {listContent}
            </Card>
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>{chatContent}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Messages;
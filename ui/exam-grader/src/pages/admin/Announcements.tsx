import { useState } from "react";
import { Card, Table, Tag, Typography, Button, Modal, Form, Input, Select, message, Popconfirm, Space } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, NotificationOutlined, PushpinOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Announcement { id: number; title: string; content: string; type: "info" | "success" | "warning" | "urgent"; target: "all" | "teachers" | "students"; date: string; pinned: boolean; }

const initial: Announcement[] = [
  { id: 1, title: "Sistem Bakımı - 10 Nisan", content: "10 Nisan 02:00-06:00 arası bakım yapılacaktır.", type: "urgent", target: "all", date: "2026-04-06", pinned: true },
  { id: 2, title: "Veri Yapıları Final Sonuçları", content: "Sonuçlar sisteme yüklenmiştir.", type: "success", target: "students", date: "2026-04-06", pinned: false },
  { id: 3, title: "Yeni Ders Eklendi: Yapay Zeka", content: "2026 Güz dönemi için YZ dersi açılmıştır.", type: "info", target: "all", date: "2026-04-03", pinned: false },
  { id: 4, title: "API Kullanım Limiti Uyarısı", content: "Aylık API bütçesinin %80'ine ulaşıldı.", type: "warning", target: "teachers", date: "2026-04-01", pinned: false },
];

const Announcements = () => {
  const [data, setData] = useState<Announcement[]>(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form] = Form.useForm();
  const colors = useThemeColors();
  const t = useT();

  const handleAdd = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (r: Announcement) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); };
  const handleSave = () => { form.validateFields().then((values) => { if (editing) { setData(data.map((d) => (d.id === editing.id ? { ...d, ...values } : d))); message.success(t("announcementUpdated")); } else { setData([{ ...values, id: Date.now(), date: new Date().toISOString().split("T")[0], pinned: false }, ...data]); message.success(t("announcementAdded")); } setModalOpen(false); }); };
  const handleDelete = (id: number) => { setData(data.filter((d) => d.id !== id)); message.success(t("announcementDeleted")); };
  const togglePin = (id: number) => { setData(data.map((d) => (d.id === id ? { ...d, pinned: !d.pinned } : d))); };

  const typeColors: Record<string, string> = { info: "blue", success: "green", warning: "orange", urgent: "red" };
  const typeLabels: Record<string, string> = { info: t("info"), success: t("resultType"), warning: t("warning"), urgent: t("urgent") };
  const targetLabels: Record<string, string> = { all: t("everyone"), teachers: t("teachers"), students: t("studentsLabel") };

  const columns = [
    { title: t("announcement"), key: "title", render: (_: unknown, r: Announcement) => (
      <div><div style={{ display: "flex", alignItems: "center", gap: 6 }}>{r.pinned && <PushpinOutlined style={{ color: "#faad14", fontSize: 12 }} />}<Text style={{ color: colors.textSecondary, fontSize: 14 }}>{r.title}</Text></div><Text style={{ color: colors.textMuted, fontSize: 12 }} ellipsis>{r.content}</Text></div>
    )},
    { title: t("type"), dataIndex: "type", key: "type", responsive: ["md" as const], render: (tp: string) => <Tag color={typeColors[tp]} style={{ borderRadius: 6 }}>{typeLabels[tp]}</Tag> },
    { title: t("target"), dataIndex: "target", key: "target", responsive: ["md" as const], render: (tg: string) => <Tag style={{ borderRadius: 6 }}>{targetLabels[tg]}</Tag> },
    { title: t("date"), dataIndex: "date", key: "date", responsive: ["lg" as const], render: (d: string) => <Text style={{ color: colors.textMuted, fontSize: 12 }}>{d}</Text> },
    { title: "", key: "actions", render: (_: unknown, r: Announcement) => (
      <Space>
        <Button type="text" icon={<PushpinOutlined />} onClick={() => togglePin(r.id)} style={{ color: r.pinned ? "#faad14" : colors.textDimmed }} />
        <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(r)} style={{ color: colors.accent }} />
        <Popconfirm title={t("confirmDelete")} onConfirm={() => handleDelete(r.id)} okText={t("yes")} cancelText={t("no")}><Button type="text" icon={<DeleteOutlined />} danger /></Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div><Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("announcements")}</Title><Text style={{ color: colors.textMuted }}>{data.length} {t("announcementsCount")}</Text></div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}>{t("newAnnouncement")}</Button>
      </div>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table dataSource={data} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={editing ? t("editAnnouncement") : t("newAnnouncement")} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText={t("save")} cancelText={t("cancel")}>
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          <Form.Item name="title" label={t("titleField")} rules={[{ required: true, message: t("required") }]}><Input prefix={<NotificationOutlined style={{ color: colors.textDimmed }} />} /></Form.Item>
          <Form.Item name="content" label={t("content")} rules={[{ required: true, message: t("required") }]}><TextArea rows={4} /></Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="type" label={t("type")} rules={[{ required: true }]} style={{ flex: 1 }}><Select options={[{ label: t("info"), value: "info" }, { label: t("resultType"), value: "success" }, { label: t("warning"), value: "warning" }, { label: t("urgent"), value: "urgent" }]} /></Form.Item>
            <Form.Item name="target" label={t("targetAudience")} rules={[{ required: true }]} style={{ flex: 1 }}><Select options={[{ label: t("everyone"), value: "all" }, { label: t("teachers"), value: "teachers" }, { label: t("studentsLabel"), value: "students" }]} /></Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Announcements;
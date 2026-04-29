import { useState, useEffect } from "react";
import { Card, Table, Tag, Typography, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Spin } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, NotificationOutlined, PushpinOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { adminApi } from "../../api/adminApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

const Announcements = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const colors = useThemeColors();
  const t = useT();

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAnnouncements();
      const d = res.data || res;
      setData(Array.isArray(d) ? d : d.items || d.results || []);
    } catch { setData([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleAdd = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (r: any) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await adminApi.updateAnnouncement(editing.id, values);
        message.success(t("announcementUpdated"));
      } else {
        await adminApi.createAnnouncement(values);
        message.success(t("announcementAdded"));
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      if (err?.response?.data?.message) message.error(err.response.data.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteAnnouncement(id);
      message.success(t("announcementDeleted"));
      fetchAnnouncements();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Hata");
    }
  };

  const typeColors: Record<string, string> = { info: "blue", success: "green", warning: "orange", urgent: "red" };
  const typeLabels: Record<string, string> = { info: t("info"), success: t("resultType"), warning: t("warning"), urgent: t("urgent") };
  const targetLabels: Record<string, string> = { all: t("everyone"), teachers: t("teachers"), students: t("studentsLabel") };

  const columns = [
    { title: t("announcement"), key: "title", render: (_: unknown, r: any) => (
      <div><div style={{ display: "flex", alignItems: "center", gap: 6 }}>{r.pinned && <PushpinOutlined style={{ color: "#faad14", fontSize: 12 }} />}<Text style={{ color: colors.textSecondary, fontSize: 14 }}>{r.title}</Text></div><Text style={{ color: colors.textMuted, fontSize: 12 }} ellipsis>{r.content}</Text></div>
    )},
    { title: t("type"), dataIndex: "type", key: "type", responsive: ["md" as const], render: (tp: string) => <Tag color={typeColors[tp] || "default"} style={{ borderRadius: 6 }}>{typeLabels[tp] || tp}</Tag> },
    { title: t("target"), dataIndex: "target", key: "target", responsive: ["md" as const], render: (tg: string) => <Tag style={{ borderRadius: 6 }}>{targetLabels[tg] || tg}</Tag> },
    { title: t("date"), key: "date", responsive: ["lg" as const], render: (_: unknown, r: any) => <Text style={{ color: colors.textMuted, fontSize: 12 }}>{r.date || r.createdAt || "-"}</Text> },
    { title: "", key: "actions", render: (_: unknown, r: any) => (
      <Space>
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
        <Table dataSource={data} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={editing ? t("editAnnouncement") : t("newAnnouncement")} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText={t("save")} cancelText={t("cancel")} confirmLoading={saving}>
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
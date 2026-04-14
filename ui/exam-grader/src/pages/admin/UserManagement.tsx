import { useState } from "react";
import { Card, Table, Tag, Input, Select, Typography, Button, Avatar, Space, Modal, Form, Row, Col, message, Popconfirm } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined, UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;

interface User { id: number; name: string; email: string; role: "Admin" | "Teacher" | "Student"; status: "active" | "inactive"; studentNo?: string; department: string; createdAt: string; }

const initialUsers: User[] = [
  { id: 1, name: "Admin", email: "admin@codexiq.com", role: "Admin", status: "active", department: "Sistem", createdAt: "2026-01-01" },
  { id: 2, name: "Prof. Dr. Ahmet Yılmaz", email: "ahmet@univ.edu.tr", role: "Teacher", status: "active", department: "Bilgisayar Müh.", createdAt: "2026-01-10" },
  { id: 3, name: "Dr. Elif Kaya", email: "elif@univ.edu.tr", role: "Teacher", status: "active", department: "Bilgisayar Müh.", createdAt: "2026-01-12" },
  { id: 4, name: "Ali Veli", email: "ali@mail.com", role: "Student", status: "active", studentNo: "2021001", department: "Bilgisayar Müh.", createdAt: "2026-02-01" },
  { id: 5, name: "Ayşe Kaya", email: "ayse@mail.com", role: "Student", status: "active", studentNo: "2021002", department: "Bilgisayar Müh.", createdAt: "2026-02-01" },
  { id: 6, name: "Mehmet Demir", email: "mehmet@mail.com", role: "Student", status: "inactive", studentNo: "2021003", department: "Bilgisayar Müh.", createdAt: "2026-02-05" },
  { id: 7, name: "Zeynep Yıldız", email: "zeynep@mail.com", role: "Student", status: "active", studentNo: "2021004", department: "Elektrik Müh.", createdAt: "2026-02-10" },
  { id: 8, name: "Can Özkan", email: "can@mail.com", role: "Student", status: "active", studentNo: "2021005", department: "Bilgisayar Müh.", createdAt: "2026-02-15" },
];

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const colors = useThemeColors();
  const t = useT();

  const filtered = users.filter((u) => { const ms = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()); const mr = !roleFilter || u.role === roleFilter; const mst = !statusFilter || u.status === statusFilter; return ms && mr && mst; });

  const handleAdd = () => { setEditingUser(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (user: User) => { setEditingUser(user); form.setFieldsValue(user); setModalOpen(true); };
  const handleSave = () => { form.validateFields().then((values) => { if (editingUser) { setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, ...values } : u))); message.success(t("userUpdated")); } else { setUsers([...users, { ...values, id: Date.now(), status: "active", createdAt: new Date().toISOString().split("T")[0] }]); message.success(t("userAdded")); } setModalOpen(false); }); };
  const handleToggleStatus = (id: number) => { setUsers(users.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u))); message.success(t("statusUpdated")); };
  const handleDelete = (id: number) => { setUsers(users.filter((u) => u.id !== id)); message.success(t("userDeleted")); };

  const getRoleColor = (role: string) => { if (role === "Admin") return "#ff4d4f"; if (role === "Teacher") return "#1890ff"; return "#52c41a"; };

  const columns = [
    {
      title: t("users"), key: "user", render: (_: unknown, r: User) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar style={{ background: `${getRoleColor(r.role)}20`, color: getRoleColor(r.role) }} size={36}>{r.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</Avatar>
          <div><Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{r.name}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{r.email}</Text></div>
        </div>
      )
    },
    { title: t("role"), dataIndex: "role", key: "role", render: (role: string) => <Tag color={role === "Admin" ? "error" : role === "Teacher" ? "blue" : "success"} style={{ borderRadius: 6 }}>{role}</Tag> },
    { title: t("department"), dataIndex: "department", key: "department", responsive: ["lg" as const], render: (text: string) => <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{text}</Text> },
    { title: t("status"), dataIndex: "status", key: "status", responsive: ["md" as const], render: (status: string) => status === "active" ? <Tag icon={<CheckCircleOutlined />} color="success">{t("active")}</Tag> : <Tag icon={<StopOutlined />} color="default">{t("inactive")}</Tag> },
    { title: t("registration"), dataIndex: "createdAt", key: "createdAt", responsive: ["lg" as const], render: (date: string) => <Text style={{ color: colors.textMuted, fontSize: 12 }}>{date}</Text> },
    {
      title: "", key: "actions", render: (_: unknown, r: User) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(r)} style={{ color: colors.accent }} />
          <Button type="text" icon={r.status === "active" ? <StopOutlined /> : <CheckCircleOutlined />} onClick={() => handleToggleStatus(r.id)} style={{ color: r.status === "active" ? "#faad14" : "#52c41a" }} />
          <Popconfirm title={t("confirmDelete")} onConfirm={() => handleDelete(r.id)} okText={t("yes")} cancelText={t("no")}><Button type="text" icon={<DeleteOutlined />} danger /></Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div><Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("userManagement")}</Title><Text style={{ color: colors.textMuted }}>{users.length} {t("usersCount")}</Text></div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}>{t("newUser")}</Button>
      </div>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: "12px 16px" } }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Input placeholder={t("search")} prefix={<SearchOutlined style={{ color: colors.textDimmed }} />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 220 }} />
          <Select placeholder={t("role")} allowClear onChange={(v) => setRoleFilter(v)} options={[{ label: "Admin", value: "Admin" }, { label: "Teacher", value: "Teacher" }, { label: "Student", value: "Student" }]} style={{ minWidth: 130 }} />
          <Select placeholder={t("status")} allowClear onChange={(v) => setStatusFilter(v)} options={[{ label: t("active"), value: "active" }, { label: t("inactive"), value: "inactive" }]} style={{ minWidth: 120 }} />
        </div>
      </Card>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table dataSource={filtered} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={editingUser ? t("editUser") : t("newUser")} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText={t("save")} cancelText={t("cancel")}>
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="name" label={t("fullName")} rules={[{ required: true, message: t("required") }]}><Input prefix={<UserOutlined style={{ color: colors.textDimmed }} />} /></Form.Item></Col>
            <Col span={12}><Form.Item name="role" label={t("role")} rules={[{ required: true, message: t("required") }]}><Select options={[{ label: "Admin", value: "Admin" }, { label: "Teacher", value: "Teacher" }, { label: "Student", value: "Student" }]} /></Form.Item></Col>
          </Row>
          <Form.Item name="email" label={t("email")} rules={[{ required: true, type: "email", message: t("validEmail") }]}><Input prefix={<MailOutlined style={{ color: colors.textDimmed }} />} /></Form.Item>
          <Form.Item name="department" label={t("department")} rules={[{ required: true, message: t("required") }]}><Input /></Form.Item>
          {!editingUser && <Form.Item name="password" label={t("password")} rules={[{ required: true, min: 6, message: t("minChars") }]}><Input.Password prefix={<LockOutlined style={{ color: colors.textDimmed }} />} /></Form.Item>}
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
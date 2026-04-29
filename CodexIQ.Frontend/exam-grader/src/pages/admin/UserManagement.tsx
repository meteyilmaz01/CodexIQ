import { useState, useEffect } from "react";
import { Card, Table, Tag, Input, Select, Typography, Button, Avatar, Space, Modal, Form, Row, Col, message, Popconfirm, Spin } from "antd";
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined, UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { adminApi } from "../../api/adminApi";

const { Title, Text } = Typography;

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const colors = useThemeColors();
  const t = useT();

  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
        page,
        pageSize,
      });
      const data = res.data || res;
      if (Array.isArray(data)) {
        setUsers(data);
        setPagination({ current: page, pageSize, total: data.length });
      } else {
        setUsers(data.items || data.results || []);
        setPagination({ current: page, pageSize, total: data.totalCount || data.total || 0 });
      }
    } catch { setUsers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1, pagination.pageSize), 500);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  const handleAdd = () => { setEditingUser(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (user: any) => { setEditingUser(user); form.setFieldsValue({ name: user.name || `${user.firstName || ""} ${user.lastName || ""}`, email: user.email, role: user.role, department: user.department, studentNumber: user.studentNumber }); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, values);
        message.success(t("userUpdated"));
      } else {
        const nameParts = (values.name || "").split(" ");
        await adminApi.createUser({
          email: values.email,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          role: values.role,
          password: values.password,
          studentNumber: values.role === "Student" ? values.studentNumber : undefined,
        });
        message.success(t("userAdded"));
      }
      setModalOpen(false);
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (err: any) {
      if (err?.response?.data?.message) message.error(err.response.data.message);
    } finally { setSaving(false); }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      const newStatus = !(user.isActive ?? user.status === "active");
      await adminApi.updateUserStatus(user.id, newStatus);
      message.success(t("statusUpdated"));
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Hata");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteUser(id);
      message.success(t("userDeleted"));
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Hata");
    }
  };

  const getRoleColor = (role: string) => { if (role === "Admin") return "#ff4d4f"; if (role === "Teacher") return "#1890ff"; return "#52c41a"; };

  const columns = [
    {
      title: t("users"), key: "user", render: (_: unknown, r: any) => {
        const name = r.name || r.fullName || `${r.firstName || ""} ${r.lastName || ""}`;
        const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar style={{ background: `${getRoleColor(r.role)}20`, color: getRoleColor(r.role) }} size={36}>{initials}</Avatar>
            <div><Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{name}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{r.email}</Text></div>
          </div>
        );
      }
    },
    { title: t("role"), dataIndex: "role", key: "role", render: (role: string) => <Tag color={role === "Admin" ? "error" : role === "Teacher" ? "blue" : "success"} style={{ borderRadius: 6 }}>{role}</Tag> },
    { title: t("department"), dataIndex: "department", key: "department", responsive: ["lg" as const], render: (text: string) => <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{text || "-"}</Text> },
    { title: "No", key: "studentNumber", responsive: ["lg" as const], render: (_: unknown, r: any) => <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{r.studentNumber || "-"}</Text> },
    { title: t("status"), key: "status", responsive: ["md" as const], render: (_: unknown, r: any) => {
      const active = r.isActive ?? r.status === "active";
      return active ? <Tag icon={<CheckCircleOutlined />} color="success">{t("active")}</Tag> : <Tag icon={<StopOutlined />} color="default">{t("inactive")}</Tag>;
    }},
    { title: t("registration"), key: "createdAt", responsive: ["lg" as const], render: (_: unknown, r: any) => <Text style={{ color: colors.textMuted, fontSize: 12 }}>{r.createdAt || r.registrationDate || "-"}</Text> },
    {
      title: "", key: "actions", render: (_: unknown, r: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(r)} style={{ color: colors.accent }} />
          <Button type="text" icon={(r.isActive ?? r.status === "active") ? <StopOutlined /> : <CheckCircleOutlined />} onClick={() => handleToggleStatus(r)} style={{ color: (r.isActive ?? r.status === "active") ? "#faad14" : "#52c41a" }} />
          <Popconfirm title={t("confirmDelete")} onConfirm={() => handleDelete(r.id)} okText={t("yes")} cancelText={t("no")}><Button type="text" icon={<DeleteOutlined />} danger /></Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div><Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("userManagement")}</Title><Text style={{ color: colors.textMuted }}>{pagination.total} {t("usersCount")}</Text></div>
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
        <Table dataSource={users} columns={columns} rowKey="id" loading={loading}
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, onChange: (p, ps) => fetchUsers(p, ps) }} />
      </Card>

      <Modal title={editingUser ? t("editUser") : t("newUser")} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText={t("save")} cancelText={t("cancel")} confirmLoading={saving}>
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="name" label={t("fullName")} rules={[{ required: true, message: t("required") }]}><Input prefix={<UserOutlined style={{ color: colors.textDimmed }} />} /></Form.Item></Col>
            <Col span={12}><Form.Item name="role" label={t("role")} rules={[{ required: true, message: t("required") }]}><Select options={[{ label: "Admin", value: "Admin" }, { label: "Teacher", value: "Teacher" }, { label: "Student", value: "Student" }]} /></Form.Item></Col>
          </Row>
          <Form.Item name="email" label={t("email")} rules={[{ required: true, type: "email", message: t("validEmail") }]}><Input prefix={<MailOutlined style={{ color: colors.textDimmed }} />} /></Form.Item>
          <Form.Item name="department" label={t("department")} rules={[{ required: true, message: t("required") }]}><Input /></Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.role !== cur.role}>
            {({ getFieldValue }) => getFieldValue("role") === "Student" ? (
              <Form.Item name="studentNumber" label="Öğrenci No"><Input placeholder="2110206040" /></Form.Item>
            ) : null}
          </Form.Item>
          {!editingUser && <Form.Item name="password" label={t("password")} rules={[{ required: true, min: 6, message: t("minChars") }]}><Input.Password prefix={<LockOutlined style={{ color: colors.textDimmed }} />} /></Form.Item>}
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
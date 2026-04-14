import { useState } from "react";
import { Card, Table, Tag, Typography, Button, Modal, Form, Input, Select, Tabs, message, Popconfirm, Space, InputNumber } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, BookOutlined, TeamOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;

interface Course { id: number; name: string; code: string; teacher: string; students: number; status: "active" | "inactive"; }
interface ClassItem { id: number; name: string; department: string; year: number; students: number; status: "active" | "inactive"; }

const initialCourses: Course[] = [
  { id: 1, name: "Veri Yapıları", code: "CS201", teacher: "Prof. Dr. Ahmet Yılmaz", students: 45, status: "active" },
  { id: 2, name: "Algoritma Analizi", code: "CS301", teacher: "Dr. Elif Kaya", students: 42, status: "active" },
  { id: 3, name: "OOP", code: "CS202", teacher: "Doç. Dr. Mehmet Demir", students: 38, status: "active" },
  { id: 4, name: "C Programlama", code: "CS101", teacher: "Dr. Ayşe Çelik", students: 55, status: "active" },
  { id: 5, name: "Veritabanı Yönetimi", code: "CS302", teacher: "Prof. Dr. Can Özkan", students: 40, status: "inactive" },
];

const initialClasses: ClassItem[] = [
  { id: 1, name: "Bilgisayar Müh. 1-A", department: "Bilgisayar Müh.", year: 1, students: 30, status: "active" },
  { id: 2, name: "Bilgisayar Müh. 1-B", department: "Bilgisayar Müh.", year: 1, students: 28, status: "active" },
  { id: 3, name: "Bilgisayar Müh. 2-A", department: "Bilgisayar Müh.", year: 2, students: 25, status: "active" },
  { id: 4, name: "Bilgisayar Müh. 3-A", department: "Bilgisayar Müh.", year: 3, students: 22, status: "active" },
  { id: 5, name: "Elektrik Müh. 1-A", department: "Elektrik Müh.", year: 1, students: 20, status: "inactive" },
];

const ClassManagement = () => {
  const [courses, setCourses] = useState(initialCourses);
  const [classes, setClasses] = useState(initialClasses);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"course" | "class">("course");
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const colors = useThemeColors();
  const t = useT();

  const openModal = (type: "course" | "class", record?: any) => { setModalType(type); setEditing(record || null); form.resetFields(); if (record) form.setFieldsValue(record); setModalOpen(true); };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (modalType === "course") { if (editing) setCourses(courses.map((c) => (c.id === editing.id ? { ...c, ...values } : c))); else setCourses([...courses, { ...values, id: Date.now(), students: 0, status: "active" }]); }
      else { if (editing) setClasses(classes.map((c) => (c.id === editing.id ? { ...c, ...values } : c))); else setClasses([...classes, { ...values, id: Date.now(), students: 0, status: "active" }]); }
      message.success(editing ? t("updated") : t("added")); setModalOpen(false);
    });
  };

  const courseColumns = [
    { title: t("course"), key: "name", render: (_: unknown, r: Course) => <div><Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{r.name}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{r.code}</Text></div> },
    { title: t("teacher"), dataIndex: "teacher", key: "teacher", responsive: ["md" as const], render: (text: string) => <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{text}</Text> },
    { title: t("student"), dataIndex: "students", key: "students", render: (n: number) => <Tag style={{ borderRadius: 6 }}><TeamOutlined /> {n}</Tag> },
    { title: t("status"), dataIndex: "status", key: "status", responsive: ["md" as const], render: (s: string) => s === "active" ? <Tag color="success">{t("active")}</Tag> : <Tag>{t("inactive")}</Tag> },
    { title: "", key: "actions", render: (_: unknown, r: Course) => (
      <Space>
        <Button type="text" icon={<EditOutlined />} onClick={() => openModal("course", r)} style={{ color: colors.accent }} />
        <Button type="text" icon={r.status === "active" ? <StopOutlined /> : <CheckCircleOutlined />} onClick={() => setCourses(courses.map((c) => c.id === r.id ? { ...c, status: c.status === "active" ? "inactive" : "active" } : c))} style={{ color: r.status === "active" ? "#faad14" : "#52c41a" }} />
        <Popconfirm title={t("confirmDelete")} onConfirm={() => { setCourses(courses.filter((c) => c.id !== r.id)); message.success(t("deleted")); }} okText={t("yes")} cancelText={t("no")}><Button type="text" icon={<DeleteOutlined />} danger /></Popconfirm>
      </Space>
    )},
  ];

  const classColumns = [
    { title: t("class"), key: "name", render: (_: unknown, r: ClassItem) => <div><Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{r.name}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{r.department}</Text></div> },
    { title: t("year"), dataIndex: "year", key: "year", render: (y: number) => <Tag style={{ borderRadius: 6 }}>{y}. {t("classYear")}</Tag> },
    { title: t("student"), dataIndex: "students", key: "students", render: (n: number) => <Tag style={{ borderRadius: 6 }}><TeamOutlined /> {n}</Tag> },
    { title: t("status"), dataIndex: "status", key: "status", responsive: ["md" as const], render: (s: string) => s === "active" ? <Tag color="success">{t("active")}</Tag> : <Tag>{t("inactive")}</Tag> },
    { title: "", key: "actions", render: (_: unknown, r: ClassItem) => (
      <Space>
        <Button type="text" icon={<EditOutlined />} onClick={() => openModal("class", r)} style={{ color: colors.accent }} />
        <Button type="text" icon={r.status === "active" ? <StopOutlined /> : <CheckCircleOutlined />} onClick={() => setClasses(classes.map((c) => c.id === r.id ? { ...c, status: c.status === "active" ? "inactive" : "active" } : c))} style={{ color: r.status === "active" ? "#faad14" : "#52c41a" }} />
        <Popconfirm title={t("confirmDelete")} onConfirm={() => { setClasses(classes.filter((c) => c.id !== r.id)); message.success(t("deleted")); }} okText={t("yes")} cancelText={t("no")}><Button type="text" icon={<DeleteOutlined />} danger /></Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("classesAndCourses")}</Title>
        <Text style={{ color: colors.textMuted }}>{t("manageCourseAndClasses")}</Text>
      </div>
      <Tabs items={[
        { key: "courses", label: <span><BookOutlined style={{ marginRight: 6 }} />{t("coursesTab")} ({courses.length})</span>, children: (
          <><div style={{ marginBottom: 16, textAlign: "right" }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal("course")} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}>{t("newCourse")}</Button></div>
          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}><Table dataSource={courses} columns={courseColumns} rowKey="id" pagination={{ pageSize: 10 }} /></Card></>
        )},
        { key: "classes", label: <span><TeamOutlined style={{ marginRight: 6 }} />{t("classesTab")} ({classes.length})</span>, children: (
          <><div style={{ marginBottom: 16, textAlign: "right" }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal("class")} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}>{t("newClass")}</Button></div>
          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}><Table dataSource={classes} columns={classColumns} rowKey="id" pagination={{ pageSize: 10 }} /></Card></>
        )},
      ]} />
      <Modal title={modalType === "course" ? (editing ? t("editCourse") : t("newCourse")) : (editing ? t("editClass") : t("newClass"))} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText={t("save")} cancelText={t("cancel")}>
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          <Form.Item name="name" label={t("name")} rules={[{ required: true, message: t("required") }]}><Input /></Form.Item>
          {modalType === "course" ? (<><Form.Item name="code" label={t("courseCode")} rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="teacher" label={t("teacher")} rules={[{ required: true }]}><Input /></Form.Item></>)
            : (<><Form.Item name="department" label={t("department")} rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="year" label={t("year")} rules={[{ required: true }]}><InputNumber min={1} max={6} style={{ width: "100%" }} /></Form.Item></>)}
        </Form>
      </Modal>
    </div>
  );
};

export default ClassManagement;
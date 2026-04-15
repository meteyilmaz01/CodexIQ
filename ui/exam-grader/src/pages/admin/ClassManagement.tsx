import { useState, useEffect } from "react";
import { Card, Table, Tag, Typography, Button, Modal, Form, Input, Select, Tabs, message, Popconfirm, Space, InputNumber, Spin } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, BookOutlined, TeamOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { adminApi } from "../../api/adminApi";

const { Title, Text } = Typography;

const ClassManagement = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"course" | "class">("course");
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const colors = useThemeColors();
  const t = useT();

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await adminApi.getCourses({ pageSize: 100 });
      const d = res.data || res;
      setCourses(Array.isArray(d) ? d : d.items || d.results || []);
    } catch { setCourses([]); }
    finally { setLoadingCourses(false); }
  };

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await adminApi.getClasses();
      const d = res.data || res;
      setClasses(Array.isArray(d) ? d : d.items || d.results || []);
    } catch { setClasses([]); }
    finally { setLoadingClasses(false); }
  };

  useEffect(() => { fetchCourses(); fetchClasses(); }, []);

  const openModal = (type: "course" | "class", record?: any) => { setModalType(type); setEditing(record || null); form.resetFields(); if (record) form.setFieldsValue(record); setModalOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (modalType === "course") {
        if (editing) { await adminApi.updateCourse(editing.id, values); }
        else { await adminApi.createCourse(values); }
      } else {
        if (editing) { await adminApi.updateClass(editing.id, values); }
        else { await adminApi.createClass(values); }
      }
      message.success(editing ? t("updated") : t("added"));
      setModalOpen(false);
      if (modalType === "course") fetchCourses(); else fetchClasses();
    } catch (err: any) {
      if (err?.response?.data?.message) message.error(err.response.data.message);
    } finally { setSaving(false); }
  };

  const handleToggleCourseStatus = async (course: any) => {
    try {
      const newStatus = !(course.isActive ?? course.status === "active");
      await adminApi.updateCourseStatus(course.id, newStatus);
      message.success(t("statusUpdated"));
      fetchCourses();
    } catch (err: any) { message.error(err?.response?.data?.message || "Hata"); }
  };

  const handleDeleteCourse = async (id: string) => {
    try { await adminApi.deleteCourse(id); message.success(t("deleted")); fetchCourses(); }
    catch (err: any) { message.error(err?.response?.data?.message || "Hata"); }
  };

  const handleToggleClassStatus = async (cls: any) => {
    try {
      const newStatus = !(cls.isActive ?? cls.status === "active");
      await adminApi.updateClassStatus(cls.id, newStatus);
      message.success(t("statusUpdated"));
      fetchClasses();
    } catch (err: any) { message.error(err?.response?.data?.message || "Hata"); }
  };

  const handleDeleteClass = async (id: string) => {
    try { await adminApi.deleteClass(id); message.success(t("deleted")); fetchClasses(); }
    catch (err: any) { message.error(err?.response?.data?.message || "Hata"); }
  };

  const isActive = (r: any) => r.isActive ?? r.status === "active";

  const courseColumns = [
    { title: t("course"), key: "name", render: (_: unknown, r: any) => <div><Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{r.name}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{r.code || ""}</Text></div> },
    { title: t("teacher"), key: "teacher", responsive: ["md" as const], render: (_: unknown, r: any) => <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{r.teacher || r.teacherName || "-"}</Text> },
    { title: t("student"), key: "students", render: (_: unknown, r: any) => <Tag style={{ borderRadius: 6 }}><TeamOutlined /> {r.students ?? r.studentCount ?? 0}</Tag> },
    { title: t("status"), key: "status", responsive: ["md" as const], render: (_: unknown, r: any) => isActive(r) ? <Tag color="success">{t("active")}</Tag> : <Tag>{t("inactive")}</Tag> },
    { title: "", key: "actions", render: (_: unknown, r: any) => (
      <Space>
        <Button type="text" icon={<EditOutlined />} onClick={() => openModal("course", r)} style={{ color: colors.accent }} />
        <Button type="text" icon={isActive(r) ? <StopOutlined /> : <CheckCircleOutlined />} onClick={() => handleToggleCourseStatus(r)} style={{ color: isActive(r) ? "#faad14" : "#52c41a" }} />
        <Popconfirm title={t("confirmDelete")} onConfirm={() => handleDeleteCourse(r.id)} okText={t("yes")} cancelText={t("no")}><Button type="text" icon={<DeleteOutlined />} danger /></Popconfirm>
      </Space>
    )},
  ];

  const classColumns = [
    { title: t("class"), key: "name", render: (_: unknown, r: any) => <div><Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{r.name}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{r.department || ""}</Text></div> },
    { title: t("year"), key: "year", render: (_: unknown, r: any) => r.year ? <Tag style={{ borderRadius: 6 }}>{r.year}. {t("classYear")}</Tag> : null },
    { title: t("student"), key: "students", render: (_: unknown, r: any) => <Tag style={{ borderRadius: 6 }}><TeamOutlined /> {r.students ?? r.studentCount ?? 0}</Tag> },
    { title: t("status"), key: "status", responsive: ["md" as const], render: (_: unknown, r: any) => isActive(r) ? <Tag color="success">{t("active")}</Tag> : <Tag>{t("inactive")}</Tag> },
    { title: "", key: "actions", render: (_: unknown, r: any) => (
      <Space>
        <Button type="text" icon={<EditOutlined />} onClick={() => openModal("class", r)} style={{ color: colors.accent }} />
        <Button type="text" icon={isActive(r) ? <StopOutlined /> : <CheckCircleOutlined />} onClick={() => handleToggleClassStatus(r)} style={{ color: isActive(r) ? "#faad14" : "#52c41a" }} />
        <Popconfirm title={t("confirmDelete")} onConfirm={() => handleDeleteClass(r.id)} okText={t("yes")} cancelText={t("no")}><Button type="text" icon={<DeleteOutlined />} danger /></Popconfirm>
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
          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}><Table dataSource={courses} columns={courseColumns} rowKey="id" loading={loadingCourses} pagination={{ pageSize: 10 }} /></Card></>
        )},
        { key: "classes", label: <span><TeamOutlined style={{ marginRight: 6 }} />{t("classesTab")} ({classes.length})</span>, children: (
          <><div style={{ marginBottom: 16, textAlign: "right" }}><Button type="primary" icon={<PlusOutlined />} onClick={() => openModal("class")} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}>{t("newClass")}</Button></div>
          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}><Table dataSource={classes} columns={classColumns} rowKey="id" loading={loadingClasses} pagination={{ pageSize: 10 }} /></Card></>
        )},
      ]} />
      <Modal title={modalType === "course" ? (editing ? t("editCourse") : t("newCourse")) : (editing ? t("editClass") : t("newClass"))} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText={t("save")} cancelText={t("cancel")} confirmLoading={saving}>
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
          <Form.Item name="name" label={t("name")} rules={[{ required: true, message: t("required") }]}><Input /></Form.Item>
          {modalType === "course" ? (<><Form.Item name="code" label={t("courseCode")}><Input /></Form.Item><Form.Item name="classId" label={t("class")}><Select options={classes.map(c => ({ label: c.name, value: c.id }))} placeholder={t("selectClass")} /></Form.Item></>)
            : (<><Form.Item name="department" label={t("department")}><Input /></Form.Item><Form.Item name="year" label={t("year")}><InputNumber min={1} max={6} style={{ width: "100%" }} /></Form.Item></>)}
        </Form>
      </Modal>
    </div>
  );
};

export default ClassManagement;
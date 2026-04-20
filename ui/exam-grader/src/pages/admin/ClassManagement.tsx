import { useState, useEffect } from "react";
import { Card, Table, Tag, Typography, Button, Modal, Form, Input, Select, Tabs, message, Popconfirm, Space, InputNumber, List, Avatar, Spin } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, BookOutlined, TeamOutlined, UserOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { adminApi } from "../../api/adminApi";

const { Title, Text } = Typography;

const ClassManagement = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"course" | "class">("course");
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Öğrenci yönetimi state'leri
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [addingStudents, setAddingStudents] = useState(false);

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

  const fetchTeachers = async () => {
    try {
      const res = await adminApi.getTeachers();
      const d = res.data || res;
      const items = d?.items || d?.results || (Array.isArray(d) ? d : []);
      setTeachers(items.map((t: any) => ({ value: t.id, label: t.fullName || `${t.firstName || ""} ${t.lastName || ""}`.trim() })));
    } catch { setTeachers([]); }
  };

  useEffect(() => { fetchCourses(); fetchClasses(); fetchTeachers(); }, []);

  const openStudentModal = async (cls: any) => {
    setSelectedClass(cls);
    setSelectedToAdd([]);
    setStudentModalOpen(true);
    setLoadingStudents(true);
    try {
      const [classRes, allRes] = await Promise.all([
        adminApi.getClassStudents(cls.id),
        adminApi.getAllStudents(),
      ]);
      const clsStudents = (() => { const d = classRes.data || classRes; return Array.isArray(d) ? d : d.items || []; })();
      const allStu = (() => { const d = allRes.data || allRes; return Array.isArray(d) ? d : d.items || []; })();
      setClassStudents(clsStudents);
      const assignedIds = new Set(clsStudents.map((s: any) => s.id));
      setAllStudents(allStu.filter((s: any) => !assignedIds.has(s.id)));
    } catch { message.error("Öğrenciler yüklenemedi"); }
    finally { setLoadingStudents(false); }
  };

  const handleAddStudents = async () => {
    if (!selectedToAdd.length) return;
    setAddingStudents(true);
    try {
      await adminApi.assignStudents(selectedClass.id, selectedToAdd);
      message.success(`${selectedToAdd.length} öğrenci eklendi`);
      setSelectedToAdd([]);
      await openStudentModal(selectedClass);
      fetchClasses();
    } catch (err: any) { message.error(err?.response?.data?.message || "Hata"); }
    finally { setAddingStudents(false); }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      await adminApi.removeStudentFromClass(selectedClass.id, studentId);
      message.success("Öğrenci sınıftan çıkarıldı");
      setClassStudents(prev => prev.filter((s: any) => s.id !== studentId));
      const removed = classStudents.find((s: any) => s.id === studentId);
      if (removed) setAllStudents(prev => [...prev, removed]);
      fetchClasses();
    } catch (err: any) { message.error(err?.response?.data?.message || "Hata"); }
  };

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
        <Button type="text" icon={<UserOutlined />} onClick={() => openStudentModal(r)} style={{ color: colors.accent }} title="Öğrencileri Yönet" />
        <Button type="text" icon={<EditOutlined />} onClick={() => openModal("class", r)} style={{ color: colors.textSubtle }} />
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
            : (<><Form.Item name="teacherId" label={t("teacher")} rules={[{ required: true, message: t("required") }]}><Select options={teachers} placeholder={t("selectTeacher")} /></Form.Item><Form.Item name="department" label={t("department")}><Input /></Form.Item><Form.Item name="year" label={t("year")}><InputNumber min={1} max={6} style={{ width: "100%" }} /></Form.Item></>)}
        </Form>
      </Modal>

      {/* Öğrenci Yönetim Modalı */}
      <Modal
        title={<span><TeamOutlined style={{ marginRight: 8, color: colors.accent }} />{selectedClass?.name} — Öğrenciler</span>}
        open={studentModalOpen}
        onCancel={() => setStudentModalOpen(false)}
        footer={null}
        width={560}
      >
        {loadingStudents ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
        ) : (
          <div>
            {/* Öğrenci ekle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <Select
                mode="multiple"
                placeholder="Öğrenci seç..."
                value={selectedToAdd}
                onChange={setSelectedToAdd}
                options={allStudents.map((s: any) => ({ label: s.fullName, value: s.id }))}
                style={{ flex: 1 }}
                filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                maxTagCount="responsive"
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddStudents}
                loading={addingStudents}
                disabled={!selectedToAdd.length}
                style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none" }}
              >
                Ekle
              </Button>
            </div>

            {/* Mevcut öğrenciler */}
            {classStudents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: colors.textMuted }}>
                Bu sınıfta henüz öğrenci yok
              </div>
            ) : (
              <List
                dataSource={classStudents}
                renderItem={(s: any) => (
                  <List.Item
                    style={{ padding: "8px 0", borderBottom: `1px solid ${colors.dividerColor}` }}
                    actions={[
                      <Popconfirm
                        title="Öğrenciyi sınıftan çıkarmak istediğinize emin misiniz?"
                        onConfirm={() => handleRemoveStudent(s.id)}
                        okText="Evet"
                        cancelText="İptal"
                      >
                        <Button type="text" icon={<MinusCircleOutlined />} danger size="small" />
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} style={{ background: `${colors.accent}30`, color: colors.accent }} size={32} />}
                      title={<Text style={{ color: colors.textSecondary, fontSize: 13 }}>{s.fullName}</Text>}
                      description={<Text style={{ color: colors.textMuted, fontSize: 12 }}>{s.email || s.role || ""}</Text>}
                    />
                  </List.Item>
                )}
              />
            )}
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <Tag style={{ borderRadius: 6 }}><TeamOutlined /> Toplam: {classStudents.length} öğrenci</Tag>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClassManagement;
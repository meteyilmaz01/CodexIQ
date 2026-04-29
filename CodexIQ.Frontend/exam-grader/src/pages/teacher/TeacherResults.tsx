import { useState, useEffect } from "react";
import { Card, Table, Tag, Input, Select, Typography, Button, Space, Dropdown, Tooltip, message, Popconfirm } from "antd";
import { SearchOutlined, EyeOutlined, DownloadOutlined, ShareAltOutlined, FileExcelOutlined, FilePdfOutlined, CheckCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { teacherApi } from "../../api/teacherApi";

const { Title, Text } = Typography;

const TeacherResults = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const [examFilter, setExamFilter] = useState<string | null>(() => searchParams.get("exam"));
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const colors = useThemeColors();
  const t = useT();

  const fetchResults = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await teacherApi.getResults({ search: search || undefined, course: courseFilter || undefined, exam: examFilter || undefined, page, pageSize });
      const data = res.data || res;
      if (Array.isArray(data)) { setResults(data); setPagination({ current: page, pageSize, total: data.length }); }
      else { setResults(data.items || data.results || []); setPagination({ current: page, pageSize, total: data.totalCount || data.total || 0 }); }
    } catch { setResults([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchResults(); }, []);
  useEffect(() => { const timer = setTimeout(() => fetchResults(1), 500); return () => clearTimeout(timer); }, [search, courseFilter, examFilter]);

  const handleExamFilterChange = (v: string | null) => {
    setExamFilter(v);
    if (v) setSearchParams({ exam: v }); else setSearchParams({});
  };

  const getScoreColor = (s: number) => { if (s >= 85) return "#52c41a"; if (s >= 70) return colors.accent; if (s >= 50) return "#faad14"; return "#ff4d4f"; };

  const handleDeletePaper = async (id: string) => {
    try {
      await teacherApi.deleteExamPaper(id);
      message.success(t("deleted") || "Silindi");
      fetchResults(pagination.current, pagination.pageSize);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Hata");
    }
  };

  const handleDeleteExam = async () => {
    const exam = results.find((r: any) => (r.exam || r.examName || r.ExamName) === examFilter);
    if (!exam?.examId && !exam?.ExamId) { message.error("Sınav ID bulunamadı"); return; }
    try {
      await teacherApi.deleteExam(exam.examId || exam.ExamId);
      message.success(t("deleted") || "Sınav silindi");
      setExamFilter(null);
      setSearchParams({});
      fetchResults(1);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Hata");
    }
  };

  const handleBulkShare = async () => {
    try { await teacherApi.bulkShare(selectedRows); message.success(`${selectedRows.length} ${t("resultsShared")}`); setSelectedRows([]); fetchResults(pagination.current, pagination.pageSize); }
    catch (err: any) { message.error(err?.response?.data?.message || "Hata"); }
  };

  const handleExport = async (type: string) => {
    try {
      const res = type === "excel"
        ? await teacherApi.exportExcel(examFilter || undefined)
        : await teacherApi.exportPdf(examFilter || undefined);
      const safeName = examFilter ? examFilter.replace(/ /g, "_") : "tum_sonuclar";
      const isExcel = type === "excel";
      const mimeType = isExcel ? "text/csv;charset=utf-8" : "application/pdf";
      const extension = isExcel ? "csv" : "pdf";
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeName}.${extension}`;
      link.click();
      window.URL.revokeObjectURL(url);
      message.success(`${type.toUpperCase()} ${t("downloading")}...`);
    } catch {
      message.error("Export hatası");
    }
  };

  const coursesList = [...new Set(results.map((r: any) => r.course || r.courseName).filter(Boolean))];
  const exams = [...new Set(results.map((r: any) => r.exam || r.examName).filter(Boolean))];

  const columns = [
    { title: t("student"), key: "student", render: (_: unknown, r: any) => (
      <div><Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{r.studentName}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{r.studentNo}</Text></div>
    )},
    { title: t("exam"), key: "exam", responsive: ["lg" as const], render: (_: unknown, r: any) => <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{r.exam || r.examName}</Text> },
    { title: t("score"), key: "score", sorter: (a: any, b: any) => (a.score || a.totalScore || 0) - (b.score || b.totalScore || 0), render: (_: unknown, r: any) => {
      const score = r.score || r.totalScore || 0;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: getScoreColor(score), fontFamily: "'JetBrains Mono'" }}>{score}</span>
          {r.overridden && <Tooltip title={t("manualOverride")}><Tag color="orange" style={{ borderRadius: 4, fontSize: 10 }}>OVR</Tag></Tooltip>}
        </div>
      );
    }},
    { title: t("errorsTitle"), key: "errors", responsive: ["md" as const], render: (_: unknown, r: any) => (
      <Space size={4}><Tag color={(r.syntaxErrors ?? r.syntaxErrorCount ?? 0) === 0 ? "success" : "warning"}>{r.syntaxErrors ?? r.syntaxErrorCount ?? 0}S</Tag><Tag color={(r.logicErrors ?? r.logicErrorCount ?? 0) === 0 ? "success" : "error"}>{r.logicErrors ?? r.logicErrorCount ?? 0}M</Tag></Space>
    )},
    { title: t("status"), key: "shared", responsive: ["md" as const], render: (_: unknown, r: any) =>
      r.shared ? <Tag icon={<CheckCircleOutlined />} color="success">{t("shared")}</Tag> : <Tag color="default">{t("notShared")}</Tag>
    },
    { title: "", key: "action", render: (_: unknown, r: any) => (
      <Space>
        <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/teacher/results/${r.id}`)} style={{ color: colors.accent }}>{t("detail")}</Button>
        <Popconfirm
          title={t("deleteConfirm")}
          onConfirm={() => handleDeletePaper(r.id)}
          okText={t("yes")}
          cancelText={t("no")}
          okButtonProps={{ danger: true }}
        >
          <Button type="text" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div><Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("results")}</Title><Text style={{ color: colors.textMuted }}>{t("manageResults")}</Text></div>
        <Space wrap>
          {selectedRows.length > 0 && <Button type="primary" icon={<ShareAltOutlined />} onClick={handleBulkShare} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none" }}>{selectedRows.length} {t("shareResults")}</Button>}
          <Dropdown menu={{ items: [
            { key: "excel", icon: <FileExcelOutlined />, label: `Excel ${t("download")}`, onClick: () => handleExport("excel") },
            { key: "pdf", icon: <FilePdfOutlined />, label: `PDF ${t("download")}`, onClick: () => handleExport("pdf") },
          ] }}><Button icon={<DownloadOutlined />}>{t("export")}</Button></Dropdown>
        </Space>
      </div>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: "12px 16px" } }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Input placeholder={t("searchStudent")} prefix={<SearchOutlined style={{ color: colors.textDimmed }} />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 220 }} />
          <Select placeholder={t("course")} allowClear onChange={(v) => setCourseFilter(v)} options={coursesList.map((c) => ({ label: c, value: c }))} style={{ minWidth: 160 }} />
          <Select placeholder={t("exam")} allowClear value={examFilter} onChange={handleExamFilterChange} options={exams.map((e) => ({ label: e, value: e }))} style={{ minWidth: 200 }} />
          {examFilter && (
            <Popconfirm
              title={t("deleteExamConfirm")}
              onConfirm={handleDeleteExam}
              okText={t("yes")}
              cancelText={t("no")}
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />}>{t("deleteExam")}</Button>
            </Popconfirm>
          )}
        </div>
      </Card>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table dataSource={results} columns={columns} rowKey="id" loading={loading}
          pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total, onChange: (p, ps) => fetchResults(p, ps) }}
          rowSelection={{ selectedRowKeys: selectedRows, onChange: (keys) => setSelectedRows(keys as string[]) }} style={{ overflow: "auto" }} />
      </Card>
    </div>
  );
};

export default TeacherResults;

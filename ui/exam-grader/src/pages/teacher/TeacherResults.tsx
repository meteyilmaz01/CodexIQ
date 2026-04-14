import { useState } from "react";
import { Card, Table, Tag, Input, Select, Typography, Button, Row, Col, Space, Dropdown, Tooltip, message } from "antd";
import { SearchOutlined, EyeOutlined, FilterOutlined, DownloadOutlined, ShareAltOutlined, FileExcelOutlined, FilePdfOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;

const mockResults = [
  { id: 1, studentName: "Ali Veli", studentNo: "2021001", exam: "Veri Yapıları - Final", course: "Veri Yapıları", date: "2026-03-28", score: 85, syntaxErrors: 2, logicErrors: 1, shared: true, overridden: false },
  { id: 2, studentName: "Ayşe Kaya", studentNo: "2021002", exam: "Veri Yapıları - Final", course: "Veri Yapıları", date: "2026-03-28", score: 92, syntaxErrors: 0, logicErrors: 1, shared: true, overridden: false },
  { id: 3, studentName: "Mehmet Demir", studentNo: "2021003", exam: "Veri Yapıları - Final", course: "Veri Yapıları", date: "2026-03-28", score: 58, syntaxErrors: 6, logicErrors: 4, shared: false, overridden: false },
  { id: 4, studentName: "Zeynep Yıldız", studentNo: "2021004", exam: "Algoritma - Quiz 4", course: "Algoritma", date: "2026-03-15", score: 72, syntaxErrors: 3, logicErrors: 2, shared: false, overridden: true },
  { id: 5, studentName: "Can Özkan", studentNo: "2021005", exam: "Algoritma - Quiz 4", course: "Algoritma", date: "2026-03-15", score: 45, syntaxErrors: 8, logicErrors: 5, shared: false, overridden: false },
  { id: 6, studentName: "Elif Arslan", studentNo: "2021006", exam: "OOP - Ödev 3", course: "OOP", date: "2026-03-05", score: 90, syntaxErrors: 1, logicErrors: 0, shared: true, overridden: false },
  { id: 7, studentName: "Burak Çelik", studentNo: "2021007", exam: "OOP - Ödev 3", course: "OOP", date: "2026-03-05", score: 78, syntaxErrors: 2, logicErrors: 2, shared: true, overridden: true },
  { id: 8, studentName: "Selin Koç", studentNo: "2021008", exam: "C Programlama - Vize", course: "C Programlama", date: "2026-02-10", score: 63, syntaxErrors: 5, logicErrors: 3, shared: false, overridden: false },
];

const TeacherResults = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const [examFilter, setExamFilter] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const colors = useThemeColors();
  const t = useT();

  const getScoreColor = (score: number) => { if (score >= 85) return "#52c41a"; if (score >= 70) return colors.accent; if (score >= 50) return "#faad14"; return "#ff4d4f"; };

  const filtered = mockResults.filter((r) => {
    const matchSearch = r.studentName.toLowerCase().includes(search.toLowerCase()) || r.studentNo.includes(search);
    const matchCourse = !courseFilter || r.course === courseFilter;
    const matchExam = !examFilter || r.exam === examFilter;
    return matchSearch && matchCourse && matchExam;
  });

  const coursesList = [...new Set(mockResults.map((r) => r.course))];
  const exams = [...new Set(mockResults.map((r) => r.exam))];

  const handleBulkShare = () => { message.success(`${selectedRows.length} ${t("resultsShared")}`); setSelectedRows([]); };
  const handleExport = (type: string) => { message.success(`${type.toUpperCase()} ${t("downloading")}...`); };

  const exportItems = {
    items: [
      { key: "excel", icon: <FileExcelOutlined />, label: `Excel ${t("download")}`, onClick: () => handleExport("excel") },
      { key: "pdf", icon: <FilePdfOutlined />, label: `PDF ${t("download")}`, onClick: () => handleExport("pdf") },
    ],
  };

  const columns = [
    { title: t("student"), key: "student", render: (_: unknown, record: (typeof mockResults)[0]) => (
      <div><Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{record.studentName}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{record.studentNo}</Text></div>
    )},
    { title: t("exam"), dataIndex: "exam", key: "exam", responsive: ["lg" as const], render: (text: string) => <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{text}</Text> },
    { title: t("score"), dataIndex: "score", key: "score", sorter: (a: any, b: any) => a.score - b.score, render: (score: number, record: any) => (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: getScoreColor(score), fontFamily: "'JetBrains Mono'" }}>{score}</span>
        {record.overridden && <Tooltip title={t("manualOverride")}><Tag color="orange" style={{ borderRadius: 4, fontSize: 10 }}>OVR</Tag></Tooltip>}
      </div>
    )},
    { title: t("errorsTitle"), key: "errors", responsive: ["md" as const], render: (_: unknown, record: any) => (
      <Space size={4}><Tag color={record.syntaxErrors === 0 ? "success" : "warning"}>{record.syntaxErrors}S</Tag><Tag color={record.logicErrors === 0 ? "success" : "error"}>{record.logicErrors}M</Tag></Space>
    )},
    { title: t("status"), key: "shared", responsive: ["md" as const], render: (_: unknown, record: any) =>
      record.shared ? <Tag icon={<CheckCircleOutlined />} color="success">{t("shared")}</Tag> : <Tag color="default">{t("notShared")}</Tag>
    },
    { title: "", key: "action", render: (_: unknown, record: any) => (
      <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/teacher/results/${record.id}`)} style={{ color: colors.accent }}>{t("detail")}</Button>
    )},
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("results")}</Title>
          <Text style={{ color: colors.textMuted }}>{t("manageResults")}</Text>
        </div>
        <Space wrap>
          {selectedRows.length > 0 && (
            <Button type="primary" icon={<ShareAltOutlined />} onClick={handleBulkShare} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none" }}>
              {selectedRows.length} {t("shareResults")}
            </Button>
          )}
          <Dropdown menu={exportItems}><Button icon={<DownloadOutlined />}>{t("export")}</Button></Dropdown>
        </Space>
      </div>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: "12px 16px" } }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Input placeholder={t("searchStudent")} prefix={<SearchOutlined style={{ color: colors.textDimmed }} />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 220 }} />
          <Select placeholder={t("course")} allowClear onChange={(val) => setCourseFilter(val)} options={coursesList.map((c) => ({ label: c, value: c }))} style={{ minWidth: 160 }} />
          <Select placeholder={t("exam")} allowClear onChange={(val) => setExamFilter(val)} options={exams.map((e) => ({ label: e, value: e }))} style={{ minWidth: 200 }} />
        </div>
      </Card>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table dataSource={filtered} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} rowSelection={{ selectedRowKeys: selectedRows, onChange: (keys) => setSelectedRows(keys as number[]) }} style={{ overflow: "auto" }} />
      </Card>
    </div>
  );
};

export default TeacherResults;
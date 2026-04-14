import { useState } from "react";
import { Card, Table, Tag, Input, Select, Typography, Button } from "antd";
import { SearchOutlined, EyeOutlined, FilterOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;

const mockResults = [
  { id: 1, name: "Veri Yapıları - Final", course: "Veri Yapıları", date: "2026-03-28", score: 85, syntaxErrors: 2, logicErrors: 1, status: "Yayınlandı" },
  { id: 2, name: "Algoritma Analizi - Vize", course: "Algoritma", date: "2026-03-15", score: 72, syntaxErrors: 4, logicErrors: 3, status: "Yayınlandı" },
  { id: 3, name: "OOP - Quiz 3", course: "OOP", date: "2026-03-05", score: 90, syntaxErrors: 1, logicErrors: 0, status: "Yayınlandı" },
  { id: 4, name: "Veritabanı - Ödev 2", course: "Veritabanı", date: "2026-02-20", score: 65, syntaxErrors: 5, logicErrors: 4, status: "Yayınlandı" },
  { id: 5, name: "C Programlama - Vize", course: "C Programlama", date: "2026-02-10", score: 58, syntaxErrors: 7, logicErrors: 5, status: "Yayınlandı" },
  { id: 6, name: "Veri Yapıları - Vize", course: "Veri Yapıları", date: "2026-01-25", score: 73, syntaxErrors: 3, logicErrors: 2, status: "Yayınlandı" },
];

const ExamResults = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const colors = useThemeColors();
  const t = useT();

  const getScoreColor = (score: number) => {
    if (score >= 85) return "#52c41a";
    if (score >= 70) return "#0ff";
    if (score >= 50) return "#faad14";
    return "#ff4d4f";
  };

  const filteredResults = mockResults.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchCourse = !courseFilter || r.course === courseFilter;
    return matchSearch && matchCourse;
  });

  const courses = [...new Set(mockResults.map((r) => r.course))];

  const columns = [
    {
      title: t("exam"),
      dataIndex: "name",
      key: "name",
      render: (text: string, record: (typeof mockResults)[0]) => (
        <div>
          <Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{text}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{record.date}</Text>
        </div>
      ),
    },
    {
      title: t("course"),
      dataIndex: "course",
      key: "course",
      responsive: ["md" as const],
      render: (text: string) => <Tag style={{ borderRadius: 6 }}>{text}</Tag>,
    },
    {
      title: t("score"),
      dataIndex: "score",
      key: "score",
      sorter: (a: (typeof mockResults)[0], b: (typeof mockResults)[0]) => a.score - b.score,
      render: (score: number) => (
        <span style={{ fontSize: 20, fontWeight: 700, color: getScoreColor(score), fontFamily: "'JetBrains Mono'" }}>
          {score}
        </span>
      ),
    },
    {
      title: t("syntaxError"),
      dataIndex: "syntaxErrors",
      key: "syntaxErrors",
      responsive: ["lg" as const],
      render: (count: number) => (
        <Tag color={count === 0 ? "success" : count <= 3 ? "warning" : "error"}>{count} {t("errors")}</Tag>
      ),
    },
    {
      title: t("logicError"),
      dataIndex: "logicErrors",
      key: "logicErrors",
      responsive: ["lg" as const],
      render: (count: number) => (
        <Tag color={count === 0 ? "success" : count <= 2 ? "warning" : "error"}>{count} {t("errors")}</Tag>
      ),
    },
    {
      title: "",
      key: "action",
      render: (_: unknown, record: (typeof mockResults)[0]) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/student/results/${record.id}`)}
          style={{ color: colors.accent }}
        >
          {t("detail")}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>
          {t("examResults")}
        </Title>
        <Text style={{ color: colors.textMuted }}>{t("examResultsSubtitle")}</Text>
      </div>

      {/* Filters */}
      <Card
        style={{
          background: colors.cardBg,
          border: colors.borderPrimary,
          borderRadius: 12,
          marginBottom: 16,
        }}
        styles={{ body: { padding: "12px 16px" } }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Input
            placeholder={t("searchExam")}
            prefix={<SearchOutlined style={{ color: colors.textDimmed }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280, background: colors.inputBg, borderColor: colors.textDimmed }}
          />
          <Select
            placeholder={<><FilterOutlined /> {t("filterCourse")}</>}
            allowClear
            onChange={(val) => setCourseFilter(val)}
            style={{ minWidth: 180 }}
            options={courses.map((c) => ({ label: c, value: c }))}
          />
        </div>
      </Card>

      {/* Results Table */}
      <Card
        style={{
          background: colors.cardBg,
          border: colors.borderPrimary,
          borderRadius: 12,
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={filteredResults}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ overflow: "auto" }}
        />
      </Card>
    </div>
  );
};

export default ExamResults;
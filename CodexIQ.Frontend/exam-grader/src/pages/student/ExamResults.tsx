import { useState, useEffect } from "react";
import { Card, Table, Tag, Input, Select, Typography, Button, Spin } from "antd";
import { SearchOutlined, EyeOutlined, FilterOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { studentApi } from "../../api/studentApi";

const { Title, Text } = Typography;

const ExamResults = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const colors = useThemeColors();
  const t = useT();

  const fetchResults = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await studentApi.getResults({
        search: search || undefined,
        course: courseFilter || undefined,
        page,
        pageSize,
      });
      const data = res.data || res;
      if (Array.isArray(data)) {
        setResults(data);
        setPagination({ current: page, pageSize, total: data.length });
      } else {
        setResults(data.items || data.results || []);
        setPagination({ current: page, pageSize, total: data.totalCount || data.total || 0 });
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResults(); }, []);

  const handleSearch = () => { fetchResults(1, pagination.pageSize); };

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(1, pagination.pageSize), 500);
    return () => clearTimeout(timer);
  }, [search, courseFilter]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "#52c41a";
    if (score >= 70) return "#0ff";
    if (score >= 50) return "#faad14";
    return "#ff4d4f";
  };

  const courses = [...new Set(results.map((r: any) => r.course || r.courseName).filter(Boolean))];

  const columns = [
    {
      title: t("exam"), dataIndex: "name", key: "name",
      render: (text: string, record: any) => (
        <div>
          <Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{text || record.examName}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{record.date}</Text>
        </div>
      ),
    },
    {
      title: t("course"), key: "course", responsive: ["md" as const],
      render: (_: unknown, record: any) => <Tag style={{ borderRadius: 6 }}>{record.course || record.courseName}</Tag>,
    },
    {
      title: t("score"), key: "score",
      sorter: (a: any, b: any) => (a.score || a.totalScore || 0) - (b.score || b.totalScore || 0),
      render: (_: unknown, record: any) => (
        <span style={{ fontSize: 20, fontWeight: 700, color: getScoreColor(record.score || record.totalScore || 0), fontFamily: "'JetBrains Mono'" }}>
          {record.score || record.totalScore || 0}
        </span>
      ),
    },
    {
      title: t("syntaxError"), key: "syntaxErrors", responsive: ["lg" as const],
      render: (_: unknown, record: any) => {
        const count = record.syntaxErrors ?? record.syntaxErrorCount ?? 0;
        return <Tag color={count === 0 ? "success" : count <= 3 ? "warning" : "error"}>{count} {t("errors")}</Tag>;
      },
    },
    {
      title: t("logicError"), key: "logicErrors", responsive: ["lg" as const],
      render: (_: unknown, record: any) => {
        const count = record.logicErrors ?? record.logicErrorCount ?? 0;
        return <Tag color={count === 0 ? "success" : count <= 2 ? "warning" : "error"}>{count} {t("errors")}</Tag>;
      },
    },
    {
      title: "", key: "action",
      render: (_: unknown, record: any) => (
        <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/student/results/${record.id}`)} style={{ color: colors.accent }}>
          {t("detail")}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("examResults")}</Title>
        <Text style={{ color: colors.textMuted }}>{t("examResultsSubtitle")}</Text>
      </div>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: "12px 16px" } }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Input
            placeholder={t("searchExam")} prefix={<SearchOutlined style={{ color: colors.textDimmed }} />}
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280, background: colors.inputBg, borderColor: colors.textDimmed }}
          />
          <Select
            placeholder={<><FilterOutlined /> {t("filterCourse")}</>} allowClear
            onChange={(val) => setCourseFilter(val)} style={{ minWidth: 180 }}
            options={courses.map((c) => ({ label: c, value: c }))}
          />
        </div>
      </Card>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={results} columns={columns} rowKey="id" loading={loading}
          pagination={{
            current: pagination.current, pageSize: pagination.pageSize, total: pagination.total,
            onChange: (page, pageSize) => fetchResults(page, pageSize),
          }}
          style={{ overflow: "auto" }}
        />
      </Card>
    </div>
  );
};

export default ExamResults;

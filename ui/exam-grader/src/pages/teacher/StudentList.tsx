import { useState } from "react";
import { Card, Table, Tag, Input, Select, Typography, Avatar, Progress } from "antd";
import { SearchOutlined, FilterOutlined, MessageOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;

const mockStudents = [
  { id: 1, name: "Ali Veli", no: "2021001", class: "Bilgisayar Müh. 3-A", average: 85, exams: 8, lastActive: "2026-04-06" },
  { id: 2, name: "Ayşe Kaya", no: "2021002", class: "Bilgisayar Müh. 3-A", average: 92, exams: 8, lastActive: "2026-04-05" },
  { id: 3, name: "Mehmet Demir", no: "2021003", class: "Bilgisayar Müh. 3-A", average: 58, exams: 7, lastActive: "2026-04-03" },
  { id: 4, name: "Zeynep Yıldız", no: "2021004", class: "Bilgisayar Müh. 2-A", average: 72, exams: 6, lastActive: "2026-04-06" },
  { id: 5, name: "Can Özkan", no: "2021005", class: "Bilgisayar Müh. 2-A", average: 45, exams: 5, lastActive: "2026-03-28" },
  { id: 6, name: "Elif Arslan", no: "2021006", class: "Bilgisayar Müh. 1-A", average: 90, exams: 4, lastActive: "2026-04-05" },
  { id: 7, name: "Burak Çelik", no: "2021007", class: "Bilgisayar Müh. 1-A", average: 78, exams: 4, lastActive: "2026-04-04" },
  { id: 8, name: "Selin Koç", no: "2021008", class: "Bilgisayar Müh. 1-B", average: 63, exams: 3, lastActive: "2026-04-01" },
];

const StudentListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const colors = useThemeColors();
  const t = useT();

  const getScoreColor = (s: number) => { if (s >= 85) return "#52c41a"; if (s >= 70) return colors.accent; if (s >= 50) return "#faad14"; return "#ff4d4f"; };

  const classList = [...new Set(mockStudents.map((s) => s.class))];

  const filtered = mockStudents.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.no.includes(search);
    const matchClass = !classFilter || s.class === classFilter;
    return matchSearch && matchClass;
  });

  const columns = [
    { title: t("student"), key: "student", render: (_: unknown, r: (typeof mockStudents)[0]) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar style={{ background: `${getScoreColor(r.average)}20`, color: getScoreColor(r.average) }} size={36}>
          {r.name.split(" ").map((n) => n[0]).join("")}
        </Avatar>
        <div>
          <Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{r.name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{r.no}</Text>
        </div>
      </div>
    )},
    { title: t("class"), dataIndex: "class", key: "class", responsive: ["md" as const], render: (text: string) => <Tag style={{ borderRadius: 6 }}>{text}</Tag> },
    { title: t("average"), dataIndex: "average", key: "average", sorter: (a: any, b: any) => a.average - b.average, render: (avg: number) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 120 }}>
        <Progress percent={avg} size="small" showInfo={false} strokeColor={getScoreColor(avg)} trailColor={colors.dividerColor} style={{ flex: 1 }} />
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: getScoreColor(avg), fontSize: 14 }}>{avg}</span>
      </div>
    )},
    { title: t("exam"), dataIndex: "exams", key: "exams", responsive: ["lg" as const], render: (count: number) => <Text style={{ color: colors.textSubtle }}>{count} {t("exams")}</Text> },
    { title: "", key: "action", render: (_: unknown, r: any) => (
      <MessageOutlined onClick={() => navigate("/teacher/messages")} style={{ color: colors.accent, cursor: "pointer", fontSize: 16 }} />
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("students")}</Title>
        <Text style={{ color: colors.textMuted }}>{t("studentsSubtitle")}</Text>
      </div>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: "12px 16px" } }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Input placeholder={t("searchStudent")} prefix={<SearchOutlined style={{ color: colors.textDimmed }} />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
          <Select placeholder={t("class")} allowClear onChange={(v) => setClassFilter(v)} options={classList.map((c) => ({ label: c, value: c }))} style={{ minWidth: 200 }} />
        </div>
      </Card>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table dataSource={filtered} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
};

export default StudentListPage;
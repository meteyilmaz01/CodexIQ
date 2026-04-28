import { useState, useEffect } from "react";
import { Card, Table, Tag, Input, Select, Typography, Avatar, Progress, Tooltip, Button, message } from "antd";
import { SearchOutlined, MessageOutlined, CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { teacherApi } from "../../api/teacherApi";

const { Title, Text } = Typography;

const StudentListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colors = useThemeColors();
  const t = useT();

  const fetchStudents = async (classId?: string) => {
    setLoading(true);
    try {
      const res = await teacherApi.getStudents(classId || undefined);
      const data = res.data || res;
      setStudents(Array.isArray(data) ? data : data.items || data.results || []);
    } catch { setStudents([]); }
    finally { setLoading(false); }
  };

  const fetchClasses = async () => {
    try {
      const res = await teacherApi.getClasses();
      const data = res.data || res;
      setClasses(Array.isArray(data) ? data : data.items || []);
    } catch { setClasses([]); }
  };

  const handleRegenerateCode = async (classId: string) => {
    try {
      const res = await teacherApi.regenerateJoinCode(classId);
      const newCode = res.joinCode ?? res;
      setClasses((prev) => prev.map((c) => c.id === classId ? { ...c, joinCode: newCode } : c));
      message.success("Katılım kodu yenilendi");
    } catch { message.error("Kod yenilenirken hata oluştu"); }
  };

  useEffect(() => { fetchStudents(); fetchClasses(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(classFilter || undefined), 300);
    return () => clearTimeout(timer);
  }, [classFilter]);

  const getScoreColor = (s: number) => { if (s >= 85) return "#52c41a"; if (s >= 70) return colors.accent; if (s >= 50) return "#faad14"; return "#ff4d4f"; };

  const filtered = students.filter((s: any) => {
    const name = s.name || s.fullName || `${s.firstName || ""} ${s.lastName || ""}`;
    const no = s.no || s.studentNo || "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || no.includes(search);
    return matchSearch;
  });

  const columns = [
    { title: t("student"), key: "student", render: (_: unknown, r: any) => {
      const name = r.name || r.fullName || `${r.firstName || ""} ${r.lastName || ""}`;
      const no = r.no || r.studentNo || "";
      const avg = r.average ?? r.examAverage ?? 0;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar style={{ background: `${getScoreColor(avg)}20`, color: getScoreColor(avg) }} size={36}>
            {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </Avatar>
          <div>
            <Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{name}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{no}</Text>
          </div>
        </div>
      );
    }},
    { title: t("class"), key: "class", responsive: ["md" as const], render: (_: unknown, r: any) => <Tag style={{ borderRadius: 6 }}>{r.class || r.className || "-"}</Tag> },
    { title: t("average"), key: "average", sorter: (a: any, b: any) => (a.average ?? a.examAverage ?? 0) - (b.average ?? b.examAverage ?? 0), render: (_: unknown, r: any) => {
      const avg = r.average ?? r.examAverage ?? 0;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 120 }}>
          <Progress percent={avg} size="small" showInfo={false} strokeColor={getScoreColor(avg)} trailColor={colors.dividerColor} style={{ flex: 1 }} />
          <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: getScoreColor(avg), fontSize: 14 }}>{avg}</span>
        </div>
      );
    }},
    { title: t("exam"), key: "exams", responsive: ["lg" as const], render: (_: unknown, r: any) => <Text style={{ color: colors.textSubtle }}>{r.exams ?? r.examCount ?? r.totalExams ?? 0} {t("exams")}</Text> },
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

      {/* Class join codes */}
      {classes.length > 0 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          {classes.map((c: any) => (
            <Card key={c.id} size="small" style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 10, minWidth: 220 }} styles={{ body: { padding: "10px 14px" } }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, display: "block" }}>{c.name}</Text>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 800, color: colors.accent, letterSpacing: 4 }}>
                  {c.joinCode || "------"}
                </span>
                <Tooltip title="Kodu kopyala">
                  <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(c.joinCode || ""); message.success("Kod kopyalandı"); }} style={{ color: colors.textMuted }} />
                </Tooltip>
                <Tooltip title="Yeni kod üret">
                  <Button type="text" size="small" icon={<ReloadOutlined />} onClick={() => handleRegenerateCode(c.id)} style={{ color: colors.textMuted }} />
                </Tooltip>
              </div>
              <Text style={{ color: colors.textDimmed, fontSize: 11 }}>Katılım kodu • {c.studentCount ?? 0} öğrenci</Text>
            </Card>
          ))}
        </div>
      )}

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: "12px 16px" } }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Input placeholder={t("searchStudent")} prefix={<SearchOutlined style={{ color: colors.textDimmed }} />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
          <Select placeholder={t("class")} allowClear onChange={(v) => setClassFilter(v)} options={classes.map((c: any) => ({ value: c.id, label: c.name }))} style={{ minWidth: 200 }} />
        </div>
      </Card>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table dataSource={filtered} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
};

export default StudentListPage;
import { useState } from "react";
import { Card, Table, Tag, Typography, Input, Select } from "antd";
import { SearchOutlined, InfoCircleOutlined, WarningOutlined, CloseCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;

const mockLogs = [
  { id: 1, timestamp: "2026-04-07 10:32:15", level: "INFO", source: "AuthService", message: "User login: ahmet@univ.edu.tr", ip: "192.168.1.45" },
  { id: 2, timestamp: "2026-04-07 10:30:02", level: "INFO", source: "ExamService", message: "45 exam papers uploaded by teacher_id=2", ip: "192.168.1.45" },
  { id: 3, timestamp: "2026-04-07 10:29:58", level: "INFO", source: "QueueService", message: "Job enqueued: exam_eval_batch_47", ip: "10.0.0.1" },
  { id: 4, timestamp: "2026-04-07 10:25:11", level: "WARNING", source: "GeminiAPI", message: "Rate limit approaching: 85% of quota used", ip: "10.0.0.1" },
  { id: 5, timestamp: "2026-04-07 10:20:45", level: "ERROR", source: "LlamaAPI", message: "Connection timeout after 30s - retrying (attempt 2/3)", ip: "10.0.0.1" },
  { id: 6, timestamp: "2026-04-07 10:20:30", level: "ERROR", source: "LlamaAPI", message: "Connection timeout after 30s - retrying (attempt 1/3)", ip: "10.0.0.1" },
  { id: 7, timestamp: "2026-04-07 10:18:00", level: "INFO", source: "EvalWorker", message: "Evaluation completed: student_id=4, score=72", ip: "10.0.0.2" },
  { id: 8, timestamp: "2026-04-07 10:15:22", level: "INFO", source: "AuthService", message: "User login: ali@mail.com", ip: "192.168.1.100" },
  { id: 9, timestamp: "2026-04-07 10:10:05", level: "WARNING", source: "QueueService", message: "Queue depth exceeds threshold: 15 pending jobs", ip: "10.0.0.1" },
  { id: 10, timestamp: "2026-04-07 09:55:00", level: "INFO", source: "SystemService", message: "Daily backup completed successfully", ip: "10.0.0.1" },
  { id: 11, timestamp: "2026-04-07 09:30:12", level: "ERROR", source: "DeepSeekAPI", message: "Invalid response format - fallback to Gemini", ip: "10.0.0.1" },
  { id: 12, timestamp: "2026-04-07 09:00:00", level: "INFO", source: "SystemService", message: "System startup completed - all services healthy", ip: "10.0.0.1" },
];

const SystemLogs = () => {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const colors = useThemeColors();
  const t = useT();

  const filtered = mockLogs.filter((l) => {
    const matchSearch = l.message.toLowerCase().includes(search.toLowerCase()) || l.source.toLowerCase().includes(search.toLowerCase());
    const matchLevel = !levelFilter || l.level === levelFilter;
    const matchSource = !sourceFilter || l.source === sourceFilter;
    return matchSearch && matchLevel && matchSource;
  });

  const sources = [...new Set(mockLogs.map((l) => l.source))];

  const getLevelConfig = (level: string) => {
    switch (level) {
      case "INFO": return { color: "blue", icon: <InfoCircleOutlined /> };
      case "WARNING": return { color: "orange", icon: <WarningOutlined /> };
      case "ERROR": return { color: "red", icon: <CloseCircleOutlined /> };
      default: return { color: "default", icon: <CheckCircleOutlined /> };
    }
  };

  const columns = [
    { title: t("time"), dataIndex: "timestamp", key: "timestamp", width: 170, render: (ts: string) => <Text style={{ color: colors.textMuted, fontSize: 12, fontFamily: "'JetBrains Mono'" }}>{ts}</Text> },
    { title: t("level"), dataIndex: "level", key: "level", width: 100, render: (l: string) => { const c = getLevelConfig(l); return <Tag icon={c.icon} color={c.color} style={{ borderRadius: 4 }}>{l}</Tag>; } },
    { title: t("source"), dataIndex: "source", key: "source", width: 130, responsive: ["md" as const], render: (s: string) => <Tag style={{ borderRadius: 6, fontFamily: "'JetBrains Mono'", fontSize: 11 }}>{s}</Tag> },
    { title: t("messageLabel"), dataIndex: "message", key: "message", render: (m: string) => <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: "'JetBrains Mono'" }}>{m}</Text> },
    { title: "IP", dataIndex: "ip", key: "ip", width: 120, responsive: ["lg" as const], render: (ip: string) => <Text style={{ color: colors.textDimmed, fontSize: 12, fontFamily: "'JetBrains Mono'" }}>{ip}</Text> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("systemLogs")}</Title>
        <Text style={{ color: colors.textMuted }}>{filtered.length} {t("logRecords")}</Text>
      </div>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: "12px 16px" } }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Input placeholder={t("searchLog")} prefix={<SearchOutlined style={{ color: colors.textDimmed }} />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
          <Select placeholder={t("level")} allowClear onChange={(v) => setLevelFilter(v)} options={[{ label: "INFO", value: "INFO" }, { label: "WARNING", value: "WARNING" }, { label: "ERROR", value: "ERROR" }]} style={{ minWidth: 120 }} />
          <Select placeholder={t("source")} allowClear onChange={(v) => setSourceFilter(v)} options={sources.map((s) => ({ label: s, value: s }))} style={{ minWidth: 160 }} />
        </div>
      </Card>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table dataSource={filtered} columns={columns} rowKey="id" pagination={{ pageSize: 15 }} size="small" />
      </Card>
    </div>
  );
};

export default SystemLogs;
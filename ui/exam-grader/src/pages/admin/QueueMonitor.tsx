import { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Tag, Table, Button, Progress, Space, Badge } from "antd";
import { SyncOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ReloadOutlined, PauseCircleOutlined, PlayCircleOutlined, DeleteOutlined, CloudServerOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;

interface QueueJob { id: string; examName: string; teacher: string; papers: number; status: "completed" | "processing" | "pending" | "failed"; progress: number; startedAt: string; model: string; }

const initialJobs: QueueJob[] = [
  { id: "JOB-0047", examName: "Veri Yapıları - Final", teacher: "Prof. Dr. Ahmet Yılmaz", papers: 45, status: "completed", progress: 100, startedAt: "2026-04-07 10:30", model: "Ensemble" },
  { id: "JOB-0048", examName: "Algoritma - Quiz 4", teacher: "Dr. Elif Kaya", papers: 42, status: "processing", progress: 67, startedAt: "2026-04-07 10:45", model: "Gemini → Llama" },
  { id: "JOB-0049", examName: "OOP - Ödev 3", teacher: "Doç. Dr. Mehmet Demir", papers: 38, status: "pending", progress: 0, startedAt: "-", model: "-" },
  { id: "JOB-0046", examName: "C Programlama - Vize", teacher: "Dr. Ayşe Çelik", papers: 55, status: "completed", progress: 100, startedAt: "2026-04-07 09:15", model: "Ensemble" },
  { id: "JOB-0045", examName: "Veritabanı - Ödev 2", teacher: "Prof. Dr. Can Özkan", papers: 40, status: "failed", progress: 42, startedAt: "2026-04-07 08:30", model: "DeepSeek (timeout)" },
  { id: "JOB-0044", examName: "Algoritma - Quiz 3", teacher: "Dr. Elif Kaya", papers: 42, status: "completed", progress: 100, startedAt: "2026-04-06 14:00", model: "Ensemble" },
];

const QueueMonitor = () => {
  const [jobs, setJobs] = useState(initialJobs);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const colors = useThemeColors();
  const t = useT();

  const queueStats = [
    { label: t("completed"), count: 153, color: "#52c41a", icon: <CheckCircleOutlined /> },
    { label: t("processing"), count: 1, color: "#1890ff", icon: <SyncOutlined spin /> },
    { label: t("inQueue"), count: 1, color: "#faad14", icon: <ClockCircleOutlined /> },
    { label: t("failed"), count: 1, color: "#ff4d4f", icon: <CloseCircleOutlined /> },
  ];

  const workerStats = [
    { name: "Worker-1", status: "active", currentJob: "JOB-0048", cpu: 72, memory: 45 },
    { name: "Worker-2", status: "idle", currentJob: "-", cpu: 5, memory: 22 },
    { name: "Worker-3", status: "active", currentJob: "JOB-0048", cpu: 68, memory: 41 },
  ];

  useEffect(() => { if (!autoRefresh) return; const interval = setInterval(() => { setJobs((prev) => prev.map((j) => j.status === "processing" && j.progress < 100 ? { ...j, progress: Math.min(j.progress + Math.floor(Math.random() * 5), 99) } : j)); }, 3000); return () => clearInterval(interval); }, [autoRefresh]);

  const handleRetry = (id: string) => { setJobs(jobs.map((j) => (j.id === id ? { ...j, status: "pending", progress: 0 } : j))); };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed": return { color: "success", icon: <CheckCircleOutlined />, text: t("completed") };
      case "processing": return { color: "processing", icon: <SyncOutlined spin />, text: t("processing") };
      case "pending": return { color: "warning", icon: <ClockCircleOutlined />, text: t("inQueue") };
      case "failed": return { color: "error", icon: <CloseCircleOutlined />, text: t("failed") };
      default: return { color: "default", icon: null, text: status };
    }
  };

  const columns = [
    { title: "Job ID", dataIndex: "id", key: "id", width: 100, render: (id: string) => <Text style={{ color: colors.accent, fontFamily: "'JetBrains Mono'", fontSize: 12 }}>{id}</Text> },
    { title: t("exam"), key: "exam", render: (_: unknown, r: QueueJob) => <div><Text style={{ color: colors.textSecondary, fontSize: 13, display: "block" }}>{r.examName}</Text><Text style={{ color: colors.textMuted, fontSize: 11 }}>{r.teacher} • {r.papers} {t("papers")}</Text></div> },
    { title: t("status"), dataIndex: "status", key: "status", render: (s: string) => { const c = getStatusConfig(s); return <Tag icon={c.icon} color={c.color} style={{ borderRadius: 4 }}>{c.text}</Tag>; } },
    { title: t("progress"), key: "progress", responsive: ["md" as const], render: (_: unknown, r: QueueJob) => <div style={{ minWidth: 120 }}><Progress percent={r.progress} size="small" showInfo={false} strokeColor={r.status === "failed" ? "#ff4d4f" : r.status === "completed" ? "#52c41a" : "#1890ff"} trailColor={colors.dividerColor} /><Text style={{ color: colors.textMuted, fontSize: 11 }}>{r.progress}%</Text></div> },
    { title: "Model", dataIndex: "model", key: "model", responsive: ["lg" as const], render: (m: string) => <Text style={{ color: colors.textSubtle, fontSize: 12, fontFamily: "'JetBrains Mono'" }}>{m}</Text> },
    { title: t("start"), dataIndex: "startedAt", key: "startedAt", responsive: ["lg" as const], render: (ts: string) => <Text style={{ color: colors.textMuted, fontSize: 12 }}>{ts}</Text> },
    { title: "", key: "actions", render: (_: unknown, r: QueueJob) => <Space>{r.status === "failed" && <Button type="text" size="small" icon={<ReloadOutlined />} onClick={() => handleRetry(r.id)} style={{ color: "#faad14" }}>{t("retry")}</Button>}</Space> },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}><CloudServerOutlined style={{ marginRight: 8 }} />{t("queueMonitoring")}</Title>
          <Text style={{ color: colors.textMuted }}>{t("evaluationQueueStatus")}</Text>
        </div>
        <Space>
          <Button icon={autoRefresh ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? t("stop") : t("startBtn")}
          </Button>
          <Badge dot={autoRefresh} color="#52c41a"><Tag color={autoRefresh ? "success" : "default"} style={{ borderRadius: 6 }}>{autoRefresh ? t("live") : t("stopped")}</Tag></Badge>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {queueStats.map((q, i) => (
          <Col xs={12} md={6} key={i}>
            <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 16, textAlign: "center" as const } }}>
              <div style={{ fontSize: 20, color: q.color, marginBottom: 4 }}>{q.icon}</div>
              <span style={{ fontSize: 28, fontWeight: 700, color: q.color, fontFamily: "'JetBrains Mono'", display: "block" }}>{q.count}</span>
              <Text style={{ color: colors.textSubtle, fontSize: 12 }}>{q.label}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("jobQueue")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
            <Table dataSource={jobs} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("workerStatus")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}>
            {workerStats.map((w, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: i < workerStats.length - 1 ? colors.listItemBorder : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: w.status === "active" ? "#52c41a" : colors.textDimmed }} />
                    <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: "'JetBrains Mono'" }}>{w.name}</Text>
                  </div>
                  <Tag color={w.status === "active" ? "success" : "default"} style={{ borderRadius: 4, fontSize: 10 }}>{w.status === "active" ? t("active") : t("idle")}</Tag>
                </div>
                {w.status === "active" && <Text style={{ color: colors.textMuted, fontSize: 11, display: "block", marginBottom: 6 }}>{w.currentJob}</Text>}
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}><Text style={{ color: colors.textDimmed, fontSize: 10, display: "block" }}>CPU</Text><Progress percent={w.cpu} size="small" showInfo={false} strokeColor={w.cpu > 80 ? "#ff4d4f" : "#1890ff"} trailColor={colors.dividerColor} /></div>
                  <div style={{ flex: 1 }}><Text style={{ color: colors.textDimmed, fontSize: 10, display: "block" }}>RAM</Text><Progress percent={w.memory} size="small" showInfo={false} strokeColor={w.memory > 80 ? "#ff4d4f" : "#52c41a"} trailColor={colors.dividerColor} /></div>
                </div>
              </div>
            ))}
          </Card>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("queueInfo")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginTop: 16 }}>
            {[
              { label: "Exchange", value: "exam_eval_exchange" }, { label: "Queue", value: "exam_eval_queue" },
              { label: "Consumers", value: "3" }, { label: "Prefetch", value: "1" },
              { label: "Ack Mode", value: "Manual" }, { label: t("avgProcessing"), value: "~45 sn/" + t("paper") },
            ].map((info, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 5 ? colors.listItemBorder : "none" }}>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{info.label}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: "'JetBrains Mono'" }}>{info.value}</Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default QueueMonitor;
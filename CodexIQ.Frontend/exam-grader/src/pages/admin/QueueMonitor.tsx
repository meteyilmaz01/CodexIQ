import { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Tag, Table, Button, Progress, Space, Badge, Spin } from "antd";
import { SyncOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ReloadOutlined, PauseCircleOutlined, PlayCircleOutlined, CloudServerOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { adminApi } from "../../api/adminApi";

const { Title, Text } = Typography;

const QueueMonitor = () => {
  const [data, setData] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const colors = useThemeColors();
  const t = useT();

  const fetchQueue = async () => {
    try {
      const res = await adminApi.getQueue();
      const d = res.data || res;
      setData(d);
      const jobList = d.jobs || d.items || (Array.isArray(d) ? d : []);
      setJobs(jobList);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQueue(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => { fetchQueue(); }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;

  const queueStats = [
    { label: t("completed"), count: data?.completed ?? data?.completedCount ?? 0, color: "#52c41a", icon: <CheckCircleOutlined /> },
    { label: t("processing"), count: data?.processing ?? data?.processingCount ?? 0, color: "#1890ff", icon: <SyncOutlined spin /> },
    { label: t("inQueue"), count: data?.pending ?? data?.pendingCount ?? 0, color: "#faad14", icon: <ClockCircleOutlined /> },
    { label: t("failed"), count: data?.failed ?? data?.failedCount ?? 0, color: "#ff4d4f", icon: <CloseCircleOutlined /> },
  ];

  const workerStats = data?.workers || data?.workerStats || [];

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
    { title: "Job ID", key: "id", width: 100, render: (_: unknown, r: any) => <Text style={{ color: colors.accent, fontFamily: "'JetBrains Mono'", fontSize: 12 }}>{r.id || r.jobId}</Text> },
    { title: t("exam"), key: "exam", render: (_: unknown, r: any) => <div><Text style={{ color: colors.textSecondary, fontSize: 13, display: "block" }}>{r.examName}</Text><Text style={{ color: colors.textMuted, fontSize: 11 }}>{r.teacher || r.teacherName} • {r.papers || r.paperCount || 0} {t("papers")}</Text></div> },
    { title: t("status"), dataIndex: "status", key: "status", render: (s: string) => { const c = getStatusConfig(s); return <Tag icon={c.icon} color={c.color} style={{ borderRadius: 4 }}>{c.text}</Tag>; } },
    { title: t("progress"), key: "progress", responsive: ["md" as const], render: (_: unknown, r: any) => <div style={{ minWidth: 120 }}><Progress percent={r.progress || 0} size="small" showInfo={false} strokeColor={r.status === "failed" ? "#ff4d4f" : r.status === "completed" ? "#52c41a" : "#1890ff"} trailColor={colors.dividerColor} /><Text style={{ color: colors.textMuted, fontSize: 11 }}>{r.progress || 0}%</Text></div> },
    { title: "Model", key: "model", responsive: ["lg" as const], render: (_: unknown, r: any) => <Text style={{ color: colors.textSubtle, fontSize: 12, fontFamily: "'JetBrains Mono'" }}>{r.model || "-"}</Text> },
    { title: t("start"), key: "startedAt", responsive: ["lg" as const], render: (_: unknown, r: any) => <Text style={{ color: colors.textMuted, fontSize: 12 }}>{r.startedAt || r.createdAt || "-"}</Text> },
    { title: "", key: "actions", render: (_: unknown, r: any) => <Space>{r.status === "failed" && <Button type="text" size="small" icon={<ReloadOutlined />} style={{ color: "#faad14" }}>{t("retry")}</Button>}</Space> },
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
            <Table dataSource={jobs} columns={columns} rowKey={(r) => r.id || r.jobId} pagination={{ pageSize: 10 }} size="small" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("workerStatus")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}>
            {(Array.isArray(workerStats) ? workerStats : []).map((w: any, i: number) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: i < workerStats.length - 1 ? colors.listItemBorder : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: w.status === "active" ? "#52c41a" : colors.textDimmed }} />
                    <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: "'JetBrains Mono'" }}>{w.name}</Text>
                  </div>
                  <Tag color={w.status === "active" ? "success" : "default"} style={{ borderRadius: 4, fontSize: 10 }}>{w.status === "active" ? t("active") : t("idle")}</Tag>
                </div>
                {w.status === "active" && w.currentJob && <Text style={{ color: colors.textMuted, fontSize: 11, display: "block", marginBottom: 6 }}>{w.currentJob}</Text>}
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}><Text style={{ color: colors.textDimmed, fontSize: 10, display: "block" }}>CPU</Text><Progress percent={w.cpu || 0} size="small" showInfo={false} strokeColor={(w.cpu || 0) > 80 ? "#ff4d4f" : "#1890ff"} trailColor={colors.dividerColor} /></div>
                  <div style={{ flex: 1 }}><Text style={{ color: colors.textDimmed, fontSize: 10, display: "block" }}>RAM</Text><Progress percent={w.memory || 0} size="small" showInfo={false} strokeColor={(w.memory || 0) > 80 ? "#ff4d4f" : "#52c41a"} trailColor={colors.dividerColor} /></div>
                </div>
              </div>
            ))}
            {workerStats.length === 0 && <Text style={{ color: colors.textMuted }}>{t("noData") || "Veri yok"}</Text>}
          </Card>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("queueInfo")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginTop: 16 }}>
            {[
              { label: "Exchange", value: data?.exchange || "exam_eval_exchange" },
              { label: "Queue", value: data?.queue || "exam_eval_queue" },
              { label: "Consumers", value: data?.consumers ?? "-" },
              { label: "Prefetch", value: data?.prefetch ?? "-" },
              { label: "Ack Mode", value: data?.ackMode || "-" },
              { label: t("avgProcessing"), value: data?.avgProcessingTime || "-" },
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
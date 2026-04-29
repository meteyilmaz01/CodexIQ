import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Tag, Table, Progress, Spin } from "antd";
import { ArrowDownOutlined, WarningOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { adminApi } from "../../api/adminApi";

const { Title, Text } = Typography;

const ApiCosts = () => {
  const colors = useThemeColors();
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApi.getApiCosts();
        setData(res.data || res);
      } catch { /* handled */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;

  const modelStats = data?.models || data?.modelStats || [];
  const dailyHistory = data?.dailyHistory || data?.history || [];
  const totalMonthly = data?.totalMonthlyCost ?? modelStats.reduce((s: number, m: any) => s + (m.monthlyCost || 0), 0);
  const totalDaily = data?.totalDailyCost ?? modelStats.reduce((s: number, m: any) => s + (m.dailyCost || 0), 0);
  const totalLimit = data?.totalLimit ?? modelStats.reduce((s: number, m: any) => s + (m.limit || 0), 0);

  const historyColumns = [
    { title: t("date"), dataIndex: "date", key: "date", render: (d: string) => <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: "'JetBrains Mono'" }}>{d}</Text> },
    { title: "Gemini", dataIndex: "gemini", key: "gemini", render: (v: number) => <Text style={{ color: "#1890ff", fontFamily: "'JetBrains Mono'", fontSize: 13 }}>${(v || 0).toFixed(2)}</Text> },
    { title: "Llama", dataIndex: "llama", key: "llama", responsive: ["md" as const], render: (v: number) => <Text style={{ color: "#52c41a", fontFamily: "'JetBrains Mono'", fontSize: 13 }}>${(v || 0).toFixed(2)}</Text> },
    { title: "DeepSeek", dataIndex: "deepseek", key: "deepseek", responsive: ["md" as const], render: (v: number) => <Text style={{ color: "#722ed1", fontFamily: "'JetBrains Mono'", fontSize: 13 }}>${(v || 0).toFixed(2)}</Text> },
    { title: "Vision", dataIndex: "vision", key: "vision", responsive: ["lg" as const], render: (v: number) => <Text style={{ color: colors.accent, fontFamily: "'JetBrains Mono'", fontSize: 13 }}>${(v || 0).toFixed(2)}</Text> },
    { title: t("total"), dataIndex: "total", key: "total", render: (v: number) => <Text style={{ color: "#faad14", fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 600 }}>${(v || 0).toFixed(2)}</Text> },
  ];

  const modelColors = ["#1890ff", "#52c41a", "#722ed1", "#0ff", "#faad14", "#ff4d4f"];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("apiCostTracking")}</Title>
        <Text style={{ color: colors.textMuted }}>{t("modelBasedCostAnalysis")}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: t("today"), value: `$${totalDaily.toFixed(2)}`, color: "#faad14", extra: data?.costTrend ? <><ArrowDownOutlined style={{ color: "#52c41a", fontSize: 11 }} /> <Text style={{ color: "#52c41a", fontSize: 12 }}>{data.costTrend}</Text></> : null },
          { label: t("thisMonth"), value: `$${totalMonthly.toFixed(2)}`, color: "#ff4d4f", extra: totalLimit > 0 ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>/ ${totalLimit} limit</Text> : null },
          { label: t("dailyAvg"), value: `$${dailyHistory.length > 0 ? (totalMonthly / dailyHistory.length).toFixed(2) : totalDaily.toFixed(2)}`, color: colors.accent, extra: null },
          { label: t("budgetUsage"), value: totalLimit > 0 ? `%${Math.round((totalMonthly / totalLimit) * 100)}` : "-", color: totalLimit > 0 && totalMonthly / totalLimit > 0.8 ? "#ff4d4f" : "#52c41a", extra: null },
        ].map((item, i) => (
          <Col xs={12} md={6} key={i}>
            <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 16, textAlign: "center" as const } }}>
              <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 4 }}>{item.label}</Text>
              <span style={{ fontSize: 26, fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono'" }}>{item.value}</span>
              {item.extra && <div style={{ marginTop: 4 }}>{item.extra}</div>}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("modelBasedCost")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            {modelStats.map((m: any, i: number) => {
              const color = m.color || modelColors[i % modelColors.length];
              return (
                <div key={i} style={{ marginBottom: i < modelStats.length - 1 ? 20 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: color }} /><Text style={{ color: colors.textSecondary, fontSize: 13 }}>{m.model || m.name}</Text></div>
                    <Text style={{ color: color, fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 600 }}>${(m.monthlyCost || 0).toFixed(2)}</Text>
                  </div>
                  <Progress percent={m.limit > 0 ? Math.round(((m.used || m.monthlyCost || 0) / m.limit) * 100) : 0} showInfo={false} strokeColor={color} trailColor={colors.dividerColor} size="small" />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <Text style={{ color: colors.textDimmed, fontSize: 11 }}>{m.dailyCalls || 0} {t("callsPerDay")} • ${(m.dailyCost || 0).toFixed(2)}/{t("day")}</Text>
                    <Text style={{ color: colors.textDimmed, fontSize: 11 }}>${(m.used || m.monthlyCost || 0).toFixed(2)} / ${m.limit || 0}</Text>
                  </div>
                  {m.limit > 0 && (m.used || m.monthlyCost || 0) / m.limit > 0.8 && <div style={{ marginTop: 4 }}><Tag color="warning" style={{ borderRadius: 4, fontSize: 10 }}><WarningOutlined /> {t("approachingLimit")}</Tag></div>}
                </div>
              );
            })}
            {modelStats.length === 0 && <Text style={{ color: colors.textMuted }}>{t("noData") || "Veri yok"}</Text>}
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("dailyCostHistory")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
            <Table dataSource={dailyHistory} columns={historyColumns} rowKey="date" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ApiCosts;
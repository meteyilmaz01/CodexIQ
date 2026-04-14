import { Card, Row, Col, Typography, Tag, Table, Progress } from "antd";
import { DollarOutlined, ArrowUpOutlined, ArrowDownOutlined, WarningOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;

const modelStats = [
  { model: "Gemini 2.5 Flash", dailyCalls: 245, dailyCost: 2.12, monthlyCost: 58.40, limit: 100, used: 58.4, color: "#1890ff" },
  { model: "Llama 3.1 8B", dailyCalls: 189, dailyCost: 0.95, monthlyCost: 26.10, limit: 50, used: 26.1, color: "#52c41a" },
  { model: "DeepSeek", dailyCalls: 201, dailyCost: 1.05, monthlyCost: 28.90, limit: 50, used: 28.9, color: "#722ed1" },
  { model: "Vision LLM (OCR)", dailyCalls: 87, dailyCost: 0.70, monthlyCost: 19.25, limit: 40, used: 19.25, color: "#0ff" },
];

const dailyHistory = [
  { date: "2026-04-07", gemini: 2.12, llama: 0.95, deepseek: 1.05, vision: 0.70, total: 4.82 },
  { date: "2026-04-06", gemini: 2.45, llama: 1.10, deepseek: 0.98, vision: 0.82, total: 5.35 },
  { date: "2026-04-05", gemini: 1.89, llama: 0.78, deepseek: 1.22, vision: 0.55, total: 4.44 },
  { date: "2026-04-04", gemini: 2.67, llama: 1.25, deepseek: 0.85, vision: 0.90, total: 5.67 },
  { date: "2026-04-03", gemini: 1.55, llama: 0.65, deepseek: 0.72, vision: 0.42, total: 3.34 },
  { date: "2026-04-02", gemini: 2.10, llama: 0.88, deepseek: 1.15, vision: 0.68, total: 4.81 },
  { date: "2026-04-01", gemini: 1.95, llama: 0.92, deepseek: 0.90, vision: 0.60, total: 4.37 },
];

const totalMonthly = modelStats.reduce((s, m) => s + m.monthlyCost, 0);
const totalDaily = modelStats.reduce((s, m) => s + m.dailyCost, 0);
const totalLimit = modelStats.reduce((s, m) => s + m.limit, 0);

const ApiCosts = () => {
  const colors = useThemeColors();
  const t = useT();

  const historyColumns = [
    { title: t("date"), dataIndex: "date", key: "date", render: (d: string) => <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: "'JetBrains Mono'" }}>{d}</Text> },
    { title: "Gemini", dataIndex: "gemini", key: "gemini", render: (v: number) => <Text style={{ color: "#1890ff", fontFamily: "'JetBrains Mono'", fontSize: 13 }}>${v.toFixed(2)}</Text> },
    { title: "Llama", dataIndex: "llama", key: "llama", responsive: ["md" as const], render: (v: number) => <Text style={{ color: "#52c41a", fontFamily: "'JetBrains Mono'", fontSize: 13 }}>${v.toFixed(2)}</Text> },
    { title: "DeepSeek", dataIndex: "deepseek", key: "deepseek", responsive: ["md" as const], render: (v: number) => <Text style={{ color: "#722ed1", fontFamily: "'JetBrains Mono'", fontSize: 13 }}>${v.toFixed(2)}</Text> },
    { title: "Vision", dataIndex: "vision", key: "vision", responsive: ["lg" as const], render: (v: number) => <Text style={{ color: colors.accent, fontFamily: "'JetBrains Mono'", fontSize: 13 }}>${v.toFixed(2)}</Text> },
    { title: t("total"), dataIndex: "total", key: "total", render: (v: number) => <Text style={{ color: "#faad14", fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 600 }}>${v.toFixed(2)}</Text> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("apiCostTracking")}</Title>
        <Text style={{ color: colors.textMuted }}>{t("modelBasedCostAnalysis")}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: t("today"), value: `$${totalDaily.toFixed(2)}`, color: "#faad14", extra: <><ArrowDownOutlined style={{ color: "#52c41a", fontSize: 11 }} /> <Text style={{ color: "#52c41a", fontSize: 12 }}>-10%</Text></> },
          { label: t("thisMonth"), value: `$${totalMonthly.toFixed(2)}`, color: "#ff4d4f", extra: <Text style={{ color: colors.textMuted, fontSize: 12 }}>/ ${totalLimit} limit</Text> },
          { label: t("dailyAvg"), value: `$${(totalMonthly / 7).toFixed(2)}`, color: colors.accent, extra: null },
          { label: t("budgetUsage"), value: `%${Math.round((totalMonthly / totalLimit) * 100)}`, color: totalMonthly / totalLimit > 0.8 ? "#ff4d4f" : "#52c41a", extra: null },
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
            {modelStats.map((m, i) => (
              <div key={i} style={{ marginBottom: i < modelStats.length - 1 ? 20 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: m.color }} /><Text style={{ color: colors.textSecondary, fontSize: 13 }}>{m.model}</Text></div>
                  <Text style={{ color: m.color, fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 600 }}>${m.monthlyCost.toFixed(2)}</Text>
                </div>
                <Progress percent={Math.round((m.used / m.limit) * 100)} showInfo={false} strokeColor={m.color} trailColor={colors.dividerColor} size="small" />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <Text style={{ color: colors.textDimmed, fontSize: 11 }}>{m.dailyCalls} {t("callsPerDay")} • ${m.dailyCost.toFixed(2)}/{t("day")}</Text>
                  <Text style={{ color: colors.textDimmed, fontSize: 11 }}>${m.used.toFixed(2)} / ${m.limit}</Text>
                </div>
                {m.used / m.limit > 0.8 && <div style={{ marginTop: 4 }}><Tag color="warning" style={{ borderRadius: 4, fontSize: 10 }}><WarningOutlined /> {t("approachingLimit")}</Tag></div>}
              </div>
            ))}
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
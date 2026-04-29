import { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Spin, Statistic, Tag, Empty } from "antd";
import { RiseOutlined, BugOutlined } from "@ant-design/icons";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { studentApi } from "../../api/studentApi";

const { Title, Text } = Typography;

interface ProgressPoint {
  examName: string;
  courseName: string;
  date: string;
  score: number;
  maxScore: number;
}

interface ErrorSummary {
  syntaxErrorCount: number;
  logicErrorCount: number;
  topSyntaxErrors: string[];
  topLogicErrors: string[];
}

const StudentAnalytics = () => {
  const colors = useThemeColors();
  const t = useT();
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [errorSummary, setErrorSummary] = useState<ErrorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      studentApi.getProgress().catch(() => []),
      studentApi.getErrorSummary().catch(() => null),
    ]).then(([prog, err]) => {
      const progData = Array.isArray(prog) ? prog : prog?.data || [];
      setProgress(progData);
      setErrorSummary(err?.data || err);
    }).finally(() => setLoading(false));
  }, []);

  const chartData = progress.map((p, i) => ({
    name: `${i + 1}. ${p.examName}`,
    shortName: `${i + 1}. Sınav`,
    puan: p.score,
    max: p.maxScore,
    ders: p.courseName,
    tarih: new Date(p.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
  }));

  const avg = progress.length > 0
    ? Math.round(progress.reduce((s, p) => s + p.score, 0) / progress.length)
    : 0;

  const totalErrors = (errorSummary?.syntaxErrorCount ?? 0) + (errorSummary?.logicErrorCount ?? 0);

  const cardStyle = {
    background: colors.cardBg,
    border: colors.borderPrimary,
    borderRadius: 12,
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: colors.sidebarBg, border: colors.borderPrimary, borderRadius: 8, padding: "10px 14px" }}>
        <Text style={{ color: colors.textPrimary, fontWeight: 600, display: "block" }}>{d.name}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{d.ders} · {d.tarih}</Text>
        <Text style={{ color: colors.accent, fontWeight: 700, display: "block", marginTop: 4 }}>
          {d.puan} / {d.max} puan
        </Text>
      </div>
    );
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Title level={3} style={{ color: colors.textPrimary, marginBottom: 24 }}>
        {t("analytics")}
      </Title>

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: "20px 24px" } }}>
            <Statistic
              title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>{t("totalExams")}</Text>}
              value={progress.length}
              valueStyle={{ color: colors.textPrimary, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: "20px 24px" } }}>
            <Statistic
              title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>{t("averageScore")}</Text>}
              value={avg}
              suffix="/ 100"
              valueStyle={{ color: avg >= 70 ? "#52c41a" : avg >= 50 ? "#faad14" : "#ff4d4f", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: "20px 24px" } }}>
            <Statistic
              title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>{t("syntaxErrorCount")}</Text>}
              value={errorSummary?.syntaxErrorCount ?? 0}
              prefix={<BugOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ color: colors.textPrimary, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={cardStyle} styles={{ body: { padding: "20px 24px" } }}>
            <Statistic
              title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>{t("logicErrorCount")}</Text>}
              value={errorSummary?.logicErrorCount ?? 0}
              prefix={<BugOutlined style={{ color: "#ff4d4f" }} />}
              valueStyle={{ color: colors.textPrimary, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Progress chart */}
      <Card
        style={{ ...cardStyle, marginBottom: 24 }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RiseOutlined style={{ color: colors.accent }} />
            <Text style={{ color: colors.textPrimary, fontWeight: 600 }}>{t("progressOverTime")}</Text>
          </div>
        }
      >
        {chartData.length === 0 ? (
          <Empty description={<Text style={{ color: colors.textMuted }}>{t("noSharedResults")}</Text>} />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${colors.textDimmed}30`} />
              <XAxis
                dataKey="shortName"
                tick={{ fill: colors.textMuted, fontSize: 12 }}
                axisLine={{ stroke: `${colors.textDimmed}50` }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: colors.textMuted, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={avg} stroke={`${colors.accent}60`} strokeDasharray="4 4" label={{ value: `Ort: ${avg}`, fill: colors.accent, fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="puan"
                stroke={colors.accent}
                strokeWidth={2.5}
                dot={{ fill: colors.accent, r: 5, strokeWidth: 2, stroke: colors.cardBg }}
                activeDot={{ r: 7, fill: colors.accent }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Error breakdown */}
      {totalErrors > 0 && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              style={cardStyle}
              title={
                <Text style={{ color: colors.textPrimary, fontWeight: 600 }}>
                  {t("topSyntaxErrors")}
                </Text>
              }
            >
              {(errorSummary?.topSyntaxErrors ?? []).length === 0 ? (
                <Text style={{ color: colors.textMuted }}>{t("noSyntaxErrors")}</Text>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(errorSummary?.topSyntaxErrors ?? []).map((err, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Tag color="warning" style={{ minWidth: 24, textAlign: "center" }}>{i + 1}</Tag>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{err}</Text>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              style={cardStyle}
              title={
                <Text style={{ color: colors.textPrimary, fontWeight: 600 }}>
                  {t("topLogicErrors")}
                </Text>
              }
            >
              {(errorSummary?.topLogicErrors ?? []).length === 0 ? (
                <Text style={{ color: colors.textMuted }}>{t("noLogicErrors")}</Text>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(errorSummary?.topLogicErrors ?? []).map((err, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Tag color="error" style={{ minWidth: 24, textAlign: "center" }}>{i + 1}</Tag>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{err}</Text>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default StudentAnalytics;

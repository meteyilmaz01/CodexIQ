import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Tag, Progress, List, Timeline, Spin } from "antd";
import {
  TrophyOutlined,
  RiseOutlined,
  CodeOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { studentApi } from "../../api/studentApi";
import { useAppStore } from "../../store/useAppStore";

const { Title, Text } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const t = useT();
  const user = useAppStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [insight, setInsight] = useState<{ insightText: string; generatedAt?: string; isReady: boolean } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, resultsRes, topicsRes, insightRes] = await Promise.all([
          studentApi.getStats(),
          studentApi.getRecentResults(),
          studentApi.getWeakTopics(),
          studentApi.getInsight(),
        ]);
        setStats(statsRes.data || statsRes);
        setRecentResults(resultsRes.data || resultsRes || []);
        setWeakTopics(topicsRes.data || topicsRes || []);
        setInsight(insightRes.data || insightRes);
      } catch {
        // API error handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "#52c41a";
    if (score >= 70) return "#0ff";
    if (score >= 50) return "#faad14";
    return "#ff4d4f";
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;
  }

  const statCards = [
    { title: t("examAverage"), value: stats?.averageScore ?? stats?.examAverage ?? "-", suffix: "/ 100", icon: <TrophyOutlined />, color: "#0ff", trend: stats?.averageTrend },
    { title: t("lastExam"), value: stats?.lastScored ?? stats?.lastExamScore ?? "-", suffix: "/ 100", icon: <RiseOutlined />, color: "#52c41a", trend: stats?.lastExamTrend },
    { title: t("totalExams"), value: stats?.totalExamsTaken ?? stats?.totalExams ?? 0, suffix: t("exams"), icon: <CodeOutlined />, color: "#1890ff", trend: "" },
    { title: t("codeTests"), value: stats?.codeTestCount ?? stats?.codeTests ?? 0, suffix: t("tests"), icon: <ClockCircleOutlined />, color: "#faad14", trend: "" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
          {t("dashboard")}
        </Title>
        <Text style={{ color: colors.textMuted }}>{t("dashboardWelcome")}, {user?.firstName} {user?.lastName}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((stat, i) => (
          <Col xs={12} sm={12} md={6} key={i}>
            <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 8 }}>{stat.title}</Text>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: colors.textPrimary, fontFamily: "'JetBrains Mono'" }}>{stat.value}</span>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>{stat.suffix}</span>
                  </div>
                  {stat.trend && (
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <ArrowUpOutlined style={{ color: "#52c41a", fontSize: 11 }} />
                      <Text style={{ color: "#52c41a", fontSize: 12 }}>{stat.trend}</Text>
                    </div>
                  )}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${stat.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: stat.color }}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card
            title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("recentResults")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}
            styles={{ body: { padding: 0 } }}
          >
            <List
              dataSource={recentResults}
              locale={{ emptyText: t("noData") || "Veri yok" }}
              renderItem={(item: any) => (
                <List.Item
                  onClick={() => navigate(`/student/results/${item.id}`)}
                  style={{ padding: "14px 20px", borderBottom: colors.listItemBorder, cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.containerBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                    <div>
                      <Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{item.examName || item.name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.courseName} • {new Date(item.uploadedAt).toLocaleDateString("tr-TR")}</Text>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: getScoreColor(item.finalScore ?? item.score ?? item.totalScore ?? 0), fontFamily: "'JetBrains Mono'" }}>
                        {item.finalScore ?? item.score ?? item.totalScore ?? 0}
                      </span>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card
            title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("weakTopics")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}
          >
            {weakTopics.length === 0 ? (
              <Text style={{ color: colors.textMuted }}>{t("noData") || "Veri yok"}</Text>
            ) : (
              weakTopics.map((topic: any, i: number) => (
                <div key={i} style={{ marginBottom: i < weakTopics.length - 1 ? 16 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{topic.topic || topic.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>%{topic.successPercentage ?? topic.accuracy ?? topic.percentage ?? 0}</Text>
                  </div>
                  <Progress
                    percent={topic.successPercentage ?? topic.accuracy ?? topic.percentage ?? 0}
                    showInfo={false}
                    strokeColor={(topic.successPercentage ?? topic.accuracy ?? topic.percentage ?? 0) < 50 ? "#ff4d4f" : (topic.successPercentage ?? topic.accuracy ?? topic.percentage ?? 0) < 70 ? "#faad14" : "#0ff"}
                    trailColor={colors.dividerColor}
                    size="small"
                  />
                </div>
              ))
            )}
          </Card>

          <Card
            title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("insightTitle")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}
          >
            {!insight ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <Spin size="small" />
                <Text style={{ color: colors.textMuted, marginLeft: 8 }}>{t("insightLoading")}</Text>
              </div>
            ) : !insight.isReady ? (
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t("insightNotReady")}</Text>
            ) : (
              <div>
                {insight.insightText.split("\n").filter((line: string) => line.trim()).map((line: string, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#0ff", fontWeight: 700, fontFamily: "'JetBrains Mono'", fontSize: 13, minWidth: 16 }}>{i + 1}.</span>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 1.6 }}>{line.replace(/^\d+\.\s*/, "").replace(/^[-•]\s*/, "")}</Text>
                  </div>
                ))}
                {insight.generatedAt && (
                  <Text style={{ color: colors.textMuted, fontSize: 11, display: "block", marginTop: 8 }}>
                    {new Date(insight.generatedAt).toLocaleDateString()}
                  </Text>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

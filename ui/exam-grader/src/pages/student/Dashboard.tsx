import { Card, Row, Col, Typography, Tag, Progress, List, Timeline } from "antd";
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
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;

const Dashboard = () => {
  const colors = useThemeColors();
  const t = useT();

  const stats = [
    { title: t("examAverage"), value: "78.5", suffix: "/ 100", icon: <TrophyOutlined />, color: "#0ff", trend: "+5.2" },
    { title: t("lastExam"), value: "85", suffix: "/ 100", icon: <RiseOutlined />, color: "#52c41a", trend: "+12" },
    { title: t("totalExams"), value: "8", suffix: t("exams"), icon: <CodeOutlined />, color: "#1890ff", trend: "" },
    { title: t("codeTests"), value: "23", suffix: t("tests"), icon: <ClockCircleOutlined />, color: "#faad14", trend: "" },
  ];

  const recentResults = [
    { id: 1, name: "Veri Yapıları - Final", date: "2026-03-28", score: 85, status: t("high") },
    { id: 2, name: "Algoritma Analizi - Vize", date: "2026-03-15", score: 72, status: t("medium") },
    { id: 3, name: "OOP - Quiz 3", date: "2026-03-05", score: 90, status: t("high") },
    { id: 4, name: "Veritabanı - Ödev 2", date: "2026-02-20", score: 65, status: t("medium") },
  ];

  const announcements = [
    { text: "Veri Yapıları final sonuçları yayınlandı", time: "2 saat önce", type: "success" },
    { text: "Algoritma dersi quiz tarihi: 15 Nisan", time: "1 gün önce", type: "info" },
    { text: "OOP proje teslim tarihi uzatıldı", time: "3 gün önce", type: "warning" },
  ];

  const weakTopics = [
    { topic: "Linked List İşlemleri", accuracy: 45 },
    { topic: "Recursive Fonksiyonlar", accuracy: 55 },
    { topic: "Pointer Kullanımı", accuracy: 60 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 85) return "#52c41a";
    if (score >= 70) return "#0ff";
    if (score >= 50) return "#faad14";
    return "#ff4d4f";
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
          {t("dashboard")}
        </Title>
        <Text style={{ color: colors.textMuted }}>{t("dashboardWelcome")}, Öğrenci Adı</Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, i) => (
          <Col xs={12} sm={12} md={6} key={i}>
            <Card
              style={{
                background: colors.cardBg,
                border: colors.borderPrimary,
                borderRadius: 12,
              }}
              styles={{ body: { padding: 20 } }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 8 }}>
                    {stat.title}
                  </Text>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: colors.textPrimary, fontFamily: "'JetBrains Mono'" }}>
                      {stat.value}
                    </span>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>{stat.suffix}</span>
                  </div>
                  {stat.trend && (
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <ArrowUpOutlined style={{ color: "#52c41a", fontSize: 11 }} />
                      <Text style={{ color: "#52c41a", fontSize: 12 }}>{stat.trend}</Text>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${stat.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recent Results */}
        <Col xs={24} md={14}>
          <Card
            title={
              <span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>
                {t("recentResults")}
              </span>
            }
            style={{
              background: colors.cardBg,
              border: colors.borderPrimary,
              borderRadius: 12,
            }}
            styles={{ body: { padding: 0 } }}
          >
            <List
              dataSource={recentResults}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: "14px 20px",
                    borderBottom: colors.listItemBorder,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                    <div>
                      <Text style={{ color: colors.textSecondary, fontSize: 14, display: "block" }}>{item.name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.date}</Text>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Tag
                        color={item.status === t("high") ? "success" : item.status === t("medium") ? "processing" : "error"}
                      >
                        {item.status}
                      </Tag>
                      <span
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: getScoreColor(item.score),
                          fontFamily: "'JetBrains Mono'",
                        }}
                      >
                        {item.score}
                      </span>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} md={10}>
          {/* Announcements */}
          <Card
            title={
              <span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>
                {t("announcements")}
              </span>
            }
            style={{
              background: colors.cardBg,
              border: colors.borderPrimary,
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <Timeline
              items={announcements.map((a) => ({
                color: a.type === "success" ? "green" : a.type === "warning" ? "orange" : "blue",
                children: (
                  <div>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, display: "block" }}>
                      {a.type === "success" && <CheckCircleOutlined style={{ marginRight: 6, color: "#52c41a" }} />}
                      {a.type === "warning" && <WarningOutlined style={{ marginRight: 6, color: "#faad14" }} />}
                      {a.type === "info" && <BookOutlined style={{ marginRight: 6, color: "#1890ff" }} />}
                      {a.text}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>{a.time}</Text>
                  </div>
                ),
              }))}
            />
          </Card>

          {/* Weak Topics */}
          <Card
            title={
              <span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>
                {t("weakTopics")}
              </span>
            }
            style={{
              background: colors.cardBg,
              border: colors.borderPrimary,
              borderRadius: 12,
            }}
          >
            {weakTopics.map((topic, i) => (
              <div key={i} style={{ marginBottom: i < weakTopics.length - 1 ? 16 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{topic.topic}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>%{topic.accuracy}</Text>
                </div>
                <Progress
                  percent={topic.accuracy}
                  showInfo={false}
                  strokeColor={topic.accuracy < 50 ? "#ff4d4f" : topic.accuracy < 70 ? "#faad14" : "#0ff"}
                  trailColor={colors.dividerColor}
                  size="small"
                />
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
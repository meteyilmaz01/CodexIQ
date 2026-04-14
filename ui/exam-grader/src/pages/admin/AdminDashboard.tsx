import { Card, Row, Col, Typography, Tag, List, Progress } from "antd";
import { TeamOutlined, UserOutlined, BookOutlined, CloudServerOutlined, CheckCircleOutlined, WarningOutlined, SyncOutlined, DollarOutlined, RiseOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const colors = useThemeColors();
  const t = useT();

  const stats = [
    { title: t("totalUsers"), value: "124", icon: <TeamOutlined />, color: "#1890ff", trend: "+8", up: true },
    { title: t("teachers"), value: "12", icon: <UserOutlined />, color: "#52c41a", trend: "+1", up: true },
    { title: t("studentsLabel"), value: "112", icon: <UserOutlined />, color: colors.accent, trend: "+7", up: true },
    { title: t("dailyApiCost"), value: "$4.82", icon: <DollarOutlined />, color: "#faad14", trend: "-12%", up: false },
  ];

  const systemHealth = [
    { name: "API Gateway", status: "online", uptime: "99.9%" },
    { name: "RabbitMQ", status: "online", uptime: "99.7%" },
    { name: "PostgreSQL", status: "online", uptime: "100%" },
    { name: "Redis Cache", status: "online", uptime: "99.8%" },
    { name: "Gemini API", status: "online", uptime: "98.5%" },
    { name: "Llama API", status: "warning", uptime: "95.2%" },
  ];

  const recentActivity = [
    { text: "Prof. Dr. Ahmet Yılmaz 45 sınav kağıdı yükledi", time: t("minutesAgo").replace("{n}", "10"), type: "upload" },
    { text: "Yeni öğrenci kaydı: Selin Koç (2021008)", time: t("hoursAgo").replace("{n}", "1"), type: "user" },
    { text: "RabbitMQ kuyruk temizlendi (153 iş tamamlandı)", time: t("hoursAgo").replace("{n}", "2"), type: "system" },
    { text: "Gemini API rate limit uyarısı", time: t("hoursAgo").replace("{n}", "3"), type: "warning" },
    { text: "Sistem güncellemesi tamamlandı v2.1.4", time: t("hoursAgo").replace("{n}", "5"), type: "system" },
  ];

  const dailyApiUsage = [
    { model: "Gemini 2.5 Flash", calls: 245, cost: 2.12, percentage: 44 },
    { model: "Llama 3.1 8B", calls: 189, cost: 0.95, percentage: 20 },
    { model: "DeepSeek", calls: 201, cost: 1.05, percentage: 22 },
    { model: "Vision LLM", calls: 87, cost: 0.70, percentage: 14 },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>Admin {t("dashboard")}</Title>
        <Text style={{ color: colors.textMuted }}>{t("systemOverview")}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Col xs={12} sm={12} md={6} key={i}>
            <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 8 }}>{s.title}</Text>
                  <span style={{ fontSize: 28, fontWeight: 700, color: colors.textPrimary, fontFamily: "'JetBrains Mono'" }}>{s.value}</span>
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    {s.up ? <ArrowUpOutlined style={{ color: "#52c41a", fontSize: 11 }} /> : <ArrowDownOutlined style={{ color: "#52c41a", fontSize: 11 }} />}
                    <Text style={{ color: "#52c41a", fontSize: 12 }}>{s.trend}</Text>
                  </div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: s.color }}>{s.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("dailyApiUsage")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            {dailyApiUsage.map((api, i) => (
              <div key={i} style={{ marginBottom: i < dailyApiUsage.length - 1 ? 16 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{api.model}</Text>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{api.calls} {t("calls")}</Text>
                    <Text style={{ color: "#faad14", fontSize: 12, fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>${api.cost.toFixed(2)}</Text>
                  </div>
                </div>
                <Progress percent={api.percentage} showInfo={false} strokeColor={i === 0 ? "#1890ff" : i === 1 ? "#52c41a" : i === 2 ? "#722ed1" : colors.accent} trailColor={colors.dividerColor} size="small" />
              </div>
            ))}
            <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(250,173,20,0.08)", border: "1px solid rgba(250,173,20,0.15)", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
              <Text style={{ color: "#faad14", fontSize: 13 }}>{t("dailyTotal")}</Text>
              <Text style={{ color: "#faad14", fontSize: 16, fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>$4.82</Text>
            </div>
          </Card>

          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("recentActivity")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
            <List dataSource={recentActivity} renderItem={(item) => (
              <List.Item style={{ padding: "12px 20px", borderBottom: colors.listItemBorder }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {item.type === "warning" ? <WarningOutlined style={{ color: "#faad14" }} /> : item.type === "upload" ? <RiseOutlined style={{ color: colors.accent }} /> : item.type === "user" ? <UserOutlined style={{ color: "#1890ff" }} /> : <CheckCircleOutlined style={{ color: "#52c41a" }} />}
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{item.text}</Text>
                  </div>
                  <Text style={{ color: colors.textMuted, fontSize: 11, flexShrink: 0 }}>{item.time}</Text>
                </div>
              </List.Item>
            )} />
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><CloudServerOutlined style={{ marginRight: 8 }} />{t("systemStatus")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            {systemHealth.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < systemHealth.length - 1 ? colors.listItemBorder : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.status === "online" ? "#52c41a" : "#faad14" }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{s.name}</Text>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{s.uptime}</Text>
                  <Tag color={s.status === "online" ? "success" : "warning"} style={{ borderRadius: 4, fontSize: 10, margin: 0 }}>
                    {s.status === "online" ? t("running") : t("warning")}
                  </Tag>
                </div>
              </div>
            ))}
          </Card>

          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("quickStats")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}>
            <Row gutter={[12, 12]}>
              {[
                { label: t("activeCourses"), value: "8", color: "#1890ff" },
                { label: t("activeClasses"), value: "6", color: "#52c41a" },
                { label: t("thisMonthExams"), value: "34", color: colors.accent },
                { label: t("announcementsCount"), value: "5", color: "#faad14" },
              ].map((q, i) => (
                <Col span={12} key={i}>
                  <div style={{ background: `${q.color}10`, border: `1px solid ${q.color}25`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: q.color, fontFamily: "'JetBrains Mono'", display: "block" }}>{q.value}</span>
                    <Text style={{ color: colors.textSubtle, fontSize: 12 }}>{q.label}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
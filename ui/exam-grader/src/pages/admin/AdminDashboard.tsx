import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Tag, List, Progress, Spin } from "antd";
import { TeamOutlined, UserOutlined, BookOutlined, CloudServerOutlined, CheckCircleOutlined, WarningOutlined, SyncOutlined, DollarOutlined, RiseOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { adminApi } from "../../api/adminApi";

const { Title, Text } = Typography;

const AdminDashboard = () => {
  const colors = useThemeColors();
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApi.getDashboard();
        setDashboard(res.data || res);
      } catch { /* handled */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;

  const stats = [
    { title: t("totalUsers"), value: dashboard?.totalUsers ?? "-", icon: <TeamOutlined />, color: "#1890ff", trend: dashboard?.usersTrend || "", up: true },
    { title: t("teachers"), value: dashboard?.totalTeachers ?? "-", icon: <UserOutlined />, color: "#52c41a", trend: dashboard?.teachersTrend || "", up: true },
    { title: t("studentsLabel"), value: dashboard?.totalStudents ?? "-", icon: <UserOutlined />, color: colors.accent, trend: dashboard?.studentsTrend || "", up: true },
    { title: t("dailyApiCost"), value: dashboard?.dailyApiCost != null ? `$${dashboard.dailyApiCost}` : "-", icon: <DollarOutlined />, color: "#faad14", trend: dashboard?.costTrend || "", up: false },
  ];

  const systemHealth = dashboard?.systemHealth || dashboard?.services || [];
  const recentActivity = dashboard?.recentActivity || dashboard?.activities || [];
  const dailyApiUsage = dashboard?.dailyApiUsage || dashboard?.apiUsage || [];
  const quickStats = dashboard?.quickStats || {};

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
                  {s.trend && (
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      {s.up ? <ArrowUpOutlined style={{ color: "#52c41a", fontSize: 11 }} /> : <ArrowDownOutlined style={{ color: "#52c41a", fontSize: 11 }} />}
                      <Text style={{ color: "#52c41a", fontSize: 12 }}>{s.trend}</Text>
                    </div>
                  )}
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
            {(Array.isArray(dailyApiUsage) ? dailyApiUsage : []).map((api: any, i: number) => (
              <div key={i} style={{ marginBottom: i < dailyApiUsage.length - 1 ? 16 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{api.model}</Text>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{api.calls} {t("calls")}</Text>
                    <Text style={{ color: "#faad14", fontSize: 12, fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>${(api.cost || 0).toFixed(2)}</Text>
                  </div>
                </div>
                <Progress percent={api.percentage || 0} showInfo={false} strokeColor={i === 0 ? "#1890ff" : i === 1 ? "#52c41a" : i === 2 ? "#722ed1" : colors.accent} trailColor={colors.dividerColor} size="small" />
              </div>
            ))}
            {dashboard?.dailyTotal != null && (
              <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(250,173,20,0.08)", border: "1px solid rgba(250,173,20,0.15)", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                <Text style={{ color: "#faad14", fontSize: 13 }}>{t("dailyTotal")}</Text>
                <Text style={{ color: "#faad14", fontSize: 16, fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>${dashboard.dailyTotal}</Text>
              </div>
            )}
          </Card>

          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("recentActivity")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
            <List dataSource={Array.isArray(recentActivity) ? recentActivity : []} locale={{ emptyText: t("noData") || "Veri yok" }} renderItem={(item: any) => (
              <List.Item style={{ padding: "12px 20px", borderBottom: colors.listItemBorder }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {item.type === "warning" ? <WarningOutlined style={{ color: "#faad14" }} /> : item.type === "upload" ? <RiseOutlined style={{ color: colors.accent }} /> : item.type === "user" ? <UserOutlined style={{ color: "#1890ff" }} /> : <CheckCircleOutlined style={{ color: "#52c41a" }} />}
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{item.text || item.message}</Text>
                  </div>
                  <Text style={{ color: colors.textMuted, fontSize: 11, flexShrink: 0 }}>{item.time || item.timestamp}</Text>
                </div>
              </List.Item>
            )} />
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><CloudServerOutlined style={{ marginRight: 8 }} />{t("systemStatus")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            {(Array.isArray(systemHealth) ? systemHealth : []).map((s: any, i: number) => (
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
                { label: t("activeCourses"), value: quickStats.activeCourses ?? dashboard?.activeCourses ?? "-", color: "#1890ff" },
                { label: t("activeClasses"), value: quickStats.activeClasses ?? dashboard?.activeClasses ?? "-", color: "#52c41a" },
                { label: t("thisMonthExams"), value: quickStats.thisMonthExams ?? dashboard?.thisMonthExams ?? "-", color: colors.accent },
                { label: t("announcementsCount"), value: quickStats.announcements ?? dashboard?.announcementsCount ?? "-", color: "#faad14" },
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
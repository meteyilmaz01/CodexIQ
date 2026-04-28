import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Tag, List, Progress, Spin } from "antd";
import {
  TeamOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined,
  SyncOutlined, CloudUploadOutlined, BarChartOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { teacherApi } from "../../api/teacherApi";
import { useAppStore } from "../../store/useAppStore";

const { Title, Text } = Typography;

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const t = useT();
  const user = useAppStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [courseAverages, setCourseAverages] = useState<any[]>([]);
  const [queueStatus, setQueueStatus] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, u, c, q] = await Promise.all([
          teacherApi.getStats(),
          teacherApi.getRecentUploads(),
          teacherApi.getCourseAverages(),
          teacherApi.getQueueStatus(),
        ]);
        setStats(s.data || s);
        setRecentUploads((u.data || u) || []);
        setCourseAverages((c.data || c) || []);
        const qd = q.data || q;
        setQueueStatus(Array.isArray(qd) ? qd : [
          { label: t("completed"), count: qd?.completed ?? 0, color: "#52c41a" },
          { label: t("processing"), count: qd?.processing ?? 0, color: "#1890ff" },
          { label: t("inQueue"), count: qd?.pending ?? 0, color: "#faad14" },
          { label: t("failed"), count: qd?.failed ?? 0, color: "#ff4d4f" },
        ]);
      } catch { /* handled */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;

  const statCards = [
    { title: t("totalStudents"), value: stats?.totalStudents ?? "-", icon: <TeamOutlined />, color: "#1890ff" },
    { title: t("evaluatedExams"), value: stats?.evaluatedExams ?? "-", icon: <FileTextOutlined />, color: "#52c41a" },
    { title: t("pendingTasks"), value: stats?.pendingTasks ?? "-", icon: <ClockCircleOutlined />, color: "#faad14" },
    { title: t("classAverage"), value: stats?.classAverage ?? "-", icon: <BarChartOutlined />, color: colors.accent },
  ];

  const getStatusTag = (status: string) => {
    switch (status) {
      case "completed": return <Tag icon={<CheckCircleOutlined />} color="success">{t("completed")}</Tag>;
      case "processing": return <Tag icon={<SyncOutlined spin />} color="processing">{t("processing")}</Tag>;
      case "pending": return <Tag icon={<ClockCircleOutlined />} color="warning">{t("inQueue")}</Tag>;
      default: return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("dashboard")}</Title>
        <Text style={{ color: colors.textMuted }}>{t("dashboardWelcome")}, {user?.firstName} {user?.lastName}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((stat, i) => (
          <Col xs={12} sm={12} md={6} key={i}>
            <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 8 }}>{stat.title}</Text>
                  <span style={{ fontSize: 28, fontWeight: 700, color: colors.textPrimary, fontFamily: "'JetBrains Mono'" }}>{stat.value}</span>
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
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("recentUploads")}</span>}
            extra={<a onClick={() => navigate("/teacher/results")} style={{ color: colors.accent, fontSize: 13 }}>{t("viewAll")}</a>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}
            styles={{ body: { padding: 0 } }}>
            <List dataSource={Array.isArray(recentUploads) ? recentUploads : []} locale={{ emptyText: "Veri yok" }}
              renderItem={(item: any) => (
                <List.Item
                  onClick={() => navigate(`/teacher/results?exam=${encodeURIComponent(item.examName || item.name || "")}`)}
                  style={{ padding: "14px 20px", borderBottom: colors.listItemBorder, cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.containerBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CloudUploadOutlined style={{ color: colors.accent }} />
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{item.examName || item.name}</Text>
                      </div>
                      <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 22 }}>
                        {item.paperCount || item.count || 0} {t("papers")} • {item.date || item.createdAt}
                      </Text>
                    </div>
                    {getStatusTag(item.status)}
                  </div>
                </List.Item>
              )} />
          </Card>

          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("courseAverages")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}>
            {(Array.isArray(courseAverages) ? courseAverages : []).map((c: any, i: number) => (
              <div key={i} style={{ marginBottom: i < courseAverages.length - 1 ? 16 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{c.course || c.courseName}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{c.students || c.studentCount || 0} {t("students")} • {t("avg")}: {c.average}</Text>
                </div>
                <Progress percent={c.average} showInfo={false} strokeColor={c.average >= 75 ? "#52c41a" : c.average >= 60 ? "#faad14" : "#ff4d4f"} trailColor={colors.dividerColor} size="small" />
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><SyncOutlined style={{ marginRight: 8 }} />{t("queueStatus")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            <Row gutter={[12, 12]}>
              {queueStatus.map((q: any, i: number) => (
                <Col span={12} key={i}>
                  <div style={{ background: `${q.color}10`, border: `1px solid ${q.color}25`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: q.color, fontFamily: "'JetBrains Mono'", display: "block" }}>{q.count}</span>
                    <Text style={{ color: colors.textSubtle, fontSize: 12 }}>{q.label}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("quickActions")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}>
            {[
              { icon: <CloudUploadOutlined />, text: t("uploadNewExam"), path: "/teacher/upload", color: colors.accent },
              { icon: <BarChartOutlined />, text: t("viewResults"), path: "/teacher/results", color: "#52c41a" },
              { icon: <TeamOutlined />, text: t("studentList"), path: "/teacher/students", color: "#1890ff" },
            ].map((action, i) => (
              <div key={i} onClick={() => navigate(action.path)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                marginBottom: i < 2 ? 8 : 0, background: colors.containerBg, border: colors.listItemBorder, transition: "all 0.2s",
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${action.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: action.color, fontSize: 16 }}>
                  {action.icon}
                </div>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{action.text}</Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherDashboard;

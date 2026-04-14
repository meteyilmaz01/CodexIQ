import { Card, Row, Col, Typography, Tag, List, Progress, Badge } from "antd";
import {
  TeamOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined,
  SyncOutlined, CloudUploadOutlined, BarChartOutlined, AlertOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const t = useT();

  const stats = [
    { title: t("totalStudents"), value: "47", icon: <TeamOutlined />, color: "#1890ff" },
    { title: t("evaluatedExams"), value: "156", icon: <FileTextOutlined />, color: "#52c41a" },
    { title: t("pendingTasks"), value: "3", icon: <ClockCircleOutlined />, color: "#faad14" },
    { title: t("classAverage"), value: "74.2", icon: <BarChartOutlined />, color: colors.accent },
  ];

  const recentUploads = [
    { id: 1, name: "Veri Yapıları - Final", count: 45, date: "2026-04-06 10:30", status: "completed" },
    { id: 2, name: "Algoritma - Quiz 4", count: 42, date: "2026-04-05 14:00", status: "processing" },
    { id: 3, name: "OOP - Ödev 3", count: 38, date: "2026-04-03 09:15", status: "pending" },
  ];

  const queueStatus = [
    { label: t("completed"), count: 153, color: "#52c41a" },
    { label: t("processing"), count: 2, color: "#1890ff" },
    { label: t("inQueue"), count: 1, color: "#faad14" },
    { label: t("failed"), count: 0, color: "#ff4d4f" },
  ];

  const courseAverages = [
    { course: "Veri Yapıları", average: 78, students: 45 },
    { course: "Algoritma Analizi", average: 71, students: 42 },
    { course: "OOP", average: 82, students: 38 },
    { course: "C Programlama", average: 65, students: 40 },
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
        <Text style={{ color: colors.textMuted }}>{t("dashboardWelcome")}, Prof. Dr. Ahmet Yılmaz</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, i) => (
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
          <Card
            title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("recentUploads")}</span>}
            extra={<a onClick={() => navigate("/teacher/results")} style={{ color: colors.accent, fontSize: 13 }}>{t("viewAll")}</a>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}
            styles={{ body: { padding: 0 } }}
          >
            <List
              dataSource={recentUploads}
              renderItem={(item) => (
                <List.Item style={{ padding: "14px 20px", borderBottom: colors.listItemBorder, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CloudUploadOutlined style={{ color: colors.accent }} />
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{item.name}</Text>
                      </div>
                      <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 22 }}>
                        {item.count} {t("papers")} • {item.date}
                      </Text>
                    </div>
                    {getStatusTag(item.status)}
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <Card
            title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("courseAverages")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}
          >
            {courseAverages.map((c, i) => (
              <div key={i} style={{ marginBottom: i < courseAverages.length - 1 ? 16 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{c.course}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{c.students} {t("students")} • {t("avg")}: {c.average}</Text>
                </div>
                <Progress percent={c.average} showInfo={false} strokeColor={c.average >= 75 ? "#52c41a" : c.average >= 60 ? "#faad14" : "#ff4d4f"} trailColor={colors.dividerColor} size="small" />
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card
            title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><SyncOutlined style={{ marginRight: 8 }} />{t("queueStatus")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}
          >
            <Row gutter={[12, 12]}>
              {queueStatus.map((q, i) => (
                <Col span={12} key={i}>
                  <div style={{ background: `${q.color}10`, border: `1px solid ${q.color}25`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: q.color, fontFamily: "'JetBrains Mono'", display: "block" }}>{q.count}</span>
                    <Text style={{ color: colors.textSubtle, fontSize: 12 }}>{q.label}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          <Card
            title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("quickActions")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}
          >
            {[
              { icon: <CloudUploadOutlined />, text: t("uploadNewExam"), path: "/teacher/upload", color: colors.accent },
              { icon: <BarChartOutlined />, text: t("viewResults"), path: "/teacher/results", color: "#52c41a" },
              { icon: <TeamOutlined />, text: t("studentList"), path: "/teacher/students", color: "#1890ff" },
            ].map((action, i) => (
              <div
                key={i}
                onClick={() => navigate(action.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                  marginBottom: i < 2 ? 8 : 0,
                  background: colors.containerBg,
                  border: colors.listItemBorder,
                  transition: "all 0.2s",
                }}
              >
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
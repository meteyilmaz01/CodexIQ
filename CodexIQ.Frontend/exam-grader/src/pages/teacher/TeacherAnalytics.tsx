import { useState, useEffect } from "react";
import { Card, Select, Typography, Tag, Empty, Spin, Row, Col, Statistic } from "antd";
import { BugOutlined, FileTextOutlined, BookOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { teacherApi } from "../../api/teacherApi";

const { Title, Text } = Typography;

interface ExamSummary {
  id: string;
  name: string;
  courseName: string;
  paperCount: number;
  createdDate: string;
}

interface TopError {
  description: string;
  type: string;
  count: number;
}

const TeacherAnalytics = () => {
  const colors = useThemeColors();
  const t = useT();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [topErrors, setTopErrors] = useState<TopError[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingErrors, setLoadingErrors] = useState(false);

  useEffect(() => {
    teacherApi.getAnalyticsExams()
      .then((res: any) => {
        const data = res.data || res;
        const list: ExamSummary[] = Array.isArray(data) ? data : [];
        setExams(list);
        if (list.length > 0) setSelectedExamId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingExams(false));
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    setLoadingErrors(true);
    teacherApi.getTopExamErrors(selectedExamId)
      .then((res: any) => {
        const data = res.data || res;
        setTopErrors(Array.isArray(data) ? data : []);
      })
      .catch(() => setTopErrors([]))
      .finally(() => setLoadingErrors(false));
  }, [selectedExamId]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const syntaxErrors = topErrors.filter((e) => e.type === "Syntax");
  const logicErrors = topErrors.filter((e) => e.type === "Logic");

  const cardStyle = {
    background: colors.cardBg,
    border: colors.borderPrimary,
    borderRadius: 12,
  };

  const ErrorList = ({ errors, color }: { errors: TopError[]; color: string }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {errors.map((err, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "12px 0",
            borderBottom: i < errors.length - 1 ? `1px solid ${colors.borderSubtle || "#ffffff10"}` : "none",
          }}
        >
          <div
            style={{
              minWidth: 28,
              height: 28,
              borderRadius: "50%",
              background: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {i + 1}
          </div>
          <div style={{ flex: 1 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, display: "block", lineHeight: "1.5" }}>
              {err.description}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2, display: "block" }}>
              {err.count} {t("seenInStudents")}
            </Text>
          </div>
          <Tag
            color={err.type === "Syntax" ? "gold" : "red"}
            style={{ fontSize: 11, borderRadius: 4, alignSelf: "flex-start" }}
          >
            {err.type === "Syntax" ? t("syntax") : t("logic")}
          </Tag>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Title level={3} style={{ color: colors.textPrimary, marginBottom: 24 }}>
        {t("classAnalytics")}
      </Title>

      {/* Sınav seçici */}
      <Card style={{ ...cardStyle, marginBottom: 24 }} styles={{ body: { padding: "20px 24px" } }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Text style={{ color: colors.textMuted, fontSize: 13, whiteSpace: "nowrap" }}>{t("selectExam")}</Text>
          {loadingExams ? (
            <Spin size="small" />
          ) : (
            <Select
              style={{ minWidth: 300 }}
              value={selectedExamId}
              onChange={setSelectedExamId}
              placeholder={t("selectExam")}
              options={exams.map((e) => ({
                value: e.id,
                label: `${e.name} — ${e.courseName} (${e.paperCount} ${t("papers")})`,
              }))}
            />
          )}
          {selectedExam && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag icon={<BookOutlined />} color="blue">{selectedExam.courseName}</Tag>
              <Tag icon={<FileTextOutlined />}>{selectedExam.paperCount} {t("papers")}</Tag>
              <Tag>{new Date(selectedExam.createdDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</Tag>
            </div>
          )}
        </div>
      </Card>

      {/* İstatistik kartları */}
      {selectedExam && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card style={cardStyle} styles={{ body: { padding: "20px 24px" } }}>
              <Statistic
                title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>{t("totalPapers")}</Text>}
                value={selectedExam.paperCount}
                valueStyle={{ color: colors.textPrimary, fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={cardStyle} styles={{ body: { padding: "20px 24px" } }}>
              <Statistic
                title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>{t("totalErrorTypes")}</Text>}
                value={topErrors.length}
                valueStyle={{ color: colors.textPrimary, fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={cardStyle} styles={{ body: { padding: "20px 24px" } }}>
              <Statistic
                title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>{t("syntaxErrorTypes")}</Text>}
                value={syntaxErrors.length}
                prefix={<BugOutlined style={{ color: "#faad14" }} />}
                valueStyle={{ color: colors.textPrimary, fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={cardStyle} styles={{ body: { padding: "20px 24px" } }}>
              <Statistic
                title={<Text style={{ color: colors.textMuted, fontSize: 12 }}>{t("logicErrorTypes")}</Text>}
                value={logicErrors.length}
                prefix={<BugOutlined style={{ color: "#ff4d4f" }} />}
                valueStyle={{ color: colors.textPrimary, fontWeight: 700 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Hata listeleri */}
      {loadingErrors ? (
        <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>
      ) : !selectedExamId ? (
        <Card style={cardStyle}>
          <Empty description={<Text style={{ color: colors.textMuted }}>{t("selectExamForAnalysis")}</Text>} />
        </Card>
      ) : topErrors.length === 0 ? (
        <Card style={cardStyle}>
          <Empty description={<Text style={{ color: colors.textMuted }}>{t("noErrorRecords")}</Text>} />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {syntaxErrors.length > 0 && (
            <Col xs={24} lg={12}>
              <Card
                style={cardStyle}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BugOutlined style={{ color: "#faad14" }} />
                    <Text style={{ color: colors.textPrimary, fontWeight: 600 }}>{t("syntaxErrorsTitle")}</Text>
                    <Tag color="gold" style={{ marginLeft: 4 }}>{syntaxErrors.length}</Tag>
                  </div>
                }
              >
                <ErrorList errors={syntaxErrors} color="#d4a017" />
              </Card>
            </Col>
          )}
          {logicErrors.length > 0 && (
            <Col xs={24} lg={12}>
              <Card
                style={cardStyle}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BugOutlined style={{ color: "#ff4d4f" }} />
                    <Text style={{ color: colors.textPrimary, fontWeight: 600 }}>{t("logicErrorsTitle")}</Text>
                    <Tag color="red" style={{ marginLeft: 4 }}>{logicErrors.length}</Tag>
                  </div>
                }
              >
                <ErrorList errors={logicErrors} color="#cf1322" />
              </Card>
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default TeacherAnalytics;

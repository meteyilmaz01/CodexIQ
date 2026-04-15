import { useState, useEffect } from "react";
import { Card, Typography, Upload, Button, Input, Select, Row, Col, Form, Tag, message, Progress, Steps, Space, Switch, InputNumber } from "antd";
import { CloudUploadOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined, SendOutlined, FileImageOutlined, CheckCircleOutlined, CodeOutlined, TrophyOutlined, BookOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { teacherApi } from "../../api/teacherApi";
import { adminApi } from "../../api/adminApi";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

interface RubricItem { id: number; criteria: string; points: number; }

const languages = [
  { value: "c", label: "C" }, { value: "cpp", label: "C++" }, { value: "python", label: "Python" },
  { value: "java", label: "Java" }, { value: "javascript", label: "JavaScript" },
];

const ExamUpload = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState<any[]>([]);
  const [language, setLanguage] = useState<string>("c");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [examName, setExamName] = useState("");
  const [codePurpose, setCodePurpose] = useState("");
  const [useRubric, setUseRubric] = useState(false);
  const [rubricItems, setRubricItems] = useState<RubricItem[]>([{ id: 1, criteria: "", points: 0 }]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [courses, setCourses] = useState<any[]>([]);
  const colors = useThemeColors();
  const t = useT();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await adminApi.getCourses({ pageSize: 100 });
        const data = res.data || res;
        const items = data.items || data.results || (Array.isArray(data) ? data : []);
        setCourses(items.map((c: any) => ({ value: c.id, label: c.name })));
      } catch { /* use empty */ }
    };
    loadCourses();
  }, []);

  const totalRubricPoints = rubricItems.reduce((sum, item) => sum + item.points, 0);
  const addRubricItem = () => setRubricItems([...rubricItems, { id: Date.now(), criteria: "", points: 0 }]);
  const removeRubricItem = (id: number) => { if (rubricItems.length > 1) setRubricItems(rubricItems.filter((i) => i.id !== id)); };
  const updateRubricItem = (id: number, field: "criteria" | "points", value: string | number) => {
    setRubricItems(rubricItems.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const handleUpload = async () => {
    if (fileList.length === 0) { message.error(t("uploadFiles")); return; }
    if (!examName) { message.error(t("enterExamName")); return; }
    if (!selectedCourse) { message.error(t("selectCourse")); return; }

    setUploading(true);
    setCurrentStep(2);
    setUploadProgress(10);

    try {
      // Step 1: Create exam
      const examRes = await teacherApi.createExam({ name: examName, courseId: selectedCourse, language, codePurpose });
      const examData = examRes.data || examRes;
      const examId = examData.examId || examData.id;
      setUploadProgress(30);

      // Step 2: Upload papers
      const files = fileList.map((f: any) => f.originFileObj).filter(Boolean);
      if (files.length > 0) {
        await teacherApi.uploadPapers(examId, files);
      }
      setUploadProgress(60);

      // Step 3: Save rubric if enabled
      if (useRubric && rubricItems.some((r) => r.criteria)) {
        await teacherApi.saveRubric(examId, rubricItems.map((r) => ({ criteria: r.criteria, maxPoints: r.points })));
      }
      setUploadProgress(80);

      // Step 4: Start evaluation
      await teacherApi.startEvaluation(examId);
      setUploadProgress(100);

      setTimeout(() => { setUploading(false); setCurrentStep(3); message.success(t("uploadSuccessMessage")); }, 500);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Yükleme sırasında hata oluştu");
      setUploading(false);
      setCurrentStep(1);
    }
  };

  const stepItems = [
    { title: t("files"), icon: <FileImageOutlined /> },
    { title: t("settings"), icon: <CodeOutlined /> },
    { title: t("uploading"), icon: <CloudUploadOutlined /> },
    { title: t("done"), icon: <CheckCircleOutlined /> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("uploadExam")}</Title>
        <Text style={{ color: colors.textMuted }}>{t("uploadExamSubtitle")}</Text>
      </div>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 24 }} styles={{ body: { padding: "16px 24px" } }}>
        <Steps current={currentStep} items={stepItems} size="small" />
      </Card>

      {currentStep === 0 && (
        <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("uploadExamPapers")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}>
          <Dragger multiple accept="image/*" fileList={fileList} onChange={(info) => setFileList(info.fileList)} beforeUpload={() => false} listType="picture"
            style={{ background: colors.draggerBg, border: colors.draggerBorder, borderRadius: 12, padding: "40px 20px" }}>
            <p><CloudUploadOutlined style={{ fontSize: 48, color: colors.accent }} /></p>
            <p style={{ color: colors.textSecondary, fontSize: 16, marginTop: 12 }}>{t("dragDropExamPapers")}</p>
            <p style={{ color: colors.textMuted, fontSize: 13 }}>{t("supportedFormatsExam")}</p>
          </Dragger>
          {fileList.length > 0 && (
            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Tag color="blue">{fileList.length} {t("filesSelected")}</Tag>
              <Button type="primary" onClick={() => setCurrentStep(1)} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}>{t("continue")}</Button>
            </div>
          )}
        </Card>
      )}

      {currentStep === 1 && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("examInfo")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}>
              <Form layout="vertical" requiredMark={false}>
                <Form.Item label={<Text style={{ color: colors.textSubtle }}>{t("examName")}</Text>}>
                  <Input placeholder={t("examNamePlaceholder")} value={examName} onChange={(e) => setExamName(e.target.value)} />
                </Form.Item>
                <Form.Item label={<Text style={{ color: colors.textSubtle }}>{t("course")}</Text>}>
                  <Select placeholder={t("selectCourse")} options={courses} value={selectedCourse} onChange={setSelectedCourse} />
                </Form.Item>
                <Form.Item label={<Text style={{ color: colors.textSubtle }}>{t("programmingLanguage")}</Text>}>
                  <Select options={languages} value={language} onChange={setLanguage} />
                </Form.Item>
                <Form.Item label={<Text style={{ color: colors.textSubtle }}>{t("codePurpose")}</Text>}>
                  <TextArea rows={4} placeholder={t("codePurposePlaceholder")} value={codePurpose} onChange={(e) => setCodePurpose(e.target.value)} />
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><TrophyOutlined style={{ marginRight: 8, color: "#faad14" }} />{t("answerKeyRubric")}</span>
                <Switch checked={useRubric} onChange={setUseRubric} checkedChildren={t("active")} unCheckedChildren={t("off")} />
              </div>
            } style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}>
              {!useRubric ? (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <BookOutlined style={{ fontSize: 36, color: colors.textDimmed }} />
                  <Text style={{ display: "block", color: colors.textMuted, marginTop: 12, fontSize: 13 }}>{t("optionalRubric")}</Text>
                </div>
              ) : (
                <div>
                  <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.accentBorderSolid}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{t("totalPoints")}</Text>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 20, fontWeight: 700, color: totalRubricPoints === 100 ? "#52c41a" : "#faad14" }}>
                      {totalRubricPoints} <span style={{ fontSize: 13, color: colors.textMuted }}>/ 100</span>
                    </span>
                  </div>
                  {rubricItems.map((item, index) => (
                    <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, padding: "10px 12px", background: colors.containerBg, borderRadius: 8, border: colors.listItemBorder }}>
                      <Tag style={{ borderRadius: 6, marginTop: 4 }}>{index + 1}</Tag>
                      <Input placeholder={t("criteriaDescription")} value={item.criteria} onChange={(e) => updateRubricItem(item.id, "criteria", e.target.value)} style={{ flex: 1 }} />
                      <InputNumber min={0} max={100} value={item.points} onChange={(val) => updateRubricItem(item.id, "points", val || 0)} style={{ width: 80 }} addonAfter="p" />
                      <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => removeRubricItem(item.id)} disabled={rubricItems.length <= 1} />
                    </div>
                  ))}
                  <Button type="dashed" onClick={addRubricItem} icon={<PlusOutlined />} block style={{ marginTop: 8, borderColor: colors.accentBorder, color: colors.accent }}>{t("addCriteria")}</Button>
                </div>
              )}
            </Card>
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <Button onClick={() => setCurrentStep(0)} style={{ flex: 1 }}>{t("back")}</Button>
              <Button type="primary" icon={<SendOutlined />} onClick={handleUpload} style={{ flex: 2, background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}>
                {t("startEvaluation")} ({fileList.length} {t("papers")})
              </Button>
            </div>
          </Col>
        </Row>
      )}

      {currentStep === 2 && (
        <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, textAlign: "center", padding: "40px 0" }}>
          <CloudUploadOutlined style={{ fontSize: 48, color: colors.accent, marginBottom: 20 }} />
          <Title level={5} style={{ color: colors.textPrimary }}>{t("uploadingAndStarting")}</Title>
          <Text style={{ color: colors.textMuted, display: "block", marginBottom: 24 }}>{fileList.length} {t("papersProcessing")}</Text>
          <div style={{ maxWidth: 400, margin: "0 auto" }}>
            <Progress percent={uploadProgress} strokeColor={{ from: "#00b8d4", to: "#00e5ff" }} trailColor={colors.dividerColor} />
          </div>
        </Card>
      )}

      {currentStep === 3 && (
        <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, textAlign: "center", padding: "40px 0" }}>
          <CheckCircleOutlined style={{ fontSize: 56, color: "#52c41a", marginBottom: 20 }} />
          <Title level={4} style={{ color: colors.textPrimary }}>{t("uploadComplete")}</Title>
          <Paragraph style={{ color: colors.textMuted, maxWidth: 400, margin: "0 auto 24px" }}>{t("uploadCompleteMessage").replace("{count}", String(fileList.length))}</Paragraph>
          <Space size="middle">
            <Button onClick={() => { setCurrentStep(0); setFileList([]); setUploadProgress(0); }}>{t("newUpload")}</Button>
            <Button type="primary" onClick={() => navigate("/teacher/results")} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none" }}>{t("goToResults")}</Button>
          </Space>
        </Card>
      )}
    </div>
  );
};

export default ExamUpload;

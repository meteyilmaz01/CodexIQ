import { useState, useEffect } from "react";
import { Card, Typography, Tag, Button, Row, Col, Collapse, Divider, InputNumber, Input, message, Switch, Space, Tooltip, Modal, Spin } from "antd";
import { ArrowLeftOutlined, BugOutlined, WarningOutlined, EditOutlined, SaveOutlined, CheckCircleOutlined, InfoCircleOutlined, TrophyOutlined, ShareAltOutlined, UndoOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { teacherApi } from "../../api/teacherApi";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const TeacherResultDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [originalScore, setOriginalScore] = useState(0);
  const [teacherNote, setTeacherNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [rubricScores, setRubricScores] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const colors = useThemeColors();
  const tFunc = useT();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await teacherApi.getResultDetail(id!);
        const d = res.data || res;
        setData(d);
        const totalScore = d.toplam_puan ?? d.totalScore ?? d.score ?? 0;
        const origScore = d.original_puan ?? d.originalScore ?? totalScore;
        setScore(totalScore);
        setOriginalScore(origScore);
        setTeacherNote(d.ogretmene_not || d.teacherNote || "");
        const rubric = d.rubric_scores || d.rubricScores || [];
        setRubricScores(rubric.map((r: any) => ({ ...r, teacherScore: r.teacherScore ?? r.aiScore ?? r.score ?? 0 })));
      } catch { /* handled by interceptor */ }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const isOverridden = score !== originalScore;
  const rubricTotal = rubricScores.reduce((sum: number, r: any) => sum + (r.teacherScore || 0), 0);

  const getScoreColor = (s: number) => { if (s >= 85) return "#52c41a"; if (s >= 70) return colors.accent; if (s >= 50) return "#faad14"; return "#ff4d4f"; };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isOverridden) {
        await teacherApi.overrideScore(id!, score);
      }
      if (teacherNote !== (data.ogretmene_not || data.teacherNote || "")) {
        await teacherApi.updateNote(id!, teacherNote);
      }
      setIsEditing(false);
      message.success(tFunc("changesSaved"));
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Hata oluştu");
    } finally { setSaving(false); }
  };

  const handleResetScore = () => {
    setScore(originalScore);
    const rubric = data.rubric_scores || data.rubricScores || [];
    setRubricScores(rubric.map((r: any) => ({ ...r, teacherScore: r.aiScore ?? r.score ?? 0 })));
    message.info(tFunc("scoreResetToAI"));
  };

  const handleShare = () => {
    Modal.confirm({
      title: tFunc("shareResult"),
      content: `${data.studentName} ${tFunc("shareConfirmMessage")}`,
      okText: tFunc("share"), cancelText: tFunc("cancel"),
      onOk: async () => {
        try {
          await teacherApi.shareResult(id!);
          setData({ ...data, shared: true });
          message.success(tFunc("resultSharedWithStudent"));
        } catch (err: any) {
          message.error(err?.response?.data?.message || "Paylaşma hatası");
        }
      },
    });
  };

  const updateRubricScore = (index: number, val: number) => {
    const updated = [...rubricScores]; updated[index].teacherScore = val; setRubricScores(updated);
    setScore(updated.reduce((sum: number, r: any) => sum + r.teacherScore, 0));
  };

  if (loading || !data) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;

  const syntaxErrors = data.syntax_hatalari || data.syntaxErrors || [];
  const logicErrors = data.mantik_hatalari || data.logicErrors || [];
  const modelScores = data.model_scores || data.modelScores || {};
  const code = data.code || "";
  const codePurpose = data.code_purpose || data.codePurpose || "";

  const renderCode = () => {
    const lines = code.split("\n");
    const errorLines = new Set([...syntaxErrors.map((e: any) => e.line), ...logicErrors.map((e: any) => e.line)]);
    return (
      <pre style={{ margin: 0, padding: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.8, overflowX: "auto", color: colors.textCode }}>
        {lines.map((line: string, i: number) => {
          const lineNum = i + 1; const hasError = errorLines.has(lineNum);
          return (
            <div key={i} style={{ display: "flex", background: hasError ? colors.errorHighlightBg : "transparent", borderLeft: hasError ? "3px solid #ff4d4f" : "3px solid transparent", padding: "0 8px" }}>
              <span style={{ width: 40, textAlign: "right", paddingRight: 16, color: hasError ? "#ff4d4f" : colors.textDimmed, userSelect: "none", flexShrink: 0 }}>{lineNum}</span>
              <span>{line}</span>
            </div>
          );
        })}
      </pre>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/teacher/results")} style={{ color: colors.textSubtle }} />
          <div>
            <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{data.studentName} — {data.examName || data.name}</Title>
            <Text style={{ color: colors.textMuted }}>{data.studentNo} • {data.course || data.courseName} • {data.date}</Text>
          </div>
        </div>
        <Space wrap>
          {isEditing ? (<><Button onClick={() => setIsEditing(false)}>{tFunc("cancel")}</Button><Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none" }}>{tFunc("save")}</Button></>
          ) : (<><Button icon={<EditOutlined />} onClick={() => setIsEditing(true)}>{tFunc("edit")}</Button><Button icon={<ShareAltOutlined />} onClick={handleShare} type="primary" style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none" }}>{tFunc("share")}</Button></>)}
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: tFunc("totalScore"), value: score, color: getScoreColor(score), editable: true, suffix: isOverridden ? <Tag color="orange" style={{ fontSize: 10 }}>OVR</Tag> : null },
          { label: tFunc("aiScore"), value: originalScore, color: colors.textSubtle, editable: false, suffix: null },
          { label: tFunc("syntaxError"), value: syntaxErrors.length, color: "#faad14", editable: false, suffix: null },
          { label: tFunc("logicError"), value: logicErrors.length, color: "#ff4d4f", editable: false, suffix: null },
        ].map((item, i) => (
          <Col xs={12} sm={6} key={i}>
            <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, textAlign: "center" }} styles={{ body: { padding: 16 } }}>
              <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 4 }}>{item.label} {item.suffix}</Text>
              {isEditing && item.editable ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <InputNumber min={0} max={100} value={score} onChange={(v) => setScore(v || 0)} style={{ width: 80, fontSize: 20 }} />
                  {isOverridden && <Tooltip title={tFunc("resetToAI")}><Button type="text" icon={<UndoOutlined />} size="small" onClick={handleResetScore} style={{ color: colors.textMuted }} /></Tooltip>}
                </div>
              ) : (
                <span style={{ fontSize: 32, fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono'" }}>{item.value}</span>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{tFunc("studentCode")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
            {codePurpose && (
              <div style={{ padding: "12px 20px", borderBottom: colors.borderSubtle, background: colors.tooltipBg }}>
                <InfoCircleOutlined style={{ color: colors.accent, marginRight: 8 }} /><Text style={{ color: colors.textSubtle, fontSize: 13 }}>{codePurpose}</Text>
              </div>
            )}
            {renderCode()}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          {rubricScores.length > 0 && (
            <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><TrophyOutlined style={{ marginRight: 8, color: "#faad14" }} />{tFunc("rubricScoring")}</span>}
              style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
              {rubricScores.map((r: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < rubricScores.length - 1 ? colors.listItemBorder : "none" }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1 }}>{r.criteria}</Text>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isEditing ? <InputNumber min={0} max={r.maxPoints} value={r.teacherScore} onChange={(v) => updateRubricScore(i, v || 0)} size="small" style={{ width: 60 }} />
                      : <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, color: r.teacherScore === r.maxPoints ? "#52c41a" : "#faad14" }}>{r.teacherScore}</span>}
                    <Text style={{ color: colors.textDimmed, fontSize: 12 }}>/ {r.maxPoints}</Text>
                  </div>
                </div>
              ))}
              <Divider style={{ borderColor: colors.dividerColor, margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text style={{ color: colors.textSubtle, fontWeight: 500 }}>{tFunc("rubricTotal")}</Text>
                <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: colors.accent, fontSize: 16 }}>{rubricTotal} / 100</span>
              </div>
            </Card>
          )}
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><BugOutlined style={{ marginRight: 8, color: "#faad14" }} />{tFunc("errorsTitle")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            <Collapse ghost items={[
              ...syntaxErrors.map((err: any, i: number) => ({
                key: `s-${i}`, label: <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Tag color="warning" style={{ borderRadius: 4 }}>{tFunc("line")} {err.line}</Tag><Tag color="orange" style={{ borderRadius: 4, fontSize: 10 }}>SYNTAX</Tag><Text style={{ color: colors.textSecondary, fontSize: 13 }}>{err.description}</Text></div>, children: null,
              })),
              ...logicErrors.map((err: any, i: number) => ({
                key: `m-${i}`, label: <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Tag color="error" style={{ borderRadius: 4 }}>{tFunc("line")} {err.line}</Tag><Tag color="red" style={{ borderRadius: 4, fontSize: 10 }}>{tFunc("logic")}</Tag><Text style={{ color: colors.textSecondary, fontSize: 13 }}>{err.description}</Text></div>, children: null,
              })),
            ]} />
          </Card>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><EditOutlined style={{ marginRight: 8 }} />{tFunc("teacherNote")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            {isEditing ? <TextArea rows={4} value={teacherNote} onChange={(e) => setTeacherNote(e.target.value)} placeholder={tFunc("writeNoteForStudent")} />
              : <Paragraph style={{ color: colors.textHint, fontSize: 14, margin: 0 }}>{teacherNote || "-"}</Paragraph>}
          </Card>
          {Object.keys(modelScores).length > 0 && (
            <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{tFunc("modelScores")}</span>}
              style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}>
              {Object.entries(modelScores).map(([model, s]: [string, any]) => (
                <div key={model} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Tag style={{ borderRadius: 6, textTransform: "capitalize" }}>{model}</Tag>
                  <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, color: getScoreColor(Number(s)) }}>{s}</span>
                </div>
              ))}
              <Divider style={{ borderColor: colors.dividerColor, margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{tFunc("referee")} (Gemini 2.5 Flash)</Text>
                <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: colors.accent, fontSize: 16 }}>{originalScore}</span>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default TeacherResultDetail;
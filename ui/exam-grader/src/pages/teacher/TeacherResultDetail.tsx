import { useState } from "react";
import { Card, Typography, Tag, Button, Row, Col, Collapse, Divider, InputNumber, Input, message, Switch, Space, Tooltip, Modal } from "antd";
import { ArrowLeftOutlined, BugOutlined, WarningOutlined, EditOutlined, SaveOutlined, CheckCircleOutlined, InfoCircleOutlined, TrophyOutlined, ShareAltOutlined, UndoOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const mockDetail = {
  id: 1, studentName: "Ali Veli", studentNo: "2021001", examName: "Veri Yapıları - Final",
  course: "Veri Yapıları", date: "2026-03-28", toplam_puan: 85, original_puan: 85,
  ogretmene_not: "Genel olarak iyi bir performans. Linked list konusunda biraz daha çalışma gerekiyor.",
  code_purpose: "Verilen linked list üzerinde ekleme, silme ve arama işlemlerini gerçekleştiren bir C programı yazınız.",
  shared: false, overridden: false,
  code: `#include <stdio.h>\n#include <stdlib.h>\n\nstruct Node {\n    int data;\n    struct Node* next;\n};\n\nstruct Node* head = NULL;\n\nvoid insert(int val) {\n    struct Node* newNode = malloc(sizeof(struct Node));\n    newNode->data = val;\n    newNode->next = head;\n    head = newNode;\n}\n\nvoid delete(int val) {\n    struct Node* temp = head;\n    struct Node* prev = NULL;\n    \n    if (temp != NULL && temp->data == val) {\n        head = temp->next;\n        free(temp);\n        return;\n    }\n    \n    while (temp != NULL && temp->data != val) {\n        prev = temp;\n        temp = temp->next;\n    }\n    \n    if (temp == NULL) return;\n    \n    prev->next = temp->next;\n    free(temp);\n}\n\nint search(int val) {\n    struct Node* temp = head;\n    while (temp != NULL) {\n        if (temp->data == val)\n            return 1;\n        temp = temp->next;\n    }\n    return 0;\n}\n\nint main() {\n    insert(10);\n    insert(20);\n    insert(30);\n    \n    printf("20 aranıyor: %d\\\\n", search(20));\n    \n    delete(20);\n    \n    printf("20 tekrar aranıyor: %d\\\\n", search(20));\n    \n    return 0;\n}`,
  syntax_hatalari: [
    { line: 12, description: "malloc dönüş değeri cast edilmemiş", severity: "warning" },
    { line: 19, description: "'delete' C++ anahtar kelimesi ile çakışabilir", severity: "error" },
  ],
  mantik_hatalari: [
    { line: 12, description: "malloc başarısız olursa NULL kontrolü yapılmamış", severity: "error" },
  ],
  model_scores: { llama: 82, deepseek: 87, gemini: 86 },
  rubric_scores: [
    { criteria: "Doğru struct tanımı", maxPoints: 15, aiScore: 15 },
    { criteria: "Insert fonksiyonu", maxPoints: 20, aiScore: 18 },
    { criteria: "Delete fonksiyonu", maxPoints: 25, aiScore: 20 },
    { criteria: "Search fonksiyonu", maxPoints: 15, aiScore: 15 },
    { criteria: "malloc/free kullanımı", maxPoints: 15, aiScore: 10 },
    { criteria: "main fonksiyonu ve test", maxPoints: 10, aiScore: 7 },
  ],
};

const TeacherResultDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [score, setScore] = useState(mockDetail.toplam_puan);
  const [teacherNote, setTeacherNote] = useState(mockDetail.ogretmene_not);
  const [isEditing, setIsEditing] = useState(false);
  const [rubricScores, setRubricScores] = useState(mockDetail.rubric_scores.map((r) => ({ ...r, teacherScore: r.aiScore })));
  const colors = useThemeColors();
  const tFunc = useT();

  const isOverridden = score !== mockDetail.original_puan;
  const rubricTotal = rubricScores.reduce((sum, r) => sum + r.teacherScore, 0);

  const getScoreColor = (s: number) => { if (s >= 85) return "#52c41a"; if (s >= 70) return colors.accent; if (s >= 50) return "#faad14"; return "#ff4d4f"; };

  const handleSave = () => { setIsEditing(false); message.success(tFunc("changesSaved")); };
  const handleResetScore = () => { setScore(mockDetail.original_puan); setRubricScores(mockDetail.rubric_scores.map((r) => ({ ...r, teacherScore: r.aiScore }))); message.info(tFunc("scoreResetToAI")); };
  const handleShare = () => {
    Modal.confirm({
      title: tFunc("shareResult"),
      content: `${mockDetail.studentName} ${tFunc("shareConfirmMessage")}`,
      okText: tFunc("share"), cancelText: tFunc("cancel"),
      onOk: () => message.success(tFunc("resultSharedWithStudent")),
    });
  };

  const updateRubricScore = (index: number, val: number) => {
    const updated = [...rubricScores]; updated[index].teacherScore = val; setRubricScores(updated);
    setScore(updated.reduce((sum, r) => sum + r.teacherScore, 0));
  };

  const renderCode = () => {
    const lines = mockDetail.code.split("\n");
    const errorLines = new Set([...mockDetail.syntax_hatalari.map((e) => e.line), ...mockDetail.mantik_hatalari.map((e) => e.line)]);
    return (
      <pre style={{ margin: 0, padding: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.8, overflowX: "auto", color: colors.textCode }}>
        {lines.map((line, i) => {
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
            <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{mockDetail.studentName} — {mockDetail.examName}</Title>
            <Text style={{ color: colors.textMuted }}>{mockDetail.studentNo} • {mockDetail.course} • {mockDetail.date}</Text>
          </div>
        </div>
        <Space wrap>
          {isEditing ? (<><Button onClick={() => setIsEditing(false)}>{tFunc("cancel")}</Button><Button type="primary" icon={<SaveOutlined />} onClick={handleSave} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none" }}>{tFunc("save")}</Button></>
          ) : (<><Button icon={<EditOutlined />} onClick={() => setIsEditing(true)}>{tFunc("edit")}</Button><Button icon={<ShareAltOutlined />} onClick={handleShare} type="primary" style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none" }}>{tFunc("share")}</Button></>)}
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: tFunc("totalScore"), value: score, color: getScoreColor(score), editable: true, suffix: isOverridden ? <Tag color="orange" style={{ fontSize: 10 }}>OVR</Tag> : null },
          { label: tFunc("aiScore"), value: mockDetail.original_puan, color: colors.textSubtle, editable: false, suffix: null },
          { label: tFunc("syntaxError"), value: mockDetail.syntax_hatalari.length, color: "#faad14", editable: false, suffix: null },
          { label: tFunc("logicError"), value: mockDetail.mantik_hatalari.length, color: "#ff4d4f", editable: false, suffix: null },
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
            {mockDetail.code_purpose && (
              <div style={{ padding: "12px 20px", borderBottom: colors.borderSubtle, background: colors.tooltipBg }}>
                <InfoCircleOutlined style={{ color: colors.accent, marginRight: 8 }} /><Text style={{ color: colors.textSubtle, fontSize: 13 }}>{mockDetail.code_purpose}</Text>
              </div>
            )}
            {renderCode()}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><TrophyOutlined style={{ marginRight: 8, color: "#faad14" }} />{tFunc("rubricScoring")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            {rubricScores.map((r, i) => (
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
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><BugOutlined style={{ marginRight: 8, color: "#faad14" }} />{tFunc("errorsTitle")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            <Collapse ghost items={[
              ...mockDetail.syntax_hatalari.map((err, i) => ({
                key: `s-${i}`, label: <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Tag color="warning" style={{ borderRadius: 4 }}>{tFunc("line")} {err.line}</Tag><Tag color="orange" style={{ borderRadius: 4, fontSize: 10 }}>SYNTAX</Tag><Text style={{ color: colors.textSecondary, fontSize: 13 }}>{err.description}</Text></div>, children: null,
              })),
              ...mockDetail.mantik_hatalari.map((err, i) => ({
                key: `m-${i}`, label: <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Tag color="error" style={{ borderRadius: 4 }}>{tFunc("line")} {err.line}</Tag><Tag color="red" style={{ borderRadius: 4, fontSize: 10 }}>{tFunc("logic")}</Tag><Text style={{ color: colors.textSecondary, fontSize: 13 }}>{err.description}</Text></div>, children: null,
              })),
            ]} />
          </Card>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><EditOutlined style={{ marginRight: 8 }} />{tFunc("teacherNote")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            {isEditing ? <TextArea rows={4} value={teacherNote} onChange={(e) => setTeacherNote(e.target.value)} placeholder={tFunc("writeNoteForStudent")} />
              : <Paragraph style={{ color: colors.textHint, fontSize: 14, margin: 0 }}>{teacherNote}</Paragraph>}
          </Card>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{tFunc("modelScores")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}>
            {Object.entries(mockDetail.model_scores).map(([model, s]) => (
              <div key={model} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Tag style={{ borderRadius: 6, textTransform: "capitalize" }}>{model}</Tag>
                <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, color: getScoreColor(s) }}>{s}</span>
              </div>
            ))}
            <Divider style={{ borderColor: colors.dividerColor, margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{tFunc("referee")} (Gemini 2.5 Flash)</Text>
              <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: colors.accent, fontSize: 16 }}>{mockDetail.original_puan}</span>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherResultDetail;
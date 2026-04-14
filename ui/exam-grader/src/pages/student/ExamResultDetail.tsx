import { useState } from "react";
import { Card, Typography, Tag, Button, Row, Col, Collapse, Tooltip, Divider, Switch } from "antd";
import {
  ArrowLeftOutlined,
  BulbOutlined,
  WarningOutlined,
  BugOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text, Paragraph } = Typography;

const mockDetail = {
  id: 1, name: "Veri Yapıları - Final", course: "Veri Yapıları", date: "2026-03-28",
  toplam_puan: 85,
  ogretmene_not: "Genel olarak iyi bir performans. Linked list konusunda biraz daha çalışma gerekiyor.",
  code_purpose: "Verilen linked list üzerinde ekleme, silme ve arama işlemlerini gerçekleştiren bir C programı yazınız.",
  code: `#include <stdio.h>\n#include <stdlib.h>\n\nstruct Node {\n    int data;\n    struct Node* next;\n};\n\nstruct Node* head = NULL;\n\nvoid insert(int val) {\n    struct Node* newNode = malloc(sizeof(struct Node));\n    newNode->data = val;\n    newNode->next = head;\n    head = newNode;\n}\n\nvoid delete(int val) {\n    struct Node* temp = head;\n    struct Node* prev = NULL;\n    \n    if (temp != NULL && temp->data == val) {\n        head = temp->next;\n        free(temp);\n        return;\n    }\n    \n    while (temp != NULL && temp->data != val) {\n        prev = temp;\n        temp = temp->next;\n    }\n    \n    if (temp == NULL) return;\n    \n    prev->next = temp->next;\n    free(temp);\n}\n\nint search(int val) {\n    struct Node* temp = head;\n    while (temp != NULL) {\n        if (temp->data == val)\n            return 1;\n        temp = temp->next;\n    }\n    return 0;\n}\n\nint main() {\n    insert(10);\n    insert(20);\n    insert(30);\n    \n    printf("20 aranıyor: %d\\\\n", search(20));\n    \n    delete(20);\n    \n    printf("20 tekrar aranıyor: %d\\\\n", search(20));\n    \n    return 0;\n}`,
  syntax_hatalari: [
    { line: 12, description: "malloc dönüş değeri cast edilmemiş", severity: "warning", hint: "C'de malloc void* döner. Açıkça cast etmek iyi bir pratiktir: (struct Node*)malloc(...)" },
    { line: 19, description: "'delete' C++ anahtar kelimesi ile çakışabilir", severity: "error", hint: "Fonksiyon adı olarak 'delete' yerine 'deleteNode' veya 'removeNode' kullanın. 'delete' C++ dilinde ayrılmış bir kelimedir." },
  ],
  mantik_hatalari: [
    { line: 12, description: "malloc başarısız olursa NULL kontrolü yapılmamış", severity: "error", hint: "malloc başarısız olabilir ve NULL dönebilir. Her zaman kontrol edin:\nif (newNode == NULL) { printf(\"Bellek hatası\"); exit(1); }" },
  ],
  model_scores: { llama: 82, deepseek: 87, gemini: 86 },
};

const ExamResultDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [educationMode, setEducationMode] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const colors = useThemeColors();
  const t = useT();

  const data = mockDetail;

  const toggleHint = (index: number) => {
    setRevealedHints((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "#52c41a";
    if (score >= 70) return "#0ff";
    if (score >= 50) return "#faad14";
    return "#ff4d4f";
  };

  const renderCodeWithHighlights = () => {
    const lines = data.code.split("\n");
    const errorLines = new Set([
      ...data.syntax_hatalari.map((e) => e.line),
      ...data.mantik_hatalari.map((e) => e.line),
    ]);

    return (
      <pre style={{ margin: 0, padding: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.8, overflowX: "auto", color: colors.textCode }}>
        {lines.map((line, i) => {
          const lineNum = i + 1;
          const hasError = errorLines.has(lineNum);
          return (
            <div key={i} style={{ display: "flex", background: hasError ? colors.errorHighlightBg : "transparent", borderLeft: hasError ? "3px solid #ff4d4f" : "3px solid transparent", padding: "0 8px", borderRadius: hasError ? 2 : 0 }}>
              <span style={{ width: 40, textAlign: "right", paddingRight: 16, color: hasError ? "#ff4d4f" : colors.textDimmed, userSelect: "none", flexShrink: 0 }}>{lineNum}</span>
              <span>{line}</span>
              {hasError && (
                <Tooltip title="Bu satırda hata var">
                  <WarningOutlined style={{ marginLeft: 8, color: "#ff4d4f", fontSize: 12 }} />
                </Tooltip>
              )}
            </div>
          );
        })}
      </pre>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/student/results")} style={{ color: colors.textSubtle }} />
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{data.name}</Title>
          <Text style={{ color: colors.textMuted }}>{data.course} • {data.date}</Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BookOutlined style={{ color: educationMode ? colors.accent : colors.textMuted }} />
          <Text style={{ color: educationMode ? colors.accent : colors.textMuted, fontSize: 13 }}>{t("educationMode")}</Text>
          <Switch checked={educationMode} onChange={setEducationMode} />
        </div>
      </div>

      {/* Score Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, textAlign: "center" }} styles={{ body: { padding: 16 } }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 4 }}>{t("totalScore")}</Text>
            <span style={{ fontSize: 32, fontWeight: 700, color: getScoreColor(data.toplam_puan), fontFamily: "'JetBrains Mono'" }}>{data.toplam_puan}</span>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, textAlign: "center" }} styles={{ body: { padding: 16 } }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 4 }}>{t("syntaxError")}</Text>
            <span style={{ fontSize: 32, fontWeight: 700, color: "#faad14", fontFamily: "'JetBrains Mono'" }}>{data.syntax_hatalari.length}</span>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, textAlign: "center" }} styles={{ body: { padding: 16 } }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 4 }}>{t("logicError")}</Text>
            <span style={{ fontSize: 32, fontWeight: 700, color: "#ff4d4f", fontFamily: "'JetBrains Mono'" }}>{data.mantik_hatalari.length}</span>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, textAlign: "center" }} styles={{ body: { padding: 16 } }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 4 }}>{t("modelAverage")}</Text>
            <span style={{ fontSize: 32, fontWeight: 700, color: colors.accent, fontFamily: "'JetBrains Mono'" }}>
              {Math.round((data.model_scores.llama + data.model_scores.deepseek + data.model_scores.gemini) / 3)}
            </span>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Code View */}
        <Col xs={24} lg={14}>
          <Card
            title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("writtenCode")}</span>}
            extra={<Tag color="blue">{data.code_purpose ? "Amaç belirtilmiş" : ""}</Tag>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}
            styles={{ body: { padding: 0 } }}
          >
            {data.code_purpose && (
              <div style={{ padding: "12px 20px", borderBottom: colors.borderSubtle, background: colors.tooltipBg }}>
                <InfoCircleOutlined style={{ color: colors.accent, marginRight: 8 }} />
                <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{data.code_purpose}</Text>
              </div>
            )}
            {renderCodeWithHighlights()}
          </Card>
        </Col>

        {/* Errors & Hints */}
        <Col xs={24} lg={10}>
          {/* Syntax Errors */}
          <Card
            title={
              <span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>
                <BugOutlined style={{ marginRight: 8, color: "#faad14" }} />
                {t("syntaxErrors")} ({data.syntax_hatalari.length})
              </span>
            }
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}
          >
            <Collapse
              ghost
              items={data.syntax_hatalari.map((err, i) => ({
                key: `syntax-${i}`,
                label: (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Tag color={err.severity === "error" ? "error" : "warning"} style={{ borderRadius: 4 }}>{t("line")} {err.line}</Tag>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{err.description}</Text>
                  </div>
                ),
                children: educationMode ? (
                  <div>
                    {revealedHints.has(i) ? (
                      <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.accentBorder}`, borderRadius: 8, padding: 14 }}>
                        <BulbOutlined style={{ color: colors.accent, marginRight: 8 }} />
                        <Text style={{ color: colors.textHint, fontSize: 13, whiteSpace: "pre-wrap" }}>{err.hint}</Text>
                      </div>
                    ) : (
                      <Button type="dashed" icon={<BulbOutlined />} onClick={() => toggleHint(i)} style={{ color: colors.accent, borderColor: colors.accentBorder }}>
                        {t("showHint")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t("enableEducationMode")}</Text>
                ),
              }))}
            />
          </Card>

          {/* Logic Errors */}
          <Card
            title={
              <span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>
                <WarningOutlined style={{ marginRight: 8, color: "#ff4d4f" }} />
                {t("logicErrors")} ({data.mantik_hatalari.length})
              </span>
            }
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}
          >
            <Collapse
              ghost
              items={data.mantik_hatalari.map((err, i) => ({
                key: `logic-${i}`,
                label: (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Tag color="error" style={{ borderRadius: 4 }}>{t("line")} {err.line}</Tag>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{err.description}</Text>
                  </div>
                ),
                children: educationMode ? (
                  <div>
                    {revealedHints.has(100 + i) ? (
                      <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.accentBorder}`, borderRadius: 8, padding: 14 }}>
                        <BulbOutlined style={{ color: colors.accent, marginRight: 8 }} />
                        <Text style={{ color: colors.textHint, fontSize: 13, whiteSpace: "pre-wrap" }}>{err.hint}</Text>
                      </div>
                    ) : (
                      <Button type="dashed" icon={<BulbOutlined />} onClick={() => toggleHint(100 + i)} style={{ color: colors.accent, borderColor: colors.accentBorder }}>
                        {t("showHint")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t("enableEducationMode")}</Text>
                ),
              }))}
            />
          </Card>

          {/* Teacher Note */}
          <Card
            title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><CheckCircleOutlined style={{ marginRight: 8, color: "#52c41a" }} />{t("teacherNote")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}
          >
            <Paragraph style={{ color: colors.textHint, fontSize: 14, margin: 0 }}>{data.ogretmene_not}</Paragraph>
          </Card>

          {/* Ensemble Scores */}
          <Card
            title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("modelScores")} (Ensemble)</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}
          >
            {Object.entries(data.model_scores).map(([model, score]) => (
              <div key={model} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Tag style={{ borderRadius: 6, textTransform: "capitalize" }}>{model}</Tag>
                <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, color: getScoreColor(score) }}>{score}</span>
              </div>
            ))}
            <Divider style={{ borderColor: colors.dividerColor, margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{t("referee")} (Gemini 2.5 Flash)</Text>
              <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: colors.accent, fontSize: 18 }}>{data.toplam_puan}</span>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExamResultDetail;
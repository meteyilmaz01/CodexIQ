import { useState, useEffect } from "react";
import { Card, Typography, Tag, Button, Row, Col, Collapse, Tooltip, Divider, Switch, Spin, Alert, Modal, Input, message } from "antd";
import {
  ArrowLeftOutlined, BulbOutlined, WarningOutlined, BugOutlined,
  CheckCircleOutlined, InfoCircleOutlined, BookOutlined, EditOutlined, SendOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { studentApi } from "../../api/studentApi";

const { Title, Text, Paragraph } = Typography;

const ExamResultDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [educationMode, setEducationMode] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regradeRequest, setRegradeRequest] = useState<any>(null);
  const [regradeModalOpen, setRegradeModalOpen] = useState(false);
  const [regradeReason, setRegradeReason] = useState("");
  const [regradeLoading, setRegradeLoading] = useState(false);
  const colors = useThemeColors();
  const t = useT();

  useEffect(() => {
    const load = async () => {
      try {
        const [detailRes, regradeRes] = await Promise.all([
          studentApi.getResultDetail(id!),
          studentApi.getRegradeRequestStatus(id!).catch(() => null),
        ]);
        setData(detailRes.data || detailRes);
        setRegradeRequest(regradeRes);
      } catch { /* handled */ }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleRegradeSubmit = async () => {
    if (!regradeReason.trim()) return;
    setRegradeLoading(true);
    try {
      await studentApi.createRegradeRequest(id!, regradeReason.trim());
      message.success("İtiraz talebiniz iletildi. Öğretmeniniz inceleyecek.");
      setRegradeModalOpen(false);
      setRegradeReason("");
      setRegradeRequest({ status: "Pending", createdDate: new Date().toISOString() });
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Hata oluştu");
    } finally { setRegradeLoading(false); }
  };

  const toggleHint = (index: number) => {
    setRevealedHints((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "#52c41a"; if (score >= 70) return "#0ff"; if (score >= 50) return "#faad14"; return "#ff4d4f";
  };

  if (loading || !data) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;

  const syntaxErrors = data.syntax_hatalari || data.syntaxErrors || [];
  const logicErrors = data.mantik_hatalari || data.logicErrors || [];
  const rubricBreakdown: { criteria: string; maxPoints: number; earnedPoints: number }[] = data.rubricBreakdown || [];
  const rawModelScores = data.model_scores || data.modelScores || {};
  // Backend array [{modelName, score}] döndürüyor; eski dict formatını da destekle
  const modelScoresList: { name: string; score: number }[] = Array.isArray(rawModelScores)
    ? rawModelScores.map((m: any) => ({ name: m.modelName ?? m.name ?? "model", score: Number(m.score) || 0 }))
    : Object.entries(rawModelScores).map(([name, score]: [string, any]) => ({ name, score: Number(score) || 0 }));
  const totalScore = data.toplam_puan ?? data.totalScore ?? data.score ?? 0;
  const isOverridden: boolean = data.isOverridden ?? false;
  const originalScore: number | null = data.originalScore ?? null;
  const code = data.code || "";
  const codePurpose = data.code_purpose || data.codePurpose || "";
  const teacherNote = data.ogretmene_not || data.teacherNote || "";

  const totalLines = code ? code.split("\n").length : 0;

  const isValidLine = (line: number) => line > 0 && line <= totalLines;

  const lineTag = (line: number, isLogic: boolean) => {
    if (!isValidLine(line)) return <Tag color={isLogic ? "error" : "warning"} style={{ borderRadius: 4 }}>Satır ?</Tag>;
    if (isLogic) return <Tag color="error" style={{ borderRadius: 4 }}>~{t("line")} {line}</Tag>;
    return <Tag color="warning" style={{ borderRadius: 4 }}>{t("line")} {line}</Tag>;
  };

  const renderCodeWithHighlights = () => {
    const lines = code.split("\n");
    const errorLines = new Set([
      ...syntaxErrors.filter((e: any) => isValidLine(e.line)).map((e: any) => e.line),
      ...logicErrors.filter((e: any) => isValidLine(e.line)).map((e: any) => e.line),
    ]);
    return (
      <pre style={{ margin: 0, padding: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.8, overflowX: "auto", color: colors.textCode }}>
        {lines.map((line: string, i: number) => {
          const lineNum = i + 1;
          const hasError = errorLines.has(lineNum);
          return (
            <div key={i} style={{ display: "flex", background: hasError ? colors.errorHighlightBg : "transparent", borderLeft: hasError ? "3px solid #ff4d4f" : "3px solid transparent", padding: "0 8px", borderRadius: hasError ? 2 : 0 }}>
              <span style={{ width: 40, textAlign: "right", paddingRight: 16, color: hasError ? "#ff4d4f" : colors.textDimmed, userSelect: "none", flexShrink: 0 }}>{lineNum}</span>
              <span>{line}</span>
              {hasError && <Tooltip title="Bu satırda hata var"><WarningOutlined style={{ marginLeft: 8, color: "#ff4d4f", fontSize: 12 }} /></Tooltip>}
            </div>
          );
        })}
      </pre>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/student/results")} style={{ color: colors.textSubtle }} />
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{data.name || data.examName}</Title>
          <Text style={{ color: colors.textMuted }}>{data.course || data.courseName} • {data.date}</Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Regrade request button / status */}
          {!regradeRequest && (
            <Button
              icon={<SendOutlined />}
              onClick={() => setRegradeModalOpen(true)}
              style={{ borderColor: colors.accentBorder, color: colors.accent }}
            >
              Notuma İtiraz Et
            </Button>
          )}
          {regradeRequest?.status === "Pending" && (
            <Tag color="processing" style={{ borderRadius: 6, padding: "4px 10px" }}>İtiraz Beklemede</Tag>
          )}
          {regradeRequest?.status === "Approved" && (
            <Tag color="success" style={{ borderRadius: 6, padding: "4px 10px" }}>İtiraz Onaylandı</Tag>
          )}
          {regradeRequest?.status === "Rejected" && (
            <Tag color="error" style={{ borderRadius: 6, padding: "4px 10px" }}>İtiraz Reddedildi</Tag>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOutlined style={{ color: educationMode ? colors.accent : colors.textMuted }} />
            <Text style={{ color: educationMode ? colors.accent : colors.textMuted, fontSize: 13 }}>{t("educationMode")}</Text>
            <Switch checked={educationMode} onChange={setEducationMode} />
          </div>
        </div>
      </div>

      {isOverridden && originalScore !== null && (
        <Alert
          icon={<EditOutlined />}
          showIcon
          type="warning"
          style={{ marginBottom: 20, borderRadius: 10 }}
          message={
            <span>
              Puanınız öğretmen tarafından{" "}
              <strong style={{ fontFamily: "'JetBrains Mono'" }}>{originalScore}</strong>
              {" "}'den{" "}
              <strong style={{ fontFamily: "'JetBrains Mono'", color: getScoreColor(totalScore) }}>{totalScore}</strong>
              {" "}'ye güncellendi.
            </span>
          }
        />
      )}

      {regradeRequest?.status === "Rejected" && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16, borderRadius: 10 }}
          message="İtirazınız Reddedildi"
          description={regradeRequest.teacherNote || "Öğretmen bir gerekçe belirtmedi."}
        />
      )}

      {regradeRequest?.status === "Approved" && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 16, borderRadius: 10 }}
          message="İtirazınız Onaylandı"
          description={regradeRequest.teacherNote || "Öğretmeniniz itirazınızı inceledi ve onayladı."}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, textAlign: "center" }} styles={{ body: { padding: 16 } }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 4 }}>{t("totalScore")}</Text>
            <span style={{ fontSize: 32, fontWeight: 700, color: getScoreColor(totalScore), fontFamily: "'JetBrains Mono'" }}>{totalScore}</span>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, textAlign: "center" }} styles={{ body: { padding: 16 } }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 4 }}>{t("syntaxError")}</Text>
            <span style={{ fontSize: 32, fontWeight: 700, color: "#faad14", fontFamily: "'JetBrains Mono'" }}>{syntaxErrors.length}</span>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, textAlign: "center" }} styles={{ body: { padding: 16 } }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 4 }}>{t("logicError")}</Text>
            <span style={{ fontSize: 32, fontWeight: 700, color: "#ff4d4f", fontFamily: "'JetBrains Mono'" }}>{logicErrors.length}</span>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, textAlign: "center" }} styles={{ body: { padding: 16 } }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, display: "block", marginBottom: 4 }}>{t("modelAverage")}</Text>
            <span style={{ fontSize: 32, fontWeight: 700, color: colors.accent, fontFamily: "'JetBrains Mono'" }}>
              {modelScoresList.length > 0 ? Math.round(modelScoresList.reduce((a, b) => a + b.score, 0) / modelScoresList.length) : "-"}
            </span>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("writtenCode")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}
            styles={{ body: { padding: 0 } }}
          >
            {codePurpose && (
              <div style={{ padding: "12px 20px", borderBottom: colors.borderSubtle, background: colors.tooltipBg }}>
                <InfoCircleOutlined style={{ color: colors.accent, marginRight: 8 }} />
                <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{codePurpose}</Text>
              </div>
            )}
            {renderCodeWithHighlights()}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><BugOutlined style={{ marginRight: 8, color: "#faad14" }} />{t("syntaxErrors")} ({syntaxErrors.length})</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            <Collapse ghost items={syntaxErrors.map((err: any, i: number) => ({
              key: `syntax-${i}`,
              label: (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {lineTag(err.line, false)}
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{err.description}</Text>
                </div>
              ),
              children: educationMode ? (
                revealedHints.has(i) ? (
                  <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.accentBorder}`, borderRadius: 8, padding: 14 }}>
                    <BulbOutlined style={{ color: colors.accent, marginRight: 8 }} />
                    <Text style={{ color: colors.textHint, fontSize: 13, whiteSpace: "pre-wrap" }}>{err.hint}</Text>
                  </div>
                ) : (
                  <Button type="dashed" icon={<BulbOutlined />} onClick={() => toggleHint(i)} style={{ color: colors.accent, borderColor: colors.accentBorder }}>{t("showHint")}</Button>
                )
              ) : <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t("enableEducationMode")}</Text>,
            }))} />
          </Card>

          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><WarningOutlined style={{ marginRight: 8, color: "#ff4d4f" }} />{t("logicErrors")} ({logicErrors.length})</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            <Collapse ghost items={logicErrors.map((err: any, i: number) => ({
              key: `logic-${i}`,
              label: (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {lineTag(err.line, true)}
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{err.description}</Text>
                </div>
              ),
              children: educationMode ? (
                revealedHints.has(100 + i) ? (
                  <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.accentBorder}`, borderRadius: 8, padding: 14 }}>
                    <BulbOutlined style={{ color: colors.accent, marginRight: 8 }} />
                    <Text style={{ color: colors.textHint, fontSize: 13, whiteSpace: "pre-wrap" }}>{err.hint}</Text>
                  </div>
                ) : (
                  <Button type="dashed" icon={<BulbOutlined />} onClick={() => toggleHint(100 + i)} style={{ color: colors.accent, borderColor: colors.accentBorder }}>{t("showHint")}</Button>
                )
              ) : <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t("enableEducationMode")}</Text>,
            }))} />
          </Card>

          {teacherNote && (
            <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}><CheckCircleOutlined style={{ marginRight: 8, color: "#52c41a" }} />{t("teacherNote")}</span>}
              style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
              <Paragraph style={{ color: colors.textHint, fontSize: 14, margin: 0 }}>{teacherNote}</Paragraph>
            </Card>
          )}

          {rubricBreakdown.length > 0 && (
            <Card
              title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}> Puanlama Kriterleri</span>}
              style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}
            >
              {rubricBreakdown.map((item, i) => {
                const pct = item.maxPoints > 0 ? Math.round((item.earnedPoints / item.maxPoints) * 100) : 0;
                const color = pct >= 85 ? "#52c41a" : pct >= 60 ? "#faad14" : "#ff4d4f";
                return (
                  <div key={i} style={{ marginBottom: i < rubricBreakdown.length - 1 ? 14 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{item.criteria}</Text>
                      <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color, fontSize: 13 }}>
                        {item.earnedPoints} / {item.maxPoints}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: colors.dividerColor, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.4s" }} />
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          {modelScoresList.length > 0 && (
            <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("modelScores")} (Ensemble)</span>}
              style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}>
              {modelScoresList.map((m, idx) => (
                <div key={`${m.name}-${idx}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Tag style={{ borderRadius: 6, textTransform: "capitalize" }}>{m.name}</Tag>
                  <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, color: getScoreColor(m.score) }}>{m.score}</span>
                </div>
              ))}
              <Divider style={{ borderColor: colors.dividerColor, margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: colors.textSubtle, fontSize: 13 }}>{t("referee")} (Gemini 2.5 Flash)</Text>
                <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: colors.accent, fontSize: 18 }}>{totalScore}</span>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title={<span style={{ color: colors.textPrimary }}>Notuma İtiraz Et</span>}
        open={regradeModalOpen}
        onCancel={() => { setRegradeModalOpen(false); setRegradeReason(""); }}
        footer={null}
      >
        <div style={{ padding: "8px 0" }}>
          <Text style={{ color: colors.textMuted, display: "block", marginBottom: 8 }}>
            Şu anki puanınız: <strong style={{ color: getScoreColor(totalScore), fontFamily: "'JetBrains Mono'" }}>{totalScore}</strong>
          </Text>
          <Text style={{ color: colors.textMuted, display: "block", marginBottom: 16, fontSize: 13 }}>
            Notunuza neden itiraz etmek istediğinizi açıklayın. Öğretmeniniz gerekçenizi inceleyecek.
          </Text>
          <Input.TextArea
            placeholder="Gerekçenizi yazın..."
            rows={4}
            value={regradeReason}
            onChange={(e) => setRegradeReason(e.target.value)}
            maxLength={500}
            showCount
            style={{ marginBottom: 16 }}
          />
          <Button
            type="primary"
            block
            icon={<SendOutlined />}
            loading={regradeLoading}
            onClick={handleRegradeSubmit}
            disabled={regradeReason.trim().length < 10}
            style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}
          >
            Talebi Gönder
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ExamResultDetail;

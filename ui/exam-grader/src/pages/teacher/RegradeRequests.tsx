import { useState, useEffect } from "react";
import { Card, Typography, Table, Tag, Button, Modal, Input, InputNumber, Space, message, Empty } from "antd";
import { CheckOutlined, CloseOutlined, EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { teacherApi } from "../../api/teacherApi";

const { Title, Text, Paragraph } = Typography;

const RegradeRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState<{ open: boolean; request: any | null; decision: "Approved" | "Rejected" }>({ open: false, request: null, decision: "Approved" });
  const [teacherNote, setTeacherNote] = useState("");
  const [newScore, setNewScore] = useState<number | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const colors = useThemeColors();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await teacherApi.getRegradeRequests();
      const data = res.data || res;
      setRequests(Array.isArray(data) ? data : []);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openResolve = (request: any, decision: "Approved" | "Rejected") => {
    setResolveModal({ open: true, request, decision });
    setTeacherNote("");
    setNewScore(decision === "Approved" ? request.currentScore : null);
  };

  const handleResolve = async () => {
    if (!resolveModal.request) return;
    setResolveLoading(true);
    try {
      await teacherApi.resolveRegradeRequest(
        resolveModal.request.id,
        resolveModal.decision,
        teacherNote || undefined,
        resolveModal.decision === "Approved" && newScore !== null ? newScore : undefined
      );
      message.success(resolveModal.decision === "Approved" ? "İtiraz onaylandı." : "İtiraz reddedildi.");
      setResolveModal({ open: false, request: null, decision: "Approved" });
      load();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Hata oluştu");
    } finally { setResolveLoading(false); }
  };

  const getScoreColor = (s: number) => { if (s >= 85) return "#52c41a"; if (s >= 70) return "#0ff"; if (s >= 50) return "#faad14"; return "#ff4d4f"; };

  const columns = [
    {
      title: "Öğrenci",
      key: "student",
      render: (_: unknown, r: any) => <Text style={{ color: colors.textSecondary, fontWeight: 600 }}>{r.studentName}</Text>,
    },
    {
      title: "Sınav",
      key: "exam",
      render: (_: unknown, r: any) => (
        <div>
          <Text style={{ color: colors.textSecondary, display: "block", fontSize: 13 }}>{r.examName}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{r.courseName}</Text>
        </div>
      ),
    },
    {
      title: "Mevcut Puan",
      key: "score",
      render: (_: unknown, r: any) => (
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: getScoreColor(r.currentScore) }}>{r.currentScore}</span>
      ),
    },
    {
      title: "Gerekçe",
      key: "reason",
      render: (_: unknown, r: any) => (
        <Paragraph ellipsis={{ rows: 2 }} style={{ color: colors.textSubtle, margin: 0, maxWidth: 260 }}>{r.reason}</Paragraph>
      ),
    },
    {
      title: "Tarih",
      key: "date",
      render: (_: unknown, r: any) => (
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          {new Date(r.createdDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
        </Text>
      ),
    },
    {
      title: "İşlem",
      key: "actions",
      render: (_: unknown, r: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/teacher/results/${r.examPaperId}`)}
            style={{ color: colors.accent, borderColor: colors.accentBorder }}
          >
            Detay
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => openResolve(r, "Approved")}
            style={{ background: "#52c41a", border: "none" }}
          >
            Onayla
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => openResolve(r, "Rejected")}
          >
            Reddet
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>
          İtiraz Talepleri
        </Title>
        <Text style={{ color: colors.textMuted }}>Öğrencilerin not itirazlarını incele ve sonuçlandır</Text>
      </div>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        {requests.length === 0 && !loading ? (
          <Empty description={<Text style={{ color: colors.textMuted }}>Bekleyen itiraz talebi yok</Text>} style={{ padding: 40 }} />
        ) : (
          <Table
            dataSource={requests}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 700 }}
          />
        )}
      </Card>

      <Modal
        title={
          <span style={{ color: colors.textPrimary }}>
            {resolveModal.decision === "Approved" ? "İtirazı Onayla" : "İtirazı Reddet"}
          </span>
        }
        open={resolveModal.open}
        onCancel={() => setResolveModal({ open: false, request: null, decision: "Approved" })}
        footer={null}
      >
        {resolveModal.request && (
          <div style={{ padding: "8px 0" }}>
            <div style={{ background: colors.tooltipBg, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
              <Text style={{ color: colors.textMuted, fontSize: 12, display: "block" }}>Öğrenci gerekçesi</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{resolveModal.request.reason}</Text>
            </div>

            {resolveModal.decision === "Approved" && (
              <div style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textSubtle, display: "block", marginBottom: 6 }}>
                  Yeni puan <Text style={{ color: colors.textMuted, fontSize: 12 }}>(boş bırakırsan puan değişmez)</Text>
                </Text>
                <InputNumber
                  min={0}
                  max={100}
                  value={newScore}
                  onChange={(v) => setNewScore(v)}
                  style={{ width: "100%" }}
                  placeholder={`Mevcut: ${resolveModal.request.currentScore}`}
                />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.textSubtle, display: "block", marginBottom: 6 }}>
                Yanıt notu <Text style={{ color: colors.textMuted, fontSize: 12 }}>(opsiyonel)</Text>
              </Text>
              <Input.TextArea
                rows={3}
                placeholder="Öğrenciye iletilecek açıklama..."
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                maxLength={300}
                showCount
              />
            </div>

            <Button
              type="primary"
              block
              loading={resolveLoading}
              onClick={handleResolve}
              danger={resolveModal.decision === "Rejected"}
              style={resolveModal.decision === "Approved" ? { background: "#52c41a", border: "none", fontWeight: 600 } : { fontWeight: 600 }}
            >
              {resolveModal.decision === "Approved" ? "Onayla" : "Reddet"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RegradeRequests;

import { useState, useEffect } from "react";
import { Card, Typography, Input, Button, Avatar, Row, Col, Form, Divider, message, Spin, Modal } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, SaveOutlined, BookOutlined, IdcardOutlined, NumberOutlined, TeamOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { studentApi } from "../../api/studentApi";
import { authApi } from "../../api/authApi";

const { Title, Text } = Typography;

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const colors = useThemeColors();
  const t = useT();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await studentApi.getProfile();
        const data = res.data || res;
        setProfile(data);
        profileForm.setFieldsValue({ firstName: data.firstName, lastName: data.lastName, email: data.email });
      } catch { /* handled */ }
      finally { setPageLoading(false); }
    };
    load();
  }, []);

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      await studentApi.updateProfile(values);
      message.success(t("profileUpdated"));
      setProfile({ ...profile, ...values });
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Hata oluştu");
    } finally { setLoading(false); }
  };

  const handleJoinClass = async () => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    try {
      const res = await studentApi.joinClass(joinCode.trim());
      const data = res.data || res;
      message.success(`"${data.className}" ${t("joinSuccess")}`);
      setJoinModalOpen(false);
      setJoinCode("");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Geçersiz katılım kodu");
    } finally { setJoinLoading(false); }
  };

  const handlePasswordChange = async (values: any) => {
    setPasswordLoading(true);
    try {
      await authApi.changePassword({ oldPassword: values.currentPassword, newPassword: values.newPassword });
      message.success(t("passwordChanged"));
      passwordForm.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Hata oluştu");
    } finally { setPasswordLoading(false); }
  };

  if (pageLoading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;

  const initials = profile ? `${(profile.firstName || "")[0] || ""}${(profile.lastName || "")[0] || ""}` : "";

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("profile")}</Title>
        <Text style={{ color: colors.textMuted }}>{t("profileSubtitle")}</Text>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16, cursor: "pointer" }}
            onClick={() => setJoinModalOpen(true)}
            styles={{ body: { padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 } }}
          >
            <TeamOutlined style={{ fontSize: 22, color: colors.accent }} />
            <div>
              <Text style={{ color: colors.textSecondary, fontWeight: 600, display: "block" }}>{t("joinClass")}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t("joinClassSubtitle")}</Text>
            </div>
          </Card>

          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, textAlign: "center" }}>
            <Avatar size={80} style={{ background: colors.accentBg, color: colors.accent, fontSize: 28, fontWeight: 700, marginBottom: 16 }}>{initials}</Avatar>
            <Title level={5} style={{ color: colors.textPrimary, margin: "0 0 4px" }}>{profile?.firstName} {profile?.lastName}</Title>
            <Text style={{ color: colors.textMuted, display: "block", marginBottom: 16 }}>{profile?.email}</Text>
            <Divider style={{ borderColor: colors.dividerColor }} />
            <div style={{ textAlign: "left" }}>
              {profile?.studentNo && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <NumberOutlined style={{ color: colors.accent }} />
                  <div>
                    <Text style={{ color: colors.textMuted, fontSize: 11, display: "block" }}>{t("studentNo")}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{profile.studentNo}</Text>
                  </div>
                </div>
              )}
              {profile?.department && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <BookOutlined style={{ color: colors.accent }} />
                  <div>
                    <Text style={{ color: colors.textMuted, fontSize: 11, display: "block" }}>{t("department")}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{profile.department}</Text>
                  </div>
                </div>
              )}
              {profile?.className && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <IdcardOutlined style={{ color: colors.accent }} />
                  <div>
                    <Text style={{ color: colors.textMuted, fontSize: 11, display: "block" }}>{t("class")}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{profile.className}</Text>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("personalInfo")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            <Form form={profileForm} layout="vertical" onFinish={handleProfileUpdate} requiredMark={false}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="firstName" label={<Text style={{ color: colors.textSubtle }}>{t("firstName")}</Text>}>
                    <Input prefix={<UserOutlined style={{ color: colors.textDimmed }} />} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="lastName" label={<Text style={{ color: colors.textSubtle }}>{t("lastName")}</Text>}>
                    <Input prefix={<UserOutlined style={{ color: colors.textDimmed }} />} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="email" label={<Text style={{ color: colors.textSubtle }}>{t("email")}</Text>}>
                <Input prefix={<MailOutlined style={{ color: colors.textDimmed }} />} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}
                style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}>{t("save")}</Button>
            </Form>
          </Card>

          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("changePassword")}</span>}
            style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}>
            <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange} requiredMark={false}>
              <Form.Item name="currentPassword" label={<Text style={{ color: colors.textSubtle }}>{t("currentPassword")}</Text>}
                rules={[{ required: true, message: t("enterCurrentPassword") }]}>
                <Input.Password prefix={<LockOutlined style={{ color: colors.textDimmed }} />} />
              </Form.Item>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="newPassword" label={<Text style={{ color: colors.textSubtle }}>{t("newPassword")}</Text>}
                    rules={[{ required: true, min: 6, message: t("minChars") }]}>
                    <Input.Password prefix={<LockOutlined style={{ color: colors.textDimmed }} />} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="confirmPassword" label={<Text style={{ color: colors.textSubtle }}>{t("confirmPassword")}</Text>}
                    dependencies={["newPassword"]}
                    rules={[{ required: true, message: t("reenter") }, ({ getFieldValue }) => ({
                      validator(_, v) { if (!v || getFieldValue("newPassword") === v) return Promise.resolve(); return Promise.reject(new Error(t("noMatch"))); }
                    })]}>
                    <Input.Password prefix={<LockOutlined style={{ color: colors.textDimmed }} />} />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit" loading={passwordLoading} icon={<SaveOutlined />}
                style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}>{t("changePassword")}</Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Modal
        title={<span style={{ color: colors.textPrimary }}>{t("joinClass")}</span>}
        open={joinModalOpen}
        onCancel={() => { setJoinModalOpen(false); setJoinCode(""); }}
        footer={null}
      >
        <div style={{ padding: "8px 0" }}>
          <Text style={{ color: colors.textMuted, display: "block", marginBottom: 16 }}>
            {t("joinClassInstruction")}
          </Text>
          <Input
            placeholder={t("joinClassPlaceholder")}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onPressEnter={handleJoinClass}
            maxLength={6}
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, letterSpacing: 6, textAlign: "center", marginBottom: 16 }}
          />
          <Button
            type="primary"
            block
            loading={joinLoading}
            onClick={handleJoinClass}
            disabled={joinCode.trim().length < 4}
            style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}
          >
            {t("join")}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;

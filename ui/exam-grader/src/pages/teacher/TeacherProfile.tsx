import { useState } from "react";
import { Card, Typography, Input, Button, Avatar, Row, Col, Form, Divider, message } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, SaveOutlined, BookOutlined, IdcardOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;

const TeacherProfile = () => {
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const colors = useThemeColors();
  const t = useT();

  const handleProfileUpdate = async () => { setLoading(true); setTimeout(() => { message.success(t("profileUpdated")); setLoading(false); }, 1000); };
  const handlePasswordChange = async () => { setPasswordLoading(true); setTimeout(() => { message.success(t("passwordChanged")); setPasswordLoading(false); }, 1000); };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("profile")}</Title>
        <Text style={{ color: colors.textMuted }}>{t("profileSubtitle")}</Text>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, textAlign: "center" }}>
            <Avatar size={80} style={{ background: colors.accentBg, color: colors.accent, fontSize: 28, fontWeight: 700, marginBottom: 16 }}>AY</Avatar>
            <Title level={5} style={{ color: colors.textPrimary, margin: "0 0 4px" }}>Prof. Dr. Ahmet Yılmaz</Title>
            <Text style={{ color: colors.textMuted, display: "block", marginBottom: 16 }}>ahmet.yilmaz@univ.edu.tr</Text>
            <Divider style={{ borderColor: colors.dividerColor }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <IdcardOutlined style={{ color: colors.accent }} /><div><Text style={{ color: colors.textMuted, fontSize: 11, display: "block" }}>{t("titleLabel")}</Text><Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t("professor")}</Text></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <BookOutlined style={{ color: colors.accent }} /><div><Text style={{ color: colors.textMuted, fontSize: 11, display: "block" }}>{t("department")}</Text><Text style={{ color: colors.textSecondary, fontSize: 13 }}>Bilgisayar Mühendisliği</Text></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <UserOutlined style={{ color: colors.accent }} /><div><Text style={{ color: colors.textMuted, fontSize: 11, display: "block" }}>{t("activeCourses")}</Text><Text style={{ color: colors.textSecondary, fontSize: 13 }}>4 {t("coursesCount")}</Text></div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("personalInfo")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }}>
            <Form layout="vertical" onFinish={handleProfileUpdate} requiredMark={false}>
              <Row gutter={16}>
                <Col xs={24} sm={12}><Form.Item name="firstName" label={<Text style={{ color: colors.textSubtle }}>{t("firstName")}</Text>} initialValue="Ahmet"><Input prefix={<UserOutlined style={{ color: colors.textDimmed }} />} /></Form.Item></Col>
                <Col xs={24} sm={12}><Form.Item name="lastName" label={<Text style={{ color: colors.textSubtle }}>{t("lastName")}</Text>} initialValue="Yılmaz"><Input prefix={<UserOutlined style={{ color: colors.textDimmed }} />} /></Form.Item></Col>
              </Row>
              <Form.Item name="email" label={<Text style={{ color: colors.textSubtle }}>{t("email")}</Text>} initialValue="ahmet.yilmaz@univ.edu.tr"><Input prefix={<MailOutlined style={{ color: colors.textDimmed }} />} /></Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}>{t("save")}</Button>
            </Form>
          </Card>
          <Card title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("changePassword")}</span>} style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}>
            <Form layout="vertical" onFinish={handlePasswordChange} requiredMark={false}>
              <Form.Item name="currentPassword" label={<Text style={{ color: colors.textSubtle }}>{t("currentPassword")}</Text>} rules={[{ required: true, message: t("enterCurrentPassword") }]}><Input.Password prefix={<LockOutlined style={{ color: colors.textDimmed }} />} /></Form.Item>
              <Row gutter={16}>
                <Col xs={24} sm={12}><Form.Item name="newPassword" label={<Text style={{ color: colors.textSubtle }}>{t("newPassword")}</Text>} rules={[{ required: true, min: 6, message: t("minChars") }]}><Input.Password prefix={<LockOutlined style={{ color: colors.textDimmed }} />} /></Form.Item></Col>
                <Col xs={24} sm={12}><Form.Item name="confirmPassword" label={<Text style={{ color: colors.textSubtle }}>{t("confirmPassword")}</Text>} dependencies={["newPassword"]} rules={[{ required: true, message: t("reenter") }, ({ getFieldValue }) => ({ validator(_, v) { if (!v || getFieldValue("newPassword") === v) return Promise.resolve(); return Promise.reject(new Error(t("noMatch"))); } })]}><Input.Password prefix={<LockOutlined style={{ color: colors.textDimmed }} />} /></Form.Item></Col>
              </Row>
              <Button type="primary" htmlType="submit" loading={passwordLoading} icon={<SaveOutlined />} style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}>{t("changePassword")}</Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherProfile;
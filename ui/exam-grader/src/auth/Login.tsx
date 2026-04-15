import { useState, useMemo } from "react";
import HeaderActions from "../components/HeaderActions";
import { Form, Input, Button, Checkbox, message } from "antd";
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CodeOutlined,
} from "@ant-design/icons";
import { useThemeColors } from "../theme/themeConfig";
import { useT } from "../hooks/useT";
import { useAppStore } from "../store/useAppStore";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const colors = useThemeColors();
  const t = useT();
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);

  const onFinish = async (values: { email: string; password: string }) => {
  setLoading(true);
  try {
    const res = await authApi.login({
      email: values.email,
      password: values.password,
    });

    if (res.success) {
      setAuth(res.data.token, {
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        role: res.data.role,
      });

      // Role'e göre yönlendir
      switch (res.data.role) {
        case "Admin":
          navigate("/admin");
          break;
        case "Teacher":
          navigate("/teacher");
          break;
        case "Student":
          navigate("/student");
          break;
        default:
          navigate("/login");
      }
    }
  } catch (error: any) {
    message.error(
      error.response?.data?.message || "Giriş başarısız!"
    );
  } finally {
    setLoading(false);
  }
};

  const particlePositions: React.CSSProperties[] = [
    { top: "8%", left: "5%", animationDelay: "0s" },
    { top: "15%", right: "10%", animationDelay: "1.5s" },
    { top: "35%", left: "12%", animationDelay: "3s" },
    { top: "50%", right: "5%", animationDelay: "0.8s" },
    { top: "70%", left: "8%", animationDelay: "2.2s" },
    { top: "80%", right: "15%", animationDelay: "4s" },
    { top: "25%", left: "45%", animationDelay: "1s" },
    { top: "60%", left: "40%", animationDelay: "2.8s" },
    { top: "90%", left: "20%", animationDelay: "3.5s" },
    { top: "5%", left: "35%", animationDelay: "0.5s" },
  ];

  const responsiveCSS = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=DM+Sans:wght@400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.15; }
      50% { transform: translateY(-20px) rotate(10deg); opacity: 0.35; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.15); }
      50% { box-shadow: 0 0 40px rgba(0, 255, 255, 0.3); }
    }

    .particle {
      animation: float 6s ease-in-out infinite;
    }

    .login-container {
      animation: slideUp 0.8s ease-out;
    }

    .mobile-logo { display: none !important; }

    /* Ant Design overrides */
    .ant-input, .ant-input-password {
      background: ${colors.inputBg} !important;
      border: ${colors.borderInput} !important;
      color: ${colors.textSecondary} !important;
      border-radius: 10px !important;
      transition: all 0.3s ease !important;
    }
    .ant-input:focus, .ant-input-focused,
    .ant-input-password:focus-within {
      border-color: ${colors.accent} !important;
      box-shadow: 0 0 0 2px ${colors.accentSubtle} !important;
    }
    .ant-input::placeholder { color: ${colors.textDimmed} !important; }
    .ant-input-prefix { margin-right: 10px !important; }
    .ant-form-item-explain-error { font-size: 12px !important; }
    .ant-checkbox-wrapper { color: ${colors.textDimmed} !important; }
    .ant-input-password .ant-input { background: transparent !important; border: none !important; box-shadow: none !important; }

    /* Tablet */
    @media (max-width: 1024px) {
      .left-panel { flex: 0 0 40% !important; }
      .right-panel { flex: 0 0 60% !important; }
    }

    /* Mobile */
    @media (max-width: 768px) {
      .login-container {
        flex-direction: column !important;
        max-width: 100% !important;
        height: 100vh !important;
        border-radius: 0 !important;
      }
      .left-panel { display: none !important; }
      .right-panel {
        flex: 1 !important;
        padding: 40px 24px !important;
        justify-content: center !important;
      }
      .mobile-logo { display: flex !important; }
    }
  `;

  const styles = useMemo((): Record<string, React.CSSProperties> => ({
    wrapper: {
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: colors.loginWrapperBg,
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
      padding: 20,
    },
    particleContainer: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 0,
    },
    particle: {
      position: "absolute",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 16,
      color: colors.accent,
      opacity: 0.15,
      userSelect: "none",
    },
    container: {
      display: "flex",
      width: "100%",
      maxWidth: 1000,
      minHeight: 600,
      borderRadius: 20,
      overflow: "hidden",
      background: colors.containerBg,
      border: colors.borderContainer,
      backdropFilter: "blur(20px)",
      position: "relative",
      zIndex: 1,
    },
    leftPanel: {
      flex: "0 0 45%",
      background: colors.loginLeftBg,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "50px 40px",
      position: "relative",
      overflow: "hidden",
      borderRight: colors.borderPrimary,
    },
    leftDecor: {
      position: "absolute",
      bottom: -80,
      right: -80,
      width: 250,
      height: 250,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(0,255,255,0.06) 0%, transparent 70%)",
      pointerEvents: "none",
    },
    brandContent: {
      position: "relative",
      zIndex: 1,
    },
    logoIcon: {
      width: 72,
      height: 72,
      borderRadius: 18,
      background: "rgba(0,255,255,0.06)",
      border: "1px solid rgba(0,255,255,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 28,
    },
    brandTitle: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 34,
      fontWeight: 800,
      color: "#f0f0f0",
      marginBottom: 12,
      letterSpacing: "-0.5px",
    },
    brandSubtitle: {
      fontSize: 15,
      color: "#7a8ba3",
      lineHeight: 1.6,
      marginBottom: 36,
    },
    featureList: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
    },
    featureItem: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontSize: 14,
      color: "#8a9ab5",
    },
    featureDot: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#0ff",
      flexShrink: 0,
    },
    rightPanel: {
      flex: "0 0 55%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "50px 48px",
      background: colors.loginRightBg,
    },
    formWrapper: {
      width: "100%",
      maxWidth: 380,
    },
    mobileLogo: {
      alignItems: "center",
      gap: 10,
      marginBottom: 32,
      display: "none",
    },
    mobileLogoText: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 22,
      fontWeight: 800,
      color: colors.textPrimary,
    },
    formTitle: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 26,
      fontWeight: 700,
      color: colors.textPrimary,
      marginBottom: 6,
    },
    formSubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 36,
    },
    input: {
      height: 48,
      background: colors.inputBg,
      border: colors.borderInput,
      borderRadius: 10,
      color: colors.textSecondary,
      fontSize: 14,
    },
    formOptions: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    forgotLink: {
      fontSize: 13,
      color: colors.accent,
      textDecoration: "none",
    },
    submitBtn: {
      height: 48,
      borderRadius: 10,
      background: "linear-gradient(135deg, #00b8d4, #00e5ff)",
      border: "none",
      fontWeight: 600,
      fontSize: 15,
      letterSpacing: "0.3px",
      boxShadow: "0 4px 20px rgba(0,255,255,0.2)",
    },
    divider: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      margin: "24px 0",
    },
    dividerLine: {
      flex: 1,
      height: 1,
      background: colors.dividerColor,
    },
    dividerText: {
      fontSize: 13,
      color: colors.textDimmed,
    },
    registerText: {
      textAlign: "center",
      fontSize: 14,
      color: colors.textMuted,
    },
    registerLink: {
      color: colors.accent,
      fontWeight: 600,
      textDecoration: "none",
    },
  }), [colors]);

  return (
    <div style={styles.wrapper}>
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 10 }}>
          <HeaderActions />
       </div>
      <style>{responsiveCSS}</style>

      {/* Floating code particles */}
      <div style={styles.particleContainer}>
        {["{ }", "< />", "=>", "( )", "[ ]", "&&", "||", "!=", "++", "**"].map((symbol, i) => (
          <span key={i} className="particle" style={{ ...styles.particle, ...particlePositions[i] }}>
            {symbol}
          </span>
        ))}
      </div>

      <div className="login-container" style={styles.container}>
        {/* Left panel - branding */}
        <div className="left-panel" style={styles.leftPanel}>
          <div style={styles.brandContent}>
            <div style={styles.logoIcon}>
              <CodeOutlined style={{ fontSize: 40, color: "#0ff" }} />
            </div>
            <h1 style={styles.brandTitle}>Codex<span style={{ color: "#0ff" }}>IQ</span></h1>
            <p style={styles.brandSubtitle}>
              {t("brandSubtitle")}
            </p>
            <div style={styles.featureList}>
              {[
                t("feature1"),
                t("feature2"),
                t("feature3"),
              ].map((text, i) => (
                <div key={i} style={styles.featureItem}>
                  <div style={styles.featureDot} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={styles.leftDecor} />
        </div>

        {/* Right panel - form */}
        <div className="right-panel" style={styles.rightPanel}>
          <div style={styles.formWrapper}>
            <div className="mobile-logo" style={styles.mobileLogo}>
              <CodeOutlined style={{ fontSize: 28, color: colors.accent }} />
              <span style={styles.mobileLogoText}>Code<span style={{ color: colors.accent }}>Grade</span></span>
            </div>

            <h2 style={styles.formTitle}>{t("welcome")}</h2>
            <p style={styles.formSubtitle}>{t("loginSubtitle")}</p>

            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              requiredMark={false}
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "E-posta adresinizi girin" },
                  { type: "email", message: "Geçerli bir e-posta girin" },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: colors.textDimmed }} />}
                  placeholder={t("email")}
                  style={styles.input}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: "Şifrenizi girin" }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: colors.textDimmed }} />}
                  placeholder={t("password")}
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                  style={styles.input}
                />
              </Form.Item>

              <div style={styles.formOptions}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox style={{ color: colors.textDimmed }}>{t("rememberMe")}</Checkbox>
                </Form.Item>
                <a style={styles.forgotLink} href="#">
                  {t("forgotPassword")}
                </a>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={styles.submitBtn}
                >
                  {t("login")}
                </Button>
              </Form.Item>
            </Form>

            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>{t("or")}</span>
              <div style={styles.dividerLine} />
            </div>

            <p style={styles.registerText}>
              {t("noAccount")}{" "}
              <a style={styles.registerLink} href="#">
                {t("register")}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
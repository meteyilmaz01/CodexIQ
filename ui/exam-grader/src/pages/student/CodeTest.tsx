import { useState } from "react";
import { Card, Typography, Button, Select, Tabs, Upload, message, Spin, Input, Row, Col, Tag } from "antd";
import {
  PlayCircleOutlined,
  UploadOutlined,
  CameraOutlined,
  CodeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  FileImageOutlined,
  EditOutlined,
  ScanOutlined,
} from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const languages = [
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
];

const CodeTest = () => {
  const [language, setLanguage] = useState("c");
  const [code, setCode] = useState(`#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");

  // Image upload states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertedCode, setConvertedCode] = useState<string | null>(null);

  const colors = useThemeColors();
  const t = useT();

  const handleRun = async () => {
    setRunning(true);
    setOutput("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5062/api'}/student/run-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setOutput(data.output || data.data?.output || '');
    } catch {
      setOutput('⚠ Kod çalıştırma servisi şu an kullanılamıyor.\nLütfen daha sonra tekrar deneyin.');
    } finally {
      setRunning(false);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setConvertedCode(null);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleConvert = async () => {
    if (!uploadedImage) return;
    setConverting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5062/api'}/student/convert-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ imageBase64: uploadedImage, language }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setConvertedCode(data.code || data.data?.code || '// Kod çevrilemedi');
      message.success(t("codeConvertedSuccess"));
    } catch (err: any) {
      message.error('Kod çevirme başarısız: ' + (err.message || 'Bilinmeyen hata'));
      setConvertedCode(null);
    } finally {
      setConverting(false);
    }
  };

  const handleUseConvertedCode = () => {
    if (convertedCode) {
      setCode(convertedCode);
      setActiveTab("editor");
      message.success(t("codeTransferredToEditor"));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>
            {t("codeTest")}
          </Title>
          <Text style={{ color: colors.textMuted }}>{t("codeTestSubtitle")}</Text>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Select value={language} onChange={setLanguage} options={languages} style={{ width: 140 }} />
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleRun}
            loading={running}
            style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600 }}
          >
            {t("run")}
          </Button>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "editor",
            label: (
              <span>
                <CodeOutlined style={{ marginRight: 6 }} />
                {t("codeEditor")}
              </span>
            ),
            children: (
              <Row gutter={[16, 16]}>
                {/* Code Editor */}
                <Col xs={24} lg={14}>
                  <Card
                    style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}
                    styles={{ body: { padding: 0 } }}
                  >
                    <div
                      style={{
                        padding: "8px 16px",
                        borderBottom: colors.borderSubtle,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
                      </div>
                      <Tag style={{ borderRadius: 6 }}>{languages.find((l) => l.value === language)?.label}</Tag>
                    </div>
                    <TextArea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      autoSize={{ minRows: 20, maxRows: 35 }}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        lineHeight: 1.8,
                        background: "transparent",
                        border: "none",
                        padding: "16px 20px",
                        color: colors.textSecondary,
                        resize: "none",
                      }}
                      spellCheck={false}
                    />
                  </Card>
                </Col>

                {/* Output Panel */}
                <Col xs={24} lg={10}>
                  <Card
                    title={<span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>{t("output")}</span>}
                    extra={output && <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => setOutput("")} style={{ color: colors.textMuted }} />}
                    style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, height: "100%" }}
                  >
                    {running ? (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: colors.accent }} />} />
                        <Text style={{ display: "block", color: colors.textMuted, marginTop: 12 }}>{t("codeRunning")}</Text>
                      </div>
                    ) : output ? (
                      <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: output.startsWith('⚠') ? "#faad14" : "#52c41a", margin: 0, whiteSpace: "pre-wrap" }}>
                        <CheckCircleOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                        {output}
                      </pre>
                    ) : (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <PlayCircleOutlined style={{ fontSize: 32, color: colors.textDimmed }} />
                        <Text style={{ display: "block", color: colors.textMuted, marginTop: 12 }}>{t("clickRunToExecute")}</Text>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: "upload",
            label: (
              <span>
                <CameraOutlined style={{ marginRight: 6 }} />
                {t("uploadImage")}
              </span>
            ),
            children: (
              <Row gutter={[16, 16]}>
                {/* Upload Area */}
                <Col xs={24} lg={12}>
                  <Card
                    title={
                      <span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>
                        <FileImageOutlined style={{ marginRight: 8 }} />
                        {t("handwrittenCodeImage")}
                      </span>
                    }
                    style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }}
                  >
                    {!uploadedImage ? (
                      <Dragger
                        accept="image/*"
                        showUploadList={false}
                        beforeUpload={handleImageUpload}
                        style={{ background: colors.draggerBg, border: colors.draggerBorder, borderRadius: 12, padding: "40px 20px" }}
                      >
                        <p><UploadOutlined style={{ fontSize: 40, color: colors.accent }} /></p>
                        <p style={{ color: colors.textSecondary, fontSize: 15, marginTop: 12 }}>{t("dragDropCodeImage")}</p>
                        <p style={{ color: colors.textMuted, fontSize: 13 }}>{t("supportedFormats")}</p>
                      </Dragger>
                    ) : (
                      <div>
                        <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", marginBottom: 16, border: colors.borderPrimary }}>
                          <img src={uploadedImage} alt="Uploaded code" style={{ width: "100%", display: "block" }} />
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          <Button danger icon={<DeleteOutlined />} onClick={() => { setUploadedImage(null); setConvertedCode(null); }}>
                            {t("remove")}
                          </Button>
                          <Button
                            type="primary"
                            icon={<ScanOutlined />}
                            onClick={handleConvert}
                            loading={converting}
                            style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontWeight: 600, flex: 1 }}
                          >
                            {t("convertToDigital")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </Col>

                {/* Converted Code */}
                <Col xs={24} lg={12}>
                  <Card
                    title={
                      <span style={{ color: colors.textPrimary, fontFamily: "'JetBrains Mono'", fontSize: 14 }}>
                        <EditOutlined style={{ marginRight: 8 }} />
                        {t("convertedCode")}
                      </span>
                    }
                    extra={
                      convertedCode && (
                        <Button
                          type="primary"
                          size="small"
                          icon={<CodeOutlined />}
                          onClick={handleUseConvertedCode}
                          style={{ background: "linear-gradient(135deg, #00b8d4, #00e5ff)", border: "none", fontSize: 12 }}
                        >
                          {t("transferToEditor")}
                        </Button>
                      )
                    }
                    style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, height: "100%" }}
                  >
                    {converting ? (
                      <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 28, color: colors.accent }} />} />
                        <Text style={{ display: "block", color: colors.textMuted, marginTop: 16 }}>{t("convertingWithVisionLLM")}</Text>
                        <Text style={{ display: "block", color: colors.textDimmed, fontSize: 12, marginTop: 4 }}>{t("thisOperationMayTakeFewSeconds")}</Text>
                      </div>
                    ) : convertedCode ? (
                      <TextArea
                        value={convertedCode}
                        onChange={(e) => setConvertedCode(e.target.value)}
                        autoSize={{ minRows: 15, maxRows: 30 }}
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13,
                          lineHeight: 1.8,
                          background: colors.draggerBg,
                          border: colors.borderInput,
                          borderRadius: 8,
                          color: colors.textSecondary,
                        }}
                        spellCheck={false}
                      />
                    ) : (
                      <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <ScanOutlined style={{ fontSize: 36, color: colors.textDimmed }} />
                        <Text style={{ display: "block", color: colors.textMuted, marginTop: 12 }}>{t("uploadAndClickConvert")}</Text>
                        <Text style={{ display: "block", color: colors.textDimmed, fontSize: 12, marginTop: 4 }}>{t("handwrittenCodeAutoConvert")}</Text>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </div>
  );
};

export default CodeTest;
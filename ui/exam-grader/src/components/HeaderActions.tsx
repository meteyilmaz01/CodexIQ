import type { CSSProperties } from "react";
import { Button, Tooltip } from "antd";
import { GlobalOutlined, SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useAppStore } from "../store/useAppStore";
import { useThemeColors } from "../theme/themeConfig";

type HeaderActionsProps = {
  style?: CSSProperties;
};

const HeaderActions = ({ style }: HeaderActionsProps) => {
  const { theme, language, toggleTheme, setLanguage } = useAppStore();
  const colors = useThemeColors();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, ...style }}>
      <Tooltip title={theme === "dark" ? "Light Mode" : "Dark Mode"}>
        <Button
          type="text"
          icon={
            theme === "dark" ? (
              <SunOutlined style={{ color: "#faad14", fontSize: 16 }} />
            ) : (
              <MoonOutlined style={{ color: "#1890ff", fontSize: 16 }} />
            )
          }
          onClick={toggleTheme}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: colors.headerBg,
            border: colors.borderContainer,
            color: colors.textSecondary,
            boxShadow: "0 8px 24px -18px rgba(0,0,0,0.45)",
          }}
        />
      </Tooltip>

      <Button
        type="text"
        onClick={() => setLanguage(language === "tr" ? "en" : "tr")}
        style={{
          height: 48,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
          background: colors.headerBg,
          border: colors.borderContainer,
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          boxShadow: "0 8px 24px -18px rgba(0,0,0,0.45)",
        }}
      >
        <GlobalOutlined style={{ fontSize: 15 }} />
        {language === "tr" ? "TR" : "EN"}
      </Button>
    </div>
  );
};

export default HeaderActions;

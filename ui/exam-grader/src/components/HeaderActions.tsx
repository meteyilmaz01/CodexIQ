import { Dropdown, Button, Tooltip } from "antd";
import { GlobalOutlined, SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useAppStore } from "../store/useAppStore";
import { useThemeColors } from "../theme/themeConfig";

const HeaderActions = () => {
  const { theme, language, toggleTheme, setLanguage } = useAppStore();
  const colors = useThemeColors();

  const langItems = {
    items: [
      {
        key: "tr",
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🇹🇷</span>
            <span>Türkçe</span>
          </div>
        ),
      },
      {
        key: "en",
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🇬🇧</span>
            <span>English</span>
          </div>
        ),
      },
    ],
    onClick: ({ key }: { key: string }) => setLanguage(key as "tr" | "en"),
    selectedKeys: [language],
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {/* Theme Toggle */}
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
            width: 36,
            height: 36,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: theme === "dark" ? "rgba(250,173,20,0.1)" : "rgba(24,144,255,0.1)",
            border: `1px solid ${theme === "dark" ? "rgba(250,173,20,0.2)" : "rgba(24,144,255,0.2)"}`,
          }}
        />
      </Tooltip>

      {/* Language Switcher */}
      <Dropdown menu={langItems} placement="bottomRight" trigger={["click"]}>
        <Button
          type="text"
          style={{
            height: 36,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 10px",
            background: colors.accentSubtle,
            border: `1px solid ${colors.accentBorderSolid}`,
            color: colors.accent,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <GlobalOutlined style={{ fontSize: 14 }} />
          {language === "tr" ? "TR" : "EN"}
        </Button>
      </Dropdown>
    </div>
  );
};

export default HeaderActions;
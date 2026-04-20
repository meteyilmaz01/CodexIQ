import { useState, useEffect } from "react";
import HeaderActions from "../../components/HeaderActions";
import { Layout, Menu, Avatar, Badge, Dropdown, Typography, Drawer, Grid, Popover } from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  CodeOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { studentApi } from "../../api/studentApi";

const { Sider, Header, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const StudentLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const colors = useThemeColors();
  const t = useT();

  const isMobile = !screens.md;

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setDrawerOpen(false);
  };

  const menuItems = [
    { key: "/student", icon: <DashboardOutlined />, label: t("dashboard") },
    { key: "/student/results", icon: <FileTextOutlined />, label: t("examResults") },
    { key: "/student/code-test", icon: <CodeOutlined />, label: t("codeTest") },
    { key: "/student/messages", icon: <MessageOutlined />, label: t("messages") },
    { key: "/student/profile", icon: <UserOutlined />, label: t("profile") },
  ];

  const userMenuItems = [
    { key: "profile", icon: <UserOutlined />, label: t("profile") },
    { type: "divider" as const },
    { key: "logout", icon: <LogoutOutlined />, label: t("logout"), danger: true },
  ];

  const handleUserMenu = (info: { key: string }) => {
    if (info.key === "profile") handleNavigate("/student/profile");
    if (info.key === "logout") handleNavigate("/login");
  };

  const AnnouncementsPopover = () => {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [open, setOpen] = useState(false);

    const loadAnnouncements = async () => {
      try {
        const res = await studentApi.getAnnouncements();
        const data = res.data || res;
        setAnnouncements(Array.isArray(data) ? data : data.items || []);
      } catch { setAnnouncements([]); }
    };

    useEffect(() => { loadAnnouncements(); }, []);

    const content = (
      <div style={{ width: 300, maxHeight: 400, overflowY: "auto" }}>
        {announcements.length === 0
          ? <Text style={{ color: colors.textMuted }}>Duyuru yok</Text>
          : announcements.map((a: any) => (
              <div key={a.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: colors.borderSubtle }}>
                <Text style={{ color: colors.textSecondary, fontWeight: 600, display: "block" }}>{a.title}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{a.content}</Text>
              </div>
            ))
        }
      </div>
    );

    return (
      <Popover content={content} title="Duyurular" trigger="click" open={open} onOpenChange={setOpen} placement="bottomRight">
        <Badge count={announcements.length} size="small" style={{ cursor: "pointer" }}>
          <BellOutlined style={{ fontSize: 18, color: colors.textSubtle, cursor: "pointer" }} />
        </Badge>
      </Popover>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        style={{
          padding: collapsed && !isMobile ? "20px 12px" : "20px 20px",
          borderBottom: colors.borderPrimary,
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: collapsed && !isMobile ? "center" : "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CodeOutlined style={{ fontSize: 24, color: colors.accent }} />
          {(!collapsed || isMobile) && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 18,
                fontWeight: 800,
                color: colors.textPrimary,
              }}
            >
              Codex<span style={{ color: colors.accent }}>IQ</span>
            </span>
          )}
        </div>
        {isMobile && (
          <CloseOutlined
            onClick={() => setDrawerOpen(false)}
            style={{ color: colors.textMuted, fontSize: 16, cursor: "pointer" }}
          />
        )}
      </div>

      {/* Menu */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => handleNavigate(key)}
        style={{
          background: "transparent",
          borderRight: "none",
          padding: "12px 8px",
          flex: 1,
        }}
      />

      {/* User info */}
      {(!collapsed || isMobile) && (
        <div
          style={{
            padding: "16px 20px",
            borderTop: colors.borderPrimary,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Avatar size={32} style={{ background: colors.accentBg, color: colors.accent }}>
            ÖĞ
          </Avatar>
          <div>
            <Text style={{ color: colors.textSecondary, fontSize: 13, display: "block" }}>Öğrenci Adı</Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>Bilgisayar Müh.</Text>
          </div>
        </div>
      )}
    </>
  );

  return (
    <Layout style={{ minHeight: "100vh", background: colors.pageBg }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          width={240}
          collapsedWidth={72}
          style={{
            background: colors.sidebarBg,
            borderRight: colors.borderPrimary,
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {sidebarContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={260}
          closable={false}
          styles={{
            body: {
              padding: 0,
              background: colors.drawerBg,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 72 : 240,
          transition: "margin-left 0.2s",
          background: colors.pageBg,
        }}
      >
        {/* Top Header */}
        <Header
          style={{
            background: colors.headerBg,
            backdropFilter: "blur(10px)",
            borderBottom: colors.borderPrimary,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 99,
            height: 56,
          }}
        >
          <div
            onClick={() => (isMobile ? setDrawerOpen(true) : setCollapsed(!collapsed))}
            style={{ cursor: "pointer", color: colors.textSubtle, fontSize: 18 }}
          >
            {isMobile ? <MenuOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <HeaderActions />
            <AnnouncementsPopover />
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} placement="bottomRight">
              <Avatar
                size={34}
                style={{ background: colors.accentBg, color: colors.accent, cursor: "pointer" }}
              >
                ÖĞ
              </Avatar>
            </Dropdown>
          </div>
        </Header>

        {/* Page Content */}
        <Content style={{ padding: isMobile ? 12 : 24, minHeight: "calc(100vh - 56px)" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;
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
  BarChartOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { studentApi } from "../../api/studentApi";
import { useAppStore } from "../../store/useAppStore";

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
  const user = useAppStore((s) => s.user);

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
    { key: "/student/analytics", icon: <BarChartOutlined />, label: t("analytics") },
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
    const innerNavigate = useNavigate();
    const storeUser = useAppStore((s) => s.user);
    // Token yerine kullanıcı adı tabanlı key — her girişte sıfırlanmaz
    const storageKey = `readNotifications:${storeUser?.firstName ?? ""}${storeUser?.lastName ?? ""}`;
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [examNotifs, setExamNotifs] = useState<any[]>([]);
    const [readIds, setReadIds] = useState<Set<string>>(() => {
      try { return new Set(JSON.parse(localStorage.getItem(storageKey) || "[]")); }
      catch { return new Set(); }
    });
    const [open, setOpen] = useState(false);

    useEffect(() => {
      studentApi.getAnnouncements()
        .then((res) => { const d = res.data || res; setAnnouncements(Array.isArray(d) ? d : d.items || []); })
        .catch(() => setAnnouncements([]));
      studentApi.getExamNotifications()
        .then((res) => { const d = res.data || res; setExamNotifs(Array.isArray(d) ? d : []); })
        .catch(() => setExamNotifs([]));
    }, []);

    useEffect(() => {
      if (!open) return;
      const allIds = [
        ...announcements.map((a: any) => `ann_${a.id}`),
        ...examNotifs.map((n: any) => `exam_${n.type}_${n.examPaperId}`),
      ];
      if (allIds.length === 0) return;
      const next = new Set([...readIds, ...allIds]);
      setReadIds(next);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
    }, [open]);

    const notifKey = (n: any) => `exam_${n.type}_${n.examPaperId}`;

    const unreadCount =
      announcements.filter((a: any) => !readIds.has(`ann_${a.id}`)).length +
      examNotifs.filter((n: any) => !readIds.has(notifKey(n))).length;

    const renderExamNotif = (n: any) => {
      const isOverride = n.type === "overridden";
      const key = notifKey(n);
      const isRead = readIds.has(key);
      const accentColor = isOverride ? "#faad14" : colors.accent;
      return (
        <div
          key={key}
          onClick={() => { innerNavigate(`/student/results/${n.examPaperId}`); setOpen(false); }}
          style={{
            marginBottom: 10, borderBottom: colors.borderSubtle,
            cursor: "pointer", borderRadius: 6, padding: "8px 10px",
            background: isRead ? "transparent" : `${accentColor}15`,
          }}
        >
          <Text style={{ color: isOverride ? "#faad14" : colors.textSecondary, fontWeight: 600, display: "block", fontSize: 13 }}>
            {isOverride ? "✏️ Puanınız güncellendi" : "📄 Sınavınız değerlendirildi"}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            {n.examName} — {n.courseName}
          </Text>
          {isOverride && n.originalScore != null && n.newScore != null && (
            <Text style={{ color: "#faad14", fontSize: 12, fontWeight: 600 }}>
              {n.originalScore} → {n.newScore} puan
            </Text>
          )}
          <Text style={{ color: colors.textDimmed, fontSize: 11, display: "block" }}>
            {new Date(n.evaluatedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </Text>
        </div>
      );
    };

    const content = (
      <div style={{ width: 320, maxHeight: 440, overflowY: "auto" }}>
        {examNotifs.length > 0 && (
          <>
            <Text style={{ color: colors.accent, fontSize: 11, fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 8 }}>
              SINAV BİLDİRİMLERİ
            </Text>
            {examNotifs.map(renderExamNotif)}
          </>
        )}

        {announcements.length > 0 && (
          <>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 8, marginTop: examNotifs.length > 0 ? 8 : 0 }}>
              DUYURULAR
            </Text>
            {announcements.map((a: any) => (
              <div key={a.id} style={{
                marginBottom: 10, paddingBottom: 10, borderBottom: colors.borderSubtle,
                borderRadius: 6, padding: "8px 10px",
                background: readIds.has(`ann_${a.id}`) ? "transparent" : `${colors.accent}10`,
              }}>
                <Text style={{ color: colors.textSecondary, fontWeight: 600, display: "block", fontSize: 13 }}>{a.title}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{a.content}</Text>
              </div>
            ))}
          </>
        )}

        {announcements.length === 0 && examNotifs.length === 0 && (
          <Text style={{ color: colors.textMuted }}>Bildirim yok</Text>
        )}
      </div>
    );

    return (
      <Popover content={content} title="Bildirimler" trigger="click" open={open} onOpenChange={setOpen} placement="bottomRight">
        <Badge count={unreadCount} size="small" style={{ cursor: "pointer" }}>
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
            {user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "ÖĞ"}
          </Avatar>
          <div>
            <Text style={{ color: colors.textSecondary, fontSize: 13, display: "block" }}>
              {user ? `${user.firstName} ${user.lastName}` : ""}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>{t("student")}</Text>
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
            height: 72,
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
                {user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "ÖĞ"}
              </Avatar>
            </Dropdown>
          </div>
        </Header>

        {/* Page Content */}
        <Content style={{ padding: isMobile ? 12 : 24, minHeight: "calc(100vh - 72px)" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;
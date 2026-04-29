import { useState, useEffect, useRef } from "react";
import { Card, Table, Tag, Typography, Input, Select, Spin } from "antd";
import { SearchOutlined, InfoCircleOutlined, WarningOutlined, CloseCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useThemeColors } from "../../theme/themeConfig";
import { useT } from "../../hooks/useT";
import { adminApi } from "../../api/adminApi";
import * as signalR from "@microsoft/signalr";

const { Title, Text } = Typography;

const SystemLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const colors = useThemeColors();
  const t = useT();

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await adminApi.getLogs(100);
        const data = res.data || res;
        setLogs(Array.isArray(data) ? data : data.items || data.results || []);
      } catch { setLogs([]); }
      finally { setLoading(false); }
    };
    loadLogs();
  }, []);

  // SignalR bağlantısı
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:5062";
    const token = localStorage.getItem("token");

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/logs`, {
        accessTokenFactory: () => token || "",
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveLog", (log: any) => {
      setLogs((prev) => [log, ...prev].slice(0, 200));
    });

    connection.start().catch((err) => console.warn("LogHub bağlantı hatası:", err));

    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, []);

  const filtered = logs.filter((l: any) => {
    const msg = l.message || "";
    const src = l.source || "";
    const matchSearch = msg.toLowerCase().includes(search.toLowerCase()) || src.toLowerCase().includes(search.toLowerCase());
    const matchLevel = !levelFilter || l.level === levelFilter;
    const matchSource = !sourceFilter || l.source === sourceFilter;
    return matchSearch && matchLevel && matchSource;
  });

  const sources = [...new Set(logs.map((l: any) => l.source).filter(Boolean))];

  const getLevelConfig = (level: string) => {
    switch (level) {
      case "INFO": case "Information": return { color: "blue", icon: <InfoCircleOutlined /> };
      case "WARNING": case "Warning": return { color: "orange", icon: <WarningOutlined /> };
      case "ERROR": case "Error": return { color: "red", icon: <CloseCircleOutlined /> };
      default: return { color: "default", icon: <CheckCircleOutlined /> };
    }
  };

  const columns = [
    { title: t("time"), key: "timestamp", width: 170, render: (_: unknown, r: any) => <Text style={{ color: colors.textMuted, fontSize: 12, fontFamily: "'JetBrains Mono'" }}>{r.timestamp || r.createdAt || ""}</Text> },
    { title: t("level"), dataIndex: "level", key: "level", width: 100, render: (l: string) => { const c = getLevelConfig(l); return <Tag icon={c.icon} color={c.color} style={{ borderRadius: 4 }}>{l}</Tag>; } },
    { title: t("source"), dataIndex: "source", key: "source", width: 130, responsive: ["md" as const], render: (s: string) => <Tag style={{ borderRadius: 6, fontFamily: "'JetBrains Mono'", fontSize: 11 }}>{s || "-"}</Tag> },
    { title: t("messageLabel"), dataIndex: "message", key: "message", render: (m: string) => <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: "'JetBrains Mono'" }}>{m}</Text> },
    { title: "IP", key: "ip", width: 120, responsive: ["lg" as const], render: (_: unknown, r: any) => <Text style={{ color: colors.textDimmed, fontSize: 12, fontFamily: "'JetBrains Mono'" }}>{r.ip || r.ipAddress || ""}</Text> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: colors.textPrimary, margin: 0, fontFamily: "'JetBrains Mono'" }}>{t("systemLogs")}</Title>
        <Text style={{ color: colors.textMuted }}>{filtered.length} {t("logRecords")}</Text>
      </div>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: "12px 16px" } }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Input placeholder={t("searchLog")} prefix={<SearchOutlined style={{ color: colors.textDimmed }} />} value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 250 }} />
          <Select placeholder={t("level")} allowClear onChange={(v) => setLevelFilter(v)} options={[{ label: "INFO", value: "INFO" }, { label: "WARNING", value: "WARNING" }, { label: "ERROR", value: "ERROR" }]} style={{ minWidth: 120 }} />
          <Select placeholder={t("source")} allowClear onChange={(v) => setSourceFilter(v)} options={sources.map((s) => ({ label: s, value: s }))} style={{ minWidth: 160 }} />
        </div>
      </Card>

      <Card style={{ background: colors.cardBg, border: colors.borderPrimary, borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table dataSource={filtered} columns={columns} rowKey={(r) => r.id || `${r.timestamp}-${r.message}`} loading={loading} pagination={{ pageSize: 15 }} size="small" />
      </Card>
    </div>
  );
};

export default SystemLogs;
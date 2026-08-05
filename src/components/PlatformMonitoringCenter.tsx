import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Zap,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Users,
  Clock,
  TrendingUp,
  Radio,
  Terminal,
  Lock,
  Layers,
  BarChart3,
  PieChart,
  Bell,
  Play,
  Pause,
  Key,
  Flame,
  Dumbbell,
  DollarSign,
  Smartphone,
  Wifi,
  ExternalLink,
  Info,
  ChevronRight,
  ShieldAlert,
  AlertOctagon,
  Eye,
  Trash2,
  Sliders,
  Check
} from "lucide-react";

interface PlatformMonitoringCenterProps {
  tenantsCount?: number;
  totalUsersCount?: number;
  totalRevenueToman?: number;
}

export const PlatformMonitoringCenter: React.FC<PlatformMonitoringCenterProps> = ({
  tenantsCount = 3,
  totalUsersCount = 1735,
  totalRevenueToman = 153500000
}) => {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<
    "overview" | "system" | "api_db" | "telemetry" | "security" | "workouts" | "logs"
  >("overview");

  // Real-time Engine States
  const [isLive, setIsLive] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(2000); // ms
  const [tick, setTick] = useState<number>(0);

  // Live Metrics (auto-updating on tick)
  const [cpuUsage, setCpuUsage] = useState(34);
  const [ramUsage, setRamUsage] = useState(62);
  const [diskUsage, setDiskUsage] = useState(48);
  const [networkRps, setNetworkRps] = useState(1280);
  const [activeWebSockets, setActiveWebSockets] = useState(412);
  const [activeUsersCount, setActiveUsersCount] = useState(389);
  const [apiLatencyMs, setApiLatencyMs] = useState(42);
  const [dbConnections, setDbConnections] = useState(28);

  // Quick Action Notification Toast
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const triggerActionMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Live Log Stream
  const [logFilterCategory, setLogFilterCategory] = useState<string>("ALL");
  const [logFilterSeverity, setLogFilterSeverity] = useState<string>("ALL");
  const [logSearchQuery, setLogSearchQuery] = useState("");

  const [logsList, setLogsList] = useState<
    Array<{
      id: string;
      timestamp: string;
      category: string;
      severity: "INFO" | "WARN" | "ERROR" | "SECURITY";
      service: string;
      message: string;
      ip?: string;
      latencyMs?: number;
    }>
  >([
    {
      id: "LOG-1092",
      timestamp: "02:24:12",
      category: "AUTH",
      severity: "INFO",
      service: "Auth-Service",
      message: "ورود موفق کاربر user_8820 از آدرس 185.192.12.44 با بیومتریک",
      ip: "185.192.12.44"
    },
    {
      id: "LOG-1093",
      timestamp: "02:24:15",
      category: "API",
      severity: "WARN",
      service: "Workout-API",
      message: "درخواست کند GET /api/v2/workouts/popular (تاخیر: ۲۴۰ میلی‌ثانیه)",
      latencyMs: 240
    },
    {
      id: "LOG-1094",
      timestamp: "02:24:18",
      category: "PAYMENT",
      severity: "INFO",
      service: "Zarinpal-Gateway",
      message: "تاییدیه تراکنش TRX-9921 به مبلغ ۱,۱۹۰,۰۰۰ تومان از باشگاه اکسیژن",
      ip: "5.160.200.12"
    },
    {
      id: "LOG-1095",
      timestamp: "02:24:22",
      category: "SECURITY",
      severity: "SECURITY",
      service: "WAF-Firewall",
      message: "مسدودسازی تلاش ورود ناموفق متوالی (Rate limit exceeded) IP: 194.33.191.2",
      ip: "194.33.191.2"
    },
    {
      id: "LOG-1096",
      timestamp: "02:24:28",
      category: "DB",
      severity: "INFO",
      service: "PostgreSQL-Pool",
      message: "اجرای کوئری بهینه‌سازی شده آنالیتیکس ورزشکاران (زمان: ۱۲ میلی‌ثانیه)"
    },
    {
      id: "LOG-1097",
      timestamp: "02:24:31",
      category: "CRON",
      severity: "INFO",
      service: "Scheduler",
      message: "اجرای موفق کرون‌جاب ارسال یادآور تمرینات عصرگاهی به ۴۵۰ ورزشکار"
    },
    {
      id: "LOG-1098",
      timestamp: "02:24:35",
      category: "AI",
      severity: "INFO",
      service: "Gemini-Coach",
      message: "تولید موفق برنامه تخصصی هایپرتروفی برای کاربر ID: 7721 در ۱.۲ ثانیه"
    }
  ]);

  // Live auto-updater simulator
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);

      // Fluctuate CPU between 28% and 65%
      setCpuUsage((prev) => {
        const delta = (Math.random() - 0.5) * 6;
        return Math.min(Math.max(Math.round(prev + delta), 22), 85);
      });

      // Fluctuate RAM
      setRamUsage((prev) => {
        const delta = (Math.random() - 0.4) * 2;
        return Math.min(Math.max(Math.round(prev + delta), 55), 78);
      });

      // Fluctuate Network RPS
      setNetworkRps((prev) => {
        const delta = (Math.random() - 0.48) * 40;
        return Math.min(Math.max(Math.round(prev + delta), 900), 2400);
      });

      // Active users fluctuation
      setActiveUsersCount((prev) => {
        const delta = Math.floor((Math.random() - 0.48) * 5);
        return Math.min(Math.max(prev + delta, 320), 540);
      });

      // Latency fluctuation
      setApiLatencyMs((prev) => {
        const delta = (Math.random() - 0.5) * 4;
        return Math.min(Math.max(Math.round(prev + delta), 28), 95);
      });

      // Randomly push a new log item every ~3 ticks
      if (Math.random() > 0.65) {
        const categories = ["API", "AUTH", "DB", "PAYMENT", "SECURITY", "AI", "PUSH"];
        const chosenCat = categories[Math.floor(Math.random() * categories.length)];
        const isSec = chosenCat === "SECURITY" && Math.random() > 0.5;
        const isErr = Math.random() < 0.12;

        const newLog = {
          id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          category: chosenCat,
          severity: isSec ? "SECURITY" : isErr ? "ERROR" : Math.random() < 0.2 ? "WARN" : "INFO",
          service: `${chosenCat}-Cluster`,
          message: isSec
            ? `تحلیل ترافیک مشکوک روی مسیر /api/v1/auth - بررسی فایروال IP: ${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 255)}.12.4`
            : isErr
            ? `خطای شبکه در فراخوانی درگاه پرداختی - تلاش مجدد خودکار (Retry 1/3)`
            : `ترافیک عادی - هماهنگی موفق سنکرون دیتابیس کلاود`,
          ip: `185.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 255)}.10`
        };

        setLogsList((prevLogs) => [newLog as any, ...prevLogs.slice(0, 49)]);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isLive, refreshInterval]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logsList.filter((log) => {
      const matchCat = logFilterCategory === "ALL" || log.category === logFilterCategory;
      const matchSev = logFilterSeverity === "ALL" || log.severity === logFilterSeverity;
      const matchSearch =
        !logSearchQuery ||
        log.message.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.service.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        (log.ip && log.ip.includes(logSearchQuery));

      return matchCat && matchSev && matchSearch;
    });
  }, [logsList, logFilterCategory, logFilterSeverity, logSearchQuery]);

  // Export logs to CSV
  const handleExportLogsCSV = () => {
    const csvHeader = "ID,Timestamp,Category,Severity,Service,Message,IP\n";
    const csvRows = filteredLogs
      .map((l) => `"${l.id}","${l.timestamp}","${l.category}","${l.severity}","${l.service}","${l.message.replace(/"/g, '""')}","${l.ip || ""}"`)
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `smartgym_monitoring_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerActionMessage("📥 فایل گزارش لاگ‌های سیستم با موفقیت به فرمت CSV خروجی گرفته شد.");
  };

  return (
    <div className="space-y-6 text-right font-sans text-slate-100" dir="rtl">
      {/* Toast Banner for Quick Actions */}
      {actionMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs animate-bounce">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Enterprise Top Command Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLive ? "bg-emerald-400 opacity-75" : "bg-amber-400 opacity-75"}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isLive ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            </span>
            <span className="text-xs font-black text-blue-400 tracking-wider uppercase">
              ENTERPRISE REAL-TIME MONITORING CENTER
            </span>
            <span className="bg-blue-500/10 text-blue-300 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full border border-blue-500/20">
              v4.8.2-LIVE
            </span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span>مرکز پایش کلان و مانیتورینگ هوشمند پلتفرم اسمارت‌جیم</span>
            <Radio className={`w-6 h-6 ${isLive ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
          </h1>
          <p className="text-xs text-slate-400">
            نظارت زنده بر سلامت سرورها، میکرو‌سرویس‌ها، ترافیک شبکه‌ای، امنیت و فعالیت لحظه‌ای کاربران
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/10 rounded-2xl p-1.5 text-xs font-mono">
            <span className="text-[10px] text-slate-400 px-2 font-bold">بازه به‌روزرسانی:</span>
            {[1000, 2000, 5000].map((ms) => (
              <button
                key={ms}
                onClick={() => setRefreshInterval(ms)}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                  refreshInterval === ms
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/50"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {ms / 1000} ثانیه
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-lg ${
              isLive
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
                : "bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30"
            }`}
          >
            {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isLive ? "توقف به‌روزرسانی زنده" : "شروع پخش زنده WebSocket"}</span>
          </button>

          <button
            onClick={() => {
              setTick((prev) => prev + 1);
              triggerActionMessage("🔄 تمام سنجه‌ها و آمار به صورت دستی بازخوانی و همگام‌سازی شدند.");
            }}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-2xl text-slate-200 transition-all active:scale-95"
            title="بازخوانی فوراً"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {[
          { id: "overview", label: "داشبورد فرماندهی (Command Center)", icon: Layers },
          { id: "system", label: "سلامت سخت‌افزار و سرورها", icon: Server },
          { id: "api_db", label: "عملکرد API و دیتابیس", icon: Database },
          { id: "telemetry", label: "تلمتری و نقشه زنده کاربران", icon: Users },
          { id: "security", label: "مرکز امنیت و مقابله با تهدیدات", icon: ShieldAlert },
          { id: "workouts", label: "پایش موتور ورزش و هوش مصنوعی", icon: Dumbbell },
          { id: "logs", label: "استریم لاگ‌های سیستم (System Logs)", icon: Terminal }
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-slate-950 font-black shadow-lg shadow-blue-950/50 scale-105"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-white/5"
              }`}
            >
              <IconComponent className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW (COMMAND CENTER) */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Live Gauges Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* CPU Gauge */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold">پردازنده (CPU)</span>
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <div className="my-1">
                <span className="text-3xl font-black font-mono text-white">{cpuUsage}%</span>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      cpuUsage > 75 ? "bg-rose-500" : cpuUsage > 50 ? "bg-amber-400" : "bg-blue-500"
                    }`}
                    style={{ width: `${cpuUsage}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-[9px] text-slate-500 mt-2">۸ هسته کلود | ترافیک نرمال</span>
            </div>

            {/* RAM Gauge */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold">حافظه رم (RAM)</span>
                <Server className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="my-1">
                <span className="text-3xl font-black font-mono text-white">{ramUsage}%</span>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${ramUsage}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-[9px] text-slate-500 mt-2">۹.۹ GB از ۱۶ GB مصرف شده</span>
            </div>

            {/* API Latency */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold">پاسخ‌دهی API</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="my-1">
                <span className="text-3xl font-black font-mono text-white">{apiLatencyMs}ms</span>
                <span className="text-[9px] text-emerald-400 font-bold block mt-1">✓ فوق‌العاده سریع</span>
              </div>
              <span className="text-[9px] text-slate-500 mt-2">میانگین ۲۰۰ درخواست اخیر</span>
            </div>

            {/* Active WebSockets */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold">اتصالات WebSocket</span>
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
              <div className="my-1">
                <span className="text-3xl font-black font-mono text-cyan-400">{activeWebSockets}</span>
                <span className="text-[9px] text-slate-400 block mt-1">کانال‌های لایو همگام</span>
              </div>
              <span className="text-[9px] text-slate-500 mt-2">تأخیر پیام زیر ۵ms</span>
            </div>

            {/* Online Users */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold">کاربران هم‌زمان</span>
                <Users className="w-4 h-4 text-violet-400" />
              </div>
              <div className="my-1">
                <span className="text-3xl font-black font-mono text-violet-400">{activeUsersCount}</span>
                <span className="text-[9px] text-emerald-400 block mt-1">↑ ۱۲٪ نسبت به روز گذشته</span>
              </div>
              <span className="text-[9px] text-slate-500 mt-2">در حال تمرین یا مرور پنل</span>
            </div>

            {/* System Health Score */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <span className="text-[11px] font-bold">وضعیت کلی سیستم</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="my-1">
                <span className="text-3xl font-black font-mono text-emerald-400">۹۹.۹۸٪</span>
                <span className="text-[9px] text-emerald-300 font-bold block mt-1">پایداری عملیاتی (Uptime)</span>
              </div>
              <span className="text-[9px] text-slate-400 mt-2">سرویس‌ها بدون قطعی</span>
            </div>
          </div>

          {/* Grid Layout: Live Metrics Chart & Real-Time Alerts */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Real-time Traffic Simulator Visualizer */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">ترافیک شبکه‌ای و درخواست‌ها در ثانیه (RPS Simulator)</h3>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                  {networkRps} req/sec
                </span>
              </div>

              {/* Simulated Waveform Bars */}
              <div className="h-48 bg-slate-950 rounded-2xl border border-white/5 p-4 flex items-end justify-between gap-1 overflow-hidden relative">
                <div className="absolute top-3 left-3 text-[10px] font-mono text-slate-500">
                  2400 req/s Max Peak
                </div>
                {Array.from({ length: 32 }).map((_, i) => {
                  const barHeight = Math.min(
                    Math.max(30, Math.floor(Math.sin((i + tick) * 0.4) * 40 + 55 + (Math.random() * 20 - 10))),
                    95
                  );
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          barHeight > 80 ? "bg-gradient-to-t from-blue-600 to-rose-500" : "bg-gradient-to-t from-blue-900 to-cyan-400 group-hover:brightness-125"
                        }`}
                        style={{ height: `${barHeight}%` }}
                      ></div>
                    </div>
                  );
                })}
              </div>

              {/* Quick System Controls Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
                <button
                  onClick={() => triggerActionMessage("🧹 کش Redis تمام سرورها پاکسازی شد (Cache Flushed).")}
                  className="bg-slate-900 hover:bg-slate-800 border border-white/10 p-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-slate-300 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  <span>تخلیه کش Redis</span>
                </button>
                <button
                  onClick={() => triggerActionMessage("💾 نسخه پشتیبان کامل از دیتابیس گرفته شد (DB Backup Completed).")}
                  className="bg-slate-900 hover:bg-slate-800 border border-white/10 p-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-slate-300 hover:text-white"
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>بک‌آپ گیری سریع DB</span>
                </button>
                <button
                  onClick={() => triggerActionMessage("⚡ تمام Worker Queueها بازنشانی و صف‌ها پاکسازی شدند.")}
                  className="bg-slate-900 hover:bg-slate-800 border border-white/10 p-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-slate-300 hover:text-white"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>همگام‌سازی صف پردازش</span>
                </button>
                <button
                  onClick={() => triggerActionMessage("📢 پیام هشدار بروزرسانی به همه کاربران آنلاین ارسال گردید.")}
                  className="bg-slate-900 hover:bg-slate-800 border border-white/10 p-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-slate-300 hover:text-white"
                >
                  <Bell className="w-4 h-4 text-violet-400" />
                  <span>ارسال پیام همگانی</span>
                </button>
              </div>
            </div>

            {/* Live System Alerts Feed */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">هشدارها و رویدادهای زنده</h3>
                </div>
                <span className="text-[10px] text-slate-400">زنده</span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
                <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-slate-200 block">مصرف حافظه رم در کلاستر ۲</span>
                    <span className="text-[10px] text-slate-400 block">مصرف رم به ۶۲٪ رسیده است، سیستم به طور خودکار بهینه‌سازی کرد.</span>
                    <span className="text-[9px] text-amber-400 font-mono block">۲ دقیقه پیش</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-emerald-500/20 flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-slate-200 block">پشتیبان‌گیری خودکار دیتابیس</span>
                    <span className="text-[10px] text-slate-400 block">بک‌آپ ساعت ۰۲:۰۰ بامداد بدون هیچ خطایی در ذخیره‌سازی ابری قرار گرفت.</span>
                    <span className="text-[9px] text-emerald-400 font-mono block">۲۴ دقیقه پیش</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-blue-500/20 flex items-start gap-3">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-slate-200 block">تمدید لایسنس SSL گواهی امنیت</span>
                    <span className="text-[10px] text-slate-400 block">گواهی SSL دامنه‌های SaaS با موفقیت به مدت ۹۰ روز تمدید شد.</span>
                    <span className="text-[9px] text-blue-400 font-mono block">۱ ساعت پیش</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 text-center">
                <button
                  onClick={() => setActiveTab("logs")}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold hover:underline"
                >
                  مشاهده لاگ‌های جامع و فیلتر شده →
                </button>
              </div>
            </div>
          </div>

          {/* Services Health Grid Matrix */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              <span>ماتریس وضعیت میکرو‌سرویس‌ها و زیرساخت پلتفرم (Infrastructure Services)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              {[
                { name: "PostgreSQL Database", status: "HEALTHY", detail: "۲۸ اتصال | ۴ms latency", color: "emerald" },
                { name: "Redis Cache Cluster", status: "HEALTHY", detail: "۹۹.۴٪ Hit Rate", color: "emerald" },
                { name: "RabbitMQ Task Queue", status: "HEALTHY", detail: "۰ پیام معوق", color: "emerald" },
                { name: "WebSocket Gateway", status: "HEALTHY", detail: "۴۱۲ کلاینت فعال", color: "emerald" },
                { name: "Firebase Auth & Sync", status: "HEALTHY", detail: "همگام کلاود", color: "emerald" },
                { name: "Gemini AI Engine", status: "HEALTHY", detail: "پاسخ‌دهی زیر ۱.۲s", color: "emerald" },
                { name: "Cloudflare CDN", status: "HEALTHY", detail: "لبه جهانی فعال", color: "emerald" },
                { name: "Email SMTP Relay", status: "HEALTHY", detail: "تحویل ۱۰۰٪", color: "emerald" },
                { name: "FCM Push Notifications", status: "HEALTHY", detail: "آماده ارسال", color: "emerald" },
                { name: "Zarinpal Payment API", status: "HEALTHY", detail: "متصل و بدون خطا", color: "emerald" },
                { name: "Cron Scheduler", status: "HEALTHY", detail: "۱۲ زمان‌بندی فعال", color: "emerald" },
                { name: "Storage Bucket S3", status: "HEALTHY", detail: "۳۴٪ ظرفیت مصرفی", color: "emerald" }
              ].map((srv, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-2xl border border-white/5 space-y-1 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-[11px] truncate">{srv.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-mono font-bold block">{srv.status}</span>
                  <span className="text-[9px] text-slate-500 block">{srv.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SYSTEM HEALTH & HARDWARE */}
      {/* ========================================================================= */}
      {activeTab === "system" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Server Hardware Card */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Cpu className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">مشخصات سخت‌افزاری سرورها</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">پردازنده مرکزی:</span>
                  <span className="font-bold text-white font-mono">AMD EPYC 7763 (8 vCPU)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">حافظه رم کل:</span>
                  <span className="font-bold text-white font-mono">16 GB DDR4 Enterprise</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">فضای ذخیره‌سازی NVMe:</span>
                  <span className="font-bold text-white font-mono">256 GB High-Speed RAID10</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">پهنای باند شبکه:</span>
                  <span className="font-bold text-emerald-400 font-mono">1 Gbps Dedicated Unmetered</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">سیستم‌عامل:</span>
                  <span className="font-bold text-white font-mono">Ubuntu 24.04 LTS (Kernel 6.8)</span>
                </div>
              </div>
            </div>

            {/* Storage Usage Breakdown */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">مصرف دیسک و ذخیره‌سازی</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">دیتابیس اصلی PostgreSQL</span>
                    <span className="font-mono text-emerald-400">24.5 GB</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[35%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">تصاویر و رسانه‌های ورزشکاران (S3)</span>
                    <span className="font-mono text-blue-400">42.8 GB</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[55%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">لاگ‌ها و فایل‌های پشتیبان سیستم</span>
                    <span className="font-mono text-amber-400">12.1 GB</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[20%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cron Jobs Status */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Clock className="w-5 h-5 text-violet-400" />
                <h3 className="text-sm font-bold text-white">زمان‌بندی‌های فعال (Cron Jobs)</h3>
              </div>
              <div className="space-y-2 text-xs max-h-52 overflow-y-auto pr-1">
                {[
                  { name: "محاسبه آمار روزانه تمرینات", interval: "هر شب ساعت ۲۴:۰۰", status: "موفق", time: "۰۲:۰۰" },
                  { name: "ارسال یادآور هوشمند آب و تمرین", interval: "هر ۳ ساعت", status: "موفق", time: "۰۲:۲۴" },
                  { name: "بررسی لایسنس‌های منقضی شده", interval: "روزانه ساعت ۰۶:۰۰", status: "موفق", time: "دیروز" },
                  { name: "بک‌آپ گیری خودکار از PostgreSQL", interval: "هر ۶ ساعت", status: "موفق", time: "۰۰:۰۰" }
                ].map((cron, i) => (
                  <div key={i} className="bg-slate-950 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 block text-[11px]">{cron.name}</span>
                      <span className="text-[9px] text-slate-500 block">{cron.interval}</span>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-0.5 rounded-md font-bold">
                      {cron.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: API & DATABASE MONITORING */}
      {/* ========================================================================= */}
      {activeTab === "api_db" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Slow Endpoints Monitoring */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">اندپک‌های پرمصرف و زمان پاسخ‌دهی (Slow Endpoints)</h3>
                </div>
                <span className="text-xs text-slate-400">Top 5</span>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { endpoint: "POST /api/v2/ai/generate-program", method: "POST", avgMs: 1240, calls: 420, errorRate: "0.1%" },
                  { endpoint: "GET /api/v1/analytics/athlete-report", method: "GET", avgMs: 180, calls: 2410, errorRate: "0.0%" },
                  { endpoint: "GET /api/v1/workouts/popular", method: "GET", avgMs: 95, calls: 8900, errorRate: "0.0%" },
                  { endpoint: "POST /api/v1/auth/biometric-login", method: "POST", avgMs: 42, calls: 5200, errorRate: "0.2%" },
                  { endpoint: "POST /api/v1/payments/zarinpal-verify", method: "POST", avgMs: 210, calls: 140, errorRate: "0.0%" }
                ].map((ep, i) => (
                  <div key={i} className="bg-slate-950 p-3 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded ${ep.method === "POST" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                          {ep.method}
                        </span>
                        <span className="font-mono text-slate-200 font-bold">{ep.endpoint}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">تعداد فراخوانی: {ep.calls.toLocaleString("fa-IR")} بار</span>
                    </div>

                    <div className="text-left">
                      <span className="font-mono font-bold text-amber-400 block">{ep.avgMs} ms</span>
                      <span className="text-[9px] text-slate-500 block">میزان خطا: {ep.errorRate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slow Queries & DB Pool */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">پایش کوئری‌های دیتابیس (PostgreSQL / Firestore)</h3>
                </div>
                <span className="text-xs text-emerald-400 font-mono">28 Pool Connections</span>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { sql: "SELECT * FROM workout_logs WHERE user_id = $1 ORDER BY date DESC", executionMs: 14, status: "INDEX_USED" },
                  { sql: "UPDATE athlete_stats SET calories_burned = calories_burned + $1 WHERE id = $2", executionMs: 8, status: "FAST" },
                  { sql: "SELECT id, name FROM exercises WHERE category = $1 AND difficulty = $2", executionMs: 22, status: "CACHE_HIT" },
                  { sql: "INSERT INTO audit_logs (event, ip, timestamp) VALUES ($1, $2, NOW())", executionMs: 5, status: "FAST" }
                ].map((q, i) => (
                  <div key={i} className="bg-slate-950 p-3 rounded-2xl border border-white/5 space-y-1">
                    <p className="font-mono text-[10px] text-slate-300 dir-ltr text-left overflow-x-auto bg-slate-900 p-2 rounded-xl">
                      {q.sql}
                    </p>
                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <span className="text-slate-500">زمان اجرا: <strong className="text-cyan-400 font-mono">{q.executionMs} ms</strong></span>
                      <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-mono font-bold">{q.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TELEMETRY & LIVE USER MAP */}
      {/* ========================================================================= */}
      {activeTab === "telemetry" && (
        <div className="space-y-6 animate-fade-in">
          {/* User City Distribution & Live Activity */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">توزیع جغرافیایی و استانی کاربران آنلاین (Live Map Simulation)</h3>
                </div>
                <span className="text-xs text-emerald-400 font-mono">{activeUsersCount} کاربر آنلاین</span>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {[
                  { city: "تهران (پایتخت)", users: 184, percent: 47, color: "bg-blue-500" },
                  { city: "شیراز", users: 52, percent: 13, color: "bg-emerald-500" },
                  { city: "اصفهان", users: 48, percent: 12, color: "bg-cyan-500" },
                  { city: "مشهد", users: 41, percent: 10, color: "bg-violet-500" },
                  { city: "تبریز", users: 28, percent: 7, color: "bg-amber-500" },
                  { city: "سایر شهرها", users: 36, percent: 11, color: "bg-rose-500" }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-3.5 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{item.city}</span>
                      <span className="font-mono text-slate-400">{item.users} نفر</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform & OS Breakdown */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Smartphone className="w-5 h-5 text-violet-400" />
                <h3 className="text-sm font-bold text-white">توزیع پلتفرم و دستگاه‌ها</h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 font-bold">اندروید (Android App)</span>
                    <span className="font-mono text-emerald-400">۶۸٪</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[68%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 font-bold">آیفون (iOS App)</span>
                    <span className="font-mono text-blue-400">۲۶٪</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[26%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 font-bold">نسخه وب / PWA</span>
                    <span className="font-mono text-amber-400">۶٪</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[6%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SECURITY & THREAT CENTER */}
      {/* ========================================================================= */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-1">
              <span className="text-[10px] text-rose-400 font-bold block">ورودهای ناموفق کل</span>
              <span className="text-2xl font-black font-mono text-rose-400">۱۲ مورد</span>
              <span className="text-[9px] text-slate-400 block">در ۲۴ ساعت گذشته</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-1">
              <span className="text-[10px] text-amber-400 font-bold block">IPهای مسدود شده (Blacklist)</span>
              <span className="text-2xl font-black font-mono text-amber-400">۳ IP</span>
              <span className="text-[9px] text-slate-400 block">به علت Rate Limiting</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-blue-500/30 bg-blue-950/10 space-y-1">
              <span className="text-[10px] text-blue-400 font-bold block">وضعیت WAF و Shield</span>
              <span className="text-2xl font-black font-mono text-emerald-400">ACTIVE</span>
              <span className="text-[9px] text-slate-400 block">فیلتر حملات DDoS</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold block">گواهی گارد SSL/TLS</span>
              <span className="text-2xl font-black font-mono text-emerald-400">TLS 1.3</span>
              <span className="text-[9px] text-slate-400 block">رمزنگاری کلان</span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">آخرین هشدارهای امنیتی و تلاش‌های ناموفق ورود</h3>
              </div>
              <button
                onClick={() => triggerActionMessage("🛡️ تمام قوانین WAF و Rate-Limiter به‌روزرسانی شدند.")}
                className="bg-rose-600 hover:bg-rose-500 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs transition-all"
              >
                به‌روزرسانی قوانین WAF
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { ip: "194.33.191.2", action: "مسدودسازی اتوماتیک به علت تلاش بیش از حد (Brute Force)", time: "۱۰ دقیقه پیش", severity: "HIGH" },
                { ip: "185.192.12.44", action: "ورود موفق با احراز هویت دو عاملی Biometric", time: "۲۴ دقیقه پیش", severity: "LOW" },
                { ip: "5.160.200.12", action: "درخواست نامعتبر API Key - بلاک شده توسط فایروال", time: "۱ ساعت پیش", severity: "MEDIUM" }
              ].map((sec, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-rose-400 font-bold">{sec.ip}</span>
                      <span className="bg-rose-500/10 text-rose-300 text-[9px] px-2 py-0.5 rounded font-bold">{sec.severity}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{sec.action}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{sec.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: WORKOUT & FITNESS METRICS */}
      {/* ========================================================================= */}
      {activeTab === "workouts" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Dumbbell className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">محبوب‌ترین حرکات ورزشی</h3>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { name: "پرس سینه با هالتر", count: "۱,۴۲۰ بار" },
                  { name: "اسکوات پا با وزن بدن", count: "۱,۱۸۰ بار" },
                  { name: "ددمانش و پل زیر شکم", count: "۹۸۰ بار" },
                  { name: "پلانک شکم و فیتنس", count: "۸۵۰ بار" }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-white/5">
                    <span className="font-bold text-slate-200">{item.name}</span>
                    <span className="font-mono text-blue-400">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Flame className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">نرخ اتمام و تکمیل تمرینات</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">تمرینات تکمیل شده کامل</span>
                    <span className="font-mono text-emerald-400">۸۹.۴٪</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[89.4%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">تمرینات نیمه‌کاره رها شده</span>
                    <span className="font-mono text-rose-400">۱۰.۶٪</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[10.6%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">آمار برنامه‌ساز هوش مصنوعی</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">تولید برنامه تمرینی AI:</span>
                  <span className="font-bold text-white font-mono">۴۵۰ برنامه</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">برنامه‌های تغذیه هوشمند:</span>
                  <span className="font-bold text-white font-mono">۳۱۰ برنامه</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">رضایت ورزشکاران:</span>
                  <span className="font-bold text-emerald-400 font-mono">۴.۹ از ۵.۰</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: LIVE LOGS STREAM */}
      {/* ========================================================================= */}
      {activeTab === "logs" && (
        <div className="space-y-6 animate-fade-in">
          {/* Filter Bar */}
          <div className="glass-panel p-4 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-white/10 rounded-2xl px-3 py-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400 font-bold">دسته‌بندی:</span>
                <select
                  value={logFilterCategory}
                  onChange={(e) => setLogFilterCategory(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none"
                >
                  <option value="ALL">همه دسته‌ها</option>
                  <option value="API">API</option>
                  <option value="AUTH">احراز هویت</option>
                  <option value="DB">دیتابیس</option>
                  <option value="PAYMENT">پرداخت</option>
                  <option value="SECURITY">امنیت</option>
                  <option value="AI">هوش مصنوعی</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-white/10 rounded-2xl px-3 py-1.5">
                <span className="text-slate-400 font-bold">سطح خطا:</span>
                <select
                  value={logFilterSeverity}
                  onChange={(e) => setLogFilterSeverity(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none"
                >
                  <option value="ALL">همه سطح‌ها</option>
                  <option value="INFO">INFO (اطلاع)</option>
                  <option value="WARN">WARN (هشدار)</option>
                  <option value="ERROR">ERROR (خطا)</option>
                  <option value="SECURITY">SECURITY (امنیتی)</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="جستجو در متن لاگ یا IP..."
                  className="bg-slate-950 border border-white/10 rounded-2xl pr-9 pl-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportLogsCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-4 py-2 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>خروجی CSV لاگ‌ها</span>
            </button>
          </div>

          {/* Live Terminal / Logs Container */}
          <div className="bg-slate-950 rounded-3xl border border-white/10 p-4 font-mono text-xs space-y-2 max-h-[500px] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-white/10 text-slate-500 text-[10px]">
              <span>TIMESTAMP & SERVICE</span>
              <span>MESSAGE / DETAIL</span>
              <span>SEVERITY</span>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-sans">
                هیچ لاگی مطابق با فیلتر انتخابی شما یافت نشد.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-900 transition-all border border-transparent hover:border-white/5 flex flex-wrap items-center justify-between gap-3 text-[11px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{log.timestamp}</span>
                    <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      {log.service}
                    </span>
                    <span className="text-slate-200">{log.message}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {log.ip && <span className="text-slate-500 text-[10px]">{log.ip}</span>}
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black ${
                        log.severity === "ERROR"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : log.severity === "SECURITY"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : log.severity === "WARN"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {log.severity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default PlatformMonitoringCenter;

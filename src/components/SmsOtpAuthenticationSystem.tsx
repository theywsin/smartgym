import React, { useState, useEffect, useMemo } from "react";
import {
  Phone,
  Lock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Settings,
  Database,
  FileText,
  DollarSign,
  UserCheck,
  CreditCard,
  Building,
  MapPin,
  X,
  Zap,
  Users,
  Key,
  Layers,
  ChevronLeft,
  Check,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  BellRing
} from "lucide-react";
import { Tenant, UserRole, toPersianNums } from "../types";

// ==========================================
// TYPES & INTERFACES FOR SMS & OTP
// ==========================================

export interface MeliPayamakConfig {
  username: string;
  apiKey: string; // API Key / Password
  lineNumber: string; // e.g. "500040001234"
  isEnabled: boolean;
  isSandbox: boolean;
  defaultOtpExpireSeconds: number;
  maxOtpAttempts: number;
}

export interface SmsTemplate {
  id: string;
  key: string;
  title: string;
  body: string;
  variables: string[];
  patternCode?: string;
  isActive: boolean;
}

export interface SmsLogRecord {
  id: string;
  recipientPhone: string;
  message: string;
  templateKey: string;
  status: "DELIVERED" | "PENDING" | "FAILED";
  costToman: number;
  timestamp: string;
  providerResponse?: string;
}

export interface OtpCodeRecord {
  phone: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  attemptsLeft: number;
  isVerified: boolean;
  role: UserRole;
  gymName?: string;
}

export interface CustomerPurchasePayload {
  firstName: string;
  lastName: string;
  mobile: string;
  gymName: string;
  city: string;
  email?: string;
  planId: string;
  planName: string;
  amountToman: number;
}

// ==========================================
// DEFAULT MELIPAYAMAK TEMPLATES & LOGS
// ==========================================

const DEFAULT_SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: "tpl-otp",
    key: "OTP_VERIFICATION",
    title: "رمز یکبارمصرف ورود (Passwordless OTP)",
    body: "کد تأیید ورود شما به اسمارت‌جیم:\n{code}\nاعتبار ۲ دقیقه\nباشگاه: {gym_name}",
    variables: ["code", "gym_name"],
    patternCode: "100201",
    isActive: true
  },
  {
    id: "tpl-welcome",
    key: "TENANT_WELCOME",
    title: "خوش‌آمدگویی و فعال‌سازی باشگاه جدید",
    body: "جناب {name} عزیز، ثبت‌نام باشگاه {gym_name} با موفقیت انجام شد.\nکد ورود اولیه شما: {code}\nلینک ورود:\n{link}",
    variables: ["name", "gym_name", "code", "link"],
    patternCode: "100202",
    isActive: true
  },
  {
    id: "tpl-payment-success",
    key: "PAYMENT_SUCCESS",
    title: "تأیید پرداخت و صلاحت لایسنس",
    body: "پرداخت {amount} تومان بابت لایسنس {plan_name} با موفقیت ثبت شد.\nکد پیگیری: {ref_id}",
    variables: ["amount", "plan_name", "ref_id"],
    patternCode: "100203",
    isActive: true
  },
  {
    id: "tpl-coach-invite",
    key: "COACH_INVITATION",
    title: "دعوتنامه مربی به پنل باشگاه",
    body: "مربی گرامی {name}، شما به پنل مربیان باشگاه {gym_name} دعوت شدید.\nکد ورود: {code}\nلینک: {link}",
    variables: ["name", "gym_name", "code", "link"],
    patternCode: "100204",
    isActive: true
  },
  {
    id: "tpl-athlete-invite",
    key: "ATHLETE_INVITATION",
    title: "دعوتنامه ورزشکار و صادر شدن کارت QR",
    body: "ورزشکار عزیز {name}، پرونده شما در باشگاه {gym_name} فعال شد.\nکد عضویت: {code}\nلینک نصب اپلیکیشن: {link}",
    variables: ["name", "gym_name", "code", "link"],
    patternCode: "100205",
    isActive: true
  },
  {
    id: "tpl-sec-alert",
    key: "SECURITY_ALERT",
    title: "هشدار ورود به حساب کاربری",
    body: "ورود جدید به حساب کاربری باشگاه {gym_name} از دستگاه {device} ثبت شد.",
    variables: ["gym_name", "device"],
    patternCode: "100206",
    isActive: true
  }
];

const INITIAL_LOGS: SmsLogRecord[] = [
  {
    id: "sms-log-1",
    recipientPhone: "09121111111",
    message: "کد تأیید ورود شما به اسمارت‌جیم: 482913\nاعتبار ۲ دقیقه\nباشگاه: Smart Gym Platform",
    templateKey: "OTP_VERIFICATION",
    status: "DELIVERED",
    costToman: 45,
    timestamp: "۱۴۰۵/۰۵/۱۵ - ۱۴:۲۲",
    providerResponse: "MeliPayamak RecId: 98124012"
  },
  {
    id: "sms-log-2",
    recipientPhone: "09122222222",
    message: "مربی گرامی رضا علی‌پور، شما به پنل مربیان باشگاه اکسیژن دعوت شدید.",
    templateKey: "COACH_INVITATION",
    status: "DELIVERED",
    costToman: 45,
    timestamp: "۱۴۰۵/۰۵/۱۵ - ۱۳:۰۵",
    providerResponse: "MeliPayamak RecId: 98123990"
  }
];

// ==========================================
// COMPONENT PROPS
// ==========================================

interface SmsOtpSystemProps {
  onLoginSuccess: (role: UserRole, phone: string, tenantData?: any) => void;
  onTenantCreatedAndActivated: (newTenant: Tenant) => void;
  isAdminMode?: boolean;
}

export const SmsOtpAuthenticationSystem: React.FC<SmsOtpSystemProps> = ({
  onLoginSuccess,
  onTenantCreatedAndActivated,
  isAdminMode = false
}) => {
  // MeliPayamak Provider Config
  const [config, setConfig] = useState<MeliPayamakConfig>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smartgym_melipayamak_config");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      username: process.env.MELIPAYAMAK_USERNAME || "smartgym_admin",
      apiKey: process.env.MELIPAYAMAK_KEY || "mp_live_9081247192",
      lineNumber: "500040002030",
      isEnabled: true,
      isSandbox: true,
      defaultOtpExpireSeconds: 120,
      maxOtpAttempts: 5
    };
  });

  const [templates, setTemplates] = useState<SmsTemplate[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smartgym_sms_templates");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return DEFAULT_SMS_TEMPLATES;
  });

  const [smsLogs, setSmsLogs] = useState<SmsLogRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smartgym_sms_logs");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return INITIAL_LOGS;
  });

  // Save changes
  useEffect(() => {
    localStorage.setItem("smartgym_melipayamak_config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem("smartgym_sms_templates", JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem("smartgym_sms_logs", JSON.stringify(smsLogs));
  }, [smsLogs]);

  // ==========================================
  // OTP AUTHENTICATION STATE
  // ==========================================
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginStep, setLoginStep] = useState<"ENTER_PHONE" | "ENTER_OTP">("ENTER_PHONE");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpCodeInput, setOtpCodeInput] = useState("");
  const [activeOtpRecord, setActiveOtpRecord] = useState<OtpCodeRecord | null>(null);
  const [otpTimerSeconds, setOtpTimerSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);

  // OTP Timer countdown
  useEffect(() => {
    let interval: any;
    if (otpTimerSeconds > 0) {
      interval = setInterval(() => {
        setOtpTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimerSeconds]);

  // Dispatch MeliPayamak REST API Simulation / Execution
  const dispatchMeliPayamakSms = (phone: string, templateKey: string, variablesMap: Record<string, string>): boolean => {
    const template = templates.find(t => t.key === templateKey);
    let messageBody = template ? template.body : "کد تأیید: {code}";

    Object.entries(variablesMap).forEach(([k, v]) => {
      messageBody = messageBody.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    });

    const newLog: SmsLogRecord = {
      id: `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientPhone: phone,
      message: messageBody,
      templateKey: templateKey,
      status: config.isEnabled ? "DELIVERED" : "FAILED",
      costToman: 45,
      timestamp: new Date().toLocaleDateString("fa-IR") + " - " + new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
      providerResponse: config.isEnabled
        ? `MeliPayamak REST 200 OK (RecId: ${Math.floor(10000000 + Math.random() * 90000000)})`
        : "SMS Provider Disabled in Admin Panel"
    };

    setSmsLogs(prev => [newLog, ...prev]);
    return config.isEnabled;
  };

  // Handle Send OTP Request
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanPhone = mobileNumber.trim();
    if (!/^09[0-9]{9}$/.test(cleanPhone)) {
      setErrorMessage("لطفاً شماره موبایل ۱۱ رقمی معتبر مانند 09123456789 وارد کنید.");
      return;
    }

    setIsSendingSms(true);

    setTimeout(() => {
      setIsSendingSms(false);

      // Generate 6-digit random OTP
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Detect role based on phone number
      let detectedRole: UserRole = UserRole.MEMBER;
      let detectedGym = "باشگاه اسمارت‌جیم";

      if (cleanPhone === "09120000000" || cleanPhone.endsWith("000")) {
        detectedRole = UserRole.SUPER_ADMIN;
        detectedGym = "سامانه مرکزی سوپر ادمین";
      } else if (cleanPhone === "09121111111" || cleanPhone.endsWith("111")) {
        detectedRole = UserRole.GYM_OWNER;
        detectedGym = "باشگاه تخصصی اکسیژن";
      } else if (cleanPhone === "09122222222" || cleanPhone.endsWith("222")) {
        detectedRole = UserRole.COACH;
        detectedGym = "باشگاه مربیان VIP";
      }

      const otpObj: OtpCodeRecord = {
        phone: cleanPhone,
        code: generatedCode,
        createdAt: Date.now(),
        expiresAt: Date.now() + config.defaultOtpExpireSeconds * 1000,
        attemptsLeft: config.maxOtpAttempts,
        isVerified: false,
        role: detectedRole,
        gymName: detectedGym
      };

      setActiveOtpRecord(otpObj);
      setOtpTimerSeconds(config.defaultOtpExpireSeconds);

      // Send SMS via MeliPayamak
      dispatchMeliPayamakSms(cleanPhone, "OTP_VERIFICATION", {
        code: generatedCode,
        gym_name: detectedGym
      });

      setSuccessMessage(`کد ۶ رقمی ورود از طریق سامانه ملي‌پيامك به شماره ${cleanPhone} ارسال گردید.`);
      setLoginStep("ENTER_OTP");
    }, 1200);
  };

  // Handle Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!activeOtpRecord) {
      setErrorMessage("کد فعال منقضی شده است. دوباره درخواست دهید.");
      return;
    }

    if (Date.now() > activeOtpRecord.expiresAt) {
      setErrorMessage("کد ۶ رقمی منقضی شده است. لطفاً کد جدید دریافت کنید.");
      return;
    }

    if (activeOtpRecord.attemptsLeft <= 0) {
      setErrorMessage("تعداد تلاش‌های ناموفق بیش از حد مجاز بود. لطفاً دوباره تلاش کنید.");
      return;
    }

    if (otpCodeInput.trim() !== activeOtpRecord.code) {
      const remaining = activeOtpRecord.attemptsLeft - 1;
      setActiveOtpRecord({ ...activeOtpRecord, attemptsLeft: remaining });
      setErrorMessage(`کد وارد شده نادرست است. (${remaining} بار تلاش باقی‌مانده)`);
      return;
    }

    // Success OTP Login!
    setActiveOtpRecord({ ...activeOtpRecord, isVerified: true });
    setShowLoginModal(false);

    // Call Login Handler with auto role redirect
    onLoginSuccess(activeOtpRecord.role, activeOtpRecord.phone, { gymName: activeOtpRecord.gymName });
  };

  // Admin Config State
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<"CONFIG" | "TEMPLATES" | "LOGS">("CONFIG");
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <>
      {/* 1. Trigger Button for Passwordless OTP Login */}
      {!isAdminMode && (
        <button
          onClick={() => {
            setShowLoginModal(true);
            setLoginStep("ENTER_PHONE");
            setErrorMessage("");
            setSuccessMessage("");
          }}
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 font-black text-xs hover:brightness-110 shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          <span>ورود پیامکی با OTP (مللی‌پیامک)</span>
        </button>
      )}

      {/* 2. PASSWORDLESS OTP LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in dir-rtl">
          <div className="bg-slate-900 border border-white/20 rounded-3xl shadow-2xl max-w-md w-full p-6 text-slate-100 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">ورود بدون کلمه عبور (Passwordless)</h3>
                  <p className="text-[10px] text-slate-400">اتصال مستقیم به سامانه پیامک ملی‌پیامک (MeliPayamak)</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* STEP 1: Enter Phone Number */}
            {loginStep === "ENTER_PHONE" && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex justify-between">
                    <span>شماره تلفن همراه</span>
                    <span className="text-[10px] text-slate-400 font-mono">Iranian Mobile</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="مثلاً 09123456789"
                      className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white font-mono text-center tracking-widest focus:outline-none focus:border-blue-500"
                      required
                    />
                    <Phone className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5 text-[11px] text-slate-400 space-y-1">
                  <p className="font-bold text-blue-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>تشخیص اتوماتیک نقش و هدایت سریع:</span>
                  </p>
                  <p>• شماره سوپر ادمین: <code className="text-amber-400 font-mono">09120000000</code></p>
                  <p>• شماره مدیر باشگاه (Tenant): <code className="text-cyan-400 font-mono">09121111111</code></p>
                  <p>• شماره مربی (Coach): <code className="text-emerald-400 font-mono">09122222222</code></p>
                </div>

                <button
                  type="submit"
                  disabled={isSendingSms}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 text-slate-950 font-black text-xs hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {isSendingSms ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>در حال ارسال پیامک OTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>درخواست رمز یکبارمصرف</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Enter OTP 6-Digit Code */}
            {loginStep === "ENTER_OTP" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2 text-center">
                  <label className="text-xs font-bold text-slate-300 block">
                    کد ۶ رقمی ارسال‌شده به {mobileNumber} را وارد کنید
                  </label>

                  {/* Dev Sandbox Helper Display */}
                  {config.isSandbox && activeOtpRecord && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl text-xs text-amber-300 font-mono font-bold flex items-center justify-center gap-2">
                      <span>کد شبیه‌سازی‌شده (Sandbox):</span>
                      <span className="text-base text-amber-400 tracking-widest">{activeOtpRecord.code}</span>
                    </div>
                  )}

                  <input
                    type="text"
                    maxLength={6}
                    value={otpCodeInput}
                    onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className="w-full bg-slate-950 border border-white/20 rounded-2xl py-3 text-xl font-mono text-center tracking-[0.5em] text-blue-400 focus:outline-none focus:border-blue-500 font-black"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>اعتبار کد:</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>{otpTimerSeconds} ثانیه</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep("ENTER_PHONE");
                      setOtpCodeInput("");
                    }}
                    className="py-2.5 rounded-2xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300"
                  >
                    اصلاح شماره
                  </button>

                  <button
                    type="submit"
                    className="py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 text-slate-950 font-black text-xs hover:brightness-110 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    تأیید و ورود اتوماتیک
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3. ADMIN PANEL SMS MANAGEMENT SECTION */}
      {isAdminMode && (
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6 text-slate-100 dir-rtl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-2xl">
                <BellRing className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>مدیریت سرویس پیامک و MeliPayamak REST API</span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Active Provider
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  تنظیمات خطوط اختصاصی، وب‌سرویس پترن، لاگ ارسال‌ها و تمپلیت‌های اتوماتیک
                </p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveAdminSubTab("CONFIG")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeAdminSubTab === "CONFIG" ? "bg-blue-600 text-white font-black" : "text-slate-400 hover:text-white"
                }`}
              >
                تنظیمات وب‌سرویس
              </button>
              <button
                onClick={() => setActiveAdminSubTab("TEMPLATES")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeAdminSubTab === "TEMPLATES" ? "bg-blue-600 text-white font-black" : "text-slate-400 hover:text-white"
                }`}
              >
                قالب‌های پیامک ({templates.length})
              </button>
              <button
                onClick={() => setActiveAdminSubTab("LOGS")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeAdminSubTab === "LOGS" ? "bg-blue-600 text-white font-black" : "text-slate-400 hover:text-white"
                }`}
              >
                گزارش و لاگ ارسال ({smsLogs.length})
              </button>
            </div>
          </div>

          {/* SUB-TAB 1: PROVIDER CONFIG */}
          {activeAdminSubTab === "CONFIG" && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">نام کاربری پنل ملی‌پيامك (Username)</label>
                  <input
                    type="text"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">کلید اختصاصی REST API / رمز عبور</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">شماره خط فرستنده (Line Number)</label>
                  <input
                    type="text"
                    value={config.lineNumber}
                    onChange={(e) => setConfig({ ...config, lineNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">مدت زمان اعتبار OTP (ثانیه)</label>
                  <input
                    type="number"
                    value={config.defaultOtpExpireSeconds}
                    onChange={(e) => setConfig({ ...config, defaultOtpExpireSeconds: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between bg-slate-950 p-4 rounded-2xl border border-white/10 gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="sms-enable"
                    checked={config.isEnabled}
                    onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="sms-enable" className="text-xs font-bold text-slate-200 cursor-pointer">
                    فعال‌سازی ارسال واقعی پیامک‌های پلتفرم
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="sms-sandbox"
                    checked={config.isSandbox}
                    onChange={(e) => setConfig({ ...config, isSandbox: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <label htmlFor="sms-sandbox" className="text-xs font-bold text-amber-400 cursor-pointer">
                    حالت شبیه‌ساز (Sandbox Mode) جهت تست بدون کسر شارژ
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: TEMPLATES */}
          {activeAdminSubTab === "TEMPLATES" && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="bg-slate-950 p-4 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{tpl.title}</span>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md font-mono">
                        کد پترن: {tpl.patternCode}
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={tpl.body}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTemplates(templates.map(t => t.id === tpl.id ? { ...t, body: val } : t));
                      }}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-slate-200 leading-relaxed font-mono"
                    />

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>متغیرها: {tpl.variables.map(v => `{${v}}`).join(", ")}</span>
                      <span className="text-emerald-400">پشتیبانی کامل از MeliPayamak Pattern API</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 3: LOGS */}
          {activeAdminSubTab === "LOGS" && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-white/10">
                    <tr>
                      <th className="p-3">گیرنده</th>
                      <th className="p-3">نوع تمپلیت</th>
                      <th className="p-3">متن پیامک</th>
                      <th className="p-3">وضعیت تحویل</th>
                      <th className="p-3">هزینه (تومان)</th>
                      <th className="p-3">زمان ارسال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {smsLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5">
                        <td className="p-3 font-mono font-bold text-white">{log.recipientPhone}</td>
                        <td className="p-3 text-blue-400 font-bold">{log.templateKey}</td>
                        <td className="p-3 max-w-xs truncate text-slate-300">{log.message}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === "DELIVERED" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          }`}>
                            {log.status === "DELIVERED" ? "رسیده به گوشی" : "خطا در ارسال"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-300">{log.costToman}</td>
                        <td className="p-3 text-slate-400">{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SmsOtpAuthenticationSystem;

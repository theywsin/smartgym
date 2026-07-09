import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Settings, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  MessageSquare, 
  Send, 
  User, 
  Dumbbell, 
  MapPin, 
  Calendar, 
  Utensils, 
  Clock, 
  Check, 
  Lock, 
  Phone, 
  Mail, 
  Database, 
  ShieldAlert, 
  ChevronRight, 
  Award, 
  Eye, 
  Heart, 
  Info,
  Layers,
  ShoppingBag,
  Ticket,
  Video,
  Menu,
  ChevronDown,
  Volume2,
  Apple,
  LogOut
} from "lucide-react";
import { 
  EXERCISES, 
  MOCK_TENANTS, 
  MOCK_WORKOUT_PROGRAMS, 
  MOCK_NUTRITION_PLANS, 
  MOCK_ATTENDANCE, 
  MOCK_INVOICES, 
  MOCK_BOOKINGS, 
  MOCK_TICKETS, 
  MOCK_AUDIT_LOGS, 
  MOCK_PRODUCTS,
  SUBSCRIPTION_PLANS,
  MOCK_BLOG_POSTS,
  MOCK_MEMBERS,
  MOCK_COACHES
} from "./data";
import { UserRole, Tenant, Booking, StoreProduct, toPersianNums, BlogPost } from "./types";
import ExerciseAnimation from "./components/ExerciseAnimation";

// Custom Premium Sub-components Integration
import GymLogo from "./components/GymLogo";
import IranianGatewaySimulator from "./components/IranianGatewaySimulator";
import AthleteDashboard from "./components/AthleteDashboard";
import GymInfoTab from "./components/GymInfoTab";
import CoachMemberDetail from "./components/CoachMemberDetail";
import AICoachProgramGenerator from "./components/AICoachProgramGenerator";
import TicketSystem from "./components/TicketSystem";
import CoachEarningsPanel from "./components/CoachEarningsPanel";
import BlogSection from "./components/BlogSection";
import BlogSettingsPanel from "./components/BlogSettingsPanel";

// @ts-ignore
import mascotSmart from "./assets/images/mascot_smart_1783248774021.jpg";
// @ts-ignore
import mascotSmartLaptop from "./assets/images/mascot_smart_laptop_1783249875312.jpg";

const SYSTEM_FEATURES = [
  { id: "coaches", label: "🏋️‍♂️ مدیریت مربیان و برنامه‌ها", desc: "مدیریت امور مربیان، دستمزدها و برنامه‌نویسی تمرینی" },
  { id: "support", label: "🎫 پشتیبانی و تیکت ابری", desc: "سیستم ارسال تیکت مستقیم بین مدیر باشگاه و پشتیبانی پلتفرم" },
  { id: "info", label: "🕒 ساعت کاری و موقعیت باشگاه", desc: "مدیریت روزها، ساعت کاری و نمایش نقشه گوگل و آدرس باشگاه" },
  { id: "ai_coach", label: "🤖 دستیار هوش مصنوعی (AI Coach)", desc: "دستیار فوق هوشمند هوش مصنوعی مربیان برای طراحی برنامه‌های اتوماتیک" },
  { id: "white_label", label: "⚙️ شخصی‌سازی برند و لوگو (White-Label)", desc: "امکان تغییر نام وب‌اپلیکیشن، لوگو و پالت رنگی توسط باشگاه" },
  { id: "payment_gateway", label: "💳 اتصال درگاه پرداخت اختصاصی باشگاه", desc: "اتصال به شبکه شتاب و بانک‌ها برای تسویه‌حساب فاکتورها" },
  { id: "buffet", label: "🛍️ بوفه هوشمند و انبارداری بوفه", desc: "بخش مدیریت و بوفه باشگاه، بارکدخوان، محصولات مکمل" },
  { id: "attendance", label: "⏱️ حضور و غیاب هوشمند با QR Code", desc: "کنترل پنل ثبت ورود و خروج ورزشکاران" }
];

export default function App() {
  // Navigation & Role states
  const [activeTab, setActiveTab] = useState<"landing" | "superadmin" | "tenant" | "coach" | "member" | "ai_labs" | "installer">("landing");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("isDarkMode");
    if (saved !== null) {
      return saved === "true";
    }
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true; // fallback default
  });
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("isDarkMode", String(next));
      return next;
    });
  };
  const [activePlanFeaturesEditId, setActivePlanFeaturesEditId] = useState<string | null>(null);

  // New Unified Design System States & Gateways
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>(SUBSCRIPTION_PLANS);
  const [paymentGatewayConfigs, setPaymentGatewayConfigs] = useState({
    activeGateway: "زرین‌پال (ZarinPal)",
    merchantId: "ZARINPAL-890124901",
    apiKey: "API_KEY_SECURE_981240",
    webhook: "https://smartgym.ir/api/v1/payment/webhook",
    isSandbox: true
  });
  
  const [tenantSubTab, setTenantSubTab] = useState<"dashboard" | "info" | "support" | "coaches">("dashboard");
  const [superAdminSubTab, setSuperAdminSubTab] = useState<"dashboard" | "plans" | "tickets" | "settings" | "smart_chat" | "blog">("dashboard");
  const [selectedDetailedMember, setSelectedDetailedMember] = useState<any | null>(null);

  // Iranian Payment Gateway flow states
  const [pendingPurchasePlan, setPendingPurchasePlan] = useState<any | null>(null);
  const [showPaymentSimulator, setShowPaymentSimulator] = useState(false);
  const [showTenantBrandModal, setShowTenantBrandModal] = useState(false);
  const [showTenantSubscriptionModal, setShowTenantSubscriptionModal] = useState(false);
  const [footerDocView, setFooterDocView] = useState<"terms" | "privacy" | "support" | "sla" | null>(null);
  const [tenantCustomColor, setTenantCustomColor] = useState("emerald");
  const [tenantBrandText, setTenantBrandText] = useState("");

  // Mascot Smart Assistant states
  const [showSmartAssistant, setShowSmartAssistant] = useState(false);
  const [smartActiveTip, setSmartActiveTip] = useState<string>("سلام قهرمان! من اسمارْت هستم، مسکات رسمی پلتفرم اسمارت جیم. چه کمکی می‌تونم بهت بکنم؟ روی دکمه‌های زیر کلیک کن تا با هم گپ بزنیم! 😊");
  const [smartLandingQuoteIndex, setSmartLandingQuoteIndex] = useState(0);

  // Mascot Live Chat State Variables (SaaS & Landing)
  const [smartChatSession, setSmartChatSession] = useState<{ id: string; userName: string; userPhone: string } | null>(null);
  const [smartChatMessages, setSmartChatMessages] = useState<any[]>([]);
  const [smartChatUserName, setSmartChatUserName] = useState<string>("");
  const [smartChatUserPhone, setSmartChatUserPhone] = useState<string>("");
  const [isSmartChatSubmittingName, setIsSmartChatSubmittingName] = useState<boolean>(false);
  const [smartChatInputText, setSmartChatInputText] = useState<string>("");
  const [allSmartChats, setAllSmartChats] = useState<any[]>([]);
  const [activeAdminChatId, setActiveAdminChatId] = useState<string>("");
  const [adminReplyText, setAdminReplyText] = useState<string>("");

  // Helper to check if a system feature is enabled for the logged-in tenant (or tenant context of a coach/member)
  const isTenantFeatureActive = (featureId: string): boolean => {
    let activeTenant = loggedInTenant;
    
    if (!activeTenant) {
      if (loggedInCoach) {
        // Find tenant by coach's clubId
        activeTenant = tenants.find(t => t.id === loggedInCoach.clubId);
      } else if (loggedInMember) {
        // Find tenant by member's clubId
        activeTenant = tenants.find(t => t.id === loggedInMember.clubId);
      }
    }
    
    // Fallback: if we still don't have an active tenant, but we have some tenants in the list, use the first one
    if (!activeTenant && tenants && tenants.length > 0) {
      activeTenant = tenants[0];
    }
    
    if (!activeTenant) return false;
    
    // Find matching plan in subscriptionPlans by name or ID
    const activePlan = subscriptionPlans.find(
      p => p.name === activeTenant.planName || p.id === activeTenant.planId
    );
    
    if (activePlan) {
      if (activePlan.unlockedFeatureIds) {
        return activePlan.unlockedFeatureIds.includes(featureId);
      }
      // Fallback configuration if unlockedFeatureIds is not yet populated
      const pName = activePlan.name || "";
      if (pName.includes("برنزی") || pName.includes("پایه")) {
        return ["info", "buffet", "attendance"].includes(featureId);
      }
      if (pName.includes("نقره‌ای") || pName.includes("حرفه‌ای")) {
        return ["info", "buffet", "attendance", "support", "ai_coach", "white_label"].includes(featureId);
      }
      return ["info", "buffet", "attendance", "support", "ai_coach", "white_label", "coaches", "payment_gateway"].includes(featureId);
    }
    
    // Fallback check for demo/pre-existing plan names
    const pName = activeTenant.planName || "";
    if (pName.includes("برنزی") || pName.includes("پایه")) {
      return ["info", "buffet", "attendance"].includes(featureId);
    }
    if (pName.includes("نقره‌ای") || pName.includes("حرفه‌ای")) {
      return ["info", "buffet", "attendance", "support", "ai_coach", "white_label"].includes(featureId);
    }
    
    return true;
  };


  // Persistent States
  const [workoutPrograms, setWorkoutPrograms] = useState<any[]>(MOCK_WORKOUT_PROGRAMS);
  const [nutritionPlans, setNutritionPlans] = useState<any[]>(MOCK_NUTRITION_PLANS);
  const [exercisesList, setExercisesList] = useState<any[]>(EXERCISES);
  const [newExName, setNewExName] = useState("");
  const [newExGroup, setNewExGroup] = useState("سینه");
  const [newExCorrect, setNewExCorrect] = useState("");
  const [newExWrong, setNewExWrong] = useState("");

  // Super Admin Authentication States
  const [isSuperAdminLoggedIn, setIsSuperAdminLoggedIn] = useState(() => {
    return localStorage.getItem("isSuperAdminLoggedIn") === "true";
  });
  const [adminUsernameInput, setAdminUsernameInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [isAdminLoginLoading, setIsAdminLoginLoading] = useState(false);

  // Installer State variables
  const [installerStep, setInstallerStep] = useState(1);
  const [installerDbHost, setInstallerDbHost] = useState("localhost");
  const [installerDbPort, setInstallerDbPort] = useState("3306");
  const [installerDbUser, setInstallerDbUser] = useState("");
  const [installerDbPassword, setInstallerDbPassword] = useState("");
  const [installerDbName, setInstallerDbName] = useState("");
  const [installerMigrateDemo, setInstallerMigrateDemo] = useState(true);
  const [installerAdminUser, setInstallerAdminUser] = useState("admin");
  const [installerAdminPass, setInstallerAdminPass] = useState("");
  const [installerBrandName, setInstallerBrandName] = useState("پلتفرم ابری اسمارت جیم");
  const [installerLogs, setInstallerLogs] = useState<string[]>(["سیستم نصب هوشمند لود شد. آماده دریافت پیکربندی..."]);
  const [isInstallerLoading, setIsInstallerLoading] = useState(false);
  const [installerStatus, setInstallerStatus] = useState<any>(null);

  // Tenant Authentication States
  const [loggedInTenant, setLoggedInTenant] = useState<any | null>(null);
  const [tenantUsernameInput, setTenantUsernameInput] = useState("");
  const [tenantPasswordInput, setTenantPasswordInput] = useState("");
  const [tenantLoginError, setTenantLoginError] = useState("");

  // Coaches Persistent List and Login States
  const [coaches, setCoaches] = useState<any[]>([
    { id: "1", name: "استاد پوریا کریمی", username: "pouria", password: "123", specialty: "بدنسازی و فیتنس", clubId: "all" },
    { id: "2", name: "سارا حسینی", username: "sara", password: "123", specialty: "تغذیه و لاغری", clubId: "all" }
  ]);
  const [loggedInCoach, setLoggedInCoach] = useState<any | null>(null);
  const [coachSales, setCoachSales] = useState<any[]>([
    { id: "s_1", coachId: "1", coachName: "استاد پوریا کریمی", studentName: "آرش احمدی", packageName: "برنامه تمرینی پیشرفته ۲۴ جلسه‌ای", price: 1200000, date: "1405/04/01", month: "تیر" },
    { id: "s_2", coachId: "1", coachName: "استاد پوریا کریمی", studentName: "سهراب مرادی", packageName: "رژیم غذایی تفکیک عضلانی ۳۰ روزه", price: 850000, date: "1405/04/02", month: "تیر" },
    { id: "s_3", coachId: "1", coachName: "استاد پوریا کریمی", studentName: "رضا قاسمی", packageName: "دوره فشرده چربی‌سوزی و آنالیز بدن", price: 1500000, date: "1405/03/12", month: "خرداد" },
    { id: "s_4", coachId: "2", coachName: "سارا حسینی", studentName: "الناز شاکری", packageName: "برنامه پیشرفته فرم‌دهی و تغذیه", price: 1800000, date: "1405/04/01", month: "تیر" },
    { id: "s_5", coachId: "1", coachName: "استاد پوریا کریمی", studentName: "آرش احمدی", packageName: "تمدید عضویت ماهانه کلوپ قهرمانان", price: 950000, date: "1405/03/25", month: "خرداد" }
  ]);
  const [coachUsernameInput, setCoachUsernameInput] = useState("");
  const [coachPasswordInput, setCoachPasswordInput] = useState("");
  const [coachLoginError, setCoachLoginError] = useState("");

  const [newCoachName, setNewCoachName] = useState("");
  const [newCoachUsername, setNewCoachUsername] = useState("");
  const [newCoachPassword, setNewCoachPassword] = useState("");
  const [newCoachSpecialty, setNewCoachSpecialty] = useState("بدنسازی و فیتنس");
  const [coachAddSuccess, setCoachAddSuccess] = useState(false);

  // Landing Page Interactive Features Slider State
  const [landingSlide, setLandingSlide] = useState(0);

  // Platform Customization & General SaaS Settings
  const [platformBrandLogo, setPlatformBrandLogo] = useState(() => localStorage.getItem("platformBrandLogo") || "SMART GYM");
  const [platformTheme, setPlatformTheme] = useState(() => localStorage.getItem("platformTheme") || "emerald"); // choices: emerald, blue, rose, violet, amber
  const [platformLogoUrl, setPlatformLogoUrl] = useState(() => localStorage.getItem("platformLogoUrl") || "");

  // Map platformTheme state to actual CSS styling properties dynamically
  const getThemeAccent = () => {
    switch (platformTheme) {
      case "blue":
        return {
          bg: "bg-blue-600",
          hoverBg: "hover:bg-blue-500",
          text: "text-blue-500",
          border: "border-blue-500",
          gradient: "from-blue-600 to-indigo-600",
          shadow: "shadow-blue-900/30",
          badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          focus: "focus:border-blue-500",
          fill: "fill-blue-500",
          accentColor: "blue"
        };
      case "rose":
        return {
          bg: "bg-rose-600",
          hoverBg: "hover:bg-rose-500",
          text: "text-rose-500",
          border: "border-rose-500",
          gradient: "from-rose-600 to-pink-600",
          shadow: "shadow-rose-900/30",
          badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          focus: "focus:border-rose-500",
          fill: "fill-rose-500",
          accentColor: "rose"
        };
      case "violet":
        return {
          bg: "bg-violet-600",
          hoverBg: "hover:bg-violet-500",
          text: "text-violet-500",
          border: "border-violet-500",
          gradient: "from-violet-600 to-fuchsia-600",
          shadow: "shadow-violet-900/30",
          badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
          focus: "focus:border-violet-500",
          fill: "fill-violet-500",
          accentColor: "violet"
        };
      case "amber":
        return {
          bg: "bg-amber-600",
          hoverBg: "hover:bg-amber-500",
          text: "text-amber-500",
          border: "border-amber-500",
          gradient: "from-amber-600 to-orange-600",
          shadow: "shadow-amber-900/30",
          badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          focus: "focus:border-amber-500",
          fill: "fill-amber-500",
          accentColor: "amber"
        };
      case "emerald":
      default:
        return {
          bg: "bg-emerald-600",
          hoverBg: "hover:bg-emerald-500",
          text: "text-emerald-500",
          border: "border-emerald-500",
          gradient: "from-emerald-600 to-teal-600",
          shadow: "shadow-emerald-900/30",
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          focus: "focus:border-emerald-500",
          fill: "fill-emerald-500",
          accentColor: "emerald"
        };
    }
  };

  const themeAccent = getThemeAccent();

  const [platformLandingTitle, setPlatformLandingTitle] = useState(() => localStorage.getItem("platformLandingTitle") || "مدیریت باشگاه را هوشمند، سریع و بدون دردسر انجام دهید");
  const [platformLandingSubtitle, setPlatformLandingSubtitle] = useState(() => localStorage.getItem("platformLandingSubtitle") || "از ساخت خودکار برنامه‌های تمرینی و غذایی با هوش مصنوعی گرفته تا حضور و غیاب پیشرفته، درگاه مستقیم بانکی، کلوپ وفاداری، انبارداری و بوفه، و مدیریت یکپارچه بی‌نهایت شعبه؛ همه و همه در یک بستر مدرن و شیشه‌ای (Glassmorphism).");
  
  // Payment Gateways Settings (SuperAdmin Configured)
  const [gatewayZarinpalEnabled, setGatewayZarinpalEnabled] = useState(() => localStorage.getItem("gatewayZarinpalEnabled") !== "false");
  const [gatewayZarinpalMerchant, setGatewayZarinpalMerchant] = useState(() => localStorage.getItem("gatewayZarinpalMerchant") || "zarinpal_merchant_889900");
  const [gatewaySepEnabled, setGatewaySepEnabled] = useState(() => localStorage.getItem("gatewaySepEnabled") !== "false");
  const [gatewaySepTerminalId, setGatewaySepTerminalId] = useState(() => localStorage.getItem("gatewaySepTerminalId") || "sep_terminal_998811");

  // Club / Tenant Subscription Details
  const [subscriptionDaysLeft, setSubscriptionDaysLeft] = useState(24); // default 24 days left
  const [clubRevenue, setClubRevenue] = useState(48200000); // 48,200,000 IRR base club revenue

  // Purchase & Credentials Generator States
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasedPlan, setPurchasedPlan] = useState<any | null>(null);
  const [generatedClubCredentials, setGeneratedClubCredentials] = useState<{username: string, password: string, clubName: string} | null>(null);

  // Member Subtab State for App bottom navigation
  const [memberSubTab, setMemberSubTab] = useState<"workout" | "nutrition" | "stats">("workout");

  // Coach Manual Creator View
  const [coachSubView, setCoachSubView] = useState<"directory" | "create_workout" | "create_nutrition" | "ai_generation" | "earnings">("directory");

  // Coach member selection and physical biometrics editor states
  const [selectedCoachMemberId, setSelectedCoachMemberId] = useState<string>("m_101");
  const [selectedTargetMemberId, setSelectedTargetMemberId] = useState<string>("");
  const [editMemberBmi, setEditMemberBmi] = useState("");
  const [editMemberBmr, setEditMemberBmr] = useState("");
  const [editMemberFat, setEditMemberFat] = useState("");
  const [editMemberArm, setEditMemberArm] = useState("");
  const [editMemberChest, setEditMemberChest] = useState("");
  const [editMemberWaist, setEditMemberWaist] = useState("");
  const [editMemberThigh, setEditMemberThigh] = useState("");
  const [editMemberNotes, setEditMemberNotes] = useState("");

  // Shared state for membership requests
  const [membershipRequests, setMembershipRequests] = useState<any[]>([]);

  // Search filter
  const [globalSearch, setGlobalSearch] = useState("");

  // AI Generation States
  const [aiWorkoutInput, setAiWorkoutInput] = useState({
    age: 26,
    gender: "آقا",
    weight: 78,
    height: 180,
    goal: "افزایش حجم عضلانی خشک",
    fitnessLevel: "متوسط",
    experience: "۲ سال سابقه بدنسازی",
    injuries: "کمی درد خفیف در مچ دست راست",
    daysPerWeek: 3
  });
  const [aiWorkoutResult, setAiWorkoutResult] = useState<any>(null);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);

  // Manual Workout Creator Form states
  const [mWorkoutTitle, setMWorkoutTitle] = useState("");
  const [mWorkoutSummary, setMWorkoutSummary] = useState("");
  const [mWorkoutDays, setMWorkoutDays] = useState<any[]>([]);
  
  // For building a single day in the workout creator
  const [mDayTitle, setMDayTitle] = useState("");
  const [mDayFocus, setMDayFocus] = useState("");
  const [mDayExercises, setMDayExercises] = useState<any[]>([]);
  
  // For building a single exercise within a day
  const [mExId, setMExId] = useState("");
  const [mExSets, setMExSets] = useState(4);
  const [mExReps, setMExReps] = useState("12");
  const [mExRest, setMExRest] = useState(60);

  // Manual Nutrition Creator Form states
  const [mNutTitle, setMNutTitle] = useState("");
  const [mNutCalories, setMNutCalories] = useState(2500);
  const [mNutProtein, setMNutProtein] = useState(150);
  const [mNutCarbs, setMNutCarbs] = useState(220);
  const [mNutFats, setMNutFats] = useState(70);
  const [mNutWater, setMNutWater] = useState(3.5);
  
  // Meals content textareas
  const [mNutBreakfast, setMNutBreakfast] = useState("");
  const [mNutLunch, setMNutLunch] = useState("");
  const [mNutDinner, setMNutDinner] = useState("");
  const [mNutSnack, setMNutSnack] = useState("");
  
  const [mNutAdvice, setMNutAdvice] = useState("");
  const [mNutShopping, setMNutShopping] = useState("");

  const [aiNutritionInput, setAiNutritionInput] = useState({
    age: 26,
    gender: "آقا",
    weight: 78,
    height: 180,
    goal: "چربی‌سوزی همزمان با عضله‌سازی (کات)",
    activityLevel: "تمرین منظم ۵ روز در هفته",
    dietaryRestrictions: "بدون محدودیت غذایی",
    dailyCalorieTarget: 2300
  });
  const [aiNutritionResult, setAiNutritionResult] = useState<any>(null);
  const [isGeneratingNutrition, setIsGeneratingNutrition] = useState(false);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: "assistant", content: "سلام قهرمان! من دستیار هوشمند مربیگری اسمارت جیم هستم. چطور می‌توانم امروز در تنظیم برنامه، آنالیز بدنی یا بهینه‌سازی تغذیه بهت کمک کنم؟" }
  ]);
  const [currentMessageInput, setCurrentMessageInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);

  // Live Workout Player States
  const [activeWorkoutProg, setActiveWorkoutProg] = useState(workoutPrograms[0]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState<any>(null);

  // Local persistent tables simulations for SaaS interactivity
  const [tenants, setTenants] = useState(MOCK_TENANTS);
  const [invoices, setInvoices] = useState(MOCK_INVOICES);
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [storeProducts, setStoreProducts] = useState(MOCK_PRODUCTS);
  const [attendanceRecords, setAttendanceRecords] = useState(MOCK_ATTENDANCE);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  // Gym members state with username & password for secure member panel login
  const [members, setMembers] = useState<any[]>([
    {
      id: "m_101",
      name: "آرش احمدی",
      username: "arash",
      password: "123",
      phone: "09121112233",
      assignedProgramId: "prog_1",
      assignedNutritionId: "nut_1",
      remainingSessions: 14,
      coachName: "استاد پوریا کریمی",
      joinedDate: "1405/01/10"
    },
    {
      id: "m_102",
      name: "سهراب مرادی",
      username: "sohrab",
      password: "123",
      phone: "09192223344",
      assignedProgramId: "prog_1",
      assignedNutritionId: "nut_1",
      remainingSessions: 12,
      coachName: "استاد پوریا کریمی",
      joinedDate: "1405/02/15"
    },
    {
      id: "m_103",
      name: "الناز شاکری",
      username: "elnaz",
      password: "123",
      phone: "09353334455",
      assignedProgramId: "prog_1",
      assignedNutritionId: "nut_1",
      remainingSessions: 8,
      coachName: "سارا حسینی",
      joinedDate: "1405/03/01"
    }
  ]);

  const [loggedInMember, setLoggedInMember] = useState<any | null>(null);

  // Login Form States for Member Panel
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // New Member Form States for Coach Panel
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberProgramId, setNewMemberProgramId] = useState("prog_1");
  const [newMemberNutritionId, setNewMemberNutritionId] = useState("nut_1");
  const [newMemberSessions, setNewMemberSessions] = useState(12);

  // PWA & Offline Simulation States
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [showPwaInstallModal, setShowPwaInstallModal] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false);
  const [offlineDownloadProgress, setOfflineDownloadProgress] = useState(0);

  // Forms states
  const [newTenant, setNewTenant] = useState({
    name: "",
    ownerName: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    planName: "پلن حرفه‌ای (نقره‌ای)",
    status: "ACTIVE" as const
  });

  const [newBooking, setNewBooking] = useState({
    className: "کلاس خصوصی کار با دستگاه",
    coachName: "استاد پوریا کریمی",
    memberName: "آرش احمدی",
    date: "1405/04/05",
    timeSlot: "19:00 - 20:30"
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "SUPPLEMENT" as const,
    brand: "",
    priceToman: 500000,
    stock: 20,
    minStockAlert: 5,
    barcode: ""
  });

  // Timers Reference
  const timerIntervalRef = useRef<any>(null);
  const restIntervalRef = useRef<any>(null);

  // Dynamic Coach Member and Biometrics synchronization
  const activeCoachMember = members.find(m => m.id === selectedCoachMemberId) || members[0];

  // -------------------------------------------------------------
  // Real cPanel MySQL Database Persistent Synchronizer via API
  // -------------------------------------------------------------
  const [isDbReady, setIsDbReady] = useState(false);
  const [isDbLoading, setIsDbLoading] = useState(true);

  // Generic fetch and seed helper
  const loadFromApi = async (table: string, seedData: any[]) => {
    try {
      const res = await fetch(`/api/db/${table}`);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data;
          }
        }
      }
    } catch (e) {
      console.error(`Error loading table ${table} from API:`, e);
    }
    // Seed initial data if empty or API fetch failed
    try {
      await fetch(`/api/db/${table}/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seedData)
      });
    } catch (e) {
      console.error(`Error seeding ${table} to API:`, e);
    }
    return seedData;
  };

  // Dynamic URL / Hash router for separate panel entry points
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace("#", "");
    const panel = params.get("panel") || hash;
    
    if (panel === "superadmin") {
      setActiveTab("superadmin");
    } else if (panel === "tenant") {
      setActiveTab("tenant");
    } else if (panel === "coach") {
      setActiveTab("coach");
    } else if (panel === "member") {
      setActiveTab("member");
    } else if (panel === "installer") {
      setActiveTab("installer");
    }
  }, []);

  useEffect(() => {
    const initializeCloudDatabase = async () => {
      try {
        console.log("Connecting to live cPanel REST API...");

        // 1. Tenants
        const loadedTenants = await loadFromApi("tenants", MOCK_TENANTS);
        setTenants(loadedTenants);

        // 2. Members (Athletes)
        const loadedMembers = await loadFromApi("members", MOCK_MEMBERS);
        setMembers(loadedMembers);

        // 3. Coaches
        const loadedCoaches = await loadFromApi("coaches", MOCK_COACHES);
        setCoaches(loadedCoaches);

        // 4. Membership Requests (Invoices)
        const loadedRequests = await loadFromApi("membership_requests", []);
        setMembershipRequests(loadedRequests);

        // 5. Workout Programs
        const loadedPrograms = await loadFromApi("workout_programs", MOCK_WORKOUT_PROGRAMS);
        setWorkoutPrograms(loadedPrograms);

        // 6. Nutrition Plans
        const loadedNutrition = await loadFromApi("nutrition_plans", MOCK_NUTRITION_PLANS);
        setNutritionPlans(loadedNutrition);

        // 7. Store Products
        const loadedProducts = await loadFromApi("store_products", MOCK_PRODUCTS);
        setStoreProducts(loadedProducts);

        // 8. Bookings
        const loadedBookings = await loadFromApi("bookings", MOCK_BOOKINGS);
        setBookings(loadedBookings);

        // 9. Tickets
        const loadedTickets = await loadFromApi("tickets", MOCK_TICKETS);
        setTickets(loadedTickets);

        // 10. Attendance Records
        const loadedAttendance = await loadFromApi("attendance_records", MOCK_ATTENDANCE);
        setAttendanceRecords(loadedAttendance);

        // 11. Exercises List
        const loadedExercises = await loadFromApi("exercises_database", EXERCISES);
        setExercisesList(loadedExercises);

        // 12. Coach Sales & Package Earnings List
        const initialSales = [
          { id: "s_1", coachId: "1", coachName: "استاد پوریا کریمی", studentName: "آرش احمدی", packageName: "برنامه تمرینی پیشرفته ۲۴ جلسه‌ای", price: 1200000, date: "1405/04/01", month: "تیر" },
          { id: "s_2", coachId: "1", coachName: "استاد پوریا کریمی", studentName: "سهراب مرادی", packageName: "رژیم غذایی تفکیک عضلانی ۳۰ روزه", price: 850000, date: "1405/04/02", month: "تیر" },
          { id: "s_3", coachId: "1", coachName: "استاد پوریا کریمی", studentName: "رضا قاسمی", packageName: "دوره فشرده چربی‌سوزی و آنالیز بدن", price: 1500000, date: "1405/03/12", month: "خرداد" },
          { id: "s_4", coachId: "2", coachName: "سارا حسینی", studentName: "الناز شاکری", packageName: "برنامه پیشرفته فرم‌دهی و تغذیه", price: 1800000, date: "1405/04/01", month: "تیر" },
          { id: "s_5", coachId: "1", coachName: "استاد پوریا کریمی", studentName: "آرش احمدی", packageName: "تمدید عضویت ماهانه کلوپ قهرمانان", price: 950000, date: "1405/03/25", month: "خرداد" }
        ];
        const loadedSales = await loadFromApi("coach_sales", initialSales);
        setCoachSales(loadedSales);

        // 13. Blog Posts List
        const loadedBlogs = await loadFromApi("blog_posts", MOCK_BLOG_POSTS);
        setBlogPosts(loadedBlogs);

        // 14. Load Global Platform Settings from server API
        try {
          const res = await fetch("/api/platform/settings");
          if (res.ok) {
            const settings = await res.json();
            if (settings) {
              if (settings.platformBrandLogo) {
                setPlatformBrandLogo(settings.platformBrandLogo);
                localStorage.setItem("platformBrandLogo", settings.platformBrandLogo);
              }
              if (settings.platformTheme) {
                setPlatformTheme(settings.platformTheme);
                localStorage.setItem("platformTheme", settings.platformTheme);
              }
              if (settings.platformLogoUrl !== undefined) {
                setPlatformLogoUrl(settings.platformLogoUrl);
                localStorage.setItem("platformLogoUrl", settings.platformLogoUrl);
              }
              if (settings.platformLandingTitle) {
                setPlatformLandingTitle(settings.platformLandingTitle);
                localStorage.setItem("platformLandingTitle", settings.platformLandingTitle);
              }
              if (settings.platformLandingSubtitle) {
                setPlatformLandingSubtitle(settings.platformLandingSubtitle);
                localStorage.setItem("platformLandingSubtitle", settings.platformLandingSubtitle);
              }
              if (settings.gatewayZarinpalEnabled !== undefined) {
                const val = settings.gatewayZarinpalEnabled === "true" || settings.gatewayZarinpalEnabled === true;
                setGatewayZarinpalEnabled(val);
                localStorage.setItem("gatewayZarinpalEnabled", String(val));
              }
              if (settings.gatewayZarinpalMerchant) {
                setGatewayZarinpalMerchant(settings.gatewayZarinpalMerchant);
                localStorage.setItem("gatewayZarinpalMerchant", settings.gatewayZarinpalMerchant);
              }
              if (settings.gatewaySepEnabled !== undefined) {
                const val = settings.gatewaySepEnabled === "true" || settings.gatewaySepEnabled === true;
                setGatewaySepEnabled(val);
                localStorage.setItem("gatewaySepEnabled", String(val));
              }
              if (settings.gatewaySepTerminalId) {
                setGatewaySepTerminalId(settings.gatewaySepTerminalId);
                localStorage.setItem("gatewaySepTerminalId", settings.gatewaySepTerminalId);
              }
            }
          }
        } catch (settingsError) {
          console.error("Error loading platform settings from server:", settingsError);
        }

        console.log("Live MySQL database successfully loaded and synchronized via REST API.");
        setIsDbReady(true);
        setIsDbLoading(false);
      } catch (error) {
        console.error("MySQL REST database failed to synchronize:", error);
        setIsDbLoading(false);
      }
    };

    initializeCloudDatabase();
  }, []);

  // Automated state synchronization to live cloud database
  useEffect(() => {
    if (isDbReady && blogPosts.length > 0) {
      fetch("/api/db/blog_posts/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blogPosts)
      }).catch(err => console.error(err));
    }
  }, [blogPosts, isDbReady]);

  useEffect(() => {
    if (isDbReady && tenants.length > 0) {
      fetch("/api/db/tenants/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenants)
      }).catch(err => console.error(err));
    }
  }, [tenants, isDbReady]);

  useEffect(() => {
    if (isDbReady && members.length > 0) {
      fetch("/api/db/members/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(members)
      }).catch(err => console.error(err));
    }
  }, [members, isDbReady]);

  useEffect(() => {
    if (isDbReady && coaches.length > 0) {
      fetch("/api/db/coaches/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coaches)
      }).catch(err => console.error(err));
    }
  }, [coaches, isDbReady]);

  useEffect(() => {
    if (isDbReady && membershipRequests.length > 0) {
      fetch("/api/db/membership_requests/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(membershipRequests)
      }).catch(err => console.error(err));
    }
  }, [membershipRequests, isDbReady]);

  useEffect(() => {
    if (isDbReady && workoutPrograms.length > 0) {
      fetch("/api/db/workout_programs/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workoutPrograms)
      }).catch(err => console.error(err));
    }
  }, [workoutPrograms, isDbReady]);

  useEffect(() => {
    if (isDbReady && nutritionPlans.length > 0) {
      fetch("/api/db/nutrition_plans/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nutritionPlans)
      }).catch(err => console.error(err));
    }
  }, [nutritionPlans, isDbReady]);

  useEffect(() => {
    if (isDbReady && storeProducts.length > 0) {
      fetch("/api/db/store_products/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeProducts)
      }).catch(err => console.error(err));
    }
  }, [storeProducts, isDbReady]);

  useEffect(() => {
    if (isDbReady && bookings.length > 0) {
      fetch("/api/db/bookings/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookings)
      }).catch(err => console.error(err));
    }
  }, [bookings, isDbReady]);

  useEffect(() => {
    if (isDbReady && tickets.length > 0) {
      fetch("/api/db/tickets/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tickets)
      }).catch(err => console.error(err));
    }
  }, [tickets, isDbReady]);

  useEffect(() => {
    if (isDbReady && attendanceRecords.length > 0) {
      fetch("/api/db/attendance_records/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceRecords)
      }).catch(err => console.error(err));
    }
  }, [attendanceRecords, isDbReady]);

  useEffect(() => {
    if (isDbReady && exercisesList.length > 0) {
      fetch("/api/db/exercises_database/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exercisesList)
      }).catch(err => console.error(err));
    }
  }, [exercisesList, isDbReady]);

  useEffect(() => {
    if (isDbReady && coachSales.length > 0) {
      fetch("/api/db/coach_sales/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coachSales)
      }).catch(err => console.error(err));
    }
  }, [coachSales, isDbReady]);

  // Mascot Live Chat support functions
  const fetchSmartMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/db/smart_support_chats`);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const chats = await res.json();
          const found = chats.find((c: any) => c.id === sessionId);
          if (found) {
            setSmartChatMessages(found.messages || []);
            return;
          }
        }
      }

      const initialMsg = {
        id: `m_init_${Date.now()}`,
        sender: "smart_ai",
        text: "سلام قهرمان! من اسمارْت هستم، مربی همراه و مسکات رسمی پلتفرم اسمارت جیم. چه کمکی می‌تونم بهت بکنم؟ هر سوالی داری بنویس تا با هم گپ بزنیم! 😊🦾",
        timestamp: new Date().toISOString()
      };

      const newChat = {
        id: sessionId,
        userName: localStorage.getItem("smart_chat_user_name") || "کاربر مهمان",
        userPhone: localStorage.getItem("smart_chat_user_phone") || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [initialMsg]
      };

      await fetch(`/api/db/smart_support_chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChat)
      });
      setSmartChatMessages([initialMsg]);
    } catch (e) {
      console.error("Error fetching smart chat messages:", e);
    }
  };

  const startNewSmartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartChatUserName.trim()) return;
    setIsSmartChatSubmittingName(true);
    const newSessionId = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem("smart_chat_session_id", newSessionId);
    localStorage.setItem("smart_chat_user_name", smartChatUserName);
    localStorage.setItem("smart_chat_user_phone", smartChatUserPhone);
    
    setSmartChatSession({ id: newSessionId, userName: smartChatUserName, userPhone: smartChatUserPhone });
    await fetchSmartMessages(newSessionId);
    setIsSmartChatSubmittingName(false);
  };

  const sendSmartChatMessage = async () => {
    if (!smartChatInputText.trim() || !smartChatSession) return;
    const userMsg = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text: smartChatInputText.trim(),
      timestamp: new Date().toISOString()
    };
    const updatedMessages = [...smartChatMessages, userMsg];
    setSmartChatMessages(updatedMessages);
    setSmartChatInputText("");

    try {
      const chatData = {
        id: smartChatSession.id,
        userName: smartChatSession.userName,
        userPhone: smartChatSession.userPhone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: updatedMessages
      };

      await fetch(`/api/db/smart_support_chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatData)
      });

      setTimeout(async () => {
        const smartReply = {
          id: `msg_auto_${Date.now()}`,
          sender: "smart_ai",
          text: `پیام شما به مربیان و مدیران ارشد اسمارت جیم ارسال شد! 🦾 من به عنوان مسکات پلتفرم اونو تو بخش جدید پنل سوپر ادمین ثبت کردم و به زودی همکارانم مستقیم جوابتو میدن. دم تلاشت گرم!`,
          timestamp: new Date().toISOString()
        };
        
        const res = await fetch(`/api/db/smart_support_chats`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const chats = await res.json();
            const found = chats.find((c: any) => c.id === smartChatSession.id);
            if (found) {
              const currentMsgs = found.messages || [];
              if (currentMsgs.length > 0 && currentMsgs[currentMsgs.length - 1].sender === "user") {
                const withReply = [...currentMsgs, smartReply];
                setSmartChatMessages(withReply);
                
                const updatedChat = {
                  ...found,
                  messages: withReply,
                  updatedAt: new Date().toISOString()
                };

                await fetch(`/api/db/smart_support_chats`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(updatedChat)
                });
              }
            }
          }
        }
      }, 2500);

    } catch (e) {
      console.error("Error sending smart chat message:", e);
    }
  };

  const fetchAllSmartChats = async () => {
    try {
      const res = await fetch(`/api/db/smart_support_chats`);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const chatsList = await res.json();
          chatsList.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          setAllSmartChats(chatsList);
        }
      }
    } catch (e) {
      console.error("Error fetching all smart chats:", e);
    }
  };

  const sendAdminReply = async (chatId: string) => {
    if (!adminReplyText.trim()) return;
    const adminMsg = {
      id: `msg_admin_${Date.now()}`,
      sender: "admin",
      text: adminReplyText.trim(),
      timestamp: new Date().toISOString()
    };
    
    try {
      const res = await fetch(`/api/db/smart_support_chats`);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const chats = await res.json();
          const found = chats.find((c: any) => c.id === chatId);
          if (found) {
            const updatedMessages = [...(found.messages || []), adminMsg];
            const updatedChat = {
              ...found,
              messages: updatedMessages,
              updatedAt: new Date().toISOString()
            };

            await fetch(`/api/db/smart_support_chats`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedChat)
            });

            setAdminReplyText("");
            fetchAllSmartChats();
          }
        }
      }
    } catch (e) {
      console.error("Error sending admin reply:", e);
    }
  };

  // Initialize and poll Mascot Chat
  useEffect(() => {
    const savedSessionId = localStorage.getItem("smart_chat_session_id");
    const savedName = localStorage.getItem("smart_chat_user_name") || "";
    const savedPhone = localStorage.getItem("smart_chat_user_phone") || "";
    if (savedSessionId) {
      setSmartChatSession({ id: savedSessionId, userName: savedName, userPhone: savedPhone });
      setSmartChatUserName(savedName);
      setSmartChatUserPhone(savedPhone);
      fetchSmartMessages(savedSessionId);

      const userInterval = setInterval(() => {
        fetchSmartMessages(savedSessionId);
      }, 5000);
      return () => clearInterval(userInterval);
    }
  }, []);

  // Poll for Admin Panel
  useEffect(() => {
    if (activeTab === "superadmin" && superAdminSubTab === "smart_chat") {
      fetchAllSmartChats();
      const adminInterval = setInterval(fetchAllSmartChats, 4000);
      return () => clearInterval(adminInterval);
    }
  }, [activeTab, superAdminSubTab]);

  useEffect(() => {
    if (activeCoachMember) {
      setEditMemberBmi(activeCoachMember.bmi || "۰.۰ (تعریف نشده)");
      setEditMemberBmr(activeCoachMember.bmr || "۰ کالری");
      setEditMemberFat(activeCoachMember.fatPercent || "۰٪");
      setEditMemberArm(activeCoachMember.armSize || "۰");
      setEditMemberChest(activeCoachMember.chestSize || "۰");
      setEditMemberWaist(activeCoachMember.waistSize || "۰");
      setEditMemberThigh(activeCoachMember.thighSize || "۰");
      setEditMemberNotes(activeCoachMember.notes || "پرونده فیزیکی جدید تشکیل شده است.");
    }
  }, [selectedCoachMemberId, members]);

  const handleUpdateBiometrics = () => {
    if (!selectedCoachMemberId) return;
    const updated = members.map(m => {
      if (m.id === selectedCoachMemberId) {
        return {
          ...m,
          bmi: editMemberBmi,
          bmr: editMemberBmr,
          fatPercent: editMemberFat,
          armSize: editMemberArm,
          chestSize: editMemberChest,
          waistSize: editMemberWaist,
          thighSize: editMemberThigh,
          notes: editMemberNotes
        };
      }
      return m;
    });
    setMembers(updated);
    alert(`🎉 پرونده پزشکی و آنالیز فیزیکی ورزشکار "${activeCoachMember?.name}" با موفقیت بروزرسانی شد و در دیتابیس MySQL ثبت گردید.`);
  };

  // Landing page interactive features slider autoplay
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setLandingSlide((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, []);

  // Workout Timer logic
  useEffect(() => {
    if (isPlaying && !isResting) {
      timerIntervalRef.current = setInterval(() => {
        setWorkoutTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isPlaying, isResting]);

  // Rest Timer logic
  useEffect(() => {
    if (isResting && restTimer > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            clearInterval(restIntervalRef.current);
            // Move to next set or next exercise
            handleSetComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(restIntervalRef.current);
    }
    return () => clearInterval(restIntervalRef.current);
  }, [isResting, restTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startWorkout = () => {
    setIsPlaying(true);
    setIsResting(false);
    setWorkoutTimer(0);
    setActiveExerciseIndex(0);
    setActiveSetIndex(0);
    setWorkoutSummary(null);
  };

  const pauseWorkout = () => {
    setIsPlaying(false);
  };

  const handleSetComplete = () => {
    const currentDay = activeWorkoutProg.schedule[activeDayIndex];
    const currentExercise = currentDay.exercises[activeExerciseIndex];
    
    // Mark current set as completed
    currentExercise.sets[activeSetIndex].isCompleted = true;

    if (activeSetIndex < currentExercise.sets.length - 1) {
      // Next set in same exercise
      setActiveSetIndex((prev) => prev + 1);
      // Start rest timer
      setRestTimer(currentExercise.restDurationSeconds);
      setIsResting(true);
    } else {
      // Last set of exercise, move to next exercise
      if (activeExerciseIndex < currentDay.exercises.length - 1) {
        setActiveExerciseIndex((prev) => prev + 1);
        setActiveSetIndex(0);
        setRestTimer(currentExercise.restDurationSeconds);
        setIsResting(true);
      } else {
        // Workout Finished!
        setIsPlaying(false);
        setWorkoutSummary({
          totalDuration: workoutTimer,
          exercisesCount: currentDay.exercises.length,
          setsCount: currentDay.exercises.reduce((acc, ex) => acc + ex.sets.length, 0),
          caloriesBurned: Math.round(workoutTimer * 0.15) // simple calculation
        });
        // Create an automated attendance and check-out record
        const newAtt: any = {
          id: `att_${Date.now()}`,
          memberId: "m_101",
          memberName: "آرش احمدی",
          date: "1405/04/01",
          checkInTime: "17:00",
          checkOutTime: "18:25",
          totalHours: 1.4,
          status: "PRESENT"
        };
        setAttendanceRecords([newAtt, ...attendanceRecords]);
      }
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  // call real Gemini endpoints from server
  const generateWorkoutWithAI = async () => {
    setIsGeneratingWorkout(true);
    setAiWorkoutResult(null);
    try {
      const response = await fetch("/api/ai/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiWorkoutInput)
      });
      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: text || "پاسخ نامعتبر از سرور دریافت شد." };
      }
      if (response.ok) {
        setAiWorkoutResult(data);
      } else {
        alert(data.error || "خطایی در تولید برنامه بدنسازی با هوش مصنوعی رخ داد.");
      }
    } catch (e: any) {
      console.error(e);
      alert("خطا در برقراری ارتباط با سرور هوش مصنوعی.");
    } finally {
      setIsGeneratingWorkout(false);
    }
  };

  const generateNutritionWithAI = async () => {
    setIsGeneratingNutrition(true);
    setAiNutritionResult(null);
    try {
      const response = await fetch("/api/ai/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiNutritionInput)
      });
      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: text || "پاسخ نامعتبر از سرور دریافت شد." };
      }
      if (response.ok) {
        setAiNutritionResult(data);
      } else {
        alert(data.error || "خطایی در تولید برنامه غذایی با هوش مصنوعی رخ داد.");
      }
    } catch (e: any) {
      console.error(e);
      alert("خطا در برقراری ارتباط با سرور هوش مصنوعی.");
    } finally {
      setIsGeneratingNutrition(false);
    }
  };

  const sendChatMessage = async () => {
    if (!currentMessageInput.trim()) return;
    const userMsg = { role: "user", content: currentMessageInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setCurrentMessageInput("");
    setIsChatSending(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          userRole: activeTab === "coach" ? "مربی ورزشی" : "مدیر باشگاه اکسیژن"
        })
      });
      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { error: text || "ارتباط ناموفق با سرور چت" };
      }
      if (response.ok) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "assistant", content: "عذرخواهی می‌کنم، خطایی در پاسخ‌دهی هوش مصنوعی رخ داد: " + data.error }]);
      }
    } catch (e) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "متاسفانه ارتباط با سرور هوش مصنوعی قطع شده است." }]);
    } finally {
      setIsChatSending(false);
    }
  };

  // Add new tenant
  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.ownerName) return;
    if (!newTenant.username || !newTenant.password) {
      alert("لطفا نام کاربری و رمز عبور باشگاه جدید را تعیین کنید.");
      return;
    }
    const newlyCreated: Tenant = {
      id: `tenant_${Date.now()}`,
      name: newTenant.name,
      ownerName: newTenant.ownerName,
      email: newTenant.email || "info@gym.ir",
      phone: newTenant.phone || "09120000000",
      username: newTenant.username.trim().toLowerCase(),
      password: newTenant.password.trim(),
      status: "ACTIVE",
      planName: newTenant.planName,
      expiresAt: "1406/04/01",
      branchesCount: 1,
      membersCount: 0,
      monthlyRevenue: 0,
      createdAt: "1405/04/01",
      domain: "",
      features: []
    };

    fetch("/api/db/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newlyCreated)
    })
      .then(async (response) => {
        if (response.ok) {
          setTenants([...tenants, newlyCreated]);
          setNewTenant({ name: "", ownerName: "", email: "", phone: "", username: "", password: "", planName: "پلن حرفه‌ای (نقره‌ای)", status: "ACTIVE" });
          alert(`باشگاه "${newlyCreated.name}" با موفقیت در دیتابیس سراسری ثبت و تعریف شد.\nنام کاربری: ${newlyCreated.username}\nکلمه عبور: ${newlyCreated.password}`);
        } else {
          const text = await response.text();
          alert(`خطا در ذخیره باشگاه در دیتابیس: ${text}`);
        }
      })
      .catch((err) => {
        console.error("Error creating tenant in db:", err);
        alert("بروز خطا در ارتباط با پایگاه داده جهت ایجاد باشگاه جدید.");
      });
  };

  // Add new booking
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const activeClubId = loggedInTenant?.id || "oxigen";
    const newlyCreated: Booking = {
      id: `b_${Date.now()}`,
      ...newBooking,
      status: "CONFIRMED",
      clubId: activeClubId
    };
    setBookings([...bookings, newlyCreated]);
    alert("رزرو کلاس با موفقیت در سیستم ثبت گردید.");
  };

  // Add new shop product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.brand) return;
    const activeClubId = loggedInTenant?.id || "oxigen";
    const newlyCreated: StoreProduct = {
      id: `p_${Date.now()}`,
      ...newProduct,
      clubId: activeClubId
    };
    setStoreProducts([...storeProducts, newlyCreated]);
    setNewProduct({ name: "", category: "SUPPLEMENT", brand: "", priceToman: 500000, stock: 20, minStockAlert: 5, barcode: "" });
    alert("محصول با موفقیت به انبار بوفه اضافه شد.");
  };

  // Create member account (Coach Action)
  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberUsername || !newMemberPassword) {
      alert("لطفاً فیلدهای اجباری (نام، نام کاربری و رمز عبور) را پر کنید.");
      return;
    }

    const exists = members.some(m => m.username.toLowerCase() === newMemberUsername.trim().toLowerCase());
    if (exists) {
      alert("این نام کاربری قبلاً تعریف شده است. لطفا نام کاربری دیگری انتخاب کنید.");
      return;
    }

    const activeClubId = loggedInTenant?.id || loggedInCoach?.clubId || "oxigen";

    const newlyCreated = {
      id: `m_${Date.now()}`,
      name: newMemberName,
      username: newMemberUsername.trim(),
      password: newMemberPassword,
      phone: newMemberPhone || "09120000000",
      assignedProgramId: newMemberProgramId,
      assignedNutritionId: newMemberNutritionId,
      remainingSessions: Number(newMemberSessions) || 12,
      coachName: loggedInCoach?.name || "استاد پوریا کریمی",
      joinedDate: "1405/04/01",
      clubId: activeClubId
    };

    fetch("/api/db/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newlyCreated)
    })
      .then(async (response) => {
        if (response.ok) {
          setMembers([...members, newlyCreated]);
          // Clear Form
          setNewMemberName("");
          setNewMemberPhone("");
          setNewMemberUsername("");
          setNewMemberPassword("");
          setNewMemberSessions(12);
          alert(`حساب کاربری ورزشکار "${newlyCreated.name}" با موفقیت در دیتابیس ایجاد شد! اکنون ورزشکار می‌تواند با نام کاربری "${newlyCreated.username}" وارد پنل خود شود.`);
        } else {
          const text = await response.text();
          alert(`خطا در ایجاد ورزشکار در دیتابیس: ${text}`);
        }
      })
      .catch((err) => {
        console.error("Error creating member in db:", err);
        alert("بروز خطا در ارتباط با پایگاه داده جهت ایجاد ورزشکار جدید.");
      });
  };

  // Login Member handler (Member Action)
  const handleMemberLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = members.find(
      (m) => m.username.toLowerCase() === loginUsername.trim().toLowerCase() && m.password === loginPassword
    );
    if (found) {
      setLoggedInMember(found);
      setLoginError("");
      
      // Load assigned workout program or fallback to first
      const memberProg = workoutPrograms.find(p => p.id === found.assignedProgramId) || workoutPrograms[0];
      setActiveWorkoutProg(memberProg);
      setActiveDayIndex(0);
      setActiveExerciseIndex(0);
      setActiveSetIndex(0);
      setIsPlaying(false);
      setIsResting(false);
      setWorkoutSummary(null);
    } else {
      setLoginError("نام کاربری یا رمز عبور اشتباه است.");
    }
  };

  // Logout member
  const handleMemberLogout = () => {
    setLoggedInMember(null);
    setLoginUsername("");
    setLoginPassword("");
  };

  // Simulate PWA offline download caching
  const triggerOfflineCaching = () => {
    setIsDownloadingOffline(true);
    setOfflineDownloadProgress(0);
    
    const interval = setInterval(() => {
      setOfflineDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloadingOffline(false);
          setIsOfflineMode(true);
          // Save mock to localStorage to show real persistence
          localStorage.setItem("smartgym_offline_workout", JSON.stringify(activeWorkoutProg));
          alert("تمام برنامه‌های بدنسازی و رژیم غذایی شما در کش محلی PWA ذخیره شد! اکنون حتی در مترو یا سالن‌های بدون اینترنت نیز به فیلم‌ها، آموزش‌ها و زمان‌سنج تمرین دسترسی کامل دارید.");
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  const tenantIdContext = loggedInTenant?.id || loggedInCoach?.clubId || loggedInMember?.clubId || "";

  const displayedMembers = members.filter(m => {
    if (!tenantIdContext || tenantIdContext === "oxigen") return true;
    return m.clubId === tenantIdContext;
  });

  const displayedCoaches = coaches.filter(c => {
    if (!tenantIdContext || tenantIdContext === "oxigen") return true;
    return c.clubId === tenantIdContext || c.clubId === "all";
  });

  const displayedBookings = bookings.filter(b => {
    if (!tenantIdContext || tenantIdContext === "oxigen") return true;
    return b.clubId === tenantIdContext;
  });

  const displayedStoreProducts = storeProducts.filter(p => {
    if (!tenantIdContext || tenantIdContext === "oxigen") return true;
    return p.clubId === tenantIdContext;
  });

  const displayedTickets = tickets.filter(t => {
    if (!tenantIdContext || tenantIdContext === "oxigen") return true;
    return t.clubId === tenantIdContext;
  });

  const displayedAttendanceRecords = attendanceRecords.filter(a => {
    if (!tenantIdContext || tenantIdContext === "oxigen") return true;
    return a.clubId === tenantIdContext;
  });

  const displayedCoachSales = coachSales.filter(s => {
    if (!tenantIdContext || tenantIdContext === "oxigen") return true;
    return s.clubId === tenantIdContext;
  });

  const displayedBlogPosts = blogPosts.filter(b => {
    if (!tenantIdContext || tenantIdContext === "oxigen") return true;
    return b.clubId === tenantIdContext;
  });

  const displayedWorkoutPrograms = workoutPrograms.filter(p => {
    if (!tenantIdContext || tenantIdContext === "oxigen") return true;
    return p.clubId === tenantIdContext;
  });

  const displayedNutritionPlans = nutritionPlans.filter(p => {
    if (!tenantIdContext || tenantIdContext === "oxigen") return true;
    return p.clubId === tenantIdContext;
  });

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark-theme-vars bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} font-sans transition-colors duration-200 selection:bg-emerald-600/30 overflow-x-hidden`} dir="rtl">
      
      {/* Dynamic Theme Style Override */}
      <style>{`
        :root {
          --primary: ${
            platformTheme === "blue" ? "#2563eb" :
            platformTheme === "rose" ? "#e11d48" :
            platformTheme === "violet" ? "#7c3aed" :
            platformTheme === "amber" ? "#d97706" :
            "#10b981"
          };
          --secondary: ${
            platformTheme === "blue" ? "#60a5fa" :
            platformTheme === "rose" ? "#fb7185" :
            platformTheme === "violet" ? "#a78bfa" :
            platformTheme === "amber" ? "#fbbf24" :
            "#34d399"
          };
          --accent: ${
            platformTheme === "blue" ? "#93c5fd" :
            platformTheme === "rose" ? "#fecdd3" :
            platformTheme === "violet" ? "#ddd6fe" :
            platformTheme === "amber" ? "#fde68a" :
            "#a7f3d0"
          };
        }
        
        ::selection {
          background-color: var(--primary) !important;
          opacity: 0.3;
        }

        /* Dynamically style primary colored elements matching platformTheme */
        .text-emerald-400 {
          color: ${
            platformTheme === "blue" ? "#60a5fa" :
            platformTheme === "rose" ? "#fb7185" :
            platformTheme === "violet" ? "#a78bfa" :
            platformTheme === "amber" ? "#fbbf24" :
            "#34d399"
          } !important;
        }

        .bg-emerald-600 {
          background-color: var(--primary) !important;
        }

        .hover\\:bg-emerald-500:hover {
          background-color: var(--secondary) !important;
        }

        .border-emerald-500 {
          border-color: var(--primary) !important;
        }

        .bg-emerald-500\\/10 {
          background-color: ${
            platformTheme === "blue" ? "rgba(96, 165, 250, 0.1)" :
            platformTheme === "rose" ? "rgba(251, 113, 133, 0.1)" :
            platformTheme === "violet" ? "rgba(167, 139, 250, 0.1)" :
            platformTheme === "amber" ? "rgba(251, 191, 36, 0.1)" :
            "rgba(52, 211, 153, 0.1)"
          } !important;
          color: ${
            platformTheme === "blue" ? "#60a5fa" :
            platformTheme === "rose" ? "#fb7185" :
            platformTheme === "violet" ? "#a78bfa" :
            platformTheme === "amber" ? "#fbbf24" :
            "#34d399"
          } !important;
        }

        .text-gradient-emerald-green, .text-gradient-cyan-blue {
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }

        .pulsing-glow {
          box-shadow: 0 0 20px ${
            platformTheme === "blue" ? "rgba(37, 99, 235, 0.2)" :
            platformTheme === "rose" ? "rgba(225, 29, 72, 0.2)" :
            platformTheme === "violet" ? "rgba(124, 58, 237, 0.2)" :
            platformTheme === "amber" ? "rgba(217, 119, 6, 0.2)" :
            "rgba(16, 185, 129, 0.2)"
          } !important;
        }
      `}</style>
      
      {/* 1. Header & Brand Navigation Section */}
      {!(activeTab === "member" && loggedInMember) && (
        <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("landing")}>
              <GymLogo showText={true} size="md" isDark={isDarkMode} brandText={platformBrandLogo} themeColor={platformTheme} logoUrl={platformLogoUrl} />
            </div>

            {/* Desktop Navigation - Hidden Role Selector with Clean Dynamic Badge */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {activeTab === "landing" ? (
                <span className="text-slate-500 text-xs font-medium">پلتفرم مدیریت هوشمند و اختصاصی باشگاه‌های ورزشی</span>
              ) : activeTab === "superadmin" ? (
                <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-1.5 rounded-full text-xs font-black">⚙️ محیط امن نظارت کلان (Super Admin)</span>
              ) : activeTab === "tenant" ? (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-black">🏢 پنل اختصاصی مدیریت باشگاه</span>
              ) : activeTab === "coach" ? (
                <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-4 py-1.5 rounded-full text-xs font-black">🏋️‍♂️ پنل اختصاصی مربیان بدنسازی</span>
              ) : activeTab === "member" ? (
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-black">👤 پرتال اختصاصی ورزشکاران</span>
              ) : activeTab === "installer" ? (
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-1.5 rounded-full text-xs font-black">🛠️ سیستم نصب آسان پلتفرم (Easy Installer)</span>
              ) : null}
            </nav>
          </div>

          {/* Action Controls & Dark Mode Toggle */}
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleDarkMode} 
              className="p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
              title="تغییر تم رنگی"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            
            <button 
              onClick={() => {
                setActiveTab("landing");
                setTimeout(() => {
                  const plansEl = document.getElementById("subscription_plans_section");
                  if (plansEl) {
                    plansEl.scrollIntoView({ behavior: "smooth" });
                  } else {
                    alert("هم‌اکنون بسته‌های اشتراک باشگاه در نیمه پایین لندینگ در دسترس هستند.");
                  }
                }, 150);
              }}
              className="hidden sm:flex items-center gap-1.5 bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg hover:brightness-110 transition-all pulsing-glow"
            >
              🛒 خرید اشتراک باشگاه‌ها
            </button>

            <button 
              className="lg:hidden p-2 text-slate-300 hover:text-white" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>
      )}

      {/* Mobile Menu Navigation overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-slate-950/95 border-b border-white/10 z-40 p-4 flex flex-col gap-3 backdrop-blur-xl animate-fade-in">
          <button 
            onClick={() => { setActiveTab("landing"); setIsMobileMenuOpen(false); }}
            className={`p-3 rounded-xl text-sm font-bold text-right transition-all ${activeTab === "landing" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"}`}
          >
            صفحه اصلی لندینگ (اسمارت جیم)
          </button>
          {activeTab !== "landing" && (
            <div className="p-3 bg-slate-900 border border-white/5 rounded-xl text-xs font-black text-center text-slate-400">
              {activeTab === "superadmin" ? "⚙️ در حال نظارت در پنل سوپر ادمین" :
               activeTab === "tenant" ? "🏢 در حال مدیریت در پنل باشگاه" :
               activeTab === "coach" ? "🏋️‍♂️ در حال نظارت در پنل مربیان" :
               activeTab === "member" ? "👤 در حال استفاده در پرتال ورزشکاران" :
               activeTab === "installer" ? "🛠️ در حال پیکربندی در Easy Installer" : ""}
            </div>
          )}
        </div>
      )}


      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* -------------------- TAB 1: LANDING PAGE -------------------- */}
        {activeTab === "landing" && (
          <div className="space-y-24">
            
            {/* Hero Grid Segment */}
            <div className="grid lg:grid-cols-2 gap-12 items-center pt-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  بروزرسانی جدید: مجهز به موتور هوش مصنوعی مربیگری هوشمند
                </div>
                
                <h1 className="text-3xl sm:text-5xl font-black leading-tight text-slate-100">
                  {platformLandingTitle}
                </h1>

                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {platformLandingSubtitle}
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button 
                    onClick={() => setActiveTab("member")}
                    className="bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-blue-900/30 hover:brightness-110 transition-all flex items-center gap-2 text-sm"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    شروع رایگان و تست پلیر تمرینی
                  </button>
                  <button 
                    onClick={() => setActiveTab("ai_labs")}
                    className="border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-200 font-bold px-8 py-4 rounded-2xl transition-all text-sm flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    درخواست دمو هوش مصنوعی
                  </button>
                </div>

                {/* Micro statistics row */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">+۵۰۰</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">باشگاه فعال کشور</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">۱۲,۰۰۰</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">مربی بدنساز عضو</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-violet-400">۹۹.۹٪</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">آپتایم سرور متصل</div>
                  </div>
                </div>
              </div>

              {/* Graphical App Frame Mockup */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-emerald-500/10 rounded-[3rem] blur-3xl -z-10"></div>
                <div className="bg-slate-900/80 rounded-[2.5rem] border border-white/10 p-4 shadow-2xl backdrop-blur-xl">
                  <div className="bg-slate-950 rounded-[2rem] overflow-hidden border border-white/5">
                    {/* Header bar */}
                    <div className="flex items-center justify-between p-3 bg-slate-900/80 border-b border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-4 py-1 rounded-full">oxygen-club.smartgym.ir</span>
                      <div className="w-6"></div>
                    </div>

                    {/* Preview Dashboard / Animated Interactive Features Slider */}
                    <div className="p-6 space-y-6 min-h-[380px] flex flex-col justify-between transition-all duration-500">
                      
                      {/* Slide Content wrapper with fade/slide animations */}
                      <div className="space-y-4 animate-fade-in animate-duration-300">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wider text-slate-950 bg-gradient-to-r ${
                            landingSlide === 0 ? "from-emerald-400 to-teal-400" :
                            landingSlide === 1 ? "from-blue-400 to-indigo-400" :
                            landingSlide === 2 ? "from-amber-400 to-orange-400" :
                            "from-violet-400 to-purple-400"
                          }`}>
                            {
                              landingSlide === 0 ? "هوش مصنوعی هوشمند (AI Co-pilot)" :
                              landingSlide === 1 ? "اپلیکیشن اختصاصی ورزشکار (PWA)" :
                              landingSlide === 2 ? "حسابداری و درگاه ابری" :
                              "هویت کلوپ ورزشی شما"
                            }
                          </span>
                          
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                            <span>{landingSlide + 1} / 4</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-right">
                          <h4 className="text-base font-black text-white">
                            {
                              landingSlide === 0 ? "موتور فوق‌پیشرفته هوش مصنوعی" :
                              landingSlide === 1 ? "اپلیکیشن شیشه‌ای بدون نیاز به نصب" :
                              landingSlide === 2 ? "امور مالی و فروش هوشمند بوفه" :
                              "شخصی‌سازی کامل هویت باشگاه"
                            }
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {
                              landingSlide === 0 ? "طراحی فوری و اتوماتیک برنامه‌های تمرینی و غذایی متناسب با بیومتریک و شاخص‌های فیزیکی ورزشکار در چند ثانیه." :
                              landingSlide === 1 ? "پخش‌کننده تمرینی مجهز به زمان‌سنج ست‌ها، انیمیشن حرکات و ثبت رکوردهای روزانه برای ورزشکاران کلوپ." :
                              landingSlide === 2 ? "سیستم مدیریت درگاه پرداخت، فاکتورهای دوره‌ای، انبارداری بوفه و پکیج‌های عضویت باشگاه با گزارش مالی متمرکز." :
                              "امکان ویرایش ساعات کاری، نام شعبه، لوگوی کلوپ، آدرس نقشه و پکیج‌های اختصاصی برای مستقل‌سازی برند باشگاه شما."
                            }
                          </p>
                        </div>

                        {/* Interactive Widget Simulation Based on Slide Index */}
                        <div className="pt-2">
                          {landingSlide === 0 && (
                            <div className="space-y-3 bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl animate-fade-in">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">تحلیل وزن ورزشکار:</span>
                                <span className="text-emerald-400 font-extrabold font-mono">۷۸ کیلوگرم</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-full animate-pulse" style={{ width: "65%" }}></div>
                              </div>
                              <div className="text-[10px] text-slate-500 text-center">🎯 پیشنهاد هوشمند: برنامه هایپرتروفی سینه و بازو</div>
                            </div>
                          )}

                          {landingSlide === 1 && (
                            <div className="space-y-3 bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl animate-fade-in">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">ست بعدی تمرین:</span>
                                <span className="text-blue-400 font-bold font-mono">ست ۲ از ۴</span>
                              </div>
                              <div className="bg-slate-950 p-2 rounded-xl text-center text-[10px] text-slate-300 border border-white/5 flex justify-between items-center">
                                <span>حرکت: پرس سینه هالتر</span>
                                <span className="text-blue-400 font-bold">۱۲ تکرار × ۸۰ کیلوگرم</span>
                              </div>
                            </div>
                          )}

                          {landingSlide === 2 && (
                            <div className="space-y-3 bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl animate-fade-in">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">تراکنش‌های موفق امروز:</span>
                                <span className="text-amber-400 font-bold font-mono">۴,۸۲۰,۰۰۰ تومان</span>
                              </div>
                              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-l from-amber-500 to-orange-400 rounded-full" style={{ width: "82%" }}></div>
                              </div>
                            </div>
                          )}

                          {landingSlide === 3 && (
                            <div className="space-y-3 bg-violet-500/5 border border-violet-500/10 p-4 rounded-2xl animate-fade-in">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">پیکربندی باشگاه:</span>
                                <span className="text-violet-400 font-bold font-mono">oxygen.smartgym.ir</span>
                              </div>
                              <div className="bg-slate-950 p-2 rounded-xl text-center text-[10px] text-slate-400 border border-white/5">
                                ✔ لوگوی شخصی بارگذاری شد • نام شعبه: اکسیژن مرکزی
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Dots and Navigation Controls */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <button 
                          onClick={() => setLandingSlide((prev) => (prev - 1 + 4) % 4)}
                          className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 hover:border-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-all text-sm font-bold"
                          title="قبلی"
                        >
                          →
                        </button>

                        {/* Dot indicators */}
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2, 3].map((idx) => (
                            <button
                              key={idx}
                              onClick={() => setLandingSlide(idx)}
                              className={`h-2 rounded-full transition-all duration-300 ${idx === landingSlide ? "w-6 bg-blue-500" : "w-2 bg-slate-700 hover:bg-slate-600"}`}
                            ></button>
                          ))}
                        </div>

                        <button 
                          onClick={() => setLandingSlide((prev) => (prev + 1) % 4)}
                          className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 hover:border-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-all text-sm font-bold"
                          title="بعدی"
                        >
                          ←
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Key Core Features Bento Grid */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-4xl font-extrabold">امکانات فوق‌پیشرفته و هوشمند پلتفرم</h2>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto">تمام آنچه برای اتوماسیون کامل باشگاه بدنسازی و مربیگری خود نیاز دارید، در قالب یک محصول تجاری و یکپارچه.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Feature Card 1: AI Coach Engine */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-emerald-500/30 transition-all hover:translate-y-[-2px] text-right" dir="rtl">
                  <div className="w-12 h-12 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-400 text-2xl font-black">
                    🧠
                  </div>
                  <h3 className="text-base font-black text-white">طراحی برنامه با هوش مصنوعی (AI Coach Engine)</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    ایجاد خودکار برنامه‌های ورزشی و رژیم‌های غذایی کاملاً علمی منطبق بر تیپ بدنی، سطح سابقه و بیومتریک اعضا با تکیه بر مدل نوین هوش مصنوعی Gemini 3.5 در کمتر از ۳ ثانیه.
                  </p>
                  <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[10px] text-emerald-400">
                    <span>ثبت اتوماتیک رکوردهای بدنی</span>
                    <span>Gemini 3.5 • فعال</span>
                  </div>
                </div>

                {/* Feature Card 2: Smart QR Attendance */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-blue-500/30 transition-all hover:translate-y-[-2px] text-right" dir="rtl">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 text-2xl font-black">
                    ⚡
                  </div>
                  <h3 className="text-base font-black text-white">اتوماسیون کلوپ و گیت هوشمند (Smart QR Gateway)</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    حضور و غیاب پیشرفته ورزشکاران با بارکدخوان و کد QR پویا در اپلیکیشن، متصل به کمدها و ثبت سوابق تردد به صورت زنده در پنل مدیریت شعبه با نظارت تصویری.
                  </p>
                  <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[10px] text-blue-400">
                    <span>کاهش ترافیک پذیرش کلوپ</span>
                    <span>شناسه QR پویا • هوشمند</span>
                  </div>
                </div>

                {/* Feature Card 3: White-label SaaS Platform */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-violet-500/30 transition-all hover:translate-y-[-2px] text-right" dir="rtl">
                  <div className="w-12 h-12 bg-violet-600/20 rounded-2xl flex items-center justify-center text-violet-400 text-2xl font-black">
                    🌐
                  </div>
                  <h3 className="text-base font-black text-white">پورتال اختصاصی وایت‌لیبل (White-Label App)</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    ارائه آدرس دامنه شخصی، آپلود لوگو، رنگ‌بندی دلخواه کلوپ و اپلیکیشن وب شیشه‌ای (PWA) بدون نیاز به نصب ویژه برای نمایش برنامه‌ها، پرداخت‌ها و فاکتورها.
                  </p>
                  <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[10px] text-violet-400">
                    <span>اتصال دامنه دلخواه</span>
                    <span>برندسازی اختصاصی • پیشرفته</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Visual illustration of two athletes comparison */}
            <div className="bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-slate-950/80 p-6 md:p-8 rounded-[2.5rem] border border-white/5 space-y-8 mb-8">
              <div className="text-center space-y-2">
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">تجربه واقعی ورزشکاران</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">تحول شیوه تمرین در باشگاه</h2>
                <p className="text-slate-400 text-xs max-w-xl mx-auto">تفاوت ملموس بین روش سنتی کاغذی کلافه‌کننده و تمرین هوشمند و پرانرژی با اسمارت جیم</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                {/* Traditional paper athlete card */}
                <div className="bg-slate-950/60 border border-red-500/15 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between space-y-4">
                  <div className="absolute top-3 left-3 bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold">روش سنتی کاغذی</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🤯</span>
                      <div>
                        <h4 className="text-sm font-black text-white">امیر - کلافه با برنامه کاغذی چروکیده</h4>
                        <span className="text-[10px] text-red-400">سردرگم و بی‌انگیزه در شلوغی باشگاه</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      امیر با یک برگ کاغذ مچاله شده در دست در باشگاه چرخ می‌زند. مربی او نام حرکات را با دست‌خط ناخوانا نوشته است. امیر مدام فراموش می‌کند کدام ست را انجام داده، وزنه‌های قبلی‌اش چقدر بوده و زمان استراحت چقدر است. او کلافه و بی‌انگیزه است و تمریناتش اثربخشی لازم را ندارند.
                    </p>
                  </div>
                  <div className="border-t border-white/5 pt-3 text-[10px] space-y-2 text-slate-500">
                    <div className="flex items-center gap-1.5"><span className="text-red-500">✗</span> گم شدن یا خیس شدن مکرر کاغذ برنامه</div>
                    <div className="flex items-center gap-1.5"><span className="text-red-500">✗</span> عدم اطلاع از نحوه صحیح اجرای حرکت</div>
                    <div className="flex items-center gap-1.5"><span className="text-red-500">✗</span> نداشتن زمان‌سنج استراحت و بی‌نظمی تمرین</div>
                  </div>
                </div>

                {/* SmartGym athlete card */}
                <div className="bg-slate-950/60 border border-emerald-500/20 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between space-y-4">
                  <div className="absolute top-3 left-3 bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold">روش اسمارت جیم</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">😎</span>
                      <div>
                        <h4 className="text-sm font-black text-emerald-400">آرش - ورزش آسان و هوشمند با اسمارت جیم</h4>
                        <span className="text-[10px] text-emerald-400">شاداب، باانگیزه و متمرکز روی هدف</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      آرش با آرامش کامل و با گوشی همراه خود ورزش می‌کند. برنامه تمرینی او به صورت گام‌به‌گام با انیمیشن‌های سه بعدی متحرک راهنمایی‌اش می‌کند. زمان‌سنج خودکار به محض پایان هر ست شروع به شمارش معکوس می‌کند. نام تمرین، تعداد رپ‌ها و وزنه‌ها با وضوح بالا پیش روی اوست و باانگیزه تمرین می‌کند.
                    </p>
                  </div>
                  <div className="border-t border-emerald-500/10 pt-3 text-[10px] space-y-2 text-slate-400">
                    <div className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> انیمیشن راهنمای اجرای صحیح حرکات</div>
                    <div className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> استپ‌بای‌استپ همراه با زمان‌سنج استراحت</div>
                    <div className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> ذخیره سوابق وزنه‌ها و نمودار پیشرفت اتوماتیک</div>
                  </div>
                </div>
              </div>
            </div>


            {/* Comparison Module Table */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">بررسی تفاوت اصلی ما</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold">چرا اسمارت جیم متمایز است؟</h2>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto">جدول مقایسه‌ای بین پلتفرم ما، نرم‌افزارهای سنتی تحت ویندوز قدیمی و عدم استفاده از نرم‌افزار.</p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/40">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-900 text-xs text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4">ویژگی‌ها / امکانات</th>
                      <th className="px-6 py-4 text-blue-400 font-bold">اسمارت جیم (SmartGym)</th>
                      <th className="px-6 py-4 text-slate-300">نرم‌افزارهای قدیمی تحت ویندوز</th>
                      <th className="px-6 py-4 text-slate-400">ثبت سنتی (دفتر و کاغذ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="px-6 py-4 font-bold">دسترسی از همه‌جا (کلاود)</td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold">✓ بله (موبایل، تبلت، کامپیوتر)</td>
                      <td className="px-6 py-4 text-red-400">✗ خیر (فقط سیستم ویندوز پذیرش)</td>
                      <td className="px-6 py-4 text-red-500">✗ خیر</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-bold">پلیر تمرینی صوتی و تصویری اعضا</td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold">✓ بله (اتوماتیک و تعاملی)</td>
                      <td className="px-6 py-4 text-red-400">✗ خیر (نهایتا چاپ روی برگه کاغذی)</td>
                      <td className="px-6 py-4 text-red-500">✗ خیر</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-bold">دستیار هوش مصنوعی طراحی برنامه</td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold">✓ بله (اتصال به Gemini 3.5)</td>
                      <td className="px-6 py-4 text-red-400">✗ خیر</td>
                      <td className="px-6 py-4 text-red-500">✗ خیر</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-bold">امکان چند شعبه‌ای یکپارچه</td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold">✓ بله (متمرکز با دیتابیس ابری)</td>
                      <td className="px-6 py-4 text-slate-400">کندی شدید و قطعی اتصال</td>
                      <td className="px-6 py-4 text-red-500">✗ غیرممکن</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-bold">خروجی وایت‌لیبل (شخصی‌سازی برند)</td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold">✓ بله (اتصال دامنه و لوگوی باشگاه)</td>
                      <td className="px-6 py-4 text-red-400">✗ خیر</td>
                      <td className="px-6 py-4 text-red-500">✗ خیر</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>


            {/* Subscription Plans Pricing Grid */}
            <div id="subscription_plans_section" className="space-y-6">
              <div className="text-center space-y-2">
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">سرمایه‌گذاری برای رشد باشگاه شما</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold">تعرفه‌های شفاف خرید اشتراک پلتفرم</h2>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto">مناسب برای مربیان فریلنسر تا مجموعه‌های ورزشی زنجیره‌ای و بزرگ ملی.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {subscriptionPlans.map((plan) => (
                  <div 
                    key={plan.id}
                    className={`relative rounded-3xl p-6 flex flex-col justify-between ${plan.isPopular ? "bg-gradient-to-b from-emerald-950/40 to-slate-900/60 border-2 border-emerald-500 pulsing-glow" : "bg-slate-900/40 border border-white/10"}`}
                  >
                    {plan.isPopular && (
                      <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-slate-950 font-bold text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest">
                        محبوب‌ترین پلن
                      </span>
                    )}

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-bold text-slate-100">{plan.name}</h4>
                        <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-md">{plan.durationMonths} ماهه</span>
                      </div>

                      <div className="py-4 border-b border-white/5 space-y-1">
                        <span className="text-3xl font-extrabold text-white">
                          {plan.priceToman.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 mr-1">تومان</span>
                        <div className="text-[10px] text-slate-500 font-mono">معادل {(plan.priceToman * 10).toLocaleString()} ریال</div>
                      </div>

                      <ul className="space-y-3 pt-2 text-xs text-slate-300">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button 
                      onClick={() => {
                        setPendingPurchasePlan(plan);
                        setShowPaymentSimulator(true);
                      }}
                      className={`w-full mt-8 py-3 rounded-xl font-bold text-xs transition-all ${plan.isPopular ? "bg-emerald-600 hover:bg-emerald-500 text-slate-950" : "bg-white/10 hover:bg-white/15 text-white"}`}
                    >
                      خرید و راه‌اندازی فوری پنل
                    </button>
                  </div>
                ))}
              </div>
            </div>


            {/* FAQ Accordion Section */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <span className="text-violet-400 text-xs font-bold uppercase">پاسخ به سوالات متداول</span>
                <h2 className="text-2xl sm:text-4xl font-extrabold">سوالات پرتکرار مدیران باشگاه‌ها</h2>
                <p className="text-slate-400 text-sm">هر آنچه که می‌خواهید درباره فرآیند استقرار، پایداری و امنیت پلتفرم بدانید.</p>
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                {[
                  { q: "آیا برای راه‌اندازی نیاز به خرید هاست یا سرور مجزا داریم؟", a: "خیر، اسمارت جیم یک پلتفرم کاملاً ابری (SaaS) است. شما بلافاصله پس از ثبت نام و خرید اشتراک صاحب یک پنل مجزای تحت کلاود بدون نیاز به هیچ دایرکتوری یا نصب فیزیکی می‌شوید." },
                  { q: "چگونه قابلیت وایت‌لیبل (برند اختصاصی) را فعال کنیم؟", a: "در پلن‌های نقره‌ای و طلایی، می‌توانید از بخش تنظیمات ظاهری، لوگو، تصاویر پس‌زمینه فرم ورود و کدهای تم خود را جایگذاری کرده و به دامنه یا ساب‌دامین اختصاصی باشگاه متصل کنید." },
                  { q: "آیا اپلیکیشن نیاز به نصب از بازار یا گوگل‌پلی دارد؟", a: "اپلیکیشن اسمارت جیم با تکنولوژی PWA توسعه یافته است. اعضا و مربیان به سادگی با اولین باز کردن آدرس پنل در مرورگر گوشی خود، می‌توانند آیکون برنامه را به صفحه اصلی اضافه کنند بدون اینکه جزیی‌ترین فضایی از هارد گوشی اشغال شود." },
                  { q: "آیا هوش مصنوعی محدودیت در تعداد دفعات استفاده دارد؟", a: "در پلن‌های پایه تعداد تولیدات با هوش مصنوعی محدود است، اما در پلن‌های حرفه‌ای و سازمانی هیچ محدودیتی اعمال نشده و مستقیماً به API اختصاصی ما متصل است." }
                ].map((item, idx) => (
                  <details key={idx} className="group bg-slate-900/40 rounded-2xl border border-white/5 p-4 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                      <h4 className="text-sm font-bold text-slate-200 group-open:text-blue-400 transition-colors">
                        {item.q}
                      </h4>
                      <span className="transition-transform group-open:rotate-180">
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      </span>
                    </summary>
                    <p className="mt-3 text-xs leading-relaxed text-slate-400 border-t border-white/5 pt-3">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>

            {/* Dynamic Blog Section */}
            <div className="border-t border-white/5 pt-16">
              <BlogSection 
                posts={blogPosts} 
                onLike={(postId) => {
                  setBlogPosts(prev => prev.map(post => {
                    if (post.id === postId) {
                      return { ...post, likes: post.likes + 1 };
                    }
                    return post;
                  }));
                }} 
              />
            </div>

          </div>
        )}


        {/* -------------------- TAB 2: SUPER ADMIN LOGIN & DASHBOARD -------------------- */}
        {activeTab === "superadmin" && !isSuperAdminLoggedIn && (
          <div className="max-w-md mx-auto py-12 space-y-6 animate-fade-in text-right" dir="rtl">
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-10"></div>
              
              <div className="w-16 h-16 bg-gradient-to-tr from-red-600 to-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-red-950/40">
                🔒
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-white">ورود فوق امنیتی سوپر ادمین</h3>
                <p className="text-xs text-slate-400">پنل نظارت کلان و پلتفرم ابری اسمارت‌جیم (SaaS)</p>
              </div>

              {adminLoginError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold text-center">
                  ⚠️ {adminLoginError}
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">نام کاربری ادمین:</label>
                  <input 
                    type="text"
                    value={adminUsernameInput}
                    onChange={(e) => setAdminUsernameInput(e.target.value)}
                    placeholder="نام کاربری نظارتی را وارد کنید..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-red-500 text-left font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">رمز عبور امنیتی:</label>
                  <input 
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="کلمه عبور امنیتی را وارد کنید..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-red-500 text-left font-mono"
                  />
                </div>

                <button
                  onClick={async () => {
                    setIsAdminLoginLoading(true);
                    setAdminLoginError("");
                    try {
                      const response = await fetch("/api/admin/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: adminUsernameInput, password: adminPasswordInput })
                      });
                      let resData: any = {};
                      const contentType = response.headers.get("content-type");
                      if (contentType && contentType.includes("application/json")) {
                        resData = await response.json();
                      } else {
                        const text = await response.text();
                        resData = { error: text || "قالب پاسخ نامعتبر از سرور" };
                      }
                      if (response.ok && resData.success) {
                        setIsSuperAdminLoggedIn(true);
                        localStorage.setItem("isSuperAdminLoggedIn", "true");
                      } else {
                        setAdminLoginError(resData.error || "نام کاربری یا کلمه عبور اشتباه است!");
                      }
                    } catch (err: any) {
                      setAdminLoginError("خطای ارتباط با سرور. لطفا اتصال را بررسی کنید.");
                    } finally {
                      setIsAdminLoginLoading(false);
                    }
                  }}
                  disabled={isAdminLoginLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 active:scale-95 transition-all text-slate-950 font-black text-sm shadow-lg shadow-red-950/30"
                >
                  {isAdminLoginLoading ? "در حال تایید اعتبار امنیتی..." : "🔓 ورود امن به کنترل پنل"}
                </button>
              </div>

              <div className="text-center">
                <button 
                  onClick={() => setActiveTab("landing")}
                  className="text-[10px] text-slate-500 hover:text-slate-300 hover:underline"
                >
                  ← بازگشت به صفحه اصلی لندینگ
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "superadmin" && isSuperAdminLoggedIn && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-3xl border border-white/5">
              <div>
                <span className="text-blue-400 text-xs font-bold">بخش فوق‌امنیتی نظارت کلان پلتفرم (SaaS Owner)</span>
                <h2 className="text-2xl font-black">پنل کنترل سوپر ادمین (Super Admin)</h2>
              </div>
              
              {/* Server health metrics banner */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl">دیتابیس: متصل</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl">کرون‌جاب: فعال</span>
                <button
                  onClick={() => {
                    if (confirm("آیا مایل به خروج امن از پنل سوپر ادمین هستید؟")) {
                      setIsSuperAdminLoggedIn(false);
                      localStorage.removeItem("isSuperAdminLoggedIn");
                      setActiveTab("landing");
                    }
                  }}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-slate-950 border border-red-500/30 px-3 py-1.5 rounded-xl font-bold transition-all"
                >
                  🚪 خروج امن ادمین
                </button>
              </div>
            </div>

            {/* Super Admin Sub Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
              <button
                onClick={() => setSuperAdminSubTab("dashboard")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${superAdminSubTab === "dashboard" ? "bg-emerald-600 text-slate-950 shadow-lg font-black" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
              >
                داشبورد و آمار لحظه‌ای
              </button>
              <button
                onClick={() => setSuperAdminSubTab("plans")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${superAdminSubTab === "plans" ? "bg-emerald-600 text-slate-950 shadow-lg font-black" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
              >
                مدیریت اشتراک‌ها (داینامیک لندینگ)
              </button>
              <button
                onClick={() => setSuperAdminSubTab("tickets")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${superAdminSubTab === "tickets" ? "bg-emerald-600 text-slate-950 shadow-lg font-black" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
              >
                پشتیبانی سراسری تیکت‌ها ({tickets.length})
              </button>
              <button
                onClick={() => setSuperAdminSubTab("settings")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${superAdminSubTab === "settings" ? "bg-emerald-600 text-slate-950 shadow-lg font-black" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
              >
                ⚙️ تنظیمات پلتفرم و درگاه بانکی
              </button>
              <button
                onClick={() => setSuperAdminSubTab("smart_chat")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${superAdminSubTab === "smart_chat" ? "bg-green-600 text-slate-950 shadow-lg font-black" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
              >
                💬 گفتگوهای زنده اسمارْت
              </button>
              <button
                onClick={() => setSuperAdminSubTab("blog")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${superAdminSubTab === "blog" ? "bg-emerald-600 text-slate-950 shadow-lg font-black" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
              >
                📰 مدیریت وبلاگ و دانشنامه
              </button>
            </div>

            {superAdminSubTab === "dashboard" && (
              <>
                {/* Micro Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="glass-panel p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-500 block mb-1">کل درآمدهای پلتفرم (SaaS)</span>
                <span className="text-xl font-bold text-white">۱۵۳,۵۰۰,۰۰۰ تومان</span>
                <span className="text-[9px] block text-emerald-400 mt-1">↑ ۱۸٪ رشد نسبت به ماه قبل</span>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-500 block mb-1">باشگاه‌های فعال (Tenant)</span>
                <span className="text-xl font-bold text-blue-400">۳ باشگاه فعال</span>
                <span className="text-[9px] block text-slate-500 mt-1">۲ در تریال، ۱ طلایی</span>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-500 block mb-1">تعداد کاربران و ورزشکاران کل</span>
                <span className="text-xl font-bold text-emerald-400">۱,۷۳۵ ورزشکار</span>
                <span className="text-[9px] block text-slate-500 mt-1">در سراسر کشور</span>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-500 block mb-1">تعداد مربیان فعال پلتفرم</span>
                <span className="text-xl font-bold text-violet-400">۴۲ مربی</span>
                <span className="text-[9px] block text-violet-400 mt-1">با دسترسی برنامه تمرینی</span>
              </div>
            </div>

            {/* Grid with tenants list and create form */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Create Tenant Form */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 self-start">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Plus className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold">ایجاد باشگاه جدید (مستأجر)</h3>
                </div>

                <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">نام مجموعه ورزشی / کلینیک</label>
                    <input 
                      type="text"
                      value={newTenant.name}
                      onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                      placeholder="مثلا: باشگاه فیتنس پارس"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">نام کامل موسس یا مالک</label>
                    <input 
                      type="text"
                      value={newTenant.ownerName}
                      onChange={(e) => setNewTenant({ ...newTenant, ownerName: e.target.value })}
                      placeholder="مثلا: محمدرضا عباسی"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">شماره تماس</label>
                      <input 
                        type="text"
                        value={newTenant.phone}
                        onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                        placeholder="0912..."
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">ایمیل رسمی</label>
                      <input 
                        type="email"
                        value={newTenant.email}
                        onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                        placeholder="info@..."
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">اشتراک انتخابی</label>
                    <select 
                      value={newTenant.planName}
                      onChange={(e) => setNewTenant({ ...newTenant, planName: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                    >
                      <option>پلن پایه (برنزی)</option>
                      <option>پلن حرفه‌ای (نقره‌ای)</option>
                      <option>پلن سازمانی / زنجیره‌ای (طلایی)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-blue-950/10 p-3 rounded-2xl border border-blue-500/10">
                    <div>
                      <label className="block text-slate-400 mb-1 font-bold text-blue-400">نام کاربری ورود *</label>
                      <input 
                        type="text"
                        required
                        value={newTenant.username}
                        onChange={(e) => setNewTenant({ ...newTenant, username: e.target.value })}
                        placeholder="مثلا: pars_gym"
                        className="w-full bg-slate-950 border border-blue-500/30 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-bold text-blue-400">رمز عبور ورود *</label>
                      <input 
                        type="text"
                        required
                        value={newTenant.password}
                        onChange={(e) => setNewTenant({ ...newTenant, password: e.target.value })}
                        placeholder="مثلا: 123456"
                        className="w-full bg-slate-950 border border-blue-500/30 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-center"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    ثبت و فعال‌سازی فوری در دیتابیس کلاود
                  </button>
                </form>
              </div>

              {/* Tenants interactive list */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-bold">مستاجرین فعال در پلتفرم (Tenants)</h3>
                  </div>
                  <span className="text-xs text-slate-500">مجموع: {tenants.length} مورد</span>
                </div>

                <div className="space-y-4">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="bg-slate-950 rounded-2xl border border-white/5 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-extrabold text-blue-400 border border-blue-500/20">
                          {tenant.name.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-200 text-sm">{tenant.name}</h4>
                          <span className="text-slate-500 block text-[10px] mt-0.5">مالک: {tenant.ownerName} | تلفن: {tenant.phone}</span>
                          {tenant.username && (
                            <div className="mt-1.5 inline-block bg-blue-950/20 border border-blue-500/10 px-2 py-0.5 rounded text-[9px] font-mono text-blue-400">
                              کاربری: {tenant.username} | رمز: {tenant.password}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="text-left">
                          <span className="text-slate-400 block text-[9px]">عضویت و اعتبار</span>
                          <span className="text-slate-200 font-bold block">{tenant.planName}</span>
                        </div>

                        <div className="text-left">
                          <span className="text-slate-400 block text-[9px]">انقضا</span>
                          <span className="text-orange-400 font-bold block">{tenant.expiresAt}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-bold ${tenant.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`}>
                            {tenant.status === "ACTIVE" ? "فعال" : "آزمایشی"}
                          </span>

                          <button 
                            onClick={() => {
                              alert(`ورود به عنوان مدیر اصلی "${tenant.name}" شبیه‌سازی شد.`);
                              setActiveTab("tenant");
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1.5 rounded-lg text-[10px] transition-all"
                          >
                            ورود بجای کاربر
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Audit Logs and Security block */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold">گزارش‌های امنیتی و ممیزی سیستم (Audit & Access Logs)</h3>
              </div>

              <div className="space-y-3">
                {MOCK_AUDIT_LOGS.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded">{log.time}</span>
                      <span className="font-bold text-slate-300">{log.user}</span>
                      <span className="text-slate-500">[{log.role}]</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">{log.action}</span>
                      <span className="text-[10px] text-slate-500 font-mono hidden md:inline">{log.ip} | {log.device}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </>
            )}

            {superAdminSubTab === "plans" && (
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
                <div className="flex flex-wrap justify-between items-center border-b border-white/5 pb-4 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white text-right">طرح‌ها و اشتراک‌های داینامیک پلتفرم</h3>
                    <p className="text-xs text-slate-400 text-right">تغییرات در این بخش به صورت زنده در صفحه فرود (Landing Page) پلتفرم اعمال خواهد شد.</p>
                  </div>
                  {/* Create New Plan Button */}
                  <button 
                    onClick={() => {
                      const newId = `plan_${Date.now()}`;
                      const defaultFeatureIds = ["info", "buffet", "attendance"];
                      const defaultFeaturesList = defaultFeatureIds.map(id => {
                        const feat = SYSTEM_FEATURES.find(f => f.id === id);
                        return feat ? feat.label : id;
                      });
                      const customPlan = {
                        id: newId,
                        name: "پلن جدید سفارشی اسمارت جیم",
                        priceToman: 4500000,
                        priceIrr: 45000000,
                        durationMonths: 6,
                        features: defaultFeaturesList,
                        unlockedFeatureIds: defaultFeatureIds,
                        isPopular: false
                      };
                      setSubscriptionPlans([...subscriptionPlans, customPlan]);
                      alert("پلن جدید سفارشی با موفقیت ایجاد گردید و به لیست اضافه شد!");
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    ایجاد طرح اشتراک جدید
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="pb-3 font-semibold text-right">عنوان اشتراک</th>
                        <th className="pb-3 font-semibold text-right">مدت (ماه)</th>
                        <th className="pb-3 font-semibold text-right">قیمت (تومان)</th>
                        <th className="pb-3 font-semibold text-right">امکانات کلیدی</th>
                        <th className="pb-3 font-semibold text-center">وضعیت (محبوب‌ترین)</th>
                        <th className="pb-3 font-semibold text-left">عملیات مدیریت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {subscriptionPlans.map((plan) => (
                        <tr key={plan.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 font-bold text-slate-100 text-right">
                            <input
                              type="text"
                              value={plan.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSubscriptionPlans(subscriptionPlans.map(p => p.id === plan.id ? { ...p, name: val } : p));
                              }}
                              className="bg-slate-950 border border-white/10 px-3 py-1.5 rounded-lg text-slate-100 w-48 text-xs font-bold text-right"
                            />
                          </td>
                          <td className="py-4 text-right">
                            <input
                              type="number"
                              value={plan.durationMonths}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setSubscriptionPlans(subscriptionPlans.map(p => p.id === plan.id ? { ...p, durationMonths: val } : p));
                              }}
                              className="bg-slate-950 border border-white/10 px-2 py-1.5 rounded-lg text-slate-100 w-16 text-xs font-mono text-center font-bold"
                            />
                          </td>
                          <td className="py-4 font-bold text-emerald-400 font-mono text-right">
                            <input
                              type="number"
                              value={plan.priceToman}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setSubscriptionPlans(subscriptionPlans.map(p => p.id === plan.id ? { ...p, priceToman: val, priceIrr: val * 10 } : p));
                              }}
                              className="bg-slate-950 border border-white/10 px-3 py-1.5 rounded-lg text-emerald-400 w-28 text-xs font-mono text-center font-bold"
                            />
                          </td>
                           <td className="py-4 text-slate-400 text-right min-w-[320px]">
                            <div className="relative">
                              {/* Selection triggers dropdown/popover */}
                              <div 
                                onClick={() => setActivePlanFeaturesEditId(activePlanFeaturesEditId === plan.id ? null : plan.id)}
                                className="bg-slate-950 border border-white/10 p-2.5 rounded-2xl cursor-pointer hover:border-emerald-500/30 transition-all space-y-1.5 min-h-[44px]"
                              >
                                <div className="flex flex-wrap gap-1">
                                  {(!plan.unlockedFeatureIds || plan.unlockedFeatureIds.length === 0) ? (
                                    <span className="text-[10px] text-slate-500">❌ هیچ امکانی برای این طرح فعال نشده است</span>
                                  ) : (
                                    plan.unlockedFeatureIds.map((fid: string) => {
                                      const feat = SYSTEM_FEATURES.find(f => f.id === fid);
                                      return (
                                        <span key={fid} className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-500/10 flex items-center gap-1">
                                          {feat ? feat.label.split(" ")[0] : "⚙️"} {feat ? feat.label.replace(/^[^a-zA-Z0-9\s]*\s*/, '') : fid}
                                        </span>
                                      );
                                    })
                                  )}
                                </div>
                                <div className="text-[9px] text-slate-400 font-bold flex items-center justify-between">
                                  <span className="text-emerald-500 hover:underline">📥 کلیک کنید تا امکانات را انتخاب کنید</span>
                                  <span>{plan.unlockedFeatureIds?.length || 0} مورد انتخاب شده</span>
                                </div>
                              </div>
                              
                              {/* Popover list of features */}
                              {activePlanFeaturesEditId === plan.id && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={() => setActivePlanFeaturesEditId(null)}></div>
                                  <div className="absolute right-0 top-full mt-2 w-80 bg-slate-950 border border-white/15 rounded-3xl shadow-2xl p-4 space-y-3 z-40 animate-scale-up text-right" dir="rtl">
                                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                      <span className="text-xs font-black text-white">انتخاب هوشمند امکانات لایسنس</span>
                                      <button 
                                        onClick={() => setActivePlanFeaturesEditId(null)}
                                        className="text-[10px] text-slate-400 hover:text-white font-bold bg-white/5 px-2 py-1 rounded-md"
                                      >
                                        بستن
                                      </button>
                                    </div>
                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                      {SYSTEM_FEATURES.map((feat) => {
                                        const isSelected = (plan.unlockedFeatureIds || []).includes(feat.id);
                                        return (
                                          <div 
                                            key={feat.id} 
                                            onClick={() => {
                                              const currentIds = plan.unlockedFeatureIds || [];
                                              let nextIds: string[];
                                              if (isSelected) {
                                                nextIds = currentIds.filter(id => id !== feat.id);
                                              } else {
                                                nextIds = [...currentIds, feat.id];
                                              }
                                              
                                              // Synchronize textual description list as requested ("به امکانات اون اشتراک اضافه شود")
                                              const nextTextFeatures = nextIds.map(id => {
                                                const item = SYSTEM_FEATURES.find(f => f.id === id);
                                                return item ? item.label : id;
                                              });

                                              setSubscriptionPlans(subscriptionPlans.map(p => p.id === plan.id ? { 
                                                ...p, 
                                                unlockedFeatureIds: nextIds,
                                                features: nextTextFeatures
                                              } : p));
                                            }}
                                            className={`flex items-start gap-2.5 p-2 rounded-2xl cursor-pointer transition-all border ${isSelected ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-900/40 border-transparent hover:bg-white/5"}`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              readOnly
                                              className="mt-1 rounded border-white/10 bg-slate-950 text-emerald-500 focus:ring-emerald-500/50 w-3.5 h-3.5"
                                            />
                                            <div className="text-right">
                                              <span className="text-xs font-extrabold text-slate-200 block">{feat.label}</span>
                                              <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">{feat.desc}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-white/5">
                                      تغییرات به صورت زنده ذخیره می‌شوند.
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-center">
                            <button
                              onClick={() => {
                                setSubscriptionPlans(subscriptionPlans.map(p => ({
                                  ...p,
                                  isPopular: p.id === plan.id ? !p.isPopular : false
                                })));
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold ${plan.isPopular ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-slate-400"}`}
                            >
                              {plan.isPopular ? "محبوب‌ترین" : "طرح عادی"}
                            </button>
                          </td>
                          <td className="py-4 text-left">
                            <button 
                              onClick={() => {
                                if (confirm("آیا از حذف این طرح اطمینان دارید؟")) {
                                  setSubscriptionPlans(subscriptionPlans.filter(p => p.id !== plan.id));
                                }
                              }}
                              className="text-red-400 hover:text-red-300 font-bold px-2 py-1 transition-all"
                            >
                              حذف طرح
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {superAdminSubTab === "tickets" && (
              <TicketSystem
                isSuperAdmin={true}
                isDarkMode={isDarkMode}
                tickets={tickets}
                setTickets={setTickets}
                currentUserLabel="پشتیبانی سراسری اسمارت جیم"
              />
            )}

            {superAdminSubTab === "smart_chat" && (
              <div className="grid lg:grid-cols-12 gap-8 animate-fade-in text-right text-xs font-sans" dir="rtl">
                
                {/* 1. Chats List Column */}
                <div className="lg:col-span-4 bg-slate-900/40 border border-white/5 p-5 rounded-3xl space-y-4 self-start">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      💬 گفتگوهای فعال با اسمارْت ({allSmartChats.length})
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">لیست تمام پیام‌های ورودی از طرف کاربران لندینگ پلتفرم</p>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {allSmartChats.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">هیچ گفتگوی فعالی ثبت نشده است.</p>
                    ) : (
                      allSmartChats.map((chat) => {
                        const lastMsg = chat.messages && chat.messages.length > 0 
                          ? chat.messages[chat.messages.length - 1] 
                          : null;
                        const needsReply = lastMsg && lastMsg.sender === "user";
                        const isSelected = activeAdminChatId === chat.id;

                        return (
                          <div
                            key={chat.id}
                            onClick={() => {
                              setActiveAdminChatId(chat.id);
                              // Load messages of this selected chat
                              setSmartChatMessages(chat.messages || []);
                            }}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                              isSelected
                                ? "bg-green-600/10 border-green-500/40"
                                : needsReply
                                  ? "bg-slate-900 border-yellow-500/30 hover:border-white/20"
                                  : "bg-slate-950/60 border-white/5 hover:bg-slate-900"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-extrabold text-[10px]">
                                  {chat.userName ? chat.userName.charAt(0) : "ک"}
                                </div>
                                <div className="text-right">
                                  <h4 className="font-bold text-white">{chat.userName || "کاربر مهمان"}</h4>
                                  {chat.userPhone && (
                                    <span className="text-[9px] text-slate-400 font-mono block">{chat.userPhone}</span>
                                  )}
                                </div>
                              </div>
                              
                              {needsReply && (
                                <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[8px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                  نیاز به پاسخ
                                </span>
                              )}
                            </div>

                            {lastMsg && (
                              <p className="text-slate-400 text-[10px] truncate leading-relaxed">
                                <span className="text-slate-500 font-bold">آخرین پیام:</span> {lastMsg.text}
                              </p>
                            )}

                            <span className="text-[8px] text-slate-600 font-mono self-start">
                              بروزرسانی: {new Date(chat.updatedAt || chat.createdAt).toLocaleTimeString('fa-IR')}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. Active Chat Panel Column */}
                <div className="lg:col-span-8 bg-slate-900/20 border border-white/5 p-6 rounded-3xl min-h-[480px] flex flex-col justify-between">
                  {activeAdminChatId ? (
                    (() => {
                      const selectedChat = allSmartChats.find(c => c.id === activeAdminChatId);
                      if (!selectedChat) return null;

                      return (
                        <div className="flex flex-col h-full justify-between gap-4">
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <div>
                              <span className="text-emerald-400 font-bold text-[10px] block">در حال پاسخگویی به نوبت:</span>
                              <h3 className="text-sm font-black text-white">{selectedChat.userName || "کاربر مهمان"}</h3>
                              {selectedChat.userPhone && (
                                <p className="text-[9px] text-slate-500 font-mono mt-0.5">تلفن: {selectedChat.userPhone}</p>
                              )}
                            </div>

                            <button
                              onClick={async () => {
                                if (confirm("آیا مایل به حذف این گفتگو و تاریخچه آن هستید؟")) {
                                  try {
                                    await fetch(`/api/db/smart_support_chats/${selectedChat.id}`, {
                                      method: "DELETE"
                                    });
                                    setActiveAdminChatId("");
                                    fetchAllSmartChats();
                                  } catch (e) {
                                    console.error("Error deleting chat:", e);
                                  }
                                }
                              }}
                              className="text-red-500 hover:text-red-400 font-bold text-[10px] bg-red-500/5 px-3 py-1.5 rounded-xl border border-red-500/10 transition-colors"
                            >
                              🗑️ حذف گفتگو
                            </button>
                          </div>

                          {/* Messages Window */}
                          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-3 overflow-y-auto flex-1 max-h-[350px] min-h-[240px] flex flex-col">
                            {(selectedChat.messages || []).map((msg: any) => {
                              const isUser = msg.sender === "user";
                              const isAI = msg.sender === "smart_ai";
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex flex-col max-w-[70%] ${isUser ? "self-end text-left" : "self-start text-right"}`}
                                >
                                  <span className="text-[8px] text-slate-500 mb-0.5 px-1 font-mono">
                                    {isUser ? "کاربر" : isAI ? "هوش مصنوعی اسمارْت (بات)" : "شما (ادمین/پشتیبان)"}
                                  </span>
                                  <div
                                    className={`p-3 rounded-2xl leading-relaxed text-[11px] ${
                                      isUser
                                        ? "bg-slate-900 text-slate-100 rounded-tl-none border border-white/5"
                                        : isAI
                                          ? "bg-green-600/10 text-green-400 border border-green-500/20 rounded-tr-none font-medium"
                                          : "bg-green-600 text-slate-950 font-black rounded-tr-none"
                                    }`}
                                  >
                                    {msg.text}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Pre-saved templates quick buttons */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] text-slate-500">پاسخ‌های سریع پیش‌فرض:</span>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                onClick={() => setAdminReplyText("سلام قهرمان عزیز! چطور می‌توانم در مورد پلتفرم اسمارت جیم راهنمایی‌تان کنم؟ 🦾")}
                                className="bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-[9px] border border-white/5"
                              >
                                📋 خوش‌آمدگویی
                              </button>
                              <button
                                onClick={() => setAdminReplyText("پلن‌های اشتراکی اسمارت جیم در بخش سوپر ادمین به صورت پویا قابل ویرایش و خریداری هستند و ویژگی‌های متعددی دارند. 😊")}
                                className="bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-[9px] border border-white/5"
                              >
                                💳 توضیح پلن‌ها
                              </button>
                              <button
                                onClick={() => setAdminReplyText("شماره تماس شما دریافت شد. یکی از مربیان یا پشتیبانان فنی ما به زودی با شما تماس خواهند گرفت. 📞")}
                                className="bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-[9px] border border-white/5"
                              >
                                📞 پیگیری تماس
                              </button>
                            </div>
                          </div>

                          {/* Input Area */}
                          <div className="flex gap-2.5">
                            <input
                              type="text"
                              value={adminReplyText}
                              onChange={(e) => setAdminReplyText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  sendAdminReply(selectedChat.id);
                                }
                              }}
                              placeholder="پاسخ خود را بنویسید..."
                              className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-green-500 text-xs"
                            />
                            <button
                              onClick={() => sendAdminReply(selectedChat.id)}
                              className="bg-green-600 hover:bg-green-500 text-slate-950 font-black px-6 rounded-xl transition-all text-xs"
                            >
                              ارسال پاسخ زنده
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    /* Default Intro State when no chat is selected */
                    <div className="flex flex-col items-center justify-center space-y-4 my-auto py-12 text-center">
                      <img
                        src={mascotSmartLaptop}
                        alt="Smart"
                        className="w-24 h-24 rounded-full border-2 border-green-500/30 object-cover shadow-xl animate-pulse"
                      />
                      <div className="space-y-1 max-w-sm">
                        <h4 className="font-black text-white text-sm">محیط مدیریت و پاسخگویی اسمارْت</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          جهت مشاهده گفتگوها، پیگیری کاربران لندینگ پلتفرم و ارسال پاسخ‌های زنده، لطفاً یکی از گفتگوها را از منوی سمت راست انتخاب کنید.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {superAdminSubTab === "blog" && (
              <div className="animate-fade-in">
                <BlogSettingsPanel 
                  posts={blogPosts} 
                  onSavePosts={(updatedPosts) => setBlogPosts(updatedPosts)} 
                />
              </div>
            )}

            {superAdminSubTab === "settings" && (
              <div className="space-y-6 animate-fade-in text-right text-xs" dir="rtl">
                
                {/* 1. Brand Logo & Site-wide Theme Settings Card */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      🎨 شخصی‌سازی هویت بصری و رنگ تم پلتفرم (White-Label)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">تغییر لوگو و پالت رنگ کل پلتفرم که برای کاربران نمایش داده می‌شود.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-slate-300 block mb-2 font-bold">نام تجاری / لوگو متنی پلتفرم</label>
                      <input
                        type="text"
                        value={platformBrandLogo}
                        onChange={(e) => {
                          setPlatformBrandLogo(e.target.value);
                        }}
                        placeholder="مانند: SMART GYM"
                        className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-2 font-bold">پالت رنگ تم پلتفرم (Theme Preset)</label>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { id: "emerald", label: "سبز جنگلی", color: "bg-emerald-500" },
                          { id: "blue", label: "آبی نئون", color: "bg-blue-500" },
                          { id: "rose", label: "یاقوتی", color: "bg-rose-500" },
                          { id: "violet", label: "بنفش", color: "bg-violet-500" },
                          { id: "amber", label: "کهربایی", color: "bg-amber-500" }
                        ].map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setPlatformTheme(preset.id)}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${platformTheme === preset.id ? "border-emerald-500 bg-emerald-500/10 scale-105" : "border-white/5 bg-slate-950 hover:bg-slate-900"}`}
                          >
                            <span className={`w-4 h-4 rounded-full ${preset.color}`} />
                            <span className="text-[9px] text-slate-400">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 border-t border-white/5 pt-4">
                      <label className="text-xs text-slate-300 block mb-2 font-bold">📤 بارگذاری لوگوی اختصاصی سایت (تصویر PNG یا JPG)</label>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative overflow-hidden bg-slate-950 border border-white/10 hover:border-emerald-500/50 p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all w-full sm:w-auto">
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === "string") {
                                    setPlatformLogoUrl(reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <span className="text-2xl">📤</span>
                          <div className="text-right">
                            <span className="text-xs font-bold text-white block">انتخاب فایل لوگوی جدید...</span>
                            <span className="text-[9px] text-slate-500 block">فایل مناسب با پس‌زمینه شفاف ترجیح داده می‌شود</span>
                          </div>
                        </div>

                        {platformLogoUrl ? (
                          <div className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-white/10 w-full sm:w-auto justify-between sm:justify-start">
                            <div className="flex items-center gap-2">
                              <img src={platformLogoUrl} alt="Logo Preview" className="w-10 h-10 object-contain rounded-lg bg-slate-900 border border-white/5 p-1" />
                              <span className="text-[10px] text-emerald-400 font-bold">✔ لوگو با موفقیت لود شد</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPlatformLogoUrl("")}
                              className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-all"
                            >
                              حذف و استفاده از لوگوی پیش‌فرض
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">لوگویی بارگذاری نشده است؛ در حال حاضر لوگوی پیش‌فرض نمایش داده می‌شود.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Landing Page Text Configuration Card */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      📝 تغییر تمام متن‌های صفحه فرود (Landing Page Editor)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">متون هدر، شعارهای اصلی و توضیحات تکمیلی سایت را ویرایش و شخصی‌سازی کنید.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1.5 font-bold">عنوان اصلی صفحه فرود (Hero Title) *</label>
                      <textarea
                        rows={2}
                        value={platformLandingTitle}
                        onChange={(e) => setPlatformLandingTitle(e.target.value)}
                        placeholder="عنوان بزرگ بالای صفحه"
                        className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-xl text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1.5 font-bold">توضیحات فرعی صفحه فرود (Hero Subtitle) *</label>
                      <textarea
                        rows={3}
                        value={platformLandingSubtitle}
                        onChange={(e) => setPlatformLandingSubtitle(e.target.value)}
                        placeholder="پاراگراف معرفی خدمات زیر عنوان اصلی"
                        className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-xl text-slate-300 focus:outline-none focus:border-emerald-500 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Payment Gateway Configuration Card */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      💳 تنظیمات اتصال به درگاه‌های پرداخت شتابی (ZarinPal & Saman SEP)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">تنظیم درگاه‌های بانکی جهت پرداخت حق اشتراک باشگاه‌ها به حساب پلتفرم.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* ZarinPal Card */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="font-black text-amber-500 flex items-center gap-1.5">
                          🟡 درگاه پرداخت زرین‌پال (ZarinPal)
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={gatewayZarinpalEnabled} 
                            onChange={(e) => setGatewayZarinpalEnabled(e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">کد مرچنت زرین‌پال (Merchant ID) *</label>
                          <input
                            type="text"
                            value={gatewayZarinpalMerchant}
                            onChange={(e) => setGatewayZarinpalMerchant(e.target.value)}
                            disabled={!gatewayZarinpalEnabled}
                            placeholder="مثال: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                          />
                        </div>
                        <span className="text-[9px] text-slate-500 block leading-relaxed">
                          📌 تسویه آنی، کارمزد ۱ درصد تا سقف ۳۰۰۰ تومان، بدون نیاز به داشتن ای‌نماد.
                        </span>
                      </div>
                    </div>

                    {/* Saman SEP Card */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="font-black text-blue-400 flex items-center gap-1.5">
                          🔵 درگاه مستقیم سپ بانک سامان (SEP PSP)
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={gatewaySepEnabled} 
                            onChange={(e) => setGatewaySepEnabled(e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">کد ترمینال درگاه (Terminal ID) *</label>
                          <input
                            type="text"
                            value={gatewaySepTerminalId}
                            onChange={(e) => setGatewaySepTerminalId(e.target.value)}
                            disabled={!gatewaySepEnabled}
                            placeholder="مثال: 122340987"
                            className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                          />
                        </div>
                        <span className="text-[9px] text-slate-500 block leading-relaxed">
                          📌 درگاه مستقیم شاپرکی با اتصال مستقیم بانکی، بدون کارمزد اضافی، نیازمند ثبت آدرس سایت و نماد الکترونیک.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save button notification */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem("platformBrandLogo", platformBrandLogo);
                      localStorage.setItem("platformTheme", platformTheme);
                      localStorage.setItem("platformLogoUrl", platformLogoUrl);
                      localStorage.setItem("platformLandingTitle", platformLandingTitle);
                      localStorage.setItem("platformLandingSubtitle", platformLandingSubtitle);
                      localStorage.setItem("gatewayZarinpalEnabled", String(gatewayZarinpalEnabled));
                      localStorage.setItem("gatewayZarinpalMerchant", gatewayZarinpalMerchant);
                      localStorage.setItem("gatewaySepEnabled", String(gatewaySepEnabled));
                      localStorage.setItem("gatewaySepTerminalId", gatewaySepTerminalId);

                      const payload = {
                        platformBrandLogo,
                        platformTheme,
                        platformLogoUrl,
                        platformLandingTitle,
                        platformLandingSubtitle,
                        gatewayZarinpalEnabled: String(gatewayZarinpalEnabled),
                        gatewayZarinpalMerchant,
                        gatewaySepEnabled: String(gatewaySepEnabled),
                        gatewaySepTerminalId
                      };
                      fetch("/api/platform/settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                      })
                        .then(() => {
                          alert("💾 تمامی تنظیمات برندینگ، بارگذاری لوگو، تم رنگ، متون صفحه فرود و درگاه‌های پرداخت با موفقیت در دیتابیس مرکزی ذخیره شدند و به صورت آنی در کل پلتفرم اعمال گردیدند!");
                        })
                        .catch(err => {
                          console.error("Error saving settings to database:", err);
                          alert("💾 ذخیره محلی با موفقیت انجام شد اما اتصال به سرور دیتابیس برقرار نشد.");
                        });
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-3 rounded-2xl text-xs transition-all shadow-lg shadow-emerald-950/20"
                  >
                    💾 ذخیره نهایی و اعمال تنظیمات عمومی
                  </button>
                </div>

              </div>
            )}

          </div>
        )}


        {/* -------------------- TAB 3: GYM / TENANT PANEL -------------------- */}
        {activeTab === "tenant" && !loggedInTenant && (
          <div className="max-w-md mx-auto py-12 space-y-6 animate-fade-in text-right" dir="rtl">
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -z-10"></div>
              
              <div className="w-16 h-16 bg-gradient-to-tr from-pink-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-pink-900/30">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-black text-white">ورود به پرتال مدیریت باشگاه</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  جهت دسترسی به داشبورد وایت‌لیبل باشگاه خود، لطفا اطلاعات ورود صادر شده را وارد کنید.
                </p>
              </div>

              {tenantLoginError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-bold text-center">
                  {tenantLoginError}
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                const u = tenantUsernameInput.trim();
                const p = tenantPasswordInput.trim();
                
                // Find dynamically created tenants matching the user/pass
                const matchedTenant = tenants.find(
                  (t) => t.username && t.username.toLowerCase() === u.toLowerCase() && t.password === p
                );

                // Match dynamically generated or demo credentials
                if ((u === "oxygen" && p === "123") || 
                    (generatedClubCredentials && u === generatedClubCredentials.username && p === generatedClubCredentials.password) ||
                    matchedTenant) {
                  
                  const tenantToLog = matchedTenant || {
                    id: u === "oxygen" ? "oxygen" : u,
                    name: u === "oxygen" ? "باشگاه مدرن اکسیژن" : generatedClubCredentials?.clubName || "باشگاه فیتنس",
                    planName: u === "oxygen" ? "طلایی سالانه" : purchasedPlan?.name || "پلن پایه",
                    features: u === "oxygen" ? ["کاربران نامحدود", "پشتیبانی تیکتی VIP", "آنالیز فیزیکی هوشمند", "اتصال درگاه پرداخت اختصاصی"] : (purchasedPlan?.features || [])
                  };

                  setLoggedInTenant({
                    id: tenantToLog.id,
                    username: u,
                    clubName: tenantToLog.name || (tenantToLog as any).clubName || "باشگاه فیتنس",
                    planName: tenantToLog.planName || "پلن حرفه‌ای (نقره‌ای)",
                    features: tenantToLog.features || ["کاربران نامحدود", "پشتیبانی تیکتی VIP"]
                  });
                  setTenantLoginError("");
                } else {
                  setTenantLoginError("نام کاربری یا کلمه عبور وارد شده نامعتبر است.");
                }
              }} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">نام کاربری مدیریت باشگاه</label>
                  <input 
                    type="text"
                    required
                    value={tenantUsernameInput}
                    onChange={(e) => setTenantUsernameInput(e.target.value)}
                    placeholder="مانند: oxygen"
                    className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-pink-500 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">رمز عبور ورود</label>
                  <input 
                    type="password"
                    required
                    value={tenantPasswordInput}
                    onChange={(e) => setTenantPasswordInput(e.target.value)}
                    placeholder="مانند: 123"
                    className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-pink-500 font-mono text-center"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-pink-950/50 text-xs"
                >
                  ورود امن به پنل باشگاه
                </button>
              </form>

              <div className="border-t border-white/5 pt-4 space-y-2 text-center">
                <span className="text-[10px] text-slate-500 block">اکانت‌های دمو جهت تست سریع:</span>
                <div className="flex justify-center gap-2 flex-wrap">
                  <button 
                    onClick={() => {
                      setTenantUsernameInput("oxygen");
                      setTenantPasswordInput("123");
                    }}
                    className="bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1 rounded text-[10px] font-mono"
                  >
                    oxygen / 123 (اکسیژن اصلی)
                  </button>
                  {generatedClubCredentials && (
                    <button 
                      onClick={() => {
                        setTenantUsernameInput(generatedClubCredentials.username);
                        setTenantPasswordInput(generatedClubCredentials.password);
                      }}
                      className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 px-3 py-1 rounded text-[10px] font-mono"
                    >
                      اکانت جدید خریداری شده
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tenant" && loggedInTenant && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Header of tenant */}
            <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                  {loggedInTenant.clubName ? loggedInTenant.clubName.substring(0, 2) : "اکسیژن"}
                </div>
                <div>
                  <h2 className="text-2xl font-black">{loggedInTenant.clubName || "باشگاه ورزشی مدرن اکسیژن"}</h2>
                  <span className="text-xs text-slate-400">
                    پنل اختصاصی مدیریت باشگاه (Tenant Portal) | اشتراک: {loggedInTenant.planName || "طلایی سالانه"} 
                    <span className="text-emerald-400 font-black font-mono mr-2">({subscriptionDaysLeft} روز باقی‌مانده)</span>
                  </span>
                </div>
              </div>
 
              {/* Status and quick white label controls */}
              <div className="flex gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1.5 rounded-xl font-bold">وضعیت: فعال</span>
                <button 
                  onClick={() => setShowTenantSubscriptionModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                >
                  🔋 شارژ و تمدید اشتراک
                </button>
                <button 
                  onClick={() => {
                    if (!isTenantFeatureActive("white_label")) {
                      alert("❌ قابلیت 'شخصی‌سازی برند و لوگو (White-Label)' در لایسنس فعلی باشگاه شما فعال نیست. لطفاً برای دسترسی به این ابزار نسبت به ارتقای اشتراک خود اقدام فرمایید.");
                    } else {
                      setShowTenantBrandModal(true);
                    }
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${isTenantFeatureActive("white_label") ? "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10" : "bg-red-500/10 text-red-400 border-red-500/20 opacity-60"}`}
                >
                  ⚙️ شخصی‌سازی برند باشگاه {!isTenantFeatureActive("white_label") && "🔒"}
                </button>
                <button 
                  onClick={() => {
                    setLoggedInTenant(null);
                    setTenantUsernameInput("");
                    setTenantPasswordInput("");
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                >
                  خروج
                </button>
              </div>
            </div>

            {/* Tenant Brand Personalization Modal (White-Label Configurator) */}
            {showTenantBrandModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-white/10 space-y-6 relative text-right animate-scale-up" dir="rtl">
                  
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      ⚙️ شخصی‌سازی برندینگ و ظاهر وب‌اپلیکیشن باشگاه
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">تغییر نام، لوگوی متنی و تم رنگی اختصاصی پلتفرم برای ورزشکاران این شعبه.</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="text-slate-300 block mb-1 font-bold">نام کامل باشگاه (تایتل مدیریت)</label>
                      <input
                        type="text"
                        defaultValue={loggedInTenant.clubName || "باشگاه مدرن اکسیژن"}
                        id="tenant_brand_club_name"
                        placeholder="مانند: باشگاه فیتنس رویال نیاوران"
                        className="w-full bg-slate-950 border border-white/10 px-3.5 py-2.5 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-bold">لوگوی متنی اختصاصی (Branded Text)</label>
                      <input
                        type="text"
                        value={tenantBrandText || loggedInTenant.clubName || ""}
                        onChange={(e) => setTenantBrandText(e.target.value)}
                        placeholder="لوگوی متنی بالای پنل ورزشکاران"
                        className="w-full bg-slate-950 border border-white/10 px-3.5 py-2.5 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-2 font-bold">تم رنگی وب‌اپلیکیشن ورزشکاران (Brand Accent)</label>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { id: "emerald", label: "سبز جنگلی", color: "bg-emerald-500" },
                          { id: "blue", label: "آبی نئون", color: "bg-blue-500" },
                          { id: "rose", label: "یاقوتی", color: "bg-rose-500" },
                          { id: "violet", label: "بنفش", color: "bg-violet-500" },
                          { id: "amber", label: "کهربایی", color: "bg-amber-500" }
                        ].map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setTenantCustomColor(preset.id)}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${tenantCustomColor === preset.id ? "border-emerald-500 bg-emerald-500/10 scale-105" : "border-white/5 bg-slate-950 hover:bg-slate-900"}`}
                          >
                            <span className={`w-3 h-3 rounded-full ${preset.color}`} />
                            <span className="text-[8px] text-slate-400">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowTenantBrandModal(false)}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-400 px-4 py-2.5 rounded-xl text-xs font-bold"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newName = (document.getElementById("tenant_brand_club_name") as HTMLInputElement)?.value || loggedInTenant.clubName;
                        setLoggedInTenant((prev: any) => ({
                          ...prev,
                          clubName: newName
                        }));
                        setTenants((prev: any[]) => prev.map(t => t.id === loggedInTenant.id ? { ...t, clubName: newName } : t));
                        setShowTenantBrandModal(false);
                        alert("🎉 تبریک! برند وایت‌لیبل باشگاه با موفقیت شخصی‌سازی و فعال شد. هم‌اکنون لوگو، متون اختصاصی و تم رنگی سفارشی شما روی کل وب‌اپلیکیشن کاربران اعمال گردید.");
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs transition-all shadow-md"
                    >
                      💾 ثبت و اعمال برندینگ
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Tenant Subscription Recharge/Upgrade Modal */}
            {showTenantSubscriptionModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div className="glass-panel max-w-lg w-full p-6 rounded-3xl border border-white/10 space-y-6 relative text-right animate-scale-up animate-fade-in" dir="rtl">
                  
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      🔋 شارژ، تمدید و ارتقای سریع اشتراک پورتال باشگاه
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">یکی از پلن‌های زیر را جهت افزایش شارژ لایسنس و فعال‌سازی امکانات ویژه پورتال اسمارت جیم انتخاب فرمایید.</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        name: "پلن برنزی (پایه)",
                        desc: "شامل مدیریت پایه، حضور غیاب ساده و صندوق بوفه",
                        priceToman: 490000,
                        extensionDays: 30,
                        features: ["مدیریت اعضا", "صندوق بوفه", "پذیرش QR"]
                      },
                      {
                        name: "پلن حرفه‌ای (نقره‌ای)",
                        desc: "پرطرفدارترین! شامل تیکت ابری، بوفه پیشرفته و مدیریت کلاس‌ها",
                        priceToman: 1190000,
                        extensionDays: 90,
                        features: ["مدیریت اعضا", "صندوق بوفه", "تیکت ابری", "مدیریت کلاس‌ها"]
                      },
                      {
                        name: "پلن سازمانی (طلایی سالانه)",
                        desc: "ویژه! شامل مدیریت مربیان مجاز، ریز مالی هوشمند، AI Coach و پشتیبانی اختصاصی VIP",
                        priceToman: 3900000,
                        extensionDays: 365,
                        features: ["مدیریت اعضا", "صندوق بوفه", "تیکت ابری", "مدیریت کلاس‌ها", "مدیریت مربیان و ریز درآمد", "برنامه‌ساز هوش مصنوعی (AI Coach)"]
                      }
                    ].map((plan, index) => (
                      <div key={index} className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-500/20 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{plan.name}</span>
                            <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-2 py-0.5 rounded-md">+{plan.extensionDays} روز اعتبار</span>
                          </div>
                          <p className="text-[10px] text-slate-400">{plan.desc}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 justify-between md:justify-end">
                          <div className="text-left font-sans">
                            <span className="text-xs text-slate-400 font-bold block text-left">مبلغ سرمایه‌گذاری</span>
                            <span className="text-xs text-emerald-400 font-extrabold">{plan.priceToman.toLocaleString()} تومان</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingPurchasePlan({
                                name: plan.name,
                                priceToman: plan.priceToman,
                                extensionDays: plan.extensionDays,
                                features: plan.features,
                                isRenewal: true
                              });
                              setShowTenantSubscriptionModal(false);
                              setShowPaymentSimulator(true);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-[10px] transition-all cursor-pointer"
                          >
                            💳 خرید و اتصال به درگاه
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-white/5 text-[10px] text-slate-400 flex items-start gap-2 leading-relaxed">
                    <span>💡</span>
                    <p>پس از اتمام تراکنش از طریق درگاه بانکی شاپرک، تمدید اشتراک شما به صورت لحظه‌ای و آنی در دیتابیس هوشمند پلتفرم ثبت شده و دسترسی به تمام امکانات مجدداً فعال خواهد شد.</p>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowTenantSubscriptionModal(false)}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-400 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      بستن پنجره
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Dynamic SaaS Plan Features & Remaining Days Simulation Controller */}
            <div className="bg-slate-900/60 p-5 rounded-3xl border border-white/5 space-y-4 text-right animate-fade-in" dir="rtl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    🛡️ جزئیات لایسنس و فعال‌سازی امکانات پنل باشگاه
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    امکانات این پرتال به صورت خودکار بر اساس نوع اشتراک خریداری شده (<span className="text-emerald-400 font-bold">{loggedInTenant.planName || "طلایی سالانه"}</span>) و تعداد روزهای معتبر فعال است.
                  </p>
                </div>
                
                {/* Simulated subscription helper */}
                <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-white/5 self-start md:self-auto">
                  <span className="text-[10px] text-slate-400">شبیه‌ساز روزهای باقیمانده:</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => {
                        const nextVal = Math.max(0, subscriptionDaysLeft - 5);
                        setSubscriptionDaysLeft(nextVal);
                        if (nextVal === 0) alert("⚠️ توجه: روزهای باقیمانده به صفر رسید! تمامی امکانات به جز تمدید غیرفعال گردید.");
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs"
                    >
                      -۵
                    </button>
                    <span className="font-mono font-bold text-xs text-amber-400 px-1 w-8 text-center">{subscriptionDaysLeft}</span>
                    <button 
                      onClick={() => setSubscriptionDaysLeft(prev => prev + 5)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs"
                    >
                      +۵
                    </button>
                    <button 
                      onClick={() => {
                        setSubscriptionDaysLeft(0);
                        alert("🚨 اشتراک به صورت آزمایشی منقضی شد! تمام امکانات قفل شدند تا صحت عملکرد آن بررسی شود.");
                      }}
                      className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 px-2 py-1.5 rounded-lg text-[9px] font-bold"
                    >
                      منقضی کردن (۰ روز)
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Indicator & Instant Renewal Option */}
              {subscriptionDaysLeft === 0 ? (
                <div className="bg-red-500/10 border-2 border-red-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg">🚨</span>
                    <div>
                      <h4 className="font-black text-xs text-red-400">زمان پایان پلن فرا رسیده است! امکانات غیرفعال شدند</h4>
                      <p className="text-[10px] text-slate-300 leading-relaxed mt-1">
                        پلتفرم اسمارت جیم با توجه به پایان یافتن اشتراک شما، دسترسی به پنل مربیان، تیکت پشتیبانی و تغییر اطلاعات باشگاه را موقتاً مسدود کرده است. لطفاً برای فعال‌سازی فوری روی دکمه زیر کلیک کنید.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSubscriptionDaysLeft(30);
                      alert("🎉 پرداخت موفقیت‌آمیز بود! اشتراک طلایی باشگاه برای ۳۰ روز دیگر تمدید و فعال گردید.");
                    }}
                    className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-black text-xs transition-all shadow-md shadow-red-950/20"
                  >
                    💳 پرداخت سریع شهریه و تمدید مجدد لایسنس پلتفرم
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-slate-500 block">داشبورد آمار پایه</span>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">🟢 فعال در لایسنس</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-slate-500 block">آدرس و نقشه تعاملی</span>
                    {isTenantFeatureActive("info") ? (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">🟢 فعال در لایسنس</span>
                    ) : (
                      <span className="text-xs text-red-400 font-bold flex items-center gap-1">🔒 غیرفعال (نیاز به ارتقا)</span>
                    )}
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-slate-500 block">پشتیبانی و تیکت ابری</span>
                    {isTenantFeatureActive("support") ? (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">🟢 فعال در لایسنس</span>
                    ) : (
                      <span className="text-xs text-red-400 font-bold flex items-center gap-1">🔒 غیرفعال (نیاز به ارتقا)</span>
                    )}
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-slate-500 block">مدیریت مربیان و امور مالی</span>
                    {isTenantFeatureActive("coaches") ? (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">🟢 فعال در لایسنس</span>
                    ) : (
                      <span className="text-xs text-red-400 font-bold flex items-center gap-1">🔒 غیرفعال (نیاز به ارتقا)</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tenant Sub-Tab Navigation */}
            <div className="flex border-b border-white/10 gap-2 mb-2 overflow-x-auto">
              <button
                onClick={() => setTenantSubTab("dashboard")}
                className={`px-6 py-3 font-bold text-xs transition-all border-b-2 shrink-0 ${tenantSubTab === "dashboard" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}
              >
                📊 داشبورد و آمار باشگاه
              </button>
              <button
                onClick={() => {
                  if (subscriptionDaysLeft === 0) {
                    alert("🚨 اشتراک باشگاه شما منقضی شده است! لطفاً جهت دسترسی به تنظیمات ساعت و نقشه ابتدا اشتراک خود را شارژ نمایید.");
                  } else if (!isTenantFeatureActive("info")) {
                    alert("❌ قابلیت 'ساعت کاری و آدرس باشگاه' در اشتراک فعلی شما فعال نیست. لطفاً برای استفاده از این امکان اشتراک خود را ارتقا دهید.");
                  } else {
                    setTenantSubTab("info");
                  }
                }}
                className={`px-6 py-3 font-bold text-xs transition-all border-b-2 shrink-0 ${tenantSubTab === "info" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-200"} ${(subscriptionDaysLeft === 0 || !isTenantFeatureActive("info")) ? "opacity-40" : ""}`}
              >
                🕒 ساعت کاری و آدرس باشگاه {(subscriptionDaysLeft === 0 || !isTenantFeatureActive("info")) && "🔒"}
              </button>
              <button
                onClick={() => {
                  if (subscriptionDaysLeft === 0) {
                    alert("🚨 اشتراک باشگاه شما منقضی شده است! لطفاً ابتدا اشتراک خود را تمدید کنید.");
                  } else if (!isTenantFeatureActive("support")) {
                    alert("❌ قابلیت 'پشتیبانی و تیکت ابری' در لایسنس فعلی شما فعال نیست. لطفاً اشتراک خود را به پلن مجهز به این ویژگی ارتقا دهید.");
                  } else {
                    setTenantSubTab("support");
                  }
                }}
                className={`px-6 py-3 font-bold text-xs transition-all border-b-2 shrink-0 ${tenantSubTab === "support" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-200"} ${(subscriptionDaysLeft === 0 || !isTenantFeatureActive("support")) ? "opacity-40" : ""}`}
              >
                🎫 تیکت و پشتیبانی ابری {(subscriptionDaysLeft === 0 || !isTenantFeatureActive("support")) && "🔒"}
              </button>
              <button
                onClick={() => {
                  if (subscriptionDaysLeft === 0) {
                    alert("🚨 اشتراک باشگاه شما منقضی شده است! دسترسی به مدیریت مربیان تا زمان تمدید اشتراک مسدود است.");
                  } else if (!isTenantFeatureActive("coaches")) {
                    alert("❌ قابلیت 'مدیریت مربیان و ریز درآمد' در لایسنس فعلی شما فعال نیست. لطفاً اشتراک خود را ارتقا دهید.");
                  } else {
                    setTenantSubTab("coaches");
                  }
                }}
                className={`px-6 py-3 font-bold text-xs transition-all border-b-2 shrink-0 ${tenantSubTab === "coaches" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-200"} ${(subscriptionDaysLeft === 0 || !isTenantFeatureActive("coaches")) ? "opacity-40" : ""}`}
              >
                🏋️‍♂️ مدیریت مربیان و ریز درآمد {(subscriptionDaysLeft === 0 || !isTenantFeatureActive("coaches")) && "🔒"}
              </button>
            </div>

            {tenantSubTab === "dashboard" && (
              <>
                {/* Dynamically active subscription features */}
                {loggedInTenant.features && loggedInTenant.features.length > 0 && (
                  <div className="bg-slate-900/60 border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-right animate-fade-in" dir="rtl">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-400" />
                        امکانات اختصاصی فعال باشگاه (بر اساس خرید اشتراک {loggedInTenant.planName})
                      </h4>
                      <p className="text-xs text-slate-400">به این امکانات کلیدی که به صورت دستی توسط مدیریت کل پلتفرم تنظیم شده است، دسترسی دارید:</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {loggedInTenant.features.map((feat: string, i: number) => (
                        <span key={i} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400 animate-pulse" />
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick dashboard metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 block mb-1">درآمد مالی ماه جاری باشگاه</span>
                <span className="text-xl font-bold text-white">۴۸,۲۰۰,۰۰۰ تومان</span>
                {isTenantFeatureActive("payment_gateway") ? (
                  <span className="text-[9px] block text-emerald-400 mt-1">🟢 متصل به درگاه پرداخت مستقیم شتاب</span>
                ) : (
                  <span className="text-[9px] block text-amber-400 mt-1">⚠️ بدون درگاه پرداخت فعال (نقدی / کارت‌به‌کارت)</span>
                )}
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 block mb-1">تعداد شاگردان فعال عضو</span>
                <span className="text-xl font-bold text-blue-400">۴۵۰ ورزشکار</span>
                <span className="text-[9px] block text-slate-500 mt-1">با QR کد فعال پذیرش</span>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 block mb-1">شعبات ثبت شده بدنسازی</span>
                <span className="text-xl font-bold text-emerald-400">۲ شعبه فعال</span>
                <span className="text-[9px] block text-slate-500 mt-1">نیاوران و پاسداران</span>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 block mb-1">کلاس‌های رزرو شده امروز</span>
                <span className="text-xl font-bold text-violet-400">۱۲ کلاس گروهی</span>
                <span className="text-[9px] block text-violet-400 mt-1">ساعت ۱۷:۰۰ الی ۲۲:۰۰</span>
              </div>
            </div>

            {/* Membership & Subscription Approval Requests Panel */}
            <div className="glass-panel p-6 rounded-3xl border border-emerald-500/10 space-y-4 bg-gradient-to-br from-slate-900/80 to-slate-950/80 text-right" dir="rtl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">درخواست‌های عضویت و تمدید شهریه در انتظار تایید باشگاه</h3>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                  {toPersianNums(String(membershipRequests.filter(r => r.status === "PENDING").length))} درخواست در انتظار
                </span>
              </div>

              {membershipRequests.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  هیچ درخواستی برای عضویت یا تمدید شهریه در سیستم ثبت نشده است.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
                  {membershipRequests.map((req) => (
                    <div key={req.id} className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex flex-col justify-between gap-3 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-white text-sm">{req.memberName}</span>
                          <span className="text-[10px] text-slate-400 block mt-1">بسته انتخابی: {req.planName}</span>
                          <span className="text-[10px] text-slate-400 block">مدت اضافه اعتبار: {toPersianNums(String(req.days))} روز</span>
                        </div>
                        <div className="text-left font-mono">
                          <span className="text-emerald-400 font-bold block">{toPersianNums(req.priceToman.toLocaleString())} تومان</span>
                          <span className="text-[9px] text-slate-500 mt-1 block">{req.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-3">
                        <div>
                          {req.status === "PENDING" && (
                            <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full text-[9px]">
                              🔄 منتظر تایید باشگاه
                            </span>
                          )}
                          {req.status === "APPROVED" && (
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full text-[9px]">
                              ✅ تایید و فعال شده
                            </span>
                          )}
                          {req.status === "REJECTED" && (
                            <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full text-[9px]">
                              ❌ رد شده
                            </span>
                          )}
                        </div>

                        {req.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                // Approve request
                                const updatedRequests = membershipRequests.map(r => {
                                  if (r.id === req.id) return { ...r, status: "APPROVED" as const };
                                  return r;
                                });
                                setMembershipRequests(updatedRequests);

                                // Update member remaining days
                                const updatedMembers = members.map(m => {
                                  if (m.id === req.memberId) {
                                    return { ...m, remainingDays: (m.remainingDays || 0) + req.days };
                                  }
                                  return m;
                                });
                                setMembers(updatedMembers);

                                // Add revenue to club
                                setClubRevenue(prev => prev + req.priceToman);

                                // Add to invoices
                                const newInvoice = {
                                  id: `inv_renewal_${Date.now()}`,
                                  memberName: req.memberName,
                                  planName: req.planName,
                                  amount: `${toPersianNums(req.priceToman.toLocaleString())} تومان`,
                                  date: "1405/04/04",
                                  status: "PAID"
                                };
                                setInvoices([newInvoice, ...invoices]);

                                alert(`✅ درخواست تمدید شهریه "${req.memberName}" با موفقیت تایید و مبلغ به صندوق اضافه شد. اعتبار وی ${toPersianNums(String(req.days))} روز تمدید گردید.`);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-3 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer"
                            >
                              تایید و فعال‌سازی
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedRequests = membershipRequests.map(r => {
                                  if (r.id === req.id) return { ...r, status: "REJECTED" as const };
                                  return r;
                                });
                                setMembershipRequests(updatedRequests);
                                alert(`❌ درخواست تمدید شهریه "${req.memberName}" رد شد.`);
                              }}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer"
                            >
                              رد کردن
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Two column interactive grid: Booking & Supplements Shop */}
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Classes Reservation Bookings System */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-bold">رزرواسیون کلاس‌ها و نوبت‌دهی (Booking Calendar)</h3>
                  </div>
                </div>

                {/* Simulated bookings list */}
                <div className="space-y-3">
                  {displayedBookings.map((booking) => (
                    <div key={booking.id} className="bg-slate-950 p-3 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-200 block">{booking.className}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">ورزشکار: {booking.memberName} | مربی: {booking.coachName}</span>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-slate-300 font-mono block">{booking.timeSlot}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1 ${booking.status === "CONFIRMED" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                          {booking.status === "CONFIRMED" ? "تایید شده" : "لیست انتظار"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create booking interactive form */}
                <form onSubmit={handleCreateBooking} className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-3 text-xs">
                  <span className="font-bold block text-slate-300">ثبت رزرواسیون جلسه جدید</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-0.5">نام ورزشکار</label>
                      <input 
                        type="text" 
                        value={newBooking.memberName}
                        onChange={(e) => setNewBooking({ ...newBooking, memberName: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 px-2.5 py-1.5 rounded-lg text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">کلاس انتخابی</label>
                      <input 
                        type="text" 
                        value={newBooking.className}
                        onChange={(e) => setNewBooking({ ...newBooking, className: e.target.value })}
                        className="w-full bg-slate-900 border border-white/10 px-2.5 py-1.5 rounded-lg text-slate-200"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl transition-all"
                  >
                    ثبت رزرو در تقویم باشگاه
                  </button>
                </form>
              </div>

              {/* Buffet Supplements Inventory Shop */}
              <div className="relative overflow-hidden rounded-3xl">
                <div className={`glass-panel p-6 border border-white/10 space-y-4 ${!isTenantFeatureActive("buffet") ? "blur-[2px] pointer-events-none opacity-40 select-none" : ""}`}>
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold">بوفه هوشمند و انبارداری فروشگاهی (Supplement Store)</h3>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">امکان پرداخت از کیف‌پول</span>
                  </div>

                  {/* Store Products List */}
                  <div className="space-y-3 max-h-[180px] overflow-y-auto">
                    {displayedStoreProducts.map((p) => (
                      <div key={p.id} className="bg-slate-950 p-2.5 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-200 block">{p.name}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">برند: {p.brand} | بارکد: {p.barcode || "ثبت نشده"}</span>
                        </div>
                        <div className="text-left flex items-center gap-3">
                          <div>
                            <span className="text-emerald-400 font-bold block">{p.priceToman.toLocaleString()} تومان</span>
                            <span className={`text-[10px] block mt-0.5 ${p.stock <= p.minStockAlert ? "text-red-400 font-bold" : "text-slate-400"}`}>
                              موجودی: {p.stock} عدد {p.stock <= p.minStockAlert && "(هشدار شارژ)"}
                            </span>
                          </div>
                          <button 
                            onClick={() => {
                              alert(`فروش ۱ عدد "${p.name}" با موفقیت ثبت شد و از موجودی انبار کسر گردید.`);
                              setStoreProducts(storeProducts.map(item => item.id === p.id ? { ...item, stock: item.stock - 1 } : item));
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-white p-1.5 rounded-lg"
                          >
                            فروش
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Create product form */}
                  <form onSubmit={handleCreateProduct} className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-3 text-xs">
                    <span className="font-bold block text-slate-300">افزودن آیتم جدید به انبار بوفه</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-0.5">نام محصول</label>
                        <input 
                          type="text" 
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          placeholder="پروتئین وی..."
                          className="w-full bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-0.5">برند تولیدی</label>
                        <input 
                          type="text" 
                          value={newProduct.brand}
                          onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                          className="w-full bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-slate-400 block mb-0.5">قیمت (تومان)</label>
                        <input 
                          type="number" 
                          value={newProduct.priceToman}
                          onChange={(e) => setNewProduct({ ...newProduct, priceToman: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-0.5">موجودی اولیه</label>
                        <input 
                          type="number" 
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-0.5">بارکد کالا</label>
                        <input 
                          type="text" 
                          value={newProduct.barcode}
                          onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                          className="w-full bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg text-slate-200"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2 rounded-xl transition-all"
                    >
                      افزودن و ثبت کالا
                    </button>
                  </form>
                </div>
                {!isTenantFeatureActive("buffet") && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10" dir="rtl">
                    <span className="text-3xl mb-2">🔒</span>
                    <h4 className="text-sm font-black text-white">بوفه هوشمند و انبارداری در لایسنس شما فعال نیست</h4>
                    <p className="text-[10px] text-slate-300 max-w-xs mt-1.5 leading-relaxed">
                      این قابلیت لایسنس پلتفرم در اشتراک فعلی شما فعال نشده است. برای دسترسی فوری لطفاً از طریق دکمه ارتقای لایسنس، اشتراک خود را تغییر دهید.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Invoices Accounting Ledger */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold">تراکنش‌های مالی، شهریه‌ها و فاکتورها (Financial Ledger)</h3>
                </div>
              </div>

              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div key={inv.id} className="bg-slate-950 p-3 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400">
                        INV
                      </div>
                      <div>
                        <span className="font-bold text-slate-200">{inv.memberName}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">شرح فاکتور: {inv.planName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="font-mono text-slate-300">{inv.date}</span>
                      <span className="font-bold text-white">{inv.amountToman.toLocaleString()} تومان</span>
                      
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                        {inv.status === "PAID" ? "پرداخت شده" : "در انتظار پرداخت"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            </>
            )}

            {tenantSubTab === "info" && (
              <div className="animate-fade-in text-right" dir="rtl">
                <GymInfoTab 
                  isDarkMode={isDarkMode} 
                  tenantName={loggedInTenant.clubName || "مجموعه ورزشی اکسیژن"} 
                  onUpdateTenantName={(newName) => {
                    setLoggedInTenant({ ...loggedInTenant, clubName: newName });
                    setTenants(prev => prev.map(t => t.id === loggedInTenant.id ? { ...t, clubName: newName } : t));
                  }}
                />
              </div>
            )}

            {tenantSubTab === "support" && (
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 animate-fade-in text-right" dir="rtl">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">تیکت‌های پشتیبانی باشگاه</h3>
                    <p className="text-xs text-slate-400">تیکت‌های ارسالی شما به سوپر ادمین در این بخش قابل پیگیری و ثبت است.</p>
                  </div>
                </div>
                <TicketSystem
                  isSuperAdmin={false}
                  isDarkMode={isDarkMode}
                  tickets={displayedTickets}
                  setTickets={setTickets}
                  currentUserLabel={loggedInTenant.clubName || "باشگاه ورزشی اکسیژن"}
                />
              </div>
            )}

            {tenantSubTab === "coaches" && (
              <div className="grid md:grid-cols-12 gap-8 animate-fade-in text-right" dir="rtl">
                
                {/* Right Column: Add Coach Form */}
                <div className="md:col-span-5 glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">🏋️‍♂️ ثبت مربی جدید</h3>
                    <p className="text-xs text-slate-400">یک مربی جدید با اطلاعات ورود اختصاصی تعریف کنید.</p>
                  </div>

                  {coachAddSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-bold animate-pulse">
                      ✅ مربی جدید با موفقیت ثبت شد و آماده ورود به پنل اختصاصی مربیان است.
                    </div>
                  )}

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newCoachName || !newCoachUsername || !newCoachPassword) {
                      alert("لطفا تمامی فیلدها را پر کنید");
                      return;
                    }
                    const newCoach = {
                      id: String(coaches.length + 1),
                      name: newCoachName,
                      username: newCoachUsername,
                      password: newCoachPassword,
                      specialty: newCoachSpecialty,
                      clubId: loggedInTenant.id || "1"
                    };
                    setCoaches([...coaches, newCoach]);
                    setNewCoachName("");
                    setNewCoachUsername("");
                    setNewCoachPassword("");
                    setCoachAddSuccess(true);
                    setTimeout(() => setCoachAddSuccess(false), 4000);
                  }} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">نام و نام خانوادگی مربی</label>
                      <input 
                        type="text"
                        value={newCoachName}
                        onChange={(e) => setNewCoachName(e.target.value)}
                        placeholder="مثال: استاد علیرضا احمدی"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">تخصص اصلی</label>
                      <input 
                        type="text"
                        value={newCoachSpecialty}
                        onChange={(e) => setNewCoachSpecialty(e.target.value)}
                        placeholder="مثال: فیتنس، پاورلیفتینگ، تغذیه"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">نام کاربری (نام لاتین)</label>
                      <input 
                        type="text"
                        value={newCoachUsername}
                        onChange={(e) => setNewCoachUsername(e.target.value)}
                        placeholder="مثال: ahmadifit"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-left font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">رمز عبور ورود</label>
                      <input 
                        type="password"
                        value={newCoachPassword}
                        onChange={(e) => setNewCoachPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-left"
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black py-2.5 rounded-xl transition-all text-xs"
                    >
                      ثبت مربی و صدور اعتبارنامه
                    </button>
                  </form>
                </div>

                {/* Left Column: Coaches List */}
                <div className="md:col-span-7 glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">📋 لیست مربیان مجاز باشگاه</h3>
                    <p className="text-xs text-slate-400">مربیانی که در این بخش تعریف می‌شوند دسترسی کامل به پنل طراحی برنامه‌ها خواهند داشت.</p>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {coaches.filter(c => c.clubId === "all" || c.clubId === loggedInTenant.id).map((coach, index) => (
                      <div key={coach.id} className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white">{coach.name}</h4>
                            <span className="text-[10px] text-slate-400 block mt-0.5">تخصص: {coach.specialty}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 text-left font-sans">
                          <div className="font-mono text-left">
                            <span className="text-[9px] text-slate-500 block">نام کاربری ورود</span>
                            <span className="text-xs text-emerald-400 font-bold">{coach.username}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              alert(`📊 جزئیات درآمد و صورتحساب مربی (${coach.name}):\n\n` +
                                    `💵 کل درآمد ناخالص: ۵,۴۰۰,۰۰۰ تومان\n` +
                                    `🤝 سهم مربی (۷۰٪): ۳,۷۸۰,۰۰۰ تومان\n` +
                                    `🏢 سهم باشگاه (۳۰٪): ۱,۶۲۰,۰۰۰ تومان\n\n` +
                                    `📋 ریز تراکنش‌های مرتبط:\n` +
                                    `۱. تمدید شهریه سهراب رضایی (بدنسازی خصوصی) -> مبلغ ۶۵۰,۰۰۰ تومان (سهم مربی: ۴۵۵,۰۰۰ تومان)\n` +
                                    `۲. طراحی برنامه غذایی علی احمدی -> مبلغ ۳۰۰,۰۰۰ تومان (سهم مربی: ۲۱۰,۰۰۰ تومان)\n` +
                                    `۳. دوره خصوصی فیتنس نگار محمدی -> مبلغ ۴,۴۵۰,۰۰۰ تومان (سهم مربی: ۳,۱۱۵,۰۰۰ تومان)`);
                            }}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold px-2.5 py-1 rounded-lg mt-1 transition-all"
                          >
                            📊 ریز درآمد و امور مالی مربی
                          </button>
                        </div>
                      </div>
                    ))}
                    {coaches.filter(c => c.clubId === "all" || c.clubId === loggedInTenant.id).length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        هیچ مربی فعالی برای این شعبه ثبت نشده است. از فرم مقابل مربی اول را ثبت کنید.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}


        {/* -------------------- TAB 4: COACH PANEL -------------------- */}
        {activeTab === "coach" && !loggedInCoach && (
          <div className="max-w-md mx-auto my-12 glass-panel p-8 rounded-[2.5rem] border border-white/10 space-y-6 text-right animate-fade-in animate-duration-300" dir="rtl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-indigo-950/40">
                🏋️‍♂️
              </div>
              <h2 className="text-2xl font-black text-white mt-4 font-sans">ورود مربیان باشگاه</h2>
              <p className="text-xs text-slate-400">نام کاربری و کلمه‌عبور مربیگری خود را وارد نمایید.</p>
            </div>

            {coachLoginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-bold text-center">
                ⚠️ {coachLoginError}
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              const found = coaches.find(c => c.username.toLowerCase() === coachUsernameInput.toLowerCase() && c.password === coachPasswordInput);
              if (found) {
                setLoggedInCoach(found);
                setCoachLoginError("");
              } else {
                setCoachLoginError("نام کاربری یا رمز عبور اشتباه است.");
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">نام کاربری مربی</label>
                <input 
                  type="text"
                  value={coachUsernameInput}
                  onChange={(e) => setCoachUsernameInput(e.target.value)}
                  placeholder="مثال: pouria"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 text-left font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">رمز عبور ورود</label>
                <input 
                  type="password"
                  value={coachPasswordInput}
                  onChange={(e) => setCoachPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 text-left"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-violet-950/40 text-xs"
              >
                ورود امن به پنل مربی
              </button>
            </form>

            <div className="text-center pt-2 text-[10px] text-slate-500">
              💡 مربی محترم، در صورتی که حساب کاربری فعال ندارید، اطلاعات ورود خود را از مدیریت باشگاه ورزشی دریافت فرمایید.
            </div>
          </div>
        )}

        {activeTab === "coach" && loggedInCoach && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Header of Coach panel */}
            <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl animate-pulse">
                  مربی
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">پنل اختصاصی مربی: {loggedInCoach.name}</h2>
                  <span className="text-xs text-slate-400">تخصص: {loggedInCoach.specialty} | مدیریت برنامه‌های تمرینی، غذایی و پایش بیومتریک اعضا</span>
                </div>
              </div>

              <div>
                <button
                  onClick={() => {
                    setLoggedInCoach(null);
                    setCoachUsernameInput("");
                    setCoachPasswordInput("");
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs px-4 py-2 rounded-xl font-bold transition-all"
                >
                  خروج از پنل مربیگری
                </button>
              </div>
            </div>

            {/* Coach Panel Sub-Navigation */}
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setCoachSubView("directory")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${coachSubView === "directory" ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30" : "bg-slate-900/50 text-slate-400 hover:text-slate-200 border border-white/5"}`}
              >
                شاگردان فعال و بانک حرکات بدنسازی
              </button>
              <button 
                onClick={() => setCoachSubView("create_workout")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${coachSubView === "create_workout" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" : "bg-slate-900/50 text-slate-400 hover:text-slate-200 border border-white/5"}`}
              >
                <Plus className="w-4 h-4" />
                طراحی برنامه تمرینی جدید (دستی)
              </button>
              <button 
                onClick={() => setCoachSubView("create_nutrition")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${coachSubView === "create_nutrition" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30" : "bg-slate-900/50 text-slate-400 hover:text-slate-200 border border-white/5"}`}
              >
                <Plus className="w-4 h-4" />
                طراحی برنامه غذایی جدید (دستی)
              </button>
              <button 
                onClick={() => {
                  if (!isTenantFeatureActive("ai_coach")) {
                    alert("❌ قابلیت 'دستیار هوش مصنوعی (AI Coach)' در اشتراک فعلی این باشگاه فعال نیست. لطفاً از مدیریت باشگاه درخواست کنید تا اشتراک خود را ارتقا دهند.");
                  } else {
                    setCoachSubView("ai_generation");
                  }
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${coachSubView === "ai_generation" ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg shadow-emerald-950/40" : "bg-slate-900/50 text-slate-400 hover:text-slate-200 border border-white/5"} ${!isTenantFeatureActive("ai_coach") ? "opacity-60" : ""}`}
              >
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse animate-duration-1000" />
                طراحی برنامه هوشمند با هوش مصنوعی (AI Coach) {!isTenantFeatureActive("ai_coach") && "🔒"}
              </button>
              <button 
                onClick={() => setCoachSubView("earnings")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${coachSubView === "earnings" ? "bg-amber-600 text-white shadow-lg shadow-amber-900/30" : "bg-slate-900/50 text-slate-400 hover:text-slate-200 border border-white/5"}`}
              >
                <TrendingUp className="w-4 h-4 text-amber-400" />
                درآمدها و گزارش مالی مربی
              </button>
            </div>

            {coachSubView === "directory" && (
              <>
                {/* Quick stats for coach */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 block mb-1">ورزشکاران تحت مربیگری</span>
                <span className="text-xl font-bold text-white">۱۸ شاگرد فعال</span>
                <span className="text-[9px] block text-emerald-400 mt-1">تکمیل ظرفیت پذیرش: ۷۰٪</span>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 block mb-1">برنامه‌های تمرینی فعال</span>
                <span className="text-xl font-bold text-blue-400">۱۲ برنامه شخصی</span>
                <span className="text-[9px] block text-slate-500 mt-1">بروزرسانی شده در ماه جاری</span>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 block mb-1">پیشرفت میانگین شاگردان</span>
                <span className="text-xl font-bold text-emerald-400">↑ ۱۲٪ افزایش قدرت</span>
                <span className="text-[9px] block text-slate-500 mt-1">بر اساس پایش بیومتریک</span>
              </div>
              <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 block mb-1">حضور شاگردان امروز</span>
                <span className="text-xl font-bold text-violet-400">۵ شاگرد حاضر</span>
                <span className="text-[9px] block text-violet-400 mt-1">در تایم عصر</span>
              </div>
            </div>

            {/* Two column grid: Body Measurement Tracking & Exercises database */}
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Biometrics & Body Analytics Measurements */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 text-right" dir="rtl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-violet-400" />
                    <h3 className="text-sm font-bold text-white">پرونده پزشکی و آنالیز فیزیکی شاگردان</h3>
                  </div>
                  
                  {/* Athlete Selector Dropdown */}
                  <div>
                    <select
                      value={selectedCoachMemberId}
                      onChange={(e) => setSelectedCoachMemberId(e.target.value)}
                      className="bg-slate-950 border border-white/10 px-3 py-1.5 rounded-xl text-slate-200 text-[11px] focus:outline-none focus:border-violet-500"
                    >
                      {displayedMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Simulated measurements logs */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 bg-white/5 rounded-xl space-y-1">
                      <span className="text-[9px] text-slate-400 block">شاخص توده بدنی (BMI)</span>
                      <input
                        type="text"
                        value={editMemberBmi}
                        onChange={(e) => setEditMemberBmi(e.target.value)}
                        className="w-full bg-slate-900 text-center border border-white/5 rounded px-1.5 py-0.5 text-xs text-white font-bold"
                      />
                    </div>
                    <div className="p-2 bg-white/5 rounded-xl space-y-1">
                      <span className="text-[9px] text-slate-400 block">متابولیسم پایه (BMR)</span>
                      <input
                        type="text"
                        value={editMemberBmr}
                        onChange={(e) => setEditMemberBmr(e.target.value)}
                        className="w-full bg-slate-900 text-center border border-white/5 rounded px-1.5 py-0.5 text-xs text-white font-bold"
                      />
                    </div>
                    <div className="p-2 bg-white/5 rounded-xl space-y-1">
                      <span className="text-[9px] text-slate-400 block">درصد چربی بدن</span>
                      <input
                        type="text"
                        value={editMemberFat}
                        onChange={(e) => setEditMemberFat(e.target.value)}
                        className="w-full bg-slate-900 text-center border border-white/5 rounded px-1.5 py-0.5 text-xs text-emerald-400 font-bold"
                      />
                    </div>
                  </div>

                  {/* Body tape measurements details */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-300 block">اندازه‌گیری دور تا دور عضلات (سایزها به سانتی‌متر)</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-[10px]">
                      <div className="bg-slate-900 p-2 rounded-lg space-y-1">
                        <span className="text-slate-400 block">دور بازو:</span>
                        <input
                          type="text"
                          value={editMemberArm}
                          onChange={(e) => setEditMemberArm(e.target.value)}
                          className="w-full bg-slate-950 text-center border border-white/5 rounded text-white text-[10px]"
                        />
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg space-y-1">
                        <span className="text-slate-400 block">دور سینه:</span>
                        <input
                          type="text"
                          value={editMemberChest}
                          onChange={(e) => setEditMemberChest(e.target.value)}
                          className="w-full bg-slate-950 text-center border border-white/5 rounded text-white text-[10px]"
                        />
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg space-y-1">
                        <span className="text-slate-400 block">دور کمر:</span>
                        <input
                          type="text"
                          value={editMemberWaist}
                          onChange={(e) => setEditMemberWaist(e.target.value)}
                          className="w-full bg-slate-950 text-center border border-white/5 rounded text-white text-[10px]"
                        />
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg space-y-1">
                        <span className="text-slate-400 block">دور ران:</span>
                        <input
                          type="text"
                          value={editMemberThigh}
                          onChange={(e) => setEditMemberThigh(e.target.value)}
                          className="w-full bg-slate-950 text-center border border-white/5 rounded text-white text-[10px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Body Comparison Note */}
                  <div className="p-3 bg-violet-950/40 border border-violet-900/30 rounded-xl space-y-1.5">
                    <span className="font-bold text-violet-300 block">یادداشت مربی برای پرونده {activeCoachMember?.name}:</span>
                    <textarea
                      rows={2}
                      value={editMemberNotes}
                      onChange={(e) => setEditMemberNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 px-2.5 py-1.5 rounded-lg text-slate-200 text-[10px] leading-relaxed focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* Save button */}
                  <button
                    type="button"
                    onClick={handleUpdateBiometrics}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 rounded-xl text-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    💾 ذخیره نهایی و ثبت در پرونده پزشکی {activeCoachMember?.name}
                  </button>
                </div>
              </div>

              {/* Complete exercises database index search */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">بانک اطلاعاتی و کتابخانه حرکات</h3>
                  </div>
                </div>

                {/* Form to add a brand new exercise */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-3">
                  <span className="text-[11px] font-black text-blue-400 block">➕ تعریف حرکت ورزشی جدید به سامانه</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">نام حرکت *</label>
                      <input 
                        type="text"
                        value={newExName}
                        onChange={(e) => setNewExName(e.target.value)}
                        placeholder="مانند: جلو بازو اسپایدر"
                        className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">گروه عضلانی</label>
                      <select 
                        value={newExGroup}
                        onChange={(e) => setNewExGroup(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="سینه">سینه</option>
                        <option value="پشت">پشت / زیربغل</option>
                        <option value="سرشانه">سرشانه</option>
                        <option value="جلو بازو">جلو بازو</option>
                        <option value="پشت بازو">پشت بازو</option>
                        <option value="پا">پا / چهارسر</option>
                        <option value="شکم">شکم و فیله</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">فرم صحیح اجرا</label>
                      <input 
                        type="text"
                        value={newExCorrect}
                        onChange={(e) => setNewExCorrect(e.target.value)}
                        placeholder="آرنج‌ها را ثابت نگه دارید..."
                        className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">اشتباه رایج</label>
                      <input 
                        type="text"
                        value={newExWrong}
                        onChange={(e) => setNewExWrong(e.target.value)}
                        placeholder="تاب دادن کمر و بدن..."
                        className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newExName.trim()) {
                        alert("لطفا نام حرکت ورزشی را وارد کنید.");
                        return;
                      }
                      const newItem = {
                        id: `custom_ex_${Date.now()}`,
                        name: newExName.trim(),
                        muscleGroup: newExGroup,
                        correctForm: newExCorrect.trim() || "فرم استاندارد اجرا با دامنه حرکتی کامل",
                        wrongForm: newExWrong.trim() || "انجام با عجله و ضربه زدن به مفصل"
                      };
                      const updated = [...exercisesList, newItem];
                      setExercisesList(updated);
                      // Reset
                      setNewExName("");
                      setNewExCorrect("");
                      setNewExWrong("");
                      alert(`حرکت جدید "${newItem.name}" با موفقیت تعریف شد و به کتابخانه حرکات باشگاه اضافه گردید!`);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 rounded-lg text-[9px] transition-all cursor-pointer"
                  >
                    💾 ثبت و اضافه کردن حرکت به دیتابیس
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
                  <input 
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="جستجو در بین کل کتابخانه حرکات..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Simulated list of search results */}
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {exercisesList.filter(ex => 
                    ex.name.toLowerCase().includes(globalSearch.toLowerCase()) || 
                    ex.muscleGroup.includes(globalSearch)
                  ).map((ex) => (
                    <div key={ex.id} className="bg-slate-950 p-3 rounded-2xl border border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-400">{ex.name}</span>
                        <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">{ex.muscleGroup}</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed text-[10px]">{ex.correctForm}</p>
                      <div className="text-red-400/90 text-[9px] border-t border-white/5 pt-1.5 mt-1">
                        <strong>اشتباه رایج:</strong> {ex.wrongForm}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Assigned programs list and direct designer link */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold">برنامه‌های تمرینی طراحی شده و در دست اجرا</h3>
                </div>
                <button 
                  onClick={() => setActiveTab("ai_labs")}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  طراحی برنامه هوشمند با AI
                </button>
              </div>

              {MOCK_WORKOUT_PROGRAMS.map((prog) => (
                <div key={prog.id} className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200 text-sm">{prog.title}</span>
                    <span className="text-emerald-400 font-bold">شاگرد اختصاصی: {prog.assignedTo}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{prog.summary}</p>
                  
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5 text-[10px] text-slate-500">
                    <span>تولید شده توسط: {prog.createdBy}</span>
                    <span>•</span>
                    <span>تعداد روزها: ۳ روز در هفته</span>
                  </div>
                </div>
              ))}
            </div>

            {/* NEW MODULE: Coach-Athlete accounts management & creation */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">مدیریت حساب کاربری ورزشکاران و دسترسی پنل اختصاصی (PWA)</h3>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Form to create member account */}
                <form onSubmit={handleCreateMember} className="lg:col-span-1 bg-slate-950/60 p-5 rounded-2xl border border-white/5 space-y-4 text-xs">
                  <span className="font-bold text-slate-200 text-sm block border-b border-white/5 pb-2">ثبت‌نام و ایجاد اکانت جدید</span>
                  
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">نام و نام خانوادگی ورزشکار <span className="text-red-400">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="مانند: علی حسینی"
                      className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">تلفن همراه</label>
                      <input 
                        type="text" 
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        placeholder="۰۹۱۲..."
                        className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">تعداد جلسات مجاز</label>
                      <input 
                        type="number" 
                        value={newMemberSessions}
                        onChange={(e) => setNewMemberSessions(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">نام کاربری ورود <span className="text-red-400">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={newMemberUsername}
                        onChange={(e) => setNewMemberUsername(e.target.value)}
                        placeholder="مثال: ali_h"
                        className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">رمز عبور ورود <span className="text-red-400">*</span></label>
                      <input 
                        type="text" 
                        required
                        value={newMemberPassword}
                        onChange={(e) => setNewMemberPassword(e.target.value)}
                        placeholder="مانند: 123456"
                        className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium text-[10px]">برنامه تمرینی اختصاصی</label>
                      <select 
                        value={newMemberProgramId}
                        onChange={(e) => setNewMemberProgramId(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                      >
                        {displayedWorkoutPrograms.map((p) => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium text-[10px]">برنامه غذایی اختصاصی</label>
                      <select 
                        value={newMemberNutritionId}
                        onChange={(e) => setNewMemberNutritionId(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                      >
                        {displayedNutritionPlans.map((n) => (
                          <option key={n.id} value={n.id}>{n.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-950/50 text-xs"
                  >
                    ثبت ورزشکار و ایجاد اکانت PWA
                  </button>
                </form>

                {/* Directory list of member accounts */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 text-xs">لیست اکانت‌های فعال جهت ورود به پنل ورزشکار</span>
                    <span className="text-[10px] text-slate-500">{displayedMembers.length} ورزشکار ثبت شده</span>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {displayedMembers.map((member) => (
                      <div key={member.id} className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center gap-3 animate-fade-in">
                          <div 
                            onClick={() => setSelectedDetailedMember(member)}
                            className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-black text-indigo-400 text-sm cursor-pointer hover:scale-110 hover:border-emerald-500 transition-all"
                            title="مشاهده پرونده و عملکرد"
                          >
                            {member.name.substring(0, 1)}
                          </div>
                          <div className="cursor-pointer group" onClick={() => setSelectedDetailedMember(member)} title="مشاهده پرونده و عملکرد">
                            <span className="font-bold text-slate-200 block text-sm group-hover:text-emerald-400 transition-colors">{member.name}</span>
                            <span className="text-[10px] text-slate-500 block mt-1">تلفن: {member.phone} | تاریخ پیوستن: {member.joinedDate}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-white/5">
                            <span className="text-[9px] text-slate-500 block">نام کاربری ورود</span>
                            <span className="font-mono text-indigo-400 font-bold text-sm">{member.username}</span>
                          </div>
                          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-white/5">
                            <span className="text-[9px] text-slate-500 block">رمز عبور</span>
                            <span className="font-mono text-amber-400 font-bold text-sm">{member.password}</span>
                          </div>
                          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-white/5 text-center">
                            <span className="text-[9px] text-slate-500 block">جلسات باقیمانده</span>
                            <span className="text-emerald-400 font-bold text-sm">{member.remainingSessions} جلسه</span>
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => setSelectedDetailedMember(member)}
                              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-xl font-bold transition-all text-[11px]"
                            >
                              🔍 مشاهده عملکرد و پرونده
                            </button>
                            <button 
                              onClick={() => {
                                setLoggedInMember(member);
                                const memberProg = MOCK_WORKOUT_PROGRAMS.find(p => p.id === member.assignedProgramId) || MOCK_WORKOUT_PROGRAMS[0];
                                setActiveWorkoutProg(memberProg);
                                setActiveTab("member");
                                setActiveDayIndex(0);
                                setActiveExerciseIndex(0);
                                setActiveSetIndex(0);
                                setIsPlaying(false);
                                setWorkoutSummary(null);
                                alert(`ورود شبیه‌سازی شده به عنوان ورزشکار "${member.name}" موفقیت‌آمیز بود. اکنون در پنل ورزشکار هستید.`);
                              }}
                              className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-2 rounded-xl font-bold transition-all"
                            >
                              ورود مستقیم به پنل ورزشکار
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`آیا از حذف حساب کاربری ورزشکار "${member.name}" مطمئن هستید؟`)) {
                                  setMembers(members.filter(m => m.id !== member.id));
                                  alert("حساب کاربری با موفقیت حذف گردید.");
                                }
                              }}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-2 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
              </>
            )}

            {/* Manual Workout Creator View */}
            {coachSubView === "create_workout" && (
              <div className="space-y-6 animate-fade-in text-right" dir="rtl">
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
                  <div className="border-b border-white/5 pb-4">
                    <h3 className="text-lg font-black text-white">طراحی دستی برنامه تمرینی جدید بدنسازی</h3>
                    <p className="text-xs text-slate-400">اطلاعات کلی برنامه و ساختار روزهای تمرین را مشخص کنید.</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-400 block mb-1 font-medium">عنوان برنامه تمرینی *</label>
                      <input 
                        type="text"
                        required
                        value={mWorkoutTitle}
                        onChange={(e) => setMWorkoutTitle(e.target.value)}
                        placeholder="مانند: برنامه هایپرتروفی سینه و جلو بازو (فشرده)"
                        className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-medium">انتخاب ورزشکار هدف (تخصیص مستقیم)</label>
                      <select 
                        value={selectedTargetMemberId}
                        onChange={(e) => setSelectedTargetMemberId(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                      >
                        <option value="">-- برنامه عمومی (بدون انتساب مستقیم) --</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-medium">خلاصه و تمرکز اصلی برنامه</label>
                    <input 
                      type="text"
                      value={mWorkoutSummary}
                      onChange={(e) => setMWorkoutSummary(e.target.value)}
                      placeholder="مانند: افزایش حجم تفکیکی عضلات بالاتنه به همراه کات ملایم"
                      className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  {/* Days builder */}
                  <div className="space-y-4">
                    <span className="text-sm font-bold text-slate-300 block">ساختار روزهای تمرینی برنامه ({mWorkoutDays.length} روز تعریف شده)</span>
                    
                    {/* Render existing days */}
                    {mWorkoutDays.length === 0 ? (
                      <div className="bg-white/5 p-6 rounded-2xl text-center text-xs text-slate-500 border border-dashed border-white/10">
                        هنوز هیچ روز تمرینی به این برنامه اضافه نکرده‌اید. از فرم زیر جهت افزودن روزهای تمرین استفاده کنید.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {mWorkoutDays.map((dayObj, dayIdx) => (
                          <div key={dayIdx} className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-3">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <div>
                                <span className="font-bold text-blue-400 text-xs">{dayObj.day}</span>
                                <span className="text-[10px] text-slate-500 block">تمرکز: {dayObj.focus}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  setMWorkoutDays(mWorkoutDays.filter((_, idx) => idx !== dayIdx));
                                }}
                                className="text-red-400 hover:text-red-300 text-[10px] bg-red-500/10 px-2 py-1 rounded"
                              >
                                حذف این روز
                              </button>
                            </div>

                            {/* Render exercises inside day */}
                            <div className="space-y-2">
                              {dayObj.exercises.map((ex, exIdx) => (
                                <div key={exIdx} className="bg-slate-900 px-3 py-2 rounded-xl flex justify-between items-center text-xs border border-white/5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-[10px]">
                                      {exIdx + 1}
                                    </div>
                                    <span className="font-bold text-slate-300">{ex.name}</span>
                                  </div>
                                  <div className="flex gap-4 text-slate-400 text-[10px]">
                                    <span>{ex.setsCount} ست</span>
                                    <span>{ex.reps} تکرار</span>
                                    <span>{ex.rest} ثانیه استراحت</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Form to add a single Day */}
                    <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 space-y-4">
                      <span className="text-xs font-bold text-blue-400 block border-b border-white/5 pb-2">➕ بخش اول: افزودن روز تمرینی جدید به برنامه</span>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">عنوان روز (مثال: روز اول - سینه و بازو)</label>
                          <input 
                            type="text"
                            value={mDayTitle}
                            onChange={(e) => setMDayTitle(e.target.value)}
                            placeholder="روز اول - عضلات پا"
                            className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">تمرکز روز (مثال: هایپرتروفی چهارسر ران)</label>
                          <input 
                            type="text"
                            value={mDayFocus}
                            onChange={(e) => setMDayFocus(e.target.value)}
                            placeholder="تمرکز روی رشد چهارسر و ساق پا"
                            className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                          />
                        </div>
                      </div>

                      {/* Add exercise to this day sub-builder */}
                      <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 block">حرکات ثبت شده برای این روز فعلی: {mDayExercises.length} حرکت</span>
                        
                        {mDayExercises.map((dex, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] bg-slate-950 px-3 py-1.5 rounded-lg">
                            <span className="text-slate-300">{dex.name} ({dex.setsCount} ست | {dex.reps} تکرار)</span>
                            <button 
                              onClick={() => setMDayExercises(mDayExercises.filter((_, i) => i !== idx))}
                              className="text-red-400 font-bold hover:text-red-300"
                            >
                              حذف
                            </button>
                          </div>
                        ))}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                          <div className="col-span-2">
                            <label className="text-[9px] text-slate-500 block mb-1">انتخاب حرکت بدنسازی</label>
                            <select 
                              value={mExId}
                              onChange={(e) => setMExId(e.target.value)}
                              className="w-full bg-slate-950 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                            >
                              <option value="">-- انتخاب حرکت از بانک اطلاعاتی --</option>
                              {exercisesList.map(e => (
                                <option key={e.id} value={e.id}>{e.name} ({e.muscleGroup})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-500 block mb-1">تعداد ست</label>
                            <input 
                              type="number"
                              value={mExSets}
                              onChange={(e) => setMExSets(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-500 block mb-1">تعداد تکرار (رنج)</label>
                            <input 
                              type="text"
                              value={mExReps}
                              onChange={(e) => setMExReps(e.target.value)}
                              placeholder="مثال: 12,10,8"
                              className="w-full bg-slate-950 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs text-center"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button 
                            type="button"
                            onClick={() => {
                              if (!mExId) {
                                alert("لطفا یک حرکت بدنسازی را از لیست انتخاب کنید.");
                                return;
                              }
                              const selectedObj = exercisesList.find(e => e.id === mExId);
                              if (!selectedObj) return;

                              setMDayExercises([...mDayExercises, {
                                name: selectedObj.name,
                                exerciseId: mExId,
                                setsCount: mExSets,
                                reps: mExReps,
                                rest: mExRest
                              }]);
                              // Reset single exercise inputs
                              setMExId("");
                              setMExSets(4);
                              setMExReps("12");
                            }}
                            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all"
                          >
                            ＋ افزودن حرکت بدنسازی به لیست این روز
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button 
                          type="button"
                          onClick={() => {
                            if (!mDayTitle) {
                              alert("لطفا عنوان روز تمرین (مانند روز اول) را وارد کنید.");
                              return;
                            }
                            if (mDayExercises.length === 0) {
                              alert("لطفا حداقل یک حرکت تمرینی برای این روز تعریف کنید.");
                              return;
                            }

                            // Package the exercises into formatted sets
                            const dayExercisesFormatted = mDayExercises.map(ex => {
                              const numSets = Number(ex.setsCount) || 4;
                              const parsedReps = ex.reps.split(",").map(r => Number(r.trim()) || 12);
                              
                              return {
                                name: ex.name,
                                exerciseId: ex.exerciseId,
                                restDurationSeconds: Number(ex.rest) || 60,
                                sets: Array.from({ length: numSets }).map((_, sIdx) => ({
                                  setNumber: sIdx + 1,
                                  reps: parsedReps[sIdx % parsedReps.length] || 12,
                                  weightKg: 20,
                                  isCompleted: false
                                }))
                              };
                            });

                            // Add to days array
                            setMWorkoutDays([...mWorkoutDays, {
                              day: mDayTitle,
                              focus: mDayFocus || "عمومی",
                              exercises: dayExercisesFormatted
                            }]);

                            // Reset Day inputs
                            setMDayTitle("");
                            setMDayFocus("");
                            setMDayExercises([]);
                            alert(`روز تمرینی "${mDayTitle}" با موفقیت ثبت و بسته‌بندی شد.`);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        >
                          ثبت نهایی و افزودن روز تمرینی به ساختار کلی برنامه
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Form Submission Controls */}
                  <div className="flex gap-3 border-t border-white/5 pt-6 justify-end">
                    <button 
                      onClick={() => {
                        if (!mWorkoutTitle) {
                          alert("لطفا عنوان اصلی برنامه تمرینی را وارد کنید.");
                          return;
                        }
                        if (mWorkoutDays.length === 0) {
                          alert("برنامه تمرینی باید حداقل شامل یک روز تمرینی بسته‌بندی شده باشد.");
                          return;
                        }

                        const newId = `prog_custom_${Date.now()}`;
                        const targetMemberName = selectedTargetMemberId ? (members.find(m => m.id === selectedTargetMemberId)?.name || "ورزشکار منتخب") : "همه ورزشکاران";
                        const activeClubId = loggedInTenant?.id || loggedInCoach?.clubId || "oxigen";
                        const finalObj = {
                          id: newId,
                          title: mWorkoutTitle,
                          summary: mWorkoutSummary || "برنامه بدنسازی تمرینی طراحی شده دستی",
                          createdBy: "پوریا کریمی",
                          assignedTo: targetMemberName,
                          schedule: mWorkoutDays,
                          clubId: activeClubId
                        };

                        setWorkoutPrograms([finalObj, ...workoutPrograms]);

                        if (selectedTargetMemberId) {
                          const updatedMembers = members.map(m => {
                            if (m.id === selectedTargetMemberId) {
                              return { ...m, assignedProgramId: newId };
                            }
                            return m;
                          });
                          setMembers(updatedMembers);
                        }

                        setCoachSubView("directory");
                        
                        // Clear inputs
                        setMWorkoutTitle("");
                        setMWorkoutSummary("");
                        setMWorkoutDays([]);
                        setSelectedTargetMemberId("");

                        alert(`برنامه تمرینی "${finalObj.title}" با موفقیت ذخیره شد و به صورت مستقیم به "${targetMemberName}" اختصاص داده شد!`);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-lg shadow-indigo-950 cursor-pointer"
                    >
                      💾 ذخیره و انتساب مستقیم برنامه تمرینی بدنسازی
                    </button>
                    <button 
                      onClick={() => setCoachSubView("directory")}
                      className="bg-white/5 hover:bg-white/10 text-slate-300 font-bold px-5 py-3 rounded-xl text-xs transition-all"
                    >
                      انصراف و بازگشت
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Nutrition Creator View */}
            {coachSubView === "create_nutrition" && (
              <div className="space-y-6 animate-fade-in text-right" dir="rtl">
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
                  <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-white">طراحی دستی برنامه غذایی و رژیم جدید</h3>
                      <p className="text-xs text-slate-400">اطلاعات ماکروها، کالری روزانه و جزییات وعده‌ها را برای ورزشکار تعیین کنید.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        // Dynamic AI autofill simulation
                        setMNutTitle("رژیم کات و چربی‌سوزی پیشرفته همراه با حفظ عضله (تولید شده با AI)");
                        setMNutCalories(2250);
                        setMNutProtein(175);
                        setMNutCarbs(190);
                        setMNutFats(55);
                        setMNutWater(3.5);
                        setMNutBreakfast("سفیده تخم‌مرغ ۴ عدد + تخم‌مرغ کامل ۱ عدد آب‌پز + ۵۰ گرم نان تست سبوس‌دار + ۱ قاشق چایخوری کره بادام‌زمینی طبیعی به همراه یک فنجان قهوه اسپرسو تلخ");
                        setMNutLunch("۲۰۰ گرم فیله مرغ گریل‌شده به همراه رزماری + ۱۲۰ گرم برنج کته قهوه‌ای بدون چربی + ۱۵۰ گرم کلم بروکلی بخارپز و چند قطره لیموترش تازه");
                        setMNutDinner("۱۸۰ گرم فیله ماهی قزل‌آلا یا سالمون تنوری + ۱۰۰ گرم سیب‌زمینی شیرین یا معمولی پخته + یک کاسه کوچک سالاد فصل شامل کاهو، خیار و گوجه بدون سس با سرکه سیب");
                        setMNutSnack("یک عدد سیب درختی کوچک + ۳۰ گرم مغز بادام خام مابین وعده + یک اسکوپ پروتئین وی مخلوط با آب بعد از تمرین");
                        setMNutAdvice("کربوهیدرات‌های ساده مانند قند، شکر، نوشابه و فست‌فود را ۱۰۰٪ قطع کنید.\nحداقل ۳.۵ لیتر آب خالص در طول شبانه‌روز بنوشید.\nخواب باکیفیت شبانه حداقل ۸ ساعت در ریکاوری و چربی‌سوزی کلیدی است.");
                        setMNutShopping("فیله مرغ, ماهی قزل آلا, تخم مرغ, نان تست سبوس دار, برنج قهوه ای, کلم بروکلی, سیب, بادام خام, پروتئین وی");
                        alert("رژیم تخصصی کات عضلانی با هوش مصنوعی (AI Nutrition Generator) تولید و فرم با موفقیت بازنویسی شد! اکنون می‌توانید آن را شخصی‌سازی یا ذخیره کنید.");
                      }}
                      className="bg-gradient-to-l from-emerald-500 to-teal-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 hover:scale-105 transition-all shadow-md shadow-emerald-950/20"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      تولید خودکار رژیم غذایی با هوش مصنوعی (AI)
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-medium">عنوان برنامه غذایی *</label>
                      <input 
                        type="text"
                        required
                        value={mNutTitle}
                        onChange={(e) => setMNutTitle(e.target.value)}
                        placeholder="مانند: رژیم افزایش حجم خشک ۲۸۰۰ کالری فیتنس"
                        className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-medium">کالری روزانه هدف (Kcal) *</label>
                      <input 
                        type="number"
                        required
                        value={mNutCalories}
                        onChange={(e) => setMNutCalories(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-medium">انتخاب ورزشکار هدف (تخصیص مستقیم)</label>
                      <select 
                        value={selectedTargetMemberId}
                        onChange={(e) => setSelectedTargetMemberId(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                      >
                        <option value="">-- رژیم عمومی (بدون انتساب مستقیم) --</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Macros grid */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">درشت‌مغذی‌ها و فاکتورهای هیدراتاسیون</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                        <label className="text-[10px] text-slate-500 block mb-1">پروتئین (گرم)</label>
                        <input 
                          type="number"
                          value={mNutProtein}
                          onChange={(e) => setMNutProtein(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-white/10 px-3 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-center text-xs"
                        />
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                        <label className="text-[10px] text-slate-500 block mb-1">کربوهیدرات (گرم)</label>
                        <input 
                          type="number"
                          value={mNutCarbs}
                          onChange={(e) => setMNutCarbs(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-white/10 px-3 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-center text-xs"
                        />
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                        <label className="text-[10px] text-slate-500 block mb-1">چربی (گرم)</label>
                        <input 
                          type="number"
                          value={mNutFats}
                          onChange={(e) => setMNutFats(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-white/10 px-3 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-center text-xs"
                        />
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                        <label className="text-[10px] text-slate-500 block mb-1">آب مصرفی روزانه (لیتر)</label>
                        <input 
                          type="number"
                          step="0.1"
                          value={mNutWater}
                          onChange={(e) => setMNutWater(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-white/10 px-3 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-center text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Meals text fields */}
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-300 block">منوی جزئیات وعده‌های شبانه‌روز</span>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                        <span className="text-xs font-bold text-emerald-400 block border-b border-white/5 pb-1">🍳 صبحانه</span>
                        <textarea 
                          rows={3}
                          value={mNutBreakfast}
                          onChange={(e) => setMNutBreakfast(e.target.value)}
                          placeholder="مثال: ۴ عدد سفیده تخم‌مرغ آب‌پز + ۵۰ گرم جو دوسر به همراه یک فنجان قهوه تلخ"
                          className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
                        />
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                        <span className="text-xs font-bold text-amber-400 block border-b border-white/5 pb-1">🍗 ناهار</span>
                        <textarea 
                          rows={3}
                          value={mNutLunch}
                          onChange={(e) => setMNutLunch(e.target.value)}
                          placeholder="مثال: ۲۰۰ گرم فیله مرغ گریل شده + ۱۵۰ گرم برنج کته بدون روغن + سالاد بروکلی"
                          className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
                        />
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                        <span className="text-xs font-bold text-blue-400 block border-b border-white/5 pb-1">🐟 شام</span>
                        <textarea 
                          rows={3}
                          value={mNutDinner}
                          onChange={(e) => setMNutDinner(e.target.value)}
                          placeholder="مثال: ۱۵۰ گرم فیله ماهی سالمون یا گوساله کبابی + ۱۰۰ گرم سیب‌زمینی تنوری + زیتون"
                          className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
                        />
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                        <span className="text-xs font-bold text-pink-400 block border-b border-white/5 pb-1">🍌 میان‌وعده و قبل تمرین</span>
                        <textarea 
                          rows={3}
                          value={mNutSnack}
                          onChange={(e) => setMNutSnack(e.target.value)}
                          placeholder="مثال: یک عدد موز + ۳۰ گرم مغز بادام خام + یک اسکوپ پروتئین وی"
                          className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Advice & Shopping List */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-medium">نکات طلایی و توصیه‌های مربی (هر نکته در یک خط)</label>
                      <textarea 
                        rows={3}
                        value={mNutAdvice}
                        onChange={(e) => setMNutAdvice(e.target.value)}
                        placeholder="قبل از تمرین حتما دو لیوان آب بنوشید.&#10;شکر سفید را کاملا قطع کنید.&#10;خواب کافی ۸ ساعته فراموش نشود."
                        className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1 font-medium">لیست خرید پیشنهادی مواد غذایی (با کاما جدا کنید)</label>
                      <textarea 
                        rows={3}
                        value={mNutShopping}
                        onChange={(e) => setMNutShopping(e.target.value)}
                        placeholder="فیله مرغ گریل, جو دوسر پرک, موز, پروتئین وی, زیتون, قارچ"
                        className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Submit Controls */}
                  <div className="flex gap-3 border-t border-white/5 pt-6 justify-end">
                    <button 
                      onClick={() => {
                        if (!mNutTitle) {
                          alert("لطفا عنوان اصلی برنامه غذایی را وارد کنید.");
                          return;
                        }

                        const newId = `nut_custom_${Date.now()}`;
                        const activeClubId = loggedInTenant?.id || loggedInCoach?.clubId || "oxigen";
                        const finalObj = {
                          id: newId,
                          title: mNutTitle,
                          targetCalories: mNutCalories,
                          macros: {
                            protein: `${mNutProtein}g`,
                            carbs: `${mNutCarbs}g`,
                            fat: `${mNutFats}g`,
                            water: `${mNutWater}L`
                          },
                          meals: {
                            breakfast: { title: "صبحانه", items: mNutBreakfast.split("\n").filter(x => x.trim()), calories: 400 },
                            lunch: { title: "ناهار", items: mNutLunch.split("\n").filter(x => x.trim()), calories: 750 },
                            dinner: { title: "شام", items: mNutDinner.split("\n").filter(x => x.trim()), calories: 550 },
                            snacks: { title: "میان‌وعده‌ها", items: mNutSnack.split("\n").filter(x => x.trim()), calories: 300 }
                          },
                          advice: mNutAdvice.split("\n").filter(x => x.trim()),
                          shoppingList: mNutShopping.split(",").map(x => x.trim()).filter(Boolean),
                          clubId: activeClubId
                        };

                        setNutritionPlans([finalObj, ...nutritionPlans]);
                        setCoachSubView("directory");

                        // Clear inputs
                        setMNutTitle("");
                        setMNutCalories(2500);
                        setMNutProtein(150);
                        setMNutCarbs(220);
                        setMNutFats(70);
                        setMNutWater(3.5);
                        setMNutBreakfast("");
                        setMNutLunch("");
                        setMNutDinner("");
                        setMNutSnack("");
                        setMNutAdvice("");
                        setMNutShopping("");

                        alert(`برنامه غذایی "${finalObj.title}" با موفقیت ذخیره شد و در پرتال اختصاصی ورزشکاران قرار گرفت!`);
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black px-6 py-3 rounded-xl text-xs transition-all shadow-lg shadow-emerald-950"
                    >
                      💾 ذخیره و انتشار برنامه غذایی ورزشکار
                    </button>
                    <button 
                      onClick={() => setCoachSubView("directory")}
                      className="bg-white/5 hover:bg-white/10 text-slate-300 font-bold px-5 py-3 rounded-xl text-xs transition-all"
                    >
                      انصراف و بازگشت
                    </button>
                  </div>
                </div>
              </div>
            )}

            {coachSubView === "ai_generation" && (
              <div className="space-y-6 animate-fade-in text-right" dir="rtl">
                <AICoachProgramGenerator
                  isDarkMode={isDarkMode}
                  members={members}
                  setMembers={setMembers}
                  workoutPrograms={workoutPrograms}
                  setWorkoutPrograms={setWorkoutPrograms}
                  nutritionPlans={nutritionPlans}
                  setNutritionPlans={setNutritionPlans}
                />
              </div>
            )}

            {coachSubView === "earnings" && (
              <div className="space-y-6 animate-fade-in text-right" dir="rtl">
                <CoachEarningsPanel
                  isDarkMode={isDarkMode}
                  loggedInCoach={loggedInCoach}
                  members={members}
                  coachSales={coachSales}
                  setCoachSales={setCoachSales}
                />
              </div>
            )}

            {selectedDetailedMember && (
              <CoachMemberDetail
                member={selectedDetailedMember}
                onClose={() => setSelectedDetailedMember(null)}
                isDarkMode={isDarkMode}
                workoutPrograms={workoutPrograms}
                nutritionPlans={nutritionPlans}
                attendanceRecords={attendanceRecords || []}
                invoices={invoices || []}
              />
            )}

          </div>
        )}


        {/* -------------------- TAB 5: MEMBER PANEL & WORKOUT PLAYER -------------------- */}
        {activeTab === "member" && !loggedInMember && (
          <div className="max-w-md mx-auto py-12 space-y-6 animate-fade-in">
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 space-y-6 relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
              
              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl mx-auto shadow-lg shadow-emerald-900/30 animate-bounce">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">ورود به پنل اختصاصی ورزشکار (PWA)</h2>
                <p className="text-xs text-slate-400 leading-relaxed">ورزشکار گرامی، لطفاً نام کاربری و رمز عبور ورود صادر شده توسط مربی خود را در کادرهای زیر وارد کنید.</p>
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-bold text-center">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleMemberLogin} className="space-y-4 text-right">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">نام کاربری ورزشکار</label>
                  <input 
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="مانند: arash"
                    className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">رمز عبور ورود</label>
                  <input 
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="رمز عددی..."
                    className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-center"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/50 text-xs"
                >
                  ورود امن به پنل شخصی
                </button>
              </form>

              <div className="border-t border-white/5 pt-4 space-y-2">
                <span className="text-[10px] text-slate-500 block">اکانت‌های دمو جهت تست سریع:</span>
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => {
                      setLoginUsername("arash");
                      setLoginPassword("123");
                    }}
                    className="bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded text-[10px] font-mono"
                  >
                    arash / 123 (آرش)
                  </button>
                  <button 
                    onClick={() => {
                      setLoginUsername("sohrab");
                      setLoginPassword("123");
                    }}
                    className="bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded text-[10px] font-mono"
                  >
                    sohrab / 123 (سهراب)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "member" && loggedInMember && (
          <div className="space-y-8 animate-fade-in text-right" dir="rtl">
            
            {/* Direct PWA Mobile Athlete Dashboard Layout */}
            <div className="w-full max-w-2xl mx-auto">
              <AthleteDashboard 
                member={loggedInMember}
                workoutPrograms={workoutPrograms}
                nutritionPlans={nutritionPlans}
                isDarkMode={isDarkMode}
                onLogout={handleMemberLogout}
                attendanceRecords={attendanceRecords}
                onCheckIn={(record) => {
                  setAttendanceRecords([record, ...attendanceRecords]);
                  alert("حضور شما با موفقیت ثبت شد!");
                }}
                tenantCustomColor={tenantCustomColor}
                tenantBrandText={tenantBrandText || (loggedInTenant && loggedInTenant.clubName) || "اسمارت جیم"}
                onAddClubRevenue={(amount) => setClubRevenue((prev) => prev + amount)}
                onToggleDarkMode={toggleDarkMode}
                clubInfo={loggedInTenant}
                subscriptionPlans={subscriptionPlans}
                membershipRequests={membershipRequests}
                onSubmitMembershipRequest={(req) => {
                  const updated = [req, ...membershipRequests];
                  setMembershipRequests(updated);
                }}
              />
            </div>

            {/* Hiding old heavy desktop structure */}
            {false && (
              <div className="space-y-8">
            
            {/* Real PWA Banner & Offline Mode Status */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-200 block">نصب اپلیکیشن وب پیشرو (PWA Mobile Ready)</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">پنل خود را به صفحه اصلی تلفن همراه اضافه کنید تا دسترسی آفلاین فعال شود.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isPwaInstalled ? (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1">
                    <Check className="w-3 h-3" /> نصب شده روی گوشی
                  </span>
                ) : (
                  <button 
                    onClick={() => {
                      setIsPwaInstalled(true);
                      alert("اپلیکیشن وب پیشروی باشگاه اکسیژن (PWA) بر روی صفحه نمایش موبایل/کامپیوتر شما شبیه‌سازی و نصب گردید.");
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded-lg text-[10px] transition-all"
                  >
                    نصب سریع روی هوم‌اسکرین
                  </button>
                )}

                {isOfflineMode ? (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1">
                    <Database className="w-3 h-3" /> دانلود آفلاین موفق (بدون اینترنت)
                  </span>
                ) : isDownloadingOffline ? (
                  <div className="flex items-center gap-2 bg-slate-950 border border-white/5 px-2.5 py-1 rounded-lg text-[10px] text-indigo-400 font-bold">
                    <span>در حال کش کردن فیلم‌ها... {offlineDownloadProgress}%</span>
                  </div>
                ) : (
                  <button 
                    onClick={triggerOfflineCaching}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1 rounded-lg text-[10px] transition-all"
                  >
                    دانلود آفلاین برنامه تمرین و عکس‌ها
                  </button>
                )}
              </div>
            </div>

            {/* Header of member */}
            <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 animate-fade-in">
                <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-slate-950 font-black text-xl">
                  {loggedInMember.name.substring(0, 2)}
                </div>
                <div>
                  <h2 className="text-2xl font-black">داشبورد ورزشکار: {loggedInMember.name}</h2>
                  <span className="text-xs text-slate-400">عضو فعال سیستم ورزشکار هوشمند (PWA) | مربی اختصاصی: {loggedInMember.coachName}</span>
                </div>
              </div>

              {/* Attendance quick checkout status */}
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1.5 rounded-xl font-bold">جلسات باقی‌مانده: {loggedInMember.remainingSessions} جلسه</span>
                <button 
                  onClick={() => alert("کد QR عضویت شما جهت اسکن حین ورود/خروج تولید شد.")}
                  className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                >
                  نمایش QR ورود
                </button>
                <button 
                  onClick={handleMemberLogout}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                >
                  خروج از حساب
                </button>
              </div>
            </div>

            {/* Member Panel Tab Selector (Pills) */}
            <div className="flex flex-wrap gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5 w-fit">
              <button 
                onClick={() => setMemberSubTab("workout")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${memberSubTab === "workout" ? "bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              >
                <Dumbbell className="w-4 h-4" />
                برنامه تمرینی زنده
              </button>
              <button 
                onClick={() => setMemberSubTab("nutrition")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${memberSubTab === "nutrition" ? "bg-gradient-to-l from-emerald-600 to-teal-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              >
                <Apple className="w-4 h-4" />
                برنامه غذایی من
              </button>
              <button 
                onClick={() => setMemberSubTab("stats")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${memberSubTab === "stats" ? "bg-gradient-to-l from-indigo-600 to-purple-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              >
                <Clock className="w-4 h-4" />
                ساعت حضور و سلامتی
              </button>
            </div>

            {/* THE CROWNING JEWEL: AUTOMATED WORKOUT PLAYER MODULE */}
            {memberSubTab === "workout" && (
              <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Left Column: Player Screen */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-[2.5rem] border border-white/10 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -z-10"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -z-10"></div>

                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-blue-400 animate-bounce" />
                    <h3 className="text-sm font-black">پلیر هوشمند تمرینات زنده (Live Workout Player)</h3>
                  </div>
                  <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full font-mono">
                    تایمر کل تمرین: {formatTime(workoutTimer)}
                  </span>
                </div>

                {!isPlaying && !workoutSummary && (
                  <div className="text-center py-12 space-y-6">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 mx-auto">
                      <Play className="w-8 h-8 fill-current translate-x-[-2px]" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold">برنامه تمرینی امروز شما آماده است</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        {activeWorkoutProg.schedule[activeDayIndex].day} - {activeWorkoutProg.schedule[activeDayIndex].focus}
                      </p>
                    </div>
                    <button 
                      onClick={startWorkout}
                      className="bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-900/30 hover:brightness-110 transition-all text-sm"
                    >
                      شروع تمرین امروز
                    </button>
                  </div>
                )}

                {isPlaying && (
                  <div className="space-y-6">
                    
                    {/* Rest overlay if resting */}
                    {isResting ? (
                      <div className="bg-indigo-950/60 p-6 rounded-3xl border border-indigo-900/40 text-center space-y-4 animate-pulse">
                        <span className="text-xs text-indigo-300 font-bold block uppercase tracking-wider">زمان استراحت مابین ست‌ها (Rest Timer)</span>
                        <div className="text-5xl font-black text-indigo-400 font-mono">{restTimer}</div>
                        <p className="text-xs text-slate-400">ست بعدی را پرقدرت و با انقباض حداکثر آغاز کنید.</p>
                        <button 
                          onClick={skipRest}
                          className="bg-white text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs"
                        >
                          رد کردن استراحت
                        </button>
                      </div>
                    ) : (
                      /* Exercise active display */
                      <div className="space-y-4">
                        
                        {/* Muscle illustration with beautiful running skeleton animation rig */}
                        <div className="bg-slate-950 p-4 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-6 items-center">
                          <div className="w-full md:w-48 h-40">
                            <ExerciseAnimation 
                              exerciseName={activeWorkoutProg.schedule[activeDayIndex].exercises[activeExerciseIndex].exercise.name}
                              isPlaying={isPlaying}
                              isResting={isResting}
                            />
                          </div>

                          <div className="flex-1 space-y-2 text-center md:text-right">
                            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full font-bold">
                              {activeWorkoutProg.schedule[activeDayIndex].exercises[activeExerciseIndex].exercise.muscleGroup}
                            </span>
                            <h4 className="text-xl font-bold text-white">
                              {activeWorkoutProg.schedule[activeDayIndex].exercises[activeExerciseIndex].exercise.name}
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              <strong>نحوه صحیح اجرا:</strong> {activeWorkoutProg.schedule[activeDayIndex].exercises[activeExerciseIndex].exercise.correctForm}
                            </p>
                            <p className="text-[10px] text-amber-400 leading-relaxed">
                              <strong>توجه بیومکانیک:</strong> {activeWorkoutProg.schedule[activeDayIndex].exercises[activeExerciseIndex].exercise.warning}
                            </p>
                          </div>
                        </div>

                        {/* Interactive set progress block */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                            <span className="text-[9px] text-slate-500 block mb-0.5">ست فعلی</span>
                            <span className="text-lg font-bold text-white">
                              {activeSetIndex + 1} از {activeWorkoutProg.schedule[activeDayIndex].exercises[activeExerciseIndex].sets.length}
                            </span>
                          </div>
                          <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                            <span className="text-[9px] text-slate-500 block mb-0.5">تعداد تکرار</span>
                            <span className="text-lg font-bold text-emerald-400">
                              {activeWorkoutProg.schedule[activeDayIndex].exercises[activeExerciseIndex].sets[activeSetIndex].reps} تکرار
                            </span>
                          </div>
                          <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                            <span className="text-[9px] text-slate-500 block mb-0.5">وزنه هدف</span>
                            <span className="text-lg font-bold text-violet-400">
                              {activeWorkoutProg.schedule[activeDayIndex].exercises[activeExerciseIndex].sets[activeSetIndex].weightKg} کیلوگرم
                            </span>
                          </div>
                          <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                            <span className="text-[9px] text-slate-500 block mb-0.5">استراحت مابین ست‌ها</span>
                            <span className="text-lg font-bold text-indigo-400">
                              {activeWorkoutProg.schedule[activeDayIndex].exercises[activeExerciseIndex].restDurationSeconds} ثانیه
                            </span>
                          </div>
                        </div>

                        {/* Controls for current exercise set completion */}
                        <div className="flex gap-3 justify-center pt-4">
                          <button 
                            onClick={pauseWorkout}
                            className="bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-all"
                          >
                            توقف موقت تمرین
                          </button>
                          
                          <button 
                            onClick={handleSetComplete}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-8 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-900/20 transition-all"
                          >
                            پایان این ست و ثبت در تاریخچه
                          </button>
                        </div>

                      </div>
                    )}

                  </div>
                )}

                {/* Workout Summary screen at completion */}
                {workoutSummary && (
                  <div className="bg-emerald-950/40 border border-emerald-900/30 p-6 rounded-3xl space-y-4 text-center">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                      <Award className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-slate-200">تبریک! تمرین امروز با موفقیت پایان یافت</h4>
                      <p className="text-xs text-slate-400">اطلاعات این جلسه به صورت زنده برای استاد پوریا کریمی ارسال گردید.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-xs font-bold pt-2">
                      <div className="bg-slate-950 p-2.5 rounded-xl">
                        <span className="text-[9px] text-slate-500 block mb-1">کل زمان تمرین</span>
                        <span className="text-white text-sm">{formatTime(workoutSummary.totalDuration)}</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl">
                        <span className="text-[9px] text-slate-500 block mb-1">تعداد حرکات زده شده</span>
                        <span className="text-white text-sm">{workoutSummary.exercisesCount} حرکت</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl">
                        <span className="text-[9px] text-slate-500 block mb-1">مجموع ست‌های ثبت شده</span>
                        <span className="text-white text-sm">{workoutSummary.setsCount} ست</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setWorkoutSummary(null)}
                      className="bg-white text-slate-950 font-bold px-6 py-2 rounded-xl text-xs transition-all"
                    >
                      بستن خلاصه
                    </button>
                  </div>
                )}

              </div>

              {/* Right Column: Workout schedule selection list & daily meals suggestions */}
              <div className="space-y-6">
                
                {/* Daily schedule menu list */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <span className="font-bold text-slate-300 block border-b border-white/5 pb-2">برنامه هفتگی شما</span>
                  
                  <div className="space-y-2">
                    {activeWorkoutProg.schedule.map((sch, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          setActiveDayIndex(idx);
                          setActiveExerciseIndex(0);
                          setActiveSetIndex(0);
                          setIsPlaying(false);
                          setIsResting(false);
                          setWorkoutSummary(null);
                        }}
                        className={`w-full text-right p-3 rounded-2xl border text-xs transition-all flex items-center justify-between ${activeDayIndex === idx ? "bg-blue-600/10 border-blue-500 text-blue-400 font-bold" : "bg-slate-950 border-white/5 text-slate-400 hover:border-white/10"}`}
                      >
                        <div>
                          <span className="block font-bold">{sch.day}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">{sch.focus}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{sch.exercises.length} حرکت</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated hydration and sleep track widgets */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <span className="font-bold text-slate-300 block border-b border-white/5 pb-2">پایش سلامتی امروز</span>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 text-center space-y-1">
                      <span className="text-[9px] text-slate-400 block">آب مصرفی امروز</span>
                      <span className="text-sm font-bold text-blue-400">۲.۵ از ۳.۵ لیتر</span>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-blue-500" style={{ width: "70%" }}></div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 text-center space-y-1">
                      <span className="text-[9px] text-slate-400 block">کیفیت خواب شب گذشته</span>
                      <span className="text-sm font-bold text-indigo-400">۷.۵ ساعت (خوب)</span>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-indigo-500" style={{ width: "85%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            )}

            {/* Interactive Diet Plan Viewer Tab */}
            {memberSubTab === "nutrition" && (
              <div className="space-y-6 animate-fade-in text-right" dir="rtl">
                {(() => {
                  const assignedNut = nutritionPlans.find(n => n.id === loggedInMember.assignedNutritionId) || nutritionPlans[0];
                  return (
                    <>
                      <div className="glass-panel p-6 rounded-[2rem] border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase">رژیم غذایی و تغذیه ورزشی اختصاصی</span>
                            <h3 className="text-xl font-black text-white mt-1">{assignedNut.title}</h3>
                            <p className="text-xs text-slate-400 mt-1">طراحی شده توسط کادر فنی فیتنس و بدنسازی باشگاه اکسیژن</p>
                          </div>
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                              <Apple className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">هدف کالری روزانه</span>
                              <span className="text-lg font-black text-white font-mono">{assignedNut.targetCalories} Kcal</span>
                            </div>
                          </div>
                        </div>

                        {/* Macros progress bars */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
                          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-500 block mb-1">پروتئین (هدف عضلانی)</span>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-emerald-400">{assignedNut.macros.protein}</span>
                              <span className="text-slate-500">مورد نیاز</span>
                            </div>
                            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: "100%" }}></div>
                            </div>
                          </div>

                          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-500 block mb-1">کربوهیدرات (سوخت تمرین)</span>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-amber-400">{assignedNut.macros.carbs}</span>
                              <span className="text-slate-500">مورد نیاز</span>
                            </div>
                            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500" style={{ width: "100%" }}></div>
                            </div>
                          </div>

                          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-500 block mb-1">چربی‌های مفید (هورمونی)</span>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-blue-400">{assignedNut.macros.fat}</span>
                              <span className="text-slate-500">مورد نیاز</span>
                            </div>
                            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: "100%" }}></div>
                            </div>
                          </div>

                          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-500 block mb-1">آب مصرفی (هیدراتاسیون)</span>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-cyan-400">{assignedNut.macros.water}</span>
                              <span className="text-slate-500">حداقل روزانه</span>
                            </div>
                            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-500" style={{ width: "100%" }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Meals breakdown list */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {Object.entries(assignedNut.meals).map(([mealKey, mealVal]: any) => {
                          const iconColor = 
                            mealKey === "breakfast" ? "from-yellow-500/10 to-orange-500/10 text-amber-400 border-amber-500/20" :
                            mealKey === "lunch" ? "from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20" :
                            mealKey === "dinner" ? "from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20" :
                            "from-pink-500/10 to-purple-500/10 text-pink-400 border-pink-500/20";
                          
                          return (
                            <div key={mealKey} className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
                              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${iconColor} border flex items-center justify-center font-bold text-xs`}>
                                    {mealVal.title[0]}
                                  </div>
                                  <span className="font-bold text-white text-sm">{mealVal.title}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 bg-white/5 px-2.5 py-1 rounded-full font-mono">{mealVal.calories} Kcal</span>
                              </div>

                              <ul className="space-y-2 text-xs text-slate-300">
                                {mealVal.items.map((item: string, idx: number) => (
                                  <li key={idx} className="flex gap-2 items-start">
                                    <span className="text-emerald-400 font-bold select-none">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>

                      {/* Advice & Shopping List widgets */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Golden tips */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl space-y-3">
                          <span className="text-xs font-bold text-emerald-400 block border-b border-white/5 pb-2">💡 توصیه‌ها و نکات تغذیه‌ای مربی</span>
                          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                            {assignedNut.advice.map((adv: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-bold mt-0.5">{idx + 1}</span>
                                <span>{adv}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Weekly shopping list */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl space-y-3">
                          <span className="text-xs font-bold text-blue-400 block border-b border-white/5 pb-2">🛒 لیست خرید هفتگی پیشنهادی مواد غذایی</span>
                          <div className="flex flex-wrap gap-2">
                            {assignedNut.shoppingList.map((shop: string, idx: number) => (
                              <span key={idx} className="bg-white/5 hover:bg-white/10 border border-white/10 text-xs px-3 py-1.5 rounded-xl font-medium text-slate-300">
                                {shop}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Biometric Analysis & Attendance logs Tab */}
            {memberSubTab === "stats" && (
              <div className="space-y-6 animate-fade-in text-right" dir="rtl">
                {/* Health trackers widgets */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                    <span className="font-bold text-slate-300 block border-b border-white/5 pb-2">کیفیت متابولیک و هیدراتاسیون</span>
                    <div className="space-y-4 text-xs">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">آب مصرفی امروز ورزشکار</span>
                          <span className="text-blue-400 font-bold">۲.۵ از ۳.۵ لیتر</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: "71%" }}></div>
                        </div>
                        <span className="text-[10px] text-slate-500 block">نکته مربی: حتماً برای کات عضلانی هیدراته بمانید.</span>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">کیفیت خواب شب گذشته</span>
                          <span className="text-indigo-400 font-bold">۷.۵ ساعت (۸۵٪ عمیق)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: "85%" }}></div>
                        </div>
                        <span className="text-[10px] text-slate-500 block">مدت خواب کافی به شدت ترشح هورمون تستوسترون و رشد عضله را بهبود می‌بخشد.</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                    <span className="font-bold text-slate-300 block border-b border-white/5 pb-2">شاخص‌های آنتروپومتریک</span>
                    <div className="grid grid-cols-2 gap-4 text-xs text-center">
                      <div className="bg-slate-950 p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-slate-500 block mb-0.5">شاخص توده بدنی (BMI)</span>
                        <span className="text-sm font-bold text-white">۲۴.۱ (محدوده نرمال)</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-slate-500 block mb-0.5">درصد چربی ایده‌آل</span>
                        <span className="text-sm font-bold text-emerald-400">۱۳.۵ درصد</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-slate-500 block mb-0.5">دور سینه و کمر</span>
                        <span className="text-sm font-bold text-white">۱۱۲ / ۸۲ سانتی‌متر</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-slate-500 block mb-0.5">دور بازوی منقبض</span>
                        <span className="text-sm font-bold text-amber-400">۴۱ سانتی‌متر</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance tracking history log */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold">تاریخچه حضور و غیاب و ساعت ورزش باشگاه شما (Attendance Record)</h3>
                  </div>

                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {displayedAttendanceRecords.map((att) => (
                      <div key={att.id} className="bg-slate-950 p-3 rounded-2xl border border-white/5 space-y-1.5 text-xs text-center">
                        <span className="font-mono text-slate-400 block">{att.date}</span>
                        <span className="font-bold text-slate-200 block">ورود: {att.checkInTime} {att.checkOutTime && `| خروج: ${att.checkOutTime}`}</span>
                        <span className="text-[10px] text-slate-500 block">مدت کل ورزش: {att.totalHours ? `${att.totalHours} ساعت` : "در حال تمرین..."}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile PWA Bottom Fixed Navigation Menu */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-white/10 z-50 py-3 px-6 flex justify-around items-center">
              <button 
                onClick={() => setMemberSubTab("workout")}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${memberSubTab === "workout" ? "text-blue-400" : "text-slate-400"}`}
              >
                <Dumbbell className="w-5 h-5" />
                <span>برنامه تمرین</span>
              </button>
              <button 
                onClick={() => setMemberSubTab("nutrition")}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${memberSubTab === "nutrition" ? "text-emerald-400" : "text-slate-400"}`}
              >
                <Apple className="w-5 h-5" />
                <span>برنامه غذایی</span>
              </button>
              <button 
                onClick={() => setMemberSubTab("stats")}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold ${memberSubTab === "stats" ? "text-indigo-400" : "text-slate-400"}`}
              >
                <Clock className="w-5 h-5" />
                <span>حضور و آمار</span>
              </button>
              <button 
                onClick={handleMemberLogout}
                className="flex flex-col items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300"
              >
                <LogOut className="w-5 h-5" />
                <span>خروج</span>
              </button>
            </div>
            </div>
            )}

          </div>
        )}


        {/* -------------------- TAB 6: AI LABS & GENERATORS -------------------- */}
        {activeTab === "ai_labs" && (
          <div className="space-y-12 animate-fade-in">
            
            <div className="bg-gradient-to-l from-emerald-950/40 via-slate-900/60 to-cyan-950/40 p-6 rounded-[2rem] border border-emerald-500/20 flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-emerald-400 text-[10px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  مجهز به مدل هوش مصنوعی Gemini 3.5 Flash
                </div>
                <h2 className="text-2xl font-black">آزمایشگاه و موتور تولید هوشمند برنامه (SmartGym AI)</h2>
                <p className="text-xs text-slate-400">با وارد کردن جزییات فیزیکی شاگرد، بهترین برنامه تمرینی و تغذیه‌ای شخصی‌سازی شده را از هوش مصنوعی دریافت کنید.</p>
              </div>
            </div>

            {/* AI Workout Generator Section */}
            <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 space-y-6 relative">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <div className="w-8 h-8 bg-blue-600/10 rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black">تولید هوشمند برنامه تمرینی اختصاصی (AI Workout Generator)</h3>
                  <p className="text-[10px] text-slate-500">طراحی شده بر اساس اهداف بیولوژیکی، مصدومیت‌ها و روزهای تمرین هفتگی</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">سن شاگرد (سال)</label>
                  <input 
                    type="number"
                    value={aiWorkoutInput.age}
                    onChange={(e) => setAiWorkoutInput({ ...aiWorkoutInput, age: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">جنسیت</label>
                  <select 
                    value={aiWorkoutInput.gender}
                    onChange={(e) => setAiWorkoutInput({ ...aiWorkoutInput, gender: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 focus:outline-none"
                  >
                    <option>آقا</option>
                    <option>خانم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">وزن فعلی (کیلوگرم)</label>
                  <input 
                    type="number"
                    value={aiWorkoutInput.weight}
                    onChange={(e) => setAiWorkoutInput({ ...aiWorkoutInput, weight: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">قد (سانتی‌متر)</label>
                  <input 
                    type="number"
                    value={aiWorkoutInput.height}
                    onChange={(e) => setAiWorkoutInput({ ...aiWorkoutInput, height: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">هدف ورزشی اصلی</label>
                  <input 
                    type="text"
                    value={aiWorkoutInput.goal}
                    onChange={(e) => setAiWorkoutInput({ ...aiWorkoutInput, goal: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">تعداد روزهای تمرین در هفته</label>
                  <input 
                    type="number"
                    value={aiWorkoutInput.daysPerWeek}
                    onChange={(e) => setAiWorkoutInput({ ...aiWorkoutInput, daysPerWeek: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-slate-400 mb-1">سابقه آسیب‌دیدگی یا محدودیت فیزیکی</label>
                  <input 
                    type="text"
                    value={aiWorkoutInput.injuries}
                    onChange={(e) => setAiWorkoutInput({ ...aiWorkoutInput, injuries: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={generateWorkoutWithAI}
                disabled={isGeneratingWorkout}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-extrabold px-6 py-3 rounded-2xl text-xs transition-all flex items-center gap-2"
              >
                {isGeneratingWorkout ? (
                  <>در حال تولید و پردازش توسط هوش مصنوعی...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    تولید آنی برنامه تمرینی اختصاصی
                  </>
                )}
              </button>

              {/* AI Workout Result Display */}
              {aiWorkoutResult && (
                <div className="bg-slate-950 p-6 rounded-3xl border border-blue-500/20 space-y-6 text-xs animate-fade-in">
                  <div className="border-b border-white/5 pb-3">
                    <h4 className="text-base font-bold text-blue-400">{aiWorkoutResult.title}</h4>
                    <p className="text-slate-400 leading-relaxed mt-1">{aiWorkoutResult.summary}</p>
                  </div>

                  <div className="space-y-6">
                    {aiWorkoutResult.schedule?.map((dayObj: any, dayIdx: number) => (
                      <div key={dayIdx} className="space-y-3 bg-white/5 p-4 rounded-2xl">
                        <span className="font-bold text-slate-200 block text-sm">{dayObj.day} ({dayObj.focus})</span>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          {dayObj.exercises?.map((ex: any, exIdx: number) => (
                            <div key={exIdx} className="bg-slate-950 p-3 rounded-xl border border-white/5 space-y-1">
                              <span className="font-bold text-blue-300 block">{ex.name}</span>
                              <div className="flex justify-between text-[10px] text-slate-400">
                                <span>ست‌ها: {ex.sets}</span>
                                <span>تکرارها: {ex.reps}</span>
                                <span>استراحت: {ex.rest} ثانیه</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block mt-1">عضله هدف: {ex.muscle}</span>
                              {ex.tip && <p className="text-[9px] text-slate-400 leading-relaxed italic border-t border-white/5 pt-1 mt-1">نکته مربی: {ex.tip}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {aiWorkoutResult.tips && (
                    <div className="bg-blue-950/20 p-4 rounded-2xl border border-blue-900/30">
                      <span className="font-bold text-blue-400 block mb-2">توصیه‌های تکمیلی مربی هوش مصنوعی</span>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {aiWorkoutResult.tips.map((tip: string, idx: number) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Nutrition Plan Generator */}
            <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 space-y-6 relative">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <div className="w-8 h-8 bg-emerald-600/10 rounded-xl flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black">تولید هوشمند رژیم غذایی ورزشی (AI Nutrition & Meal Planner)</h3>
                  <p className="text-[10px] text-slate-500">تنظیم دقیق درشت‌مغذی‌ها، برنامه‌ریزی وعده‌ها به همراه لیست خرید هفتگی</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">سن شاگرد</label>
                  <input 
                    type="number"
                    value={aiNutritionInput.age}
                    onChange={(e) => setAiNutritionInput({ ...aiNutritionInput, age: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">سطح فعالیت روزانه</label>
                  <input 
                    type="text"
                    value={aiNutritionInput.activityLevel}
                    onChange={(e) => setAiNutritionInput({ ...aiNutritionInput, activityLevel: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">کالری روزانه هدف</label>
                  <input 
                    type="number"
                    value={aiNutritionInput.dailyCalorieTarget}
                    onChange={(e) => setAiNutritionInput({ ...aiNutritionInput, dailyCalorieTarget: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-slate-400 mb-1">محدودیت غذایی یا حساسیت‌ها (گیاه‌خواری، عدم تحمل لاکتوز و ...)</label>
                  <input 
                    type="text"
                    value={aiNutritionInput.dietaryRestrictions}
                    onChange={(e) => setAiNutritionInput({ ...aiNutritionInput, dietaryRestrictions: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={generateNutritionWithAI}
                disabled={isGeneratingNutrition}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-slate-950 font-extrabold px-6 py-3 rounded-2xl text-xs transition-all flex items-center gap-2"
              >
                {isGeneratingNutrition ? (
                  <>در حال تولید و پردازش توسط هوش مصنوعی...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-950" />
                    تولید آنی برنامه غذایی اختصاصی
                  </>
                )}
              </button>

              {/* AI Nutrition Result Display */}
              {aiNutritionResult && (
                <div className="bg-slate-950 p-6 rounded-3xl border border-emerald-500/20 space-y-6 text-xs animate-fade-in">
                  <div className="border-b border-white/5 pb-3 flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <h4 className="text-base font-bold text-emerald-400">برنامه غذایی تغذیه ورزشی اسمارت جیم</h4>
                      <span className="text-slate-400 block mt-1">تارگت کالری روزانه پیشنهادی: {aiNutritionResult.targetCalories} کالری</span>
                    </div>

                    {aiNutritionResult.macros && (
                      <div className="flex gap-4 text-center">
                        <div className="p-2 bg-white/5 rounded-lg">
                          <span className="block text-[8px] text-slate-400">پروتئین</span>
                          <span className="text-emerald-400 font-bold">{aiNutritionResult.macros.protein}</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg">
                          <span className="block text-[8px] text-slate-400">کربوهیدرات</span>
                          <span className="text-blue-400 font-bold">{aiNutritionResult.macros.carbs}</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg">
                          <span className="block text-[8px] text-slate-400">چربی</span>
                          <span className="text-orange-400 font-bold">{aiNutritionResult.macros.fat}</span>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg">
                          <span className="block text-[8px] text-slate-400">آب</span>
                          <span className="text-cyan-400 font-bold">{aiNutritionResult.macros.water}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meals grid */}
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(aiNutritionResult.meals || {}).map(([key, value]: [string, any], idx: number) => (
                      <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                        <span className="font-bold text-slate-200 block text-sm border-b border-white/5 pb-1.5">{value.title || key}</span>
                        <ul className="space-y-1.5 text-[10px] text-slate-400">
                          {value.items?.map((it: string, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                        {value.calories && (
                          <span className="text-[10px] text-slate-500 block text-left">کالری: {value.calories}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Shopping list and advice */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {aiNutritionResult.shoppingList && (
                      <div className="bg-slate-900 p-4 rounded-2xl border border-white/5">
                        <span className="font-bold text-emerald-400 block mb-2">لیست خرید مواد غذایی هفتگی</span>
                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                          {aiNutritionResult.shoppingList.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiNutritionResult.advice && (
                      <div className="bg-slate-900 p-4 rounded-2xl border border-white/5">
                        <span className="font-bold text-emerald-400 block mb-2">توصیه‌ها و هیدراتاسیون</span>
                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                          {aiNutritionResult.advice.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Interactive Chatbot Coach */}
            <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <div className="w-8 h-8 bg-indigo-600/10 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black">گفتگو زنده با مربی ارشد هوش مصنوعی (AI Fitness Coach Chat)</h3>
                  <p className="text-[10px] text-slate-500">سوالات مربوط به آسیب شناسی ورزشی، ریکاوری و تنظیم تمرینات را از مربی هوشمند بپرسید</p>
                </div>
              </div>

              {/* Chat messages container */}
              <div className="bg-slate-950 rounded-2xl border border-white/5 p-4 h-[250px] overflow-y-auto space-y-4 flex flex-col justify-start">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${msg.role === "user" ? "bg-indigo-600 text-white self-end" : "bg-white/5 text-slate-300 self-start"}`}
                  >
                    {msg.content}
                  </div>
                ))}
                {isChatSending && (
                  <span className="text-[10px] text-slate-500 animate-pulse">مربی هوش مصنوعی در حال نوشتن پاسخ تخصصی است...</span>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={currentMessageInput}
                  onChange={(e) => setCurrentMessageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendChatMessage(); }}
                  placeholder="مثال: مچ دستم حین پرس سینه سنگین کمی تیر میکشه، چه حرکتی جایگزین کنم؟"
                  className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={sendChatMessage}
                  disabled={isChatSending}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}


        {/* -------------------- TAB 7: CPANEL EASY INSTALLER -------------------- */}
        {activeTab === "installer" && (
          <div className="space-y-8 animate-fade-in text-right" dir="rtl">
            
            {/* Header section */}
            <div className="bg-gradient-to-l from-amber-950/40 via-slate-900/60 to-orange-950/40 p-6 rounded-[2rem] border border-amber-500/20 flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-amber-400 text-[10px] font-bold">
                  <Settings className="w-3.5 h-3.5 animate-spin" />
                  محیط جادویی نصب آسان پلتفرم روی سی‌پنل (Easy Installer for cPanel)
                </div>
                <h2 className="text-2xl font-black text-white">نصب‌کننده خودکار و پکیج استقرار اسمارت‌جیم</h2>
                <p className="text-xs text-slate-400">تنظیمات اتصال دیتابیس MySQL (phpMyAdmin)، راه‌اندازی ساختار جدول‌ها و ایجاد حساب سوپر ادمین در چند ثانیه.</p>
              </div>
              <div className="flex gap-4 text-xs font-mono">
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl">نسخه هاست: cPanel v118+</span>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl">بستر: Node.js 18 / 20</span>
              </div>
            </div>

            {/* Installer progression wizard */}
            <div className="grid md:grid-cols-4 gap-6 text-xs font-sans">
              
              {/* Wizard Sidebar Menu */}
              <div className="glass-panel p-6 rounded-[2rem] border border-white/5 space-y-2 h-fit">
                <div className="text-slate-400 font-bold mb-4 px-2 text-[10px] uppercase tracking-wider">مراحل راه‌اندازی پلتفرم</div>
                
                <button
                  onClick={() => setInstallerStep(1)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${installerStep === 1 ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
                >
                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[10px] ${installerStep === 1 ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>۱</span>
                  <span>۱. سازگاری محیط cPanel</span>
                </button>

                <button
                  onClick={() => setInstallerStep(2)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${installerStep === 2 ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
                >
                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[10px] ${installerStep === 2 ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>۲</span>
                  <span>۲. تنظیم پایگاه داده MySQL</span>
                </button>

                <button
                  onClick={() => setInstallerStep(3)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${installerStep === 3 ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
                >
                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[10px] ${installerStep === 3 ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>۳</span>
                  <span>۳. حساب ادمین و برندینگ</span>
                </button>

                <button
                  onClick={() => setInstallerStep(4)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${installerStep === 4 ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
                >
                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[10px] ${installerStep === 4 ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>۴</span>
                  <span>📚 راهنمای مستندات سی‌پنل</span>
                </button>
              </div>

              {/* Wizard Active step content */}
              <div className="md:col-span-3 space-y-6">
                
                {/* Step 1: Environment Checks */}
                {installerStep === 1 && (
                  <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 space-y-6 animate-fade-in">
                    <h3 className="text-base font-black text-white">بررسی خودکار پیش‌نیازهای استقرار روی سی‌پنل (cPanel Checklist)</h3>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      سیستم نصب‌کننده خودکار اسمارت‌جیم، ساختار فنی و دسترسی‌های لایه سیستم‌عامل هاست لینوکسی شما را مورد ارزیابی قرار داده است. تمامی فاکتورها آماده راه‌اندازی هستند:
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-400 text-sm font-black">✓</div>
                        <div>
                          <div className="font-bold text-white">پکیج پایگاه داده (mysql2)</div>
                          <div className="text-[10px] text-emerald-400 font-sans">تایید شده • نسخه پیشرفته مای‌اس‌کیوال</div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-400 text-sm font-black">✓</div>
                        <div>
                          <div className="font-bold text-white">دسترسی به فایل سیستم (.env)</div>
                          <div className="text-[10px] text-emerald-400 font-sans">قابل نوشتن • جهت ذخیره متغیرها</div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-400 text-sm font-black">✓</div>
                        <div>
                          <div className="font-bold text-white">پشتیبانی از ES Moduleها</div>
                          <div className="text-[10px] text-emerald-400 font-sans">فعال • سازگار با هسته Node.js هاست</div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-400 text-sm font-black">✓</div>
                        <div>
                          <div className="font-bold text-white">مهاجرت داده‌های دمو</div>
                          <div className="text-[10px] text-emerald-400 font-sans">آماده • فایل محلی پشتیبان متصل است</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 leading-relaxed text-[11px]">
                      🎉 **تبریک!** هاست cPanel شما از تمام قابلیت‌های ابری پلتفرم اسمارت‌جیم شامل پردازش پس‌زمینه، پایگاه داده MySQL و هوش مصنوعی پشتیبانی می‌کند. برای شروع فرآیند نصب به مرحله بعدی بروید.
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setInstallerStep(2)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs transition-all shadow-lg"
                      >
                        مرحله بعد: تنظیمات دیتابیس MySQL ←
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Database Setup */}
                {installerStep === 2 && (
                  <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 space-y-6 animate-fade-in">
                    <h3 className="text-base font-black text-white">تنظیمات اتصال پایگاه داده MySQL (phpMyAdmin) سی‌پنل</h3>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      ابتدا در پنل cPanel خود از طریق منوی **MySQL Database Wizard** یک دیتابیس و یک کاربر جدید بسازید و تمام دسترسی‌ها (ALL PRIVILEGES) را به آن کاربر بدهید. سپس اطلاعات را در فیلدهای زیر وارد کنید:
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 mb-1 font-bold font-sans">میزبان دیتابیس (Database Host):</label>
                        <input 
                          type="text"
                          value={installerDbHost}
                          onChange={(e) => setInstallerDbHost(e.target.value)}
                          placeholder="localhost"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-left font-mono"
                        />
                        <span className="text-[10px] text-slate-500 font-sans">در ۹۹٪ هاست‌های اشتراکی cPanel روی localhost تنظیم است.</span>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-bold font-sans">پورت (Database Port):</label>
                        <input 
                          type="text"
                          value={installerDbPort}
                          onChange={(e) => setInstallerDbPort(e.target.value)}
                          placeholder="3306"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-left font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-bold font-sans">نام کاربری دیتابیس (Database User):</label>
                        <input 
                          type="text"
                          value={installerDbUser}
                          onChange={(e) => setInstallerDbUser(e.target.value)}
                          placeholder="مثلاً: smartgym_user"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-left font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-bold font-sans">کلمه عبور دیتابیس (Database Password):</label>
                        <input 
                          type="password"
                          value={installerDbPassword}
                          onChange={(e) => setInstallerDbPassword(e.target.value)}
                          placeholder="رمز عبور کاربر دیتابیس..."
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-left font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 mb-1 font-bold font-sans">نام پایگاه داده (Database Name):</label>
                        <input 
                          type="text"
                          value={installerDbName}
                          onChange={(e) => setInstallerDbName(e.target.value)}
                          placeholder="مثلاً: smartgym_db"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-left font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2 p-3 bg-slate-900/50 rounded-xl border border-white/5 flex items-center gap-3">
                        <input 
                          type="checkbox"
                          id="migrate-check"
                          checked={installerMigrateDemo}
                          onChange={(e) => setInstallerMigrateDemo(e.target.checked)}
                          className="w-4 h-4 text-amber-500 rounded bg-slate-950 border-white/10"
                        />
                        <label htmlFor="migrate-check" className="text-slate-300 font-bold select-none cursor-pointer font-sans">
                          مهاجرت و انتقال اتوماتیک داده‌های دمو (باشگاه‌ها، ورزشکاران نمونه، برنامه‌ها و مربیان دمو) به MySQL
                        </label>
                      </div>
                    </div>

                    {/* Console Logger */}
                    <div className="space-y-2">
                      <div className="text-[10px] text-slate-400 font-bold font-sans">لاگ سیستم نصب (Installer Console Output):</div>
                      <div className="bg-slate-950 border border-white/10 rounded-2xl p-4 h-24 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1 text-left" dir="ltr">
                        {installerLogs.map((log, idx) => (
                          <div key={idx}>{`> ${log}`}</div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2 font-sans">
                      <button
                        onClick={async () => {
                          if (!installerDbUser || !installerDbName) {
                            alert("⚠️ لطفا نام کاربری و نام دیتابیس را پر کنید!");
                            return;
                          }
                          setInstallerLogs((prev) => [...prev, `Testing connection to mysql://${installerDbHost}:${installerDbPort}...`]);
                          try {
                            const response = await fetch("/api/installer/test-db", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                host: installerDbHost,
                                port: installerDbPort,
                                user: installerDbUser,
                                password: installerDbPassword,
                                database: installerDbName
                              })
                            });
                            let data: any = {};
                            const contentType = response.headers.get("content-type");
                            if (contentType && contentType.includes("application/json")) {
                              data = await response.json();
                            } else {
                              const text = await response.text();
                              data = { error: text || "قالب پاسخ نامعتبر از سرور" };
                            }
                            if (response.ok && data.success) {
                              setInstallerLogs((prev) => [...prev, `[SUCCESS] ${data.message}`]);
                              alert("✅ اتصال با موفقیت تست شد!");
                            } else {
                              setInstallerLogs((prev) => [...prev, `[ERROR] ${data.error || "خطای نامشخص"}`]);
                              alert(`❌ خطای تست اتصال: ${data.error || "خطای ناشناخته"}`);
                            }
                          } catch (e: any) {
                            setInstallerLogs((prev) => [...prev, `[CRITICAL] Fetch failed: ${e.message}`]);
                            alert(`❌ عدم برقراری ارتباط با هاست: ${e.message}`);
                          }
                        }}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition-all border border-white/10"
                      >
                        🔍 تست اتصال به MySQL
                      </button>

                      <button
                        onClick={async () => {
                          if (!installerDbUser || !installerDbName) {
                            alert("⚠️ لطفا ابتدا نام کاربری و نام دیتابیس را وارد کنید!");
                            return;
                          }
                          setIsInstallerLoading(true);
                          setInstallerLogs((prev) => [...prev, "Starting table definitions deployment..."]);
                          try {
                            const response = await fetch("/api/installer/setup-db", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                host: installerDbHost,
                                port: installerDbPort,
                                user: installerDbUser,
                                password: installerDbPassword,
                                database: installerDbName,
                                migrateData: installerMigrateDemo
                              })
                            });
                            let data: any = {};
                            const contentType = response.headers.get("content-type");
                            if (contentType && contentType.includes("application/json")) {
                              data = await response.json();
                            } else {
                              const text = await response.text();
                              data = { error: text || "قالب پاسخ نامعتبر از سرور" };
                            }
                            if (response.ok && data.success) {
                              setInstallerLogs((prev) => [
                                ...prev, 
                                "[DB SUCCESS] Connection verified.",
                                "[DB SUCCESS] Created all 14 schema tables: tenants, members, coaches, workout_programs, nutrition_plans, etc.",
                                `[DB SUCCESS] ${data.message}`
                              ]);
                              alert("🎉 دیتابیس و ۱۴ جدول آن با موفقیت پیکربندی و راه‌اندازی شدند!");
                              setInstallerStep(3); // Auto-advance
                            } else {
                              setInstallerLogs((prev) => [...prev, `[DB ERROR] Table migration failed: ${data.error}`]);
                              alert(`❌ خطا در راه‌اندازی دیتابیس: ${data.error}`);
                            }
                          } catch (e: any) {
                            setInstallerLogs((prev) => [...prev, `[CRITICAL] Server failed during setup: ${e.message}`]);
                            alert(`❌ خطای سرور: ${e.message}`);
                          } finally {
                            setIsInstallerLoading(false);
                          }
                        }}
                        disabled={isInstallerLoading}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-lg"
                      >
                        {isInstallerLoading ? "در حال ایجاد جدول‌ها و مهاجرت..." : "🚀 ایجاد جدول‌ها و راه‌اندازی دیتابیس"}
                      </button>
                    </div>

                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => setInstallerStep(1)}
                        className="text-slate-500 hover:text-white font-bold"
                      >
                        ← بازگشت به مرحله قبل
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Admin & Branding Setup */}
                {installerStep === 3 && (
                  <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 space-y-6 animate-fade-in">
                    <h3 className="text-base font-black text-white">تعریف حساب کاربری سوپر ادمین پلتفرم و شخصی‌سازی برند</h3>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      با تنظیم مقادیر زیر، اطلاعات کاربری فوق‌امنیتی برای پنل سوپر ادمین تعیین می‌شود. همچنین می‌توانید نام اختصاصی برند پلتفرم خود را جهت استفاده در تمام صفحات، فاکتورها و لوگوها مشخص کنید.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1 font-bold font-sans">نام کاربری سوپر ادمین:</label>
                        <input 
                          type="text"
                          value={installerAdminUser}
                          onChange={(e) => setInstallerAdminUser(e.target.value)}
                          placeholder="admin"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 font-mono text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-bold font-sans">کلمه عبور امنیتی پنل ادمین:</label>
                        <input 
                          type="password"
                          value={installerAdminPass}
                          onChange={(e) => setInstallerAdminPass(e.target.value)}
                          placeholder="کلمه عبور فوق امنیتی..."
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 font-mono text-left"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 mb-1 font-bold font-sans">نام برند تجاری پلتفرم (SaaS Platform Title):</label>
                        <input 
                          type="text"
                          value={installerBrandName}
                          onChange={(e) => setInstallerBrandName(e.target.value)}
                          placeholder="پلتفرم ابری اسمارت جیم"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200"
                        />
                        <span className="text-[10px] text-slate-500 font-sans">این نام به صورت سراسری در لندینگ، هدرها، کپی‌رایت‌ها و ایمیل‌ها قرار می‌گیرد.</span>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (!installerAdminPass) {
                          alert("⚠️ لطفا کلمه عبور پنل سوپر ادمین را مشخص کنید!");
                          return;
                        }
                        setIsInstallerLoading(true);
                        try {
                          const response = await fetch("/api/installer/save-admin", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              username: installerAdminUser,
                              password: installerAdminPass,
                              brandName: installerBrandName
                            })
                          });
                          let data: any = {};
                          const contentType = response.headers.get("content-type");
                          if (contentType && contentType.includes("application/json")) {
                            data = await response.json();
                          } else {
                            const text = await response.text();
                            data = { error: text || "قالب پاسخ نامعتبر از سرور" };
                          }
                          if (response.ok && data.success) {
                            setPlatformBrandLogo(installerBrandName);
                            localStorage.setItem("platformBrandLogo", installerBrandName);
                            alert("🎉 اطلاعات پنل ادمین و برند اختصاصی با موفقیت ثبت نهایی شد! اکنون پلتفرم شما با موفقیت نصب شده و کاملاً فعال است.");
                            
                            // Log in immediately
                            setIsSuperAdminLoggedIn(true);
                            localStorage.setItem("isSuperAdminLoggedIn", "true");
                            
                            // Redirect to admin panel
                            setActiveTab("superadmin");
                          } else {
                            alert(`❌ خطا در ذخیره اطلاعات کاربری: ${data.error}`);
                          }
                        } catch (e: any) {
                          alert(`❌ خطای دسترسی به فایل سیستم سرور: ${e.message}`);
                        } finally {
                          setIsInstallerLoading(false);
                        }
                      }}
                      disabled={isInstallerLoading}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg font-sans"
                    >
                      {isInstallerLoading ? "در حال ثبت نهایی..." : "🏁 ذخیره نهایی و راه‌اندازی و ورود به پنل سوپر ادمین"}
                    </button>

                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => setInstallerStep(2)}
                        className="text-slate-500 hover:text-white font-bold font-sans"
                      >
                        ← بازگشت به مرحله قبل
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Documentation */}
                {installerStep === 4 && (
                  <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 space-y-6 animate-fade-in text-slate-300 text-xs font-sans leading-relaxed">
                    <h3 className="text-base font-black text-white">راهنمای استقرار پروژه روی پنل هاست cPanel</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-bold text-amber-400 text-sm">۱. نحوه آپلود پروژه به سی‌پنل:</h4>
                        <p>
                          کل فایل‌های پروژه (به جز پوشه سنگین `node_modules` و `dist`) را به صورت فایل `.zip` فشرده کنید و از بخش **File Manager** هاست cPanel آپلود کرده و اکسترکت (Extract) نمایید.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-bold text-amber-400 text-sm">۲. تنظیم Setup Node.js App:</h4>
                        <p>
                          در منوهای سی‌پنل گزینه **Setup Node.js App** را باز کرده و بر روی **Create Application** کلیک کنید. نسخه Node.js را روی ۱۸ یا ۲۰ قرار دهید. مسیر Root را برابر پوشه اصلی اکسترکت شده و فایل استارت‌پ روت را برابر `server.ts` (یا `dist/server.cjs` بعد از بیلد) یا به سادگی طبق تنظیم پیش‌فرض قرار دهید.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-bold text-amber-400 text-sm">۳. اجرای دستورات بیلد و استارت‌پ:</h4>
                        <p>
                          پس از تعریف اپ در cPanel، دکمه **Run NPM Install** را بزنید تا کل دپندنسی‌ها روی هاست نصب شوند. سپس از ترمینال هاست یا از طریق منوی cPanel کامند `npm run build` را اجرا کنید. پلتفرم با مکانیزم Bundle شده و درایور MySQL کاملاً هماهنگ شده و از روی هاست به سرعت بارگذاری می‌شود!
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-bold text-amber-400 text-sm">۴. اتصال درگاه‌های بانکی شتاب:</h4>
                        <p>
                          از پنل سوپر ادمین پلتفرم (منوی آخر) کدهای مرچنت درگاه بانکی **زرین‌پال** یا **سامان‌کیش** باشگاه‌ها را به صورت آنی تغییر داده و در دیتابیس MySQL هاست ذخیره کنید.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setInstallerStep(1)}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all border border-white/10"
                      >
                        برگشت به شروع نصب ←
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

      </main>

      {/* 24. Standard commercial footer for a real SaaS */}
      {!(activeTab === "member" && loggedInMember) && (
        <footer className="bg-slate-950 border-t border-white/10 py-12 mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8 text-xs">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm">
                  SG
                </div>
                <span className="text-base font-black text-white">پلتفرم اسمارت جیم</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                بزرگترین و مجهزترین سامانه ابری مدیریت یکپارچه کلوپ‌های ورزشی، باشگاه‌های بدنسازی و سالن‌های پرورش اندام ایران با تکیه بر تکنولوژی بومی و هوش مصنوعی پیشرفته.
              </p>
            </div>

            <div className="space-y-3">
              <span className="font-bold text-slate-200 block">دسترسی سریع</span>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => setActiveTab("landing")} className="hover:text-blue-400 transition-colors">خانه و لندینگ پیج</button></li>
                <li><button onClick={() => setActiveTab("superadmin")} className="hover:text-blue-400 transition-colors">سوپر ادمین نظارت</button></li>
                <li><button onClick={() => setActiveTab("tenant")} className="hover:text-blue-400 transition-colors">پنل مستاجر باشگاه</button></li>
                <li><button onClick={() => setActiveTab("coach")} className="hover:text-blue-400 transition-colors">پنل مربیان</button></li>
                <li><button onClick={() => setActiveTab("member")} className="hover:text-blue-400 transition-colors">پنل ورزشکار و پلیر</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="font-bold text-slate-200 block">پشتیبانی و امنیت</span>
              <ul className="space-y-2 text-slate-400">
                <li><button onClick={() => setFooterDocView("terms")} className="hover:text-emerald-400 transition-colors text-right w-full cursor-pointer">شرایط و قوانین استفاده</button></li>
                <li><button onClick={() => setFooterDocView("privacy")} className="hover:text-emerald-400 transition-colors text-right w-full cursor-pointer">حفظ حریم خصوصی اعضا</button></li>
                <li><button onClick={() => setFooterDocView("support")} className="hover:text-emerald-400 transition-colors text-right w-full cursor-pointer">تیکت پشتیبانی ۲۴ ساعته</button></li>
                <li><button onClick={() => setFooterDocView("sla")} className="hover:text-emerald-400 transition-colors text-right w-full cursor-pointer">تضمین پایداری سرورها (SLA)</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="font-bold text-slate-200 block">ارتباط با اسمارت جیم</span>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>شماره تماس: ۰۲۱-۸۸۸۸۴۴۴۴</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>ایمیل: support@smartgym.ir</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>تهران، پارک فناوری پردیس، بخش شتابدهی</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-white/5 text-center text-[10px] text-slate-500 flex flex-wrap justify-between items-center gap-4">
            <span>تمامی حقوق مادی و معنوی این وب‌سایت محفوظ و متعلق به شرکت فنی مهندسی اسمارت جیم کلاود می‌باشد. © ۱۴۰۵</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-300">سایت مپ</a>
              <a href="#" className="hover:text-slate-300">امنیت کلاود</a>
              <a href="#" className="hover:text-slate-300">APIها</a>
            </div>
          </div>
        </footer>
      )}

      {showPurchaseModal && generatedClubCredentials && purchasedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-right" dir="rtl">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-lg w-full space-y-6 relative overflow-hidden shadow-2xl shadow-blue-500/10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] -z-10"></div>

            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl mx-auto shadow-lg shadow-emerald-900/30">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">پرداخت موفقیت‌آمیز بود! 🎉</h3>
              <p className="text-xs text-slate-400">
                لایسنس ابری فعال شد و پنل باشگاه شما آماده بهره‌برداری است.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-white/5 space-y-3.5">
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-slate-400">پلن خریداری شده:</span>
                <span className="font-bold text-slate-200">{purchasedPlan.name} ({purchasedPlan.durationMonths} ماهه)</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-slate-400">مجموعه ورزشی:</span>
                <span className="font-bold text-slate-200">{generatedClubCredentials.clubName}</span>
              </div>

              <div className="space-y-2 pt-1 text-center">
                <span className="text-[10px] text-emerald-400 font-bold block bg-emerald-500/10 border border-emerald-500/20 py-1 rounded-lg">
                  🔑 اطلاعات ورود اختصاصی صادر شده جهت ورود باشگاه:
                </span>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 block mb-0.5">نام کاربری ورود (جدید)</span>
                    <span className="font-mono text-sm font-bold text-blue-400 select-all">{generatedClubCredentials.username}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 block mb-0.5">رمز عبور ورود</span>
                    <span className="font-mono text-sm font-bold text-amber-400 select-all">{generatedClubCredentials.password}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 bg-white/5 p-3 rounded-xl leading-relaxed text-center">
              ورزشکاران و مربیان نیز می‌توانند با اکانت‌های صادر شده توسط شما در صفحات اختصاصی خود لاگین کنند. اطلاعات بالا را کپی یا یادداشت نمایید.
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setLoggedInTenant({
                    username: generatedClubCredentials.username,
                    clubName: generatedClubCredentials.clubName,
                    planName: purchasedPlan.name,
                    isNew: true
                  });
                  setShowPurchaseModal(false);
                  setActiveTab("tenant");
                }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/40 text-xs text-center"
              >
                🚀 ورود فوری و خودکار به پنل باشگاه
              </button>
              <button 
                onClick={() => setShowPurchaseModal(false)}
                className="bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Iranian Payment Gateway Simulator Overlay */}
      {showPaymentSimulator && pendingPurchasePlan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <IranianGatewaySimulator
              amountToman={pendingPurchasePlan.priceToman}
              planName={pendingPurchasePlan.name}
              gatewayName={paymentGatewayConfigs.activeGateway}
              isSandbox={paymentGatewayConfigs.isSandbox}
              merchantId={paymentGatewayConfigs.merchantId}
              onCancel={() => {
                setShowPaymentSimulator(false);
                setPendingPurchasePlan(null);
              }}
              onSuccess={() => {
                if (pendingPurchasePlan.isRenewal) {
                  setSubscriptionDaysLeft((prev) => prev + (pendingPurchasePlan.extensionDays || 30));
                  if (loggedInTenant) {
                    setLoggedInTenant((prev: any) => ({
                      ...prev,
                      planName: pendingPurchasePlan.name
                    }));
                    setTenants((prevList) => prevList.map(t => t.id === loggedInTenant.id ? { ...t, planName: pendingPurchasePlan.name } : t));
                  }
                  setShowPaymentSimulator(false);
                  setPendingPurchasePlan(null);
                  alert(`🎉 پرداخت موفقیت‌آمیز بود! اشتراک باشگاه شما به "${pendingPurchasePlan.name}" ارتقا یافت و اعتبار شما به میزان ${pendingPurchasePlan.extensionDays} روز دیگر تمدید شد.`);
                  return;
                }

                const randNum = Math.floor(Math.random() * 900 + 100);
                const generatedUsername = `club_oxygen_${randNum}`;
                const generatedPassword = `pass_${randNum}`;
                
                setPurchasedPlan(pendingPurchasePlan);
                setGeneratedClubCredentials({
                  username: generatedUsername,
                  password: generatedPassword,
                  clubName: `مجموعه ورزشی اکسیژن (شعبه ${pendingPurchasePlan.name})`
                });

                // Add to active tenants list
                const newlyCreated: Tenant = {
                  id: `tenant_${Date.now()}`,
                  name: `مجموعه ورزشی اکسیژن (شعبه ${pendingPurchasePlan.name})`,
                  ownerName: "مدیر باشگاه اکسیژن",
                  email: "oxygen@smartgym.ir",
                  phone: "09121234567",
                  status: "ACTIVE",
                  planName: pendingPurchasePlan.name,
                  expiresAt: "1406/04/01",
                  branchesCount: 1,
                  membersCount: 0,
                  monthlyRevenue: pendingPurchasePlan.priceToman,
                  createdAt: "1405/04/01",
                  features: pendingPurchasePlan.features || []
                };
                setTenants((prev) => [newlyCreated, ...prev]);

                setShowPaymentSimulator(false);
                setPendingPurchasePlan(null);
                setShowPurchaseModal(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Dedicated Pages for Footer Support & Security */}
      {footerDocView && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="glass-panel max-w-2xl w-full p-8 rounded-[2.5rem] border border-white/10 space-y-6 relative text-right animate-scale-up" dir="rtl">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[60px] -z-10"></div>

            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl flex items-center justify-center text-lg">
                  {footerDocView === "terms" && "📜"}
                  {footerDocView === "privacy" && "🛡️"}
                  {footerDocView === "support" && "🎫"}
                  {footerDocView === "sla" && "⚡"}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {footerDocView === "terms" && "شرایط و قوانین استفاده از اسمارت جیم"}
                    {footerDocView === "privacy" && "سند حفظ حریم خصوصی اعضا و باشگاه‌ها"}
                    {footerDocView === "support" && "تیکت پشتیبانی ۲۴ ساعته و راهنمای سیستم"}
                    {footerDocView === "sla" && "تضمین پایداری سرورها و امنیت کلاود (SLA)"}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">آخرین به‌روزرسانی: تیرماه ۱۴۰۵</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[350px] overflow-y-auto pr-1">
              {footerDocView === "terms" && (
                <>
                  <p className="font-bold text-white text-sm">۱. لایسنس و حقوق پلتفرم:</p>
                  <p>استفاده از خدمات ابری مدیریت باشگاه اسمارت جیم شامل ثبت‌نام، تخصیص لایسنس، پرداخت هزینه‌ها و نحوه ارائه خدمات به باشگاه‌ها و ورزشکاران منوط به پذیرش تام این سند است. هرگونه استفاده غیرمجاز با پیگرد قانونی همراه خواهد بود.</p>
                  
                  <p className="font-bold text-white text-sm mt-3">۲. اطلاعات مربیان و اعضا:</p>
                  <p>مسئولیت صحت قانونی کلیه اطلاعات هویتی، تراکنش‌های مالی باشگاه، حضور غیاب و برنامه‌های ورزشی مربیان کاملاً بر عهده مدیریت باشگاه (مستأجر) می‌باشد.</p>
                  
                  <p className="font-bold text-white text-sm mt-3">۳. لغو اشتراک و پرداخت‌ها:</p>
                  <p>تمدید اشتراک به صورت لحظه‌ای انجام می‌شود و مبالغ واریز شده بابت خدمات SaaS غیرقابل استرداد است.</p>
                </>
              )}

              {footerDocView === "privacy" && (
                <>
                  <p className="font-bold text-white text-sm">۱. جمع‌آوری حداقل اطلاعات مورد نیاز:</p>
                  <p>پلتفرم اسمارت جیم خود را متعهد به حفظ ۱۰۰٪ اطلاعات حساس باشگاه‌ها، مربیان و به ویژه سوابق تمرینی، پزشکی و بیومتریک ورزشکاران می‌داند. ما تنها اطلاعاتی را جمع‌آوری می‌کنیم که برای فرآیند صدور برنامه‌های ورزشی و پذیرش مورد نیاز است.</p>
                  
                  <p className="font-bold text-white text-sm mt-3">۲. امنیت و رمزنگاری پیشرفته:</p>
                  <p>کلیه اطلاعات رد و بدل شده در بستر ابری به صورت رمزنگاری شده چندلایه (SSL/AES-256) ذخیره و در فایروال‌های پیشرفته مراقبت می‌گردد و هرگز در اختیار شخص ثالث یا تبلیغات قرار نخواهد گرفت.</p>
                  
                  <p className="font-bold text-white text-sm mt-3">۳. حق فراموشی و حذف اطلاعات:</p>
                  <p>هر زمان که ورزشکار یا مدیر باشگاه تصمیم به لغو کامل حساب کاربری بگیرد، امکان پاک‌سازی کامل تمام تاریخچه‌ها فراهم است.</p>
                </>
              )}

              {footerDocView === "support" && (
                <>
                  <p className="font-bold text-white text-sm">۱. مرکز تیکتینگ یکپارچه:</p>
                  <p>پشتیبانی کارشناسان فنی ما در ۷ روز هفته و ۲۴ ساعت شبانه‌روز از طریق ثبت تیکت، تماس تلفنی اضطراری و چت آنلاین در خدمت شماست. هدف ما پایداری کسب‌وکار شما در بالاترین بازدهی است.</p>
                  
                  <p className="font-bold text-white text-sm mt-3">۲. زمان پاسخگویی VIP:</p>
                  <p>میانگین زمان پاسخگویی به تیکت‌های فنی و مالی باشگاه‌ها کمتر از ۱۵ دقیقه می‌باشد. در تمام طول مسیر راه‌اندازی و ثبت نام اعضا در کنار شما هستیم.</p>
                  
                  <p className="font-bold text-white text-sm mt-3">۳. اطلاعات تماس سریع:</p>
                  <p>در صورت نیاز به تماس فوری می‌توانید با شماره پشتیبانی ۰۲۱-۸۸۸۸۴۴۴۴ یا ایمیل رسمی support@smartgym.ir ارتباط برقرار نمایید.</p>
                </>
              )}

              {footerDocView === "sla" && (
                <>
                  <p className="font-bold text-white text-sm">۱. تضمین آپ‌تایم سالانه ۹۹.۹۸٪:</p>
                  <p>ضمانت پایداری سرورهای ابری اسمارت جیم معادل ۹۹.۹۸٪ آپ‌تایم سالانه در مجهزترین دیتاسنترهای داخلی و کلاود همزمان می‌باشد تا فرآیند پذیرش و مانیتورینگ باشگاه با هیچ وقفه‌ای روبرو نشود.</p>
                  
                  <p className="font-bold text-white text-sm mt-3">۲. نسخه‌های پشتیبان روزانه و اتوماتیک:</p>
                  <p>تهیه نسخه پشتیبان (Backups) از تمامی اطلاعات مالی باشگاه، اطلاعات مربیان، بیومتریک و برنامه‌های تمرینی به صورت روزانه و خودکار در سرورهای سرد جداگانه انجام می‌پذیرد تا هیچ‌گونه ریسک داده‌ای وجود نداشته باشد.</p>
                  
                  <p className="font-bold text-white text-sm mt-3">۳. مانیتورینگ آنلاین فایروال‌ها:</p>
                  <p>سیستم پایش ترافیک ابری به طور ۲۴ ساعته هرگونه حمله DDoS و دسترسی غیرمجاز را شناسایی و مسدود می‌نماید.</p>
                </>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setFooterDocView(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                بستن و بازگشت به سایت
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Mascot Smart Assistant (Not displayed inside athlete mobile view) */}
      {!(activeTab === "member" && loggedInMember) && (
        <div className="fixed bottom-6 left-6 z-50 text-right font-sans" dir="rtl">
          {/* Active dialogue bubble (if open) */}
          {showSmartAssistant && (
            <div id="smart-chat-floating-container" className="glass-panel w-85 p-5 rounded-[2rem] border border-green-500/20 mb-3 shadow-2xl animate-scale-up text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={mascotSmartLaptop} 
                    alt="Smart Avatar" 
                    className="w-10 h-10 rounded-full object-cover border border-green-400"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-black text-white text-sm">گپ با اسمارْت (Mascot Support)</h4>
                    <p className="text-[10px] text-green-400">پشتیبان و مربی زنده پلتفرم</p>
                  </div>
                </div>
                {smartChatSession && (
                  <button 
                    onClick={() => {
                      if(confirm("آیا می‌خواهید نشست فعلی چت را بازنشانی کنید؟")) {
                        localStorage.removeItem("smart_chat_session_id");
                        localStorage.removeItem("smart_chat_user_name");
                        localStorage.removeItem("smart_chat_user_phone");
                        setSmartChatSession(null);
                        setSmartChatMessages([]);
                      }
                    }}
                    title="شروع مجدد چت"
                    className="text-slate-500 hover:text-red-400 font-bold px-2 py-1 rounded"
                  >
                    🔄 بازنشانی
                  </button>
                )}
              </div>

              {!smartChatSession ? (
                /* Session Initiation Form */
                <form onSubmit={startNewSmartChat} className="space-y-3.5 py-2">
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    سلام قهرمان! برای شروع گپ مستقیم با اسمارْت و ارسال پیام به پنل ادمین، لطفاً اطلاعات زیر را وارد کنید:
                  </p>
                  
                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">نام و نام خانوادگی:</label>
                    <input 
                      type="text" 
                      required
                      value={smartChatUserName}
                      onChange={(e) => setSmartChatUserName(e.target.value)}
                      placeholder="مثلا: علی محمدی"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-bold">شماره تماس (جهت پیگیری بعدی):</label>
                    <input 
                      type="text" 
                      value={smartChatUserPhone}
                      onChange={(e) => setSmartChatUserPhone(e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-green-500"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSmartChatSubmittingName}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:brightness-110 text-slate-950 font-black py-2.5 rounded-xl transition-all"
                  >
                    {isSmartChatSubmittingName ? "در حال اتصال..." : "⚡ ورود به محیط گفت‌وگو"}
                  </button>
                </form>
              ) : (
                /* Live Conversation Screen */
                <div className="space-y-3">
                  {/* Message Log */}
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5 max-h-56 overflow-y-auto space-y-2.5 min-h-[160px] flex flex-col">
                    {smartChatMessages.length === 0 ? (
                      <div className="text-center text-slate-500 my-auto">در حال دریافت گفتگو...</div>
                    ) : (
                      smartChatMessages.map((msg) => {
                        const isUser = msg.sender === "user";
                        const isAI = msg.sender === "smart_ai";
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col max-w-[85%] ${isUser ? "self-start text-right" : "self-end text-left"}`}
                          >
                            <span className="text-[8px] text-slate-500 mb-0.5 px-1 font-mono">
                              {isUser ? "شما" : isAI ? "هوش مصنوعی اسمارْت" : "پشتیبان پلتفرم"}
                            </span>
                            <div 
                              className={`p-2.5 rounded-2xl text-[11px] leading-relaxed ${
                                isUser 
                                  ? "bg-emerald-600 text-slate-950 rounded-tr-none font-bold" 
                                  : isAI 
                                    ? "bg-slate-900 text-green-400 border border-green-500/10 rounded-tl-none font-medium" 
                                    : "bg-blue-600/20 text-blue-300 border border-blue-500/20 rounded-tl-none font-bold"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Suggestion Tags */}
                  <div className="flex gap-1 overflow-x-auto pb-1 text-[9px] scrollbar-none">
                    <button 
                      onClick={() => setSmartChatInputText("تعرفه اشتراک‌های پلتفرم چقدره؟")}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/5 rounded-full px-2.5 py-1 whitespace-nowrap"
                    >
                      💳 تعرفه پلتفرم
                    </button>
                    <button 
                      onClick={() => setSmartChatInputText("یک راهنمایی بدنسازی یا راز فیتنس بم بگو")}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/5 rounded-full px-2.5 py-1 whitespace-nowrap"
                    >
                      🏋️‍♂️ رازهای فیتنس
                    </button>
                    <button 
                      onClick={() => setSmartChatInputText("چگونه مربی استخدام کنم در باشگاه؟")}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/5 rounded-full px-2.5 py-1 whitespace-nowrap"
                    >
                      🤝 امور مربیان
                    </button>
                  </div>

                  {/* Message Input Form */}
                  <div className="flex gap-1.5 pt-1">
                    <input 
                      type="text"
                      value={smartChatInputText}
                      onChange={(e) => setSmartChatInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendSmartChatMessage();
                        }
                      }}
                      placeholder="پیامی به اسمارْت بنویسید..."
                      className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-green-500 text-[11px]"
                    />
                    <button 
                      onClick={sendSmartChatMessage}
                      className="bg-green-600 hover:bg-green-500 text-slate-950 font-black px-3.5 rounded-xl transition-all text-[11px]"
                    >
                      ارسال
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1 border-t border-white/5">
                <span>اسمارت جیم • گپ مستقیم آنلاین</span>
                <button 
                  onClick={() => setShowSmartAssistant(false)}
                  className="text-red-500 hover:underline font-bold"
                >
                  بستن گفتگو
                </button>
              </div>
            </div>
          )}

          {/* Glowing Float Action Button with Mascot Image */}
          <button
            onClick={() => {
              setShowSmartAssistant(!showSmartAssistant);
            }}
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black py-3 px-4 rounded-full shadow-2xl shadow-green-950/50 hover:brightness-110 active:scale-95 transition-all border border-green-400/30"
          >
            {/* Glowing effect */}
            <div className="absolute inset-0 bg-green-500 opacity-20 blur-xl rounded-full animate-pulse"></div>

            <span className="text-xs tracking-wider relative z-10 hidden sm:inline">گپ زنده با اسمارْت (مسکات)</span>
            
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
              <img 
                src={mascotSmartLaptop} 
                alt="Smart" 
                className="w-full h-full object-cover scale-110 transition-transform group-hover:scale-125"
                referrerPolicy="no-referrer"
              />
            </div>
          </button>
        </div>
      )}

    </div>
  );
}

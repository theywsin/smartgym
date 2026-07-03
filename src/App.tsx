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
  SUBSCRIPTION_PLANS
} from "./data";
import { UserRole, Tenant, Booking, StoreProduct } from "./types";
import ExerciseAnimation from "./components/ExerciseAnimation";

// Custom Premium Sub-components Integration
import GymLogo from "./components/GymLogo";
import IranianGatewaySimulator from "./components/IranianGatewaySimulator";
import AthleteDashboard from "./components/AthleteDashboard";
import GymInfoTab from "./components/GymInfoTab";
import CoachMemberDetail from "./components/CoachMemberDetail";
import AICoachProgramGenerator from "./components/AICoachProgramGenerator";
import TicketSystem from "./components/TicketSystem";
import ThreeGymCanvas from "./components/ThreeGymCanvas";

export default function App() {
  // Navigation & Role states
  const [activeTab, setActiveTab] = useState<"landing" | "superadmin" | "tenant" | "coach" | "member" | "ai_labs">("landing");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

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
  const [superAdminSubTab, setSuperAdminSubTab] = useState<"dashboard" | "plans" | "tickets" | "settings">("dashboard");
  const [selectedDetailedMember, setSelectedDetailedMember] = useState<any | null>(null);

  // Iranian Payment Gateway flow states
  const [pendingPurchasePlan, setPendingPurchasePlan] = useState<any | null>(null);
  const [showPaymentSimulator, setShowPaymentSimulator] = useState(false);
  const [showTenantBrandModal, setShowTenantBrandModal] = useState(false);
  const [showTenantSubscriptionModal, setShowTenantSubscriptionModal] = useState(false);
  const [footerDocView, setFooterDocView] = useState<"terms" | "privacy" | "support" | "sla" | null>(null);
  const [tenantCustomColor, setTenantCustomColor] = useState("emerald");
  const [tenantBrandText, setTenantBrandText] = useState("");


  // Persistent States
  const [workoutPrograms, setWorkoutPrograms] = useState<any[]>(MOCK_WORKOUT_PROGRAMS);
  const [nutritionPlans, setNutritionPlans] = useState<any[]>(MOCK_NUTRITION_PLANS);

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
  const [platformBrandLogo, setPlatformBrandLogo] = useState("SMART GYM");
  const [platformTheme, setPlatformTheme] = useState("emerald"); // choices: emerald, blue, rose, violet, amber

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

  const [platformLandingTitle, setPlatformLandingTitle] = useState("مدیریت باشگاه را هوشمند، سریع و بدون دردسر انجام دهید");
  const [platformLandingSubtitle, setPlatformLandingSubtitle] = useState("از ساخت خودکار برنامه‌های تمرینی و غذایی با هوش مصنوعی گرفته تا حضور و غیاب پیشرفته، درگاه مستقیم بانکی، کلوپ وفاداری، انبارداری و بوفه، و مدیریت یکپارچه بی‌نهایت شعبه؛ همه و همه در یک بستر مدرن و شیشه‌ای (Glassmorphism).");
  
  // Payment Gateways Settings (SuperAdmin Configured)
  const [gatewayZarinpalEnabled, setGatewayZarinpalEnabled] = useState(true);
  const [gatewayZarinpalMerchant, setGatewayZarinpalMerchant] = useState("zarinpal_merchant_889900");
  const [gatewaySepEnabled, setGatewaySepEnabled] = useState(true);
  const [gatewaySepTerminalId, setGatewaySepTerminalId] = useState("sep_terminal_998811");

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
  const [coachSubView, setCoachSubView] = useState<"directory" | "create_workout" | "create_nutrition" | "ai_generation">("directory");

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
      const data = await response.json();
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
      const data = await response.json();
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
      const data = await response.json();
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
    const newlyCreated: Tenant = {
      id: `tenant_${Date.now()}`,
      name: newTenant.name,
      ownerName: newTenant.ownerName,
      email: newTenant.email || "info@gym.ir",
      phone: newTenant.phone || "09120000000",
      status: "ACTIVE",
      planName: newTenant.planName,
      expiresAt: "1406/04/01",
      branchesCount: 1,
      membersCount: 0,
      monthlyRevenue: 0,
      createdAt: "1405/04/01"
    };
    setTenants([...tenants, newlyCreated]);
    setNewTenant({ name: "", ownerName: "", email: "", phone: "", planName: "پلن حرفه‌ای (نقره‌ای)", status: "ACTIVE" });
  };

  // Add new booking
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const newlyCreated: Booking = {
      id: `b_${Date.now()}`,
      ...newBooking,
      status: "CONFIRMED"
    };
    setBookings([...bookings, newlyCreated]);
    alert("رزرو کلاس با موفقیت در سیستم ثبت گردید.");
  };

  // Add new shop product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.brand) return;
    const newlyCreated: StoreProduct = {
      id: `p_${Date.now()}`,
      ...newProduct
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

    const newlyCreated = {
      id: `m_${Date.now()}`,
      name: newMemberName,
      username: newMemberUsername.trim(),
      password: newMemberPassword,
      phone: newMemberPhone || "09120000000",
      assignedProgramId: newMemberProgramId,
      assignedNutritionId: newMemberNutritionId,
      remainingSessions: Number(newMemberSessions) || 12,
      coachName: "استاد پوریا کریمی",
      joinedDate: "1405/04/01"
    };

    setMembers([...members, newlyCreated]);
    
    // Clear Form
    setNewMemberName("");
    setNewMemberPhone("");
    setNewMemberUsername("");
    setNewMemberPassword("");
    setNewMemberSessions(12);

    alert(`حساب کاربری ورزشکار "${newlyCreated.name}" با موفقیت ایجاد شد! اکنون ورزشکار می‌تواند با نام کاربری "${newlyCreated.username}" وارد پنل خود شود.`);
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
              <GymLogo showText={true} size="md" isDark={isDarkMode} brandText={platformBrandLogo} themeColor={platformTheme} />
            </div>

            {/* Desktop Navigation Link Tabs */}
            <nav className="hidden lg:flex items-center gap-1.5 bg-slate-900/50 p-1.5 rounded-full border border-white/5">
              <button 
                onClick={() => setActiveTab("landing")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "landing" ? "bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/30" : "text-slate-400 hover:text-slate-200"}`}
              >
                لندینگ معرفی
              </button>
              <button 
                onClick={() => setActiveTab("superadmin")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "superadmin" ? "bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
              >
                سوپر ادمین (SaaS)
              </button>
              <button 
                onClick={() => setActiveTab("tenant")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "tenant" ? "bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
              >
                پنل مستأجر (باشگاه)
              </button>
              <button 
                onClick={() => setActiveTab("coach")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "coach" ? "bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
              >
                پنل مربیان
              </button>
              <button 
                onClick={() => setActiveTab("member")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "member" ? "bg-gradient-to-l from-blue-600 to-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
              >
                پنل ورزشکار و پلیر
              </button>
            </nav>
          </div>

          {/* Action Controls & Dark Mode Toggle */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
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
            صفحه اصلی لندینگ
          </button>
          <button 
            onClick={() => { setActiveTab("superadmin"); setIsMobileMenuOpen(false); }}
            className={`p-3 rounded-xl text-sm font-bold text-right transition-all ${activeTab === "superadmin" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"}`}
          >
            پنل مدیریتی سوپر ادمین (SaaS)
          </button>
          <button 
            onClick={() => { setActiveTab("tenant"); setIsMobileMenuOpen(false); }}
            className={`p-3 rounded-xl text-sm font-bold text-right transition-all ${activeTab === "tenant" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"}`}
          >
            پنل مدیریت باشگاه (Tenant)
          </button>
          <button 
            onClick={() => { setActiveTab("coach"); setIsMobileMenuOpen(false); }}
            className={`p-3 rounded-xl text-sm font-bold text-right transition-all ${activeTab === "coach" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"}`}
          >
            پنل مربیان بدنسازی
          </button>
          <button 
            onClick={() => { setActiveTab("member"); setIsMobileMenuOpen(false); }}
            className={`p-3 rounded-xl text-sm font-bold text-right transition-all ${activeTab === "member" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"}`}
          >
            پنل اعضا و پلیر تمرین خودکار
          </button>
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
                
                {/* Card 1 */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-blue-500/30 transition-all hover:translate-y-[-2px]">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">پلیر هوشمند تمرین اعضا</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    ورزشکار در حین تمرین زنده، انیمیشن اجرای حرکت، عضلات درگیر، تایمر ست و تایمر استراحت را با قابلیت سوئیچ خودکار مشاهده می‌کند. تجربه‌ای فراتر از کاغذ و فایل PDF.
                  </p>
                </div>

                {/* Card 2 */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-emerald-500/30 transition-all hover:translate-y-[-2px]">
                  <div className="w-12 h-12 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">دستیار و مربی هوش مصنوعی</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    با وارد کردن اطلاعات پایه‌ای ورزشکار، مربی می‌تواند برنامه‌های تمرینی هفتگی و برنامه‌های غذایی بهینه‌شده به همراه لیست خرید را در چند ثانیه از هوش مصنوعی دریافت کند.
                  </p>
                </div>

                {/* Card 3 */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-purple-500/30 transition-all hover:translate-y-[-2px]">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center text-purple-400">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">وایت لیبل کامل و اختصاصی</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    امکان شخصی‌سازی کامل لوگو، تغییر رنگ‌های داشبورد، اتصال ساب‌دامین اختصاصی و فرم‌های ثبت‌نام برای هر یک از مدیران باشگاه به صورت کاملاً مستقل و مجزا.
                  </p>
                </div>

                {/* Card 4 */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-orange-500/30 transition-all hover:translate-y-[-2px]">
                  <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center text-orange-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">مدیریت شعب و پرسنل</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    بخش مدیریت دسترسی‌ها برای سوپروایزر، منشی پذیرش، مدیر مالی، مربی ارشد و متخصص تغذیه با سطوح دسترسی پیشرفته و تفکیک‌شده.
                  </p>
                </div>

                {/* Card 5 */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-pink-500/30 transition-all hover:translate-y-[-2px]">
                  <div className="w-12 h-12 bg-pink-600/20 rounded-2xl flex items-center justify-center text-pink-400">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">فروشگاه بوفه و انبارداری</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    مدیریت مکمل‌ها، نوشیدنی‌ها و تجهیزات ورزشی به همراه بارکد اختصاصی، نوتیفیکیشن هشدار اتمام موجودی انبار و پرداخت از کیف پول اعضا.
                  </p>
                </div>

                {/* Card 6 */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-cyan-500/30 transition-all hover:translate-y-[-2px]">
                  <div className="w-12 h-12 bg-cyan-600/20 rounded-2xl flex items-center justify-center text-cyan-400">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">حضوروغیاب با کد QR هوشمند</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    ورزشکار به محض ورود، کد QR اختصاصی پنل خود را جلو رسیور یا منشی قرار داده و سیستم به صورت خودکار زمان ورود، خروج و مانده جلسات را محاسبه می‌کند.
                  </p>
                </div>

              </div>
            </div>


            {/* 3D Gym Space Visualization Section */}
            <ThreeGymCanvas />


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

          </div>
        )}


        {/* -------------------- TAB 2: SUPER ADMIN DASHBOARD -------------------- */}
        {activeTab === "superadmin" && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-3xl border border-white/5">
              <div>
                <span className="text-blue-400 text-xs font-bold">بخش فوق‌امنیتی نظارت کلان پلتفرم (SaaS Owner)</span>
                <h2 className="text-2xl font-black">پنل کنترل سوپر ادمین (Super Admin)</h2>
              </div>
              
              {/* Server health metrics banner */}
              <div className="flex gap-4 text-xs font-mono">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl">دیتابیس: متصل</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl">کرون‌جاب: فعال</span>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-xl">سرور: سالم (۹۹.۹٪)</span>
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

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all"
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
                      const customPlan = {
                        id: newId,
                        name: "پلن جدید سفارشی اسمارت جیم",
                        priceToman: 4500000,
                        priceIrr: 45000000,
                        durationMonths: 6,
                        features: ["کاربران نامحدود", "پشتیبانی تیکتی VIP", "آنالیز فیزیکی هوشمند", "اتصال درگاه پرداخت اختصاصی"],
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
                          <td className="py-4 text-slate-400 text-right">
                            <input
                              type="text"
                              value={plan.features.join(", ")}
                              onChange={(e) => {
                                const val = e.target.value;
                                const featuresList = val.split(",").map(f => f.trim()).filter(Boolean);
                                setSubscriptionPlans(subscriptionPlans.map(p => p.id === plan.id ? { ...p, features: featuresList } : p));
                              }}
                              className="bg-slate-950 border border-white/10 px-3 py-1.5 rounded-lg text-slate-200 w-full text-xs font-bold text-right"
                              placeholder="مطلب ۱، مطلب ۲، مطلب ۳"
                            />
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
                    onClick={() => alert("تمامی تنظیمات برندینگ، متون صفحه فرود و درگاه‌های زرین‌پال و سپ با موفقیت ذخیره شدند و روی کل پلتفرم اعمال گردیدند.")}
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
                
                // Match dynamically generated or demo credentials
                if ((u === "oxygen" && p === "123") || 
                    (generatedClubCredentials && u === generatedClubCredentials.username && p === generatedClubCredentials.password)) {
                  setLoggedInTenant({
                    id: u === "oxygen" ? "oxygen" : u,
                    username: u,
                    clubName: u === "oxygen" ? "باشگاه مدرن اکسیژن" : generatedClubCredentials?.clubName,
                    planName: u === "oxygen" ? "طلایی سالانه" : purchasedPlan?.name,
                    features: u === "oxygen" ? ["کاربران نامحدود", "پشتیبانی تیکتی VIP", "آنالیز فیزیکی هوشمند", "اتصال درگاه پرداخت اختصاصی"] : (purchasedPlan?.features || [])
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
                  onClick={() => setShowTenantBrandModal(true)}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-xl border border-white/10"
                >
                  ⚙️ شخصی‌سازی برند باشگاه
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
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">🟢 فعال در لایسنس</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-slate-500 block">پشتیبانی و تیکت ابری</span>
                    {!(loggedInTenant.planName && loggedInTenant.planName.includes("برنزی")) ? (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">🟢 فعال در لایسنس</span>
                    ) : (
                      <span className="text-xs text-red-400 font-bold flex items-center gap-1">🔒 غیرفعال (نیاز به ارتقا)</span>
                    )}
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-slate-500 block">مدیریت مربیان و امور مالی</span>
                    {(loggedInTenant.planName && (loggedInTenant.planName.includes("طلایی") || loggedInTenant.planName.includes("سالانه"))) ? (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">🟢 فعال در لایسنس</span>
                    ) : (
                      <span className="text-xs text-red-400 font-bold flex items-center gap-1">🔒 غیرفعال (نیاز به طلایی)</span>
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
                  } else {
                    setTenantSubTab("info");
                  }
                }}
                className={`px-6 py-3 font-bold text-xs transition-all border-b-2 shrink-0 ${tenantSubTab === "info" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-200"} ${subscriptionDaysLeft === 0 ? "opacity-40" : ""}`}
              >
                🕒 ساعت کاری و آدرس باشگاه {subscriptionDaysLeft === 0 && "🔒"}
              </button>
              <button
                onClick={() => {
                  if (subscriptionDaysLeft === 0) {
                    alert("🚨 اشتراک باشگاه شما منقضی شده است! لطفاً ابتدا اشتراک خود را تمدید کنید.");
                  } else if (loggedInTenant.planName && loggedInTenant.planName.includes("برنزی")) {
                    alert("❌ قابلیت پشتیبانی و تیکت ابری در لایسنس پایه (برنزی) شما فعال نیست. لطفاً اشتراک خود را به پلن نقره‌ای یا طلایی ارتقا دهید.");
                  } else {
                    setTenantSubTab("support");
                  }
                }}
                className={`px-6 py-3 font-bold text-xs transition-all border-b-2 shrink-0 ${tenantSubTab === "support" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-200"} ${(subscriptionDaysLeft === 0 || (loggedInTenant.planName && loggedInTenant.planName.includes("برنزی"))) ? "opacity-40" : ""}`}
              >
                🎫 تیکت و پشتیبانی ابری {(subscriptionDaysLeft === 0 || (loggedInTenant.planName && loggedInTenant.planName.includes("برنزی"))) && "🔒"}
              </button>
              <button
                onClick={() => {
                  if (subscriptionDaysLeft === 0) {
                    alert("🚨 اشتراک باشگاه شما منقضی شده است! دسترسی به مدیریت مربیان تا زمان تمدید اشتراک مسدود است.");
                  } else {
                    setTenantSubTab("coaches");
                  }
                }}
                className={`px-6 py-3 font-bold text-xs transition-all border-b-2 shrink-0 ${tenantSubTab === "coaches" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-slate-200"} ${subscriptionDaysLeft === 0 ? "opacity-40" : ""}`}
              >
                🏋️‍♂️ مدیریت مربیان و ریز درآمد {subscriptionDaysLeft === 0 && "🔒"}
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
                <span className="text-[9px] block text-emerald-400 mt-1">از درگاه پرداخت مستقیم</span>
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
                  {bookings.map((booking) => (
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
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold">بوفه هوشمند و انبارداری فروشگاهی (Supplement Store)</h3>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">امکان پرداخت از کیف‌پول</span>
                </div>

                {/* Store Products List */}
                <div className="space-y-3 max-h-[180px] overflow-y-auto">
                  {storeProducts.map((p) => (
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
                  tickets={tickets}
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
                onClick={() => setCoachSubView("ai_generation")}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${coachSubView === "ai_generation" ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg shadow-emerald-950/40" : "bg-slate-900/50 text-slate-400 hover:text-slate-200 border border-white/5"}`}
              >
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse animate-duration-1000" />
                طراحی برنامه هوشمند با هوش مصنوعی (AI Coach)
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
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Activity className="w-5 h-5 text-violet-400" />
                  <h3 className="text-sm font-bold">پرونده پزشکی و آنالیز فیزیکی شاگرد: آرش احمدی</h3>
                </div>

                {/* Simulated measurements logs */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-2 bg-white/5 rounded-xl">
                      <span className="text-[9px] text-slate-400 block">شاخص توده بدنی (BMI)</span>
                      <span className="text-sm font-bold text-white">۲۴.۱ (سالم)</span>
                    </div>
                    <div className="p-2 bg-white/5 rounded-xl">
                      <span className="text-[9px] text-slate-400 block">متابولیسم پایه (BMR)</span>
                      <span className="text-sm font-bold text-white">۱,۷۸۰ کالری</span>
                    </div>
                    <div className="p-2 bg-white/5 rounded-xl">
                      <span className="text-[9px] text-slate-400 block">درصد چربی بدن</span>
                      <span className="text-sm font-bold text-emerald-400">۱۳.۵٪</span>
                    </div>
                  </div>

                  {/* Body tape measurements details */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-300 block">سایز دور تا دور عضلات (سانتی‌متر)</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-[10px]">
                      <div className="bg-slate-900 p-1.5 rounded-lg">دور بازو: ۴۱ سانتی‌متر</div>
                      <div className="bg-slate-900 p-1.5 rounded-lg">دور سینه: ۱۱۲ سانتی‌متر</div>
                      <div className="bg-slate-900 p-1.5 rounded-lg">دور کمر: ۸۲ سانتی‌متر</div>
                      <div className="bg-slate-900 p-1.5 rounded-lg">دور ران: ۶۲ سانتی‌متر</div>
                    </div>
                  </div>

                  {/* Body Comparison Note */}
                  <div className="p-3 bg-blue-950/40 border border-blue-900/30 rounded-xl">
                    <span className="font-bold text-blue-300 block mb-1">یادداشت مربی برای آرش احمدی:</span>
                    <p className="text-slate-400 leading-relaxed text-[10px]">
                      نسبت به ماه گذشته دور کمر ۲ سانتی‌متر کاهش و دور بازو ۱ سانتی‌متر افزایش یافته است. این یعنی کاهش چربی همراه با افزایش همزمان حجم خشک عضله. برنامه غذایی کات به خوبی عمل کرده است.
                    </p>
                  </div>
                </div>
              </div>

              {/* Complete exercises database index search */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-bold">بانک اطلاعاتی و کتابخانه حرکات (Exercises Database)</h3>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
                  <input 
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="جستجو در بین هزاران حرکت بدنسازی..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Simulated list of search results */}
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {EXERCISES.filter(ex => 
                    ex.name.includes(globalSearch) || 
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
                        {workoutPrograms.map((p) => (
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
                        {nutritionPlans.map((n) => (
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
                    <span className="text-[10px] text-slate-500">{members.length} ورزشکار ثبت شده</span>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {members.map((member) => (
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
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
                      <label className="text-xs text-slate-400 block mb-1 font-medium">خلاصه و تمرکز اصلی برنامه</label>
                      <input 
                        type="text"
                        value={mWorkoutSummary}
                        onChange={(e) => setMWorkoutSummary(e.target.value)}
                        placeholder="مانند: افزایش حجم تفکیکی عضلات بالاتنه به همراه کات ملایم"
                        className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                      />
                    </div>
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
                              {EXERCISES.map(e => (
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
                              const selectedObj = EXERCISES.find(e => e.id === mExId);
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
                        const finalObj = {
                          id: newId,
                          title: mWorkoutTitle,
                          summary: mWorkoutSummary || "برنامه بدنسازی تمرینی طراحی شده دستی",
                          createdBy: "پوریا کریمی",
                          assignedTo: "ورزشکاران منتخب",
                          schedule: mWorkoutDays
                        };

                        setWorkoutPrograms([finalObj, ...workoutPrograms]);
                        setCoachSubView("directory");
                        
                        // Clear inputs
                        setMWorkoutTitle("");
                        setMWorkoutSummary("");
                        setMWorkoutDays([]);

                        alert(`برنامه تمرینی "${finalObj.title}" با موفقیت ذخیره شد و در بانک برنامه‌های باشگاه جهت تخصیص قرار گرفت!`);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-lg shadow-indigo-950"
                    >
                      💾 ذخیره و انتشار سراسری برنامه تمرینی بدنسازی
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

                  <div className="grid md:grid-cols-2 gap-4">
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
                          shoppingList: mNutShopping.split(",").map(x => x.trim()).filter(Boolean)
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
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                clubInfo={loggedInTenant}
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
                    {attendanceRecords.map((att) => (
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

    </div>
  );
}

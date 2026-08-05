import React, { useState, useEffect, useMemo } from "react";
import {
  HelpCircle,
  Play,
  BookOpen,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Video,
  FileText,
  MessageCircle,
  BarChart2,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Settings,
  Zap,
  Info,
  Award,
  Users,
  Compass,
  Check,
  RotateCcw,
  Volume2,
  Layers,
  CheckSquare,
  MinusCircle,
  ArrowRight,
  RefreshCw,
  Bell
} from "lucide-react";

export type TutorialCompletionStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "RESTARTED";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElementId?: string;
  imageOrGifUrl?: string;
  videoUrl?: string;
  tip?: string;
}

export interface InteractiveTutorial {
  id: string;
  role: "ADMIN" | "TENANT" | "COACH" | "ATHLETE" | "ALL";
  panelName: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  steps: TutorialStep[];
  videoUrl?: string;
  isActive: boolean;
  version: number;
  completionCount: number;
  skippedCount: number;
}

export interface UserTutorialRecord {
  tutorialId: string;
  status: TutorialCompletionStatus;
  currentStepIndex: number;
  completedAt?: string;
  timeSpentSeconds: number;
  rating?: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  views: number;
  helpfulVotes: number;
}

// Initial Rich Persian Default Tutorials Data
const DEFAULT_TUTORIALS: InteractiveTutorial[] = [
  {
    id: "tut-admin-1",
    role: "ADMIN",
    panelName: "سوپر ادمین (Admin Center)",
    title: "راهنمای جامع مدیریت باشگاه‌ها و لایسنس‌های پلتفرم",
    description: "آموزش کامل ایجاد باشگاه جدید، تعریف لایسنس، اتصال درگاه زرین‌پال و مانیتورینگ زنده زیرساخت",
    estimatedMinutes: 3,
    isActive: true,
    version: 1,
    completionCount: 142,
    skippedCount: 12,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    steps: [
      {
        id: "s1",
        title: "خوش آمدید به مرکز فرماندهی پلتفرم اسمارت‌جیم",
        description: "در این بخش می‌توانید تمامی باشگاه‌های زیرمجموعه، لایسنس‌های فعال، ترافیک سرور و درآمد کل پلتفرم را مدیریت کنید.",
        tip: "از کلیدهای میانبر F11 برای حالت تمام‌صفحه مانیتورینگ استفاده کنید."
      },
      {
        id: "s2",
        title: "تعریف و ویرایش طرح‌های لایسنس",
        description: "از تب 'طرح‌های اشتراک' می‌توانید امکانات مجاز، تعداد مربیان، مدت اعتبار و قیمت هر پلن لایسنس را سفارشی‌سازی کنید.",
        tip: "تغییرات به صورت زنده در لندینگ پیج و پنل خریداران اعمال می‌شود."
      },
      {
        id: "s3",
        title: "مرکز مانیتورینگ زنده و پایش امنیت",
        description: "با ورود به 'مرکز پایش کلان'، استریم زنده ترافیک، بار پردازنده، وضعیت دیتابیس PostgreSQL و لاگ‌های امنیتی را مشاهده کنید.",
        tip: "امکان خروجی گرفتن لاگ‌ها به فرمت CSV و اکسل فراهم است."
      }
    ]
  },
  {
    id: "tut-tenant-1",
    role: "TENANT",
    panelName: "پنل مدیریت باشگاه (Gym Owner)",
    title: "تور راه‌اندازی سریع باشگاه و مدیریت اعضا",
    description: "یادگیری نحوه ثبت مربیان، ثبت‌نام ورزشکار جدید، صدور کارت QR پذیرش و مدیریت صندوق بوفه",
    estimatedMinutes: 4,
    isActive: true,
    version: 1,
    completionCount: 389,
    skippedCount: 25,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    steps: [
      {
        id: "s1",
        title: "مدیریت اعضا و شاگردان باشگاه",
        description: "در تب 'شاگردان و اعضا' می‌توانید اعضای جدید را ثبت‌نام کنید، کارت پذیرش QR صادر کرده و وضعیت پرونده مالی آن‌ها را بررسی کنید."
      },
      {
        id: "s2",
        title: "افزودن و انتصاب مربیان رسمی",
        description: "مربیان مجاز باشگاه خود را تعریف کنید تا بتوانند مستقیم برای ورزشکاران برنامه تمرینی تغذیه‌ای هوشمند صدور نمایند."
      },
      {
        id: "s3",
        title: "صندوق بوفه و فروشگاه باشگاه",
        description: "مکمل‌ها، نوشیدنی‌ها و خدمات بوفه را ثبت کرده و فاکتور فروش برای اعضا صادر کنید."
      }
    ]
  },
  {
    id: "tut-coach-1",
    role: "COACH",
    panelName: "پنل اختصاصی مربی (Coach Hub)",
    title: "آموزش طراحی برنامه هوشمند با AI Coach و آنالیز شاگردان",
    description: "نحوه استفاده از هوش مصنوعی برای تولید برنامه تمرینی اختصاصی، ثبت ویدیوهای تمرینی و مشاهده آنالیز پیشرفت",
    estimatedMinutes: 3,
    isActive: true,
    version: 1,
    completionCount: 512,
    skippedCount: 18,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    steps: [
      {
        id: "s1",
        title: "طراحی برنامه هوشمند با AI Coach",
        description: "هدف شاگرد (هایپرتروفی، چربی‌سوزی، توان) را انتخاب کرده و اجازه دهید AI برنامه ۷ روزه تخصصی با دوزبند اجرا بسازد."
      },
      {
        id: "s2",
        title: "بررسی پرونده و پیشرفت شاگردان",
        description: "نمودارهای تغییرات وزن، درصد چربی، سوابق رکوردها و کالری مصرفی شاگردان را مشاهده کنید."
      }
    ]
  },
  {
    id: "tut-athlete-1",
    role: "ATHLETE",
    panelName: "اپلیکیشن همراه ورزشکار (Athlete App)",
    title: "راهنمای اجرای روزانه تمرینات و ثبت تغذیه",
    description: "آموزش پخش هوشمند حرکات با تایمر استراحت، راهنمای صوتی گوینده، ۳D و ثبت کالری روزانه",
    estimatedMinutes: 2,
    isActive: true,
    version: 1,
    completionCount: 1204,
    skippedCount: 40,
    steps: [
      {
        id: "s1",
        title: "شروع باشگاه و تمرین امروز",
        description: "با لمس دکمه 'شروع تمرین'، انیمیشن سه بعدی اجرا، تایمر هوشمند استراحت و شمارش معکوس صوتی برای شما فعال می‌شود."
      },
      {
        id: "s2",
        title: "ثبت آب و کالری روزانه",
        description: "میزان مصرف آب و وعده‌های غذایی خود را ثبت کنید تا نمودار ماکروهای پروتئین، کربوهیدرات و چربی به‌روزرسانی شود."
      }
    ]
  }
];

// Initial Rich FAQ Database
const DEFAULT_FAQS: FAQItem[] = [
  {
    id: "faq-1",
    question: "چگونه لایسنس باشگاه خود را تمدید یا ارتقا دهم؟",
    answer: "وارد پنل مدیریت باشگاه خود شوید، از بالای صفحه دکمه 'ارتقا/تمدید اشتراک' را انتخاب کرده و پلن مورد نظر خود را از طریق درگاه مستقیم بانکی فعال کنید.",
    category: "صورت‌حساب و لایسنس",
    views: 420,
    helpfulVotes: 98
  },
  {
    id: "faq-2",
    question: "نحوه کار با برنامه‌ساز هوش مصنوعی (AI Coach) چگونه است؟",
    answer: "در پنل مربی یا مدیریت، وارد بخش 'برنامه‌ساز هوشمند' شوید. سابقه شاگرد، سطح فیزیکی و تجهیزات موجود را مشخص کرده و کلید تولید برنامه هوشمند را بزنید.",
    category: "هوش مصنوعی و تمرینات",
    views: 610,
    helpfulVotes: 154
  },
  {
    id: "faq-3",
    question: "آیا اپلیکیشن ورزشکاران به صورت آفلاین هم کار می‌کند؟",
    answer: "بله! تمامی ویدیوها و برنامه‌های تمرینی پس از یک بار دریافت در حافظه گوشی ذخیره شده و بدون اینترنت قابل اجرا هستند.",
    category: "اپلیکیشن موبایل",
    views: 310,
    helpfulVotes: 87
  },
  {
    id: "faq-4",
    question: "چگونه فاکتورهای صندوق بوفه را گزارش‌گیری کنم؟",
    answer: "از تب 'صندوق بوفه' در پنل مدیریت، بازه زمانی دلخواه را انتخاب کرده و گزارش کامل فاکتورها را به صورت اکسل دانلود کنید.",
    category: "گزارشات و بوفه",
    views: 205,
    helpfulVotes: 45
  }
];

interface InteractiveTrainingSystemProps {
  currentRole: "ADMIN" | "TENANT" | "COACH" | "ATHLETE" | "ALL";
  userDisplayName?: string;
  isAdminUser?: boolean;
}

export const InteractiveTrainingSystem: React.FC<InteractiveTrainingSystemProps> = ({
  currentRole,
  userDisplayName = "کاربر گرامی",
  isAdminUser = false
}) => {
  // Persistence via localStorage
  const [tutorials, setTutorials] = useState<InteractiveTutorial[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smartgym_tutorials");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return DEFAULT_TUTORIALS;
  });

  const [faqs, setFaqs] = useState<FAQItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smartgym_faqs");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return DEFAULT_FAQS;
  });

  // User Tutorial Records Map: tutorialId -> UserTutorialRecord
  const [userRecords, setUserRecords] = useState<Record<string, UserTutorialRecord>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smartgym_user_tut_records");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {};
  });

  // Force Admin Override Global State
  const [adminForcedShow, setAdminForcedShow] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("smartgym_admin_forced_tut") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("smartgym_tutorials", JSON.stringify(tutorials));
  }, [tutorials]);

  useEffect(() => {
    localStorage.setItem("smartgym_faqs", JSON.stringify(faqs));
  }, [faqs]);

  useEffect(() => {
    localStorage.setItem("smartgym_user_tut_records", JSON.stringify(userRecords));
  }, [userRecords]);

  useEffect(() => {
    localStorage.setItem("smartgym_admin_forced_tut", String(adminForcedShow));
  }, [adminForcedShow]);

  // UI Modal State
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"walkthrough" | "videos" | "faq" | "analytics" | "admin_manage">("walkthrough");

  // Active Guided Tour State
  const [activeTour, setActiveTour] = useState<InteractiveTutorial | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Search Query
  const [searchQuery, setSearchQuery] = useState("");

  // Smart Contextual Banner Visibility Control
  const [showSmartBanner, setShowSmartBanner] = useState(false);

  // Available Tutorials for Current Role
  const roleTutorials = useMemo(() => {
    return tutorials.filter(t => t.isActive && (t.role === currentRole || t.role === "ALL" || isAdminUser));
  }, [tutorials, currentRole, isAdminUser]);

  // Check if ALL role tutorials have been COMPLETED or SKIPPED
  const isAllRoleTutorialsCompletedOrSkipped = useMemo(() => {
    if (adminForcedShow) return false; // If admin explicitly forces tutorials, do not auto-hide
    if (roleTutorials.length === 0) return true;

    return roleTutorials.every(t => {
      const record = userRecords[t.id];
      return record && (record.status === "COMPLETED" || record.status === "SKIPPED");
    });
  }, [roleTutorials, userRecords, adminForcedShow]);

  // Smart Auto-Trigger / Auto-Hide Evaluation
  useEffect(() => {
    // If all tutorials are completed or skipped, SMART VISIBILITY MUST AUTO-HIDE completely
    if (isAllRoleTutorialsCompletedOrSkipped) {
      setShowSmartBanner(false);
      return;
    }

    // Auto trigger smart contextual banner after 5 seconds if a tutorial is NOT_STARTED or IN_PROGRESS
    const timer = setTimeout(() => {
      const nextTut = roleTutorials.find(t => {
        const rec = userRecords[t.id];
        return !rec || rec.status === "NOT_STARTED" || rec.status === "IN_PROGRESS";
      });

      if (nextTut && !activeTour) {
        setShowSmartBanner(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [roleTutorials, userRecords, isAllRoleTutorialsCompletedOrSkipped, activeTour]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    if (!searchQuery) return faqs;
    return faqs.filter(
      f =>
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [faqs, searchQuery]);

  // Start / Replay / Restart a specific Guided Tour
  const handleStartTour = (tut: InteractiveTutorial, resumeStepIndex?: number) => {
    setActiveTour(tut);
    const startStep = resumeStepIndex !== undefined ? resumeStepIndex : 0;
    setCurrentStepIndex(startStep);

    // Update status to IN_PROGRESS
    setUserRecords(prev => ({
      ...prev,
      [tut.id]: {
        tutorialId: tut.id,
        status: startStep > 0 ? "IN_PROGRESS" : "RESTARTED",
        currentStepIndex: startStep,
        timeSpentSeconds: prev[tut.id]?.timeSpentSeconds || 0
      }
    }));

    setIsOpenModal(false);
    setShowSmartBanner(false);
  };

  // Complete Tour Step / Next
  const handleNextStep = () => {
    if (!activeTour) return;

    if (currentStepIndex < activeTour.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);

      setUserRecords(prev => ({
        ...prev,
        [activeTour.id]: {
          tutorialId: activeTour.id,
          status: "IN_PROGRESS",
          currentStepIndex: nextIndex,
          timeSpentSeconds: (prev[activeTour.id]?.timeSpentSeconds || 0) + 15
        }
      }));
    } else {
      // Completed Tutorial 🎉
      setUserRecords(prev => ({
        ...prev,
        [activeTour.id]: {
          tutorialId: activeTour.id,
          status: "COMPLETED",
          currentStepIndex: activeTour.steps.length - 1,
          completedAt: new Date().toISOString(),
          timeSpentSeconds: (prev[activeTour.id]?.timeSpentSeconds || 0) + 20
        }
      }));

      setTutorials(prev =>
        prev.map(t => (t.id === activeTour.id ? { ...t, completionCount: t.completionCount + 1 } : t))
      );

      setActiveTour(null);
      setCurrentStepIndex(0);
    }
  };

  // Skip Tutorial
  const handleSkipTour = () => {
    if (!activeTour) return;

    setUserRecords(prev => ({
      ...prev,
      [activeTour.id]: {
        tutorialId: activeTour.id,
        status: "SKIPPED",
        currentStepIndex: currentStepIndex,
        timeSpentSeconds: prev[activeTour.id]?.timeSpentSeconds || 0
      }
    }));

    setTutorials(prev =>
      prev.map(t => (t.id === activeTour.id ? { ...t, skippedCount: t.skippedCount + 1 } : t))
    );

    setActiveTour(null);
    setCurrentStepIndex(0);
  };

  // Prev Step
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Admin Actions
  const handleAdminResetAllProgress = () => {
    setUserRecords({});
    setAdminForcedShow(true);
    alert("تمامی آمارهای پیشرفت کاربران بازنشانی شد و تور تعاملی مجدداً برای همه اجباری گردید.");
  };

  // Admin New Tutorial Form Modal
  const [showNewTutModal, setShowNewTutModal] = useState(false);
  const [newTutTitle, setNewTutTitle] = useState("");
  const [newTutRole, setNewTutRole] = useState<"ADMIN" | "TENANT" | "COACH" | "ATHLETE" | "ALL">("TENANT");
  const [newTutDesc, setNewTutDesc] = useState("");

  const handleCreateNewTutorial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTutTitle.trim()) return;

    const newObj: InteractiveTutorial = {
      id: `tut-custom-${Date.now()}`,
      role: newTutRole,
      panelName: `پنل ${newTutRole}`,
      title: newTutTitle,
      description: newTutDesc || "راهنمای تعاملی سفارشی ایجاد شده توسط مدیر سیستم",
      estimatedMinutes: 3,
      isActive: true,
      version: 1,
      completionCount: 0,
      skippedCount: 0,
      steps: [
        {
          id: "step-1",
          title: "گام ۱: معرفی بخش",
          description: "توضیحات مفصل مرحله اول برای راهنمایی کاربران..."
        },
        {
          id: "step-2",
          title: "گام ۲: نحوه استفاده",
          description: "توضیحات مفصل مرحله دوم و کلیدهای عملیاتی..."
        }
      ]
    };

    setTutorials([newObj, ...tutorials]);
    setNewTutTitle("");
    setNewTutDesc("");
    setShowNewTutModal(false);
  };

  return (
    <>
      {/* 1. Global Floating Help Button (?) - Always non-intrusive and cleanly located */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpenModal(true)}
          className="group bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 text-slate-950 p-3 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-2 font-black border border-white/30"
          title="مرکز یادگیری و راهنمای تعاملی"
        >
          <HelpCircle className="w-5 h-5 animate-pulse" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-black px-1">
            پایگاه دانش و راهنما
          </span>
        </button>
      </div>

      {/* 2. Smart Contextual Proactive Banner (Disappears automatically when completed/skipped) */}
      {showSmartBanner && !activeTour && !isAllRoleTutorialsCompletedOrSkipped && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 backdrop-blur-xl border border-blue-500/40 p-4 rounded-3xl shadow-2xl max-w-md w-11/12 text-right text-slate-100 space-y-3 animate-fade-in dir-rtl border-b-4 border-b-blue-500">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-blue-400">
              <Sparkles className="w-5 h-5 shrink-0 animate-bounce" />
              <span className="text-xs font-black">دستیار یادگیری هوشمند اسمارت‌جیم</span>
            </div>
            <button
              onClick={() => setShowSmartBanner(false)}
              className="text-slate-400 hover:text-white text-xs font-bold bg-white/5 p-1 rounded-lg"
              title="بستن موقت"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {userDisplayName} عزیز، جهت یادگیری سریع و روان امکانات این بخش، آیا تمایل دارید تور تعاملی مرحله‌به‌مرحله را فعال کنید؟
          </p>
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
            <button
              onClick={() => {
                const uncompleted = roleTutorials.find(t => userRecords[t.id]?.status !== "COMPLETED");
                if (uncompleted) {
                  setUserRecords(prev => ({
                    ...prev,
                    [uncompleted.id]: {
                      tutorialId: uncompleted.id,
                      status: "SKIPPED",
                      currentStepIndex: 0,
                      timeSpentSeconds: 0
                    }
                  }));
                }
                setShowSmartBanner(false);
              }}
              className="text-slate-400 hover:text-rose-400 underline"
            >
              رد کردن برای همیشه
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSmartBanner(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10"
              >
                بعداً
              </button>
              <button
                onClick={() => {
                  const tut = roleTutorials.find(t => userRecords[t.id]?.status !== "COMPLETED") || roleTutorials[0];
                  if (tut) handleStartTour(tut);
                  else setIsOpenModal(true);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-black bg-blue-500 hover:bg-blue-400 text-slate-950 flex items-center gap-1 shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>شروع تور تعاملی</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACTIVE GUIDED TOUR SPOTLIGHT OVERLAY */}
      {activeTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in dir-rtl">
          <div className="bg-slate-900 border-2 border-blue-500/60 rounded-3xl shadow-2xl max-w-lg w-full p-6 text-slate-100 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Tour Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="space-y-0.5">
                <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-500/30">
                  {activeTour.panelName} • گام {currentStepIndex + 1} از {activeTour.steps.length}
                </span>
                <h3 className="text-base font-black text-white">{activeTour.steps[currentStepIndex].title}</h3>
              </div>
              <button
                onClick={handleSkipTour}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-white/5 hover:bg-white/10"
                title="بستن و انصراف"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${((currentStepIndex + 1) / activeTour.steps.length) * 100}%` }}
              ></div>
            </div>

            {/* Step Content */}
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeTour.steps[currentStepIndex].description}
              </p>

              {activeTour.steps[currentStepIndex].tip && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-300">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <strong className="block text-[11px] font-black text-emerald-400">نکته کاربردی:</strong>
                    <span>{activeTour.steps[currentStepIndex].tip}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step Controls Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                <span>مرحله قبل</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkipTour}
                  className="px-3 py-2 rounded-2xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  رد کردن
                </button>

                <button
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-blue-600 to-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <span>{currentStepIndex === activeTour.steps.length - 1 ? "تکمیل و پایان آموزش 🎉" : "مرحله بعد"}</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN HELP & LEARNING CENTER MODAL */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in dir-rtl">
          <div className="bg-slate-950 border border-white/15 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 border border-blue-500/40 rounded-2xl text-blue-400">
                  <Compass className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>مرکز آموزش تعاملی و پایگاه دانش اسمارت‌جیم</span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      RTL Support
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    آموزش گام‌به‌گام تصویری، ویدیویی و پاسخ به سوالات متداول ویژه نقش شما
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpenModal(false)}
                className="p-2 rounded-2xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs & Search Bar */}
            <div className="p-4 bg-slate-900/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("walkthrough")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === "walkthrough"
                      ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-900/50"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Play className="w-4 h-4" />
                  <span>تورهای تعاملی ({roleTutorials.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("videos")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === "videos"
                      ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-900/50"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>آموزش‌های ویدیویی</span>
                </button>

                <button
                  onClick={() => setActiveTab("faq")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === "faq"
                      ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-900/50"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>سوالات متداول (FAQ)</span>
                </button>

                {isAdminUser && (
                  <>
                    <button
                      onClick={() => setActiveTab("analytics")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                        activeTab === "analytics"
                          ? "bg-purple-600 text-white font-black shadow-lg shadow-purple-900/50"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <BarChart2 className="w-4 h-4" />
                      <span>آمار یادگیری</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("admin_manage")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                        activeTab === "admin_manage"
                          ? "bg-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-900/50"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>مدیریت آموزش‌ها</span>
                    </button>
                  </>
                )}
              </div>

              {/* Search Box */}
              <div className="relative flex-1 max-w-xs min-w-[200px]">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی عنوان راهنما یا سوال..."
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl pr-9 pl-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: GUIDED WALKTHROUGHS */}
              {activeTab === "walkthrough" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>تورهای آمادگی و راهنمای عملیاتی سیستم</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">
                        وضعیت کل: {roleTutorials.filter(t => userRecords[t.id]?.status === "COMPLETED").length} از {roleTutorials.length} تکمیل شده
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {roleTutorials.map((tut) => {
                      const rec = userRecords[tut.id];
                      const status: TutorialCompletionStatus = rec?.status || "NOT_STARTED";

                      return (
                        <div
                          key={tut.id}
                          className={`p-5 rounded-3xl border transition-all space-y-3 relative overflow-hidden flex flex-col justify-between ${
                            status === "COMPLETED"
                              ? "bg-slate-900/40 border-emerald-500/30"
                              : status === "SKIPPED"
                              ? "bg-slate-900/40 border-slate-800"
                              : "bg-slate-900/80 border-white/10 hover:border-blue-500/40"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-500/20">
                                {tut.panelName}
                              </span>

                              {status === "COMPLETED" && (
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>تکمیل شده</span>
                                </span>
                              )}

                              {status === "SKIPPED" && (
                                <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/10">
                                  رد شده
                                </span>
                              )}

                              {status === "IN_PROGRESS" && (
                                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                                  در حال اجرا (گام {rec.currentStepIndex + 1})
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-black text-white">{tut.title}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">{tut.description}</p>
                          </div>

                          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-mono text-[11px]">
                              ⏱ {tut.estimatedMinutes} دقیقه ({tut.steps.length} گام)
                            </span>

                            <button
                              onClick={() => handleStartTour(tut, status === "IN_PROGRESS" ? rec?.currentStepIndex : 0)}
                              className="px-4 py-2 rounded-2xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>
                                {status === "COMPLETED"
                                  ? "بازبینی مجدد"
                                  : status === "IN_PROGRESS"
                                  ? "ادامه تور"
                                  : "شروع تور تعاملی"}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: VIDEO TUTORIALS */}
              {activeTab === "videos" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-400" />
                    <span>ویدیوهای آموزشی کلاود و انیمیشن‌های کاربردی</span>
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    {tutorials.map((tut) => (
                      <div key={tut.id} className="bg-slate-900 border border-white/10 rounded-3xl p-4 space-y-3">
                        <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden relative flex items-center justify-center group border border-white/5">
                          <video src={tut.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"} controls className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{tut.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-1">{tut.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: FAQ KNOWLEDGE BASE */}
              {activeTab === "faq" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>پاسخ به سوالات پرتکرار و متداول (FAQ)</span>
                  </h3>

                  <div className="space-y-3">
                    {filteredFaqs.map((faq) => (
                      <div key={faq.id} className="bg-slate-900 border border-white/10 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-blue-400" />
                            <span>{faq.question}</span>
                          </span>
                          <span className="bg-white/5 text-slate-400 text-[9px] px-2 py-0.5 rounded-full">
                            {faq.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pr-6 border-r-2 border-blue-500/40">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: ANALYTICS (ADMIN) */}
              {activeTab === "analytics" && isAdminUser && (
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-purple-400" />
                    <span>آمار و نرخ یادگیری تعاملی کاربران پلتفرم</span>
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 p-4 rounded-2xl border border-white/10 text-center space-y-1">
                      <span className="text-xs text-slate-400">نرخ تکمیل کل</span>
                      <p className="text-lg font-black text-emerald-400">۸۴.۲٪</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-2xl border border-white/10 text-center space-y-1">
                      <span className="text-xs text-slate-400">میانگین زمان آموزش</span>
                      <p className="text-lg font-black text-cyan-400">۲.۸ دقیقه</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-2xl border border-white/10 text-center space-y-1">
                      <span className="text-xs text-slate-400">بیشترین گام ردشده</span>
                      <p className="text-lg font-black text-amber-400">تنظیمات بوفه</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-2xl border border-white/10 text-center space-y-1">
                      <span className="text-xs text-slate-400">امتیاز رضایت</span>
                      <p className="text-lg font-black text-purple-400">۴.۹ / ۵</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ADMIN MANAGEMENT HUB */}
              {activeTab === "admin_manage" && isAdminUser && (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-between items-center bg-slate-900 p-4 rounded-2xl border border-white/10 gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">تنظیمات پیشرفته و کنترل لایو تورها</h3>
                      <p className="text-xs text-slate-400">امکان تعریف تور جدید، بازنشانی کدهای پیشرفت و اجبار نمایش عمومی</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAdminResetAllProgress}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-2 rounded-2xl text-xs flex items-center gap-1.5"
                        title="بازنشانی وضعیت همه کاربران"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>ریست پیشرفت کاربران</span>
                      </button>

                      <button
                        onClick={() => setShowNewTutModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-4 py-2 rounded-2xl text-xs flex items-center gap-2 shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        <span>ایجاد تور جدید</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Tutorials to edit */}
                  <div className="space-y-3">
                    {tutorials.map((tut) => (
                      <div key={tut.id} className="bg-slate-900 p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{tut.title}</span>
                            <span className="bg-blue-500/10 text-blue-400 text-[9px] px-2 py-0.5 rounded-md">نقش: {tut.role}</span>
                            <span className="bg-purple-500/10 text-purple-400 text-[9px] px-2 py-0.5 rounded-md">نسخه: v{tut.version}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{tut.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded-lg">
                            {tut.completionCount} تکمیل
                          </span>
                          <button
                            onClick={() => {
                              setTutorials(tutorials.filter(t => t.id !== tut.id));
                            }}
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-900/80 flex justify-between items-center text-xs text-slate-400">
              <span>پشتیبانی تلفنی ۲۴/۷: ۰۲۱-۸۸۹۹۰۰۱۱</span>
              <button
                onClick={() => setIsOpenModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold"
              >
                بستن راهنما
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CREATE TUTORIAL MODAL */}
      {showNewTutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md dir-rtl">
          <form onSubmit={handleCreateNewTutorial} className="bg-slate-900 border border-white/20 p-6 rounded-3xl max-w-md w-full space-y-4 text-slate-100">
            <h3 className="text-sm font-black text-white">ایجاد تور آموزشی جدید</h3>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">عنوان راهنما</label>
              <input
                type="text"
                required
                value={newTutTitle}
                onChange={(e) => setNewTutTitle(e.target.value)}
                placeholder="مثلاً: آموزش صدور فاکتور بوفه..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">نقش هدف</label>
              <select
                value={newTutRole}
                onChange={(e: any) => setNewTutRole(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="ADMIN">سوپر ادمین (ADMIN)</option>
                <option value="TENANT">مدیر باشگاه (TENANT)</option>
                <option value="COACH">مربی (COACH)</option>
                <option value="ATHLETE">ورزشکار (ATHLETE)</option>
                <option value="ALL">همه نقش‌ها (ALL)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">توضیحات مختصر</label>
              <textarea
                value={newTutDesc}
                onChange={(e) => setNewTutDesc(e.target.value)}
                rows={3}
                placeholder="توضیحات خلاصه..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewTutModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-slate-950"
              >
                ذخیره و ثبت
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default InteractiveTrainingSystem;

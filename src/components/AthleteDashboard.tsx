import React, { useState, useEffect } from "react";
import { 
  Dumbbell, 
  Utensils, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  Award, 
  Droplet, 
  Plus, 
  Flame, 
  TrendingUp, 
  Calendar, 
  User, 
  Bell, 
  Calculator, 
  Sparkles, 
  Volume2, 
  ShieldAlert, 
  Check,
  Zap,
  Compass
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toPersianNums } from "../types";

// @ts-ignore
import mascotSmart from "../assets/images/mascot_smart_1783248774021.jpg";
import ExerciseAnimation from "./ExerciseAnimation";

interface AthleteDashboardProps {
  member: any;
  workoutPrograms: any[];
  nutritionPlans: any[];
  isDarkMode: boolean;
  onLogout: () => void;
  attendanceRecords: any[];
  onCheckIn: (record: any) => void;
  tenantCustomColor?: string;
  tenantBrandText?: string;
  onAddClubRevenue?: (amount: number) => void;
  onToggleDarkMode?: () => void;
  clubInfo?: any;
  subscriptionPlans?: any[];
  membershipRequests?: any[];
  onSubmitMembershipRequest?: (req: any) => void;
}

export default function AthleteDashboard({
  member,
  workoutPrograms,
  nutritionPlans,
  isDarkMode,
  onLogout,
  attendanceRecords,
  onCheckIn,
  tenantCustomColor = "emerald",
  tenantBrandText = "اسمارت جیم",
  onAddClubRevenue,
  onToggleDarkMode = () => {},
  clubInfo,
  subscriptionPlans = [],
  membershipRequests = [],
  onSubmitMembershipRequest
}: AthleteDashboardProps) {
  // Mobile Sub Tab: "workout" | "nutrition" | "stats" | "profile"
  const [subTab, setSubTab] = useState<"workout" | "nutrition" | "stats" | "profile">("workout");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  // Athlete Profile Edit States
  const [athleteName, setAthleteName] = useState(member.name);
  const [athletePhone, setAthletePhone] = useState(member.phone);
  const [athleteAvatarEmoji, setAthleteAvatarEmoji] = useState("🦁");
  const [athleteThemeColor, setAthleteThemeColor] = useState(tenantCustomColor);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [memberRemainingDays, setMemberRemainingDays] = useState(member.remainingDays !== undefined ? member.remainingDays : 24);
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  // Synchronize remaining days with parent prop
  useEffect(() => {
    if (member && member.remainingDays !== undefined) {
      setMemberRemainingDays(member.remainingDays);
    }
  }, [member]);

  // Local Stats Loggers
  const [waterCups, setWaterCups] = useState(4); // default 4 cups of 250ml = 1.0 Liter
  const [weightLogs, setWeightLogs] = useState([
    { date: "۰۳/۰۱", weight: 79.5 },
    { date: "۰۳/۰۸", weight: 78.9 },
    { date: "۰۳/۱۵", weight: 78.4 },
    { date: "۰۳/۲۲", weight: 78.1 },
    { date: "۰۳/۲۹", weight: 77.8 },
  ]);
  const [newLogWeight, setNewLogWeight] = useState("");
  const [notifications, setNotifications] = useState([
    { id: 1, text: "برنامه تمرینی کات پیشرفته توسط استاد کریمی برای شما آپدیت شد.", time: "۳ ساعت پیش", read: false },
    { id: 2, text: "وعده غذایی قبل تمرین (سیب و بادام) فراموش نشود!", time: "۴ ساعت پیش", read: true },
    { id: 3, text: "آفرین قهرمان! دیروز رکورد حضور در باشگاه را ارتقا دادی. 🔥", time: "۱ روز پیش", read: true }
  ]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Live Workout Player State
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [workoutFinished, setWorkoutFinished] = useState(false);

  // Load programs & nutrition
  const myProgram = workoutPrograms.find(p => p.id === member.assignedProgramId) || null;
  const myNutrition = nutritionPlans.find(n => n.id === member.assignedNutritionId) || null;
  const currentDay = myProgram && myProgram.schedule ? (myProgram.schedule[selectedDayIndex] || myProgram.schedule[0]) : null;

  // Weight Logging Helper
  const handleAddWeightLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogWeight) return;
    const todayJalali = "۰۴/۰۱"; // simple simulation
    setWeightLogs([...weightLogs, { date: todayJalali, weight: Number(newLogWeight) }]);
    setNewLogWeight("");
  };

  // Water increment helper
  const handleAddWater = () => {
    setWaterCups(prev => prev + 1);
  };

  const handleFinishRest = () => {
    setIsResting(false);
    setRestTimer(0);
    
    if (!myProgram || !myProgram.schedule) return;
    const currentDay = myProgram.schedule[selectedDayIndex] || myProgram.schedule[0];
    const currentEx = currentDay.exercises[currentExIndex];
    
    if (currentSetIndex < currentEx.sets.length - 1) {
      setCurrentSetIndex(prev => prev + 1);
    } else {
      // Move to next exercise
      if (currentExIndex < currentDay.exercises.length - 1) {
        setCurrentExIndex(prev => prev + 1);
        setCurrentSetIndex(0);
      } else {
        // Workout fully completed!
        setWorkoutFinished(true);
        if (!completedDays.includes(selectedDayIndex)) {
          setCompletedDays(prev => [...prev, selectedDayIndex]);
        }
        // Register successful check-in
        const newRecord = {
          id: `att_m_${Date.now()}`,
          memberId: member.id,
          memberName: member.name,
          date: "1405/04/01",
          checkInTime: "18:00",
          checkOutTime: "19:20",
          totalHours: 1.33,
          status: "PRESENT"
        };
        onCheckIn(newRecord);
      }
    }
  };

  const handleEndSet = () => {
    if (!myProgram || !myProgram.schedule) return;
    const currentDay = myProgram.schedule[selectedDayIndex] || myProgram.schedule[0];
    const currentEx = currentDay.exercises[currentExIndex];
    setRestTimer(currentEx.restDurationSeconds || 60);
    setIsResting(true);
  };

  // Timer logic for live player
  useEffect(() => {
    let interval: any;
    if (isWorkoutActive && !isResting && !workoutFinished) {
      interval = setInterval(() => {
        setWorkoutTimer(t => t + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive, isResting, workoutFinished]);

  // Rest timer countdown
  useEffect(() => {
    let interval: any;
    if (isWorkoutActive && isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(r => {
          if (r <= 1) {
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive, isResting, restTimer]);

  // Watch for rest timer ending
  useEffect(() => {
    if (isWorkoutActive && isResting && restTimer === 0) {
      handleFinishRest();
    }
  }, [isWorkoutActive, isResting, restTimer]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Design tokens based on light / dark mode
  const panelBg = isDarkMode ? "bg-slate-900/80 border-white/5 shadow-2xl" : "bg-white border-slate-200/80 shadow-md";
  const innerCardBg = isDarkMode ? "bg-slate-950/60 border-white/5" : "bg-slate-50 border-slate-200/60";
  const inputBg = isDarkMode ? "bg-slate-950 border-white/10 text-white" : "bg-white border-slate-300 text-slate-900";
  const labelColor = isDarkMode ? "text-slate-400" : "text-slate-500";
  const titleColor = isDarkMode ? "text-white" : "text-slate-900";
  const borderColor = isDarkMode ? "border-white/10" : "border-slate-200";

  // Calculate BMI
  const heightM = 1.80; // mock static heights
  const weightKg = weightLogs[weightLogs.length - 1].weight;
  const bmi = (weightKg / (heightM * heightM)).toFixed(1);

  return (
    <div className="w-full max-w-md mx-auto relative min-h-[720px] pb-24 rounded-[3rem] overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col" style={{
      background: isDarkMode ? "#0F172A" : "#F8FAFC",
      color: isDarkMode ? "#F1F5F9" : "#1E293B"
    }}>

      {/* Notifications Drawer Modal */}
      {showNotificationsModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end text-right animate-fade-in" dir="rtl">
          <div className={`p-6 rounded-t-[2.5rem] ${isDarkMode ? 'bg-slate-900 border-t border-white/10' : 'bg-white border-t border-slate-200'} space-y-4 max-h-[85%] flex flex-col shadow-2xl`}>
            
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">🔔 اعلان‌های هوشمند شما</span>
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {notifications.filter(n => !n.read).length} جدید
                </span>
              </div>
              <button 
                onClick={() => {
                  setNotifications(notifications.map(n => ({ ...n, read: true })));
                }}
                className="text-[10px] text-green-500 font-bold hover:underline"
              >
                خوانده شده همه
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`p-3.5 rounded-2xl border transition-all ${
                    notif.read 
                      ? (isDarkMode ? 'bg-slate-950/40 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500') 
                      : (isDarkMode ? 'bg-green-500/10 border-green-500/20 text-white' : 'bg-green-50/50 border-green-200/50 text-slate-900')
                  }`}
                >
                  <p className="text-xs leading-relaxed">{notif.text}</p>
                  <span className="text-[9px] text-slate-500 block mt-2 font-mono">{notif.time}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowNotificationsModal(false)}
              className="w-full bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-bold py-2.5 rounded-xl border border-white/10 text-xs transition-all mt-2"
            >
              بستن پنل اعلان‌ها
            </button>
          </div>
        </div>
      )}

      {/* Membership & Payment Drawer Modal */}
      {showMembershipModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex flex-col justify-end text-right animate-fade-in" dir="rtl">
          <div className={`p-6 rounded-t-[2.5rem] ${isDarkMode ? 'bg-slate-900 border-t border-white/10' : 'bg-white border-t border-slate-200'} space-y-4 max-h-[90%] flex flex-col shadow-2xl`}>
            
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-sm font-black text-white">💳 وضعیت شهریه و تمدید آنلاین عضویت</span>
              <button 
                onClick={() => setShowMembershipModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                بستن
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
              <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">نام کامل ورزشکار:</span>
                  <span className="text-white font-bold">{athleteName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">کد کاربری ورزشکار:</span>
                  <span className="text-white font-mono font-bold">#SG-9821</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">باشگاه مقصد:</span>
                  <span className="text-emerald-400 font-bold">{tenantBrandText}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-2 mt-1">
                  <span className="text-slate-400">اعتبار شهریه شما:</span>
                  <span className="text-amber-400 font-black font-mono">{memberRemainingDays} روز باقی‌مانده</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="font-bold text-[10px] text-slate-300 block">🛍️ یکی از بسته‌های تمدید شهریه باشگاه را انتخاب کنید:</span>
                
                {(subscriptionPlans && subscriptionPlans.length > 0 ? subscriptionPlans.map(plan => ({
                  id: plan.id,
                  label: plan.name,
                  days: (plan.durationMonths || 1) * 30,
                  price: `${toPersianNums((plan.priceToman || 0).toLocaleString())} تومان`,
                  val: plan.priceToman || 0
                })) : [
                  { id: "1month", label: "اشتراک ۱ ماهه طلایی", days: 30, price: "۴۵۰,۰۰۰ تومان", val: 450000 },
                  { id: "3month", label: "اشتراک ۳ ماهه نقره‌ای (۱۰٪ تخفیف)", days: 90, price: "۱,۲۱۵,۰۰۰ تومان", val: 1215000 },
                  { id: "12month", label: "اشتراک سالانه پلاتینیوم (۲۵٪ تخفیف)", days: 365, price: "۴,۰۵۰,۰۰۰ تومان", val: 4050000 },
                ]).map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      if (confirm(`آیا تمایل دارید وجه ${pack.price} را برای تمدید ${toPersianNums(String(pack.days))} روزه شهریه باشگاه ${tenantBrandText} پرداخت کرده و درخواست فعال‌سازی ثبت کنید؟`)) {
                        if (onSubmitMembershipRequest) {
                          onSubmitMembershipRequest({
                            id: `req_${Date.now()}`,
                            memberId: member.id,
                            memberName: member.name,
                            planName: pack.label,
                            days: pack.days,
                            priceToman: pack.val,
                            status: "PENDING",
                            date: "1405/04/04"
                          });
                          alert(`🎉 درخواست تمدید شهریه شما ثبت شد!\n\nاین درخواست جهت فعال‌سازی به پنل مدیریت باشگاه ${tenantBrandText} فرستاده شد و پس از تایید توسط مدیریت، شهریه شما به طور خودکار فعال خواهد شد.`);
                        } else {
                          // Fallback local updates if parent callback not passed
                          setMemberRemainingDays(prev => prev + pack.days);
                          if (onAddClubRevenue) {
                            onAddClubRevenue(pack.val);
                          }
                          alert(`🎉 پرداخت شما با موفقیت انجام شد!\n\nبسته تمدید ${toPersianNums(String(pack.days))} روزه روی کارت عضویت شما فعال گردید.`);
                        }
                      }
                    }}
                    className="w-full bg-slate-950 hover:bg-slate-900 border border-white/5 p-3.5 rounded-2xl flex items-center justify-between text-right hover:border-emerald-500 transition-all cursor-pointer"
                  >
                    <div>
                      <h5 className="font-black text-white text-xs">{pack.label}</h5>
                      <span className="text-[9px] text-slate-400">مدت: {toPersianNums(String(pack.days))} روز اضافه به اعتبار فعلی</span>
                    </div>
                    <span className="text-emerald-400 font-black font-mono text-xs">{pack.price}</span>
                  </button>
                ))}
              </div>

              {/* User Renewal Requests History */}
              {membershipRequests.filter(r => r.memberId === member.id).length > 0 && (
                <div className="space-y-2 bg-slate-950/40 border border-white/5 p-4 rounded-2xl text-right" dir="rtl">
                  <span className="font-bold text-[10px] text-slate-300 block">📊 سوابق درخواست‌های اخیر تمدید شهریه:</span>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {membershipRequests.filter(r => r.memberId === member.id).map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 text-[10px]">
                        <div>
                          <span className="font-bold text-white block">{req.planName}</span>
                          <span className="text-[9px] text-slate-500">{req.date} | {toPersianNums(req.priceToman.toLocaleString())} تومان</span>
                        </div>
                        <div>
                          {req.status === "PENDING" && <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">در انتظار تایید باشگاه</span>}
                          {req.status === "APPROVED" && <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">تایید و فعال شد ✓</span>}
                          {req.status === "REJECTED" && <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">رد شد</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-2xl text-[10px] text-slate-400 leading-relaxed">
                ℹ️ تراکنش‌ها به صورت مستقیم به حساب شبای متصل باشگاه {tenantBrandText} در بانک سپه یا ملت واریز شده و فاکتور چاپی در سیستم صندوقدار ثبت می‌گردد.
              </div>
            </div>

            <button 
              onClick={() => setShowMembershipModal(false)}
              className="w-full bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-bold py-2.5 rounded-xl border border-white/10 text-xs transition-all mt-2"
            >
              بستن پنل تمدید عضویت
            </button>
          </div>
        </div>
      )}
      
      {/* 1. Header Bar with Athlete Profile and Notification bell */}
      <div className={`p-6 flex justify-between items-center ${isDarkMode ? "bg-slate-900/60" : "bg-white"} border-b ${borderColor}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-lg border-2 border-white/10 shadow-md shadow-indigo-950/20">
            {athleteAvatarEmoji}
          </div>
          <div>
            <span className={`text-[10px] ${labelColor} block`}>خوش آمدی قهرمان 👋</span>
            <h4 className={`text-sm font-black ${titleColor}`}>{athleteName}</h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Badge */}
          <button 
            onClick={() => setShowMembershipModal(true)}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer"
          >
            🟢 عضویت فعال ({memberRemainingDays} روز)
          </button>
          {/* Dark / Light Toggle */}
          <button 
            type="button"
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl transition-all ${isDarkMode ? "hover:bg-slate-800 text-amber-400" : "hover:bg-slate-100 text-slate-600"}`}
            title="تغییر تم تاریک/روشن"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>

          <button 
            className={`p-2 rounded-xl relative ${isDarkMode ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"} transition-all`}
            onClick={() => setShowNotificationsModal(true)}
          >
            <Bell className="w-4 h-4" />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-bounce"></span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Main Sub-tab Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* ==================== SUBTAB: WORKOUT ==================== */}
        {subTab === "workout" && !isWorkoutActive && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Quick Stats Bento Ring Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-2xl ${innerCardBg} border text-center flex flex-col items-center justify-center`}>
                <Flame className="w-5 h-5 text-orange-500 mb-1" />
                <span className={`text-[8px] ${labelColor}`}>کالری هدف روزانه</span>
                <span className={`text-xs font-black ${titleColor}`}>{myNutrition ? myNutrition.targetCalories : "نامشخص"}</span>
              </div>
              <div className={`p-3 rounded-2xl ${innerCardBg} border text-center flex flex-col items-center justify-center`}>
                <Calculator className="w-5 h-5 text-green-500 mb-1" />
                <span className={`text-[8px] ${labelColor}`}>شاخص بدنی (BMI)</span>
                <span className={`text-xs font-black ${titleColor}`}>{bmi}</span>
              </div>
              <div className={`p-3 rounded-2xl ${innerCardBg} border text-center flex flex-col items-center justify-center`}>
                <Clock className="w-5 h-5 text-blue-500 mb-1" />
                <span className={`text-[8px] ${labelColor}`}>جلسات باقیمانده</span>
                <span className={`text-xs font-black text-green-500`}>{member.remainingSessions} جلسه</span>
              </div>
            </div>

            {/* Mascot Smart Daily Motivation Card */}
            <div className={`p-4 rounded-2xl ${innerCardBg} border border-green-500/20 relative overflow-hidden flex items-center gap-4 text-right animate-fade-in`}>
              <div className="shrink-0 relative">
                <div className="absolute -inset-1 bg-gradient-to-tr from-green-500 to-indigo-500 rounded-xl blur opacity-30"></div>
                <img 
                  src={mascotSmart} 
                  alt="Smart Mascot" 
                  className="w-16 h-16 rounded-xl object-cover relative z-10 border border-white/10"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[9px] text-green-400 font-black block">💡 مربی همراه تو، «اسمارْت»</span>
                <p className={`text-[11px] leading-relaxed font-bold ${titleColor}`}>
                  «امروز نوبت درخشش توست، قهرمان! هر یک تکرار پرس یا اسکات که امروز می‌زنی، تو رو یک گام به رؤیاهات نزدیک‌تر می‌کنه. بعد تمرین یادت نره پروتئین کافی به عضلاتت برسونی!»
                </p>
                <div className="flex justify-end pt-1">
                  <button 
                    onClick={() => {
                      const athleteTips = [
                        "آب خوردن حین تمرین رو جدی بگیر! کم‌آبی حتی به مقدار کم، قدرت عضلاتت رو تا ۱۰٪ کاهش می‌ده. 💧",
                        "فرم درست حرکت همیشه از سنگینی وزنه مهم‌تره. آسیب‌دیدگی تو رو ماه‌ها عقب می‌اندازه! 🏋️‍♂️",
                        "پروتئین بعد از تمرین مثل آجر برای ساختن دیوار عضلاته. بوفه باشگاه منتظرته! 🥛",
                        "تداوم و پیوستگی راز واقعی بدست آوردن کات عضلانیه. خسته نشو و ادامه بده! 🔥",
                        "کشش عضلات بعد از اتمام تمرین، ریکاوری رو سریع‌تر می‌کنه و گرفتگی عضلانی فردا رو کاهش می‌ده! 🧘‍♂️"
                      ];
                      alert(`اسمارْت می‌گه: ${athleteTips[Math.floor(Math.random() * athleteTips.length)]}`);
                    }}
                    className="text-[9px] text-green-500 font-bold hover:underline"
                  >
                    💡 دریافت نکته ورزشی جدید از اسمارْت
                  </button>
                </div>
              </div>
            </div>

            {/* Day Selector Segmented Control */}
            {myProgram === null ? (
              <div className={`p-8 rounded-3xl ${innerCardBg} border border-dashed border-white/10 text-center space-y-4 animate-fade-in`}>
                <Dumbbell className="w-12 h-12 text-slate-500 mx-auto animate-bounce" />
                <h3 className={`text-sm font-black ${titleColor}`}>برنامه تمرینی صادر نشده است</h3>
                <p className={`text-[11px] ${labelColor} leading-relaxed`}>
                  هنوز هیچ برنامه تمرینی فعال اختصاصی برای شما صادر نشده است. پس از ویزیت و ارزیابی عضلانی توسط مربی باشگاه، برنامه شما در این بخش فعال خواهد شد.
                </p>
                <div className="text-[10px] text-slate-500">
                  💡 جهت ثبت درخواست یا تسریع فرایند با بخش پذیرش باشگاه خود هماهنگ فرمایید.
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black tracking-wider ${labelColor}`}>روزهای برنامه تمرینی شما</span>
                    <span className="text-[10px] text-green-500 font-bold">برای تغییر روز لمس کنید 👈</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2" dir="rtl">
                {myProgram.schedule.map((dayItem: any, idx: number) => {
                  const isActive = selectedDayIndex === idx;
                  const isCompleted = completedDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedDayIndex(idx);
                        // Reset player indices when day changes
                        setCurrentExIndex(0);
                        setCurrentSetIndex(0);
                        setWorkoutFinished(false);
                      }}
                      className={`px-2 py-2 rounded-xl text-[10px] font-black transition-all border text-center flex flex-col justify-center items-center gap-1 cursor-pointer ${
                        isActive 
                          ? "bg-green-500/10 border-green-500 text-green-500 font-bold scale-[1.02] shadow-sm shadow-green-950/10" 
                          : isCompleted
                            ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
                            : `${isDarkMode ? "bg-slate-900/60 border-white/5 text-slate-400 hover:bg-slate-800" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`
                      }`}
                    >
                      <span className="opacity-75 flex items-center gap-1">
                        روز {toPersianNums(idx + 1)}
                        {isCompleted && (
                          <span className="bg-emerald-500 text-slate-950 rounded-full px-1 py-0.2 font-black text-[8px]">✓</span>
                        )}
                      </span>
                      <span className="truncate w-full font-bold">{dayItem.day.split(" (")[0].replace("روز اول: ", "").replace("روز دوم: ", "").replace("روز سوم: ", "")}</span>
                      {isCompleted && (
                        <span className="text-[8px] text-emerald-400 font-bold">انجام شده</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Today's Workout Hero Banner Card */}
            <div className="bg-gradient-to-l from-green-600 via-green-500 to-emerald-500 rounded-[2rem] p-5 text-white shadow-lg shadow-green-500/20 relative overflow-hidden">
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="space-y-3.5 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="bg-white/20 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">برنامه تمرینی فعال</span>
                  <span className="text-[10px] opacity-90 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {currentDay.day}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">{myProgram.title}</h3>
                  <p className="text-[11px] opacity-90 leading-relaxed mt-1">تولید شده توسط مربی ارشد {member.coachName} با تمرکز بر هایپرتروفی عضلانی.</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/20">
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="opacity-75 block text-[8px]">تعداد حرکات</span>
                      <span className="font-extrabold">{currentDay?.exercises?.length || 4} حرکت</span>
                    </div>
                    <div>
                      <span className="opacity-75 block text-[8px]">مدت تخمینی</span>
                      <span className="font-extrabold">۶۰ دقیقه</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setIsWorkoutActive(true);
                      setWorkoutTimer(0);
                      setCurrentExIndex(0);
                      setCurrentSetIndex(0);
                      setWorkoutFinished(false);
                      setIsResting(false);
                    }}
                    className="bg-white text-green-700 hover:scale-105 transition-all font-black text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1"
                  >
                    <Dumbbell className="w-3.5 h-3.5" />
                    شروع هوشمند تمرین
                  </button>
                </div>
              </div>
            </div>

            {/* Exercises Timeline */}
            <div className="space-y-3">
              <h4 className={`text-xs font-black ${titleColor} flex items-center gap-1.5`}>
                <Dumbbell className="w-4 h-4 text-green-500" />
                لیست حرکات تمرینی امروز شما
              </h4>

              <div className="space-y-2.5">
                {currentDay?.exercises?.map((ex: any, idx: number) => (
                  <div key={idx} className={`p-3.5 rounded-2xl border ${borderColor} ${innerCardBg} flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center font-bold font-mono text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <span className={`font-bold text-xs ${titleColor}`}>{ex.name || ex.exercise?.name}</span>
                        <div className="flex gap-3 text-[10px] text-slate-400 mt-0.5">
                          <span>{ex.sets?.length || 4} ست</span>
                          <span>{ex.sets?.[0]?.reps || 12} تکرار</span>
                          <span>هدف: {ex.exercise?.targetMuscle || "عمومی"}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded-md">
                      {ex.restDurationSeconds || 60}ثانیه استراحت
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )}

        {/* ==================== ACTIVE LIVE WORKOUT PLAYER ==================== */}
        {isWorkoutActive && (
          <div className="space-y-6 animate-fade-in text-center p-2">
            
            {workoutFinished ? (
              <div className="space-y-6 py-8">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto animate-bounce">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h3 className={`text-xl font-black ${titleColor}`}>خسته نباشی دلاور! 🏆</h3>
                  <p className="text-xs text-slate-400 leading-relaxed px-6">
                    تمرین بالا تنه قدرتی امروز با موفقیت کامل انجام شد. مشخصات حضور و فعالیت تمرینی شما برای مربی تان ارسال شد.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl ${innerCardBg} border text-xs max-w-xs mx-auto space-y-2`}>
                  <div className="flex justify-between">
                    <span>زمان کل تمرین:</span>
                    <span className="font-mono font-bold text-green-500">{formatTime(workoutTimer)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>حرکات تمام شده:</span>
                    <span className="font-bold">{currentDay.exercises.length} حرکت</span>
                  </div>
                  <div className="flex justify-between">
                    <span>امتیاز کسب شده:</span>
                    <span className="font-bold text-amber-500">۱۵۰ امتیاز باشگاه</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setIsWorkoutActive(false);
                    setSubTab("workout");
                  }}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-lg"
                >
                  بازگشت به داشبورد
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Header bar of Player */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">زمان‌سنج تمرین: <span className="font-mono text-slate-200">{formatTime(workoutTimer)}</span></span>
                  <button 
                    onClick={() => {
                      setIsWorkoutActive(false);
                    }} 
                    className="text-red-400 font-bold transition-colors hover:text-red-300"
                  >
                    انصراف
                  </button>
                </div>

                {/* Exercise current info (TOP of animation card) */}
                <div className="text-center space-y-1 bg-slate-900/40 p-3 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-green-500 font-extrabold uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full inline-block">
                    حرکت {toPersianNums(String(currentExIndex + 1))} از {toPersianNums(String(currentDay.exercises.length))}
                  </span>
                  <h3 className={`text-xl sm:text-2xl font-black ${titleColor} tracking-tight`}>
                    {currentDay.exercises[currentExIndex]?.name}
                  </h3>
                  <p className="text-xs text-slate-400">ست جاری: {toPersianNums(String(currentSetIndex + 1))} از {toPersianNums(String(currentDay.exercises[currentExIndex]?.sets?.length || 4))}</p>
                </div>

                {/* Exercise Animation widget simulation */}
                <div className={`p-4 rounded-[2.5rem] border ${borderColor} ${innerCardBg} overflow-hidden shadow-inner relative`}>
                  <ExerciseAnimation 
                    exerciseName={currentDay.exercises[currentExIndex]?.name || "پرس سینه"} 
                    isPlaying={true}
                    isResting={isResting}
                  />
                </div>

                {/* Repetitions details (BOTTOM of animation card) */}
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 text-center space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">تعداد انجام و مشخصات ست فعلی</span>
                  <span className="text-xl font-black text-green-400">
                    {toPersianNums(String(currentDay.exercises[currentExIndex]?.sets?.[currentSetIndex]?.reps || 12))} تکرار با وزنه {toPersianNums(String(currentDay.exercises[currentExIndex]?.sets?.[currentSetIndex]?.weightKg || 40))} کیلوگرم
                  </span>
                </div>

                {/* Step by Step Timeline Tracker */}
                <div className="py-2.5 px-1 bg-slate-900/20 rounded-2xl border border-white/5 p-4">
                  <span className="text-[10px] text-slate-500 font-extrabold block mb-3 text-right">مراحل تمرین و ریکاوری (استپ‌بای‌استپ)</span>
                  <div className="flex items-center justify-between gap-1 relative">
                    {/* Background line */}
                    <div className="absolute top-[16px] left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 -z-10"></div>
                    
                    {Array.from({ length: currentDay.exercises[currentExIndex]?.sets?.length || 4 }).map((_, idx) => {
                      const isSetCompleted = idx < currentSetIndex;
                      const isSetActive = idx === currentSetIndex && !isResting;
                      const isRestActive = idx === currentSetIndex && isResting;
                      
                      return (
                        <React.Fragment key={idx}>
                          {/* Set Step */}
                          <div className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isSetCompleted 
                                ? "bg-green-500 text-slate-950 shadow-md shadow-green-500/20" 
                                : isSetActive 
                                  ? "bg-green-500/20 text-green-400 border-2 border-green-400 animate-pulse" 
                                  : "bg-slate-900 text-slate-500 border border-slate-800"
                            }`}>
                              {isSetCompleted ? "✓" : toPersianNums(String(idx + 1))}
                            </div>
                            <span className={`text-[9px] font-bold ${isSetActive ? "text-green-400" : isSetCompleted ? "text-green-500/80" : "text-slate-500"}`}>
                              ست {toPersianNums(String(idx + 1))}
                            </span>
                          </div>

                          {/* Rest Step (if not the last set) */}
                          {idx < (currentDay.exercises[currentExIndex]?.sets?.length || 4) - 1 && (
                            <div className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                idx < currentSetIndex 
                                  ? "bg-indigo-500 text-slate-950" 
                                  : isRestActive && idx === currentSetIndex
                                    ? "bg-indigo-500/20 text-indigo-400 border-2 border-indigo-400 animate-pulse" 
                                    : "bg-slate-900 text-slate-500 border border-slate-800"
                              }`}>
                                ⏱️
                              </div>
                              <span className={`text-[8px] font-bold ${isRestActive && idx === currentSetIndex ? "text-indigo-400" : idx < currentSetIndex ? "text-indigo-500/80" : "text-slate-500"}`}>
                                استراحت
                              </span>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Rest Overlay or action button */}
                {isResting ? (
                  <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-3xl space-y-5 text-center">
                    <span className="text-xs text-indigo-400 font-extrabold block">زمان استراحت طلایی (ریکاوری قلبی)</span>
                    <span className="font-mono text-5xl font-black text-indigo-400 animate-pulse block">
                      {toPersianNums(String(restTimer))} <span className="text-lg">ثانیه</span>
                    </span>
                    <button 
                      onClick={() => {
                        handleFinishRest();
                      }}
                      className="w-full py-5 px-10 text-base md:text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-500/30 active:scale-[0.97] transition-all flex items-center justify-center gap-3 tracking-wider cursor-pointer border border-white/10 animate-pulse"
                    >
                      ⏭️ رد کردن استراحت و شروع ست بعدی (بزرگ و کشیده)
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      handleEndSet();
                    }}
                    className="w-full bg-gradient-to-l from-green-600 to-green-500 text-white font-extrabold py-4 rounded-2xl shadow-xl shadow-green-900/20 transition-all flex items-center justify-center gap-2.5 text-sm cursor-pointer"
                  >
                    <Check className="w-5 h-5" />
                    پایان ست {toPersianNums(String(currentSetIndex + 1))} و شروع استراحت
                  </button>
                )}

                {/* Next exercise tip */}
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                  💡 نکته مربی: {currentDay.exercises[currentExIndex]?.tip || "تمرکز روی بخش منفی حرکت و دم و بازدم منظم."}
                </p>

              </div>
            )}

          </div>
        )}

        {/* ==================== SUBTAB: NUTRITION ==================== */}
        {subTab === "nutrition" && (
          <div className="space-y-6 animate-fade-in">
            {myNutrition === null ? (
              <div className={`p-8 rounded-3xl ${innerCardBg} border border-dashed border-white/10 text-center space-y-4 animate-fade-in`}>
                <Utensils className="w-12 h-12 text-slate-500 mx-auto animate-bounce" />
                <h3 className={`text-sm font-black ${titleColor}`}>برنامه غذایی صادر نشده است</h3>
                <p className={`text-[11px] ${labelColor} leading-relaxed`}>
                  هنوز هیچ برنامه رژیم غذایی فعال اختصاصی برای شما صادر نشده است. پس از ارزیابی بیومتریک و آنالیز بدن توسط مربی تغذیه، رژیم شما در این بخش فعال خواهد شد.
                </p>
                <div className="text-[10px] text-slate-500">
                  💡 جهت ثبت درخواست یا تسریع فرایند با بخش پذیرش باشگاه خود هماهنگ فرمایید.
                </div>
              </div>
            ) : (
              <>
                {/* Interactive Water Intake Logger Widget */}
                <div className={`p-5 rounded-[2rem] border ${borderColor} ${innerCardBg} space-y-4`}>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Droplet className="w-5 h-5 text-cyan-400" />
                      <span className={`font-black text-xs ${titleColor}`}>ثبت آب مصرفی روزانه</span>
                    </div>
                    <span className="text-xs text-cyan-400 font-bold font-mono">{(waterCups * 0.25).toFixed(2)} / {myNutrition ? (myNutrition.macros?.water || 3.5) : 3.5} لیتر</span>
                  </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-5.5 h-7 rounded-md transition-all ${i < waterCups ? "bg-cyan-500 shadow-md shadow-cyan-500/20" : "bg-white/10"}`}
                    ></div>
                  ))}
                </div>

                <button 
                  onClick={handleAddWater}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white p-3.5 rounded-full shadow-lg shadow-cyan-900/20 hover:scale-105 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">با نوشیدن هر لیوان آب، یک خانه پر می‌شود. برای بهینه‌سازی متابولیسم سلولی، حتماً تارگت روزانه خود را کامل کنید.</p>
            </div>

            {/* Meals menu list */}
            <div className="space-y-3">
              <h4 className={`text-xs font-black ${titleColor} flex items-center gap-1.5`}>
                <Utensils className="w-4 h-4 text-green-500" />
                رژیم غذایی و وعده‌های امروز شما
              </h4>

              <div className="space-y-3">
                {Object.entries(myNutrition.meals || {}).map(([key, meal]: [string, any], idx) => (
                  <details key={idx} className={`group border ${borderColor} rounded-2xl ${innerCardBg} p-4 [&_summary::-webkit-details-marker]:hidden`}>
                    <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🍳</span>
                        <h5 className={`text-xs font-black ${titleColor}`}>{meal.title || key}</h5>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-md">{meal.calories} کالری</span>
                    </summary>

                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2 text-[11px] leading-relaxed">
                      <ul className="space-y-1 text-slate-400 list-disc list-inside">
                        {meal.items?.map((it: string, i: number) => (
                          <li key={i}>{it}</li>
                        ))}
                      </ul>
                      <div className="grid grid-cols-3 gap-2 text-center pt-2 text-[9px] text-slate-500 border-t border-white/5">
                        <span>پروتئین: {meal.proteinGrams || 30} گرم</span>
                        <span>کربوهیدرات: {meal.carbsGrams || 45} گرم</span>
                        <span>چربی: {meal.fatGrams || 10} گرم</span>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* Shopping List */}
            <div className={`p-4 rounded-2xl border ${borderColor} ${innerCardBg}`}>
              <span className="font-bold text-xs text-green-500 block mb-2">🛒 لیست خرید هفتگی</span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                {myNutrition.shoppingList?.map((it: string, idx: number) => (
                  <li key={idx}>{it}</li>
                )) || <li>سینه مرغ گرم، تخم‌مرغ محلی، جو دوسر پرک</li>}
              </ul>
            </div>
              </>
            )}

          </div>
        )}

        {/* ==================== SUBTAB: STATS & CHARTS ==================== */}
        {subTab === "stats" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Weight tracker interactive block */}
            <div className={`p-5 rounded-[2rem] border ${borderColor} ${innerCardBg} space-y-4`}>
              <span className={`font-black text-xs ${titleColor} block`}>📈 نمودار و ثبت وزن هفتگی</span>
              
              {/* Weight list visualization with Recharts and horizontal scrolling after 6 items */}
              <div className="w-full overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-emerald-600">
                <div style={{ minWidth: weightLogs.length > 6 ? `${weightLogs.length * 70}px` : "100%", height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 9, fill: isDarkMode ? "#94a3b8" : "#475569" }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 9, fill: isDarkMode ? "#94a3b8" : "#475569" }} 
                        domain={['dataMin - 3', 'dataMax + 3']}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                          borderColor: isDarkMode ? '#1e293b' : '#cbd5e1', 
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: isDarkMode ? '#f8fafc' : '#0f172a'
                        }}
                        formatter={(value: any) => [`${toPersianNums(String(value))} کیلوگرم`, 'وزن']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#weightGrad)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Logger form */}
              <form onSubmit={handleAddWeightLog} className="flex gap-2 text-xs pt-2">
                <input 
                  type="number"
                  step="0.1"
                  value={newLogWeight}
                  onChange={(e) => setNewLogWeight(e.target.value)}
                  placeholder="وزن جدید (کیلوگرم)"
                  className={`flex-1 px-3 py-2 border rounded-xl focus:outline-none ${inputBg}`}
                  required
                />
                <button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-500 text-white font-extrabold px-4 py-2 rounded-xl transition-all"
                >
                  ثبت وزن
                </button>
              </form>
            </div>

            {/* Athlete Achievements & Badges */}
            <div className="space-y-3">
              <span className={`font-black text-xs ${titleColor} block flex items-center gap-1.5`}>
                <Award className="w-4 h-4 text-amber-500" />
                مدال‌ها و دستاوردهای ورزشی شما
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { name: "هیدراته متعهد", desc: "نوشیدن آب روزانه منظم", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", icon: "💧" },
                  { name: "سحرخیز باشگاه", desc: "ورود به باشگاه قبل از ساعت ۹ صبح", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: "☀️" },
                  { name: "غول عضله‌سازی", desc: "انجام ۱۰۰٪ برنامه‌های تمرینی هفته", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: "💪" },
                  { name: "انضباط آهنین", desc: "حضور بی وقفه در ۴ هفته متوالی", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", icon: "🛡️" }
                ].map((item, idx) => (
                  <div key={idx} className={`p-3.5 rounded-2xl border ${item.color} flex gap-2.5 items-center`}>
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div>
                      <h5 className="font-extrabold text-[10px]">{item.name}</h5>
                      <p className="text-[8px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==================== SUBTAB: PROFILE & SETTINGS ==================== */}
        {subTab === "profile" && (
          <div className="space-y-4 animate-fade-in text-xs text-right" dir="rtl">
            
            {/* Interactive Profile Editor Card */}
            <div className={`p-5 rounded-2xl border ${borderColor} ${innerCardBg} space-y-4`}>
              <span className="font-black text-xs text-indigo-400 block border-b border-white/5 pb-2">
                👤 ویرایش اطلاعات فردی و پروفایل
              </span>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">نام و نام خانوادگی شما</label>
                  <input
                    type="text"
                    value={athleteName}
                    onChange={(e) => setAthleteName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 px-3 py-2 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">شماره تلفن همراه</label>
                  <input
                    type="text"
                    value={athletePhone}
                    onChange={(e) => setAthletePhone(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 px-3 py-2 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Avatar / Profile Picture Emoji Selector */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1.5">انتخاب آواتار و عکس پروفایل</label>
                  <div className="flex gap-2.5 overflow-x-auto py-1">
                    {["🦁", "🐯", "🦅", "🥋", "🏋️", "🥇", "🥊", "🧘", "🤸"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setAthleteAvatarEmoji(emoji);
                        }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${athleteAvatarEmoji === emoji ? "bg-indigo-500/20 border-2 border-indigo-500 scale-110" : "bg-slate-900 border border-white/5 hover:bg-slate-800"}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Preset Selector */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1.5">تم رنگی وب‌اپلیکیشن (Custom Accent)</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: "emerald", label: "سبز", color: "bg-emerald-500" },
                      { id: "blue", label: "آبی", color: "bg-blue-500" },
                      { id: "rose", label: "یاقوتی", color: "bg-rose-500" },
                      { id: "violet", label: "بنفش", color: "bg-violet-500" },
                      { id: "amber", label: "کهربایی", color: "bg-amber-500" }
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setAthleteThemeColor(theme.id);
                        }}
                        className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${athleteThemeColor === theme.id ? "border-indigo-500 bg-indigo-500/10 scale-105" : "border-white/5 bg-slate-900"}`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${theme.color}`} />
                        <span className="text-[8px] text-slate-400">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert("🎉 تغییرات پروفایل، تصویر آواتار و تم رنگی اختصاصی شما با موفقیت ذخیره گردید و فوراً روی کل پنل اعمال شد.")}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition-all mt-1"
                >
                  💾 ذخیره تغییرات پروفایل
                </button>
              </div>
            </div>

            {/* Club Info Section for Athlete */}
            <div className={`p-5 rounded-2xl border ${borderColor} ${innerCardBg} space-y-4`}>
              <span className="font-black text-xs text-indigo-400 block border-b border-white/5 pb-2 flex items-center gap-1.5">
                🏛️ مشخصات و اطلاعات رسمی باشگاه شما
              </span>
              
              <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">
                  🏋️
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-100">{clubInfo?.name || "مجموعه ورزشی اکسیژن (شعبه مرکزی)"}</h4>
                  <span className="text-[10px] text-slate-500">تحت پوشش پورتال اسمارت جیم</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div className="bg-slate-950/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-slate-500 block">مدیریت باشگاه:</span>
                  <span className="font-bold text-slate-200">{clubInfo?.ownerName || "جناب آقای تهرانی"}</span>
                </div>
                <div className="bg-slate-950/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-slate-500 block">شماره تماس ثابت:</span>
                  <span className="font-bold text-slate-200 font-mono">{clubInfo?.phone || "۰۲۱-۲۲۸۸۹۹۰۰"}</span>
                </div>
                <div className="bg-slate-950/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-slate-500 block">ساعات کاری باشگاه:</span>
                  <span className="font-bold text-slate-200">۰۶:۰۰ الی ۲۳:۰۰</span>
                </div>
                <div className="bg-slate-950/30 p-2.5 rounded-xl border border-white/5 space-y-1 text-right">
                  <span className="text-slate-500 block">وضعیت فعلی:</span>
                  <span className="font-bold text-emerald-400">🟢 فعال و دایر</span>
                </div>
              </div>

              <div className="bg-slate-950/30 p-3 rounded-xl border border-white/5 space-y-1 text-[10px]">
                <span className="text-slate-500 block">آدرس دقیق پستی:</span>
                <span className="text-slate-300 font-bold leading-relaxed block">
                  {clubInfo?.address || "تهران، نیاوران، سه راه یاسر، کوچه راد، پلاک ۱۲، طبقه منفی ۱"}
                </span>
              </div>
            </div>

            {/* Read-only system overview */}
            <div className={`p-4 rounded-2xl border ${borderColor} ${innerCardBg} space-y-2.5 text-[10px] text-slate-400`}>
              <div className="flex justify-between">
                <span>مربی بدنساز شما:</span>
                <span className="font-bold text-slate-200">{member.coachName}</span>
              </div>
              <div className="flex justify-between">
                <span>تاریخ شروع دوره:</span>
                <span className="font-mono text-slate-200">{member.joinedDate}</span>
              </div>
            </div>

            {/* Offline Simulator actions */}
            <div className={`p-4 rounded-2xl border ${borderColor} ${innerCardBg} space-y-2`}>
              <span className="font-bold text-xs text-indigo-400 block">📱 شبیه‌ساز نسخه آفلاین PWA</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">این وب‌اپلیکیشن برای استفاده‌ی آفلاین بهینه‌سازی شده است.</p>
              <button 
                onClick={() => alert("شبیه‌سازی دانلود آفلاین با موفقیت انجام شد و برنامه آفلاین در کش محلی ذخیره گردید.")}
                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 py-2 rounded-xl font-bold transition-all border border-white/5"
              >
                ذخیره کامل برنامه برای دسترسی بدون اینترنت
              </button>
            </div>

            <button 
              onClick={onLogout}
              className="w-full bg-red-600/15 hover:bg-red-600/20 text-red-400 border border-red-500/10 py-3 rounded-2xl font-black text-xs transition-all"
            >
              خروج امن از پنل کاربری
            </button>

          </div>
        )}

      </div>

      {/* AI Floating Button removed per user request */}

      {/* 4. Persistent App Bottom Navigation Menu (منوی ناوبری در پایین) */}
      <div className={`absolute bottom-0 inset-x-0 h-18 ${isDarkMode ? "bg-slate-900/95" : "bg-white"} border-t ${borderColor} flex justify-around items-center px-4 z-40`}>
        <button 
          onClick={() => setSubTab("workout")}
          className={`flex flex-col items-center gap-1 transition-all ${subTab === "workout" ? "text-green-500 scale-105" : "text-slate-400"}`}
        >
          <Dumbbell className="w-5 h-5" />
          <span className="text-[9px] font-extrabold">برنامه تمرینی</span>
        </button>

        <button 
          onClick={() => setSubTab("nutrition")}
          className={`flex flex-col items-center gap-1 transition-all ${subTab === "nutrition" ? "text-green-500 scale-105" : "text-slate-400"}`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[9px] font-extrabold">برنامه غذایی</span>
        </button>

        <button 
          onClick={() => setSubTab("stats")}
          className={`flex flex-col items-center gap-1 transition-all ${subTab === "stats" ? "text-green-500 scale-105" : "text-slate-400"}`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[9px] font-extrabold">آنالیز و آمار</span>
        </button>

        <button 
          onClick={() => setSubTab("profile")}
          className={`flex flex-col items-center gap-1 transition-all ${subTab === "profile" ? "text-green-500 scale-105" : "text-slate-400"}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-extrabold">پروفایل کاربری</span>
        </button>
      </div>

    </div>
  );
}

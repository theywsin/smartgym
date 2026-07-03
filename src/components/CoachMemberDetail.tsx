import React, { useState } from "react";
import { 
  X, 
  User, 
  Dumbbell, 
  Utensils, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Heart, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Briefcase
} from "lucide-react";

interface CoachMemberDetailProps {
  member: any;
  onClose: () => void;
  isDarkMode: boolean;
  workoutPrograms: any[];
  nutritionPlans: any[];
  attendanceRecords: any[];
  invoices: any[];
}

export default function CoachMemberDetail({
  member,
  onClose,
  isDarkMode,
  workoutPrograms,
  nutritionPlans,
  attendanceRecords,
  invoices
}: CoachMemberDetailProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "charts" | "records" | "history">("profile");

  // Filter attendance and invoices for this member
  const myAttendance = attendanceRecords.filter(a => a.memberId === member.id || a.memberName === member.name);
  const myInvoices = invoices.filter(i => i.memberName === member.name);

  // Load programs
  const assignedProgram = workoutPrograms.find(p => p.id === member.assignedProgramId) || workoutPrograms[0];
  const assignedNutrition = nutritionPlans.find(n => n.id === member.assignedNutritionId) || nutritionPlans[0];

  // Weight, muscle, and fat mock histories for charts
  const progressHistory = [
    { month: "فروردین", weight: 81.2, muscle: 37.5, fat: 18.2 },
    { month: "اردیبهشت", weight: 80.1, muscle: 38.1, fat: 17.1 },
    { month: "خرداد", weight: 78.8, muscle: 38.6, fat: 16.0 },
    { month: "تیر", weight: 77.8, muscle: 39.2, fat: 14.8 }
  ];

  // Design tokens based on light / dark mode
  const panelBg = isDarkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-200 shadow-2xl";
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  const labelColor = isDarkMode ? "text-slate-400" : "text-slate-500";
  const innerCardBg = isDarkMode ? "bg-slate-950/60 border-white/5" : "bg-slate-50 border-slate-200/60";
  const borderMuted = isDarkMode ? "border-white/5" : "border-slate-100";

  // Calculate BMI
  const heightM = 1.80; // mock height
  const weightKg = member.weight || 78;
  const bmi = (weightKg / (heightM * heightM)).toFixed(1);

  return (
    <div className="fixed inset-y-0 left-0 w-full max-w-xl z-50 bg-slate-950/40 backdrop-blur-md flex justify-end text-right" dir="rtl">
      
      {/* Sliding Drawer Container */}
      <div className={`w-full max-w-lg h-full border-r flex flex-col justify-between shadow-2xl p-6 ${panelBg} animate-slide-in`}>
        
        {/* Drawer Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-green-600 to-green-400 rounded-full flex items-center justify-center text-white font-black text-sm">
              {member.name.substring(0, 2)}
            </div>
            <div>
              <h3 className={`text-base font-black ${textPrimary}`}>{member.name}</h3>
              <span className="text-[10px] text-green-500">تاریخ عضویت: {member.joinedDate}</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${isDarkMode ? "hover:bg-white/5 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Tabs Navigation */}
        <div className="flex border-b border-white/5 text-[10px] font-bold">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === "profile" ? "border-green-500 text-green-500" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            آنالیز فیزیکی و بیماری
          </button>
          <button 
            onClick={() => setActiveTab("charts")}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === "charts" ? "border-green-500 text-green-500" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            نمودارهای پیشرفت
          </button>
          <button 
            onClick={() => setActiveTab("records")}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === "records" ? "border-green-500 text-green-500" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            رکوردها و حرکات
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === "history" ? "border-green-500 text-green-500" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            حضور و پرداخت‌ها
          </button>
        </div>

        {/* Drawer Body Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 text-xs leading-relaxed">
          
          {/* ==================== TAB: PROFILE DETAILS ==================== */}
          {activeTab === "profile" && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Biological Specs Bento Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className={`p-3 rounded-xl border ${innerCardBg}`}>
                  <span className={`block text-[9px] ${labelColor}`}>قد شاگرد</span>
                  <span className={`text-sm font-black ${textPrimary}`}>۱۸۰ <span className="text-[10px] font-normal">سانتی‌متر</span></span>
                </div>
                <div className={`p-3 rounded-xl border ${innerCardBg}`}>
                  <span className={`block text-[9px] ${labelColor}`}>وزن شاگرد</span>
                  <span className={`text-sm font-black ${textPrimary}`}>{weightKg} <span className="text-[10px] font-normal">کیلوگرم</span></span>
                </div>
                <div className={`p-3 rounded-xl border ${innerCardBg}`}>
                  <span className={`block text-[9px] ${labelColor}`}>سن شاگرد</span>
                  <span className={`text-sm font-black ${textPrimary}`}>۲۶ <span className="text-[10px] font-normal">سال</span></span>
                </div>
                <div className={`p-3 rounded-xl border ${innerCardBg}`}>
                  <span className={`block text-[9px] ${labelColor}`}>شاخص BMI</span>
                  <span className={`text-sm font-black text-green-500`}>{bmi}</span>
                </div>
              </div>

              {/* Medical and Injuries logs */}
              <div className="grid sm:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/15 space-y-2">
                  <span className="font-extrabold text-red-400 flex items-center gap-1.5 text-[11px]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    سوابق آسیب‌دیدگی و مصدومیت‌ها
                  </span>
                  <p className="text-slate-300">
                    {member.id === "m_101" 
                      ? "درد خفیف و کشیدگی تاندون مچ دست راست حین پرس سینه سنگین. از اسکات با هالتر مچ معکوس خودداری شود." 
                      : "سالم و فاقد هرگونه مصدومیت عضلانی مفصلی فعال."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 space-y-2">
                  <span className="font-extrabold text-amber-400 flex items-center gap-1.5 text-[11px]">
                    <Heart className="w-4 h-4 shrink-0" />
                    سوابق بیماری و محدودیت‌ها
                  </span>
                  <p className="text-slate-300">
                    {member.id === "m_101"
                      ? "حساسیت خفیف به پروتئین سویا در رژیم غذایی. در سوابق خانوادگی سابقه دیابت گزارش نشده است."
                      : "فاقد سوابق بیماری مزمن قلبی، آسم یا پرفشاری خون."}
                  </p>
                </div>

              </div>

              {/* Programs and assignments summaries */}
              <div className="space-y-3">
                <span className={`font-bold block ${textPrimary}`}>برنامه‌های ورزشی اختصاص داده شده جاری</span>
                
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className={`p-3.5 rounded-2xl border ${innerCardBg} flex justify-between items-center`}>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-green-500 shrink-0" />
                      <div>
                        <span className="font-bold block">برنامه تمرینی</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{assignedProgram.title}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold">فعال</span>
                  </div>

                  <div className={`p-3.5 rounded-2xl border ${innerCardBg} flex justify-between items-center`}>
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-green-500 shrink-0" />
                      <div>
                        <span className="font-bold block">برنامه غذایی</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{assignedNutrition.title}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold">فعال</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ==================== TAB: PROGRESS CHARTS ==================== */}
          {activeTab === "charts" && (
            <div className="space-y-6 animate-fade-in text-xs">
              
              <div className="space-y-4">
                <span className={`font-bold block ${textPrimary}`}>نمودارهای بیولوژیکی و ترکیب بدنی (تغییرات ماهانه)</span>
                
                {/* 1. Weight progression chart */}
                <div className={`p-4 rounded-2xl border ${innerCardBg} space-y-3`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">کاهش وزن چربی (کیلوگرم)</span>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="h-24 flex items-end justify-between px-2 pt-2 gap-2">
                    {progressHistory.map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-green-400 font-bold font-mono">{item.weight}</span>
                        <div 
                          className="w-full bg-green-500/80 rounded-md transition-all duration-300 hover:bg-green-400"
                          style={{ height: `${(item.weight - 70) * 8}%` }}
                        ></div>
                        <span className="text-[8px] text-slate-500">{item.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Muscle and fat progression double chart */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border ${innerCardBg} space-y-2`}>
                    <span className="font-bold text-slate-200 block">حجم توده عضلانی (kg)</span>
                    <div className="h-20 flex items-end justify-between gap-1.5">
                      {progressHistory.map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[8px] text-blue-400 font-mono font-bold">{item.muscle}</span>
                          <div 
                            className="w-full bg-blue-500/80 rounded-sm"
                            style={{ height: `${(item.muscle - 30) * 10}%` }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${innerCardBg} space-y-2`}>
                    <span className="font-bold text-slate-200 block">درصد چربی بدنی (Fat%)</span>
                    <div className="h-20 flex items-end justify-between gap-1.5">
                      {progressHistory.map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[8px] text-red-400 font-mono font-bold">{item.fat}%</span>
                          <div 
                            className="w-full bg-red-500/80 rounded-sm"
                            style={{ height: `${(item.fat) * 5}%` }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ==================== TAB: RECORDS & EXERCISES ==================== */}
          {activeTab === "records" && (
            <div className="space-y-5 animate-fade-in text-xs">
              
              {/* Athlete personal records */}
              <div className="space-y-3">
                <span className={`font-bold block ${textPrimary}`}>رکوردهای شخصی ورزشکار (PR)</span>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className={`p-3 rounded-xl border ${innerCardBg}`}>
                    <span className="text-[8px] text-slate-500 block">پرس سینه هالتر</span>
                    <span className="font-bold text-slate-100 text-xs">۱۱۰ kg</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${innerCardBg}`}>
                    <span className="text-[8px] text-slate-500 block">اسکات پا هالتر</span>
                    <span className="font-bold text-slate-100 text-xs">۱۴۰ kg</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${innerCardBg}`}>
                    <span className="text-[8px] text-slate-500 block">ددلیفت کلاسیک</span>
                    <span className="font-bold text-slate-100 text-xs">۱۶۰ kg</span>
                  </div>
                </div>
              </div>

              {/* Completed vs Uncompleted exercises list */}
              <div className="space-y-3.5">
                <span className={`font-bold block ${textPrimary}`}>گزارش تمرینات این هفته ورزشکار</span>
                
                <div className="space-y-2">
                  {[
                    { name: "پرس سینه هالتر سطوح شیبدار شیب‌دار", date: "شنبه", status: "COMPLETED", duration: "۴ ست کامل" },
                    { name: "قایقی سیم‌کش مچ برعکس دست جمع", date: "شنبه", status: "COMPLETED", duration: "۴ ست کامل" },
                    { name: "پشت بازو سیم‌کش طناب تمرکزی", date: "شنبه", status: "COMPLETED", duration: "۳ ست کامل" },
                    { name: "اسکات پا هالتر آزاد سنگین", date: "دوشنبه", status: "UNCOMPLETED", duration: "تغییر به جلو پا" },
                    { name: "جلو پا سیم کش تک تک انقباضی", date: "دوشنبه", status: "COMPLETED", duration: "۴ ست کامل" }
                  ].map((item, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${borderMuted} ${innerCardBg} flex justify-between items-center`}>
                      <div className="flex items-center gap-2">
                        {item.status === "COMPLETED" ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <div>
                          <span className={`font-bold text-[11px] ${textPrimary}`}>{item.name}</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">{item.date} • {item.duration}</span>
                        </div>
                      </div>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${item.status === "COMPLETED" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {item.status === "COMPLETED" ? "انجام شده" : "انجام نشده"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ==================== TAB: ATTENDANCE & PAYMENTS ==================== */}
          {activeTab === "history" && (
            <div className="space-y-5 animate-fade-in text-xs">
              
              {/* Attendance Log List */}
              <div className="space-y-3">
                <span className={`font-bold block ${textPrimary}`}>سوابق حضور در باشگاه (جلسات اخیر)</span>
                
                {myAttendance.length === 0 ? (
                  <p className="text-slate-500 py-3 text-center">هیچ حضور ثبتی برای این عضو ثبت نشده است.</p>
                ) : (
                  <div className="space-y-2">
                    {myAttendance.map((att, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border ${innerCardBg} flex justify-between items-center`}>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-500" />
                          <div>
                            <span className="font-bold">{att.date}</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">ورود: {att.checkInTime} {att.checkOutTime ? `• خروج: ${att.checkOutTime}` : ""}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-green-500 font-mono">{att.totalHours || "۱.۵"} ساعت</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoice Payment List */}
              <div className="space-y-3">
                <span className={`font-bold block ${textPrimary}`}>تاریخچه پرداخت‌ها و شهریه</span>
                
                {myInvoices.length === 0 ? (
                  <p className="text-slate-500 py-3 text-center">هیچ فاکتور پرداختی برای این عضو ثبت نشده است.</p>
                ) : (
                  <div className="space-y-2">
                    {myInvoices.map((inv, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border ${innerCardBg} flex justify-between items-center`}>
                        <div className="space-y-1">
                          <span className="font-bold text-slate-300 block">{inv.planName}</span>
                          <span className="text-[9px] text-slate-500 font-mono">فاکتور: {inv.id} • {inv.date}</span>
                        </div>
                        <div className="text-left">
                          <span className="font-black text-slate-200 block">{inv.amountToman.toLocaleString()} تومان</span>
                          <span className="text-[9px] text-green-400 font-bold uppercase">{inv.status === "PAID" ? "پرداخت شده" : "معلق"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Drawer Footer controls */}
        <div className="border-t border-white/5 pt-4 flex gap-3 text-[11px] font-bold">
          <button 
            onClick={() => {
              alert(`پیامک تذکر رژیم و انگیزش ورزشی برای ${member.name} با موفقیت ارسال شد.`);
            }}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl transition-all text-center"
          >
            ارسال پیامک انگیزشی
          </button>
          <button 
            onClick={onClose}
            className="bg-white/10 hover:bg-white/15 text-slate-300 py-2.5 px-6 rounded-xl transition-all text-center"
          >
            بستن پنجره
          </button>
        </div>

      </div>

    </div>
  );
}

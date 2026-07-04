import React, { useState } from "react";
import { 
  TrendingUp, 
  Users, 
  Award, 
  CreditCard, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle,
  Percent,
  Calendar,
  FileText
} from "lucide-react";
import { toPersianNums } from "../types";

interface CoachEarningsPanelProps {
  isDarkMode: boolean;
  loggedInCoach: any;
  members: any[];
  coachSales: any[];
  setCoachSales: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function CoachEarningsPanel({
  isDarkMode,
  loggedInCoach,
  members,
  coachSales,
  setCoachSales
}: CoachEarningsPanelProps) {
  // Configurable parameters
  const [clubCommissionRate, setClubCommissionRate] = useState<number>(30); // 30% gym commission default
  const [selectedMonth, setSelectedMonth] = useState<string>("تیر");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // New sale form states
  const [showAddSaleModal, setShowAddSaleModal] = useState<boolean>(false);
  const [formStudentId, setFormStudentId] = useState<string>("");
  const [formStudentName, setFormStudentName] = useState<string>("");
  const [formPackageName, setFormPackageName] = useState<string>("دوره خصوصی ۱۲ جلسه‌ای فیتنس");
  const [formPrice, setFormPrice] = useState<string>("1200000");
  const [formMonth, setFormMonth] = useState<string>("تیر");
  const [formDate, setFormDate] = useState<string>("1405/04/04");

  // Constant coaching fee per active student
  const baseCoachingFeePerStudent = 950000; // 950k Toman per student monthly base

  // Persian Months list
  const monthsList = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", 
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
  ];

  // Filter members assigned to this coach
  const coachStudents = members.filter(
    (m) => m.coachName === loggedInCoach?.name || m.assignedCoachId === loggedInCoach?.id
  );

  // Filter sales belonging to this coach
  const coachSalesList = coachSales.filter(
    (s) => s.coachId === loggedInCoach?.id || s.coachName === loggedInCoach?.name
  );

  // Calculate monthly stats
  const getMonthlyStats = (month: string) => {
    // 1. Members active in this month
    // For realism, let's assume all current coach's students are active, but can vary slightly
    const activeStudentsCount = coachStudents.length;
    const baseStudentsRevenue = activeStudentsCount * baseCoachingFeePerStudent;

    // 2. Extra Package sales in this month
    const monthlySales = coachSalesList.filter((s) => s.month === month);
    const packagesRevenue = monthlySales.reduce((acc, curr) => acc + Number(curr.price || 0), 0);

    const grossRevenue = baseStudentsRevenue + packagesRevenue;
    const clubShareAmount = Math.round((grossRevenue * clubCommissionRate) / 100);
    const netCoachIncome = grossRevenue - clubShareAmount;

    return {
      month,
      activeStudentsCount,
      baseStudentsRevenue,
      packagesRevenue,
      grossRevenue,
      clubShareAmount,
      netCoachIncome,
      salesCount: monthlySales.length,
      salesList: monthlySales
    };
  };

  const currentMonthStats = getMonthlyStats(selectedMonth);

  // Overall statistics for all months combined
  const totalStudentsCoached = coachStudents.length;
  const allTimeSalesRevenue = coachSalesList.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
  const allTimeGross = (totalStudentsCoached * baseCoachingFeePerStudent * 3) + allTimeSalesRevenue; // simulated 3 months of coaching
  const allTimeClubShare = Math.round((allTimeGross * clubCommissionRate) / 100);
  const allTimeNetCoach = allTimeGross - allTimeClubShare;

  // Handle recording new sale
  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    
    let studentName = formStudentName.trim();
    if (formStudentId) {
      const found = members.find(m => m.id === formStudentId);
      if (found) studentName = found.name;
    }

    if (!studentName) {
      alert("لطفاً نام ورزشکار را وارد یا انتخاب کنید.");
      return;
    }

    const newSale = {
      id: "s_" + Date.now(),
      coachId: loggedInCoach?.id || "1",
      coachName: loggedInCoach?.name || "استاد پوریا کریمی",
      studentName: studentName,
      packageName: formPackageName,
      price: Number(formPrice) || 0,
      date: formDate,
      month: formMonth
    };

    setCoachSales((prev) => [newSale, ...prev]);
    setShowAddSaleModal(false);
    
    // Reset form
    setFormStudentId("");
    setFormStudentName("");
    setFormPackageName("دوره خصوصی ۱۲ جلسه‌ای فیتنس");
    setFormPrice("1200000");
  };

  // Delete a sale record
  const handleDeleteSale = (saleId: string) => {
    if (confirm("آیا از حذف این ردیف تراکنش مالی اطمینان دارید؟")) {
      setCoachSales((prev) => prev.filter(s => s.id !== saleId));
    }
  };

  // Filtered transactions for the table
  const filteredTransactions = coachSalesList.filter(s => {
    const matchesSearch = s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.packageName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = selectedMonth === "همه" ? true : s.month === selectedMonth;
    return matchesSearch && matchesMonth;
  });

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Banner / Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-600/25 via-slate-900 to-slate-950 p-6 rounded-3xl border border-amber-500/20 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/25 text-amber-300 border border-amber-500/30">
                گزارش رسمی درآمدها
              </span>
              <span className="text-xs text-slate-400">سیستم تسویه حساب شفاف باشگاه</span>
            </div>
            <h3 className="text-xl font-black text-white">مدیریت مالی و درآمدهای مربی</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              درآمدهای شما به صورت زنده بر اساس تعداد شاگردان فعال تحت مربیگری (با نرخ پایه‌ هماهنگ شده با مدیریت) و پکیج‌ها/دوره‌های فروخته شده محاسبه می‌شود. سهم باشگاه بر اساس تعرفه کسر و درآمد خالص نهایی مشخص می‌گردد.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
            {/* Club Commission Rate Adjuster */}
            <div className="bg-slate-950/80 border border-white/5 p-3 rounded-2xl flex items-center gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">سهم کمیسیون باشگاه:</span>
                <span className="font-bold text-amber-400 text-sm">{toPersianNums(clubCommissionRate)}٪</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={clubCommissionRate} 
                onChange={(e) => setClubCommissionRate(Number(e.target.value))}
                className="w-24 accent-amber-500 cursor-pointer"
              />
            </div>

            <button
              onClick={() => setShowAddSaleModal(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              ثبت پکیج/دوره فروخته شده جدید
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Key Financial Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl space-y-2 relative">
          <div className="absolute top-4 left-4 p-2 bg-amber-500/10 rounded-xl">
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-500 block">شاگردان فعال ({selectedMonth})</span>
          <span className="text-2xl font-black text-white">{toPersianNums(currentMonthStats.activeStudentsCount)} ورزشکار</span>
          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>درآمد ناخالص مربیگری:</span>
            <span className="text-amber-400 font-bold">{toPersianNums((currentMonthStats.baseStudentsRevenue).toLocaleString())} تومان</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl space-y-2 relative">
          <div className="absolute top-4 left-4 p-2 bg-yellow-500/10 rounded-xl">
            <Award className="w-5 h-5 text-yellow-400" />
          </div>
          <span className="text-[10px] text-slate-500 block">فروش پکیج‌ها ({selectedMonth})</span>
          <span className="text-2xl font-black text-white">{toPersianNums(currentMonthStats.salesCount)} پکیج</span>
          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>درآمد حاصل از دوره‌ها:</span>
            <span className="text-amber-400 font-bold">{toPersianNums((currentMonthStats.packagesRevenue).toLocaleString())} تومان</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl space-y-2 relative">
          <div className="absolute top-4 left-4 p-2 bg-rose-500/10 rounded-xl">
            <Percent className="w-5 h-5 text-rose-400" />
          </div>
          <span className="text-[10px] text-slate-500 block">سهم کسر شده باشگاه ({selectedMonth})</span>
          <span className="text-2xl font-black text-rose-400">-{toPersianNums((currentMonthStats.clubShareAmount).toLocaleString())} <span className="text-xs">تومان</span></span>
          <span className="text-[9px] block text-slate-500">بر اساس نرخ کمیسیون {toPersianNums(clubCommissionRate)}٪ کلوپ</span>
        </div>

        <div className="bg-slate-950 border border-amber-500/30 p-5 rounded-2xl space-y-2 relative shadow-lg shadow-amber-950/20">
          <div className="absolute top-4 left-4 p-2 bg-amber-500/20 rounded-xl">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-[10px] text-amber-400 font-bold block">درآمد خالص نهایی شما ({selectedMonth})</span>
          <span className="text-2xl font-black text-emerald-400">{toPersianNums((currentMonthStats.netCoachIncome).toLocaleString())} <span className="text-xs">تومان</span></span>
          <span className="text-[9px] block text-emerald-500/80">آماده پرداخت و تسویه حساب اتوماتیک</span>
        </div>
      </div>

      {/* Main Body: Month Selection & Interactive Calculations */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left column: Month selector & calculation progress */}
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-5">
          <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2">فیلتر ماهانه گزارش مالی</h4>
          
          {/* Custom radio buttons for months selection */}
          <div className="grid grid-cols-3 gap-2">
            {monthsList.map((m) => {
              const stats = getMonthlyStats(m);
              const isActive = selectedMonth === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`p-2.5 rounded-xl text-center text-xs transition-all border ${
                    isActive 
                      ? "bg-amber-600/30 border-amber-500 text-white font-black" 
                      : "bg-slate-950/50 border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="block">{m}</span>
                  <span className="text-[9px] text-emerald-400 mt-1 block">
                    {stats.netCoachIncome > 0 ? `${toPersianNums(Math.round(stats.netCoachIncome / 1000000 * 10) / 10)}M` : "۰"}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => setSelectedMonth("همه")}
              className={`p-2.5 rounded-xl text-center text-xs transition-all border col-span-3 ${
                selectedMonth === "همه"
                  ? "bg-amber-600/30 border-amber-500 text-white font-black" 
                  : "bg-slate-950/50 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              نمایش همه ماه‌ها به صورت یکجا
            </button>
          </div>

          {/* Graphical breakdowns */}
          <div className="space-y-4 pt-2">
            <h5 className="text-xs font-bold text-slate-300">سهم درآمد خالص ماه جاری</h5>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">سهم شما (مربی): {toPersianNums(100 - clubCommissionRate)}٪</span>
                <span className="text-emerald-400 font-bold">{toPersianNums((currentMonthStats.netCoachIncome).toLocaleString())} تومان</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${100 - clubCommissionRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">کمیسیون باشگاه: {toPersianNums(clubCommissionRate)}٪</span>
                <span className="text-rose-400 font-bold">{toPersianNums((currentMonthStats.clubShareAmount).toLocaleString())} تومان</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${clubCommissionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-white/5 text-xs text-slate-400 space-y-1">
            <span className="font-bold text-white block mb-1">نحوه محاسبه خودکار:</span>
            <p className="leading-relaxed">
              ۱. هر شاگرد تحت مربیگری: <span className="text-white font-bold">{toPersianNums((baseCoachingFeePerStudent).toLocaleString())} تومان</span>
            </p>
            <p className="leading-relaxed">
              ۲. پکیج‌های فروخته شده مربی به مراجعین.
            </p>
            <p className="leading-relaxed">
              ۳. کسر سهم باشگاه ({toPersianNums(clubCommissionRate)}٪) و انتقال خالص دریافتی مربی به صورت آنی.
            </p>
          </div>
        </div>

        {/* Right column: Package Sales Transactions List */}
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-white">تراکنش‌های پکیج و دوره‌های مربیگری</h4>
            </div>

            {/* Live Search and filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="جستجوی ورزشکار یا پکیج..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-white/10 px-3 py-1.5 pl-8 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-500 w-48 text-right"
                  dir="rtl"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-[10px]">
                  <th className="pb-3 pt-1">نام ورزشکار</th>
                  <th className="pb-3 pt-1">عنوان دوره/پکیج</th>
                  <th className="pb-3 pt-1">مبلغ ناخالص</th>
                  <th className="pb-3 pt-1">ماه</th>
                  <th className="pb-3 pt-1">تاریخ ثبت</th>
                  <th className="pb-3 pt-1 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((t) => {
                  const itemClubShare = Math.round((t.price * clubCommissionRate) / 100);
                  const itemNet = t.price - itemClubShare;
                  return (
                    <tr key={t.id} className="hover:bg-white/5 transition-all">
                      <td className="py-3.5 font-bold text-slate-200">{t.studentName}</td>
                      <td className="py-3.5 text-slate-300">
                        <div className="flex flex-col">
                          <span>{t.packageName}</span>
                          <span className="text-[10px] text-slate-500">کد: {t.id}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-amber-400">{toPersianNums((t.price).toLocaleString())} تومان</span>
                          <span className="text-[10px] text-slate-400">سهم خالص مربی: {toPersianNums(itemNet.toLocaleString())}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400">
                          {t.month}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400">{toPersianNums(t.date)}</td>
                      <td className="py-3.5 text-left">
                        <button
                          onClick={() => handleDeleteSale(t.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-all"
                          title="حذف رکورد"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                      هیچ تراکنشی منطبق با معیارهای فیلتر یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <span className="text-slate-400">تراکنش‌های نمایش داده شده: {toPersianNums(filteredTransactions.length)} عدد</span>
            <div className="flex gap-4">
              <span className="text-slate-400">
                مجموع ناخالص: <span className="font-bold text-white">{toPersianNums(filteredTransactions.reduce((acc, curr) => acc + curr.price, 0).toLocaleString())} تومان</span>
              </span>
              <span className="text-slate-400">
                سهم خالص مربی: <span className="font-bold text-emerald-400">{toPersianNums((filteredTransactions.reduce((acc, curr) => acc + curr.price, 0) * (100 - clubCommissionRate) / 100).toLocaleString())} تومان</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Sale Modal */}
      {showAddSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-3xl w-full max-w-lg space-y-4 shadow-2xl text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                ثبت تراکنش جدید برای پکیج فروخته شده
              </h3>
              <button
                onClick={() => setShowAddSaleModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSale} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">ورزشکار خریدار پکیج</label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={formStudentId}
                    onChange={(e) => {
                      setFormStudentId(e.target.value);
                      if (e.target.value === "custom") {
                        setFormStudentName("");
                      } else {
                        const found = members.find(m => m.id === e.target.value);
                        if (found) setFormStudentName(found.name);
                      }
                    }}
                    className="bg-slate-950 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- انتخاب از شاگردان سیستم --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                    ))}
                    <option value="custom">-- ورود نام دستی (خارج از کلوپ) --</option>
                  </select>

                  <input
                    type="text"
                    placeholder="نام ورزشکار به صورت دستی..."
                    value={formStudentName}
                    onChange={(e) => setFormStudentName(e.target.value)}
                    disabled={formStudentId !== "custom" && formStudentId !== ""}
                    className="bg-slate-950 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">عنوان پکیج یا مربیگری خصوصی</label>
                <select
                  value={formPackageName}
                  onChange={(e) => setFormPackageName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="دوره خصوصی ۱۲ جلسه‌ای فیتنس">دوره خصوصی ۱۲ جلسه‌ای فیتنس</option>
                  <option value="برنامه غذایی و رژیم کتوژنیک">برنامه غذایی و رژیم کتوژنیک</option>
                  <option value="آنالیز چربی‌سوزی پیشرفته و بادی کامپوزیشن">آنالیز چربی‌سوزی پیشرفته و بادی کامپوزیشن</option>
                  <option value="تمدید مربیگری اختصاصی ماهانه">تمدید مربیگری اختصاصی ماهانه</option>
                  <option value="دوره VIP مسابقات استانی بدنسازی">دوره VIP مسابقات استانی بدنسازی</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">مبلغ دریافتی (تومان)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 text-left font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">ماه برگزاری/ثبت</label>
                  <select
                    value={formMonth}
                    onChange={(e) => setFormMonth(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {monthsList.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-bold">تاریخ ثبت هجری شمسی</label>
                <input
                  type="text"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  placeholder="مثال: 1405/04/04"
                  className="w-full bg-slate-950 border border-white/10 px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 text-left font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all"
                >
                  ثبت قطعی تراکنش مالی
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSaleModal(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

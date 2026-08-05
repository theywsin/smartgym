import React, { useState } from "react";
import {
  Building,
  Upload,
  Clock,
  MapPin,
  UserPlus,
  Send,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Palette,
  Award,
  ShieldCheck,
  Phone,
  Smartphone,
  Check
} from "lucide-react";

interface TenantWelcomeSetupWizardProps {
  tenant: any;
  onComplete: (updatedTenantData: any) => void;
  onClose: () => void;
}

export const TenantWelcomeSetupWizard: React.FC<TenantWelcomeSetupWizardProps> = ({
  tenant,
  onComplete,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [gymName, setGymName] = useState(tenant?.name || "باشگاه ورزشی اکسیژن");
  const [gymPhone, setGymPhone] = useState(tenant?.phone || "02188889999");
  const [gymAddress, setGymAddress] = useState("تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۴");
  const [gymSlogan, setGymSlogan] = useState("تخصصی‌ترین مرکز فیتنس و بدنسازی هوشمند");
  
  // Theme & Logo
  const [selectedColor, setSelectedColor] = useState("emerald");
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant?.logoUrl || null);

  // Hours
  const [workingHours, setWorkingHours] = useState("همه روزه از ساعت ۰۶:۰۰ الی ۲۳:۰۰");

  // Coach Invite
  const [coachName, setCoachName] = useState("");
  const [coachPhone, setCoachPhone] = useState("");
  const [invitedCoaches, setInvitedCoaches] = useState<any[]>([]);
  const [coachInviteSentStatus, setCoachInviteSentStatus] = useState<string | null>(null);

  // Athlete Invite
  const [athleteName, setAthleteName] = useState("");
  const [athletePhone, setAthletePhone] = useState("");
  const [invitedAthletes, setInvitedAthletes] = useState<any[]>([]);
  const [athleteInviteSentStatus, setAthleteInviteSentStatus] = useState<string | null>(null);

  // Handle Coach Invite SMS
  const handleSendCoachInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachName || !coachPhone) return;

    const newCoach = { id: `c-${Date.now()}`, name: coachName, phone: coachPhone };
    setInvitedCoaches([...invitedCoaches, newCoach]);

    setCoachInviteSentStatus(`دعوتنامه پیامکی (MeliPayamak OTP) با موفقیت به شماره ${coachPhone} ارسال شد.`);
    setCoachName("");
    setCoachPhone("");

    setTimeout(() => setCoachInviteSentStatus(null), 3000);
  };

  // Handle Athlete Invite SMS
  const handleSendAthleteInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteName || !athletePhone) return;

    const newAthlete = { id: `a-${Date.now()}`, name: athleteName, phone: athletePhone };
    setInvitedAthletes([...invitedAthletes, newAthlete]);

    setAthleteInviteSentStatus(`پیامک تبریک عضویت و لینک نصب PWA به شماره ${athletePhone} ارسال شد.`);
    setAthleteName("");
    setAthletePhone("");

    setTimeout(() => setAthleteInviteSentStatus(null), 3000);
  };

  const handleFinishWizard = () => {
    const updatedData = {
      ...tenant,
      name: gymName,
      phone: gymPhone,
      address: gymAddress,
      slogan: gymSlogan,
      themeColor: selectedColor,
      logoUrl: logoPreview,
      workingHours,
      invitedCoachesCount: invitedCoaches.length,
      invitedAthletesCount: invitedAthletes.length,
      isSetupWizardCompleted: true
    };

    localStorage.setItem(`smartgym_tenant_wizard_completed_${tenant?.id || 'default'}`, "true");
    onComplete(updatedData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-fade-in dir-rtl font-sans text-slate-100">
      <div className="bg-slate-900 border border-white/20 rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Wizard Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-2xl text-slate-950 font-black">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>راهنمای تعاملی راه‌اندازی اولیه باشگاه</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Onboarding Wizard
                </span>
              </h2>
              <p className="text-xs text-slate-400">پیکربندی هوشمند ۶ مرحله‌ای برند، مربیان و سیستم پیامکی</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300">
            <span>مرحله {currentStep} از ۶</span>
            <span>
              {currentStep === 1 && "پروفایل و آدرس باشگاه"}
              {currentStep === 2 && "رنگ‌بندی و لوگوی اختصاصی (White-Label)"}
              {currentStep === 3 && "ساعت کاری و موقعیت جغرافیایی"}
              {currentStep === 4 && "دعوت آنلاین مربیان با SMS (مللی‌پیامک)"}
              {currentStep === 5 && "ثبت اعضای اولیه و صدور QR Code"}
              {currentStep === 6 && "تکمیل نهایی و فعال‌سازی کامل"}
            </span>
          </div>

          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* STEP CONTENT */}
        <div className="min-h-[280px] flex flex-col justify-between pt-2">
          
          {/* STEP 1: Gym Profile */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">نام باشگاه / مجموعه ورزشی</label>
                  <input
                    type="text"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">شماره تلفن مستقیم باشگاه</label>
                  <input
                    type="text"
                    value={gymPhone}
                    onChange={(e) => setGymPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">شعار تبلیغاتی یا توضیحات کوتاه</label>
                <input
                  type="text"
                  value={gymSlogan}
                  onChange={(e) => setGymSlogan(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">آدرس دقیق جهت نمایش روی نقشه و فاکتورها</label>
                <textarea
                  rows={2}
                  value={gymAddress}
                  onChange={(e) => setGymAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Branding & Theme Color */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">انتخاب رنگ سازمانی اپلیکیشن باشگاه (Theme Color)</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "emerald", name: "زمردی (Emerald)", bg: "bg-emerald-500" },
                    { id: "blue", name: "آبی سلطنتی (Royal Blue)", bg: "bg-blue-500" },
                    { id: "violet", name: "بنفش مربیگری (Violet)", bg: "bg-violet-500" },
                    { id: "amber", name: "طلایی انرژی (Amber)", bg: "bg-amber-500" },
                    { id: "rose", name: "قرمز اسپرت (Rose)", bg: "bg-rose-500" }
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold transition-all ${
                        selectedColor === c.id
                          ? "bg-white/15 border-white text-white font-black"
                          : "bg-slate-950 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.bg}`}></span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 space-y-3">
                <label className="text-xs font-bold text-slate-300 block">بارگذاری لوگوی اختصاصی باشگاه (White-Label)</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/15 flex items-center justify-center text-2xl font-black text-blue-400">
                    {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-2xl" /> : "🏋️‍♂️"}
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        const fakeLogo = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&auto=format&fit=crop";
                        setLogoPreview(fakeLogo);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-slate-950 font-black text-xs transition-all flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>انتخاب تصویر لوگو</span>
                    </button>
                    <p className="text-[10px] text-slate-400">فرمت‌های مجاز: PNG, SVG, WEBP با پس‌زمینه شفاف</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Working Hours */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">ساعت و روزهای کاری مجموعه</label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-2 text-xs text-slate-300">
                <span className="font-bold text-emerald-400 block">⚡ تنظیمات سانس آقایان و بانوان:</span>
                <p>• سانس آقایان: روزهای زوج و جمعه‌ها از ساعت ۰۸:۰۰ الی ۲۳:۰۰</p>
                <p>• سانس بانوان: روزهای فرد از ساعت ۰۸:۰۰ الی ۲۰:۰۰</p>
              </div>
            </div>
          )}

          {/* STEP 4: Invite Coaches via SMS */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl text-xs text-blue-300 flex items-center gap-2">
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>دعوتنامه‌های پیامکی مستقیماً از سامانه **ملی‌پيامك (MeliPayamak)** ارسال می‌شوند.</span>
              </div>

              {coachInviteSentStatus && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{coachInviteSentStatus}</span>
                </div>
              )}

              <form onSubmit={handleSendCoachInvite} className="grid md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="نام و نام خانوادگی مربی"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  className="bg-slate-950 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white"
                  required
                />
                <input
                  type="tel"
                  placeholder="شماره همراه مربی (0912...)"
                  value={coachPhone}
                  onChange={(e) => setCoachPhone(e.target.value)}
                  className="bg-slate-950 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white font-mono"
                  required
                />
                <button
                  type="submit"
                  className="py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال دعوتنامه SMS</span>
                </button>
              </form>

              {invitedCoaches.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">مربیان دعوت شده ({invitedCoaches.length}):</span>
                  <div className="flex flex-wrap gap-2">
                    {invitedCoaches.map((c) => (
                      <span key={c.id} className="bg-slate-950 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2">
                        <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{c.name} ({c.phone})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Invite Initial Athletes */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>ثبت ورزشکار اولیه همراه با صدور لینک نصب PWA و کارت QR از طریق ملی‌پيامك.</span>
              </div>

              {athleteInviteSentStatus && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{athleteInviteSentStatus}</span>
                </div>
              )}

              <form onSubmit={handleSendAthleteInvite} className="grid md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="نام ورزشکار"
                  value={athleteName}
                  onChange={(e) => setAthleteName(e.target.value)}
                  className="bg-slate-950 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white"
                  required
                />
                <input
                  type="tel"
                  placeholder="شماره موبایل ورزشکار"
                  value={athletePhone}
                  onChange={(e) => setAthletePhone(e.target.value)}
                  className="bg-slate-950 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white font-mono"
                  required
                />
                <button
                  type="submit"
                  className="py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-black text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ثبت و ارسال پیامک</span>
                </button>
              </form>

              {invitedAthletes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">ورزشکاران ثبت شده ({invitedAthletes.length}):</span>
                  <div className="flex flex-wrap gap-2">
                    {invitedAthletes.map((a) => (
                      <span key={a.id} className="bg-slate-950 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{a.name} ({a.phone})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Complete Setup */}
          {currentStep === 6 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 rounded-3xl flex items-center justify-center font-black text-3xl mx-auto shadow-xl shadow-emerald-500/20 animate-bounce">
                🚀
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">تبریک! راه‌اندازی اولیه باشگاه با موفقیت به پایان رسید</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  تمامی داده‌ها، برندسازی اختصاصی، کدهای پیامکی مربیان و اعضا ذخیره شدند. اکنون وارد کنترل‌پنل کامل مدیریت باشگاهمان می‌شوید.
                </p>
              </div>

              <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 text-xs text-slate-300 max-w-md mx-auto text-right space-y-1 font-mono">
                <p>• نام باشگاه: <strong className="text-white">{gymName}</strong></p>
                <p>• رنگ تم سازمانی: <strong className="text-emerald-400">{selectedColor}</strong></p>
                <p>• تعداد مربیان دعوت شده: <strong className="text-blue-400">{invitedCoaches.length} مربی</strong></p>
                <p>• سرویس پیامک: <strong className="text-emerald-400">ملی‌پيامك (فعال)</strong></p>
              </div>
            </div>
          )}

        </div>

        {/* Wizard Footer Navigation Controls */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-bold text-slate-300 transition-all flex items-center gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            <span>مرحله قبلی</span>
          </button>

          {currentStep < 6 ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 text-slate-950 font-black text-xs hover:brightness-110 shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>مرحله بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishWizard}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs hover:brightness-110 shadow-xl shadow-emerald-500/30 active:scale-95 transition-all flex items-center gap-2 animate-pulse"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ورود نهایی به پنل باشگاه</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantWelcomeSetupWizard;

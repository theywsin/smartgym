import React, { useState, useEffect } from "react";
import { CreditCard, RefreshCw, AlertCircle, ShieldCheck, Clock } from "lucide-react";

interface GatewaySimulatorProps {
  amountToman: number;
  planName: string;
  gatewayName: string;
  isSandbox: boolean;
  merchantId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function IranianGatewaySimulator({
  amountToman,
  planName,
  gatewayName,
  isSandbox,
  merchantId,
  onSuccess,
  onCancel
}: GatewaySimulatorProps) {
  // Input states
  const [cardNumber, setCardNumber] = useState("");
  const [cvv2, setCvv2] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [email, setEmail] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [otpInput, setOtpInput] = useState("");

  // System states
  const [captchaCode, setCaptchaCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate random captcha code
  const generateCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setCaptchaInput("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    let interval: any;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && isOtpSent) {
      setIsOtpSent(false);
    }
    return () => clearInterval(interval);
  }, [otpTimer, isOtpSent]);

  // Detect bank based on first 6 digits
  const getBankNameAndStyle = (number: string) => {
    const cleanNum = number.replace(/\s+/g, "");
    if (cleanNum.startsWith("603799")) return { name: "بانک ملی ایران", color: "from-blue-800 to-blue-900", logo: "🔴" };
    if (cleanNum.startsWith("610433")) return { name: "بانک ملت", color: "from-red-600 to-red-800", logo: "🔺" };
    if (cleanNum.startsWith("621986")) return { name: "بانک سامان", color: "from-sky-700 to-sky-900", logo: "🔵" };
    if (cleanNum.startsWith("502229")) return { name: "بانک پاسارگاد", color: "from-amber-500 to-amber-700", logo: "🟡" };
    if (cleanNum.startsWith("627353")) return { name: "بانک تجارت", color: "from-teal-600 to-teal-800", logo: "🟢" };
    if (cleanNum.startsWith("622106")) return { name: "بانک پارسیان", color: "from-yellow-600 to-yellow-800", logo: "⭐" };
    if (cleanNum.startsWith("627412")) return { name: "بانک اقتصاد نوین", color: "from-purple-700 to-purple-900", logo: "💎" };
    return { name: "کارت عضو شتاب", color: "from-slate-700 to-slate-800", logo: "💳" };
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) val = val.substring(0, 16);
    
    // Format with spaces
    let formatted = "";
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += " ";
      formatted += val[i];
    }
    setCardNumber(formatted);
  };

  const handleSendOtp = () => {
    if (cardNumber.replace(/\s+/g, "").length < 16) {
      setErrorMsg("لطفاً شماره کارت ۱۶ رقمی معتبر را وارد کنید.");
      return;
    }
    setIsOtpSent(true);
    setOtpTimer(120);
    setErrorMsg("");
    alert("رمز دوم پویا (OTP) به شماره همراه متصل به این کارت شبیه‌سازی و ارسال شد.");
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanCard = cardNumber.replace(/\s+/g, "");
    if (cleanCard.length < 16) {
      setErrorMsg("شماره کارت ناقص است.");
      return;
    }
    if (cvv2.length < 3) {
      setErrorMsg("رمز CVV2 معتبر نیست.");
      return;
    }
    if (expMonth.length !== 2 || expYear.length !== 2) {
      setErrorMsg("تاریخ انقضا معتبر نیست.");
      return;
    }
    if (captchaInput !== captchaCode) {
      setErrorMsg("کد امنیتی تصویر اشتباه وارد شده است.");
      generateCaptcha();
      return;
    }
    if (!otpInput) {
      setErrorMsg("لطفاً رمز دوم پویا را وارد کنید.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  const bankInfo = getBankNameAndStyle(cardNumber);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-100 flex flex-col items-center justify-center p-4 text-slate-800 font-sans" dir="rtl">
      {/* Network Header bar representing standard Iranian Shaparak Gateway */}
      <div className="w-full max-w-4xl bg-white shadow-md rounded-2xl overflow-hidden border border-slate-200">
        
        {/* PSP Identity line */}
        <div className="bg-gradient-to-r from-teal-700 to-cyan-800 p-4 text-white flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-base font-black">درگاه پرداخت الکترونیک به پرداخت شتاب</h1>
              <p className="text-[10px] text-teal-100 font-mono">درگاه امن متصل به شرکت {gatewayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs bg-white/10 px-3 py-1.5 rounded-xl font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>شاپرک: اتصال امن برقرار است</span>
          </div>
        </div>

        {/* Info bar: Gym subscription billing summary */}
        <div className="bg-slate-50 border-b border-slate-200 p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 block">نام پذیرنده:</span>
            <span className="font-extrabold text-slate-800">پلتفرم مدیریت هوشمند اسمارت جیم (SaaS)</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 block">بابت خرید:</span>
            <span className="font-extrabold text-emerald-600">{planName}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 block">مبلغ قابل پرداخت:</span>
            <div className="space-y-0.5">
              <span className="font-black text-slate-900 text-sm">
                {amountToman.toLocaleString()} <span className="font-normal text-[10px] text-slate-500">تومان</span>
              </span>
              <span className="text-[9px] text-slate-400 block">
                معادل {(amountToman * 10).toLocaleString()} ریال
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-12">
          
          {/* Main Card Inputs Form */}
          <form onSubmit={handlePaymentSubmit} className="md:col-span-8 p-6 space-y-5 border-l border-slate-200 text-xs">
            
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isSandbox && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl">
                ⚠️ <strong>حالت شبیه‌ساز فعال است:</strong> درگاه در محیط دمو (Sandbox) قرار دارد. مشخصات را وارد کرده و بر روی دکمه پرداخت کلیک کنید. لایسنس شما بلافاصله صادر خواهد شد.
              </div>
            )}

            {/* Card number Input with visual card styling */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 flex justify-between items-center">
                <span>شماره کارت ۱۶ رقمی شتاب</span>
                <span className="text-[10px] text-slate-400 font-mono">Card Number</span>
              </label>
              
              <div className="relative">
                <input 
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full text-left font-mono font-bold tracking-widest text-base pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">{bankInfo.logo}</span>
                  <CreditCard className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              {cardNumber.length >= 6 && (
                <div className={`p-2 rounded-lg bg-gradient-to-r ${bankInfo.color} text-white font-extrabold text-[10px] text-center shadow-sm`}>
                  بانک صادرکننده شناسایی شد: {bankInfo.name}
                </div>
              )}
            </div>

            {/* CVV2 and Expiration Date Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-bold text-slate-700 flex justify-between items-center">
                  <span>کد امنیتی کارت (CVV2)</span>
                  <span className="text-[10px] text-slate-400 font-mono">CVV2</span>
                </label>
                <input 
                  type="password"
                  maxLength={4}
                  value={cvv2}
                  onChange={(e) => setCvv2(e.target.value.replace(/\D/g, ""))}
                  placeholder="۳ یا ۴ رقم پشت کارت"
                  className="w-full text-center font-mono font-bold py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 flex justify-between items-center">
                  <span>تاریخ انقضای کارت</span>
                  <span className="text-[10px] text-slate-400 font-mono">Expiry Date</span>
                </label>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <input 
                    type="text"
                    maxLength={2}
                    placeholder="ماه"
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, ""))}
                    className="py-2.5 border border-slate-300 rounded-xl font-mono text-center focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                  <input 
                    type="text"
                    maxLength={2}
                    placeholder="سال"
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value.replace(/\D/g, ""))}
                    className="py-2.5 border border-slate-300 rounded-xl font-mono text-center focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Captcha Security Code Row */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 flex justify-between items-center">
                <span>کد امنیتی تصویر زیر</span>
                <span className="text-[10px] text-slate-400 font-mono">Security Code</span>
              </label>
              <div className="flex gap-3">
                <input 
                  type="text"
                  maxLength={4}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="اعداد موجود در کادر"
                  className="flex-1 text-center font-mono text-sm tracking-widest py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
                
                {/* Visual Captcha box */}
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 rounded-xl px-4 py-1">
                  <span className="font-mono text-lg font-bold tracking-widest line-through select-none text-slate-700 italic">
                    {captchaCode}
                  </span>
                  <button 
                    type="button" 
                    onClick={generateCaptcha}
                    className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-teal-600"
                    title="کد جدید"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic OTP Code input & trigger button */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 flex justify-between items-center">
                <span>رمز دوم پویا (اینترنتی)</span>
                <span className="text-[10px] text-slate-400 font-mono">One-Time Password</span>
              </label>
              <div className="flex gap-2">
                <input 
                  type="password"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="رمز پیامک شده را وارد کنید"
                  className="flex-1 text-center font-mono tracking-widest py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
                <button 
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpTimer > 0}
                  className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1 shrink-0"
                >
                  {otpTimer > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin text-teal-600" />
                      <span>{otpTimer} ثانیه</span>
                    </>
                  ) : (
                    <span>درخواست رمز پویا</span>
                  )}
                </button>
              </div>
            </div>

            {/* Email Address (optional) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-600 flex justify-between items-center">
                <span>آدرس ایمیل (اختیاری)</span>
                <span className="text-[9px] text-slate-400">رسید الکترونیک به این آدرس ارسال می‌شود</span>
              </label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full text-left font-mono py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Submit Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button 
                type="submit"
                disabled={isProcessing}
                className="bg-gradient-to-l from-teal-700 to-cyan-600 hover:brightness-110 disabled:bg-teal-900 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md shadow-teal-900/10 text-center text-sm"
              >
                {isProcessing ? "در حال تراکنش بانکی..." : "پرداخت و صدور لایسنس"}
              </button>
              <button 
                type="button"
                onClick={onCancel}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold py-3.5 rounded-xl transition-all text-center text-sm"
              >
                انصراف و بازگشت
              </button>
            </div>

          </form>

          {/* Secure Payment Instruction side rail */}
          <div className="md:col-span-4 p-6 bg-slate-50 space-y-6 text-slate-600 text-[11px] leading-relaxed">
            
            <div className="space-y-2">
              <span className="font-extrabold text-slate-800 text-xs block border-b border-slate-200 pb-1.5">راهنمای پرداخت امن</span>
              <p>۱. شماره کارت ۱۶ رقمی شتاب خود را بدون فاصله وارد کنید.</p>
              <p>۲. کد CVV2 کد ۳ یا ۴ رقمی درج شده روی کارت یا پشت آن است.</p>
              <p>۳. تاریخ انقضا شامل ۲ رقم ماه و ۲ رقم سال است (مثلاً ۰۷).</p>
              <p>۴. رمز دوم پویا از طریق اپلیکیشن بانک یا پیامک صادر می‌شود.</p>
            </div>

            <div className="space-y-2">
              <span className="font-extrabold text-slate-800 text-xs block border-b border-slate-200 pb-1.5">امنیت و گواهی‌ها</span>
              <p>این سیستم به سامانه جامع شاپرک بانک مرکزی جمهوری اسلامی ایران متصل است. پروتکل رمزنگاری SSL ۲۵۶ بیتی فعال است.</p>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-teal-800">
              ⚡ <strong>کد پذیرنده:</strong> {merchantId || "SANDBOX-90184"}<br />
              🛠️ <strong>متد:</strong> {gatewayName}
            </div>

          </div>

        </div>

      </div>
      
      <div className="mt-6 text-slate-400 text-[10px] text-center font-mono flex items-center gap-2">
        <span>© ۱۴۰۵ شرکت شبکه الکترونیک پرداخت کارت (شاپرک)</span>
        <span>|</span>
        <span>نسخه ۲.۴.۰ امنیت بالا</span>
      </div>
    </div>
  );
}

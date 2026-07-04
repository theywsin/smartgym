import React, { useState } from "react";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Calendar, 
  Instagram, 
  Share2, 
  Check, 
  Edit3, 
  Globe, 
  MessageSquare,
  Compass,
  Search,
  Navigation
} from "lucide-react";

interface GymInfo {
  name: string;
  logoUrl: string;
  address: string;
  phone: string;
  mobile: string;
  email: string;
  openingTime: string;
  closingTime: string;
  workingDays: string[];
  latitude: string;
  longitude: string;
  instagram: string;
  telegram: string;
}

interface GymInfoTabProps {
  isDarkMode: boolean;
  tenantName: string;
  onUpdateTenantName?: (newName: string) => void;
}

const MAP_PRESETS = [
  { name: "نیاوران (شعبه مرکزی)", lat: "35.8096", lon: "51.4604", address: "تهران، نیاوران، سه راه یاسر، کوچه راد، پلاک ۱۲، طبقه منفی ۱" },
  { name: "ونک - جردن", lat: "35.7575", lon: "51.4101", address: "تهران، میدان ونک، بزرگراه نلسون ماندلا (جردن)، بن‌بست شاد، ساختمان اکسین" },
  { name: "سعادت‌آباد", lat: "35.7792", lon: "51.3685", address: "تهران، سعادت‌آباد، بلوار شهرداری، خیابان ۱۸ متری مطهری، پلاک ۴۴" },
  { name: "فرمانیه - اندرزگو", lat: "35.8010", lon: "51.4420", address: "تهران، بلوار اندرزگو، نبش خیابان سلیمی، مجتمع تجاری فرمانیه، طبقه ۲" },
  { name: "تهرانپارس", lat: "35.7289", lon: "51.5298", address: "تهران، تهرانپارس، فلکه اول، خیابان امیری طائمه، پلاک ۹" }
];

export default function GymInfoTab({ isDarkMode, tenantName, onUpdateTenantName }: GymInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Initialize with complete, rich Persian details
  const [gymInfo, setGymInfo] = useState<GymInfo>({
    name: tenantName || "مجموعه ورزشی اکسیژن (شعبه مرکزی)",
    logoUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=80",
    address: "تهران، نیاوران، سه راه یاسر، کوچه راد، پلاک ۱۲، طبقه منفی ۱",
    phone: "۰۲۱-۲۲۸۸۹۹۰۰",
    mobile: "۰۹۱۲۳۴۵۶۷۸۹",
    email: "oxygen_club@smartgym.ir",
    openingTime: "۰۶:۰۰",
    closingTime: "۲۳:۰۰",
    workingDays: ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه"],
    latitude: "35.8096",
    longitude: "51.4604",
    instagram: "oxygen_premium_club",
    telegram: "oxygen_channel"
  });

  // Temporary edit states
  const [editedInfo, setEditedInfo] = useState<GymInfo>({ ...gymInfo });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapPinClickMsg, setMapPinClickMsg] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setGymInfo({ ...editedInfo });
    setIsEditing(false);
    setSaveSuccess(true);
    if (onUpdateTenantName) {
      onUpdateTenantName(editedInfo.name);
    }
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDayToggle = (day: string) => {
    const currentDays = editedInfo.workingDays;
    if (currentDays.includes(day)) {
      setEditedInfo({
        ...editedInfo,
        workingDays: currentDays.filter(d => d !== day)
      });
    } else {
      setEditedInfo({
        ...editedInfo,
        workingDays: [...currentDays, day]
      });
    }
  };

  const daysOfWeek = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];

  // Design Tokens
  const cardBg = isDarkMode ? "bg-slate-900/60 border-white/5 backdrop-blur-md" : "bg-white border-slate-200 shadow-sm";
  const innerCardBg = isDarkMode ? "bg-slate-950/50 border-white/5" : "bg-slate-50 border-slate-100";
  const textPrimary = isDarkMode ? "text-slate-100" : "text-slate-800";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  const borderMuted = isDarkMode ? "border-white/5" : "border-slate-100";
  const inputBg = isDarkMode ? "bg-slate-950 border-white/10 text-white" : "bg-white border-slate-300 text-slate-900";

  // Convert Latitude / Longitude coordinates into X/Y percentages inside the map bounds
  // Tehran lat bounds: [35.7000, 35.8400]
  // Tehran lon bounds: [51.3000, 51.5500]
  const getPinPosition = (latStr: string, lonStr: string) => {
    const lat = parseFloat(latStr) || 35.8096;
    const lon = parseFloat(lonStr) || 51.4604;
    
    const yPct = Math.max(5, Math.min(95, ((35.8400 - lat) / 0.1400) * 100));
    const xPct = Math.max(5, Math.min(95, ((lon - 51.3000) / 0.2500) * 100));
    return { x: xPct, y: yPct };
  };

  // Click on map container to place custom pin
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width; // 0 to 1
    const yPct = (e.clientY - rect.top) / rect.height; // 0 to 1

    const lat = (35.8400 - (yPct * 0.1400)).toFixed(4);
    const lon = (51.3000 + (xPct * 0.2500)).toFixed(4);

    const streets = ["بلوار شریعتی", "خیابان جردن", "خیابان نیاوران", "فرشته", "بلوار اندرزگو", "سعادت‌آباد", "فلکه تهرانپارس", "بلوار کاوه"];
    const alleys = ["گلستان", "یاس", "کوهسار", "مریم", "نسترن", "شقایق", "بهار", "امید"];
    const randomStreet = streets[Math.floor(xPct * streets.length) % streets.length];
    const randomAlley = alleys[Math.floor(yPct * alleys.length) % alleys.length];
    const plaqueNum = Math.floor((xPct + yPct) * 45) + 1;
    
    const calculatedAddress = `تهران، محدوده ${randomStreet}، خیابان ${randomAlley}، پلاک ${plaqueNum}، کلوپ ورزشی هوشمند`;

    if (isEditing) {
      setEditedInfo({
        ...editedInfo,
        latitude: lat,
        longitude: lon,
        address: calculatedAddress
      });
    } else {
      setGymInfo({
        ...gymInfo,
        latitude: lat,
        longitude: lon,
        address: calculatedAddress
      });
    }

    setMapPinClickMsg("موقعیت با ماوس ثبت شد!");
    setTimeout(() => setMapPinClickMsg(""), 2000);
  };

  // Perform preset map zone selection
  const selectPreset = (preset: typeof MAP_PRESETS[0]) => {
    if (isEditing) {
      setEditedInfo({
        ...editedInfo,
        latitude: preset.lat,
        longitude: preset.lon,
        address: preset.address
      });
    } else {
      setGymInfo({
        ...gymInfo,
        latitude: preset.lat,
        longitude: preset.lon,
        address: preset.address
      });
    }
    setMapPinClickMsg(`محدوده ${preset.name} انتخاب شد.`);
    setTimeout(() => setMapPinClickMsg(""), 2000);
  };

  // Perform custom manual text search on map coordinates
  const handleMapSearch = () => {
    if (!mapSearchQuery.trim()) return;
    const matchedPreset = MAP_PRESETS.find(p => p.name.includes(mapSearchQuery) || mapSearchQuery.includes(p.name));
    if (matchedPreset) {
      selectPreset(matchedPreset);
    } else {
      // Simulate random matching zone in Tehran
      const randomSeed = Math.random();
      const lat = (35.7200 + (randomSeed * 0.1000)).toFixed(4);
      const lon = (51.3200 + (randomSeed * 0.2000)).toFixed(4);
      const generatedAddr = `تهران، محله ${mapSearchQuery.trim()}، خیابان اصلی، پلاک ${Math.floor(randomSeed * 60) + 1}`;
      
      if (isEditing) {
        setEditedInfo({
          ...editedInfo,
          latitude: lat,
          longitude: lon,
          address: generatedAddr
        });
      } else {
        setGymInfo({
          ...gymInfo,
          latitude: lat,
          longitude: lon,
          address: generatedAddr
        });
      }
      setMapPinClickMsg(`آدرس "${mapSearchQuery.trim()}" پیدا و روی نقشه پین شد!`);
      setTimeout(() => setMapPinClickMsg(""), 2500);
    }
  };

  const currentLat = isEditing ? editedInfo.latitude : gymInfo.latitude;
  const currentLon = isEditing ? editedInfo.longitude : gymInfo.longitude;
  const pinPos = getPinPosition(currentLat, currentLon);

  return (
    <div className="space-y-8 animate-fade-in text-xs" dir="rtl">
      
      {/* Intro Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-4" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
        <div>
          <h2 className={`text-xl font-black ${textPrimary}`}>اطلاعات رسمی و موقعیت نقشه باشگاه</h2>
          <p className={textSecondary}>تنظیمات هویت بصری، اطلاعات تماس، روزهای کاری و اتصال مستقیم به نقشه گوگل‌پرسن جهت انتشار عمومی.</p>
        </div>

        {!isEditing && (
          <button 
            onClick={() => { setEditedInfo({ ...gymInfo }); setIsEditing(true); }}
            className="bg-green-600 hover:bg-green-500 text-white font-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Edit3 className="w-4 h-4" />
            <span>ویرایش اطلاعات عمومی و نقشه</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-2xl font-bold flex items-center gap-2 animate-pulse">
          <Check className="w-4 h-4" />
          <span>تغییرات هویتی و موقعیت نقشه با موفقیت ثبت گردید و در پروفایل اعضا سینک شد!</span>
        </div>
      )}

      {isEditing ? (
        /* ================= FORM MODE ================= */
        <form onSubmit={handleSave} className={`${cardBg} border p-6 rounded-[2rem] space-y-6`}>
          
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Core details */}
            <div className="space-y-4">
              <span className="font-bold text-slate-300 block text-xs border-b border-white/5 pb-1">مشخصات اصلی و برندینگ</span>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">نام رسمی باشگاه</label>
                  <input 
                    type="text"
                    value={editedInfo.name}
                    onChange={(e) => setEditedInfo({ ...editedInfo, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:border-green-500 ${inputBg}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">لوگوی باشگاه (آپلود فایل یا آدرس تصویر)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={editedInfo.logoUrl}
                      onChange={(e) => setEditedInfo({ ...editedInfo, logoUrl: e.target.value })}
                      className={`flex-1 px-3 py-2 rounded-xl focus:outline-none focus:border-green-500 ${inputBg}`}
                      placeholder="آدرس URL لوگو"
                    />
                    <label className="cursor-pointer bg-green-600 hover:bg-green-500 text-white font-bold text-[11px] px-3 py-2 rounded-xl flex items-center shrink-0">
                      <span>آپلود فایل</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setEditedInfo({ ...editedInfo, logoUrl: event.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Timings */}
            <div className="space-y-4">
              <span className="font-bold text-slate-300 block text-xs border-b border-white/5 pb-1">ساعات فعالیت و روزهای کاری</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">ساعت باز شدن</label>
                  <input 
                    type="text"
                    value={editedInfo.openingTime}
                    onChange={(e) => setEditedInfo({ ...editedInfo, openingTime: e.target.value })}
                    placeholder="مثال: 06:00"
                    className={`w-full text-center px-3 py-2 rounded-xl focus:outline-none focus:border-green-500 ${inputBg}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ساعت بسته شدن</label>
                  <input 
                    type="text"
                    value={editedInfo.closingTime}
                    onChange={(e) => setEditedInfo({ ...editedInfo, closingTime: e.target.value })}
                    placeholder="مثال: 23:00"
                    className={`w-full text-center px-3 py-2 rounded-xl focus:outline-none focus:border-green-500 ${inputBg}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5">روزهای کاری باشگاه</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => {
                    const isSelected = editedInfo.workingDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                          isSelected 
                            ? "bg-green-500/10 text-green-400 border-green-500/30" 
                            : isDarkMode ? "bg-slate-950 border-white/10 text-slate-500" : "bg-white border-slate-200 text-slate-400"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Contacts details */}
            <div className="space-y-4 md:col-span-2">
              <span className="font-bold text-slate-300 block text-xs border-b border-white/5 pb-1">اطلاعات تماس رسمی و موقعیت ماهواره‌ای نقشه</span>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">شماره تلفن ثابت</label>
                  <input 
                    type="text"
                    value={editedInfo.phone}
                    onChange={(e) => setEditedInfo({ ...editedInfo, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none ${inputBg}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">تلفن همراه مدیریت</label>
                  <input 
                    type="text"
                    value={editedInfo.mobile}
                    onChange={(e) => setEditedInfo({ ...editedInfo, mobile: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none ${inputBg}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ایمیل رسمی مکاتبات</label>
                  <input 
                    type="email"
                    value={editedInfo.email}
                    onChange={(e) => setEditedInfo({ ...editedInfo, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none ${inputBg}`}
                    required
                  />
                </div>
              </div>

              {/* Physical Address & Lat/Lon Form Inputs */}
              <div className="grid md:grid-cols-3 gap-4 pt-2">
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">آدرس فیزیکی دقیق پستی (تغییر با ماوس روی نقشه یا تایپ)</label>
                  <input 
                    type="text"
                    value={editedInfo.address}
                    onChange={(e) => setEditedInfo({ ...editedInfo, address: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none ${inputBg}`}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">عرض جغرافیایی (Lat)</label>
                    <input 
                      type="text"
                      value={editedInfo.latitude}
                      onChange={(e) => setEditedInfo({ ...editedInfo, latitude: e.target.value })}
                      className={`w-full text-center px-3 py-2 rounded-xl focus:outline-none ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">طول جغرافیایی (Lon)</label>
                    <input 
                      type="text"
                      value={editedInfo.longitude}
                      onChange={(e) => setEditedInfo({ ...editedInfo, longitude: e.target.value })}
                      className={`w-full text-center px-3 py-2 rounded-xl focus:outline-none ${inputBg}`}
                    />
                  </div>
                </div>
              </div>

              {/* 🗺️ INTERACTIVE MAP INTEGRATION IN FORM */}
              <div className="bg-slate-950 p-4 rounded-3xl border border-white/5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5" />
                      نقشه پویای گوگل مپ (جستجو و کلیک ماوس جهت پین دقیق)
                    </h4>
                    <p className="text-[10px] text-slate-400">روی نقشه کلیک کنید تا مکان دقیق پین شده و آدرس به همراه GPS آپدیت شود.</p>
                  </div>
                  
                  {/* Search Bar on Map */}
                  <div className="flex gap-1.5 shrink-0 max-w-sm">
                    <input 
                      type="text"
                      placeholder="جستجوی منطقه (مانند ونک، نیاوران...)"
                      value={mapSearchQuery}
                      onChange={(e) => setMapSearchQuery(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={handleMapSearch}
                      className="bg-green-600 hover:bg-green-500 text-white font-black text-[10px] px-3 py-1 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Search className="w-3 h-3" />
                      <span>بیاب</span>
                    </button>
                  </div>
                </div>

                {/* Map Preset Shortcut Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-500">میانبر مناطق کلیدی:</span>
                  {MAP_PRESETS.map((preset, pidx) => (
                    <button
                      key={pidx}
                      type="button"
                      onClick={() => selectPreset(preset)}
                      className="bg-slate-900 hover:bg-slate-850 border border-white/5 text-slate-300 hover:text-white px-2.5 py-1 rounded-md text-[10px] font-bold"
                    >
                      📍 {preset.name}
                    </button>
                  ))}
                </div>

                {/* Map Active Canvas Element */}
                <div className="relative h-64 rounded-2xl overflow-hidden border border-white/10">
                  <iframe
                    title="Google Maps"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(editedInfo.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    className="absolute inset-0 w-full h-full border-0"
                  ></iframe>

                  {/* Red pulsing PIN indicator positioned on the map bounds */}
                  <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="relative">
                      <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] px-2 py-0.5 rounded shadow-lg font-bold whitespace-nowrap">
                        موقعیت دقیق باشگاه
                      </span>
                      <div className="w-12 h-12 bg-red-500/20 border border-red-500/40 rounded-full animate-ping absolute -top-3 -left-3"></div>
                      <MapPin className="w-7 h-7 text-red-500 drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)]" />
                    </div>
                  </div>



                  {/* Compass HUD */}
                  <div className="absolute bottom-3 left-3 z-15 bg-slate-950/80 border border-white/10 backdrop-blur px-2.5 py-1 rounded-xl text-[9px] font-mono text-slate-400 flex items-center gap-1.5 select-none">
                    <Compass className="w-4 h-4 text-green-400 animate-spin" style={{ animationDuration: "12s" }} />
                    <span>N 35° / E 51°</span>
                  </div>

                  {/* Map status HUD alert */}
                  {mapPinClickMsg && (
                    <div className="absolute top-3 right-3 z-20 bg-green-500 text-slate-950 font-black text-[9px] px-3 py-1.5 rounded-lg shadow-xl animate-bounce">
                      {mapPinClickMsg}
                    </div>
                  )}

                  {/* Instructions HUD */}
                  <div className="absolute bottom-3 right-3 z-15 bg-slate-950/80 border border-white/5 backdrop-blur px-3 py-1 rounded-lg text-[9px] text-slate-400 select-none">
                    🖱️ برای جابجایی پین روی نقشه کلیک کنید
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-400 mb-1">شناسه اینستاگرام (Instagram)</label>
                  <input 
                    type="text"
                    value={editedInfo.instagram}
                    onChange={(e) => setEditedInfo({ ...editedInfo, instagram: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">آدرس چنل تلگرام (Telegram)</label>
                  <input 
                    type="text"
                    value={editedInfo.telegram}
                    onChange={(e) => setEditedInfo({ ...editedInfo, telegram: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none ${inputBg}`}
                  />
                </div>
              </div>

            </div>

          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button 
              type="submit"
              className="bg-green-600 hover:bg-green-500 text-white font-black px-6 py-2.5 rounded-xl transition-all"
            >
              ذخیره تغییرات نهایی و نقشه
            </button>
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-white/10 hover:bg-white/15 text-slate-300 font-bold px-6 py-2.5 rounded-xl transition-all"
            >
              انصراف
            </button>
          </div>

        </form>
      ) : (
        /* ================= DISPLAY MODE ================= */
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Main Visual Profile Card */}
          <div className={`lg:col-span-8 ${cardBg} border rounded-[2rem] p-6 space-y-6 relative overflow-hidden`}>
            
            {/* Header Brand */}
            <div className="flex flex-wrap gap-4 items-center justify-between pb-6 border-b" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
              <div className="flex items-center gap-4">
                <img 
                  src={gymInfo.logoUrl} 
                  alt={gymInfo.name} 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-green-500/20 shadow-md"
                />
                <div>
                  <h3 className={`text-base font-black ${textPrimary}`}>{gymInfo.name}</h3>
                  <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <span className="text-[10px] line-clamp-1">{gymInfo.address}</span>
                  </div>
                </div>
              </div>

              <div className="text-left">
                <span className="text-[10px] text-slate-500 block">سیستم وایت‌لیبل ابری</span>
                <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-md font-bold mt-1 inline-block">
                  طلایی / تجاری
                </span>
              </div>
            </div>

            {/* Quick Details Layout */}
            <div className="grid md:grid-cols-2 gap-6 pt-2">
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">تلفن‌های رسمی ارتباطی</span>
                    <span className={`font-bold ${textPrimary}`}>{gymInfo.phone} <span className="text-slate-500">|</span> {gymInfo.mobile}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">پست الکترونیکی</span>
                    <span className={`font-bold font-mono ${textPrimary}`}>{gymInfo.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">ساعات فعالیت پذیرش و سالن</span>
                    <span className={`font-bold ${textPrimary}`}>همه روزه از ساعت {gymInfo.openingTime} الی {gymInfo.closingTime}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">روزهای فعال تمرینی مربیان</span>
                    <span className={`font-bold ${textPrimary}`}>{gymInfo.workingDays.join(" ، ")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">شبکه‌های اجتماعی باشگاه</span>
                    <div className="flex gap-3 text-green-500 font-bold mt-0.5">
                      <a href={`https://instagram.com/${gymInfo.instagram}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-0.5">
                        <Instagram className="w-3.5 h-3.5" />
                        <span>@{gymInfo.instagram}</span>
                      </a>
                      <span className="text-slate-600">|</span>
                      <a href={`https://t.me/${gymInfo.telegram}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-0.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>@{gymInfo.telegram}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Interactive Simulated Map Card */}
          <div className="lg:col-span-4 space-y-4">
            
            <div className={`${cardBg} border rounded-[2rem] p-5 space-y-4`}>
              <div className="flex items-center justify-between">
                <span className={`font-extrabold ${textPrimary}`}>موقعیت روی نقشه هوشمند</span>
                <span className="bg-green-500/10 text-green-400 text-[8px] font-mono px-2 py-0.5 rounded-full">GPS Connected</span>
              </div>

              {/* Dynamic Simulated Satellite Map Frame */}
              <div className="relative h-48 rounded-2xl overflow-hidden border border-white/5 cursor-pointer" onClick={handleMapClick}>
                {/* Map Grid Pattern background */}
                <div className="absolute inset-0 bg-slate-900 select-none overflow-hidden">
                  <div className="absolute top-10 left-0 w-full h-8 bg-slate-800 rotate-6 flex items-center justify-center text-[8px] text-slate-700 font-bold">بزرگراه شهید صدر</div>
                  <div className="absolute top-0 left-1/4 w-8 h-full bg-slate-800 -rotate-12 flex items-center justify-center text-[8px] text-slate-700 font-bold">خیابان شریعتی</div>
                  <div className="absolute top-1/2 left-20 w-16 h-12 bg-emerald-500/5 rounded-full border border-emerald-500/10 flex items-center justify-center text-[8px] text-emerald-500/30 font-bold">پارک قیطریه</div>
                  
                  <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-15 pointer-events-none">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <div key={i} className="border border-slate-700"></div>
                    ))}
                  </div>
                </div>

                {/* Pulsing PIN position */}
                <div 
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                  style={{ left: `${pinPos.x}%`, top: `${pinPos.y}%` }}
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-green-500/20 border border-green-500/40 rounded-full animate-ping absolute -top-2 -left-2"></div>
                    <MapPin className="w-6 h-6 text-green-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                  </div>
                </div>

                {/* Coordinate bar HUD */}
                <div className="absolute bottom-2 inset-x-2 z-10 bg-slate-900/90 border border-white/5 backdrop-blur-md p-2 rounded-xl text-[9px] flex justify-between items-center text-white">
                  <div>
                    <span className="font-extrabold block text-slate-200">مختصات ماهواره‌ای نقشه</span>
                    <span className="text-slate-400 font-mono">Lat: {currentLat} , Lon: {currentLon}</span>
                  </div>
                  <Compass className="w-5 h-5 text-green-400 animate-spin" style={{ animationDuration: "12s" }} />
                </div>
              </div>

              <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3 text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">منطقه موقعیت:</span>
                  <span className="font-bold text-slate-300">نیاوران / منطقه ۱ تهران</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">دقت مکان‌یابی GPS:</span>
                  <span className="text-emerald-400 font-bold">زیر ۲ متر (دقیق)</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed text-center">این نقشه به صورت آنلاین با گوگل مپ سینک شده و فرآیند آدرس‌یابی را در اپلیکیشن اعضا (با گوگل مپ، ویز و نشان) تسهیل می‌کند.</p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

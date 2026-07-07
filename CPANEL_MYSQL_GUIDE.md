# راهنمای جامع انتقال پروژه «اسمارت جیم» (SmartGym) به cPanel با دیتابیس MySQL (phpMyAdmin)

این راهنما برای هدایت شما جهت استقرار (Deploy) کامل و امن پروژه فریم‌ورک React (Vite) به همراه بک‌اند Node.js (Express) روی هاست **cPanel** و تبدیل لایه ذخیره‌سازی داده از Firebase به یک دیتابیس رابطه‌ای واقعی **MySQL** (که از طریق پنل محبوب **phpMyAdmin** مدیریت می‌شود) طراحی شده است.

---

## بخش ۱: معماری کلی انتقال (Architecture Overview)

در هاست‌های ابری cPanel، به دلایل امنیتی مرورگر کاربر نباید به‌طور مستقیم به دیتابیس MySQL متصل شود. بنابراین معماری پروژه از اتصال مستقیم کلاینت به Firebase، به ساختار **Full-Stack کلاینت-سرور** تبدیل خواهد شد:

1. **لایه فرانت‌اند (React SPA):** کدهای فرانت‌اند با دستور `npm run build` به فایل‌های استاتیک HTML/JS/CSS تبدیل شده و در پوشه `dist` قرار می‌گیرند. فرانت‌اند درخواست‌های داده‌ای خود را با متد `fetch` به آدرس‌های API بک‌اند ارسال می‌کند (به عنوان مثال `GET /api/members`).
2. **لایه بک‌اند (Express.js Server):** سرور Express شما روی cPanel با استفاده از قابلیت **cPanel Application Manager (یا Setup Node.js App)** اجرا می‌شود. این سرور از کتابخانه `mysql2` استفاده کرده، درخواست‌های فرانت‌اند را دریافت می‌کند، دیتابیس MySQL را کوئری می‌زند و پاسخ را به صورت JSON بازمی‌گرداند.
3. **لایه دیتابیس (MySQL & phpMyAdmin):** دیتابیس شما در cPanel ساخته شده و تمام جداول ورزشی و مدیریتی در آن ذخیره می‌شوند.

---

## بخش ۲: کدهای ساخت جداول دیتابیس در phpMyAdmin (SQL DDL Script)

برای شروع، وارد cPanel خود شوید، از بخش **MySQL Databases** یک دیتابیس جدید بسازید (مثلاً `smartgym_db`)، یک کاربر بسازید و تمام دسترسی‌ها (Privileges) را به آن کاربر بدهید. 
سپس وارد **phpMyAdmin** شده، روی دیتابیس خود کلیک کنید و در تب **SQL** کدهای زیر را برای ساخت تمام جداول مورد نیاز پروژه اجرا کنید:

```sql
-- ۱. جدول کلوپ‌ها / مستاجران (Tenants)
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` VARCHAR(128) NOT NULL,
  `clubName` VARCHAR(255) NOT NULL,
  `ownerName` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'ACTIVE',
  `planName` VARCHAR(255) DEFAULT NULL,
  `expiresAt` VARCHAR(50) DEFAULT NULL,
  `branchesCount` INT DEFAULT 0,
  `membersCount` INT DEFAULT 0,
  `monthlyRevenue` DECIMAL(15,2) DEFAULT 0.00,
  `createdAt` VARCHAR(50) DEFAULT NULL,
  `features` TEXT DEFAULT NULL, -- ذخیره به صورت JSON stringified
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ۲. جدول مربیان (Coaches)
CREATE TABLE IF NOT EXISTS `coaches` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `specialty` VARCHAR(255) DEFAULT NULL,
  `clubId` VARCHAR(128) DEFAULT 'all',
  `rating` DECIMAL(3,2) DEFAULT 0.00,
  `activeAthletes` INT DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ۳. جدول ورزشکاران / اعضا (Members)
CREATE TABLE IF NOT EXISTS `members` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `assignedProgramId` VARCHAR(128) DEFAULT NULL,
  `assignedNutritionId` VARCHAR(128) DEFAULT NULL,
  `remainingSessions` INT DEFAULT 0,
  `remainingDays` INT DEFAULT 0,
  `coachName` VARCHAR(255) DEFAULT 'بدون مربی',
  `joinedDate` VARCHAR(50) DEFAULT NULL,
  `bmi` VARCHAR(50) DEFAULT NULL,
  `bmr` VARCHAR(50) DEFAULT NULL,
  `fatPercent` VARCHAR(50) DEFAULT NULL,
  `armSize` VARCHAR(50) DEFAULT NULL,
  `chestSize` VARCHAR(50) DEFAULT NULL,
  `waistSize` VARCHAR(50) DEFAULT NULL,
  `thighSize` VARCHAR(50) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ۴. جدول درخواست‌های شهریه و فاکتورها (Membership Requests)
CREATE TABLE IF NOT EXISTS `membership_requests` (
  `id` VARCHAR(128) NOT NULL,
  `memberId` VARCHAR(128) NOT NULL,
  `memberName` VARCHAR(255) DEFAULT NULL,
  `planName` VARCHAR(255) DEFAULT NULL,
  `days` INT DEFAULT 0,
  `priceToman` DECIMAL(15,2) DEFAULT 0.00,
  `status` VARCHAR(50) DEFAULT 'PENDING',
  `date` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ۵. جدول برنامه‌های تمرینی (Workout Programs)
CREATE TABLE IF NOT EXISTS `workout_programs` (
  `id` VARCHAR(128) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT DEFAULT NULL,
  `schedule` LONGTEXT DEFAULT NULL, -- ذخیره به صورت JSON string
  `tips` TEXT DEFAULT NULL, -- ذخیره به صورت JSON string
  `createdAt` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ۶. جدول برنامه‌های تغذیه‌ای (Nutrition Plans)
CREATE TABLE IF NOT EXISTS `nutrition_plans` (
  `id` VARCHAR(128) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `targetCalories` VARCHAR(100) DEFAULT NULL,
  `macros` TEXT DEFAULT NULL, -- ذخیره به صورت JSON string
  `meals` LONGTEXT DEFAULT NULL, -- ذخیره به صورت JSON string
  `shoppingList` TEXT DEFAULT NULL, -- ذخیره به صورت JSON string
  `advice` TEXT DEFAULT NULL, -- ذخیره به صورت JSON string
  `createdAt` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ۷. جدول چت‌های مربی هوشمند هوش مصنوعی (AI Support Chats)
CREATE TABLE IF NOT EXISTS `smart_support_chats` (
  `id` VARCHAR(128) NOT NULL,
  `userRole` VARCHAR(50) DEFAULT NULL,
  `messages` LONGTEXT DEFAULT NULL, -- ذخیره به صورت JSON string
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ۸. جدول مقالات و اخبار بلاگ (Blog Posts)
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` VARCHAR(128) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT DEFAULT NULL,
  `content` LONGTEXT DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `author` VARCHAR(255) DEFAULT NULL,
  `date` VARCHAR(50) DEFAULT NULL,
  `readTime` VARCHAR(50) DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- درج داده‌های نمونه اولیه جهت تست سریع
INSERT INTO `coaches` (`id`, `name`, `username`, `password`, `specialty`, `clubId`, `rating`, `activeAthletes`) VALUES
('1', 'استاد پوریا کریمی', 'pouria', '123', 'بدنسازی و فیتنس', 'all', 4.90, 18),
('2', 'سارا حسینی', 'sara', '123', 'تغذیه و لاغری', 'all', 4.80, 12);

INSERT INTO `members` (`id`, `name`, `username`, `password`, `phone`, `assignedProgramId`, `assignedNutritionId`, `remainingSessions`, `remainingDays`, `coachName`, `joinedDate`, `bmi`, `bmr`, `fatPercent`, `armSize`, `chestSize`, `waistSize`, `thighSize`, `notes`) VALUES
('m_101', 'آرش احمدی', 'arash', '123', '09121112233', 'prog_1', 'nut_1', 14, 24, 'استاد پوریا کریمی', '1405/01/10', '۲۴.۱ (سالم)', '۱,۷۸۰ کالری', '۱۳.۵٪', '۴۱', '۱۱۲', '۸۲', '۶۲', 'نسبت به ماه گذشته دور کمر ۲ سانتی‌متر کاهش و دور بازو ۱ سانتی‌متر افزایش یافته است.'),
('m_102', 'سهراب مرادی', 'sohrab', '123', '09192223344', 'prog_1', 'nut_1', 12, 15, 'استاد پوریا کریمی', '1405/02/15', '۲۶.۸ (اضافه وزن)', '۱,۹۵۰ کالری', '۱۸.۲٪', '۴۳', '۱۱۸', '۹۰', '۶۶', 'سهراب در دوره حجم‌گیری خوبی قرار دارد.');

INSERT INTO `tenants` (`id`, `clubName`, `ownerName`, `email`, `phone`, `status`, `planName`, `expiresAt`, `branchesCount`, `membersCount`, `monthlyRevenue`, `createdAt`) VALUES
('oxigen', 'مجموعه ورزشی اکسیژن (شعبه مرکزی)', 'مهندس علیرضا اکبری', 'oxygen@gmail.com', '09121002030', 'ACTIVE', 'پلن سازمانی (پلاتینیوم)', '1405/12/29', 2, 450, 48200000.00, '1404/01/15');
```

---

## بخش ۳: ادغام اتصال دیتابیس MySQL در سرور Node.js (کد بک‌اند)

برای اینکه پروژه بتواند با MySQL ارتباط برقرار کند، ابتدا باید در پوشه روت هاست خود (پوشه‌ای که برنامه بک‌اند قرار دارد)، پکیج `mysql2` را نصب کنید:

```bash
npm install mysql2
```

سپس کدهای اتصال به دیتابیس و مدیریت APIها را به انتهای فایل `server.ts` خود اضافه می‌کنید. در اینجا یک نمونه ماژول اتصال به دیتابیس طراحی شده است:

### ساخت ماژول ارتباط با دیتابیس (`mysql-connection.ts`):

```typescript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ایجاد Pool متصل به MySQL برای پایداری و کارایی بالا
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartgym_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// توابع کمکی برای کوئری‌های عمومی
export async function query(sql: string, params?: any[]) {
  const [results] = await pool.execute(sql, params);
  return results;
}
```

### نمونه کدهای API در سرور Express (`server.ts`):

شما می‌توانید اندپوینت‌های REST API استاندارد زیر را برای واکشی و به‌روزرسانی داده‌ها در فایل `server.ts` تعریف کنید:

```typescript
import { query } from './mysql-connection';

// دریافت لیست اعضا
app.get("/api/members", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM members");
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// اضافه کردن عضو جدید
app.post("/api/members", async (req, res) => {
  try {
    const { id, name, username, password, phone, coachName, joinedDate } = req.body;
    await query(
      "INSERT INTO members (id, name, username, password, phone, coachName, joinedDate) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, name, username, password, phone, coachName, joinedDate]
    );
    res.json({ success: true, message: "عضو با موفقیت ثبت شد." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// به‌روزرسانی آنالیز بدنی عضو
app.put("/api/members/:id/biometrics", async (req, res) => {
  try {
    const { id } = req.params;
    const { bmi, bmr, fatPercent, armSize, chestSize, waistSize, thighSize, notes } = req.body;
    await query(
      "UPDATE members SET bmi = ?, bmr = ?, fatPercent = ?, armSize = ?, chestSize = ?, waistSize = ?, thighSize = ?, notes = ? WHERE id = ?",
      [bmi, bmr, fatPercent, armSize, chestSize, waistSize, thighSize, notes, id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// دریافت لیست مربیان
app.get("/api/coaches", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM coaches");
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## بخش ۴: همگام‌سازی فرانت‌اند با دیتابیس MySQL به جای Firebase

اکنون در کدهای فرانت‌اند (فایل `src/App.tsx`)، به جای متدهای مستقیم Firebase از `fetch` برای خواندن و نوشتن استفاده می‌کنید. 

نمونه اصلاح متد دریافت کلوپ‌ها و اعضا در `src/App.tsx`:

```typescript
// به جای کدهای قدیمی فایربیس:
// let tenantsSnap = await getDocs(collection(db, "tenants"));

// از ساختار API استاندارد استفاده کنید:
useEffect(() => {
  const loadDataFromMySQL = async () => {
    try {
      setIsDbLoading(true);
      
      // ۱. واکشی کلوپ‌ها
      const tenantsRes = await fetch("/api/tenants");
      const loadedTenants = await tenantsRes.json();
      setTenants(loadedTenants);

      // ۲. واکشی مربیان
      const coachesRes = await fetch("/api/coaches");
      const loadedCoaches = await coachesRes.json();
      setCoaches(loadedCoaches);

      // ۳. واکشی اعضا
      const membersRes = await fetch("/api/members");
      const loadedMembers = await membersRes.json();
      setMembers(loadedMembers);

      setIsDbReady(true);
    } catch (error) {
      console.error("خطا در همگام‌سازی با MySQL دیتابیس:", error);
    } finally {
      setIsDbLoading(false);
    }
  };

  loadDataFromMySQL();
}, []);
```

---

## بخش ۵: گام‌های عملی استقرار در cPanel (Step-by-Step Deployment)

### گام اول: بیلد فرانت‌اند
در محیط ادیتور هوش مصنوعی یا سیستم خود، دستور زیر را اجرا کنید تا فایلهای فرانت‌اند کامپایل و آماده شوند:
```bash
npm run build
```
این دستور پوشه `dist/` را ایجاد می‌کند که حاوی تمامی کدهای وبسایت شماست.

### گام دوم: انتقال کدهای سرور و ساختار فایل‌ها در cPanel
ساختار پیشنهادی فایل‌ها در روت هاست cPanel شما (پوشه خارج از `public_html` برای امنیت بک‌اند):
```text
/home/username/
  ├── smartgym-backend/        <-- پوشه کدهای سرور شما
  │     ├── dist/
  │     │     └── server.cjs   <-- فایل کامپایل شده سرور شما
  │     ├── node_modules/
  │     ├── package.json
  │     └── .env               <-- متغیرهای دیتابیس و کدهای امنیتی شما
  └── public_html/             <-- پوشه عمومی وب‌سایت
        ├── index.html         <-- کدهای فرانت‌اند (محتویات پوشه dist کپی شده در اینجا)
        ├── assets/
        └── ...
```

### گام سوم: تنظیم Node.js App در cPanel
1. وارد cPanel خود شوید.
2. از بخش **Software** روی گزینه **Setup Node.js App** کلیک کنید.
3. روی دکمه **Create Application** کلیک کنید.
4. مقادیر را به صورت زیر تنظیم کنید:
   - **Node.js version:** آخرین نسخه پایدار را انتخاب کنید (مثلاً ۱۸ یا ۲۰).
   - **Application mode:** روی `production` تنظیم کنید.
   - **Application root:** آدرس فیزیکی پوشه بک‌اند (مثلاً `smartgym-backend`).
   - **Application URL:** دامنه یا ساب‌دامنه خود را انتخاب کنید.
   - **Application startup file:** فایل شروع برنامه را تنظیم کنید (مثلاً `dist/server.cjs`).
5. روی دکمه **Create** کلیک کنید.
6. حالا روی دکمه **Run NPM Install** کلیک کنید تا تمام کتابخانه‌ها از جمله `express` و `mysql2` نصب شوند.

### گام چهارم: ایجاد فایل تنظیمات محیطی (.env) در cPanel
در پوشه `smartgym-backend` یک فایل به نام `.env` بسازید و مقادیر مربوط به دیتابیس cPanel و کلید هوش مصنوعی را در آن قرار دهید:

```env
PORT=3000
NODE_ENV=production

# تنظیمات دیتابیس MySQL در cPanel
DB_HOST=localhost
DB_PORT=3306
DB_USER=username_dbuser       # نام کاربری دیتابیس cPanel شما
DB_PASSWORD=YourPassword      # پسورد کاربر دیتابیس cPanel شما
DB_NAME=username_smartgym_db  # نام دیتابیس cPanel شما

# کلید مربی هوش مصنوعی اسمارت جیم
GEMINI_API_KEY=AIzaSy...      # کلید اختصاصی جمینی شما
```

---

## بخش ۶: مزایای این معماری جدید

1. **سازگاری کامل با هاست ایران و خارج:** از آنجایی که Firebase در ایران با محدودیت مواجه است، استفاده از دیتابیس محلی MySQL سرعت لود صفحه و امنیت تبادل داده را برای کاربران ایرانی تا ۱۰۰٪ افزایش می‌دهد.
2. **پشتیبان‌گیری بومی:** با رفتن به بخش **Backup** در cPanel یا **phpMyAdmin Export**، می‌توانید هر زمان که خواستید یک بک‌آپ کامل در قالب فایل `.sql` از کل پلتفرم خود دریافت کنید.
3. **سرعت بالا با Node.js:** اجرای برنامه با تکنولوژی Phusion Passenger در cPanel به همراه Express به شما یک سرور ابری پایدار و سریع ارائه می‌دهد.

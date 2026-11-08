import { Router, Request, Response, NextFunction } from "express";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { 
  getTableData, 
  saveTableItem, 
  saveTableBatch, 
  deleteTableItem, 
  getPlatformSettings, 
  savePlatformSettings 
} from "../controllers/dbController";
import { dbGetSettings, dbSaveSettings, dbGetTable, dbSaveItem, dbGetItem, dbUpdateFields, reinitializePool, isUsingRealMySQL } from "../config/database";
import { authenticateToken, optionalAuth, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { HttpError } from "../middleware/error";
import { generateToken, hashPassword, verifyPassword, AuthRole, TokenPayload } from "../utils/auth";
import { stripSecrets } from "../policy/tableAccess";
import { rateLimit } from "../utils/rateLimit";

const router = Router();

// Lazy load Gemini AI to avoid startup crashes if key is missing
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("کلید اختصاصی GEMINI_API_KEY در تنظیمات پروژه یافت نشد. لطفاً در بخش Secrets آن را تنظیم کنید.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Helper to update .env file dynamically
function updateEnvFile(updates: Record<string, string>) {
  const envPath = path.join(process.cwd(), ".env");
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf8");
  } else {
    const examplePath = path.join(process.cwd(), ".env.example");
    if (fs.existsSync(examplePath)) {
      content = fs.readFileSync(examplePath, "utf8");
    }
  }

  const lines = content.split("\n");
  for (const key of Object.keys(updates)) {
    const value = updates[key];
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith(`${key}=`)) {
        lines[i] = `${key}="${value.replace(/"/g, '\\"')}"`;
        found = true;
        break;
      }
    }
    if (!found) {
      lines.push(`${key}="${value.replace(/"/g, '\\"')}"`);
    }
  }

  fs.writeFileSync(envPath, lines.join("\n"), "utf8");
  
  // Update in-memory process.env immediately
  for (const [key, value] of Object.entries(updates)) {
    process.env[key] = value;
  }
}

// --- AI Endpoints (login required; each call spends the platform's AI quota) ---
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  key: (req) => `ai:${(req as AuthenticatedRequest).user?.userId || req.ip}`,
});
router.post("/ai/workout", authenticateToken, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { age, gender, weight, height, goal, fitnessLevel, experience, injuries, daysPerWeek } = req.body;
    const ai = getAIClient();
    
    const prompt = `به عنوان یک مربی بدنسازی ارشد، یک برنامه تمرینی اختصاصی و کاملا حرفه‌ای به زبان فارسی و با تقویم هفتگی بنویس.
مشخصات ورزشکار:
- سن: ${age || "نامشخص"} سال
- جنسیت: ${gender || "نامشخص"}
- وزن: ${weight || "نامشخص"} کیلوگرم
- قد: ${height || "نامشخص"} سانتی‌متر
- هدف: ${goal || "کاهش وزن و تناسب اندام"}
- سطح آمادگی: ${fitnessLevel || "مبتدی"}
- سابقه ورزشی: ${experience || "بدون سابقه"}
- آسیب‌دیدگی یا محدودیت فیزیکی: ${injuries || "ندارد"}
- تعداد روزهای تمرین در هفته: ${daysPerWeek || 3} روز

خروجی باید یک ساختار JSON معتبر باشد و شامل فیلدهای زیر باشد (فقط خود JSON را بدون هیچ توضیح اضافی یا کد فرمت‌بندی مانند \`\`\`json برگردان):
{
  "title": "عنوان برنامه تمرینی",
  "summary": "توضیح کلی و استراتژی برنامه مربی",
  "schedule": [
    {
      "day": "شنبه یا روز اول",
      "focus": "تمرکز تمرینی امروز (مثلا بالا تنه، پا، هوازی)",
      "exercises": [
        {
          "name": "نام تمرین به فارسی",
          "sets": "تعداد ست‌ها (مثلا 4)",
          "reps": "تعداد تکرارها (مثلا 12)",
          "rest": "زمان استراحت به ثانیه (مثلا 60)",
          "muscle": "عضله درگیر اصلی",
          "tip": "نکته مربی برای انجام درست حرکت"
        }
      ]
    }
  ],
  "tips": ["لیست نکات طلایی تغذیه و ریکاوری هماهنگ با این برنامه"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    next(error);
  }
});

router.post("/ai/nutrition", authenticateToken, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { age, gender, weight, height, goal, activityLevel, dietaryRestrictions, dailyCalorieTarget } = req.body;
    const ai = getAIClient();

    const prompt = `به عنوان یک متخصص تغذیه ورزشی برجسته، یک برنامه غذایی هماهنگ به زبان فارسی تولید کن.
مشخصات فرد:
- سن: ${age || "نامشخص"} سال
- جنسیت: ${gender || "نامشخص"}
- وزن: ${weight || "نامشخص"} کیلوگرم
- قد: ${height || "نامشخص"} سانتی‌متر
- هدف: ${goal || "کاهش درصد چربی"}
- سطح فعالیت روزانه: ${activityLevel || "متوسط"}
- محدودیت یا حساسیت غذایی: ${dietaryRestrictions || "ندارد"}
- کالری هدف پیشنهادی: ${dailyCalorieTarget || "محاسبه بر اساس مشخصات"}

خروجی باید یک ساختار JSON معتبر باشد و شامل فیلدهای زیر باشد (فقط خود JSON را بدون هیچ توضیح اضافی یا کد فرمت‌بندی مانند \`\`\`json برگردان):
{
  "targetCalories": "میزان کالری روزانه پیشنهادی",
  "macros": { "protein": "پروتئین (گرم)", "carbs": "کربوهیدرات (گرم)", "fat": "چربی (گرم)", "water": "آب مصرفی (لیتر)" },
  "meals": {
    "breakfast": { "title": "صبحانه", "items": ["لیست آیتم‌ها با مقدار دقیق"], "calories": "میزان کالری صبحانه" },
    "lunch": { "title": "ناهار", "items": ["لیست آیتم‌ها با مقدار دقیق"], "calories": "میزان کالری ناهار" },
    "dinner": { "title": "شام", "items": ["لیست آیتم‌ها با مقدار دقیق"], "calories": "میزان کالری شام" },
    "snacks": { "title": "میان‌وعده‌ها", "items": ["لیست آیتم‌ها با مقدار دقیق"], "calories": "میزان کالری میان‌وعده" }
  },
  "shoppingList": ["لیست خرید هفتگی مواد غذایی"],
  "advice": ["نکات کاربردی در زمان‌های مصرف غذا و مکمل‌ها"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    next(error);
  }
});

router.post("/ai/chat", authenticateToken, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages, userRole } = req.body;
    const ai = getAIClient();

    const formattedMessages = (messages || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = `تو یک مربی بدنسازی بین‌المللی ارشد و مشاور ارشد کسب‌وکارهای ورزشی در پلتفرم "اسمارت جیم" (SmartGym) هستی.
نام تو "مربی هوشمند اسمارت جیم" است.
لحن تو باید فوق‌العاده باانگیزه، مودبانه، تخصصی، دلسوزانه و در عین حال کاملاً حرفه‌ای باشد.
از عبارات ورزشی تخصصی به درستی استفاده کن و به کاربر انگیزه بده.
نقش فعلی کاربر تعامل‌کننده با تو: ${userRole || "عضو باشگاه"}.
همواره به زبان فارسی سلیس و روان پاسخ بده و در صورت نیاز برنامه، فرمول یا محاسبات (مانند BMR, TDEE, چربی‌سوزی) را به صورت جدول‌بندی یا با ساختار خوانا بنویس.
از اصطلاحات و کلمات انگلیسی بیجا خودداری کن مگر نام تمرینات یا عضلات تخصصی.`;

    const history = formattedMessages.length > 1 ? formattedMessages.slice(0, -1) : [];

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      history,
      config: {
        systemInstruction,
      },
    });

    const lastMessage = messages[messages.length - 1]?.content || "سلام مربی!";

    const response = await chat.sendMessage({
      message: lastMessage,
    });

    res.json({ reply: response.text });
  } catch (error) {
    next(error);
  }
});

// --- Installer Endpoints ---
// Disabled unless INSTALLER_ENABLED=true is set in the server environment.
// Enable it only for the first setup, then remove the variable and restart.
function installerEnabled(): boolean {
  return process.env.INSTALLER_ENABLED === "true";
}

router.get("/installer/status", (req: Request, res: Response) => {
  res.json({
    installerEnabled: installerEnabled(),
    isDbConnected: isUsingRealMySQL,
  });
});

router.use("/installer", optionalAuth, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!installerEnabled()) {
    res.status(403).json({ success: false, error: "نصب‌کننده غیرفعال است. برای فعال‌سازی موقت، INSTALLER_ENABLED=true را در تنظیمات سرور قرار دهید." });
    return;
  }
  // Once a database is connected, only the super admin may re-run installer steps.
  if (isUsingRealMySQL && req.user?.role !== "SUPER_ADMIN") {
    res.status(403).json({ success: false, error: "پایگاه داده قبلاً نصب شده است. فقط سوپر ادمین می‌تواند تنظیمات نصب را تغییر دهد." });
    return;
  }
  next();
});

router.post("/installer/test-db", async (req: Request, res: Response) => {
  const { host, port, user, password, database } = req.body;
  try {
    const testConn = await mysql.createConnection({
      host,
      port: Number(port) || 3306,
      user,
      password: password || "",
      database,
      connectTimeout: 5000,
    });
    await testConn.query("SELECT 1");
    await testConn.end();
    res.json({ success: true, message: "اتصال به پایگاه داده MySQL با موفقیت برقرار شد! 🎉" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "خطا در اتصال به دیتابیس" });
  }
});

router.post("/installer/setup-db", async (req: Request, res: Response, next: NextFunction) => {
  const { host, port, user, password, database } = req.body;
  try {
    const connection = await mysql.createConnection({
      host,
      port: Number(port) || 3306,
      user,
      password: password || "",
      database,
    });

    const tables = [
      {
        name: "tenants",
        sql: `CREATE TABLE IF NOT EXISTS \`tenants\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`ownerName\` VARCHAR(255),
          \`email\` VARCHAR(255),
          \`phone\` VARCHAR(100),
          \`domain\` VARCHAR(255),
          \`status\` VARCHAR(50),
          \`planName\` VARCHAR(255),
          \`expiresAt\` VARCHAR(100),
          \`branchesCount\` INT DEFAULT 1,
          \`membersCount\` INT DEFAULT 0,
          \`monthlyRevenue\` DECIMAL(15, 2) DEFAULT 0,
          \`createdAt\` VARCHAR(100),
          \`username\` VARCHAR(100),
          \`password\` VARCHAR(255),
          \`whiteLabelTheme\` TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "members",
        sql: `CREATE TABLE IF NOT EXISTS \`members\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`username\` VARCHAR(100),
          \`password\` VARCHAR(255),
          \`phone\` VARCHAR(100),
          \`assignedProgramId\` VARCHAR(100),
          \`assignedNutritionId\` VARCHAR(100),
          \`remainingSessions\` INT DEFAULT 12,
          \`coachName\` VARCHAR(255),
          \`joinedDate\` VARCHAR(100),
          \`bmr\` VARCHAR(50),
          \`bmi\` VARCHAR(100),
          \`fatPercent\` VARCHAR(50),
          \`armSize\` VARCHAR(50),
          \`chestSize\` VARCHAR(50),
          \`waistSize\` VARCHAR(50),
          \`thighSize\` VARCHAR(50),
          \`notes\` TEXT,
          \`clubId\` VARCHAR(100) DEFAULT 'oxigen'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "coaches",
        sql: `CREATE TABLE IF NOT EXISTS \`coaches\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`username\` VARCHAR(100),
          \`password\` VARCHAR(255),
          \`specialty\` VARCHAR(255),
          \`clubId\` VARCHAR(100) DEFAULT 'all'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "membership_requests",
        sql: `CREATE TABLE IF NOT EXISTS \`membership_requests\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`tenantId\` VARCHAR(100),
          \`memberName\` VARCHAR(255),
          \`phone\` VARCHAR(100),
          \`planName\` VARCHAR(255),
          \`status\` VARCHAR(50),
          \`createdAt\` VARCHAR(100)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "workout_programs",
        sql: `CREATE TABLE IF NOT EXISTS \`workout_programs\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`title\` VARCHAR(255) NOT NULL,
          \`summary\` TEXT,
          \`schedule\` LONGTEXT,
          \`tips\` TEXT,
          \`clubId\` VARCHAR(100) DEFAULT 'oxigen'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "nutrition_plans",
        sql: `CREATE TABLE IF NOT EXISTS \`nutrition_plans\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`targetCalories\` VARCHAR(100),
          \`macros\` TEXT,
          \`meals\` LONGTEXT,
          \`shoppingList\` TEXT,
          \`advice\` TEXT,
          \`clubId\` VARCHAR(100) DEFAULT 'oxigen'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "store_products",
        sql: `CREATE TABLE IF NOT EXISTS \`store_products\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`category\` VARCHAR(100),
          \`brand\` VARCHAR(255),
          \`priceToman\` DECIMAL(15, 2) DEFAULT 0,
          \`stock\` INT DEFAULT 0,
          \`minStockAlert\` INT DEFAULT 5,
          \`barcode\` VARCHAR(255),
          \`clubId\` VARCHAR(100) DEFAULT 'oxigen'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "bookings",
        sql: `CREATE TABLE IF NOT EXISTS \`bookings\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`memberName\` VARCHAR(255),
          \`className\` VARCHAR(255),
          \`date\` VARCHAR(100),
          \`time\` VARCHAR(100),
          \`status\` VARCHAR(50),
          \`clubId\` VARCHAR(100) DEFAULT 'oxigen'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "tickets",
        sql: `CREATE TABLE IF NOT EXISTS \`tickets\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`title\` VARCHAR(255) NOT NULL,
          \`description\` TEXT,
          \`status\` VARCHAR(50),
          \`priority\` VARCHAR(50),
          \`senderName\` VARCHAR(255),
          \`createdAt\` VARCHAR(100),
          \`replies\` LONGTEXT,
          \`clubId\` VARCHAR(100) DEFAULT 'oxigen'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "attendance_records",
        sql: `CREATE TABLE IF NOT EXISTS \`attendance_records\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`memberId\` VARCHAR(100),
          \`memberName\` VARCHAR(255),
          \`date\` VARCHAR(100),
          \`checkInTime\` VARCHAR(100),
          \`checkOutTime\` VARCHAR(100),
          \`totalHours\` DOUBLE DEFAULT 0,
          \`status\` VARCHAR(50),
          \`clubId\` VARCHAR(100) DEFAULT 'oxigen'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "exercises_database",
        sql: `CREATE TABLE IF NOT EXISTS \`exercises_database\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`muscleGroup\` VARCHAR(100),
          \`correctWay\` TEXT,
          \`wrongWay\` TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "coach_sales",
        sql: `CREATE TABLE IF NOT EXISTS \`coach_sales\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`coachId\` VARCHAR(100),
          \`coachName\` VARCHAR(255),
          \`studentName\` VARCHAR(255),
          \`packageName\` VARCHAR(255),
          \`price\` DECIMAL(15, 2) DEFAULT 0,
          \`date\` VARCHAR(100),
          \`month\` VARCHAR(50),
          \`clubId\` VARCHAR(100) DEFAULT 'oxigen'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "blog_posts",
        sql: `CREATE TABLE IF NOT EXISTS \`blog_posts\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`title\` VARCHAR(255) NOT NULL,
          \`excerpt\` TEXT,
          \`content\` LONGTEXT,
          \`author\` VARCHAR(255),
          \`date\` VARCHAR(100),
          \`image\` VARCHAR(255),
          \`category\` VARCHAR(100),
          \`clubId\` VARCHAR(100) DEFAULT 'oxigen'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "smart_support_chats",
        sql: `CREATE TABLE IF NOT EXISTS \`smart_support_chats\` (
          \`id\` VARCHAR(100) PRIMARY KEY,
          \`userName\` VARCHAR(255),
          \`userPhone\` VARCHAR(100),
          \`createdAt\` VARCHAR(100),
          \`updatedAt\` VARCHAR(100),
          \`messages\` LONGTEXT,
          \`clubId\` VARCHAR(100) DEFAULT 'oxigen'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: "platform_settings",
        sql: `CREATE TABLE IF NOT EXISTS \`platform_settings\` (
          \`key\` VARCHAR(100) PRIMARY KEY,
          \`value\` LONGTEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      }
    ];

    for (const t of tables) {
      await connection.query(t.sql);
    }

    await connection.end();

    res.json({
      success: true,
      message: `دیتابیس با موفقیت متصل شده و تمام ۱۵ جدول پلتفرم اسمارت‌جیم با موفقیت روی سرور MySQL ساخته شدند! پایگاه داده آماده بهره‌برداری کامل است. 🚀`
    });

    setTimeout(async () => {
      try {
        updateEnvFile({
          DB_HOST: host,
          DB_PORT: String(port || 3306),
          DB_USER: user,
          DB_PASSWORD: password || "",
          DB_NAME: database,
        });
        await reinitializePool();
      } catch (errEnv) {
        console.error("Deferred env/pool update failed:", errEnv);
      }
    }, 1000);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "خطا در ساخت دیتابیس و جدول‌ها" });
  }
});

router.post("/installer/save-admin", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, brandName } = req.body || {};
    if (typeof username !== "string" || !/^[a-zA-Z0-9_.-]{3,50}$/.test(username)) {
      throw new HttpError(400, "نام کاربری سوپر ادمین باید ۳ تا ۵۰ کاراکتر انگلیسی باشد.");
    }
    if (typeof password !== "string" || password.length < 10) {
      throw new HttpError(400, "رمز عبور سوپر ادمین باید حداقل ۱۰ کاراکتر باشد.");
    }
    const passwordHash = await hashPassword(password);
    const brand = typeof brandName === "string" && brandName.trim() ? brandName.trim() : "پلتفرم ابری اسمارت جیم";

    await dbSaveSettings({
      admin_username: username,
      admin_password_hash: passwordHash,
      admin_password: "",
      platformBrandLogo: brand,
      platform_brand_name: brand,
    });

    // Only non-secret values go to .env; the password is stored as a bcrypt hash.
    updateEnvFile({ ADMIN_USERNAME: username, PLATFORM_BRAND_NAME: brand });

    res.json({ success: true, message: "اطلاعات حساب سوپر ادمین و برند اختصاصی شما با موفقیت ذخیره شد! 🛡️" });
  } catch (error) {
    next(error);
  }
});

// --- Authentication ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  key: (req) => `login:${req.ip}:${String(req.body?.username || "").toLowerCase()}`,
});

type LoginKind = "admin" | "tenant" | "coach" | "member";

const LOGIN_TABLE: Record<Exclude<LoginKind, "admin">, { table: string; role: AuthRole }> = {
  tenant: { table: "tenants", role: "GYM_OWNER" },
  coach: { table: "coaches", role: "COACH" },
  member: { table: "members", role: "MEMBER" },
};

const dummyHash = hashPassword("smartgym-timing-equaliser");

const INVALID_LOGIN = "نام کاربری یا کلمه عبور وارد شده صحیح نمی‌باشد!";

async function loginSuperAdmin(username: string, password: string): Promise<TokenPayload | null> {
  let settings: Record<string, string> = {};
  try {
    settings = await dbGetSettings();
  } catch (err) {
    console.error("Failed to read admin settings:", err);
  }

  const expectedUser = settings.admin_username || process.env.ADMIN_USERNAME || "";
  if (!expectedUser || username !== expectedUser) return null;

  const stored =
    settings.admin_password_hash ||
    settings.admin_password || // legacy plain text from the prototype installer
    process.env.ADMIN_PASSWORD_HASH ||
    process.env.ADMIN_PASSWORD ||
    "";
  const { ok, needsRehash } = await verifyPassword(password, stored);
  if (!ok) return null;

  if (needsRehash) {
    try {
      await dbSaveSettings({ admin_password_hash: await hashPassword(password), admin_password: "" });
    } catch (err) {
      console.error("Failed to upgrade admin password hash:", err);
    }
  }
  return { userId: "super_admin", username, role: "SUPER_ADMIN" };
}

async function loginAccount(
  kind: Exclude<LoginKind, "admin">,
  username: string,
  password: string
): Promise<{ payload: TokenPayload; profile: any } | null> {
  const { table, role } = LOGIN_TABLE[kind];
  const rows = await dbGetTable(table);
  const wanted = username.toLowerCase();
  const row = rows.find((r) => typeof r.username === "string" && r.username.toLowerCase() === wanted);
  if (!row) {
    await verifyPassword(password, await dummyHash); // equalise timing for unknown usernames
    return null;
  }
  const { ok, needsRehash } = await verifyPassword(password, row.password);
  if (!ok) return null;
  if (kind === "tenant" && row.status === "SUSPENDED") {
    throw new HttpError(403, "حساب این باشگاه تعلیق شده است. با پشتیبانی تماس بگیرید.");
  }
  if (needsRehash) {
    await dbUpdateFields(table, row.id, { password: await hashPassword(password) });
  }
  const clubId = kind === "tenant" ? row.id : row.clubId;
  return {
    payload: { userId: row.id, username: row.username, role, clubId },
    profile: stripSecrets(row),
  };
}

router.post("/auth/login", loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { kind, username, password } = req.body || {};
    if (!["admin", "tenant", "coach", "member"].includes(kind)) throw new HttpError(400, "نوع حساب نامعتبر است.");
    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
      throw new HttpError(400, "نام کاربری و رمز عبور الزامی است.");
    }

    if (kind === "admin") {
      const payload = await loginSuperAdmin(username.trim(), password);
      if (!payload) throw new HttpError(401, INVALID_LOGIN);
      res.json({ success: true, token: generateToken(payload), role: payload.role, profile: { username: payload.username } });
      return;
    }

    const result = await loginAccount(kind, username.trim(), password);
    if (!result) throw new HttpError(401, INVALID_LOGIN);
    res.json({ success: true, token: generateToken(result.payload), role: result.payload.role, profile: result.profile });
  } catch (error) {
    next(error);
  }
});

router.get("/auth/me", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, user: req.user });
});

// Backwards-compatible alias for the old admin login form.
router.post("/admin/login", loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body || {};
    const payload =
      typeof username === "string" && typeof password === "string"
        ? await loginSuperAdmin(username.trim(), password)
        : null;
    if (!payload) {
      res.status(401).json({ success: false, error: INVALID_LOGIN });
      return;
    }
    res.json({ success: true, token: generateToken(payload), role: payload.role, message: "خوش آمدید سوپر ادمین گرامی! 🔐" });
  } catch (error) {
    next(error);
  }
});

// --- Public support chat (landing page mascot) ---
// Guests can only read and append to their own chat, identified by its random id.
const CHAT_ID = /^sc_\d{10,15}_[a-z0-9]{3,12}$/;
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, key: (req) => `chat:${req.ip}` });

router.get("/support-chat/:id", chatLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!CHAT_ID.test(id)) throw new HttpError(400, "شناسه گفتگو نامعتبر است.");
    const chat = await dbGetItem("smart_support_chats", id);
    if (!chat) throw new HttpError(404, "گفتگو یافت نشد.");
    res.json({ id: chat.id, messages: chat.messages || [], updatedAt: chat.updatedAt });
  } catch (error) {
    next(error);
  }
});

router.post("/support-chat", chatLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, userName, userPhone, messages } = req.body || {};
    if (typeof id !== "string" || !CHAT_ID.test(id)) throw new HttpError(400, "شناسه گفتگو نامعتبر است.");
    if (!Array.isArray(messages) || messages.length > 500) throw new HttpError(400, "پیام‌ها نامعتبر است.");

    const existing = await dbGetItem("smart_support_chats", id);
    const current: any[] = Array.isArray(existing?.messages) ? existing.messages : [];
    const knownIds = new Set(current.map((m) => m?.id));

    // Append only new guest/mascot messages; guests can never write as "admin".
    const appended = messages
      .filter((m: any) => m && typeof m.id === "string" && !knownIds.has(m.id))
      .filter((m: any) => m.sender === "user" || m.sender === "smart_ai")
      .map((m: any) => ({
        id: m.id.slice(0, 100),
        sender: m.sender,
        text: String(m.text ?? "").slice(0, 4000),
        timestamp: new Date().toISOString(),
      }));

    const now = new Date().toISOString();
    await dbSaveItem("smart_support_chats", {
      id,
      userName: existing?.userName ?? String(userName ?? "کاربر مهمان").slice(0, 100),
      userPhone: existing?.userPhone ?? String(userPhone ?? "").slice(0, 20),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      messages: [...current, ...appended],
    });
    res.json({ success: true, messages: [...current, ...appended] });
  } catch (error) {
    next(error);
  }
});

// --- Platform settings ---
router.get("/platform/settings", getPlatformSettings);
router.post("/platform/settings", authenticateToken, requireRole(["SUPER_ADMIN"]), savePlatformSettings);

// --- Generic table endpoints (interim; every call is checked by server/policy/tableAccess.ts) ---
router.get("/db/:table", optionalAuth, getTableData);
router.post("/db/:table", authenticateToken, saveTableItem);
router.post("/db/:table/batch", authenticateToken, saveTableBatch);
router.delete("/db/:table/:id", authenticateToken, deleteTableItem);

export default router;

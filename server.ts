import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import mysql from "mysql2/promise";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

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

// AI Endpoint: Workout Generator
app.post("/api/ai/workout", async (req, res) => {
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
  } catch (error: any) {
    console.error("AI Workout Error:", error);
    res.status(500).json({ error: error.message || "خطا در برقراری ارتباط با هوش مصنوعی" });
  }
});

// AI Endpoint: Nutrition Generator
app.post("/api/ai/nutrition", async (req, res) => {
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
  } catch (error: any) {
    console.error("AI Nutrition Error:", error);
    res.status(500).json({ error: error.message || "خطا در برقراری ارتباط با هوش مصنوعی" });
  }
});

// AI Endpoint: Chat Assistant / AI Coach
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, userRole } = req.body;
    const ai = getAIClient();

    const formattedMessages = (messages || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // System instruction to frame Gemini as a premium Persian Fitness Coach & Business Consultant
    const systemInstruction = `تو یک مربی بدنسازی بین‌المللی ارشد و مشاور ارشد کسب‌وکارهای ورزشی در پلتفرم "اسمارت جیم" (SmartGym) هستی.
نام تو "مربی هوشمند اسمارت جیم" است.
لحن تو باید فوق‌العاده باانگیزه، مودبانه، تخصصی، دلسوزانه و در عین حال کاملاً حرفه‌ای باشد.
از عبارات ورزشی تخصصی به درستی استفاده کن و به کاربر انگیزه بده.
نقش فعلی کاربر تعامل‌کننده با تو: ${userRole || "عضو باشگاه"}.
همواره به زبان فارسی سلیس و روان پاسخ بده و در صورت نیاز برنامه، فرمول یا محاسبات (مانند BMR, TDEE, چربی‌سوزی) را به صورت جدول‌بندی یا با ساختار خوانا بنویس.
از اصطلاحات و کلمات انگلیسی بیجا خودداری کن مگر نام تمرینات یا عضلات تخصصی.`;

    // Setup history for the chat if available
    const history = formattedMessages.length > 1 ? formattedMessages.slice(0, -1) : [];

    // Start a chat using ai.chats.create
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      history,
      config: {
        systemInstruction,
      },
    });

    // Send the last message in the chat session
    const lastMessage = messages[messages.length - 1]?.content || "سلام مربی!";

    const response = await chat.sendMessage({
      message: lastMessage,
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: error.message || "خطا در برقراری ارتباط با هوش مصنوعی" });
  }
});

// Generic MySQL DB endpoints
import { dbGetTable, dbSaveItem, dbSaveTable, dbDeleteItem, reinitializePool, isUsingRealMySQL, dbGetSettings, dbSaveSettings } from "./server_db";

// --- cPanel Easy Installer Endpoints ---

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

// 1. Get current installer status and configuration
app.get("/api/installer/status", (req, res) => {
  res.json({
    hasEnv: fs.existsSync(path.join(process.cwd(), ".env")),
    dbHost: process.env.DB_HOST || "",
    dbUser: process.env.DB_USER || "",
    dbName: process.env.DB_NAME || "",
    dbPort: process.env.DB_PORT || "3306",
    adminUser: process.env.ADMIN_USERNAME || "admin",
    isDbConnected: isUsingRealMySQL,
  });
});

// 2. Test dynamic MySQL database connection
app.post("/api/installer/test-db", async (req, res) => {
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

// 3. Setup database (write config, create tables, migrate mock data)
app.post("/api/installer/setup-db", async (req, res) => {
  const { host, port, user, password, database, migrateData } = req.body;
  try {
    // Create a connection directly to execute CREATE TABLE scripts
    const connection = await mysql.createConnection({
      host,
      port: Number(port) || 3306,
      user,
      password: password || "",
      database,
    });

    // SQL queries for table creation
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

    // Execute table creation scripts
    for (const t of tables) {
      await connection.query(t.sql);
    }

    // No local fallback file database migration needed since we only use real MySQL.
    // Self-seeding is automatically handled by the client application on load.

    await connection.end();

    res.json({
      success: true,
      message: `دیتابیس با موفقیت متصل شده و تمام ۱۴ جدول پلتفرم اسمارت‌جیم با موفقیت روی سرور MySQL ساخته شدند! پایگاه داده آماده بهره‌برداری کامل است. 🚀`
    });

    // Defer writing to .env and reinitializing the pool to allow the response to finish sending completely
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

// 4. Save Admin configuration (credentials)
app.post("/api/installer/save-admin", (req, res) => {
  const { username, password, brandName } = req.body;
  try {
    res.json({ success: true, message: "اطلاعات حساب سوپر ادمین و برند اختصاصی شما با موفقیت ذخیره شد! 🛡️" });

    // Defer writing to .env file to allow the response to finish sending completely
    setTimeout(() => {
      try {
        updateEnvFile({
          ADMIN_USERNAME: username || "admin",
          ADMIN_PASSWORD: password || "admin123",
          PLATFORM_BRAND_NAME: brandName || "پلتفرم ابری اسمارت جیم",
        });
      } catch (errEnv) {
        console.error("Deferred admin credentials update failed:", errEnv);
      }
    }, 1000);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "خطا در ثبت اطلاعات کاربری" });
  }
});

// 5. Admin Authentication check
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const sysUser = process.env.ADMIN_USERNAME || "admin";
  const sysPass = process.env.ADMIN_PASSWORD || "admin123";

  if (username === sysUser && password === sysPass) {
    res.json({ success: true, message: "خوش آمدید سوپر ادمین گرامی! 🔐" });
  } else {
    res.status(401).json({ success: false, error: "نام کاربری یا کلمه عبور وارد شده صحیح نمی‌باشد!" });
  }
});

app.get("/api/platform/settings", async (req, res) => {
  try {
    const settings = await dbGetSettings();
    res.json(settings);
  } catch (error: any) {
    console.error("API GET platform settings error:", error);
    res.status(500).json({ error: error.message || "خطا در دریافت تنظیمات پلتفرم" });
  }
});

app.post("/api/platform/settings", async (req, res) => {
  try {
    const settings = req.body;
    await dbSaveSettings(settings);
    res.json({ success: true });
  } catch (error: any) {
    console.error("API POST platform settings error:", error);
    res.status(500).json({ error: error.message || "خطا در ذخیره تنظیمات پلتفرم" });
  }
});

app.get("/api/db/:table", async (req, res) => {
  try {
    const { table } = req.params;
    const data = await dbGetTable(table);
    res.json(data);
  } catch (error: any) {
    console.error(`API GET Error for table ${req.params.table}:`, error);
    res.status(500).json({ error: error.message || "خطا در دریافت اطلاعات" });
  }
});

app.post("/api/db/:table", async (req, res) => {
  try {
    const { table } = req.params;
    const item = req.body;
    await dbSaveItem(table, item);
    res.json({ success: true });
  } catch (error: any) {
    console.error(`API POST Error for table ${req.params.table}:`, error);
    res.status(500).json({ error: error.message || "خطا در ثبت اطلاعات" });
  }
});

app.post("/api/db/:table/batch", async (req, res) => {
  try {
    const { table } = req.params;
    const items = req.body;
    if (Array.isArray(items)) {
      await dbSaveTable(table, items);
      res.json({ success: true, count: items.length });
    } else {
      res.status(400).json({ error: "ورودی باید آرایه‌ای از اطلاعات باشد." });
    }
  } catch (error: any) {
    console.error(`API BATCH Error for table ${req.params.table}:`, error);
    res.status(500).json({ error: error.message || "خطا در ثبت گروهی اطلاعات" });
  }
});

app.delete("/api/db/:table/:id", async (req, res) => {
  try {
    const { table, id } = req.params;
    await dbDeleteItem(table, id);
    res.json({ success: true });
  } catch (error: any) {
    console.error(`API DELETE Error for table ${req.params.table}:`, error);
    res.status(500).json({ error: error.message || "خطا در حذف اطلاعات" });
  }
});

// Vite or Static files serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode (Vite Middleware enabled)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartGym Server is running on http://localhost:${PORT}`);
  });
}

setupServer();

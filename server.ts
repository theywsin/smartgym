import express from "express";
import path from "path";
import dotenv from "dotenv";
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

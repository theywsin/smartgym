import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export let pool: mysql.Pool | null = null;
export let isUsingRealMySQL = false;

export async function reinitializePool(throwOnError: boolean = false): Promise<void> {
  console.log("♻️ Reinitializing MySQL Connection Pool with updated parameters...");
  dotenv.config({ override: true }); // Reload any newly saved env changes
  
  if (pool) {
    try {
      await pool.end();
    } catch (e) {
      // Ignore close error
    }
    pool = null;
  }
  
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;
  const password = process.env.DB_PASSWORD || "";
  const port = Number(process.env.DB_PORT) || 3306;

  if (host && user && database) {
    try {
      pool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 15,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      });
      
      await pool.query("SELECT 1");
      isUsingRealMySQL = true;
      console.log("🚀 MySQL Connection Pool successfully connected.");
    } catch (err: any) {
      console.warn(`⚠️ MySQL database connection is not reachable (${host}): ${err.message}. Seamlessly using local fallback database.`);
      isUsingRealMySQL = false;
      pool = null;
      if (throwOnError) {
        throw new Error(`خطا در اتصال به پایگاه داده MySQL: ${err.message}`);
      }
    }
  } else {
    isUsingRealMySQL = false;
    pool = null;
    console.log("ℹ️ No MySQL environment parameters configured yet. Waiting for installer.");
  }
}

// Run initial pool configuration safely
reinitializePool(false).catch(err => {
  console.warn("Initial database pool setup notice:", err.message);
});

export function getPool(): mysql.Pool {
  if (!pool || !isUsingRealMySQL) {
    throw new Error("پایگاه داده مای‌اس‌کیوال متصل نیست یا اطلاعات اتصال پیکربندی نشده است. لطفاً ابتدا پایگاه داده را نصب کنید.");
  }
  return pool;
}

import fs from "fs";
import path from "path";

const FALLBACK_FILE = path.join(process.cwd(), "db_fallback.json");

let memoryDb: Record<string, any[]> = {};
let memorySettings: Record<string, string> = {};

// Helper to load fallback data
function loadFallback() {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, "utf8"));
      memoryDb = data.memoryDb || {};
      memorySettings = data.memorySettings || {};
    }
  } catch (err) {
    console.error("⚠️ Failed to load persistent fallback DB file:", err);
  }
}

// Helper to save fallback data
function saveFallback() {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify({ memoryDb, memorySettings }, null, 2), "utf8");
  } catch (err) {
    console.error("⚠️ Failed to save persistent fallback DB file:", err);
  }
}

// Initial load
loadFallback();

// Abstraction helper functions for REST APIs (ONLY using MySQL, with dynamic transient in-memory fallback)
export async function dbGetTable(tableName: string): Promise<any[]> {
  const allowedTables = [
    "tenants", "members", "coaches", "membership_requests", 
    "workout_programs", "nutrition_plans", "store_products", 
    "bookings", "tickets", "attendance_records", "exercises_database", 
    "coach_sales", "blog_posts", "smart_support_chats", "platform_settings"
  ];
  
  if (!allowedTables.includes(tableName)) {
    throw new Error(`جدول درخواستی نامعتبر است: ${tableName}`);
  }

  if (isUsingRealMySQL) {
    const activePool = getPool();
    const [rows] = await activePool.query(`SELECT * FROM \`${tableName}\``);
    
    return (rows as any[]).map(row => {
      const parsed = { ...row };
      // Parse JSON strings to objects for the client
      const jsonKeys = [
        "features", "schedule", "tips", "macros", "meals", 
        "shoppingList", "advice", "replies", "messages", 
        "highlightMuscles", "whiteLabelTheme"
      ];
      jsonKeys.forEach(key => {
        if (parsed[key] && typeof parsed[key] === "string") {
          try {
            parsed[key] = JSON.parse(parsed[key]);
          } catch (e) {
            // Keep string as fallback if parse fails
          }
        }
      });
      return parsed;
    });
  } else {
    // Return cloned memory data
    return JSON.parse(JSON.stringify(memoryDb[tableName] || []));
  }
}

export async function dbSaveItem(tableName: string, item: any): Promise<void> {
  const allowedTables = [
    "tenants", "members", "coaches", "membership_requests", 
    "workout_programs", "nutrition_plans", "store_products", 
    "bookings", "tickets", "attendance_records", "exercises_database", 
    "coach_sales", "blog_posts", "smart_support_chats", "platform_settings"
  ];
  
  if (!allowedTables.includes(tableName)) {
    throw new Error(`جدول درخواستی نامعتبر است: ${tableName}`);
  }

  if (isUsingRealMySQL) {
    const activePool = getPool();
    const keys = Object.keys(item).filter(k => /^[a-zA-Z0-9_]+$/.test(k));
    if (keys.length === 0) return;

    const formattedItem = { ...item };
    
    // Stringify JSON fields for MySQL TEXT/LONGTEXT columns
    const jsonKeys = [
      "features", "schedule", "tips", "macros", "meals", 
      "shoppingList", "advice", "replies", "messages", 
      "highlightMuscles", "whiteLabelTheme"
    ];
    jsonKeys.forEach(key => {
      if (formattedItem[key] !== undefined && typeof formattedItem[key] !== "string") {
        formattedItem[key] = JSON.stringify(formattedItem[key]);
      }
    });

    const values = keys.map(k => formattedItem[k]);
    const placeholders = keys.map(() => "?").join(", ");
    const updateClause = keys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(", ");

    const sql = `INSERT INTO \`${tableName}\` (${keys.map(k => `\`${k}\``).join(", ")}) 
                 VALUES (${placeholders}) 
                 ON DUPLICATE KEY UPDATE ${updateClause}`;
    
    await activePool.query(sql, [...values, ...values]);
  } else {
    if (!memoryDb[tableName]) {
      memoryDb[tableName] = [];
    }
    const idx = memoryDb[tableName].findIndex(i => i.id === item.id);
    const clonedItem = JSON.parse(JSON.stringify(item));
    if (idx !== -1) {
      memoryDb[tableName][idx] = clonedItem;
    } else {
      memoryDb[tableName].push(clonedItem);
    }
    saveFallback();
  }
}

export async function dbSaveTable(tableName: string, items: any[]): Promise<void> {
  const allowedTables = [
    "tenants", "members", "coaches", "membership_requests", 
    "workout_programs", "nutrition_plans", "store_products", 
    "bookings", "tickets", "attendance_records", "exercises_database", 
    "coach_sales", "blog_posts", "smart_support_chats", "platform_settings"
  ];
  
  if (!allowedTables.includes(tableName)) {
    throw new Error(`جدول درخواستی نامعتبر است: ${tableName}`);
  }

  if (isUsingRealMySQL) {
    // Batch save to MySQL sequentially within a clean transaction context
    const activePool = getPool();
    const connection = await activePool.getConnection();
    try {
      await connection.beginTransaction();
      for (const item of items) {
        const keys = Object.keys(item).filter(k => /^[a-zA-Z0-9_]+$/.test(k));
        if (keys.length === 0) continue;
        
        const formattedItem = { ...item };
        const jsonKeys = [
          "features", "schedule", "tips", "macros", "meals", 
          "shoppingList", "advice", "replies", "messages", 
          "highlightMuscles", "whiteLabelTheme"
        ];
        jsonKeys.forEach(key => {
          if (formattedItem[key] !== undefined && typeof formattedItem[key] !== "string") {
            formattedItem[key] = JSON.stringify(formattedItem[key]);
          }
        });

        const values = keys.map(k => formattedItem[k]);
        const placeholders = keys.map(() => "?").join(", ");
        const updateClause = keys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(", ");

        const sql = `INSERT INTO \`${tableName}\` (${keys.map(k => `\`${k}\``).join(", ")}) 
                     VALUES (${placeholders}) 
                     ON DUPLICATE KEY UPDATE ${updateClause}`;
        await connection.query(sql, [...values, ...values]);
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } else {
    if (!memoryDb[tableName]) {
      memoryDb[tableName] = [];
    }
    for (const item of items) {
      const idx = memoryDb[tableName].findIndex(i => i.id === item.id);
      const clonedItem = JSON.parse(JSON.stringify(item));
      if (idx !== -1) {
        memoryDb[tableName][idx] = clonedItem;
      } else {
        memoryDb[tableName].push(clonedItem);
      }
    }
    saveFallback();
  }
}

export async function dbDeleteItem(tableName: string, id: string): Promise<void> {
  const allowedTables = [
    "tenants", "members", "coaches", "membership_requests", 
    "workout_programs", "nutrition_plans", "store_products", 
    "bookings", "tickets", "attendance_records", "exercises_database", 
    "coach_sales", "blog_posts", "smart_support_chats", "platform_settings"
  ];
  
  if (!allowedTables.includes(tableName)) {
    throw new Error(`جدول درخواستی نامعتبر است: ${tableName}`);
  }

  if (isUsingRealMySQL) {
    const activePool = getPool();
    await activePool.query(`DELETE FROM \`${tableName}\` WHERE \`id\` = ?`, [id]);
  } else {
    if (memoryDb[tableName]) {
      memoryDb[tableName] = memoryDb[tableName].filter(i => i.id !== id);
    }
    saveFallback();
  }
}

export async function dbGetSettings(): Promise<Record<string, string>> {
  if (isUsingRealMySQL) {
    const activePool = getPool();
    const [rows] = await activePool.query("SELECT * FROM `platform_settings`");
    return (rows as any[]).reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  } else {
    return { ...memorySettings };
  }
}

export async function dbSaveSettings(settings: Record<string, string>): Promise<void> {
  if (isUsingRealMySQL) {
    const activePool = getPool();
    for (const [key, value] of Object.entries(settings)) {
      await activePool.query(
        "INSERT INTO `platform_settings` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?",
        [key, value, value]
      );
    }
  } else {
    for (const [key, value] of Object.entries(settings)) {
      memorySettings[key] = value;
    }
    saveFallback();
  }
}

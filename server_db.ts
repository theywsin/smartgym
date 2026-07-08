import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// File-based fallback path when MySQL is not yet configured or connected
const FALLBACK_DB_PATH = path.join(process.cwd(), "mysql_fallback_db.json");

// Helper to read fallback JSON db
function readFallbackDb(): Record<string, any[]> {
  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      const data = fs.readFileSync(FALLBACK_DB_PATH, "utf8");
      return JSON.parse(data) || {};
    }
  } catch (e) {
    console.error("Error reading fallback JSON db:", e);
  }
  return {};
}

// Helper to write fallback JSON db
function writeFallbackDb(db: Record<string, any[]>) {
  try {
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing fallback JSON db:", e);
  }
}

// Define real MySQL connection pool
export let pool: mysql.Pool | null = null;
export let isUsingRealMySQL = false;

export async function reinitializePool() {
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
  
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
      
      await pool.query("SELECT 1");
      isUsingRealMySQL = true;
      console.log("🚀 MySQL database helper successfully connected to phpMyAdmin/MySQL.");
    } catch (err: any) {
      console.warn(`⚠️ Could not connect to real MySQL database: ${err.message}`);
      isUsingRealMySQL = false;
      pool = null;
    }
  } else {
    isUsingRealMySQL = false;
    console.log("ℹ️ No MySQL environment parameters configured.");
  }
}

// Run initial pool configuration
reinitializePool().catch(err => {
  console.error("Initial database pool setup failed:", err);
});

// Generic database abstraction helper functions
export async function dbGetTable(tableName: string): Promise<any[]> {
  if (!isUsingRealMySQL || !pool) {
    // Return from fallback JSON database
    const db = readFallbackDb();
    return db[tableName] || [];
  }

  const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
  
  return (rows as any[]).map(row => {
    const parsed = { ...row };
    // Parse features, schedule, tips, macros, meals, shoppingList, advice, replies, messages, highlightMuscles, whiteLabelTheme
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
          // fallback if parse fails
        }
      }
    });
    return parsed;
  });
}

export async function dbSaveItem(tableName: string, item: any): Promise<void> {
  if (!isUsingRealMySQL || !pool) {
    // Save to fallback JSON database
    const db = readFallbackDb();
    const tableItems = db[tableName] || [];
    const index = tableItems.findIndex((i: any) => i.id === item.id);
    if (index >= 0) {
      tableItems[index] = item;
    } else {
      tableItems.push(item);
    }
    db[tableName] = tableItems;
    writeFallbackDb(db);
    return;
  }

  const keys = Object.keys(item);
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
  
  await pool.query(sql, [...values, ...values]);
}

export async function dbSaveTable(tableName: string, items: any[]): Promise<void> {
  if (!isUsingRealMySQL || !pool) {
    // Batch save to fallback JSON database
    const db = readFallbackDb();
    const tableItems = db[tableName] || [];
    
    for (const item of items) {
      const index = tableItems.findIndex((i: any) => i.id === item.id);
      if (index >= 0) {
        tableItems[index] = item;
      } else {
        tableItems.push(item);
      }
    }
    
    db[tableName] = tableItems;
    writeFallbackDb(db);
    return;
  }

  // Save items sequentially/in batch on real MySQL
  for (const item of items) {
    await dbSaveItem(tableName, item);
  }
}

export async function dbDeleteItem(tableName: string, id: string): Promise<void> {
  if (!isUsingRealMySQL || !pool) {
    // Delete from fallback JSON database
    const db = readFallbackDb();
    if (db[tableName]) {
      db[tableName] = db[tableName].filter((item: any) => item.id !== id);
      writeFallbackDb(db);
    }
    return;
  }

  await pool.query(`DELETE FROM \`${tableName}\` WHERE \`id\` = ?`, [id]);
}

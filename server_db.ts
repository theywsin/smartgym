import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const FALLBACK_DB_PATH = path.join(process.cwd(), "local_mysql_fallback.json");

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
      console.log("🚀 MySQL database helper successfully connected/reconnected to phpMyAdmin/MySQL.");
    } catch (err: any) {
      console.warn(`⚠️ Could not connect to real MySQL database during reinitialization: ${err.message}`);
      isUsingRealMySQL = false;
      pool = null;
    }
  } else {
    isUsingRealMySQL = false;
    console.log("ℹ️ No MySQL environment parameters configured. Continuing with local storage fallback.");
  }
}

// Run initial pool configuration
reinitializePool().catch(err => {
  console.error("Initial database pool setup failed:", err);
});

// Ensure local file DB exists and has initial structure
function getLocalDb() {
  if (!fs.existsSync(FALLBACK_DB_PATH)) {
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify({
      tenants: [],
      members: [],
      coaches: [],
      membership_requests: [],
      workout_programs: [],
      nutrition_plans: [],
      store_products: [],
      bookings: [],
      tickets: [],
      attendance_records: [],
      exercises_database: [],
      coach_sales: [],
      blog_posts: [],
      smart_support_chats: []
    }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, "utf8"));
  } catch (e) {
    return {};
  }
}

function saveLocalDb(data: any) {
  fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2));
}

// Generic database abstraction helper functions
export async function dbGetTable(tableName: string): Promise<any[]> {
  if (isUsingRealMySQL && pool) {
    try {
      const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
      // Automatically parse TEXT fields containing JSON
      return (rows as any[]).map(row => {
        const parsed = { ...row };
        // Parse features, schedule, tips, macros, meals, shoppingList, advice, replies, messages, highlightMuscles
        const jsonKeys = ["features", "schedule", "tips", "macros", "meals", "shoppingList", "advice", "replies", "messages", "highlightMuscles"];
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
    } catch (err: any) {
      if (err.code === "EAI_AGAIN" || err.code === "ENOTFOUND" || err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
        console.warn(`⚠️ MySQL connection offline (${err.code}). Falling back to local JSON storage.`);
        isUsingRealMySQL = false;
      } else {
        console.error(`Error querying MySQL table ${tableName}, falling back to local file:`, err);
      }
    }
  }

  // Fallback
  const db = getLocalDb();
  return db[tableName] || [];
}

export async function dbSaveItem(tableName: string, item: any): Promise<void> {
  if (isUsingRealMySQL && pool) {
    try {
      const keys = Object.keys(item);
      const formattedItem = { ...item };
      
      // Stringify JSON fields for MySQL TEXT/LONGTEXT columns
      const jsonKeys = ["features", "schedule", "tips", "macros", "meals", "shoppingList", "advice", "replies", "messages", "highlightMuscles"];
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
      return;
    } catch (err: any) {
      if (err.code === "EAI_AGAIN" || err.code === "ENOTFOUND" || err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
        console.warn(`⚠️ MySQL connection offline (${err.code}). Falling back to local JSON storage.`);
        isUsingRealMySQL = false;
      } else {
        console.error(`Error saving to MySQL table ${tableName}, falling back to local file:`, err);
      }
    }
  }

  // Fallback
  const db = getLocalDb();
  if (!db[tableName]) db[tableName] = [];
  const index = db[tableName].findIndex((i: any) => i.id === item.id);
  if (index !== -1) {
    db[tableName][index] = item;
  } else {
    db[tableName].push(item);
  }
  saveLocalDb(db);
}

export async function dbSaveTable(tableName: string, items: any[]): Promise<void> {
  if (isUsingRealMySQL && pool) {
    try {
      // For real MySQL, insert items one by one or in batch
      for (const item of items) {
        await dbSaveItem(tableName, item);
      }
      return;
    } catch (err: any) {
      if (err.code === "EAI_AGAIN" || err.code === "ENOTFOUND" || err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
        console.warn(`⚠️ MySQL connection offline (${err.code}). Falling back to local JSON storage.`);
        isUsingRealMySQL = false;
      } else {
        console.error(`Error saving batch to MySQL table ${tableName}, falling back to local:`, err);
      }
    }
  }

  // Fallback
  const db = getLocalDb();
  db[tableName] = items;
  saveLocalDb(db);
}

export async function dbDeleteItem(tableName: string, id: string): Promise<void> {
  if (isUsingRealMySQL && pool) {
    try {
      await pool.query(`DELETE FROM \`${tableName}\` WHERE \`id\` = ?`, [id]);
      return;
    } catch (err: any) {
      if (err.code === "EAI_AGAIN" || err.code === "ENOTFOUND" || err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
        console.warn(`⚠️ MySQL connection offline (${err.code}). Falling back to local JSON storage.`);
        isUsingRealMySQL = false;
      } else {
        console.error(`Error deleting from MySQL table ${tableName}, falling back to local:`, err);
      }
    }
  }

  // Fallback
  const db = getLocalDb();
  if (db[tableName]) {
    db[tableName] = db[tableName].filter((i: any) => i.id !== id);
    saveLocalDb(db);
  }
}

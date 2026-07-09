/**
 * 🏋️‍♂️ SmartGym Platform - Production MySQL Database Adapter
 * (No fallback to JSON file database. Strictly uses connection pool.)
 */

export { 
  pool,
  isUsingRealMySQL,
  reinitializePool,
  dbGetTable,
  dbSaveItem,
  dbSaveTable,
  dbDeleteItem,
  dbGetSettings,
  dbSaveSettings 
} from "./server/config/database";

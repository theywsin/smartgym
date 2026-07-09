import { Request, Response, NextFunction } from "express";
import { 
  dbGetTable, 
  dbSaveItem, 
  dbSaveTable, 
  dbDeleteItem, 
  dbGetSettings, 
  dbSaveSettings 
} from "../config/database";

export async function getTableData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { table } = req.params;
    const data = await dbGetTable(table);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function saveTableItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { table } = req.params;
    const item = req.body;
    if (!item || typeof item !== "object") {
      res.status(400).json({ success: false, message: "اطلاعات ارسالی برای ذخیره معتبر نیست." });
      return;
    }
    await dbSaveItem(table, item);
    res.json({ success: true, message: "اطلاعات با موفقیت ذخیره شد." });
  } catch (error) {
    next(error);
  }
}

export async function saveTableBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { table } = req.params;
    const items = req.body;
    if (!Array.isArray(items)) {
      res.status(400).json({ success: false, message: "ورودی باید آرایه‌ای از اطلاعات باشد." });
      return;
    }
    await dbSaveTable(table, items);
    res.json({ success: true, count: items.length, message: "ذخیره گروهی با موفقیت انجام شد." });
  } catch (error) {
    next(error);
  }
}

export async function deleteTableItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { table, id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: "شناسه آیتم جهت حذف ارسال نشده است." });
      return;
    }
    await dbDeleteItem(table, id);
    res.json({ success: true, message: "آیتم با موفقیت حذف شد." });
  } catch (error) {
    next(error);
  }
}

export async function getPlatformSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await dbGetSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function savePlatformSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== "object") {
      res.status(400).json({ success: false, message: "فرمت تنظیمات نامعتبر است." });
      return;
    }
    await dbSaveSettings(settings);
    res.json({ success: true, message: "تنظیمات پلتفرم با موفقیت ذخیره شد." });
  } catch (error) {
    next(error);
  }
}

import { Response, NextFunction } from "express";
import {
  dbGetTable,
  dbGetItem,
  dbSaveItem,
  dbDeleteItem,
  dbGetSettings,
  dbSaveSettings,
} from "../config/database";
import { AuthenticatedRequest } from "../middleware/auth";
import { HttpError } from "../middleware/error";
import { hashPassword, isPasswordHash } from "../utils/auth";
import {
  isKnownTable,
  canReadTable,
  filterReadableRows,
  decideWrite,
  canDelete,
} from "../policy/tableAccess";

const MAX_BATCH = 500;

/** Settings keys that are never returned or writable through the settings API. */
const PRIVATE_SETTING_PREFIXES = ["admin_"];

function isPrivateSetting(key: string): boolean {
  return PRIVATE_SETTING_PREFIXES.some((p) => key.startsWith(p));
}

function assertTable(table: string): void {
  if (!isKnownTable(table)) throw new HttpError(404, "جدول درخواستی نامعتبر است.");
}

async function hashCredentialFields(item: Record<string, any>): Promise<Record<string, any>> {
  if (!("password" in item)) return item;
  const next = { ...item };
  if (typeof next.password !== "string" || next.password.trim() === "") {
    // Empty password in an update means "keep the current one".
    delete next.password;
  } else if (!isPasswordHash(next.password)) {
    next.password = await hashPassword(next.password);
  }
  return next;
}

async function authorizeAndPrepare(table: string, item: any, req: AuthenticatedRequest) {
  const existing = item && typeof item.id === "string" ? await dbGetItem(table, item.id) : undefined;
  const decision = decideWrite(table, item, existing, req.user!);
  if (!decision.allowed || !decision.item) return { ok: false as const, reason: decision.reason };
  return { ok: true as const, item: await hashCredentialFields(decision.item) };
}

export async function getTableData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { table } = req.params;
    assertTable(table);
    if (!canReadTable(table, req.user)) {
      throw new HttpError(req.user ? 403 : 401, req.user ? "دسترسی غیرمجاز." : "ابتدا وارد حساب کاربری شوید.");
    }
    const data = await dbGetTable(table);
    res.json(filterReadableRows(table, data, req.user));
  } catch (error) {
    next(error);
  }
}

export async function saveTableItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { table } = req.params;
    assertTable(table);
    const result = await authorizeAndPrepare(table, req.body, req);
    if (!result.ok) throw new HttpError(403, "اجازه ذخیره این اطلاعات را ندارید.");
    await dbSaveItem(table, result.item);
    res.json({ success: true, message: "اطلاعات با موفقیت ذخیره شد." });
  } catch (error) {
    next(error);
  }
}

export async function saveTableBatch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { table } = req.params;
    assertTable(table);
    const items = req.body;
    if (!Array.isArray(items)) throw new HttpError(400, "ورودی باید آرایه‌ای از اطلاعات باشد.");
    if (items.length > MAX_BATCH) throw new HttpError(413, "تعداد آیتم‌ها بیش از حد مجاز است.");

    let saved = 0;
    let skipped = 0;
    for (const item of items) {
      const result = await authorizeAndPrepare(table, item, req);
      if (!result.ok) {
        skipped++;
        continue;
      }
      await dbSaveItem(table, result.item);
      saved++;
    }
    res.json({ success: true, count: saved, skipped, message: "ذخیره گروهی انجام شد." });
  } catch (error) {
    next(error);
  }
}

export async function deleteTableItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { table, id } = req.params;
    assertTable(table);
    if (!id) throw new HttpError(400, "شناسه آیتم جهت حذف ارسال نشده است.");
    const existing = await dbGetItem(table, id);
    if (!canDelete(table, existing, req.user!)) throw new HttpError(403, "اجازه حذف این آیتم را ندارید.");
    await dbDeleteItem(table, id);
    res.json({ success: true, message: "آیتم با موفقیت حذف شد." });
  } catch (error) {
    next(error);
  }
}

export async function getPlatformSettings(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await dbGetSettings();
    const publicSettings: Record<string, string> = {};
    for (const [k, v] of Object.entries(settings)) {
      if (!isPrivateSetting(k)) publicSettings[k] = v;
    }
    res.json(publicSettings);
  } catch (error) {
    next(error);
  }
}

export async function savePlatformSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      throw new HttpError(400, "فرمت تنظیمات نامعتبر است.");
    }
    const allowed: Record<string, string> = {};
    for (const [k, v] of Object.entries(settings)) {
      if (isPrivateSetting(k)) continue;
      if (!/^[a-zA-Z0-9_]{1,100}$/.test(k)) continue;
      allowed[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
    await dbSaveSettings(allowed);
    res.json({ success: true, message: "تنظیمات پلتفرم با موفقیت ذخیره شد." });
  } catch (error) {
    next(error);
  }
}

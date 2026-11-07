import { PLATFORM_SETTING_SCHEMAS, type PlatformSettingKey } from "@smartgym/validation";
import { AppError, adminSetPlatformSetting } from "@smartgym/core";
import { userRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const PUT = userRoute(async ({ req, auth, params, ip, userAgent }) => {
  const key = params.key as PlatformSettingKey;
  if (!(key in PLATFORM_SETTING_SCHEMAS)) throw new AppError("NOT_FOUND", "تنظیم پیدا نشد.");
  return adminSetPlatformSetting(coreDeps(), { userId: auth.user.id, ip, userAgent }, key, await req.json());
});

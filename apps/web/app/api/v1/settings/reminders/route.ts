import { getReminderSettings, setReminderSettings } from "@smartgym/core";
import { reminderSettingsSchema } from "@smartgym/validation";
import { tenantRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = tenantRoute(async ({ tenant }) => getReminderSettings(coreDeps(), tenant));

export const PUT = tenantRoute(async ({ req, tenant }) =>
  setReminderSettings(coreDeps(), tenant, await parseJson(req, reminderSettingsSchema))
);

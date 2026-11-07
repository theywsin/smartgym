import { withTenant } from "@smartgym/db";
import { workoutProgramSchema, type WorkoutProgramInput, type AiWorkoutDraftInput } from "@smartgym/validation";
import { AppError } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import { type TenantContext, requirePermission, requireWritableGym, primaryRole } from "../rbac/access";
import { assertCoachAccess } from "../workouts";

/**
 * Chat-completion provider. Works with any OpenAI-compatible endpoint (AvalAI, GapGPT, Metis, ...):
 *   AI_PROVIDER=openai-compatible  AI_BASE_URL=https://.../v1  AI_API_KEY=...  AI_MODEL=...
 *   AI_PROVIDER unset/none disables AI features. AI_DAILY_LIMIT_PER_GYM caps calls (default 50).
 * The key stays on the server; no member name, phone or id is ever sent to the provider.
 */
export interface AiProvider {
  readonly name: string;
  chatJson(system: string, user: string): Promise<unknown>;
}

export class AiNotConfigured extends AppError {
  constructor() {
    super("BUSINESS_RULE", "دستیار هوش مصنوعی هنوز راه‌اندازی نشده است.");
  }
}

export class OpenAiCompatibleProvider implements AiProvider {
  readonly name = "openai-compatible";
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs = 45_000
  ) {
    if (!baseUrl || !apiKey || !model) throw new Error("AI provider needs AI_BASE_URL, AI_API_KEY and AI_MODEL");
    if (!/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(baseUrl) && process.env.NODE_ENV === "production") throw new Error("AI_BASE_URL must be https (or localhost) in production");
  }

  async chatJson(system: string, user: string): Promise<unknown> {
    const res = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) throw new AppError("INTERNAL", "سرویس هوش مصنوعی پاسخ نداد. کمی بعد دوباره تلاش کنید.");
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    return parseJsonLoose(text);
  }
}

/** Accepts a bare JSON object or one wrapped in a ```json fence. */
export function parseJsonLoose(text: string): unknown {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new AppError("INTERNAL", "پاسخ هوش مصنوعی قابل استفاده نبود. دوباره تلاش کنید.");
  try {
    return JSON.parse(m[0]);
  } catch {
    throw new AppError("INTERNAL", "پاسخ هوش مصنوعی قابل استفاده نبود. دوباره تلاش کنید.");
  }
}

export function createAiProviderFromEnv(env: Record<string, string | undefined>, fetchImpl?: typeof fetch): AiProvider | undefined {
  const kind = env.AI_PROVIDER ?? "none";
  if (kind === "none" || kind === "") return undefined;
  if (kind === "openai-compatible") return new OpenAiCompatibleProvider(env.AI_BASE_URL ?? "", env.AI_API_KEY ?? "", env.AI_MODEL ?? "", fetchImpl);
  throw new Error(`Unknown AI_PROVIDER: ${kind}`);
}

const SYSTEM = `تو یک مربی بدنسازی حرفه‌ای هستی. فقط یک شیء JSON برگردان با این ساختار و بدون هیچ متن دیگری:
{"title": string, "goal": string, "notes": string, "days": [{"title": string, "exercises": [{"name": string, "sets": number, "reps": string, "restSeconds": number, "note": string}]}]}
همه متن‌ها فارسی. تعداد روزها دقیقاً برابر روزهای خواسته‌شده. هر روز ۴ تا ۸ حرکت. reps مثل "10" یا "8-12" یا "30s".
محدودیت‌ها و آسیب‌ها را جدی بگیر و حرکت پرخطر برای آن‌ها پیشنهاد نده.`;

const LEVEL = { BEGINNER: "مبتدی", INTERMEDIATE: "متوسط", ADVANCED: "پیشرفته" } as const;

/**
 * Drafts a workout program for a coach to review. Nothing is saved: the coach edits the
 * draft and saves it through createProgram. Only training facts go to the provider.
 */
export async function draftWorkoutProgram(deps: CoreDeps, ctx: TenantContext, memberId: string, input: AiWorkoutDraftInput): Promise<WorkoutProgramInput> {
  requirePermission(ctx, "workouts.manage");
  requireWritableGym(ctx);
  if (!deps.ai) throw new AiNotConfigured();
  const ai = deps.ai;
  const limit = deps.config.aiDailyLimitPerGym ?? 50;
  const now = nowOf(deps);

  await withTenant(deps.db, ctx, async (tx) => {
    await assertCoachAccess(tx, ctx, memberId);
    const used = await tx.auditLog.count({
      where: { gymId: ctx.gymId, action: "ai.workout_draft", createdAt: { gte: new Date(now.getTime() - 86_400_000) } },
    });
    if (used >= limit) throw new AppError("RATE_LIMITED", "سقف استفاده روزانه از دستیار هوش مصنوعی پر شده است.");
    await writeAudit(tx, {
      gymId: ctx.gymId, actorUserId: ctx.userId, actorRole: primaryRole(ctx),
      action: "ai.workout_draft", entityType: "member", entityId: memberId,
      after: { provider: ai.name, daysPerWeek: input.daysPerWeek, level: input.level },
      ip: ctx.meta?.ip, userAgent: ctx.meta?.userAgent,
    });
  });

  const prompt = [
    `هدف: ${input.goal}`,
    `سطح: ${LEVEL[input.level]}`,
    `روز تمرین در هفته: ${input.daysPerWeek}`,
    input.sex ? `جنسیت: ${input.sex === "MALE" ? "مرد" : "زن"}` : null,
    input.equipment ? `تجهیزات: ${input.equipment}` : null,
    input.limitations ? `محدودیت یا آسیب: ${input.limitations}` : null,
  ].filter(Boolean).join("\n");

  const raw = await ai.chatJson(SYSTEM, prompt);
  const parsed = workoutProgramSchema.safeParse(normalizeDraft(raw));
  if (!parsed.success) throw new AppError("INTERNAL", "پیش‌نویس هوش مصنوعی ناقص بود. دوباره تلاش کنید.");
  return parsed.data;
}

/** Trims over-long fields and coerces numbers so a slightly sloppy answer still validates. */
function normalizeDraft(raw: unknown): unknown {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : v == null ? undefined : String(v).slice(0, max));
  const int = (v: unknown, min: number, max: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
  };
  const days = Array.isArray(r.days) ? r.days.slice(0, 7) : [];
  return {
    title: str(r.title, 100) || "برنامه پیشنهادی",
    goal: str(r.goal, 100) || undefined,
    notes: str(r.notes, 1000) || undefined,
    days: days.map((d: Record<string, unknown>, i: number) => ({
      title: str(d?.title, 60) || `روز ${i + 1}`,
      exercises: (Array.isArray(d?.exercises) ? d.exercises.slice(0, 30) : []).map((e: Record<string, unknown>) => ({
        name: str(e?.name, 80),
        sets: int(e?.sets, 1, 20) ?? 3,
        reps: str(e?.reps, 20) || "10",
        restSeconds: int(e?.restSeconds, 0, 600),
        note: str(e?.note, 200) || undefined,
      })),
    })),
  };
}

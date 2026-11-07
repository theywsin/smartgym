import { withSystem, type Tx } from "@smartgym/db";
import type { ArticleInput } from "@smartgym/validation";
import { AppError, notFound } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { writeAudit } from "../audit";
import type { AdminActor } from "../admin";

/** Persian reading speed ≈ 180 words/minute. */
export function readMinutes(body: string) {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 180));
}

const publicSelect = { slug: true, title: true, excerpt: true, coverUrl: true, tags: true, publishedAt: true, readMinutes: true } as const;

export async function listPublishedArticles(deps: CoreDeps, input: { page: number; pageSize: number; tag?: string }) {
  const now = nowOf(deps);
  const where = { status: "PUBLISHED" as const, publishedAt: { lte: now }, ...(input.tag ? { tags: { has: input.tag } } : {}) };
  return withSystem(deps.db, async (tx) => {
    const [total, items] = await Promise.all([
      tx.article.count({ where }),
      tx.article.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (input.page - 1) * input.pageSize, take: input.pageSize, select: publicSelect }),
    ]);
    return { total, page: input.page, pageSize: input.pageSize, items };
  });
}

export async function getPublishedArticle(deps: CoreDeps, slug: string) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    const a = await tx.article.findFirst({ where: { slug, status: "PUBLISHED", publishedAt: { lte: now } } });
    if (!a) throw notFound("مقاله");
    const related = await tx.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: now }, id: { not: a.id }, ...(a.tags.length ? { tags: { hasSome: a.tags } } : {}) },
      orderBy: { publishedAt: "desc" }, take: 3, select: publicSelect,
    });
    return { ...a, related };
  });
}

async function requireSuperAdmin(tx: Tx, actor: AdminActor) {
  const u = await tx.user.findUnique({ where: { id: actor.userId }, select: { isSuperAdmin: true, status: true } });
  if (!u?.isSuperAdmin || u.status !== "ACTIVE") throw new AppError("FORBIDDEN", "این بخش فقط برای مدیر پلتفرم است.");
}

export async function adminListArticles(deps: CoreDeps, actor: AdminActor) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    return tx.article.findMany({ orderBy: { updatedAt: "desc" }, take: 200, select: { id: true, slug: true, title: true, status: true, publishedAt: true, updatedAt: true, tags: true } });
  });
}

export async function adminGetArticle(deps: CoreDeps, actor: AdminActor, id: string) {
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const a = await tx.article.findUnique({ where: { id } });
    if (!a) throw notFound("مقاله");
    return a;
  });
}

/** Create (id null) or update. First publish stamps publishedAt; later edits keep it. */
export async function adminSaveArticle(deps: CoreDeps, actor: AdminActor, id: string | null, input: ArticleInput) {
  const now = nowOf(deps);
  return withSystem(deps.db, async (tx) => {
    await requireSuperAdmin(tx, actor);
    const clash = await tx.article.findUnique({ where: { slug: input.slug }, select: { id: true } });
    if (clash && clash.id !== id) throw new AppError("CONFLICT", "این نامک قبلاً استفاده شده است.", { fields: { slug: ["تکراری"] } });
    const data = {
      slug: input.slug, title: input.title, excerpt: input.excerpt, body: input.body, coverUrl: input.coverUrl || null, tags: input.tags,
      status: input.status, seoTitle: input.seoTitle || null, seoDescription: input.seoDescription || null, readMinutes: readMinutes(input.body),
    };
    let saved;
    if (id) {
      const existing = await tx.article.findUnique({ where: { id }, select: { publishedAt: true, status: true } });
      if (!existing) throw notFound("مقاله");
      saved = await tx.article.update({ where: { id }, data: { ...data, publishedAt: input.status === "PUBLISHED" ? existing.publishedAt ?? now : existing.publishedAt } });
    } else {
      saved = await tx.article.create({ data: { ...data, authorUserId: actor.userId, publishedAt: input.status === "PUBLISHED" ? now : null } });
    }
    await writeAudit(tx, { actorUserId: actor.userId, actorRole: "SUPER_ADMIN", action: id ? "platform.article_update" : "platform.article_create", entityType: "article", entityId: saved.id, after: { slug: saved.slug, status: saved.status }, ip: actor.ip, userAgent: actor.userAgent });
    return saved;
  });
}

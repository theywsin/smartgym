import { adminListArticles, adminSaveArticle } from "@smartgym/core";
import { articleSchema } from "@smartgym/validation";
import { userRoute, parseJson, ok } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = userRoute(async ({ auth }) => adminListArticles(coreDeps(), { userId: auth.user.id }));
export const POST = userRoute(async ({ req, auth, ip, userAgent, requestId }) =>
  ok(await adminSaveArticle(coreDeps(), { userId: auth.user.id, ip, userAgent }, null, await parseJson(req, articleSchema)), { status: 201 }, requestId)
);

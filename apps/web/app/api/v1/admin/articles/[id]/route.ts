import { adminGetArticle, adminSaveArticle } from "@smartgym/core";
import { articleSchema, uuid } from "@smartgym/validation";
import { userRoute, parseJson } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = userRoute(async ({ auth, params }) => adminGetArticle(coreDeps(), { userId: auth.user.id }, uuid.parse(params.id)));
export const PUT = userRoute(async ({ req, auth, params, ip, userAgent }) =>
  adminSaveArticle(coreDeps(), { userId: auth.user.id, ip, userAgent }, uuid.parse(params.id), await parseJson(req, articleSchema))
);

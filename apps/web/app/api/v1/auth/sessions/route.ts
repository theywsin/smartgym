import { listSessions } from "@smartgym/core";
import { userRoute } from "@/lib/server/api";
import { coreDeps } from "@/lib/server/deps";

export const GET = userRoute(async ({ auth }) => {
  const sessions = await listSessions(coreDeps(), auth.user.id);
  return sessions.map((s) => ({ ...s, current: s.id === auth.session.id }));
});

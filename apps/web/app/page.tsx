import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const hasSession = (await cookies()).has("sg_session");
  redirect(hasSession ? "/manager" : "/login");
}

/** Development-only demo data: two gyms so tenant isolation can be tried by hand. */
import { withSystem, type PrismaClient } from "../src/index";

const DEMO = [
  { phone: "+989120000001", gym: "باشگاه آرین (دمو)", slug: "demo-arian", branches: ["شعبه مرکزی", "شعبه غرب"] },
  { phone: "+989120000002", gym: "باشگاه نگین (دمو)", slug: "demo-negin", branches: ["شعبه اصلی"] },
];

export async function seedDev(db: PrismaClient): Promise<void> {
  await withSystem(db, async (tx) => {
    const ownerRole = await tx.role.findFirstOrThrow({ where: { key: "GYM_OWNER", gymId: null } });
    const plan = await tx.subscriptionPlan.findUniqueOrThrow({ where: { key: "pro" } });

    for (const d of DEMO) {
      const user = await tx.user.upsert({
        where: { phone: d.phone },
        update: {},
        create: { phone: d.phone, phoneVerifiedAt: new Date() },
      });
      const existing = await tx.gym.findUnique({ where: { slug: d.slug } });
      if (existing) continue;
      const gym = await tx.gym.create({ data: { name: d.gym, slug: d.slug, ownerUserId: user.id, status: "TRIAL" } });
      await tx.gymMembership.create({ data: { gymId: gym.id, userId: user.id, roleId: ownerRole.id } });
      for (const name of d.branches) await tx.branch.create({ data: { gymId: gym.id, name } });
      const now = new Date();
      const trialEnds = new Date(now.getTime() + plan.trialDays * 86_400_000);
      await tx.gymSubscription.create({
        data: { gymId: gym.id, planId: plan.id, status: "TRIALING", startsAt: now, endsAt: trialEnds, trialEndsAt: trialEnds },
      });
    }
  });
}

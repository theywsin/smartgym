/**
 * Permission catalogue and default role mapping.
 * The database seed (packages/db) and the server-side policy checks both read from here.
 */
export const PERMISSIONS = [
  "members.read",
  "members.create",
  "members.update",
  "members.delete",
  "memberships.manage", // sell, renew, suspend member subscriptions
  "plans.manage", // create and price membership plans
  "attendance.read",
  "attendance.manage",
  "finance.read",
  "finance.manage",
  "coaches.read",
  "coaches.manage",
  "workouts.read",
  "workouts.manage",
  "nutrition.read",
  "nutrition.manage",
  "store.read",
  "store.manage",
  "buffet.manage",
  "loyalty.manage",
  "reports.read",
  "branches.read",
  "branches.manage",
  "staff.read",
  "staff.manage",
  "settings.manage",
  "ai.use",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const GYM_ROLES = [
  "GYM_OWNER",
  "GYM_MANAGER",
  "BRANCH_MANAGER",
  "COACH",
  "ATHLETE",
  "RECEPTIONIST",
  "ACCOUNTANT",
  "STORE_MANAGER",
] as const;

export type GymRole = (typeof GYM_ROLES)[number];

/** Roles whose access is limited to the branches listed in BranchStaff. */
export const BRANCH_SCOPED_ROLES: ReadonlySet<GymRole> = new Set([
  "BRANCH_MANAGER",
  "RECEPTIONIST",
  "STORE_MANAGER",
]);

const ALL = [...PERMISSIONS];

export const DEFAULT_ROLE_PERMISSIONS: Record<GymRole, readonly Permission[]> = {
  GYM_OWNER: ALL,
  GYM_MANAGER: ALL.filter((p) => p !== "settings.manage"),
  BRANCH_MANAGER: [
    "members.read", "members.create", "members.update",
    "memberships.manage",
    "attendance.read", "attendance.manage",
    "finance.read",
    "coaches.read",
    "workouts.read", "nutrition.read",
    "store.read", "store.manage", "buffet.manage",
    "reports.read",
    "branches.read",
    "staff.read",
    "ai.use",
  ],
  COACH: [
    "members.read",
    "attendance.read",
    "coaches.read",
    "workouts.read", "workouts.manage",
    "nutrition.read", "nutrition.manage",
    "ai.use",
  ],
  ATHLETE: [],
  RECEPTIONIST: [
    "members.read", "members.create", "members.update",
    "memberships.manage",
    "attendance.read", "attendance.manage",
    "coaches.read",
    "branches.read",
  ],
  ACCOUNTANT: ["members.read", "finance.read", "finance.manage", "reports.read", "branches.read"],
  STORE_MANAGER: ["store.read", "store.manage", "buffet.manage", "branches.read"],
};

export const ROLE_LABELS_FA: Record<GymRole, string> = {
  GYM_OWNER: "مالک باشگاه",
  GYM_MANAGER: "مدیر باشگاه",
  BRANCH_MANAGER: "مدیر شعبه",
  COACH: "مربی",
  ATHLETE: "ورزشکار",
  RECEPTIONIST: "پذیرش",
  ACCOUNTANT: "حسابدار",
  STORE_MANAGER: "مسئول فروشگاه",
};

/** Platform modules that SaaS plans can switch on or off. */
export const MODULES = [
  { key: "core", nameFa: "هسته مدیریت باشگاه" },
  { key: "finance", nameFa: "امور مالی" },
  { key: "store", nameFa: "فروشگاه و انبار" },
  { key: "buffet", nameFa: "بوفه" },
  { key: "coaching", nameFa: "پرتال مربی" },
  { key: "athlete_app", nameFa: "اپلیکیشن ورزشکار" },
  { key: "loyalty", nameFa: "باشگاه وفاداری" },
  { key: "multi_branch", nameFa: "چند شعبه" },
  { key: "ai", nameFa: "هوش مصنوعی" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];

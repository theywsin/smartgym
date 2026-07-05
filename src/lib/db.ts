import { 
  db, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  deleteDoc,
  OperationType,
  handleFirestoreError
} from "./firebase";

// Types
export interface FirestoreAthlete {
  id: string;
  name: string;
  username: string;
  password?: string;
  phone: string;
  coachName: string;
  assignedProgramId: string;
  assignedNutritionId: string;
  remainingSessions: number;
  joinedDate: string;
  avatar: string; // DiceBear seed/URL
  themeColor: string;
  bmi: number;
  bmr: number;
  bodyFat: number;
  bicepSize: number;
  chestSize: number;
  waistSize: number;
  thighSize: number;
  coachNotes: string;
  completedDays: string[]; // completed workout days (e.g., ["شنبه", "یکشنبه"])
  weightHistory: { date: string; weight: number }[];
}

export interface FirestoreCoach {
  id: string;
  name: string;
  username: string;
  password?: string;
  specialty: string;
  studentsCount: number;
  workoutsDesigned: number;
}

export interface MembershipPlan {
  id: string;
  name: string;
  durationDays: number;
  price: number; // in Tomans
}

export interface MembershipRequest {
  id: string;
  athleteId: string;
  athleteName: string;
  planId: string;
  planName: string;
  durationDays: number;
  price: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  date: string;
}

export interface GymSettings {
  logoUrl: string;
  addressName: string;
  latitude: number;
  longitude: number;
  clubName: string;
}

// Default Data for Seeding
const DEFAULT_MEMBERS: FirestoreAthlete[] = [
  {
    id: "m_101",
    name: "آرش احمدی",
    username: "arash",
    password: "123",
    phone: "۰۹۱۲۱۱۱۲۲۳۳",
    coachName: "استاد پوریا کریمی",
    assignedProgramId: "prog_1",
    assignedNutritionId: "nut_1",
    remainingSessions: 14,
    joinedDate: "۱۴۰۵/۰۱/۱۰",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Arash",
    themeColor: "emerald",
    bmi: 24.1,
    bmr: 1780,
    bodyFat: 13.5,
    bicepSize: 41,
    chestSize: 112,
    waistSize: 82,
    thighSize: 62,
    coachNotes: "نسبت به ماه گذشته دور کمر ۲ سانتی‌متر کاهش و دور بازو ۱ سانتی‌متر افزایش یافته است. برنامه غذایی کات به خوبی عمل کرده است.",
    completedDays: ["شنبه"],
    weightHistory: [
      { date: "۰۳/۰۱", weight: 79.5 },
      { date: "۰۳/۰۸", weight: 78.9 },
      { date: "۰۳/۱۵", weight: 78.4 },
      { date: "۰۳/۲۲", weight: 78.1 },
      { date: "۰۳/۲۹", weight: 77.8 }
    ]
  },
  {
    id: "m_102",
    name: "سهراب مرادی",
    username: "sohrab",
    password: "123",
    phone: "۰۹۱۹۲۲۲۳۳۴۴",
    coachName: "استاد پوریا کریمی",
    assignedProgramId: "prog_1",
    assignedNutritionId: "nut_1",
    remainingSessions: 12,
    joinedDate: "۱۴۰۵/۰۲/۱۵",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sohrab",
    themeColor: "blue",
    bmi: 26.5,
    bmr: 1950,
    bodyFat: 18.2,
    bicepSize: 39,
    chestSize: 108,
    waistSize: 88,
    thighSize: 58,
    coachNotes: "تمرکز روی تمرینات هوازی بعد از وزنه افزایش یابد. تغذیه کم کربوهیدرات رعایت شود.",
    completedDays: [],
    weightHistory: [
      { date: "۰۳/۰۱", weight: 85.0 },
      { date: "۰۳/۰۸", weight: 84.2 },
      { date: "۰۳/۱۵", weight: 83.5 }
    ]
  },
  {
    id: "m_103",
    name: "الناز شاکری",
    username: "elnaz",
    password: "123",
    phone: "۰۹۳۵۴۴۴۵۵۶۶",
    coachName: "خانم مهسا امینی",
    assignedProgramId: "prog_2",
    assignedNutritionId: "nut_2",
    remainingSessions: 8,
    joinedDate: "۱۴۰۵/۰۳/۰۱",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Elnaz",
    themeColor: "rose",
    bmi: 21.3,
    bmr: 1350,
    bodyFat: 21.0,
    bicepSize: 28,
    chestSize: 94,
    waistSize: 68,
    thighSize: 54,
    coachNotes: "پیشرفت عالی در فرم حرکات اسکوات و سلامتی عمومی بدن.",
    completedDays: ["شنبه", "دوشنبه"],
    weightHistory: [
      { date: "۰۳/۰۱", weight: 58.0 },
      { date: "۰۳/۱۵", weight: 57.2 }
    ]
  }
];

const DEFAULT_COACHES: FirestoreCoach[] = [
  {
    id: "c_1",
    name: "پوریا کریمی",
    username: "pouria",
    password: "123",
    specialty: "پرورش اندام و کات تخصصی",
    studentsCount: 15,
    workoutsDesigned: 34
  },
  {
    id: "c_2",
    name: "مهسا امینی",
    username: "mahsa",
    password: "123",
    specialty: "فیتنس بانوان و رژیم‌های کاهش وزن",
    studentsCount: 12,
    workoutsDesigned: 28
  }
];

const DEFAULT_PLANS: MembershipPlan[] = [
  { id: "plan_1", name: "برنزی - ۱ ماهه (۱۲ جلسه)", durationDays: 30, price: 450000 },
  { id: "plan_2", name: "نقره‌ای - ۳ ماهه (۳۶ جلسه)", durationDays: 90, price: 1200000 },
  { id: "plan_3", name: "طلایی - ۶ ماهه (نامحدود)", durationDays: 180, price: 2200000 }
];

const DEFAULT_SETTINGS: GymSettings = {
  logoUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80",
  addressName: "تهران، خیابان ولیعصر، نرسیده به میدان ونک، باشگاه اکسیژن",
  latitude: 35.7538,
  longitude: 51.4084,
  clubName: "اسمارت جیم (Oxygen Club)"
};

// Seed DB if empty
export async function seedDatabaseIfEmpty() {
  try {
    const athleteSnap = await getDocs(collection(db, "athletes"));
    if (athleteSnap.empty) {
      console.log("Seeding athletes database...");
      for (const athlete of DEFAULT_MEMBERS) {
        await setDoc(doc(db, "athletes", athlete.id), athlete);
      }
    }

    const coachSnap = await getDocs(collection(db, "coaches"));
    if (coachSnap.empty) {
      console.log("Seeding coaches database...");
      for (const coach of DEFAULT_COACHES) {
        await setDoc(doc(db, "coaches", coach.id), coach);
      }
    }

    const plansSnap = await getDocs(collection(db, "membership_plans"));
    if (plansSnap.empty) {
      console.log("Seeding membership plans...");
      for (const plan of DEFAULT_PLANS) {
        await setDoc(doc(db, "membership_plans", plan.id), plan);
      }
    }

    const settingsDoc = await getDoc(doc(db, "gym_settings", "general"));
    if (!settingsDoc.exists()) {
      console.log("Seeding gym settings...");
      await setDoc(doc(db, "gym_settings", "general"), DEFAULT_SETTINGS);
    }
  } catch (err) {
    console.error("Error seeding Firestore database: ", err);
  }
}

// Athlete APIs
export async function getAthletes(): Promise<FirestoreAthlete[]> {
  const snap = await getDocs(collection(db, "athletes"));
  const list: FirestoreAthlete[] = [];
  snap.forEach((d) => {
    list.push(d.data() as FirestoreAthlete);
  });
  return list;
}

export async function updateAthlete(id: string, data: Partial<FirestoreAthlete>) {
  const ref = doc(db, "athletes", id);
  await updateDoc(ref, data);
}

export async function addAthlete(athlete: FirestoreAthlete) {
  await setDoc(doc(db, "athletes", athlete.id), athlete);
}

// Coach APIs
export async function getCoaches(): Promise<FirestoreCoach[]> {
  const snap = await getDocs(collection(db, "coaches"));
  const list: FirestoreCoach[] = [];
  snap.forEach((d) => {
    list.push(d.data() as FirestoreCoach);
  });
  return list;
}

export async function updateCoach(id: string, data: Partial<FirestoreCoach>) {
  const ref = doc(db, "coaches", id);
  await updateDoc(ref, data);
}

export async function addCoach(coach: FirestoreCoach) {
  await setDoc(doc(db, "coaches", coach.id), coach);
}

// Membership Plan APIs
export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  const snap = await getDocs(collection(db, "membership_plans"));
  const list: MembershipPlan[] = [];
  snap.forEach((d) => {
    list.push(d.data() as MembershipPlan);
  });
  return list;
}

export async function saveMembershipPlan(plan: MembershipPlan) {
  await setDoc(doc(db, "membership_plans", plan.id), plan);
}

export async function deleteMembershipPlan(id: string) {
  await deleteDoc(doc(db, "membership_plans", id));
}

// Membership Request APIs
export async function getMembershipRequests(): Promise<MembershipRequest[]> {
  const snap = await getDocs(collection(db, "membership_requests"));
  const list: MembershipRequest[] = [];
  snap.forEach((d) => {
    list.push(d.data() as MembershipRequest);
  });
  return list;
}

export async function createMembershipRequest(req: MembershipRequest) {
  await setDoc(doc(db, "membership_requests", req.id), req);
}

export async function updateMembershipRequestStatus(id: string, status: "APPROVED" | "REJECTED") {
  const ref = doc(db, "membership_requests", id);
  await updateDoc(ref, { status });
}

// Gym Settings APIs
export async function getGymSettings(): Promise<GymSettings> {
  const d = await getDoc(doc(db, "gym_settings", "general"));
  if (d.exists()) {
    return d.data() as GymSettings;
  }
  return DEFAULT_SETTINGS;
}

export async function updateGymSettings(data: Partial<GymSettings>) {
  const ref = doc(db, "gym_settings", "general");
  await updateDoc(ref, data);
}

import { toPersianNums } from "../types";
import { db, collection, doc, setDoc } from "./firebase";

// MySQL Database tables schemas & simulations

export interface MySQLMember {
  id: string;
  name: string;
  username: string;
  password: string;
  phone: string;
  assignedProgramId: string;
  assignedNutritionId: string;
  remainingSessions: number;
  remainingDays: number;
  coachName: string;
  joinedDate: string;
  // Medical/Biometric data
  bmi: string;
  bmr: string;
  fatPercent: string;
  armSize: string;
  chestSize: string;
  waistSize: string;
  thighSize: string;
  notes: string;
}

export interface MySQLCoach {
  id: string;
  name: string;
  username: string;
  password: string;
  specialty: string;
  clubId: string;
  rating: number;
  activeAthletes: number;
}

export interface MySQLTenant {
  id: string;
  clubName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  planName: string;
  expiresAt: string;
  branchesCount: number;
  membersCount: number;
  monthlyRevenue: number;
  createdAt: string;
  features: string[];
}

export interface MySQLMembershipRequest {
  id: string;
  memberId: string;
  memberName: string;
  planName: string;
  days: number;
  priceToman: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  date: string;
}

// Initial Mock Seed Data
const DEFAULT_MEMBERS: MySQLMember[] = [
  {
    id: "m_101",
    name: "آرش احمدی",
    username: "arash",
    password: "123",
    phone: "09121112233",
    assignedProgramId: "prog_1",
    assignedNutritionId: "nut_1",
    remainingSessions: 14,
    remainingDays: 24,
    coachName: "استاد پوریا کریمی",
    joinedDate: "1405/01/10",
    bmi: "۲۴.۱ (سالم)",
    bmr: "۱,۷۸۰ کالری",
    fatPercent: "۱۳.۵٪",
    armSize: "۴۱",
    chestSize: "۱۱۲",
    waistSize: "۸۲",
    thighSize: "۶۲",
    notes: "نسبت به ماه گذشته دور کمر ۲ سانتی‌متر کاهش و دور بازو ۱ سانتی‌متر افزایش یافته است. این یعنی کاهش چربی همراه با افزایش همزمان حجم خشک عضله. برنامه غذایی کات به خوبی عمل کرده است."
  },
  {
    id: "m_102",
    name: "سهراب مرادی",
    username: "sohrab",
    password: "123",
    phone: "09192223344",
    assignedProgramId: "prog_1",
    assignedNutritionId: "nut_1",
    remainingSessions: 12,
    remainingDays: 15,
    coachName: "استاد پوریا کریمی",
    joinedDate: "1405/02/15",
    bmi: "۲۶.۸ (اضافه وزن ملایم)",
    bmr: "۱,۹۵۰ کالری",
    fatPercent: "۱۸.۲٪",
    armSize: "۴۳",
    chestSize: "۱۱۸",
    waistSize: "۹۰",
    thighSize: "۶۶",
    notes: "سهراب در دوره حجم‌گیری خوبی قرار دارد. درصد چربی کمی بالا رفته اما عضلات بسیار پرتر شده‌اند. تمرینات قدرتی با تکرارهای ۸ الی ۱۰ عالی پیش می‌روند."
  },
  {
    id: "m_103",
    name: "الناز شاکری",
    username: "elnaz",
    password: "123",
    phone: "09353334455",
    assignedProgramId: "prog_1",
    assignedNutritionId: "nut_1",
    remainingSessions: 8,
    remainingDays: 35,
    coachName: "سارا حسینی",
    joinedDate: "1405/03/01",
    bmi: "۲۱.۴ (نرمال و فیت)",
    bmr: "۱,۴۲۰ کالری",
    fatPercent: "۱۶.۸٪",
    armSize: "۳۲",
    chestSize: "۹۴",
    waistSize: "۶۸",
    thighSize: "۵۴",
    notes: "الناز پیشرفت فوق‌العاده‌ای در فرم‌دهی و قدرت عضلات پا داشته است. ثبات تمرینی بسیار بالایی دارد و رژیم غذایی پرپروتئین را دقیقاً رعایت می‌کند."
  }
];

const DEFAULT_COACHES: MySQLCoach[] = [
  { id: "1", name: "استاد پوریا کریمی", username: "pouria", password: "123", specialty: "بدنسازی و فیتنس", clubId: "all", rating: 4.9, activeAthletes: 18 },
  { id: "2", name: "سارا حسینی", username: "sara", password: "123", specialty: "تغذیه و لاغری", clubId: "all", rating: 4.8, activeAthletes: 12 }
];

const DEFAULT_TENANTS: MySQLTenant[] = [
  {
    id: "oxigen",
    clubName: "مجموعه ورزشی اکسیژن (شعبه مرکزی)",
    ownerName: "مهندس علیرضا اکبری",
    email: "oxygen@gmail.com",
    phone: "09121002030",
    status: "ACTIVE",
    planName: "پلن سازمانی (پلاتینیوم)",
    expiresAt: "1405/12/29",
    branchesCount: 2,
    membersCount: 450,
    monthlyRevenue: 48200000,
    createdAt: "1404/01/15",
    features: ["پورتال اختصاصی اعضا", "سامانه حضور و غیاب هوشمند QR", "برنامه‌ساز پیشرفته تحت وب", "درگاه بانکی شتابی متصل"]
  }
];

const DEFAULT_REQUESTS: MySQLMembershipRequest[] = [
  {
    id: "req_1",
    memberId: "m_101",
    memberName: "آرش احمدی",
    planName: "اشتراک ۱ ماهه طلایی",
    days: 30,
    priceToman: 450000,
    status: "PENDING",
    date: "1405/04/04"
  }
];

// Database CRUD engine using localStorage cached with live Firestore cloud database
export const mysqlDb = {
  // Read (local cached synchronous retrieval for fast UI loads)
  getMembers(): MySQLMember[] {
    const data = localStorage.getItem("mysql_table_members");
    if (!data) {
      localStorage.setItem("mysql_table_members", JSON.stringify(DEFAULT_MEMBERS));
      return DEFAULT_MEMBERS;
    }
    return JSON.parse(data);
  },

  getCoaches(): MySQLCoach[] {
    const data = localStorage.getItem("mysql_table_coaches");
    if (!data) {
      localStorage.setItem("mysql_table_coaches", JSON.stringify(DEFAULT_COACHES));
      return DEFAULT_COACHES;
    }
    return JSON.parse(data);
  },

  getTenants(): MySQLTenant[] {
    const data = localStorage.getItem("mysql_table_tenants");
    if (!data) {
      localStorage.setItem("mysql_table_tenants", JSON.stringify(DEFAULT_TENANTS));
      return DEFAULT_TENANTS;
    }
    return JSON.parse(data);
  },

  getMembershipRequests(): MySQLMembershipRequest[] {
    const data = localStorage.getItem("mysql_table_membership_requests");
    if (!data) {
      localStorage.setItem("mysql_table_membership_requests", JSON.stringify(DEFAULT_REQUESTS));
      return DEFAULT_REQUESTS;
    }
    return JSON.parse(data);
  },

  // Write (saving locally + asynchronous write to real cloud database)
  async saveMembers(members: MySQLMember[]) {
    localStorage.setItem("mysql_table_members", JSON.stringify(members));
    try {
      for (const m of members) {
        if (m && m.id) {
          await setDoc(doc(db, "members", m.id), m);
        }
      }
    } catch (e) {
      console.error("Firestore Cloud DB Save Error (Members):", e);
    }
  },

  async saveCoaches(coaches: MySQLCoach[]) {
    localStorage.setItem("mysql_table_coaches", JSON.stringify(coaches));
    try {
      for (const c of coaches) {
        if (c && c.id) {
          await setDoc(doc(db, "coaches", c.id), c);
        }
      }
    } catch (e) {
      console.error("Firestore Cloud DB Save Error (Coaches):", e);
    }
  },

  async saveTenants(tenants: MySQLTenant[]) {
    localStorage.setItem("mysql_table_tenants", JSON.stringify(tenants));
    try {
      for (const t of tenants) {
        if (t && t.id) {
          await setDoc(doc(db, "tenants", t.id), t);
        }
      }
    } catch (e) {
      console.error("Firestore Cloud DB Save Error (Tenants):", e);
    }
  },

  async saveMembershipRequests(requests: MySQLMembershipRequest[]) {
    localStorage.setItem("mysql_table_membership_requests", JSON.stringify(requests));
    try {
      for (const r of requests) {
        if (r && r.id) {
          await setDoc(doc(db, "membership_requests", r.id), r);
        }
      }
    } catch (e) {
      console.error("Firestore Cloud DB Save Error (MembershipRequests):", e);
    }
  },

  // Helpers for other entities to sync to Firestore easily
  async saveWorkoutPrograms(programs: any[]) {
    try {
      for (const p of programs) {
        if (p && p.id) {
          await setDoc(doc(db, "workout_programs", p.id), p);
        }
      }
    } catch (e) {
      console.error("Firestore Save Error (WorkoutPrograms):", e);
    }
  },

  async saveNutritionPlans(plans: any[]) {
    try {
      for (const p of plans) {
        if (p && p.id) {
          await setDoc(doc(db, "nutrition_plans", p.id), p);
        }
      }
    } catch (e) {
      console.error("Firestore Save Error (NutritionPlans):", e);
    }
  },

  async saveStoreProducts(products: any[]) {
    try {
      for (const p of products) {
        if (p && p.id) {
          await setDoc(doc(db, "store_products", p.id), p);
        }
      }
    } catch (e) {
      console.error("Firestore Save Error (StoreProducts):", e);
    }
  },

  async saveBookings(bookings: any[]) {
    try {
      for (const b of bookings) {
        if (b && b.id) {
          await setDoc(doc(db, "bookings", b.id), b);
        }
      }
    } catch (e) {
      console.error("Firestore Save Error (Bookings):", e);
    }
  },

  async saveTickets(tickets: any[]) {
    try {
      for (const t of tickets) {
        if (t && t.id) {
          await setDoc(doc(db, "tickets", t.id), t);
        }
      }
    } catch (e) {
      console.error("Firestore Save Error (Tickets):", e);
    }
  },

  async saveAttendanceRecords(records: any[]) {
    try {
      for (const r of records) {
        if (r && r.id) {
          await setDoc(doc(db, "attendance_records", r.id), r);
        }
      }
    } catch (e) {
      console.error("Firestore Save Error (AttendanceRecords):", e);
    }
  },

  async saveExercisesList(exercises: any[]) {
    try {
      for (const ex of exercises) {
        if (ex && ex.id) {
          await setDoc(doc(db, "exercises_database", ex.id), ex);
        }
      }
    } catch (e) {
      console.error("Firestore Save Error (ExercisesList):", e);
    }
  },

  async saveCoachSales(sales: any[]) {
    try {
      for (const s of sales) {
        if (s && s.id) {
          await setDoc(doc(db, "coach_sales", s.id), s);
        }
      }
    } catch (e) {
      console.error("Firestore Save Error (CoachSales):", e);
    }
  },

  // Create Athlete with strictly ZERO/DEFAULT values
  createMember(newMember: Partial<MySQLMember>): MySQLMember {
    const members = this.getMembers();
    const created: MySQLMember = {
      id: newMember.id || `m_${Date.now()}`,
      name: newMember.name || "ورزشکار جدید",
      username: newMember.username || `user_${Date.now()}`,
      password: newMember.password || "123",
      phone: newMember.phone || "۰۹۰۰۰۰۰۰۰۰۰",
      assignedProgramId: "",
      assignedNutritionId: "",
      remainingSessions: 0, // Strictly 0
      remainingDays: 0, // Strictly 0
      coachName: newMember.coachName || "بدون مربی",
      joinedDate: newMember.joinedDate || "1405/04/01",
      bmi: "۰.۰ (تعریف نشده)",
      bmr: "۰ کالری",
      fatPercent: "۰٪",
      armSize: "۰",
      chestSize: "۰",
      waistSize: "۰",
      thighSize: "۰",
      notes: "پرونده جدید تشکیل شده و مقادیر اولیه روی صفر تنظیم شده است. لطفا آنالیز فیزیکی را تکمیل کنید."
    };
    members.push(created);
    this.saveMembers(members);
    return created;
  },

  // Create Coach with strictly ZERO/DEFAULT values
  createCoach(newCoach: Partial<MySQLCoach>): MySQLCoach {
    const coaches = this.getCoaches();
    const created: MySQLCoach = {
      id: newCoach.id || `c_${Date.now()}`,
      name: newCoach.name || "مربی جدید",
      username: newCoach.username || `coach_${Date.now()}`,
      password: newCoach.password || "123",
      specialty: newCoach.specialty || "تخصص تعریف نشده",
      clubId: "all",
      rating: 0, // Strictly 0
      activeAthletes: 0 // Strictly 0
    };
    coaches.push(created);
    this.saveCoaches(coaches);
    return created;
  },

  // Create Tenant (Club) with strictly ZERO/DEFAULT values
  createTenant(newTenant: Partial<MySQLTenant>): MySQLTenant {
    const tenants = this.getTenants();
    const created: MySQLTenant = {
      id: newTenant.id || `club_${Date.now()}`,
      clubName: newTenant.clubName || "باشگاه جدید",
      ownerName: newTenant.ownerName || "مالک جدید",
      email: newTenant.email || "info@club.ir",
      phone: newTenant.phone || "۰۹۰۰۰۰۰۰۰۰۰",
      status: "ACTIVE",
      planName: newTenant.planName || "پلن رایگان آزمایشی",
      expiresAt: "1405/05/01",
      branchesCount: 0, // Strictly 0
      membersCount: 0, // Strictly 0
      monthlyRevenue: 0, // Strictly 0
      createdAt: "1405/04/04",
      features: [] // Strictly empty
    };
    tenants.push(created);
    this.saveTenants(tenants);
    return created;
  }
};

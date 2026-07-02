/**
 * Type Definitions for SmartGym SaaS Platform
 * Highly modular and secure commercial design
 */

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  GYM_OWNER = "GYM_OWNER",
  MANAGER = "MANAGER",
  RECEPTION = "RECEPTION",
  COACH = "COACH",
  NUTRITIONIST = "NUTRITIONIST",
  MEMBER = "MEMBER",
  GUEST = "GUEST"
}

export interface Tenant {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  domain?: string;
  logoUrl?: string;
  status: "ACTIVE" | "SUSPENDED" | "TRIAL";
  planName: string;
  expiresAt: string;
  branchesCount: number;
  membersCount: number;
  monthlyRevenue: number;
  createdAt: string;
  whiteLabelTheme?: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    customFooter?: string;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  durationMonths: number;
  priceIrr: number; // Price in Iranian Rials
  priceToman: number; // Price in Tomans
  features: string[];
  isPopular?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  animationType: "LOTTIE" | "GIF" | "3D";
  highlightMuscles: string[];
  correctForm: string;
  wrongForm: string;
  warning?: string;
}

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weightKg: number;
  isCompleted: boolean;
}

export interface WorkoutExerciseInstance {
  exercise: Exercise;
  sets: WorkoutSet[];
  restDurationSeconds: number;
}

export interface WorkoutProgram {
  id: string;
  title: string;
  summary: string;
  createdBy: string;
  assignedTo?: string;
  schedule: {
    day: string;
    focus: string;
    exercises: WorkoutExerciseInstance[];
  }[];
  tips: string[];
}

export interface Meal {
  title: string;
  items: string[];
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface NutritionPlan {
  id: string;
  title: string;
  targetCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    water: number; // In Litres
  };
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks: Meal;
  };
  shoppingList: string[];
  advice: string[];
}

export interface BodyMeasurement {
  date: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  bmr: number;
  tdee: number;
  bodyFatPercentage: number;
  chestCm?: number;
  armCm?: number;
  waistCm?: number;
  hipCm?: number;
  legCm?: number;
  shoulderCm?: number;
  neckCm?: number;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  totalHours?: number;
  status: "PRESENT" | "LATE" | "ABSENT";
}

export interface Invoice {
  id: string;
  tenantId?: string;
  memberName: string;
  planName: string;
  amountToman: number;
  paymentMethod: "ONLINE" | "BANK_TRANSFER" | "WALLET" | "OFFLINE";
  status: "PAID" | "PENDING" | "REFUNDED" | "FAILED";
  date: string;
  couponApplied?: string;
  installmentCount?: number;
}

export interface Booking {
  id: string;
  className: string;
  coachName: string;
  memberName: string;
  date: string;
  timeSlot: string;
  status: "CONFIRMED" | "WAITLIST" | "CANCELLED";
}

export interface Ticket {
  id: string;
  memberName: string;
  department: "TECHNICAL" | "ACCOUNTING" | "COACHING" | "GENERAL";
  subject: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "ANSWERED" | "CLOSED";
  date: string;
  replies: {
    sender: string;
    text: string;
    time: string;
  }[];
}

export interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  ip: string;
  device: string;
  time: string;
}

export interface StoreProduct {
  id: string;
  name: string;
  category: "SUPPLEMENT" | "EQUIPMENT" | "ACCESSORY";
  brand: string;
  priceToman: number;
  stock: number;
  minStockAlert: number;
  barcode: string;
}

-- --------------------------------------------------------
-- Smart Gym Platform SaaS Database Schema for cPanel & phpMyAdmin
-- پلتفرم مدیریت هوشمند و اختصاصی باشگاه‌های ورزشی اسمارت جیم
-- --------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. جدول مستاجران (باشگاه‌ها)
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` VARCHAR(100) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `ownerName` VARCHAR(255),
  `email` VARCHAR(255),
  `phone` VARCHAR(100),
  `domain` VARCHAR(255),
  `status` VARCHAR(50),
  `planName` VARCHAR(255),
  `expiresAt` VARCHAR(100),
  `branchesCount` INT DEFAULT 1,
  `membersCount` INT DEFAULT 0,
  `monthlyRevenue` DECIMAL(15, 2) DEFAULT 0,
  `createdAt` VARCHAR(100),
  `username` VARCHAR(100),
  `password` VARCHAR(255),
  `whiteLabelTheme` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. جدول اعضا و ورزشکاران
CREATE TABLE IF NOT EXISTS `members` (
  `id` VARCHAR(100) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(100),
  `password` VARCHAR(255),
  `phone` VARCHAR(100),
  `assignedProgramId` VARCHAR(100),
  `assignedNutritionId` VARCHAR(100),
  `remainingSessions` INT DEFAULT 12,
  `coachName` VARCHAR(255),
  `joinedDate` VARCHAR(100),
  `bmr` VARCHAR(50),
  `bmi` VARCHAR(100),
  `fatPercent` VARCHAR(50),
  `armSize` VARCHAR(50),
  `chestSize` VARCHAR(50),
  `waistSize` VARCHAR(50),
  `thighSize` VARCHAR(50),
  `notes` TEXT,
  `clubId` VARCHAR(100) DEFAULT 'oxigen'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. جدول مربیان
CREATE TABLE IF NOT EXISTS `coaches` (
  `id` VARCHAR(100) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(100),
  `password` VARCHAR(255),
  `specialty` VARCHAR(255),
  `clubId` VARCHAR(100) DEFAULT 'all'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. جدول درخواست‌های عضویت در باشگاه‌ها
CREATE TABLE IF NOT EXISTS `membership_requests` (
  `id` VARCHAR(100) PRIMARY KEY,
  `tenantId` VARCHAR(100),
  `memberName` VARCHAR(255),
  `phone` VARCHAR(100),
  `planName` VARCHAR(255),
  `status` VARCHAR(50),
  `createdAt` VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. جدول برنامه‌های تمرینی ورزشکاران
CREATE TABLE IF NOT EXISTS `workout_programs` (
  `id` VARCHAR(100) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `summary` TEXT,
  `schedule` LONGTEXT,
  `tips` TEXT,
  `clubId` VARCHAR(100) DEFAULT 'oxigen'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. جدول رژیم‌ها و برنامه‌های غذایی
CREATE TABLE IF NOT EXISTS `nutrition_plans` (
  `id` VARCHAR(100) PRIMARY KEY,
  `targetCalories` VARCHAR(100),
  `macros` TEXT,
  `meals` LONGTEXT,
  `shoppingList` TEXT,
  `advice` TEXT,
  `clubId` VARCHAR(100) DEFAULT 'oxigen'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. جدول محصولات فروشگاهی باشگاه (مکمل، پوشاک و غیره)
CREATE TABLE IF NOT EXISTS `store_products` (
  `id` VARCHAR(100) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100),
  `brand` VARCHAR(255),
  `priceToman` DECIMAL(15, 2) DEFAULT 0,
  `stock` INT DEFAULT 0,
  `minStockAlert` INT DEFAULT 5,
  `barcode` VARCHAR(255),
  `clubId` VARCHAR(100) DEFAULT 'oxigen'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. جدول رزرو جلسات خصوصی یا کلاس‌های گروهی
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` VARCHAR(100) PRIMARY KEY,
  `memberName` VARCHAR(255),
  `className` VARCHAR(255),
  `date` VARCHAR(100),
  `time` VARCHAR(100),
  `status` VARCHAR(50),
  `clubId` VARCHAR(100) DEFAULT 'oxigen'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. جدول تیکت‌های پشتیبانی کاربران و ورزشکاران
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` VARCHAR(100) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50),
  `priority` VARCHAR(50),
  `senderName` VARCHAR(255),
  `createdAt` VARCHAR(100),
  `replies` LONGTEXT,
  `clubId` VARCHAR(100) DEFAULT 'oxigen'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. جدول حضور و غیاب و ورود/خروج هوشمند
CREATE TABLE IF NOT EXISTS `attendance_records` (
  `id` VARCHAR(100) PRIMARY KEY,
  `memberId` VARCHAR(100),
  `memberName` VARCHAR(255),
  `date` VARCHAR(100),
  `checkInTime` VARCHAR(100),
  `checkOutTime` VARCHAR(100),
  `totalHours` DOUBLE DEFAULT 0,
  `status` VARCHAR(50),
  `clubId` VARCHAR(100) DEFAULT 'oxigen'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. جدول دیتابیس حرکات ورزشی (انیمیشن‌ها و نحوه صحیح/غلط)
CREATE TABLE IF NOT EXISTS `exercises_database` (
  `id` VARCHAR(100) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `muscleGroup` VARCHAR(100),
  `correctWay` TEXT,
  `wrongWay` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. جدول آمارهای فروش و پورسانت‌های مربیان
CREATE TABLE IF NOT EXISTS `coach_sales` (
  `id` VARCHAR(100) PRIMARY KEY,
  `coachId` VARCHAR(100),
  `coachName` VARCHAR(255),
  `studentName` VARCHAR(255),
  `packageName` VARCHAR(255),
  `price` DECIMAL(15, 2) DEFAULT 0,
  `date` VARCHAR(100),
  `month` VARCHAR(50),
  `clubId` VARCHAR(100) DEFAULT 'oxigen'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. جدول پست‌های وبلاگ و اطلاعیه‌های عمومی باشگاه‌ها
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` VARCHAR(100) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `excerpt` TEXT,
  `content` LONGTEXT,
  `author` VARCHAR(255),
  `date` VARCHAR(100),
  `image` VARCHAR(255),
  `category` VARCHAR(100),
  `clubId` VARCHAR(100) DEFAULT 'oxigen'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. جدول چت‌های پشتیبانی هوشمند (با مربی هوشمند هوش مصنوعی)
CREATE TABLE IF NOT EXISTS `smart_support_chats` (
  `id` VARCHAR(100) PRIMARY KEY,
  `userName` VARCHAR(255),
  `userPhone` VARCHAR(100),
  `createdAt` VARCHAR(100),
  `updatedAt` VARCHAR(100),
  `messages` LONGTEXT,
  `clubId` VARCHAR(100) DEFAULT 'oxigen'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. جدول تنظیمات پلتفرم و برندینگ (Platform Global Settings)
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

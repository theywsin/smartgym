<?php
/**
 * 🪄 Easy Installer for SmartGym Platform
 * سیستم نصب آسان و خودکار پایگاه داده مای‌اس‌کیوال (MySQL) اسمارت‌جیم روی سی‌پنل
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

$lock_file = __DIR__ . '/install.lock';
$config_file = __DIR__ . '/config_db.php';
$schema_file = __DIR__ . '/schema_cpanel.sql';

// ۱. بررسی وضعیت قفل بودن نصب‌کننده
$is_locked = file_exists($lock_file);

$step = isset($_GET['step']) ? (int)$_GET['step'] : 1;
$error = '';
$success_msg = '';

if ($is_locked && $step !== 3) {
    $step = 'locked';
}

// ۲. پردازش فرم ارسال شده
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$is_locked) {
    if (isset($_POST['action']) && $_POST['action'] === 'install') {
        $db_host = trim($_POST['db_host'] ?? 'localhost');
        $db_port = trim($_POST['db_port'] ?? '3306');
        $db_user = trim($_POST['db_user'] ?? '');
        $db_pass = $_POST['db_pass'] ?? '';
        $db_name = trim($_POST['db_name'] ?? '');
        $import_seed = isset($_POST['import_seed']);
        
        $admin_user = trim($_POST['admin_user'] ?? 'admin');
        $admin_pass = trim($_POST['admin_pass'] ?? 'admin123');
        $brand_name = trim($_POST['brand_name'] ?? 'مجموعه ورزشی مدرن اسمارت‌جیم');

        if (empty($db_user) || empty($db_name)) {
            $error = 'لطفاً نام کاربری و نام دیتابیس را وارد نمایید.';
        } else {
            try {
                // الف. تست اتصال به دیتابیس
                $dsn = "mysql:host=$db_host;port=$db_port;charset=utf8mb4";
                $test_pdo = new PDO($dsn, $db_user, $db_pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]);

                // ب. ایجاد دیتابیس در صورت عدم وجود (اگر دسترسی کاربر اجازه دهد)
                $test_pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                $test_pdo->exec("USE `$db_name`");

                // ج. خواندن و اجرای فایل اسکیما
                if (!file_exists($schema_file)) {
                    throw new Exception("فایل اسکیما پیدا نشد! لطفا بررسی کنید که فایل 'schema_cpanel.sql' در ریشه پروژه قرار داشته باشد.");
                }

                $sql_content = file_get_contents($schema_file);
                
                // پاک‌سازی کامنت‌ها و آماده‌سازی برای اجرا
                $sql_content = preg_replace('/--.*\n/', '', $sql_content);
                $sql_content = preg_replace('/\/\*.*?\*\//s', '', $sql_content);
                
                // جداسازی کوئری‌ها بر اساس سیمیکولن آخر خط
                $queries = preg_split('/;\s*[\r\n]+/', $sql_content);
                
                $test_pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
                
                $executed_count = 0;
                foreach ($queries as $query) {
                    $query = trim($query);
                    if (!empty($query)) {
                        $test_pdo->exec($query);
                        $executed_count++;
                    }
                }
                
                $test_pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

                // د. ثبت داده‌های دمو و سید اطلاعات
                if ($import_seed) {
                    // درج اطلاعات سوپر ادمین در تنظیمات پلتفرم یا دیتابیس
                    $stmt_settings = $test_pdo->prepare("INSERT INTO `platform_settings` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?");
                    
                    $admin_payload = json_encode([
                        'username' => $admin_user,
                        'password' => $admin_pass, // در نسخه محصول هش می‌شود، برای تست سریع ساده نگه می‌داریم
                        'brand' => $brand_name,
                        'installed_at' => date('Y/m/d H:i:s')
                    ], JSON_UNESCAPED_UNICODE);
                    
                    $stmt_settings->execute(['admin_config', $admin_payload, $admin_payload]);
                    
                    // افزودن یک باشگاه (Tenant) به عنوان نمونه اولیه
                    $stmt_tenant = $test_pdo->prepare("INSERT INTO `tenants` (`id`, `name`, `ownerName`, `email`, `phone`, `status`, `planName`, `expiresAt`, `branchesCount`, `membersCount`, `monthlyRevenue`, `createdAt`, `username`, `password`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt_tenant->execute([
                        'oxigen',
                        $brand_name,
                        'مدیریت سیستم',
                        'info@smartgymsaas.ir',
                        '09120000000',
                        'ACTIVE',
                        'پلن المپیک (نامحدود)',
                        '1410/12/29',
                        3,
                        120,
                        45000000,
                        '1405/04/01',
                        $admin_user,
                        $admin_pass
                    ]);

                    // افزودن مربی نمونه
                    $stmt_coach = $test_pdo->prepare("INSERT INTO `coaches` (`id`, `name`, `username`, `password`, `specialty`, `clubId`) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt_coach->execute([
                        'c_1',
                        'استاد پوریا کریمی',
                        'pouria',
                        '123456',
                        'تغذیه و فیتنس تخصصی',
                        'oxigen'
                    ]);

                    // افزودن ورزشکار نمونه
                    $stmt_member = $test_pdo->prepare("INSERT INTO `members` (`id`, `name`, `username`, `password`, `phone`, `assignedProgramId`, `assignedNutritionId`, `remainingSessions`, `coachName`, `joinedDate`, `bmr`, `bmi`, `fatPercent`, `armSize`, `chestSize`, `waistSize`, `thighSize`, `notes`, `clubId`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt_member->execute([
                        'm_1',
                        'آرش احمدی',
                        'arash',
                        '123456',
                        '09121111111',
                        'prog_custom_1',
                        'nut_custom_1',
                        12,
                        'استاد پوریا کریمی',
                        '1405/04/01',
                        '۱۷۵۰ کالری',
                        '۲۲.۴ (نرمال)',
                        '۱۴.۵٪',
                        '۳۸',
                        '۱۰۵',
                        '۸۲',
                        '۵۸',
                        'ورزشکار بسیار منظم با هدف افزایش حجم عضلانی خالص.',
                        'oxigen'
                    ]);

                    // افزودن برنامه‌های تمرینی و غذایی پیش‌فرض
                    $stmt_prog = $test_pdo->prepare("INSERT INTO `workout_programs` (`id`, `title`, `summary`, `schedule`, `tips`, `clubId`) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt_prog->execute([
                        'prog_custom_1',
                        'برنامه حجم خشک سینه و سرشانه',
                        'برنامه تخصصی ۳ روز در هفته برای تمرکز بر بالاتنه و افزایش حجم باسن و سینه',
                        json_encode([
                            'شنبه' => ['پرس سینه دمبل ۴x۱۰', 'بالا سینه هالتر ۳x۱۲', 'قفسه سینه سیم‌کش ۳x۱۵'],
                            'دوشنبه' => ['پرس سرشانه دمبل ۴x۱۰', 'نشر جانب سیم‌کش ۳x۱۲', 'نشر خم دمبل ۳x۱۵'],
                            'چهارشنبه' => ['جلو بازو هالتر ۴x۱۰', 'پشت بازو طناب ۳x۱۲', 'شکم خلبانی ۳x۲۰']
                        ], JSON_UNESCAPED_UNICODE),
                        'حتماً بین ست‌ها ۶۰ ثانیه استراحت کرده و در روزهای استراحت پروتئین کافی مصرف کنید.',
                        'oxigen'
                    ]);

                    $stmt_nut = $test_pdo->prepare("INSERT INTO `nutrition_plans` (`id`, `targetCalories`, `macros`, `meals`, `shoppingList`, `advice`, `clubId`) VALUES (?, ?, ?, ?, ?, ?, ?)");
                    $stmt_nut->execute([
                        'nut_custom_1',
                        '۲۵۰۰ کالری',
                        'پروتئین: ۱۸۰g | کربوهیدرات: ۲۸۰g | چربی: ۷۰g',
                        json_encode([
                            'صبحانه' => '۵ عدد سفیده تخم مرغ + ۱ عدد کامل + ۷۰ گرم جو دوسر',
                            'میان‌وعده ۱' => '۱ عدد موز + ۳۰ گرم بادام درختی',
                            'ناهار' => '۲۰۰ گرم سینه مرغ گریل شده + ۱۵۰ گرم برنج کته قهوه‌ای + سالاد فصل',
                            'قبل تمرین' => '۱ فنجان قهوه اسپرسو + ۱ عدد سیب‌زمینی آب‌پز',
                            'شام' => '۱۵۰ گرم فیله ماهی یا بوقلمون + ۱۰۰ گرم سیب‌زمینی تنوری + کلم بروکلی بخارپز'
                        ], JSON_UNESCAPED_UNICODE),
                        'سینه مرغ، فیله ماهی، جو دوسر، بادام درختی، سیب‌زمینی، کاهو و روغن زیتون',
                        'روزانه حداقل ۳ لیتر آب بنوشید و از قندهای مصنوعی به طور کامل اجتناب کنید.',
                        'oxigen'
                    ]);
                }

                // هـ. تولید و بازنویسی فایل config_db.php
                $config_content = "<?php\n" .
                                  "/**\n" .
                                  " * 🏋️‍♂️ SmartGym Platform - Auto-Generated Database Configuration\n" .
                                  " * فایل تنظیمات اتصال به دیتابیس - تولید شده توسط Easy Installer\n" .
                                  " */\n\n" .
                                  "if (basename(\$_SERVER['PHP_SELF']) == 'config_db.php') {\n" .
                                  "    header(\"HTTP/1.1 403 Forbidden\");\n" .
                                  "    exit(\"دسترسی مستقیم مجاز نیست.\");\n" .
                                  "}\n\n" .
                                  "define('DB_HOST', " . var_export($db_host, true) . ");\n" .
                                  "define('DB_PORT', " . var_export($db_port, true) . ");\n" .
                                  "define('DB_USER', " . var_export($db_user, true) . ");\n" .
                                  "define('DB_PASS', " . var_export($db_pass, true) . ");\n" .
                                  "define('DB_NAME', " . var_export($db_name, true) . ");\n\n" .
                                  "try {\n" .
                                  "    \$pdo = new PDO(\n" .
                                  "        \"mysql:host=\" . DB_HOST . \";port=\" . DB_PORT . \";dbname=\" . DB_NAME . \";charset=utf8mb4\",\n" .
                                  "        DB_USER,\n" .
                                  "        DB_PASS,\n" .
                                  "        [\n" .
                                  "            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,\n" .
                                  "            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,\n" .
                                  "            PDO::ATTR_EMULATE_PREPARES   => false,\n" .
                                  "            PDO::MYSQL_ATTR_INIT_COMMAND => \"SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci\"\n" .
                                  "        ]\n" .
                                  "    );\n" .
                                  "} catch (PDOException \$e) {\n" .
                                  "    \$db_connection_error = \$e->getMessage();\n" .
                                  "}\n";

                if (file_put_contents($config_file, $config_content) === false) {
                    throw new Exception("خطا در بازنویسی فایل تنظیمات دیتابیس (config_db.php). لطفاً سطح دسترسی (Permission) نوشتن فایل را در هاست خود بررسی کنید.");
                }

                // و. ایجاد فایل قفل نصب‌کننده
                file_put_contents($lock_file, json_encode([
                    'installed_at' => date('Y-m-d H:i:s'),
                    'db_name' => $db_name,
                    'db_user' => $db_user
                ]));

                header("Location: ?step=3");
                exit();

            } catch (Exception $e) {
                $error = 'خطا در فرآیند نصب: ' . $e->getMessage();
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>جادوگر نصب آسان اسمارت‌جیم | SmartGym Easy Installer 🪄</title>
    <!-- استفاده از فریم‌ورک محبوب و مدرن تایلوند سی‌اس‌اس -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Vazirmatn', sans-serif;
            background: radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%);
        }
    </style>
</head>
<body class="min-h-screen text-slate-100 flex items-center justify-center p-4">

    <div class="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        
        <!-- انیمیشن نور پس‌زمینه کارت -->
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- هدر لوگو و عنوان پلتفرم -->
        <div class="text-center mb-8 relative">
            <div class="inline-flex p-4 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 font-black text-3xl shadow-xl mb-4 animate-bounce">
                🏋️‍♂️ SMARTGYM
            </div>
            <h1 class="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                جادوگر نصب آسان و خودکار اسمارت‌جیم
            </h1>
            <p class="text-xs text-slate-400 mt-2">نصب هوشمند پایگاه داده MySQL و پیکربندی فایل اتصال به سی‌پنل</p>
        </div>

        <?php if ($step === 'locked'): ?>
            <!-- صفحه قفل نصب‌کننده -->
            <div class="bg-slate-950/60 p-6 rounded-2xl border border-white/5 space-y-4 text-center">
                <div class="text-5xl">🔒</div>
                <h2 class="text-xl font-bold text-red-400">سیستم نصب‌کننده در حال حاضر قفل است!</h2>
                <p class="text-xs text-slate-300 leading-relaxed">
                    پلتفرم اسمارت‌جیم قبلاً با موفقیت روی این هاست نصب و راه‌اندازی شده است. جهت جلوگیری از بازنویسی اشتباه دیتابیس و تخریب داده‌ها، دسترسی به جادوگر نصب متوقف شده است.
                </p>
                <div class="p-3 bg-red-950/20 rounded-xl text-[11px] text-slate-400 leading-normal border border-red-500/10 text-right">
                    <strong>💡 راهنمای نصب مجدد:</strong> در صورتی که تمایل دارید دیتابیس را مجدداً نصب کنید، از بخش File Manager در سی‌پنل خود وارد پوشه اصلی برنامه شده و فایل <code class="bg-slate-900 px-1 py-0.5 rounded text-red-300">install.lock</code> را حذف کرده و مجددا این صفحه را بازخوانی (Refresh) کنید.
                </div>
                <div class="pt-4">
                    <a href="index.html" class="inline-block px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all shadow-md">
                        بازگشت به صفحه اصلی پلتفرم 🏠
                    </a>
                </div>
            </div>

        <?php elseif ($step === 1): ?>
            <!-- گام اول: ورود اطلاعات و پیکربندی -->
            <form method="POST" action="?step=2" class="space-y-6">
                <input type="hidden" name="action" value="install">

                <?php if (!empty($error)): ?>
                    <div class="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-xs text-red-400 leading-relaxed text-right">
                        ⚠️ <strong>خطا در نصب:</strong> <?php echo htmlspecialchars($error); ?>
                    </div>
                <?php endif; ?>

                <!-- بخش اول: دیتابیس مای‌اس‌کیوال -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2 border-b border-white/5 pb-2">
                        <span class="text-emerald-400">🗄️</span>
                        <h3 class="text-sm font-bold text-slate-200">مشخصات پایگاه داده MySQL سی‌پنل</h3>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                        <div class="space-y-1.5">
                            <label class="block text-xs font-medium text-slate-400">آدرس هاست دیتابیس</label>
                            <input type="text" name="db_host" value="localhost" placeholder="localhost" required
                                   class="w-full bg-slate-950 border border-white/10 px-3 py-2.5 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500 text-left" dir="ltr">
                        </div>
                        <div class="space-y-1.5">
                            <label class="block text-xs font-medium text-slate-400">پورت دیتابیس</label>
                            <input type="text" name="db_port" value="3306" placeholder="3306" required
                                   class="w-full bg-slate-950 border border-white/10 px-3 py-2.5 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500 text-left" dir="ltr">
                        </div>
                        <div class="space-y-1.5">
                            <label class="block text-xs font-medium text-slate-400">نام دیتابیس</label>
                            <input type="text" name="db_name" value="smartgym_db" placeholder="مثال: mygym_db" required
                                   class="w-full bg-slate-950 border border-white/10 px-3 py-2.5 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500 text-left" dir="ltr">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                        <div class="space-y-1.5">
                            <label class="block text-xs font-medium text-slate-400">نام کاربری دیتابیس</label>
                            <input type="text" name="db_user" value="root" placeholder="مثال: mygym_user" required
                                   class="w-full bg-slate-950 border border-white/10 px-3 py-2.5 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500 text-left" dir="ltr">
                        </div>
                        <div class="space-y-1.5">
                            <label class="block text-xs font-medium text-slate-400">رمز عبور دیتابیس</label>
                            <input type="password" name="db_pass" placeholder="پسورد کاربر دیتابیس"
                                   class="w-full bg-slate-950 border border-white/10 px-3 py-2.5 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500 text-left" dir="ltr">
                        </div>
                    </div>
                </div>

                <!-- بخش دوم: سوپر ادمین و برندینگ -->
                <div class="space-y-4 pt-4">
                    <div class="flex items-center gap-2 border-b border-white/5 pb-2">
                        <span class="text-emerald-400">👑</span>
                        <h3 class="text-sm font-bold text-slate-200">تنظیمات حساب سوپر ادمین کل سیستم</h3>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                        <div class="space-y-1.5">
                            <label class="block text-xs font-medium text-slate-400">نام کاربری ادمین</label>
                            <input type="text" name="admin_user" value="admin" required
                                   class="w-full bg-slate-950 border border-white/10 px-3 py-2.5 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500 text-left font-bold" dir="ltr">
                        </div>
                        <div class="space-y-1.5">
                            <label class="block text-xs font-medium text-slate-400">رمز عبور ادمین</label>
                            <input type="text" name="admin_pass" value="admin123" required
                                   class="w-full bg-slate-950 border border-white/10 px-3 py-2.5 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500 text-left font-bold" dir="ltr">
                        </div>
                        <div class="space-y-1.5 col-span-1">
                            <label class="block text-xs font-medium text-slate-400">نام برند / مجموعه ورزشی اصلی</label>
                            <input type="text" name="brand_name" value="مجموعه ورزشی مدرن اسمارت‌جیم" required
                                   class="w-full bg-slate-950 border border-white/10 px-3 py-2.5 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-bold">
                        </div>
                    </div>
                </div>

                <!-- بخش چک‌باکس داده‌های نمونه -->
                <div class="p-4 bg-slate-950/40 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div class="text-right">
                        <span class="font-bold text-xs text-slate-200 block">انتقال داده‌های دمو و تست اولیه پلتفرم</span>
                        <span class="text-[10px] text-slate-400 block mt-0.5">درج خودکار مربی، ورزشکار، برنامه‌های غذایی و ورزشی برای تست سریع</span>
                    </div>
                    <div>
                        <input type="checkbox" name="import_seed" checked class="w-5 h-5 accent-emerald-500 rounded-lg cursor-pointer">
                    </div>
                </div>

                <!-- دکمه استارت نصب خودکار -->
                <button type="submit" class="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                    <span>تست اتصال و ساخت خودکار جدول‌ها</span>
                    <span class="text-lg">🪄</span>
                </button>
            </form>

        <?php elseif ($step === 3): ?>
            <!-- گام سوم: اتمام موفقیت‌آمیز نصب -->
            <div class="space-y-6 text-center animate-fade-in">
                <div class="inline-flex p-5 rounded-full bg-emerald-500/10 text-emerald-400 text-5xl mb-2 animate-bounce">
                    🎉
                </div>
                
                <h2 class="text-2xl font-black text-emerald-400">نصب پلتفرم با موفقیت به پایان رسید!</h2>
                
                <p class="text-xs text-slate-300 leading-relaxed max-w-lg mx-auto">
                    پایگاه داده مای‌اس‌کیوال با موفقیت همگام‌سازی شد و تمامی جدول‌های مدیریتی، ورزشی و برندینگ اختصاصی شما بر روی هاست سی‌پنل تعریف شدند. همچنین فایل اتصال <code class="bg-slate-950 px-1.5 py-1.5 rounded text-emerald-300">config_db.php</code> بازنویسی و قفل گردید.
                </p>

                <!-- باکس خلاصه لاگین ادمین -->
                <div class="bg-slate-950/60 rounded-2xl border border-white/5 p-4 text-right max-w-md mx-auto space-y-3">
                    <span class="text-xs font-bold text-emerald-400 block border-b border-white/5 pb-2">🔑 اطلاعات حساب کاربری مدیریت کل:</span>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-400">آدرس پنل مدیریت:</span>
                        <span class="font-bold text-slate-200 font-mono">index.html</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-400">نام کاربری ادمین:</span>
                        <span class="font-bold text-emerald-400 font-mono">admin</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-400">رمز عبور ادمین:</span>
                        <span class="font-bold text-emerald-400 font-mono">admin123</span>
                    </div>
                </div>

                <div class="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                    <a href="index.html" class="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold hover:brightness-110 transition-all shadow-md">
                        ورود به پنل پلتفرم (پورتال هوشمند) 🏠
                    </a>
                </div>
            </div>
        <?php endif; ?>

        <!-- فوتر کپی رایت -->
        <div class="mt-8 pt-4 border-t border-white/5 text-center text-[10px] text-slate-500">
            SmartGym SaaS Engine • 2026 Powered by Node.js & PHP Secure Installer
        </div>

    </div>

</body>
</html>

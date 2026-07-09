<?php
/**
 * 🏋️‍♂️ SmartGym Platform - Database Configuration File
 * فایل تنظیمات اتصال به پایگاه داده مای‌اس‌کیوال (MySQL) اسمارت‌جیم
 */

// جلوگیری از دسترسی مستقیم در صورتی که فایل مستقیماً فراخوانی شود
if (basename($_SERVER['PHP_SELF']) == 'config_db.php') {
    header("HTTP/1.1 403 Forbidden");
    exit("دسترسی مستقیم مجاز نیست.");
}

// اطلاعات اتصال به پایگاه داده (توسط Easy Installer پر خواهد شد)
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'smartgym_db');

try {
    // ایجاد اتصال ایمن PDO با پشتیبانی کامل از UTF-8
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ]
    );
} catch (PDOException $e) {
    // در این مرحله خطا را ثبت می‌کنیم اما کل برنامه را قطع نمی‌کنیم تا نصب‌کننده بتواند کار کند
    $db_connection_error = $e->getMessage();
}

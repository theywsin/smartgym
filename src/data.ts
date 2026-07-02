import { 
  Exercise, 
  SubscriptionPlan, 
  Tenant, 
  WorkoutProgram, 
  NutritionPlan, 
  AttendanceRecord, 
  Invoice, 
  Booking, 
  Ticket, 
  AuditLog, 
  StoreProduct 
} from "./types";

// 1. Comprehensive Gym Exercises Library (In Persian with correct / wrong form guides)
export const EXERCISES: Exercise[] = [
  {
    id: "ex_1",
    name: "پرس سینه هالتر",
    category: "تمرینات با وزنه",
    muscleGroup: "سینه (Chest)",
    equipment: "هالتر و میز پرس",
    difficulty: "INTERMEDIATE",
    animationType: "LOTTIE",
    highlightMuscles: ["سینه بزرگ", "پشت بازو", "دلتوئید قدامی"],
    correctForm: "روی تخت دراز بکشید، هالتر را کمی بیشتر از عرض شانه بگیرید. هالتر را تا بالای سینه پایین بیاورید و سپس با تمرکز روی عضلات سینه به بالا پرس کنید.",
    wrongForm: "قوس دادن بیش از حد به کمر، قفل کردن ناگهانی آرنج‌ها در بالا، یا برخورد شدید هالتر به قفسه سینه.",
    warning: "در صورتی که وزنه سنگین انتخاب می‌کنید، حتماً از یک یار کمکی استفاده کنید."
  },
  {
    id: "ex_2",
    name: "اسکوات هالتر",
    category: "تمرینات با وزنه",
    muscleGroup: "چهارسر ران (Quads)",
    equipment: "هالتر و رک اسکوات",
    difficulty: "INTERMEDIATE",
    animationType: "GIF",
    highlightMuscles: ["چهارسر ران", "سرینی بزرگ", "همسترینگ", "فیله کمر"],
    correctForm: "هالتر را روی عضلات ذوزنقه‌ای کول قرار دهید. پاها به عرض شانه باز شوند. با عقب بردن باسن مانند نشستن روی صندلی تا جایی پایین بروید که ران‌ها موازی زمین شوند، سپس بالا بیایید.",
    wrongForm: "خم شدن بیش از حد به جلو، متمایل شدن زانوها به سمت داخل، یا گرد شدن ستون فقرات.",
    warning: "افرادی که سابقه زانودرد یا دیسک کمر دارند باید با وزنه سبک یا تحت نظارت انجام دهند."
  },
  {
    id: "ex_3",
    name: "جلو بازو دمبل متناوب",
    category: "تمرینات با وزنه",
    muscleGroup: "جلو بازو (Biceps)",
    equipment: "دمبل",
    difficulty: "BEGINNER",
    animationType: "3D",
    highlightMuscles: ["دوسر بازویی", "ساعد"],
    correctForm: "ایستاده و با هر دست یک دمبل بگیرید. آرنج‌ها را به بدن بچسبانید. یکی پس از دیگری دمبل‌ها را با چرخاندن مچ دست به سمت بالا بیاورید و در بالا انقباض ایجاد کنید.",
    wrongForm: "تاب دادن به بدن و استفاده از نیروی گشتاور، حرکت دادن بیش از حد آرنج‌ها به جلو.",
    warning: "برای پیشگیری از آسیب کمر، از وزنه‌های مناسب که کنترل کامل روی آن‌ها دارید استفاده کنید."
  },
  {
    id: "ex_4",
    name: "پشت بازو سیم‌کش با طناب",
    category: "سیم‌کش",
    muscleGroup: "پشت بازو (Triceps)",
    equipment: "دستگاه کراس‌اور / سیم‌کش",
    difficulty: "BEGINNER",
    animationType: "LOTTIE",
    highlightMuscles: ["سه سر بازویی (پشت بازو)"],
    correctForm: "روبروی دستگاه بایستید، طناب را بگیرید و مایل به جلو خم شوید. آرنج‌ها را ثابت نگه دارید و طناب را تا انتهای مسیر به سمت پایین فشار دهید و باز کنید.",
    wrongForm: "فاصله گرفتن آرنج‌ها از تنه، خم شدن بیش از حد با استفاده از وزن بدن روی طناب.",
    warning: "در انتهای حرکت مچ‌ها را به طرفین بکشید تا انقباض نهایی پشت بازو بیشتر شود."
  },
  {
    id: "ex_5",
    name: "زیربغل سیم‌کش از جلو (لات پول‌داون)",
    category: "سیم‌کش",
    muscleGroup: "زیربغل و پشت (Back)",
    equipment: "دستگاه لات پول‌داون",
    difficulty: "BEGINNER",
    animationType: "LOTTIE",
    highlightMuscles: ["عضله پشتی بزرگ (لات)", "بخش پشتی سرشانه", "جلو بازو"],
    correctForm: "روی صندلی مستقر شوید، میله را با دست‌های باز بگیرید. قفسه سینه را بالا نگه دارید و میله را تا بالای سینه پایین بکشید در حالی که آرنج‌ها را به سمت عقب و پایین هدایت می‌کنید.",
    wrongForm: "عقب رفتن شدید تنه و خوابیدن روی صندلی، کشیدن میله با قدرت مچ دست به جای عضلات پشت.",
    warning: "میله را به پشت گردن نکشید زیرا فشار مخربی به مفصل سرشانه وارد می‌کند."
  },
  {
    id: "ex_6",
    name: "نشر جانب دمبل",
    category: "تمرینات با وزنه",
    muscleGroup: "سرشانه (Shoulders)",
    equipment: "دمبل",
    difficulty: "INTERMEDIATE",
    animationType: "GIF",
    highlightMuscles: ["دلتوئید میانی (بخش جانبی سرشانه)"],
    correctForm: "ایستاده، دمبل‌ها را کنار بدن نگه دارید. با تمرکز بر عضلات سرشانه، دمبل‌ها را به طرفین بالا ببرید تا دست‌ها موازی با زمین شوند. آرنج‌ها باید کمی خم باشند.",
    wrongForm: "بالا بردن دمبل‌ها بالاتر از خط شانه، بالا انداختن کول و گردن، یا پرتاب کردن وزنه با تنه.",
    warning: "استفاده از وزنه فوق‌العاده سنگین در این حرکت منشاء شایع التهاب تاندون شانه است."
  },
  {
    id: "ex_7",
    name: "پلانک ایستا",
    category: "شکم و فیله",
    muscleGroup: "هسته بدن (Core)",
    equipment: "مت یوگا",
    difficulty: "BEGINNER",
    animationType: "3D",
    highlightMuscles: ["راست شکمی", "مورب شکمی", "فیله کمر", "چهارسر ران"],
    correctForm: "ساعدها را روی زمین قرار داده و بدن را در یک خط مستقیم مانند چوب نگه دارید. شکم را منقبض کرده و باسن را نه خیلی بالا و نه خیلی پایین نگه دارید.",
    wrongForm: "افتادن باسن به سمت زمین، بالا گرفتن باسن، یا نگاه کردن به جلو که باعث فشار به گردن می‌شود.",
    warning: "در طول حرکت به طور منظم نفس بکشید و نفس خود را حبس نکنید."
  },
  {
    id: "ex_8",
    name: "پرس بالا سینه دمبل",
    category: "تمرینات با وزنه",
    muscleGroup: "سینه (Chest)",
    equipment: "میز بالاسینه و دمبل",
    difficulty: "INTERMEDIATE",
    animationType: "3D",
    highlightMuscles: ["بخش بالایی سینه (ترقوه‌ای)", "پشت بازو", "دلتوئید قدامی"],
    correctForm: "روی میز با شیب ۳۰ تا ۴۵ درجه بنشینید. دمبل‌ها را در سطح شانه نگه دارید و به آرامی بالا ببرید تا دست‌ها صاف شوند، سپس با تمرکز پایین بیاورید.",
    wrongForm: "استفاده از شیب زیاد (بیش از ۴۵ درجه) که فشار را به سرشانه منتقل می‌کند، یا برخورد دادن تند دمبل‌ها در بالا.",
    warning: "شیب مبل را دقیق تنظیم کنید تا فشار به بالای سینه وارد شود نه سرشانه جلویی."
  },
  {
    id: "ex_9",
    name: "قفسه سینه دمبل (فلای)",
    category: "تمرینات با وزنه",
    muscleGroup: "سینه (Chest)",
    equipment: "دمبل و میز پرس",
    difficulty: "INTERMEDIATE",
    animationType: "GIF",
    highlightMuscles: ["سینه بزرگ (بخش بیرونی و داخلی)"],
    correctForm: "روی تخت دراز بکشید، دمبل‌ها را بالای سینه نگه دارید. با ایجاد یک قوس ملایم در آرنج، دست‌ها را به طرفین باز کنید تا کشش کامل در سینه احساس شود، سپس به بالا هدایت کنید.",
    wrongForm: "صاف کردن کامل دست‌ها در طول حرکت، پایین بردن بیش از حد دمبل‌ها که باعث کشیدگی تاندون شانه می‌شود.",
    warning: "این حرکت کششی است و نیاز به تمرکز روی انقباض دارد، نه انتخاب وزنه‌های رکوردشکن."
  },
  {
    id: "ex_10",
    name: "ددلیفت هالتر رومانیایی",
    category: "تمرینات با وزنه",
    muscleGroup: "پشت ران (Hamstrings)",
    equipment: "هالتر",
    difficulty: "ADVANCED",
    animationType: "3D",
    highlightMuscles: ["همسترینگ (پشت ران)", "سرینی بزرگ (باسن)", "فیله کمر"],
    correctForm: "صاف بایستید و هالتر را در دست بگیرید. زانوها را بسیار کم خم کنید. با عقب دادن باسن و خم کردن بالاتنه، هالتر را نزدیک به ساق پا پایین ببرید و با فشار باسن و پشت ران بالا بیایید.",
    wrongForm: "گرد کردن ستون فقرات یا خم کردن زیاد زانوها (تبدیل حرکت به اسکوات).",
    warning: "حفظ صافی کمر در این حرکت برای جلوگیری از فتق دیسک بسیار حیاتی است."
  },
  {
    id: "ex_11",
    name: "زیربغل هالتر خم",
    category: "تمرینات با وزنه",
    muscleGroup: "زیربغل و پشت (Back)",
    equipment: "هالتر",
    difficulty: "ADVANCED",
    animationType: "3D",
    highlightMuscles: ["پشتی بزرگ", "ذوزنقه‌ای (کول)", "بخش پشتی سرشانه", "جلو بازو"],
    correctForm: "زانوها را کمی خم کرده و تنه را حدود ۴۵ درجه به جلو متمایل کنید. هالتر را با دست‌های رو به پایین بگیرید و آن را به سمت زیر شکم بکشید، در حالی که آرنج‌ها را نزدیک بدن نگه می‌دارید.",
    wrongForm: "گرد کردن کمر یا تکان دادن شدید تنه به بالا و پایین برای تقلب در کشیدن وزنه.",
    warning: "کمر خود را کاملاً صاف و عضلات فیله را منقبض نگه دارید."
  },
  {
    id: "ex_12",
    name: "قایقی سیم‌کش",
    category: "سیم‌کش",
    muscleGroup: "زیربغل و پشت (Back)",
    equipment: "دستگاه قایقی سیم‌کش",
    difficulty: "BEGINNER",
    animationType: "LOTTIE",
    highlightMuscles: ["بخش میانی پشت", "ذوزنقه‌ای", "پشتی بزرگ", "گرد بزرگ"],
    correctForm: "روی صندلی بنشینید، پاها را به تکیه‌گاه بزنید و دستگیره دوبل را بگیرید. ستون فقرات را صاف نگه دارید. دستگیره را تا نزدیکی زیر شکم بکشید و شانه‌ها را به عقب منقبض کنید.",
    wrongForm: "تاب خوردن زیاد بالاتنه به جلو و عقب، یا کشیدن دستگیره با مچ دست.",
    warning: "در نقطه انتهایی حرکت، کتف‌های خود را به هم نزدیک کرده و یک ثانیه مکث کنید."
  },
  {
    id: "ex_13",
    name: "بارفیکس دست باز",
    category: "تمرینات با وزن بدن",
    muscleGroup: "زیربغل و پشت (Back)",
    equipment: "میله بارفیکس",
    difficulty: "ADVANCED",
    animationType: "3D",
    highlightMuscles: ["پشتی بزرگ (لات)", "بخش بیرونی پشت", "جلو بازو"],
    correctForm: "میله بارفیکس را عریض‌تر از عرض شانه‌ها بگیرید. با تکیه بر عضلات زیربغل، خود را به سمت بالا بکشید تا چانه بالاتر از میله قرار گیرد، سپس به آرامی پایین بیایید.",
    wrongForm: "استفاده از ضربه پا یا بدن برای بالا کشیدن، نیمه کاره رها کردن دامنه حرکت.",
    warning: "اگر توانایی اجرای بارفیکس کامل را ندارید، از کش‌های کمکی (پاورباند) استفاده کنید."
  },
  {
    id: "ex_14",
    name: "پرس سرشانه دمبل",
    category: "تمرینات با وزنه",
    muscleGroup: "سرشانه (Shoulders)",
    equipment: "دمبل و میز تکیه‌گاه‌دار",
    difficulty: "BEGINNER",
    animationType: "LOTTIE",
    highlightMuscles: ["دلتوئید قدامی (جلویی)", "دلتوئید جانبی", "سه سر بازویی"],
    correctForm: "روی صندلی با تکیه‌گاه عمودی بنشینید. دمبل‌ها را کنار گوش‌ها با آرنج‌های ۹۰ درجه نگه دارید. با تمرکز روی سرشانه دمبل‌ها را به بالا پرس کنید تا دست‌ها صاف شوند.",
    wrongForm: "قوس دادن شدید به کمر یا برخورد دادن دمبل‌ها به همدیگر در بالای حرکت.",
    warning: "تکیه‌گاه صندلی را به خوبی تنظیم کنید تا کمر تکیه داشته باشد."
  },
  {
    id: "ex_15",
    name: "نشر خم دمبل",
    category: "تمرینات با وزنه",
    muscleGroup: "سرشانه (Shoulders)",
    equipment: "دمبل",
    difficulty: "INTERMEDIATE",
    animationType: "GIF",
    highlightMuscles: ["دلتوئید خلفی (بخش پشتی سرشانه)"],
    correctForm: "از کمر به جلو خم شوید تا بالاتنه تقریباً موازی زمین شود. دمبل‌ها را آویزان نگه دارید و با آرنج‌های بسیار کم خم، دمبل‌ها را به طرفین بالا بکشید.",
    wrongForm: "تاب دادن دمبل‌ها، بالا گرفتن سر که باعث فشار به مهره‌های گردن می‌شود.",
    warning: "نگاه خود را در طول حرکت به زمین نگه دارید تا مهره‌های گردن در یک راستا باشند."
  },
  {
    id: "ex_16",
    name: "کول هالتر ایستاده",
    category: "تمرینات با وزنه",
    muscleGroup: "سرشانه (Shoulders)",
    equipment: "هالتر",
    difficulty: "INTERMEDIATE",
    animationType: "3D",
    highlightMuscles: ["عضله ذوزنقه‌ای (کول)", "دلتوئید قدامی"],
    correctForm: "ایستاده، هالتر را با دست‌های نزدیک به هم بگیرید. میله را مماس با بدن تا زیر چانه بالا بکشید به طوری که آرنج‌ها همیشه بالاتر از مچ‌ها قرار گیرند.",
    wrongForm: "خم شدن به عقب یا کشیدن هالتر با ضربه تنه.",
    warning: "اگر دچار مچ‌درد یا شانه درد هستید، این حرکت را با دمبل یا به صورت نشر جانب جایگزین کنید."
  },
  {
    id: "ex_17",
    name: "پشت بازو دیپ بین دو میز",
    category: "تمرینات با وزن بدن",
    muscleGroup: "پشت بازو (Triceps)",
    equipment: "دو عدد میز صاف",
    difficulty: "BEGINNER",
    animationType: "GIF",
    highlightMuscles: ["سه سر بازویی (پشت بازو)", "بخش پایینی سینه"],
    correctForm: "دست‌ها را روی لبه یک میز قرار داده و پاشنه پاها را روی میز روبه‌رو بگذارید. با خم کردن آرنج‌ها باسن را پایین ببرید تا زاویه ۹۰ درجه در آرنج تشکیل شود، سپس خود را بالا بکشید.",
    wrongForm: "دور کردن باسن از میز پشتی که باعث فشار مخرب روی مفصل شانه می‌شود.",
    warning: "در صورت نیاز به شدت بیشتر، می‌توانید صفحه‌ای را روی ران‌های خود قرار دهید."
  },
  {
    id: "ex_18",
    name: "پشت بازو دمبل تک جفت دست سوئدی",
    category: "تمرینات با وزنه",
    muscleGroup: "پشت بازو (Triceps)",
    equipment: "دمبل و میز بنچ",
    difficulty: "BEGINNER",
    animationType: "3D",
    highlightMuscles: ["سه سر بازویی (بخش پشتی بازو)"],
    correctForm: "روی صندلی بنشینید، یک دمبل را با هر دو دست گرفته و بالای سر ببرید. بدون حرکت دادن آرنج‌ها، دمبل را پشت سر پایین ببرید تا ساعدها با بازوها مماس شوند، سپس به بالا پرس کنید.",
    wrongForm: "باز شدن آرنج‌ها به طرفین یا حرکت دادن بازو به جلو و عقب.",
    warning: "آرنج‌ها را حتماً نزدیک به گوش‌ها نگه دارید تا بیشترین فشار روی عضلات پشت بازو وارد شود."
  },
  {
    id: "ex_19",
    name: "جلو بازو هالتر ایستاده (میله EZ)",
    category: "تمرینات با وزنه",
    muscleGroup: "جلو بازو (Biceps)",
    equipment: "هالتر خمیده EZ",
    difficulty: "BEGINNER",
    animationType: "LOTTIE",
    highlightMuscles: ["دوسر بازویی (بخش بیرونی و داخلی)"],
    correctForm: "ایستاده، میله خمیده را از بخش زاویه‌دار بگیرید. آرنج‌ها را به بدن بچسبانید. هالتر را با کنترل تا زیر سینه بالا بیاورید و سپس با کنترل پایین ببرید.",
    wrongForm: "عقب و جلو بردن آرنج‌ها یا خم شدن کمر به عقب برای بلند کردن وزنه.",
    warning: "استفاده از میله EZ فشار را روی تاندون‌های مچ دست به شدت کاهش می‌دهد."
  },
  {
    id: "ex_20",
    name: "جلو بازو دمبل چکشی",
    category: "تمرینات با وزنه",
    muscleGroup: "جلو بازو (Biceps)",
    equipment: "دمبل",
    difficulty: "BEGINNER",
    animationType: "GIF",
    highlightMuscles: ["عضله بازویی‌زندزبرینی (برکیورادیالیس)", "دوسر بازویی", "ساعد"],
    correctForm: "ایستاده، دمبل‌ها را طوری در دست بگیرید که کف دست‌ها رو به یکدیگر باشند (مچ عمودی). بدون چرخاندن مچ، دمبل‌ها را تا بالا هدایت کنید.",
    wrongForm: "چرخاندن مچ حین حرکت، حرکت دادن آرنج‌ها به جلو و عقب.",
    warning: "این حرکت برای ایجاد ضخامت و پهنای بازو از نمای روبه‌رو بسیار عالی است."
  },
  {
    id: "ex_21",
    name: "جلو ران دستگاه (لگ اکستنشن)",
    category: "دستگاه بدنسازی",
    muscleGroup: "چهارسر ران (Quads)",
    equipment: "دستگاه جلو ران",
    difficulty: "BEGINNER",
    animationType: "LOTTIE",
    highlightMuscles: ["چهارسر ران (بخش جلویی ران)"],
    correctForm: "روی صندلی دستگاه مستقر شوید. غلتک را روی مچ پا تنظیم کنید. با انقباض عضلات ران، پاها را کاملاً صاف کنید، یک ثانیه مکث کرده و به آرامی پایین بیاورید.",
    wrongForm: "پرتاب کردن ناگهانی وزنه به بالا، تنظیم نادرست پشتی صندلی به طوری که زانوها جلوتر یا عقب‌تر از محور چرخش باشند.",
    warning: "در بالاترین نقطه زانوها را قفل ضربه‌ای نکنید."
  },
  {
    id: "ex_22",
    name: "پشت ران دستگاه خوابیده",
    category: "دستگاه بدنسازی",
    muscleGroup: "پشت ران (Hamstrings)",
    equipment: "دستگاه پشت ران خوابیده",
    difficulty: "BEGINNER",
    animationType: "LOTTIE",
    highlightMuscles: ["همسترینگ (عضلات پشت ران)"],
    correctForm: "روی دستگاه به شکم دراز بکشید به طوری که زانوها خارج از لبه بالشتک باشند. غلتک را پشت مچ پا قرار دهید. غلتک را تا نزدیکی باسن بالا بکشید و با کنترل باز کنید.",
    wrongForm: "بلند شدن باسن از روی نیمکت حین جمع کردن پاها، یا باز کردن ناگهانی و رها کردن وزنه.",
    warning: "باسن را کاملاً چسبیده به دستگاه نگه دارید تا فشار روی همسترینگ متمرکز بماند."
  },
  {
    id: "ex_23",
    name: "ساق پا ایستاده دستگاه",
    category: "دستگاه بدنسازی",
    muscleGroup: "ساق پا (Calves)",
    equipment: "دستگاه ساق پا ایستاده",
    difficulty: "BEGINNER",
    animationType: "GIF",
    highlightMuscles: ["دوقلو ساق پا", "نعلی ساق پا"],
    correctForm: "پنجه پاها را روی لبه پلتفرم قرار دهید، شانه‌ها را زیر بالشتک بگذارید. پاشنه پاها را تا جای ممکن پایین ببرید تا کشش کامل ایجاد شود، سپس روی پنجه‌ها بلند شوید.",
    wrongForm: "استفاده از زانوها برای بالا راندن وزنه (خم و راست کردن زانو حین ساق زدن).",
    warning: "دامنه حرکتی ساق باید بسیار کامل باشد؛ کشش عمیق در پایین و انقباض شدید در بالا."
  },
  {
    id: "ex_24",
    name: "کرانچ شکم روی مت",
    category: "شکم و فیله",
    muscleGroup: "شکم (Abs)",
    equipment: "مت یوگا",
    difficulty: "BEGINNER",
    animationType: "3D",
    highlightMuscles: ["بخش فوقانی راست شکمی (شکم)"],
    correctForm: "به پشت دراز بکشید، زانوها را خم کنید و کف پاها روی زمین باشد. دست‌ها را پشت گوش قرار دهید. با منقبض کردن شکم، شانه را چند سانتی‌متر از زمین بلند کنید و دوباره بخوابید.",
    wrongForm: "کشیدن گردن با دست‌ها حین بالا آمدن که منجر به آسیب شدید گردن می‌شود.",
    warning: "تصور کنید پرتقالی بین چانه و قفسه سینه شما قرار دارد و گردن را خم نکنید."
  },
  {
    id: "ex_25",
    name: "زیر شکم خلبانی (پارالل)",
    category: "تمرینات با وزن بدن",
    muscleGroup: "شکم (Abs)",
    equipment: "دستگاه پارالل / ایستگاه خلبانی",
    difficulty: "INTERMEDIATE",
    animationType: "LOTTIE",
    highlightMuscles: ["بخش پایینی شکم", "عضلات خم‌کننده ران"],
    correctForm: "ساعدها را روی پد دستگاه قرار داده و کمر را به پشتی بچسبانید. با کنترل کامل و بدون تاب خوردن، زانوها را خم کرده و تا قفسه سینه بالا بکشید، سپس به آرامی پایین ببرید.",
    wrongForm: "تاب خوردن تنه و استفاده از نیروی گشتاور پاها برای بالا بردن پاها.",
    warning: "در طول کل حرکت کمر باید به تکیه‌گاه چسبیده باشد."
  },
  {
    id: "ex_26",
    name: "فیله کمر روی دستگاه ۴5 درجه",
    category: "شکم و فیله",
    muscleGroup: "فیله کمر (Lower Back)",
    equipment: "دستگاه فیله کمر ۴۵ درجه",
    difficulty: "BEGINNER",
    animationType: "LOTTIE",
    highlightMuscles: ["فیله کمر (راست‌کننده ستون فقرات)", "سرینی بزرگ"],
    correctForm: "پاها را در محل دستگاه فیکس کنید، ران‌ها را روی تشکچه قرار دهید. بالاتنه را تا زاویه ۹۰ درجه نسبت به ران‌ها پایین ببرید، سپس با کنترل تا جایی بالا بیایید که بدن در یک خط مستقیم قرار گیرد.",
    wrongForm: "هایپراکستنشن یا خم شدن بیش از حد به عقب در بالاترین نقطه حرکت که دیسک کمر را تحت فشار شدید قرار می‌دهد.",
    warning: "دست‌های خود را به صورت ضربدری روی سینه نگه دارید یا وزنه‌ای سبک در آغوش بگیرید."
  }
];

// 2. Super Admin Subscription Plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "sub_1",
    name: "پلن پایه (برنزی)",
    durationMonths: 1,
    priceIrr: 9500000,
    priceToman: 950000,
    features: [
      "مدیریت تک شعبه باشگاه",
      "ثبت نام تا حداکثر ۱۰۰ ورزشکار فعال",
      "پنل اختصاصی مربی و شاگرد",
      "سیستم هوشمند حضور و غیاب با QR Code",
      "گزارش‌های پایه حسابداری (درآمد و هزینه)",
      "پشتیبانی تیکتی و آنلاین (ساعات کاری)",
      "اپلیکیشن تحت وب PWA"
    ]
  },
  {
    id: "sub_2",
    name: "پلن حرفه‌ای (نقره‌ای)",
    durationMonths: 6,
    priceIrr: 49000000,
    priceToman: 4900000,
    features: [
      "مدیریت تا ۳ شعبه به صورت همزمان",
      "ثبت نام نامحدود ورزشکار فعال",
      "دستیار هوشمند هوش مصنوعی (طراحی برنامه)",
      "امکان وایت‌لیبل (لوگو و تم اختصاصی)",
      "سیستم پیشرفته حقوق و دستمزد و حسابداری",
      "فروشگاه مکمل و بوفه با بارکدخوان",
      "پشتیبانی تلفنی و تلگرامی ۲۴ ساعته اختصاصی",
      "ماژول پیشرفته آنالیز بدنی و نمودارهای پیشرفت"
    ],
    isPopular: true
  },
  {
    id: "sub_3",
    name: "پلن سازمانی / زنجیره‌ای (طلایی)",
    durationMonths: 12,
    priceIrr: 89000000,
    priceToman: 8900000,
    features: [
      "مدیریت بی‌نهایت شعبه در سراسر کشور",
      "حذف کامل برندینگ اسمارت جیم (کاملاً اختصاصی)",
      "دامنه اختصاصی متصل به پنل اختصاصی شما",
      "امکان اتصال مستقیم به درگاه پرداخت اختصاصی باشگاه",
      "سیستم رزرواسیون کلوپ وفاداری پیشرفته",
      "پنل ارسال پیامک رایگان با خط خدماتی بدون بلک‌لیست",
      "نسخه اختصاصی اندروید و iOS خروجی مستقیم با نام شما",
      "مدیر فنی اختصاصی و بکاپ‌گیری خودکار روزانه ابری"
    ]
  }
];

// 3. Simulated Multi-tenant Gyms
export const MOCK_TENANTS: Tenant[] = [
  {
    id: "tenant_1",
    name: "باشگاه ورزشی مدرن اکسیژن",
    ownerName: "جناب آقای علیرضا تهرانی",
    email: "oxygen@example.com",
    phone: "09121112233",
    domain: "oxygen.smartgym.ir",
    status: "ACTIVE",
    planName: "پلن حرفه‌ای (نقره‌ای)",
    expiresAt: "1405/10/12",
    branchesCount: 2,
    membersCount: 450,
    monthlyRevenue: 32000000,
    createdAt: "1404/01/15",
    whiteLabelTheme: {
      primaryColor: "#3b82f6",
      secondaryColor: "#10b981",
      logo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100&auto=format&fit=crop&q=60"
    }
  },
  {
    id: "tenant_2",
    name: "مجموعه بانوان فیت‌لند",
    ownerName: "سرکار خانم سارا رضایی",
    email: "fitland@example.com",
    phone: "09123334455",
    domain: "fitland.ir",
    status: "ACTIVE",
    planName: "پلن سازمانی (طلایی)",
    expiresAt: "1406/03/20",
    branchesCount: 5,
    membersCount: 1200,
    monthlyRevenue: 115000000,
    createdAt: "1403/11/01",
    whiteLabelTheme: {
      primaryColor: "#ec4899",
      secondaryColor: "#8b5cf6",
      logo: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=100&auto=format&fit=crop&q=60"
    }
  },
  {
    id: "tenant_3",
    name: "باشگاه بدنسازی قهرمانان البرز",
    ownerName: "جناب پهلوان حمید محمدی",
    email: "champions@example.com",
    phone: "09127778899",
    status: "TRIAL",
    planName: "پلن پایه (برنزی)",
    expiresAt: "1405/04/15",
    branchesCount: 1,
    membersCount: 85,
    monthlyRevenue: 6500000,
    createdAt: "1405/03/25"
  }
];

// 4. Predefined Workout Program Template ( Persian, Commercial, Structured )
export const MOCK_WORKOUT_PROGRAMS: WorkoutProgram[] = [
  {
    id: "prog_1",
    title: "برنامه ۳ روزه افزایش حجم عضلانی (سطح متوسط)",
    summary: "این برنامه با تمرکز بر هایپرتروفی عضلانی و بکارگیری سیستم تمرینی اضافه بار تدریجی طراحی شده است. تمرکز بر تغذیه پر پروتئین در طول این دوره الزامی است.",
    createdBy: "استاد پوریا کریمی (مربی رسمی فدراسیون)",
    assignedTo: "آرش احمدی",
    schedule: [
      {
        day: "روز اول: سینه و جلو بازو (شنبه)",
        focus: "تقویت بخش فوقانی، میانی و عضلات دو سر بازویی",
        exercises: [
          {
            exercise: EXERCISES[0], // پرس سینه
            sets: [
              { setNumber: 1, reps: 12, weightKg: 50, isCompleted: true },
              { setNumber: 2, reps: 10, weightKg: 60, isCompleted: true },
              { setNumber: 3, reps: 8, weightKg: 70, isCompleted: false },
              { setNumber: 4, reps: 6, weightKg: 80, isCompleted: false }
            ],
            restDurationSeconds: 90
          },
          {
            exercise: EXERCISES[2], // جلو بازو دمبل متناوب
            sets: [
              { setNumber: 1, reps: 12, weightKg: 12, isCompleted: true },
              { setNumber: 2, reps: 12, weightKg: 15, isCompleted: false },
              { setNumber: 3, reps: 10, weightKg: 15, isCompleted: false }
            ],
            restDurationSeconds: 60
          }
        ]
      },
      {
        day: "روز دوم: چهارسر ران و شکم (دوشنبه)",
        focus: "هایپرتروفی پایین‌تنه و تقویت هسته بدن",
        exercises: [
          {
            exercise: EXERCISES[1], // اسکوات
            sets: [
              { setNumber: 1, reps: 12, weightKg: 60, isCompleted: true },
              { setNumber: 2, reps: 10, weightKg: 80, isCompleted: true },
              { setNumber: 3, reps: 8, weightKg: 100, isCompleted: false }
            ],
            restDurationSeconds: 120
          },
          {
            exercise: EXERCISES[6], // پلانک
            sets: [
              { setNumber: 1, reps: 60, weightKg: 0, isCompleted: true }, // Reps as seconds
              { setNumber: 2, reps: 45, weightKg: 0, isCompleted: false },
              { setNumber: 3, reps: 40, weightKg: 0, isCompleted: false }
            ],
            restDurationSeconds: 60
          }
        ]
      },
      {
        day: "روز سوم: زیربغل، شانه و پشت بازو (چهارشنبه)",
        focus: "تقویت عضلات پشت و سرشانه‌ها برای ساختن فرم V-Taper",
        exercises: [
          {
            exercise: EXERCISES[4], // لات پول داون
            sets: [
              { setNumber: 1, reps: 12, weightKg: 40, isCompleted: true },
              { setNumber: 2, reps: 10, weightKg: 50, isCompleted: false },
              { setNumber: 3, reps: 8, weightKg: 60, isCompleted: false }
            ],
            restDurationSeconds: 75
          },
          {
            exercise: EXERCISES[5], // نشر جانب
            sets: [
              { setNumber: 1, reps: 15, weightKg: 7.5, isCompleted: true },
              { setNumber: 2, reps: 12, weightKg: 10, isCompleted: false },
              { setNumber: 3, reps: 12, weightKg: 10, isCompleted: false }
            ],
            restDurationSeconds: 60
          },
          {
            exercise: EXERCISES[3], // پشت بازو سیم کش طناب
            sets: [
              { setNumber: 1, reps: 15, weightKg: 20, isCompleted: true },
              { setNumber: 2, reps: 12, weightKg: 25, isCompleted: false },
              { setNumber: 3, reps: 10, weightKg: 30, isCompleted: false }
            ],
            restDurationSeconds: 60
          }
        ]
      }
    ],
    tips: [
      "بعد از هر جلسه تمرینی حتماً ۳۰ گرم پروتئین زودجذب میل کنید.",
      "بین تمرینات حداقل ۷ ساعت خواب باکیفیت شبانه داشته باشید.",
      "آب مصرفی خود را در طول تمرین به بیش از ۱.۵ لیتر برسانید."
    ]
  }
];

// 5. Simulated Premium Nutrition Plan
export const MOCK_NUTRITION_PLANS: NutritionPlan[] = [
  {
    id: "nut_1",
    title: "رژیم غذایی کات و چربی‌سوزی ورزشی ۲۲۰۰ کالری",
    targetCalories: 2200,
    macros: {
      protein: 165, // grams
      carbs: 210,
      fat: 60,
      water: 3.5
    },
    meals: {
      breakfast: {
        title: "صبحانه (ساعت ۸:۰۰)",
        items: [
          "۴ عدد سفیده تخم‌مرغ آب‌پز + ۱ عدد زرده کامل",
          "۶۰ گرم جو دوسر پرک پخته شده با آب",
          "یک فنجان قهوه تلخ یا چای سبز"
        ],
        calories: 380,
        proteinGrams: 28,
        carbsGrams: 42,
        fatGrams: 10
      },
      lunch: {
        title: "ناهار (ساعت ۱۳:۳۰)",
        items: [
          "۲۰۰ گرم سینه مرغ گریل شده بدون روغن",
          "۱۵۰ گرم کته برنج قهوه‌ای یا باسماتی",
          "یک بشقاب بزرگ سالاد کاهو همراه با ۱ قاشق چای‌خوری روغن زیتون بکر"
        ],
        calories: 680,
        proteinGrams: 52,
        carbsGrams: 65,
        fatGrams: 16
      },
      snacks: {
        title: "میان‌وعده عصر (ساعت ۱۷:۰۰ - قبل تمرین)",
        items: [
          "یک عدد سیب درختی بزرگ + ۱۵ عدد بادام درختی خام",
          "یک پیمانه مکمل پروتئین وی هیدرولیز شده همراه آب (بعد تمرین)"
        ],
        calories: 450,
        proteinGrams: 32,
        carbsGrams: 38,
        fatGrams: 14
      },
      dinner: {
        title: "شام (ساعت ۲۱:۰۰)",
        items: [
          "۱۸۰ گرم فیله ماهی قزل‌آلا یا گوشت بوقلمون گریل شده",
          "۱۰۰ گرم سیب‌زمینی شیرین تنوری یا پخته",
          "نصف فنجان کلم بروکلی بخارپز"
        ],
        calories: 540,
        proteinGrams: 48,
        carbsGrams: 45,
        fatGrams: 14
      }
    },
    shoppingList: [
      "سینه مرغ گرم بدون استخوان (۲ کیلوگرم)",
      "جو دوسر پرک ارگانیک (۱ بسته)",
      "تخم‌مرغ محلی یا صنعتی (۲ شانه)",
      "برنج قهوه‌ای ایرانی (۱ کیلوگرم)",
      "فیله ماهی قزل‌آلا صید روز (۱ کیلوگرم)",
      "کلم بروکلی و کاهو رسمی تازه"
    ],
    advice: [
      "از نمک دریا به میزان متعادل استفاده کنید تا الکترولیت‌های بدن حین تمرین حفظ شود.",
      "آخرین وعده غذایی خود را حداقل ۲ ساعت قبل از خواب میل کنید.",
      "ویتامین C و امگا ۳ همراه صبحانه مصرف شود."
    ]
  }
];

// 6. Attendance Database Check-ins
export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: "att_1", memberId: "m_101", memberName: "آرش احمدی", date: "1405/04/01", checkInTime: "17:05", checkOutTime: "18:45", totalHours: 1.66, status: "PRESENT" },
  { id: "att_2", memberId: "m_102", memberName: "مهرداد صادقی", date: "1405/04/01", checkInTime: "18:15", checkOutTime: "19:50", totalHours: 1.58, status: "PRESENT" },
  { id: "att_3", memberId: "m_103", memberName: "نیما مرادی", date: "1405/04/01", checkInTime: "19:30", status: "PRESENT" }, // Checked in, not checked out yet
  { id: "att_4", memberId: "m_104", memberName: "سینا بهرامی", date: "1405/04/01", checkInTime: "20:05", checkOutTime: "21:30", totalHours: 1.41, status: "LATE" },
  { id: "att_5", memberId: "m_105", memberName: "امین رمضانی", date: "1405/04/01", checkInTime: "08:10", checkOutTime: "09:30", totalHours: 1.33, status: "PRESENT" }
];

// 7. Finance Invoices & Receipts
export const MOCK_INVOICES: Invoice[] = [
  { id: "INV-4101", memberName: "آرش احمدی", planName: "شهریه ۳ ماهه باشگاه + مربی خصوصی", amountToman: 1850000, paymentMethod: "ONLINE", status: "PAID", date: "1405/03/10" },
  { id: "INV-4102", memberName: "مریم حسینی", planName: "عضویت طلایی ۱ ساله تک شعبه", amountToman: 4200000, paymentMethod: "ONLINE", status: "PAID", date: "1405/03/15", couponApplied: "OFF30" },
  { id: "INV-4103", memberName: "پوریا علیزاده", planName: "پروتئین وی ایزوله ۲.۲ کیلویی کارن", amountToman: 1650000, paymentMethod: "WALLET", status: "PAID", date: "1405/03/18" },
  { id: "INV-4104", memberName: "کامران کیانی", planName: "شهریه ماهیانه آزاد بدون مربی", amountToman: 650000, paymentMethod: "BANK_TRANSFER", status: "PENDING", date: "1405/04/01" },
  { id: "INV-4105", memberName: "سهیل ناصری", planName: "برنامه تمرینی اختصاصی هوش مصنوعی", amountToman: 150000, paymentMethod: "ONLINE", status: "PAID", date: "1405/04/01" }
];

// 8. Bookings Database
export const MOCK_BOOKINGS: Booking[] = [
  { id: "b_1", className: "کلاس کراس‌فیت پیشرفته - سانس آقایان", coachName: "استاد پوریا کریمی", memberName: "آرش احمدی", date: "1405/04/02", timeSlot: "18:00 - 19:30", status: "CONFIRMED" },
  { id: "b_2", className: "کلاس اسپینینگ و هوازی اینتروال", coachName: "سارا حسینی", memberName: "الناز شاکری", date: "1405/04/02", timeSlot: "10:00 - 11:30", status: "CONFIRMED" },
  { id: "b_3", className: "یوگا و مدیتیشن آرامش ذهن", coachName: "سرکار خانم تهرانی", memberName: "پرستو صالحی", date: "1405/04/03", timeSlot: "16:00 - 17:30", status: "WAITLIST" }
];

// 9. Tickets Center
export const MOCK_TICKETS: Ticket[] = [
  {
    id: "TCK-1092",
    memberName: "آرش احمدی",
    department: "ACCOUNTING",
    subject: "مشکل در تمدید خودکار شهریه ماهانه با کیف پول",
    priority: "HIGH",
    status: "ANSWERED",
    date: "1405/03/28",
    replies: [
      { sender: "آرش احمدی", text: "سلام وقت بخیر، دیروز موجودی کیف پولم رو ۲ میلیون تومان شارژ کردم اما باز تمدید خودکار انجام نشده.", time: "11:20" },
      { sender: "پشتیبانی اسمارت جیم", text: "سلام کاربر گرامی، تمدید خودکار شما راس ساعت ۲۴:۰۰ امشب مجدداً توسط کرون‌جاب بررسی و شهریه کسر خواهد شد. نیازی به اقدام دستی نیست.", time: "14:15" }
    ]
  },
  {
    id: "TCK-1093",
    memberName: "باشگاه اکسیژن (مدیر)",
    department: "TECHNICAL",
    subject: "اضافه کردن ساب‌دامین اختصاصی به سیستم وایت‌لیبل",
    priority: "MEDIUM",
    status: "OPEN",
    date: "1405/04/01",
    replies: [
      { sender: "باشگاه اکسیژن (مدیر)", text: "رکورد CNAME را روی دامنه خودمان ست کردیم. لطفاً بررسی کنید ساب‌دامین اختصاصی ما فعال شود.", time: "09:00" }
    ]
  }
];

// 10. Audit logs (Security entries)
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: "log_1", user: "امیرحسین رضایی (سوپر ادمین)", role: "Super Admin", action: "ایجاد مستاجر جدید: باشگاه اکسیژن نیاوران", ip: "185.204.12.98", device: "Desktop / Chrome Windows", time: "14:00:15" },
  { id: "log_2", user: "علیرضا تهرانی (صاحب باشگاه اکسیژن)", role: "Gym Owner", action: "تغییر تم رنگی وایت‌لیبل به آبی المپیک", ip: "94.23.45.101", device: "Desktop / macOS Safari", time: "14:12:44" },
  { id: "log_3", user: "مریم یوسفی (اپراتور پذیرش)", role: "Receptionist", action: "ورود موفق با رمز یکبار مصرف (OTP)", ip: "5.112.9.23", device: "Mobile / Firefox Android", time: "14:15:02" },
  { id: "log_4", user: "ناشناس (بلاک شده)", role: "None", action: "۵ بار تلاش ناموفق برای ورود به بخش مدیریت - بلاک IP", ip: "198.51.100.4", device: "Unknown Bot Engine", time: "14:18:20" }
];

// 11. Supplements and Equipment products (Store management)
export const MOCK_PRODUCTS: StoreProduct[] = [
  { id: "p_1", name: "پروتئین وی گلد استاندارد ۲.۲ کیلوگرمی اپتیموم نوتریشن", category: "SUPPLEMENT", brand: "ON", priceToman: 2850000, stock: 18, minStockAlert: 5, barcode: "748927051283" },
  { id: "p_2", name: "کراتیـن مونوهیدرات ۳۰۰ گرمی شرکت کارن", category: "SUPPLEMENT", brand: "Karen", priceToman: 540000, stock: 32, minStockAlert: 10, barcode: "626045100124" },
  { id: "p_3", name: "کمر بند بدنسازی چرم حرفه‌ای چرم گاومیش", category: "EQUIPMENT", brand: "OlyFit", priceToman: 850000, stock: 4, minStockAlert: 5, barcode: "9823101290" },
  { id: "p_4", name: "شیکر سه طبقه ضد نشت پیرکس نشکن با فنر استیل", category: "ACCESSORY", brand: "SmartShaker", priceToman: 280000, stock: 50, minStockAlert: 15, barcode: "8830129033" }
];

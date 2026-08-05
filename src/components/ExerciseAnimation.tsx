import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { 
  Eye, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause, 
  Layers, 
  Sparkles,
  Activity,
  Flame,
  Info,
  Compass,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  HelpCircle,
  Sliders
} from "lucide-react";

interface ExerciseAnimationProps {
  exerciseName: string;
  isPlaying?: boolean;
  isResting?: boolean;
}

type ExerciseCategory = 
  | "chest_press" 
  | "chest_fly" 
  | "back_pulldown" 
  | "back_row" 
  | "shoulder_press" 
  | "shoulder_raise" 
  | "bicep_curl" 
  | "tricep_pushdown" 
  | "leg_squat" 
  | "leg_extension" 
  | "core_crunch"
  | "default";

export default function ExerciseAnimation({ exerciseName, isPlaying = true, isResting = false }: ExerciseAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number | null>(null);

  // 3D View and Render State
  const [viewAngle, setViewAngle] = useState<"3d" | "front" | "side" | "top" | "back">("3d");
  const [renderMode, setRenderMode] = useState<"anatomy" | "heatmap" | "skeleton">("anatomy");
  const [showMistake, setShowMistake] = useState(false); // Muscle & Motion "Dos & Don'ts" toggle
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.5, 1, 1.5
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [internalPlaying, setInternalPlaying] = useState(isPlaying);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  // Live Rep Metrics State (Muscle & Motion Telemetry)
  const [repProgress, setRepProgress] = useState<number>(0); // 0% to 100%
  const [repPhase, setRepPhase] = useState<"concentric" | "peak" | "eccentric">("concentric");
  const [currentJointAngle, setCurrentJointAngle] = useState<number>(180);
  const [agonistActivation, setAgonistActivation] = useState<number>(0);
  const [synergistActivation, setSynergistActivation] = useState<number>(0);

  // Drag Orbit state
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const cameraRotation = useRef({ theta: Math.PI / 4, phi: Math.PI / 6, radius: 4.8 });

  // Categorize Exercise Biomechanics precisely
  const name = exerciseName ? exerciseName.toLowerCase() : "";
  let category: ExerciseCategory = "default";

  if (name.includes("فلای") || name.includes("قفسه")) {
    category = "chest_fly";
  } else if (name.includes("سینه") || name.includes("پرس سینه") || name.includes("دیپ")) {
    category = "chest_press";
  } else if (name.includes("بارفیکس") || name.includes("لات") || name.includes("زیربغل سیم") || name.includes("عمودی")) {
    category = "back_pulldown";
  } else if (name.includes("زیربغل") || name.includes("قایقی") || name.includes("ددلیفت") || name.includes("خم")) {
    category = "back_row";
  } else if (name.includes("سرشانه") || name.includes("پرس شانه") || name.includes("آرنولدی")) {
    category = "shoulder_press";
  } else if (name.includes("نشر") || name.includes("جانب") || name.includes("کول")) {
    category = "shoulder_raise";
  } else if (name.includes("جلو بازو") || name.includes("لاری") || name.includes("چکشی")) {
    category = "bicep_curl";
  } else if (name.includes("پشت بازو") || name.includes("سیم‌کش") || name.includes("سیم کش") || name.includes("دیپ")) {
    category = "tricep_pushdown";
  } else if (name.includes("اسکوات") || name.includes("اسکات") || name.includes("لانژ") || name.includes("پرس پا")) {
    category = "leg_squat";
  } else if (name.includes("جلوران") || name.includes("پشت‌ران") || name.includes("ساق") || name.includes("پا")) {
    category = "leg_extension";
  } else if (name.includes("پلانک") || name.includes("شکم") || name.includes("کرانچ") || name.includes("خلبانی") || name.includes("فیله")) {
    category = "core_crunch";
  } else {
    category = "bicep_curl";
  }

  // Synchronize internal play state with parent resting state
  useEffect(() => {
    setInternalPlaying(!isResting && isPlaying);
  }, [isPlaying, isResting]);

  // Comprehensive Muscle & Motion Biomechanical Breakdown & Anatomy Meta
  const getAnatomyBreakdown = () => {
    switch (category) {
      case "chest_press":
        return {
          title: "پرس سینه با هالتر / دمبل (Chest Press)",
          agonist: "Pectoralis Major (سینه ای بزرگ)",
          synergist: "Anterior Deltoid & Triceps Brachii (دلتوئید قدامی و سه سر)",
          stabilizer: "Coracobrachialis, Core & Latissimus Dorsi (عضلات تثبیت کننده core)",
          correctCue: "کتف‌ها عقب و پایین (Retracted & Depressed)، زاویه آرنج ۶۰ درجه.",
          mistakeCue: "خطای رایج: باز شدن ۹۰ درجه آرنج که باعث فشار خطرناک روی کپسول شانه می‌شود.",
          rom: "از لمس نرم بالاسینه تا اکستنشن کامل با کنترل"
        };
      case "chest_fly":
        return {
          title: "قفسه سینه / فلای (Pectoral Fly)",
          agonist: "Sternal Pectoralis Major (بخش سینه ای و داخلی)",
          synergist: "Clavicular Pectoralis & Biceps Short Head",
          stabilizer: "Anterior Deltoid & Flexor Carpi",
          correctCue: "حفظ انحنای ثابت در آرنج‌ها، تمرکز بر نزدیک کردن بازوها به مرکز بدن.",
          mistakeCue: "خطای رایج: صاف کردن کامل آرنج یا قفل شدن مچ دست تحت بار.",
          rom: "کشش عمیق افقی تا سطح سینه"
        };
      case "back_pulldown":
        return {
          title: "زیربغل لات کششی (Lat Pulldown)",
          agonist: "Latissimus Dorsi (پشتی بزرگ)",
          synergist: "Rhomboids, Teres Major & Biceps Brachii",
          stabilizer: "Rotator Cuff & Lower Trapezius",
          correctCue: "سینه بالا، کشیدن میله به سمت بالاسینه با پایین کشیدن کتف‌ها.",
          mistakeCue: "خطای رایج: متمایل شدن شدید به عقب و استفاده از اینرسی بدن.",
          rom: "کشش کامل بالاتنه تا انقباض عمیق در زیربغل"
        };
      case "back_row":
        return {
          title: "زیربغل قایقی / پارویی (Bent-over / Cable Row)",
          agonist: "Rhomboids & Middle Trapezius (ذوزنقه‌ای و متقاطع)",
          synergist: "Latissimus Dorsi & Posterior Deltoid",
          stabilizer: "Erector Spinae & Hamstrings (فیله کمر)",
          correctCue: "حفظ قوس طبیعی گودی کمر، نزدیک کردن آرنج‌ها به پهلو.",
          mistakeCue: "خطای رایج: گرد شدن گودی کمر (Hyper-flexion) و فشار بر دیسک L4-L5.",
          rom: "کشیدن دسته تا بالای ناف با مکث عضلانی"
        };
      case "shoulder_press":
        return {
          title: "پرس سرشانه (Overhead Shoulder Press)",
          agonist: "Anterior Deltoid (دلتوئید قدامی)",
          synergist: "Lateral Deltoid, Supraspinatus & Triceps",
          stabilizer: "Upper Trapezius & Serratus Anterior",
          correctCue: "مچ دست‌ها مستقیم، پرس در مسیر عمودی بدون قوس دادن کمر.",
          mistakeCue: "خطای رایج: قوس شدید دادن به کمر (Lumbar Lordosis).",
          rom: "از سطح چانه تا بالای سر"
        };
      case "shoulder_raise":
        return {
          title: "نشر جانب سرشانه (Lateral Deltoid Raise)",
          agonist: "Lateral Deltoid (دلتوئید جانبی)",
          synergist: "Supraspinatus & Anterior Deltoid",
          stabilizer: "Upper Trapezius & Forearm Flexors",
          correctCue: "آرنج‌ها کمی خم، بالا آوردن تا سطح شانه با هدایت آرنج.",
          mistakeCue: "خطای رایج: بالا انداختن شانه‌ها (Shrugging) و درگیری بیش از حد کول.",
          rom: "از کنار ران تا زاویه ۹۰ درجه افقی"
        };
      case "bicep_curl":
        return {
          title: "جلو بازو (Biceps Brachii Flexion)",
          agonist: "Biceps Brachii (دو سر بازویی)",
          synergist: "Brachialis & Brachioradialis (عضله بازویی-ساعدی)",
          stabilizer: "Anterior Deltoid & Wrist Flexors",
          correctCue: "ثابت ماندن کامل بازوها کنار بدنه، انقباض اوج در بالای حرکت.",
          mistakeCue: "خطای رایج: جلو آمدن آرنج‌ها و تاب دادن تنه (Cheating).",
          rom: "باز شدن ۱۸۰ درجه تا انقباض کامل ۱۳۵ درجه"
        };
      case "tricep_pushdown":
        return {
          title: "پشت بازو سیم‌کش (Triceps Extension)",
          agonist: "Triceps Brachii - All Heads (سه سر بازویی)",
          synergist: "Anconeus",
          stabilizer: "Core, Latissimus Dorsi & Posterior Deltoid",
          correctCue: "بازوها قفل کنار سینه، اکستنشن کامل ساعد به سمت پایین.",
          mistakeCue: "خطای رایج: باز شدن آرنج‌ها به طرفین و خم شدن تنه روی میله.",
          rom: "خم ۹۰ درجه ساعد تا صاف شدن کامل صفر درجه"
        };
      case "leg_squat":
        return {
          title: "حرکت اسکوات (Barbell Squat Biomechanics)",
          agonist: "Quadriceps Femoris (چهارسر ران)",
          synergist: "Gluteus Maximus, Adductor Magnus & Soleus",
          stabilizer: "Hamstrings, Erector Spinae & Core",
          correctCue: "عمق استاندارد (ران موازی زمین)، زانوها در مسیر انگشتان پا.",
          mistakeCue: "خطای رایج: جلو زدن شدید زانو از انگشتان پا و گرد شدن کمر (Butt Wink).",
          rom: "ایستاده کامل تا نشستن ۹۰ درجه یا پایین تر"
        };
      case "leg_extension":
        return {
          title: "جلو ران دستگاه (Quadriceps Extension)",
          agonist: "Rectus Femoris & Vastus Lateralis/Medialis",
          synergist: "Tensor Fasciae Latae",
          stabilizer: "Gastrocnemius & Tibialis Anterior",
          correctCue: "تکیه کامل کمر به صندلی، اکستنشن صاف زانو با انقباض ۱ ثانیه‌ای.",
          mistakeCue: "خطای رایج: ضربه زدن ناگهانی و پرتاب کردن وزنه.",
          rom: "زاویه ۹۰ درجه زانو تا اکستنشن ۱۸۰ درجه"
        };
      case "core_crunch":
        return {
          title: "کرانچ و تقویت شکم (Abdominal Flexion)",
          agonist: "Rectus Abdominis (مستقیم شکمی)",
          synergist: "Obliques (مورب داخلی و خارجی)",
          stabilizer: "Transverse Abdominis & Psoas Major",
          correctCue: "نزدیک کردن قفسه سینه به لگن با تخلیه کامل بازدم.",
          mistakeCue: "خطای رایج: کشیدن گردن با دست‌ها و فشار به مهره‌های گردنی.",
          rom: "تخت تا انقباض ۳۰ درجه بالاتنه"
        };
      default:
        return {
          title: "آناتومی بیومکانیک حرکتی",
          agonist: "Agonist Target Muscle",
          synergist: "Synergist Muscle Group",
          stabilizer: "Stabilizers",
          correctCue: "تمرکز بر انقباض هدف و تنفس صحیح.",
          mistakeCue: "خطای رایج: پرهیز از حرکت شتاب‌زده.",
          rom: "دامنه حرکتی استاندارد"
        };
    }
  };

  const anatomyInfo = getAnatomyBreakdown();

  // Three.js Scene Construction
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 320;
    const height = containerRef.current.clientHeight || 280;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617); // Slate obsidian dark

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    // 4. Muscle & Motion High-Precision Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainSpot = new THREE.DirectionalLight(0xffffff, 1.5);
    mainSpot.position.set(5, 8, 6);
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 1024;
    mainSpot.shadow.mapSize.height = 1024;
    scene.add(mainSpot);

    // Anatomical Agonist Emissive Red Light
    const agonistEmissiveLight = new THREE.PointLight(0xef4444, 2.2, 5);
    agonistEmissiveLight.position.set(0, 1.1, 0.6);
    scene.add(agonistEmissiveLight);

    // Synergist Cyan Rim Light
    const synergistRimLight = new THREE.DirectionalLight(0x06b6d4, 0.9);
    synergistRimLight.position.set(-6, 3, -4);
    scene.add(synergistRimLight);

    // 5. Grid Stage & Reflective Floor
    const gridHelper = new THREE.GridHelper(8, 16, showMistake ? 0xef4444 : 0x10b981, 0x1e293b);
    gridHelper.position.y = -1.25;
    scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x070d19, roughness: 0.15, metalness: 0.85 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.26;
    floor.receiveShadow = true;
    scene.add(floor);

    // 6. BUILD ANATOMICAL MUSCLE & MOTION MODEL RIG
    const athleteGroup = new THREE.Group();
    scene.add(athleteGroup);

    const equipmentGroup = new THREE.Group();
    scene.add(equipmentGroup);

    // --- MATERIALS BY RENDER MODE ---
    const isWire = renderMode === "skeleton";

    // Bone / Skeleton Color Material
    const boneMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.3,
      metalness: 0.2,
      wireframe: isWire
    });

    // White Tendon Attachment Material (Muscle & Motion Signature)
    const tendonMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1
    });

    // Primary Agonist Muscle Fiber Material (Glowing Muscle & Motion Red/Orange)
    const agonistMuscleMat = new THREE.MeshStandardMaterial({
      color: showMistake ? 0xd97706 : 0xef4444,
      emissive: showMistake ? 0x92400e : 0xd97706,
      emissiveIntensity: 0.7,
      roughness: 0.35,
      metalness: 0.1,
      wireframe: isWire
    });

    // Synergist Secondary Muscle Fiber Material (Amber/Orange)
    const synergistMuscleMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.4,
      roughness: 0.4,
      wireframe: isWire
    });

    // Stabilizer Muscle Material (Cyan/Blue)
    const stabilizerMuscleMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0e7490,
      emissiveIntensity: 0.3,
      roughness: 0.4,
      wireframe: isWire
    });

    // Metallic Equipment Material
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.9, roughness: 0.1 });
    const weightPlateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.7 });

    // --- ANATOMICAL MODEL ASSEMBLY ---
    // Skull & Cervical Spine
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 18), boneMat);
    head.position.set(0, 1.45, 0);
    athleteGroup.add(head);

    // Ribcage & Chest Pectorals
    const chestIsAgonist = category === "chest_press" || category === "chest_fly";
    const chestMat = chestIsAgonist ? agonistMuscleMat : renderMode === "heatmap" ? synergistMuscleMat : boneMat;

    const ribcage = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.48, 16), boneMat);
    ribcage.position.set(0, 0.95, 0);
    athleteGroup.add(ribcage);

    // Pectoral Muscle Fiber Bellies
    const pecLeft = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.08), chestMat);
    pecLeft.position.set(-0.14, 1.05, 0.12);
    athleteGroup.add(pecLeft);

    const pecRight = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.08), chestMat);
    pecRight.position.set(0.14, 1.05, 0.12);
    athleteGroup.add(pecRight);

    // Lats / Back Muscles
    const backIsAgonist = category === "back_pulldown" || category === "back_row";
    const backMat = backIsAgonist ? agonistMuscleMat : renderMode === "heatmap" ? stabilizerMuscleMat : boneMat;

    const latLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 0.4, 12), backMat);
    latLeft.position.set(-0.2, 0.88, -0.08);
    athleteGroup.add(latLeft);

    const latRight = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 0.4, 12), backMat);
    latRight.position.set(0.2, 0.88, -0.08);
    athleteGroup.add(latRight);

    // Core Abs Grid
    const absIsAgonist = category === "core_crunch";
    const absMat = absIsAgonist ? agonistMuscleMat : renderMode === "heatmap" ? synergistMuscleMat : boneMat;

    const absGrid = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.16), absMat);
    absGrid.position.set(0, 0.58, 0.04);
    athleteGroup.add(absGrid);

    // Pelvis Bone
    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.18, 16), boneMat);
    pelvis.position.set(0, 0.35, 0);
    athleteGroup.add(pelvis);

    // --- SHOULDERS & ARMS RIG ---
    const shoulderIsAgonist = category === "shoulder_press" || category === "shoulder_raise";
    const deltoidMat = shoulderIsAgonist ? agonistMuscleMat : renderMode === "heatmap" ? synergistMuscleMat : boneMat;

    const bicepIsAgonist = category === "bicep_curl";
    const tricepIsAgonist = category === "tricep_pushdown";
    const armMuscleMat = bicepIsAgonist || tricepIsAgonist ? agonistMuscleMat : renderMode === "heatmap" ? synergistMuscleMat : boneMat;

    // Shoulder Deltoid Cap Orbs
    const leftDelt = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), deltoidMat);
    leftDelt.position.set(-0.38, 1.18, 0);
    athleteGroup.add(leftDelt);

    const rightDelt = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), deltoidMat);
    rightDelt.position.set(0.38, 1.18, 0);
    athleteGroup.add(rightDelt);

    // Left Arm Groups
    const leftUpperArmGroup = new THREE.Group();
    leftUpperArmGroup.position.set(-0.38, 1.18, 0);
    athleteGroup.add(leftUpperArmGroup);

    const leftHumerusBone = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.42, 12), boneMat);
    leftHumerusBone.position.set(0, -0.21, 0);
    leftUpperArmGroup.add(leftHumerusBone);

    // Bicep / Tricep Muscle Belly
    const leftArmBelly = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.32, 16), armMuscleMat);
    leftArmBelly.position.set(0, -0.2, 0.01);
    leftUpperArmGroup.add(leftArmBelly);

    // Tendons
    const leftTendonTop = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), tendonMat);
    leftTendonTop.position.set(0, -0.02, 0);
    leftUpperArmGroup.add(leftTendonTop);

    const leftForearmGroup = new THREE.Group();
    leftForearmGroup.position.set(0, -0.42, 0);
    leftUpperArmGroup.add(leftForearmGroup);

    const leftRadiusBone = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.38, 12), boneMat);
    leftRadiusBone.position.set(0, -0.19, 0);
    leftForearmGroup.add(leftRadiusBone);

    // Right Arm Groups
    const rightUpperArmGroup = new THREE.Group();
    rightUpperArmGroup.position.set(0.38, 1.18, 0);
    athleteGroup.add(rightUpperArmGroup);

    const rightHumerusBone = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.42, 12), boneMat);
    rightHumerusBone.position.set(0, -0.21, 0);
    rightUpperArmGroup.add(rightHumerusBone);

    const rightArmBelly = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.32, 16), armMuscleMat);
    rightArmBelly.position.set(0, -0.2, 0.01);
    rightUpperArmGroup.add(rightArmBelly);

    const rightTendonTop = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), tendonMat);
    rightTendonTop.position.set(0, -0.02, 0);
    rightUpperArmGroup.add(rightTendonTop);

    const rightForearmGroup = new THREE.Group();
    rightForearmGroup.position.set(0, -0.42, 0);
    rightUpperArmGroup.add(rightForearmGroup);

    const rightRadiusBone = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.38, 12), boneMat);
    rightRadiusBone.position.set(0, -0.19, 0);
    rightForearmGroup.add(rightRadiusBone);

    // --- LEGS RIG ---
    const legIsAgonist = category === "leg_squat" || category === "leg_extension";
    const legMuscleMat = legIsAgonist ? agonistMuscleMat : renderMode === "heatmap" ? synergistMuscleMat : boneMat;

    // Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.18, 0.25, 0);
    athleteGroup.add(leftLegGroup);

    const leftFemurBone = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.52, 12), boneMat);
    leftFemurBone.position.set(0, -0.26, 0);
    leftLegGroup.add(leftFemurBone);

    const leftQuadBelly = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.09, 0.42, 16), legMuscleMat);
    leftQuadBelly.position.set(0, -0.24, 0.02);
    leftLegGroup.add(leftQuadBelly);

    const leftCalfGroup = new THREE.Group();
    leftCalfGroup.position.set(0, -0.52, 0);
    leftLegGroup.add(leftCalfGroup);

    const leftTibiaBone = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.48, 12), boneMat);
    leftTibiaBone.position.set(0, -0.24, 0);
    leftCalfGroup.add(leftTibiaBone);

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.18, 0.25, 0);
    athleteGroup.add(rightLegGroup);

    const rightFemurBone = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.52, 12), boneMat);
    rightFemurBone.position.set(0, -0.26, 0);
    rightLegGroup.add(rightFemurBone);

    const rightQuadBelly = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.09, 0.42, 16), legMuscleMat);
    rightQuadBelly.position.set(0, -0.24, 0.02);
    rightLegGroup.add(rightQuadBelly);

    const rightCalfGroup = new THREE.Group();
    rightCalfGroup.position.set(0, -0.52, 0);
    rightLegGroup.add(rightCalfGroup);

    const rightTibiaBone = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.48, 12), boneMat);
    rightTibiaBone.position.set(0, -0.24, 0);
    rightCalfGroup.add(rightTibiaBone);

    // --- EQUIPMENT SETUP ---
    let mainBarbell: THREE.Mesh | null = null;

    if (category === "chest_press" || category === "chest_fly") {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 1.5), leatherMat);
      bench.position.set(0, -0.45, -0.1);
      equipmentGroup.add(bench);

      athleteGroup.rotation.x = -Math.PI / 2;
      athleteGroup.position.set(0, -0.1, -0.2);

      if (category === "chest_press") {
        const barGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.2, 16);
        mainBarbell = new THREE.Mesh(barGeo, chromeMat);
        mainBarbell.rotation.z = Math.PI / 2;
        mainBarbell.position.set(0, 0.6, 0);
        equipmentGroup.add(mainBarbell);

        const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 24), weightPlateMat);
        p1.rotation.z = Math.PI / 2;
        p1.position.set(-0.92, 0, 0);
        mainBarbell.add(p1);

        const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 24), weightPlateMat);
        p2.rotation.z = Math.PI / 2;
        p2.position.set(0.92, 0, 0);
        mainBarbell.add(p2);
      }
    } else if (category === "bicep_curl" || category === "shoulder_raise" || category === "shoulder_press") {
      const createDb = () => {
        const g = new THREE.Group();
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 12), chromeMat);
        handle.rotation.x = Math.PI / 2;
        g.add(handle);

        const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), weightPlateMat);
        h1.rotation.x = Math.PI / 2;
        h1.position.set(0, 0.12, 0);
        g.add(h1);

        const h2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), weightPlateMat);
        h2.rotation.x = Math.PI / 2;
        h2.position.set(0, -0.12, 0);
        g.add(h2);

        return g;
      };

      const dbL = createDb();
      dbL.position.set(0, -0.38, 0);
      leftForearmGroup.add(dbL);

      const dbR = createDb();
      dbR.position.set(0, -0.38, 0);
      rightForearmGroup.add(dbR);
    } else if (category === "leg_squat") {
      const barGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.1, 16);
      mainBarbell = new THREE.Mesh(barGeo, chromeMat);
      mainBarbell.rotation.z = Math.PI / 2;
      mainBarbell.position.set(0, 1.2, -0.12);
      athleteGroup.add(mainBarbell);

      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 24), weightPlateMat);
      p1.rotation.z = Math.PI / 2;
      p1.position.set(-0.88, 0, 0);
      mainBarbell.add(p1);

      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 24), weightPlateMat);
      p2.rotation.z = Math.PI / 2;
      p2.position.set(0.88, 0, 0);
      mainBarbell.add(p2);
    } else if (category === "back_pulldown") {
      const barGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.9, 16);
      mainBarbell = new THREE.Mesh(barGeo, chromeMat);
      mainBarbell.rotation.z = Math.PI / 2;
      mainBarbell.position.set(0, 1.85, 0);
      equipmentGroup.add(mainBarbell);
    }

    // Camera Orbit Position Calculator
    const updateCameraPosition = () => {
      const { theta, phi, radius } = cameraRotation.current;
      const effectiveRadius = radius / zoomLevel;

      camera.position.x = effectiveRadius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = effectiveRadius * Math.cos(phi);
      camera.position.z = effectiveRadius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0.1, 0);
    };

    updateCameraPosition();

    // 7. MUSCLE & MOTION BIOMECHANICS ANIMATION LOOP
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const speed = internalPlaying ? 2.2 * playbackSpeed : 0;

      // Pure Sinusoidal rep cycle [0 to 1]
      const rawProgress = (Math.sin(elapsedTime * speed) + 1) / 2;
      const progressPercent = Math.round(rawProgress * 100);

      let phase: "concentric" | "peak" | "eccentric" = "concentric";
      if (rawProgress > 0.88) {
        phase = "peak";
      } else if (Math.cos(elapsedTime * speed) < 0) {
        phase = "eccentric";
      } else {
        phase = "concentric";
      }

      setRepProgress(progressPercent);
      setRepPhase(phase);
      setAgonistActivation(Math.round(50 + rawProgress * 48));
      setSynergistActivation(Math.round(30 + rawProgress * 38));

      // Auto Camera Orbit
      if (autoRotate && !isDragging.current) {
        cameraRotation.current.theta += 0.006;
        updateCameraPosition();
      }

      // --- EXERCISE BIOMECHANIC MOTION & COMMON MISTAKE SIMULATION ---
      if (category === "bicep_curl") {
        const flexAngle = rawProgress * 2.3; // 0 to 132 degrees
        leftForearmGroup.rotation.x = -flexAngle;
        rightForearmGroup.rotation.x = -flexAngle;

        // Bicep Muscle Fiber Bulging
        const bulge = 1.0 + rawProgress * 0.45;
        leftArmBelly.scale.set(bulge, 1.0, bulge);
        rightArmBelly.scale.set(bulge, 1.0, bulge);

        if (showMistake) {
          // Mistake: Swinging torso & elbows flaring forward
          athleteGroup.rotation.x = Math.sin(elapsedTime * speed) * 0.25;
          leftUpperArmGroup.rotation.x = 0.3;
          rightUpperArmGroup.rotation.x = 0.3;
        } else {
          athleteGroup.rotation.x = 0;
          leftUpperArmGroup.rotation.x = 0;
          rightUpperArmGroup.rotation.x = 0;
        }

        setCurrentJointAngle(Math.round(180 - flexAngle * (180 / Math.PI)));
      } else if (category === "chest_press") {
        const barY = 0.25 + rawProgress * 0.45;
        if (mainBarbell) mainBarbell.position.y = barY;

        if (showMistake) {
          // Mistake: Flaring elbows out to 90 degrees
          leftUpperArmGroup.rotation.z = -1.2;
          rightUpperArmGroup.rotation.z = 1.2;
        } else {
          // Correct Form: 60 degree elbow tuck
          const armSpread = (1 - rawProgress) * 0.35;
          leftUpperArmGroup.rotation.z = -armSpread;
          rightUpperArmGroup.rotation.z = armSpread;
        }

        setCurrentJointAngle(Math.round(75 + rawProgress * 95));
      } else if (category === "leg_squat") {
        const squatDepth = -rawProgress * 0.42;
        athleteGroup.position.y = squatDepth;

        const hipFlex = rawProgress * 1.25;
        leftLegGroup.rotation.x = -hipFlex;
        rightLegGroup.rotation.x = -hipFlex;

        const kneeFlex = rawProgress * 1.45;
        leftCalfGroup.rotation.x = kneeFlex;
        rightCalfGroup.rotation.x = kneeFlex;

        if (showMistake) {
          // Mistake: Knee caving (Valgus) & Excessive Lumbar Flexion
          leftLegGroup.rotation.z = 0.25;
          rightLegGroup.rotation.z = -0.25;
          ribcage.rotation.x = 0.4;
        } else {
          leftLegGroup.rotation.z = 0;
          rightLegGroup.rotation.z = 0;
          ribcage.rotation.x = rawProgress * 0.18;
        }

        setCurrentJointAngle(Math.round(170 - hipFlex * (180 / Math.PI)));
      } else if (category === "back_pulldown") {
        const barY = 1.85 - rawProgress * 0.65;
        if (mainBarbell) mainBarbell.position.y = barY;

        const pullAngle = rawProgress * 0.8;
        leftUpperArmGroup.rotation.z = -pullAngle;
        rightUpperArmGroup.rotation.z = pullAngle;

        leftForearmGroup.rotation.x = rawProgress * 0.9;
        rightForearmGroup.rotation.x = rawProgress * 0.9;

        if (showMistake) {
          // Mistake: Excessive torso lean backward
          athleteGroup.rotation.x = -0.45;
        } else {
          athleteGroup.rotation.x = -0.1;
        }

        setCurrentJointAngle(Math.round(180 - rawProgress * 105));
      } else if (category === "shoulder_press") {
        const pressAngle = rawProgress * 1.4;
        leftUpperArmGroup.rotation.z = -pressAngle;
        rightUpperArmGroup.rotation.z = pressAngle;

        if (showMistake) {
          // Mistake: Lumbar hyperextension (Arched lower back)
          ribcage.rotation.x = -0.35;
        } else {
          ribcage.rotation.x = 0;
        }

        setCurrentJointAngle(Math.round(80 + rawProgress * 95));
      } else if (category === "shoulder_raise") {
        const raiseAngle = rawProgress * 1.52;
        leftUpperArmGroup.rotation.z = -raiseAngle;
        rightUpperArmGroup.rotation.z = raiseAngle;

        if (showMistake) {
          // Mistake: Shrugging traps
          leftDelt.position.y = 1.28;
          rightDelt.position.y = 1.28;
        } else {
          leftDelt.position.y = 1.18;
          rightDelt.position.y = 1.18;
        }

        setCurrentJointAngle(Math.round(15 + raiseAngle * (180 / Math.PI)));
      } else if (category === "tricep_pushdown") {
        const extAngle = (1 - rawProgress) * 1.5;
        leftForearmGroup.rotation.x = -extAngle;
        rightForearmGroup.rotation.x = -extAngle;

        if (showMistake) {
          // Mistake: Flaring elbows out from body
          leftUpperArmGroup.rotation.z = -0.4;
          rightUpperArmGroup.rotation.z = 0.4;
        } else {
          leftUpperArmGroup.rotation.z = 0;
          rightUpperArmGroup.rotation.z = 0;
        }

        setCurrentJointAngle(Math.round(180 - extAngle * (180 / Math.PI)));
      }

      // Emissive Agonist Light pulse
      agonistEmissiveLight.intensity = 1.5 + rawProgress * 1.5;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, [category, renderMode, showMistake, internalPlaying, playbackSpeed, autoRotate, zoomLevel]);

  // View Presets
  const applyViewAngle = (view: "3d" | "front" | "side" | "top" | "back") => {
    setViewAngle(view);
    switch (view) {
      case "front":
        cameraRotation.current = { theta: 0, phi: Math.PI / 2, radius: 4.8 };
        break;
      case "side":
        cameraRotation.current = { theta: Math.PI / 2, phi: Math.PI / 2, radius: 4.8 };
        break;
      case "back":
        cameraRotation.current = { theta: Math.PI, phi: Math.PI / 2, radius: 4.8 };
        break;
      case "top":
        cameraRotation.current = { theta: 0, phi: 0.2, radius: 4.8 };
        break;
      case "3d":
      default:
        cameraRotation.current = { theta: Math.PI / 4, phi: Math.PI / 6, radius: 4.8 };
        break;
    }
  };

  // Drag Orbit Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    cameraRotation.current.theta -= deltaX * 0.01;
    cameraRotation.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraRotation.current.phi + deltaY * 0.01));

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
    const deltaY = e.touches[0].clientY - previousMousePosition.current.y;

    cameraRotation.current.theta -= deltaX * 0.012;
    cameraRotation.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraRotation.current.phi + deltaY * 0.012));

    previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  return (
    <div className={`relative w-full transition-all duration-300 rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/95 shadow-2xl ${
      isFullscreen ? "fixed inset-0 z-50 h-screen rounded-none p-4" : "h-[360px] sm:h-[430px]"
    }`}>
      {/* Top Bar: Muscle & Motion Branding & Target Muscle Indicator */}
      <div className="absolute top-3 inset-x-3 flex justify-between items-start z-20 pointer-events-none gap-2">
        {/* Muscle & Motion Biomechanics Badge */}
        <div className="pointer-events-auto bg-slate-900/95 border border-slate-800 backdrop-blur-md rounded-2xl p-2.5 flex items-center gap-3 shadow-xl">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Muscle & Motion 3D</span>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">تخصصی</span>
            </div>
            <span className="text-xs font-black text-white block">{anatomyInfo.title}</span>
          </div>
        </div>

        {/* 3D Render Layer & Muscle Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1.5 rounded-2xl shadow-xl">
          {/* Play / Pause Toggle */}
          <button 
            onClick={() => setInternalPlaying(!internalPlaying)}
            className={`p-2 rounded-xl transition-all ${internalPlaying ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20" : "bg-slate-800 text-slate-300 hover:text-white"}`}
            title={internalPlaying ? "توقف" : "شروع"}
          >
            {internalPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Dos & Don'ts Form Toggle (Muscle & Motion Signature) */}
          <button 
            onClick={() => setShowMistake(!showMistake)}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 transition-all ${
              showMistake 
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse" 
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
            }`}
            title="نمایش خطای رایج در اجرای حرکت"
          >
            {showMistake ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{showMistake ? "خطای رایج" : "فرم صحیح"}</span>
          </button>

          {/* Render Mode Switcher */}
          <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setRenderMode("anatomy")}
              className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all ${renderMode === "anatomy" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
              title="نمایش آناتومی عضلانی"
            >
              عضلانی
            </button>
            <button
              onClick={() => setRenderMode("heatmap")}
              className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all ${renderMode === "heatmap" ? "bg-slate-800 text-amber-400" : "text-slate-400 hover:text-slate-200"}`}
              title="نقشه درگیری عضلات"
            >
              حرارتی
            </button>
            <button
              onClick={() => setRenderMode("skeleton")}
              className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all ${renderMode === "skeleton" ? "bg-slate-800 text-cyan-400" : "text-slate-400 hover:text-slate-200"}`}
              title="نمایش اسکلت بندی"
            >
              اسکلت
            </button>
          </div>

          {/* Speed Toggle */}
          <button 
            onClick={() => setPlaybackSpeed(prev => prev === 1 ? 0.5 : prev === 0.5 ? 1.5 : 1)}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-mono font-bold transition-all"
            title="تغییر سرعت اجرای انیمیشن"
          >
            {playbackSpeed}x
          </button>

          {/* Muscle Breakdown Info Toggle */}
          <button 
            onClick={() => setShowDetailsPanel(!showDetailsPanel)}
            className={`p-2 rounded-xl transition-all ${showDetailsPanel ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-300 hover:text-white"}`}
            title="تحلیل عضلات درگیر"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* Auto Rotate */}
          <button 
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl transition-all ${autoRotate ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-300 hover:text-white"}`}
            title="چرخش ۳۶۰ درجه دوربین"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
            title="تمام‌صفحه"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Realtime Telemetry HUD (Top Right Below Bar) */}
      <div className="absolute top-16 right-3 z-20 pointer-events-none flex flex-col items-end gap-1.5">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            showMistake ? "bg-rose-500 animate-ping" : repPhase === "concentric" ? "bg-emerald-400 animate-ping" : repPhase === "peak" ? "bg-amber-400" : "bg-blue-400"
          }`} />
          <span className="text-[10px] font-black text-slate-200">
            {showMistake ? "خطای اجرا!" : repPhase === "concentric" ? "انقباض (Concentric)" : repPhase === "peak" ? "مکث اوج (Peak)" : "کشش (Eccentric)"}
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-400">{repProgress}%</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md px-3 py-1 rounded-xl text-[9px] text-slate-300 font-mono flex items-center gap-3">
          <span>زاویه مفصل: <b className="text-white">{currentJointAngle}°</b></span>
          <span>عضله اصلی (Agonist): <b className="text-rose-400">{agonistActivation}٪</b></span>
          <span>عضله همکار (Synergist): <b className="text-amber-400">{synergistActivation}٪</b></span>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      />

      {/* Muscle & Motion Anatomical Details Overlay Modal */}
      {showDetailsPanel && (
        <div className="absolute top-16 left-3 z-30 bg-slate-900/95 border border-slate-800 backdrop-blur-xl p-4 rounded-2xl shadow-2xl w-80 text-right space-y-2.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              تحلیل آناتومی عضلانی (Muscle & Motion)
            </span>
            <button onClick={() => setShowDetailsPanel(false)} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div>
              <span className="text-rose-400 font-bold block">● عضله اصلی (Agonist):</span>
              <p className="text-slate-200 font-medium">{anatomyInfo.agonist}</p>
            </div>
            <div>
              <span className="text-amber-400 font-bold block">● عضلات کمک‌کننده (Synergists):</span>
              <p className="text-slate-300 font-medium">{anatomyInfo.synergist}</p>
            </div>
            <div>
              <span className="text-cyan-400 font-bold block">● عضلات تثبیت‌کننده (Stabilizers):</span>
              <p className="text-slate-400 font-medium">{anatomyInfo.stabilizer}</p>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl text-[10px] text-emerald-300">
            <b className="block mb-0.5">دامنه حرکتی (ROM):</b>
            {anatomyInfo.rom}
          </div>
        </div>
      )}

      {/* Floating Persian Form Cue Bar (Bottom Overlay) */}
      <div className="absolute bottom-12 inset-x-3 z-20 pointer-events-none flex justify-center">
        <div className={`pointer-events-auto border backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 max-w-lg text-right transition-all ${
          showMistake 
            ? "bg-rose-950/90 border-rose-500/50 text-rose-200" 
            : "bg-slate-900/90 border-emerald-500/30 text-slate-200"
        }`}>
          {showMistake ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
          ) : (
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <p className="text-[10px] sm:text-xs font-bold leading-relaxed">
            <span className={showMistake ? "text-rose-400 font-black ml-1" : "text-emerald-400 font-black ml-1"}>
              {showMistake ? "هشدار Muscle & Motion:" : "نکته مربی:"}
            </span>
            {showMistake ? anatomyInfo.mistakeCue : anatomyInfo.correctCue}
          </p>
        </div>
      </div>

      {/* Bottom Camera View Presets & Zoom */}
      <div className="absolute bottom-3 inset-x-3 flex justify-between items-center z-20 pointer-events-none">
        {/* Preset Angle Buttons */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1 rounded-2xl shadow-lg">
          {(["3d", "front", "side", "back", "top"] as const).map(angle => (
            <button
              key={angle}
              onClick={() => applyViewAngle(angle)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-xl transition-all ${
                viewAngle === angle 
                  ? "bg-emerald-500 text-slate-950 shadow-md" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {angle === "3d" ? "سه بعدی" : angle === "front" ? "روبرو" : angle === "side" ? "جانبی" : angle === "back" ? "پشت" : "دید بالا"}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1 rounded-2xl shadow-lg">
          <button 
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.2))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
            title="بزرگ‌نمایی"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono font-bold text-slate-400 px-1">{Math.round(zoomLevel * 100)}%</span>
          <button 
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
            title="کوچک‌نمایی"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

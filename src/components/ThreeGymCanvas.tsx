import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function ThreeGymCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSection, setSelectedSection] = useState<string>("cardio");
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // High-fidelity descriptions of the 3D sections
  const sectionDescriptions: Record<string, { title: string; desc: string; icon: string }> = {
    cardio: {
      title: "منطقه کاردیو و هوازی (Cardio Zone)",
      desc: "مجهز به تردمیل‌های هوشمند سه بعدی، دوچرخه‌های ثابت با مانیتور لمسی و الپتیکال‌های حرفه‌ای متصل به سنسور هوشمند ضربان قلب.",
      icon: "🏃‍♂️"
    },
    weight: {
      title: "بخش وزنه‌های آزاد و دمبل (Free Weights)",
      desc: "دارای دمبل‌های اورتان سنگین، هالترهای المپیک، میزهای مدرن چندحالته و کفپوش‌های گرانول با قابلیت ضربه‌گیری بالا.",
      icon: "🏋️‍♂️"
    },
    boxing: {
      title: "رینگ رزمی و کیسه بوکس (Martial Arts)",
      desc: "مجهز به کیسه بوکس‌های آویز چرمی، رینگ چوبی تمرینی و فضایی اختصاصی جهت تمرینات هیت، کراس‌فیت و آمادگی دفاعی.",
      icon: "🥊"
    }
  };

  useEffect(() => {
    if (!webglSupported || !containerRef.current) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let animationFrameId: number;
    let resizeObserver: ResizeObserver;

    try {
      // --- 1. SETUP Scene, Camera & WebGL Renderer ---
      scene = new THREE.Scene();
      sceneRef.current = scene;
      // Set a deep elegant space background
      scene.background = new THREE.Color(0x0a0f1d);
      // Add subtle ambient fog for premium depth
      scene.fog = new THREE.FogExp2(0x0a0f1d, 0.04);

      camera = new THREE.PerspectiveCamera(
        45,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        100
      );
      cameraRef.current = camera;
      camera.position.set(10, 8, 14);
      camera.lookAt(0, 1, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      rendererRef.current = renderer;
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Clear previous children
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(renderer.domElement);
    } catch (e) {
      console.warn("WebGL Renderer creation failed, falling back to clean 2D vector view.", e);
      setWebglSupported(false);
      return;
    }

    // --- 2. LIGHTING (Premium Neon Atmosphere) ---
    const ambientLight = new THREE.AmbientLight(0x2d3748, 0.6);
    scene.add(ambientLight);

    // Dynamic directional light (sun/ceiling)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Neon LED linear light (Cyberpunk Accent)
    const neonPinkLight = new THREE.PointLight(0xf43f5e, 2, 20);
    neonPinkLight.position.set(-4, 4, -4);
    scene.add(neonPinkLight);

    const neonCyanLight = new THREE.PointLight(0x06b6d4, 2.5, 20);
    neonCyanLight.position.set(4, 4, 4);
    scene.add(neonCyanLight);

    // --- 3. CREATE THE GYM ENVIRONMENT ---

    // Floor (Granite/Rubber gym mats)
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.7,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid Floor Overlay
    const gridHelper = new THREE.GridHelper(30, 30, 0x1f2937, 0x111827);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Giant Gym Logo Sign (Glowing Cylinder at back wall)
    const logoSignGeo = new THREE.CylinderGeometry(2, 2, 0.3, 32);
    logoSignGeo.rotateX(Math.PI / 2);
    const logoSignMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.4,
      roughness: 0.2
    });
    const logoSign = new THREE.Mesh(logoSignGeo, logoSignMat);
    logoSign.position.set(0, 5, -8);
    scene.add(logoSign);

    // Columns/Pillars at corner
    const pillarGeo = new THREE.BoxGeometry(1.5, 8, 1.5);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
    
    const p1 = new THREE.Mesh(pillarGeo, pillarMat);
    p1.position.set(-7, 4, -7);
    scene.add(p1);

    const p2 = new THREE.Mesh(pillarGeo, pillarMat);
    p2.position.set(7, 4, -7);
    scene.add(p2);

    // --- 4. 3D GYM MODELS (Procedurally constructed using geometries) ---

    // Object Group for animations
    const interactiveGroup = new THREE.Group();
    scene.add(interactiveGroup);

    // --- Model A: CARDIO ZONE (Treadmill) ---
    const cardioGroup = new THREE.Group();
    cardioGroup.position.set(-3.5, 0, 0);
    interactiveGroup.add(cardioGroup);

    // Treadmill Deck
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.3, 3.4),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5, metalness: 0.2 })
    );
    deck.position.y = 0.15;
    deck.castShadow = true;
    deck.receiveShadow = true;
    cardioGroup.add(deck);

    // Belt (Moving plane representation)
    const belt = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 2.8),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 })
    );
    belt.rotation.x = -Math.PI / 2;
    belt.position.set(0, 0.31, 0.1);
    cardioGroup.add(belt);

    // Console posts
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 12);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.8, roughness: 0.2 });
    
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(-0.8, 1, -1.2);
    leftPost.rotation.z = -0.1;
    cardioGroup.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(0.8, 1, -1.2);
    rightPost.rotation.z = 0.1;
    cardioGroup.add(rightPost);

    // Control Screen Console
    const screenConsole = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.6, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 })
    );
    screenConsole.position.set(0, 1.8, -1.2);
    screenConsole.rotation.x = 0.2;
    cardioGroup.add(screenConsole);

    // Neon Glowing Touchscreen
    const screenTouch = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.6
      })
    );
    screenTouch.position.set(0, 1.8, -1.09);
    screenTouch.rotation.x = 0.2;
    cardioGroup.add(screenTouch);


    // --- Model B: WEIGHT ZONE (Dumbbell rack and giant dumbbell) ---
    const weightGroup = new THREE.Group();
    weightGroup.position.set(3.5, 0, -1);
    interactiveGroup.add(weightGroup);

    // Barbell stand
    const rackBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.15, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4 })
    );
    rackBase.position.y = 0.075;
    weightGroup.add(rackBase);

    // Vertical metal columns
    const rackCol1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 1.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.1 })
    );
    rackCol1.position.set(-1, 0.7, 0);
    weightGroup.add(rackCol1);

    const rackCol2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 1.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.1 })
    );
    rackCol2.position.set(1, 0.7, 0);
    weightGroup.add(rackCol2);

    // Barbell Rod
    const barRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 3, 12),
      new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.95, roughness: 0.05 })
    );
    barRod.rotation.z = Math.PI / 2;
    barRod.position.set(0, 1.4, 0);
    weightGroup.add(barRod);

    // Weight Plates
    const plateGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 32);
    plateGeo.rotateZ(Math.PI / 2);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });

    // Left Plates
    const plateL1 = new THREE.Mesh(plateGeo, plateMat);
    plateL1.position.set(-1.1, 1.4, 0);
    weightGroup.add(plateL1);

    const plateL2 = new THREE.Mesh(plateGeo, plateMat);
    plateL2.position.set(-1.28, 1.4, 0);
    plateL2.scale.set(1, 0.9, 0.9);
    weightGroup.add(plateL2);

    // Right Plates
    const plateR1 = new THREE.Mesh(plateGeo, plateMat);
    plateR1.position.set(1.1, 1.4, 0);
    weightGroup.add(plateR1);

    const plateR2 = new THREE.Mesh(plateGeo, plateMat);
    plateR2.position.set(1.28, 1.4, 0);
    plateR2.scale.set(1, 0.9, 0.9);
    weightGroup.add(plateR2);


    // --- Model C: BOXING ZONE (Punching bag & mat) ---
    const boxingGroup = new THREE.Group();
    boxingGroup.position.set(0, 0, 3.5);
    interactiveGroup.add(boxingGroup);

    // Red martial arts floor circle mat
    const ringMat = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 0.05, 32),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 })
    );
    ringMat.position.y = 0.025;
    ringMat.receiveShadow = true;
    boxingGroup.add(ringMat);

    // Heavy punching bag
    const bagGeo = new THREE.CylinderGeometry(0.42, 0.42, 2.2, 24);
    const bagMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.3,
      metalness: 0.1
    });
    const bag = new THREE.Mesh(bagGeo, bagMat);
    bag.position.set(0, 1.8, 0);
    bag.castShadow = true;
    boxingGroup.add(bag);

    // Leather stripes on the bag
    const stripeGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.15, 24);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });
    const stripeTop = new THREE.Mesh(stripeGeo, stripeMat);
    stripeTop.position.set(0, 2.7, 0);
    boxingGroup.add(stripeTop);

    const stripeBottom = new THREE.Mesh(stripeGeo, stripeMat);
    stripeBottom.position.set(0, 0.9, 0);
    boxingGroup.add(stripeBottom);

    // Hanging chains
    const chainGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
    const chainMat = new THREE.MeshStandardMaterial({ color: 0xa1a1aa, metalness: 0.9 });
    
    const chain1 = new THREE.Mesh(chainGeo, chainMat);
    chain1.position.set(0, 3.2, 0);
    boxingGroup.add(chain1);


    // --- 5. ANIMATION LOOP ---
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();

      // Slow dynamic camera orbit around gym
      camera.position.x = 10 * Math.cos(elapsedTime * 0.12) + 2;
      camera.position.z = 10 * Math.sin(elapsedTime * 0.12) + 2;
      camera.lookAt(0, 1.5, 0);

      // Procedural animations based on selection
      if (selectedSection === "cardio") {
        // Vibrate treadmill screen and oscillate lights to show activity
        screenTouch.material.emissiveIntensity = 0.5 + Math.sin(elapsedTime * 10) * 0.15;
        cardioGroup.scale.set(1, 1 + Math.sin(elapsedTime * 12) * 0.005, 1);
      } else {
        screenTouch.material.emissiveIntensity = 0.4;
      }

      if (selectedSection === "weight") {
        // Slow rotation/levitation of barbell to emphasize weight training
        weightGroup.position.y = Math.sin(elapsedTime * 3) * 0.1;
      } else {
        weightGroup.position.y = 0;
      }

      if (selectedSection === "boxing") {
        // Sway the punch bag gently
        bag.rotation.z = Math.sin(elapsedTime * 2.5) * 0.15;
        bag.rotation.x = Math.cos(elapsedTime * 2.5) * 0.08;
        chain1.rotation.z = Math.sin(elapsedTime * 2.5) * 0.15;
      } else {
        bag.rotation.set(0, 0, 0);
        chain1.rotation.set(0, 0, 0);
      }

      // Render Scene
      renderer.render(scene, camera);
    };

    animate();

    // --- 6. RESPONSIVE CONTAINER RESIZE HANDLING (ResizeObserver) ---
    resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (rendererRef.current && cameraRef.current) {
          rendererRef.current.setSize(width, height);
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    // CLEANUP on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [selectedSection]);

  return (
    <div className="space-y-12 w-full animate-fade-in" dir="rtl">
      {/* 3D Section Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-center bg-slate-950/40 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
      
      {/* 3D Canvas display container / Vector Radar Fallback */}
      <div className="lg:col-span-7 space-y-4">
        <div 
          className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bg-slate-950 h-[380px]" 
          ref={webglSupported ? containerRef : null}
        >
          {/* ThreeJS renders inside here in WebGL mode */}

          {/* Elegant 2D Interactive Vector / Radar Fallback */}
          {!webglSupported && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950 text-right font-sans select-none overflow-hidden" dir="rtl">
              
              {/* Dynamic Scanline & Radar HUD Decoration */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.03),transparent_70%)] pointer-events-none"></div>
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(16,185,129,0.15)_98%,rgba(16,185,129,0.2)_100%)] bg-[length:100%_40px] animate-scanline pointer-events-none opacity-35"></div>
              
              <style>{`
                @keyframes scanline {
                  0% { transform: translateY(-380px); }
                  100% { transform: translateY(380px); }
                }
                @keyframes treadmill-belt {
                  0% { stroke-dashoffset: 0; }
                  100% { stroke-dashoffset: -20; }
                }
                @keyframes pulse-wave {
                  0% { stroke-dashoffset: 100; }
                  100% { stroke-dashoffset: 0; }
                }
                @keyframes barbell-lift {
                  0%, 100% { transform: translateY(10px); }
                  50% { transform: translateY(-20px); }
                }
                @keyframes punching-bag-sway {
                  0%, 100% { transform: rotate(-6deg); }
                  50% { transform: rotate(6deg); }
                }
                .animate-scanline {
                  animation: scanline 4s linear infinite;
                }
                .animate-treadmill-belt {
                  animation: treadmill-belt 0.6s linear infinite;
                }
                .animate-pulse-wave {
                  animation: pulse-wave 2s linear infinite;
                }
                .animate-barbell-lift {
                  animation: barbell-lift 2s ease-in-out infinite;
                }
                .animate-punching-bag-sway {
                  animation: punching-bag-sway 1.8s ease-in-out infinite;
                  transform-origin: top center;
                }
              `}</style>

              {/* Vector Graphic HUD Header */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-[9px] font-mono tracking-widest text-emerald-500/60 border-b border-emerald-500/10 pb-2">
                <span>[ STATUS: DEEP SCAN ACTIVE ]</span>
                <span className="flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  VECTOR RADAR ENGINE v2.0
                </span>
              </div>

              {/* Central Schematic Display */}
              <div className="w-full flex-1 flex items-center justify-center relative mt-4">
                
                {selectedSection === "cardio" && (
                  <div className="flex flex-col items-center gap-6 animate-fade-in">
                    {/* SVG Treadmill Schematic */}
                    <svg width="240" height="150" viewBox="0 0 240 150" fill="none" className="drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                      {/* Grid Background */}
                      <path d="M10 110 L230 110" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                      
                      {/* Frame Structure */}
                      <path d="M40 110 L200 110 L195 125 L35 125 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                      
                      {/* Treadmill Moving Belt dashes */}
                      <path d="M42 118 L192 118" stroke="#06b6d4" strokeWidth="4" strokeDasharray="8 6" className="animate-treadmill-belt" />
                      
                      {/* Front posts & screen support */}
                      <path d="M50 110 L75 40 L100 40" stroke="#64748b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      
                      {/* Console / Monitor Screen */}
                      <rect x="90" y="20" width="35" height="25" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                      <line x1="95" y1="28" x2="120" y2="28" stroke="#06b6d4" strokeWidth="2" strokeDasharray="2 2" className="animate-pulse" />
                      <line x1="95" y1="34" x2="110" y2="34" stroke="#06b6d4" strokeWidth="1.5" />
                      
                      {/* Pulse Sensor Graph */}
                      <path d="M10 70 L50 70 L60 50 L70 90 L80 65 L90 70 L130 70" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" strokeDashoffset="100" className="animate-pulse-wave" />
                    </svg>

                    {/* Quick Specs Dashboard overlay */}
                    <div className="flex gap-6 text-[10px] text-slate-400 font-mono bg-slate-900/80 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                      <span className="flex items-center gap-1"><span className="text-cyan-400 font-bold">SPEED:</span> 12.5 KM/H</span>
                      <span className="flex items-center gap-1"><span className="text-cyan-400 font-bold">CAL:</span> 450 KCAL</span>
                      <span className="flex items-center gap-1"><span className="text-cyan-400 font-bold">INCL:</span> 4.0 %</span>
                    </div>
                  </div>
                )}

                {selectedSection === "weight" && (
                  <div className="flex flex-col items-center gap-6 animate-fade-in">
                    {/* SVG Barbell/Weights Schematic */}
                    <svg width="240" height="150" viewBox="0 0 240 150" fill="none" className="drop-shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                      {/* Rack Support Base */}
                      <path d="M50 120 L190 120" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                      <path d="M80 120 L80 60" stroke="#475569" strokeWidth="3" />
                      <path d="M160 120 L160 60" stroke="#475569" strokeWidth="3" />
                      <path d="M75 60 L85 60 M155 60 L165 60" stroke="#64748b" strokeWidth="2" />
                      
                      {/* Hovering Barbell Group */}
                      <g className="animate-barbell-lift">
                        {/* Barbell Rod */}
                        <path d="M30 50 L210 50" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
                        
                        {/* Left Plates */}
                        <rect x="52" y="25" width="10" height="50" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                        <rect x="42" y="30" width="8" height="40" rx="2" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />
                        <rect x="34" y="35" width="6" height="30" rx="1" fill="#0f172a" stroke="#b45309" strokeWidth="1" />
                        
                        {/* Right Plates */}
                        <rect x="178" y="25" width="10" height="50" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                        <rect x="190" y="30" width="8" height="40" rx="2" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />
                        <rect x="200" y="35" width="6" height="30" rx="1" fill="#0f172a" stroke="#b45309" strokeWidth="1" />

                        {/* Power flow lines */}
                        <path d="M120 40 L120 20" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" className="animate-pulse" />
                        <polygon points="120,12 124,20 116,20" fill="#f59e0b" />
                      </g>
                    </svg>

                    {/* Quick Specs Dashboard overlay */}
                    <div className="flex gap-6 text-[10px] text-slate-400 font-mono bg-slate-900/80 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                      <span className="flex items-center gap-1"><span className="text-amber-400 font-bold">LOAD:</span> 80 KG</span>
                      <span className="flex items-center gap-1"><span className="text-amber-400 font-bold">REPS:</span> 4 / 5 SETS</span>
                      <span className="flex items-center gap-1"><span className="text-emerald-400 font-bold">SENSOR:</span> ON</span>
                    </div>
                  </div>
                )}

                {selectedSection === "boxing" && (
                  <div className="flex flex-col items-center gap-6 animate-fade-in">
                    {/* SVG Punching Bag Schematic */}
                    <svg width="240" height="150" viewBox="0 0 240 150" fill="none" className="drop-shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                      {/* Top Ceiling Plate */}
                      <path d="M100 10 L140 10" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                      
                      {/* Swaying Bag Group */}
                      <g className="animate-punching-bag-sway">
                        {/* Hanging Chains */}
                        <line x1="120" y1="12" x2="110" y2="45" stroke="#94a3b8" strokeWidth="2" />
                        <line x1="120" y1="12" x2="130" y2="45" stroke="#94a3b8" strokeWidth="2" />
                        <line x1="120" y1="12" x2="120" y2="45" stroke="#64748b" strokeWidth="1.5" />
                        
                        {/* Punching Bag Body */}
                        <rect x="100" y="45" width="40" height="80" rx="10" fill="#1e293b" stroke="#f43f5e" strokeWidth="2.5" />
                        
                        {/* Leather straps */}
                        <line x1="100" y1="58" x2="140" y2="58" stroke="#f43f5e" strokeWidth="2" />
                        <line x1="100" y1="112" x2="140" y2="112" stroke="#f43f5e" strokeWidth="2" />
                        
                        {/* Target Zones */}
                        <circle cx="120" cy="75" r="4" fill="none" stroke="#f43f5e" strokeWidth="1.5" className="animate-pulse" />
                        <circle cx="120" cy="95" r="4" fill="none" stroke="#f43f5e" strokeWidth="1.5" className="animate-pulse" />
                      </g>
                    </svg>

                    {/* Quick Specs Dashboard overlay */}
                    <div className="flex gap-6 text-[10px] text-slate-400 font-mono bg-slate-900/80 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                      <span className="flex items-center gap-1"><span className="text-rose-400 font-bold">FORCE:</span> 420 JOULE</span>
                      <span className="flex items-center gap-1"><span className="text-rose-400 font-bold">COUNT:</span> 180 IMPACTS</span>
                      <span className="flex items-center gap-1"><span className="text-cyan-400 font-bold">REACT:</span> 0.30s</span>
                    </div>
                  </div>
                )}

              </div>

              {/* HUD Footer status info */}
              <div className="absolute bottom-4 left-4 right-4 text-center text-[9px] text-slate-500 font-mono">
                [ DYNAMIC SIMULATOR INTERFACE ONLINE // INTERACTIVE OVERLAYS LOADED ]
              </div>

            </div>
          )}
        </div>
        
        {/* Interactive controller tags */}
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setSelectedSection("cardio")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              selectedSection === "cardio" 
                ? "bg-cyan-500/10 border-cyan-500 text-cyan-400" 
                : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-300"
            }`}
          >
            🏃‍♂️ تردمیل و بخش هوازی
          </button>
          <button
            onClick={() => setSelectedSection("weight")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              selectedSection === "weight" 
                ? "bg-amber-500/10 border-amber-500 text-amber-400" 
                : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-300"
            }`}
          >
            🏋️‍♂️ وزنه‌های آزاد و هالتر
          </button>
          <button
            onClick={() => setSelectedSection("boxing")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              selectedSection === "boxing" 
                ? "bg-rose-500/10 border-rose-500 text-rose-400" 
                : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-300"
            }`}
          >
            🥊 رینگ رزمی و کیسه بوکس
          </button>
        </div>
      </div>

      {/* Narrative block explaining the selected 3D section */}
      <div className="lg:col-span-5 space-y-5 text-right">
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 block bg-emerald-500/10 px-3 py-1.5 rounded-full inline-block">
            {webglSupported ? "تجربه تور مجازی ۳ بعدی باشگاه (Real-time 3D Engine)" : "تجربه شبیه‌ساز شماتیک باشگاه (Schematic Radar Mode)"}
          </span>
          <h3 className="text-2xl font-black text-white leading-tight">
            کلوپ هوشمند را با جزییات به صورت زنده بررسی کنید!
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {webglSupported 
              ? "با کشیدن ماوس روی محیط ۳ بعدی روبرو، دوربین را حول فضای شبیه‌سازی شده باشگاه بچرخانید و با انتخاب دکمه‌ها بخش‌های گوناگون تجهیزات مجهز اسمارت‌جیم را به صورت زنده تماشا کنید."
              : "بررسی هوشمند ساختار بخش‌های تمرینی باشگاه از طریق سنسورهای بیومتریک و نقشه‌نگاری شماتیک. با زدن دکمه‌های کنترلی، نقشه‌های فنی دستگاه‌ها را تماشا کنید."}
          </p>
        </div>

        {/* Selected section description card */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 space-y-3 relative overflow-hidden animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{sectionDescriptions[selectedSection].icon}</span>
            <h4 className="font-extrabold text-white text-sm">
              {sectionDescriptions[selectedSection].title}
            </h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {sectionDescriptions[selectedSection].desc}
          </p>
          <div className="flex items-center gap-2.5 text-[10px] text-emerald-400 font-bold bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
            <span>🟢 هم‌اکنون فعال در نسخه شعبه‌های VIP اسمارت جیم</span>
          </div>
        </div>
      </div>
    </div>

      {/* TWO PERSONS COMPARISON SECTION */}
      <div className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-sm space-y-8 text-right">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 block bg-blue-500/10 px-3 py-1.5 rounded-full inline-block mx-auto">
            مقایسه روش سنتی (دفترچه کاغذی) در برابر روش مدرن (اسمارت جیم)
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            کدام مسیر را برای سلامتی خود انتخاب می‌کنید؟
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            تفاوت واقعی بین کلافگی مکرر با روش‌های قدیمی کاغذی و تمرین لذت‌بخش و هدفمند به کمک فناوری پیشرفته و اپلیکیشن اسمارت‌جیم.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Card 1: Frustrated Traditional User (Paper program) */}
          <div className="bg-red-950/10 border border-red-500/15 p-6 rounded-3xl space-y-6 relative overflow-hidden group hover:border-red-500/30 transition-all shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -z-10"></div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl">
                😰
              </div>
              <div>
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">روش قدیمی و خسته‌کننده</span>
                <h4 className="text-lg font-black text-white mt-1">رضا - کلافه با برنامه مچاله کاغذی</h4>
              </div>
            </div>

            {/* Simulated interactive schematic of traditional gym clutter */}
            <div className="h-[180px] bg-slate-950/80 rounded-2xl border border-red-500/10 flex items-center justify-center p-4 relative overflow-hidden">
              <svg width="240" height="140" viewBox="0 0 240 140" fill="none" className="opacity-80">
                {/* Background lines representing chaotic floor */}
                <line x1="10" y1="120" x2="230" y2="120" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="2" />
                
                {/* Crumpled paper schematic */}
                <g transform="translate(100, 25)">
                  <rect x="0" y="0" width="40" height="50" rx="3" fill="#334155" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="5" y1="10" x2="25" y2="10" stroke="#ef4444" strokeWidth="1.5" />
                  <line x1="5" y1="20" x2="35" y2="20" stroke="#ef4444" strokeWidth="1.5" />
                  <line x1="5" y1="30" x2="20" y2="30" stroke="#ef4444" strokeWidth="1.5" />
                  <line x1="5" y1="40" x2="30" y2="40" stroke="#475569" strokeWidth="1" />
                  {/* Water drop stain */}
                  <circle cx="30" cy="30" r="5" fill="#ef4444" fillOpacity="0.3" />
                  {/* Crumple effect lines */}
                  <path d="M-5 15 L15 10 M35 45 L45 35 M20 -5 L25 15" stroke="#ef4444" strokeWidth="1" />
                </g>

                {/* Question mark / frustration clouds */}
                <circle cx="150" cy="35" r="8" fill="rgba(239, 68, 68, 0.05)" stroke="rgba(239, 68, 68, 0.2)" />
                <text x="148" y="39" fill="#ef4444" fontSize="12" fontWeight="bold">؟</text>

                <circle cx="80" cy="40" r="10" fill="rgba(239, 68, 68, 0.05)" stroke="rgba(239, 68, 68, 0.2)" />
                <text x="77" y="44" fill="#ef4444" fontSize="14" fontWeight="bold">!</text>

                {/* Floor weights messy representation */}
                <circle cx="50" cy="115" r="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <circle cx="190" cy="118" r="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <line x1="45" y1="115" x2="55" y2="115" stroke="#ef4444" strokeWidth="1.5" />
              </svg>
              
              <div className="absolute bottom-3 left-3 right-3 text-center text-[9px] font-mono text-red-400">
                ⚠️ [ خطا: سردرگمی مکرر، اتلاف وقت تمرین ]
              </div>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 mt-0.5 font-bold">✕</span>
                <span>برنامه کاغذی به سادگی کثیف، خیس، گم یا مچاله می‌شود و باید مجدد چاپ شود.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 mt-0.5 font-bold">✕</span>
                <span>تصویری از فرم صحیح حرکات وجود ندارد؛ ترس همیشگی از آسیب‌دیدگی مفاصل.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 mt-0.5 font-bold">✕</span>
                <span>محاسبه دستی زمان استراحت و گم شدن حساب ست‌ها به دلیل حواس‌پرتی یا چک کردن تلگرام.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 mt-0.5 font-bold">✕</span>
                <span>هیچگونه تحلیل بیومتریک یا نموداری از پیشرفت عضلانی و افزایش رکوردها وجود ندارد.</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Happy Smart Gym App User */}
          <div className="bg-emerald-950/10 border border-emerald-500/15 p-6 rounded-3xl space-y-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl">
                😎
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">تمرین هوشمند و مدرن</span>
                <h4 className="text-lg font-black text-white mt-1">امین - آسوده با اپلیکیشن اسمارت‌جیم</h4>
              </div>
            </div>

            {/* Simulated interactive active mobile app screen layout */}
            <div className="h-[180px] bg-slate-950/80 rounded-2xl border border-emerald-500/10 flex items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.04),transparent_60%)]"></div>
              
              <svg width="240" height="140" viewBox="0 0 240 140" fill="none">
                {/* Clean device mockup frame inside graphic */}
                <rect x="75" y="10" width="90" height="120" rx="12" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                <rect x="110" y="15" width="20" height="4" rx="2" fill="#10b981" fillOpacity="0.4" />
                
                {/* Interactive graphs inside simulated screen */}
                <g transform="translate(85, 30)">
                  {/* Exercise animation placeholder mock */}
                  <rect x="0" y="0" width="70" height="40" rx="6" fill="#1e293b" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" className="animate-pulse" />
                  <circle cx="35" cy="20" r="10" stroke="#10b981" strokeWidth="1.5" fill="none" />
                  <line x1="35" y1="10" x2="35" y2="30" stroke="#10b981" strokeWidth="1.5" />
                  
                  {/* Pulse rate wave below */}
                  <path d="M5 65 L20 65 L25 50 L30 80 L35 60 L40 65 L65 65" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="5" y="90" fill="#10b981" fontSize="7" fontFamily="monospace" fontWeight="bold">HR: 132 BPM</text>
                  
                  {/* Step progress bullets */}
                  <circle cx="10" cy="100" r="2" fill="#10b981" />
                  <circle cx="20" cy="100" r="2" fill="#10b981" />
                  <circle cx="30" cy="100" r="2" fill="#10b981" />
                  <circle cx="40" cy="100" r="2" fill="#334155" />
                  <circle cx="50" cy="100" r="2" fill="#334155" />
                </g>

                {/* Connectors and network nodes to represented athlete data */}
                <path d="M165 70 L210 70" stroke="rgba(16,185,129,0.2)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="210" cy="70" r="3" fill="#10b981" />
                <text x="180" y="64" fill="#10b981" fontSize="6" fontFamily="monospace">SYNCED</text>
              </svg>

              <div className="absolute bottom-3 left-3 right-3 text-center text-[9px] font-mono text-emerald-400">
                ✨ [ فعال: تایمر خودکار، راهنمای ویدئویی و همگام‌سازی ابری ]
              </div>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 font-bold">✓</span>
                <span>دسترسی دائم به برنامه تمرینی از روی موبایل و همگام‌سازی لحظه‌ای با مربی.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 font-bold">✓</span>
                <span>انیمیشن سه‌بعدی و فیلم فرم‌های صحیح حرکتی، عاری از هرگونه اشتباه بیومکانیکی.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 font-bold">✓</span>
                <span>تایمر معکوس و هوشمند بعد از زدن پایان ست با ویبره هوشمند اتمام زمان استراحت.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-500 mt-0.5 font-bold">✓</span>
                <span>تحلیل دقیق پیشرفت، لاگ وزنه‌ها و رکوردهای قدرت با خروجی نمودارهای زیبا.</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Hero3DCanvasProps {
  className?: string;
}

export default function Hero3DCanvas({ className = "" }: Hero3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (e) {
      console.warn("[3D Experience] WebGL not supported, falling back to CSS 3D representation.", e);
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 460;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 9);
    camera.lookAt(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    directionalLight.position.set(6, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    const blueLight = new THREE.PointLight(0x2563eb, 3.5, 18);
    blueLight.position.set(-6, -2, 4);
    scene.add(blueLight);

    const amberLight = new THREE.PointLight(0xf59e0b, 3.0, 15);
    amberLight.position.set(5, 3, -3);
    scene.add(amberLight);

    const tealLight = new THREE.PointLight(0x0d9488, 2.0, 12);
    tealLight.position.set(0, 5, -2);
    scene.add(tealLight);

    // Main 3D Pivot Group
    const ecosystemGroup = new THREE.Group();
    scene.add(ecosystemGroup);

    // 1. Central Globe (Trade Network Core)
    const globeRadius = 1.9;
    const globeGeom = new THREE.SphereGeometry(globeRadius, 28, 28);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x0a1f44,
      roughness: 0.7,
      metalness: 0.3,
      transparent: true,
      opacity: 0.92,
    });
    const globe = new THREE.Mesh(globeGeom, globeMat);
    ecosystemGroup.add(globe);

    // Wireframe Outer Latitude/Longitude Cage
    const wireGeom = new THREE.WireframeGeometry(new THREE.SphereGeometry(globeRadius * 1.03, 16, 16));
    const wireMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.35 });
    const wireSphere = new THREE.LineSegments(wireGeom, wireMat);
    ecosystemGroup.add(wireSphere);

    // 2. Shipping Containers (Industrial Logistics representation)
    const containerGroup = new THREE.Group();
    ecosystemGroup.add(containerGroup);

    const containerMatBlue = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4, metalness: 0.6 });
    const containerMatNavy = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.5 });
    const containerMatAmber = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.4 });

    const createContainer = (x: number, y: number, z: number, rx: number, ry: number, mat: THREE.Material) => {
      const geom = new THREE.BoxGeometry(0.7, 0.35, 0.4);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, ry, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    const c1 = createContainer(1.8, 1.2, 1.2, 0.2, 0.4, containerMatAmber);
    const c2 = createContainer(2.1, 0.7, 0.9, -0.1, 0.8, containerMatBlue);
    const c3 = createContainer(-1.9, 1.4, 0.8, 0.3, -0.5, containerMatNavy);
    const c4 = createContainer(-2.2, 0.8, 0.4, 0.1, -0.8, containerMatBlue);
    containerGroup.add(c1, c2, c3, c4);

    // 3. 3D Packages & Cartons with Ribbons
    const packageGroup = new THREE.Group();
    ecosystemGroup.add(packageGroup);

    const pkgGeom = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const pkgMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6, metalness: 0.2 });
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.8 });

    const createPackage = (x: number, y: number, z: number) => {
      const pkg = new THREE.Group();
      const box = new THREE.Mesh(pkgGeom, pkgMat);
      box.castShadow = true;
      pkg.add(box);

      const ribbon1 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.08), ribbonMat);
      const ribbon2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.44), ribbonMat);
      pkg.add(ribbon1, ribbon2);

      pkg.position.set(x, y, z);
      return pkg;
    };

    const p1 = createPackage(1.5, -1.6, 1.4);
    const p2 = createPackage(-1.4, -1.7, 1.3);
    const p3 = createPackage(0.4, 2.4, 1.0);
    packageGroup.add(p1, p2, p3);

    // 4. Trade Route Arcs (Connecting Nodes)
    const curve1 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.5, 1.8, 0.8),
      new THREE.Vector3(2.6, 2.8, 0.5),
      new THREE.Vector3(1.8, 1.2, 1.2)
    );
    const curve2 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.9, 1.4, 0.8),
      new THREE.Vector3(-2.8, 2.4, -0.4),
      new THREE.Vector3(0.4, 2.4, 1.0)
    );
    const curve3 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.4, -1.7, 1.3),
      new THREE.Vector3(0.2, -2.6, 1.8),
      new THREE.Vector3(1.5, -1.6, 1.4)
    );

    const arcMat = new THREE.LineDashedMaterial({
      color: 0x60a5fa,
      dashSize: 0.15,
      gapSize: 0.08,
      linewidth: 2,
    });

    const addArc = (curve: THREE.Curve<THREE.Vector3>) => {
      const points = curve.getPoints(50);
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geom, arcMat);
      line.computeLineDistances();
      ecosystemGroup.add(line);
      return line;
    };

    addArc(curve1);
    addArc(curve2);
    addArc(curve3);

    // 5. Flowing Particle Pulses Along Routes
    const particleCount = 45;
    const particleGeom = new THREE.SphereGeometry(0.045, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const particles: { mesh: THREE.Mesh; curve: THREE.Curve<THREE.Vector3>; t: number; speed: number }[] = [];

    const curves = [curve1, curve2, curve3];
    for (let i = 0; i < particleCount; i++) {
      const c = curves[i % curves.length];
      const pMesh = new THREE.Mesh(particleGeom, particleMat);
      ecosystemGroup.add(pMesh);
      particles.push({
        mesh: pMesh,
        curve: c,
        t: Math.random(),
        speed: 0.003 + Math.random() * 0.005,
      });
    }

    // 6. Network Nodes (Floating Spheres with Orbital Rings)
    const nodeGeom = new THREE.SphereGeometry(0.14, 16, 16);
    const nodeMatTeal = new THREE.MeshStandardMaterial({
      color: 0x0d9488,
      emissive: 0x0d9488,
      emissiveIntensity: 0.5,
      roughness: 0.2,
    });
    const nodeMatGold = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.4,
      roughness: 0.2,
    });

    const createNode = (x: number, y: number, z: number, mat: THREE.Material) => {
      const g = new THREE.Group();
      const sphere = new THREE.Mesh(nodeGeom, mat);
      g.add(sphere);

      const ringGeom = new THREE.RingGeometry(0.2, 0.26, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2;
      g.add(ring);

      g.position.set(x, y, z);
      ecosystemGroup.add(g);
      return g;
    };

    const n1 = createNode(0.5, 1.8, 0.8, nodeMatTeal);
    const n2 = createNode(-1.9, 1.4, 0.8, nodeMatGold);
    const n3 = createNode(1.5, -1.6, 1.4, nodeMatTeal);

    // Mouse Pointer Parallax Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const relX = event.clientX - rect.left - rect.width / 2;
      const relY = event.clientY - rect.top - rect.height / 2;
      mouseX = (relX / rect.width) * 2;
      mouseY = (relY / rect.height) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Intersection Observer to pause rendering when off-screen
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    // Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 540;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth damped rotation towards cursor on desktop
      if (!prefersReducedMotion) {
        targetRotationY += 0.003; // Gentle ambient orbital drift
        targetRotationX = mouseY * 0.25;
        targetRotationY += (mouseX * 0.35 - ecosystemGroup.rotation.y) * 0.03;

        ecosystemGroup.rotation.x += (targetRotationX - ecosystemGroup.rotation.x) * 0.05;
        ecosystemGroup.rotation.y += 0.002;

        // Floating ambient movement for packages & nodes
        p1.position.y = -1.6 + Math.sin(elapsed * 1.5) * 0.08;
        p2.position.y = -1.7 + Math.cos(elapsed * 1.3) * 0.08;
        p3.position.y = 2.4 + Math.sin(elapsed * 1.7) * 0.06;

        n1.rotation.y += 0.02;
        n2.rotation.y -= 0.015;
        n3.rotation.y += 0.02;

        // Animate particles along curves
        particles.forEach((p) => {
          p.t += p.speed;
          if (p.t > 1) p.t = 0;
          const pos = p.curve.getPoint(p.t);
          p.mesh.position.copy(pos);
        });
      }

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative w-full h-[400px] lg:h-[480px] flex items-center justify-center select-none ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full flex items-center justify-center" aria-label="Interactive 3D B2B Trade Ecosystem" />

      {/* Floating Micro-Badges on top of 3D Canvas */}
      <div className="absolute top-4 left-4 bg-[#0A1F44]/90 backdrop-blur-md border border-[#F59E0B]/30 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 pointer-events-none transform hover:scale-105 transition-transform duration-300">
        <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488] animate-pulse" />
        <span className="font-['Inter'] text-xs font-semibold text-[#FFFFFF] tracking-wide">Pan-India Trade Grid</span>
      </div>

      <div className="absolute bottom-6 right-6 bg-[#0A1F44]/95 backdrop-blur-md border border-[#2563EB]/40 px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-3 pointer-events-none">
        <div className="w-7 h-7 rounded-lg bg-[#2563EB]/20 flex items-center justify-center text-[#93c5fd]">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#F59E0B] tracking-wider uppercase">Casagrand Royale HUB</div>
          <div className="text-xs font-semibold text-[#FFFFFF]">Direct Verified Dispatch</div>
        </div>
      </div>

      {/* CSS 3D Fallback if WebGL is disabled */}
      {!hasWebGL && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0A1F44] to-[#00081E] p-8 text-center rounded-2xl border border-[#CBD5E1]/20">
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#2563EB]/20 border border-[#F59E0B] flex items-center justify-center text-[#F59E0B]">
              <span className="text-2xl">🌐</span>
            </div>
            <h3 className="font-heading font-bold text-lg text-white">Interactive Trade Ecosystem</h3>
            <p className="font-['Inter'] text-xs text-[#CBD5E1] max-w-xs mx-auto">
              Direct B2B supply lines linking OEM factories, MSMEs, and verified enterprise procurement desks across India.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

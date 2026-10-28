import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Hero3DCanvasProps {
  className?: string;
}

// Utility: Parametric tilted circle on a sphere of given radius and Euler tilt angles
function getTiltedCirclePoint(angle: number, radius: number, tiltX: number, tiltZ: number): THREE.Vector3 {
  const p = new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle));
  p.applyAxisAngle(new THREE.Vector3(1, 0, 0), tiltX);
  p.applyAxisAngle(new THREE.Vector3(0, 0, 1), tiltZ);
  return p;
}

// ---------------------------------------------------------------------------
// 1. CLEAN HIGH-CONTRAST PROCEDURAL EARTH MAP TEXTURE
// ---------------------------------------------------------------------------
function createCleanEarthTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Deep oceanic midnight gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, "#030712");
  oceanGrad.addColorStop(0.3, "#071224");
  oceanGrad.addColorStop(0.7, "#08162b");
  oceanGrad.addColorStop(1, "#02050e");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle latitude & longitude graticules
  ctx.strokeStyle = "rgba(14, 165, 233, 0.08)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);

  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let lat = -90; lat <= 90; lat += 30) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  const mapPoint = (lat: number, lon: number): [number, number] => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  };

  const drawContinent = (
    points: [number, number][],
    glowColor = "rgba(6, 182, 212, 0.55)",
    fillColor = "#0E1E36",
    innerColor = "#162B4C"
  ) => {
    if (points.length < 3) return;

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    const [startX, startY] = mapPoint(points[0][0], points[0][1]);
    ctx.moveTo(startX, startY);
    for (let i = 1; i < points.length; i++) {
      const [px, py] = mapPoint(points[i][0], points[i][1]);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    for (let i = 1; i < points.length; i++) {
      const [px, py] = mapPoint(points[i][0], points[i][1]);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = innerColor;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.restore();
  };

  // Indian Subcontinent (Highlighted with warm orange coastline)
  drawContinent(
    [
      [36, 74], [34, 78], [30, 81], [27, 88], [24, 91], [22, 92], [21, 89], [22, 87],
      [19, 85], [16, 82], [13, 80], [10, 79], [8.3, 77.5], [8.5, 77.0], [11, 75.8],
      [15, 73.8], [19, 72.8], [21, 72.5], [23, 68.5], [24.5, 68.2], [28, 70], [32, 73], [35, 74]
    ],
    "rgba(255, 122, 0, 0.85)",
    "#182B48",
    "#21395E"
  );
  drawContinent([[9.8, 80.2], [8.5, 81.2], [6.0, 80.7], [6.8, 79.8], [8.5, 79.7]], "rgba(255, 122, 0, 0.7)", "#182B48");

  // Southeast Asia & Malay
  drawContinent([[22, 92], [22, 108], [11, 109], [8.5, 105], [13, 101], [1, 104], [3, 98], [14, 98], [21, 93]], "rgba(6, 182, 212, 0.5)", "#12243F");
  drawContinent([[5, 95], [2, 98], [-4, 105], [-6, 103], [0, 98]], "rgba(6, 182, 212, 0.4)", "#102038");
  drawContinent([[-6, 106], [-7, 114], [-8, 114], [-7, 106]], "rgba(6, 182, 212, 0.4)", "#102038");

  // East Asia & Japan
  drawContinent([[22, 108], [26, 120], [32, 121], [39, 118], [40, 124], [43, 131], [48, 135], [53, 120], [45, 100], [40, 80], [34, 78], [24, 91], [22, 108]], "rgba(6, 182, 212, 0.5)", "#13253F");
  drawContinent([[44, 143], [42, 141], [36, 138], [33, 131], [34, 135], [40, 141]], "rgba(6, 182, 212, 0.45)", "#13253F");

  // Middle East & Arabia
  drawContinent([[31, 35], [32, 40], [30, 48], [27, 50], [25, 55], [24, 57], [22, 59], [17, 54], [12.5, 44], [13, 43], [20, 39], [28, 34], [31, 35]], "rgba(245, 158, 11, 0.6)", "#15263D");

  // Europe & UK
  drawContinent([[36, -6], [43, -9], [48, -4], [50, 1], [54, 8], [58, 5], [62, 10], [70, 25], [60, 30], [55, 37], [45, 35], [41, 28], [37, 24], [38, 15], [44, 8], [38, 0], [36, -6]], "rgba(6, 182, 212, 0.5)", "#13243D");
  drawContinent([[50, -5], [54, -3], [58, -4], [56, -6], [51, -1]], "rgba(6, 182, 212, 0.45)", "#13243D");

  // Africa
  drawContinent([[36, -6], [37, 10], [32, 31], [28, 34], [12, 44], [11, 51], [0, 42], [-12, 40], [-26, 33], [-34, 26], [-34, 18], [-22, 14], [-5, 12], [4, 9], [6, 2], [5, -4], [14, -17], [21, -17], [28, -12], [35, -2], [36, -6]], "rgba(6, 182, 212, 0.45)", "#101F34");

  // North America
  drawContinent([[70, -160], [71, -125], [60, -75], [50, -55], [44, -65], [30, -81], [25, -80], [28, -96], [20, -97], [16, -92], [9, -78], [15, -92], [22, -106], [32, -117], [48, -124], [58, -140], [65, -168], [70, -160]], "rgba(6, 182, 212, 0.5)", "#122137");

  // South America
  drawContinent([[11, -74], [10, -62], [4, -51], [-3, -40], [-8, -35], [-23, -43], [-34, -53], [-53, -68], [-54, -72], [-40, -73], [-18, -71], [-5, -80], [2, -78], [11, -74]], "rgba(6, 182, 212, 0.5)", "#122137");

  // Australia
  drawContinent([[-12, 131], [-14, 136], [-12, 142], [-23, 151], [-33, 152], [-38, 147], [-37, 139], [-34, 115], [-22, 114], [-15, 124], [-12, 131]], "rgba(6, 182, 212, 0.5)", "#122137");

  // Clean glowing city lights at major trade nodes
  const drawCityPin = (lat: number, lon: number, color = "#FFB020") => {
    const [cx, cy] = mapPoint(lat, lon);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
    grad.addColorStop(0, color);
    grad.addColorStop(0.3, "rgba(255, 122, 0, 0.6)");
    grad.addColorStop(1, "rgba(255, 122, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  };

  drawCityPin(19.076, 72.877, "#FF7A00"); // Mumbai
  drawCityPin(28.613, 77.209, "#FF921F"); // Delhi
  drawCityPin(25.204, 55.27, "#38BDF8"); // Dubai
  drawCityPin(1.352, 103.819, "#38BDF8"); // Singapore
  drawCityPin(31.23, 121.473, "#38BDF8"); // Shanghai
  drawCityPin(50.11, 8.682, "#38BDF8"); // Frankfurt
  drawCityPin(40.712, -74.006, "#38BDF8"); // New York
  drawCityPin(34.052, -118.244, "#38BDF8"); // Los Angeles

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

// ---------------------------------------------------------------------------
// 2. 3D CARGO AIRPLANE MODEL (1 FLIGHT)
// ---------------------------------------------------------------------------
function buildCargoAirplane(): { group: THREE.Group; inner: THREE.Group; lights: THREE.Mesh[] } {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.6 });
  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.2, metalness: 0.5, emissive: 0xff7a00, emissiveIntensity: 0.45 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9 });

  // Fuselage
  const fuselageGeom = new THREE.CylinderGeometry(0.055, 0.06, 0.52, 16);
  fuselageGeom.rotateX(Math.PI / 2);
  inner.add(new THREE.Mesh(fuselageGeom, whiteMat));

  // Nose Cone
  const noseGeom = new THREE.ConeGeometry(0.055, 0.14, 16);
  noseGeom.rotateX(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeom, whiteMat);
  nose.position.z = 0.33;
  inner.add(nose);

  // Cockpit
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.028, 0.11), glassMat);
  cockpit.position.set(0, 0.042, 0.26);
  inner.add(cockpit);

  // Wings
  const wings = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.016, 0.18), whiteMat);
  wings.position.set(0, 0, 0.05);
  inner.add(wings);

  // Winglets
  const leftWinglet = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.055, 0.08), orangeMat);
  leftWinglet.position.set(-0.425, 0.026, 0.05);
  const rightWinglet = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.055, 0.08), orangeMat);
  rightWinglet.position.set(0.425, 0.026, 0.05);
  inner.add(leftWinglet, rightWinglet);

  // Twin Jet Engines
  const engineGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.14, 12);
  engineGeom.rotateX(Math.PI / 2);

  const leftEngine = new THREE.Mesh(engineGeom, whiteMat);
  leftEngine.position.set(-0.22, -0.042, 0.04);
  const rightEngine = new THREE.Mesh(engineGeom, whiteMat);
  rightEngine.position.set(0.22, -0.042, 0.04);

  // Glowing Thruster Cores
  const exhaustMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const leftExhaust = new THREE.Mesh(new THREE.CircleGeometry(0.026, 12), exhaustMat);
  leftExhaust.position.set(-0.22, -0.042, -0.032);
  const rightExhaust = new THREE.Mesh(new THREE.CircleGeometry(0.026, 12), exhaustMat);
  rightExhaust.position.set(0.22, -0.042, -0.032);

  inner.add(leftEngine, rightEngine, leftExhaust, rightExhaust);

  // Tail Fin & Stabilizers
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.16, 0.14), orangeMat);
  tailFin.position.set(0, 0.09, -0.22);
  tailFin.rotation.x = -0.25;

  const tailHori = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.014, 0.1), whiteMat);
  tailHori.position.set(0, 0.025, -0.24);

  inner.add(tailFin, tailHori);

  // Strobe Lights
  const redLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const whiteLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const strobeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), redLightMat);
  strobeLeft.position.set(-0.425, 0.055, 0.05);
  const strobeRight = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), greenLightMat);
  strobeRight.position.set(0.425, 0.055, 0.05);
  const strobeTail = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), whiteLightMat);
  strobeTail.position.set(0, 0.17, -0.24);

  inner.add(strobeLeft, strobeRight, strobeTail);

  return { group, inner, lights: [strobeLeft, strobeRight, strobeTail] };
}

// ---------------------------------------------------------------------------
// 3. 3D CARGO CONTAINER SHIP MODEL (1 SHIP)
// ---------------------------------------------------------------------------
function buildCargoShip(): { group: THREE.Group; inner: THREE.Group; radar: THREE.Mesh } {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);

  const hullUpperMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.4 });
  const hullLowerMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6, metalness: 0.2 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

  // Main hull
  const upperHull = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.64), hullUpperMat);
  upperHull.position.y = 0.025;
  const lowerHull = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.6), hullLowerMat);
  lowerHull.position.y = -0.018;
  inner.add(upperHull, lowerHull);

  // Bow
  const bowGeom = new THREE.ConeGeometry(0.1, 0.16, 4);
  bowGeom.rotateX(Math.PI / 2);
  bowGeom.rotateY(Math.PI / 4);
  const bow = new THREE.Mesh(bowGeom, hullUpperMat);
  bow.position.set(0, 0.025, 0.39);
  inner.add(bow);

  // Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.014, 0.58), deckMat);
  deck.position.y = 0.052;
  inner.add(deck);

  // Stacked containers
  const containerColors = [0xff7a00, 0x0d9488, 0xf59e0b, 0x1e40af, 0x10b981];
  const containerGeom = new THREE.BoxGeometry(0.06, 0.045, 0.13);

  let cIdx = 0;
  for (let z = -0.08; z <= 0.22; z += 0.14) {
    for (let x = -0.05; x <= 0.05; x += 0.1) {
      const mat1 = new THREE.MeshStandardMaterial({ color: containerColors[cIdx % containerColors.length], roughness: 0.4, metalness: 0.3 });
      const c1 = new THREE.Mesh(containerGeom, mat1);
      c1.position.set(x, 0.078, z);
      inner.add(c1);
      cIdx++;

      // Top container
      const mat2 = new THREE.MeshStandardMaterial({ color: containerColors[(cIdx + 2) % containerColors.length], roughness: 0.4, metalness: 0.3 });
      const c2 = new THREE.Mesh(containerGeom, mat2);
      c2.position.set(x, 0.125, z);
      inner.add(c2);
      cIdx++;
    }
  }

  // Wheelhouse Bridge Tower
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.1), bridgeMat);
  bridge.position.set(0, 0.11, -0.22);
  inner.add(bridge);

  // Windows
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const windows = new THREE.Mesh(new THREE.BoxGeometry(0.142, 0.022, 0.08), windowMat);
  windows.position.set(0, 0.14, -0.21);
  inner.add(windows);

  // Funnel
  const funnelMat = new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.3 });
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.06, 8), funnelMat);
  funnel.position.set(0, 0.18, -0.25);
  inner.add(funnel);

  // Rotating Radar
  const radarMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const radar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.014), radarMat);
  radar.position.set(0, 0.21, -0.22);
  inner.add(radar);

  return { group, inner, radar };
}

// ---------------------------------------------------------------------------
// 4. 3D LOGISTICS LORRY & SHIFTING CARGO MODEL (1 LORRY)
// ---------------------------------------------------------------------------
function buildLogisticsLorryWithShiftingCargo(): {
  group: THREE.Group;
  inner: THREE.Group;
  wheels: THREE.Mesh[];
  shiftingBoxes: { mesh: THREE.Group; phase: number }[];
} {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);

  const cabMat = new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.3, metalness: 0.5 });
  const trailerMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.2 });
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  // Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 0.5), chassisMat);
  chassis.position.y = 0.035;
  inner.add(chassis);

  // Tractor Cab
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.095, 0.12), cabMat);
  cab.position.set(0, 0.088, 0.17);
  inner.add(cab);

  // Windshield
  const windshieldMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.04, 0.02), windshieldMat);
  windshield.position.set(0, 0.105, 0.23);
  inner.add(windshield);

  // Headlights
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const leftHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.018, 0.01), headlightMat);
  leftHeadlight.position.set(-0.05, 0.06, 0.232);
  const rightHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.018, 0.01), headlightMat);
  rightHeadlight.position.set(0.05, 0.06, 0.232);
  inner.add(leftHeadlight, rightHeadlight);

  // Glowing Forward Light Beams
  const coneGeom = new THREE.ConeGeometry(0.09, 0.32, 8);
  coneGeom.rotateX(Math.PI / 2);
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.22, side: THREE.DoubleSide });

  const leftBeam = new THREE.Mesh(coneGeom, coneMat);
  leftBeam.position.set(-0.05, 0.045, 0.4);
  const rightBeam = new THREE.Mesh(coneGeom, coneMat);
  rightBeam.position.set(0.05, 0.045, 0.4);
  inner.add(leftBeam, rightBeam);

  // Trailer
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.115, 0.32), trailerMat);
  trailer.position.set(0, 0.1, -0.07);
  inner.add(trailer);

  const band = new THREE.Mesh(new THREE.BoxGeometry(0.142, 0.024, 0.322), new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.3 }));
  band.position.set(0, 0.1, -0.07);
  inner.add(band);

  // Rotating Wheels
  const wheels: THREE.Mesh[] = [];
  const wheelGeom = new THREE.CylinderGeometry(0.028, 0.028, 0.024, 12);
  wheelGeom.rotateZ(Math.PI / 2);

  const wheelPositions: [number, number, number][] = [
    [-0.074, 0.028, 0.17],
    [0.074, 0.028, 0.17],
    [-0.074, 0.028, -0.11],
    [0.074, 0.028, -0.11],
    [-0.074, 0.028, -0.2],
    [0.074, 0.028, -0.2],
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeom, wheelMat);
    w.position.set(x, y, z);
    inner.add(w);
    wheels.push(w);
  });

  // Active Shifting Cargo Cartons (Hovering & transferring dynamically onto/with the lorry)
  const shiftingBoxes: { mesh: THREE.Group; phase: number }[] = [];
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.1 });
  const tapeMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.3 });

  for (let i = 0; i < 3; i++) {
    const pkg = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.065, 0.065), boxMat);
    pkg.add(b);

    const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.067, 0.067, 0.016), tapeMat);
    const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.067, 0.067), tapeMat);
    pkg.add(t1, t2);

    inner.add(pkg);
    shiftingBoxes.push({ mesh: pkg, phase: i * (Math.PI * 2 / 3) });
  }

  return { group, inner, wheels, shiftingBoxes };
}

// ---------------------------------------------------------------------------
// MAIN 3D COMPONENT (1 Flight, 1 Ship, 1 Lorry Shifting Goods - Clean & Uncluttered)
// ---------------------------------------------------------------------------
export default function Hero3DCanvas({ className = "" }: Hero3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (e) {
      console.warn("[Hero3DCanvas] WebGL not supported", e);
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 460;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 6.2);
    camera.lookAt(0, 0, 0);

    // Illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
    sunLight.position.set(7, 5, 7);
    scene.add(sunLight);

    const orangeRimLight = new THREE.PointLight(0xff7a00, 4.0, 16);
    orangeRimLight.position.set(-6, -2, 4);
    scene.add(orangeRimLight);

    const cyanRimLight = new THREE.PointLight(0x06b6d4, 3.6, 16);
    cyanRimLight.position.set(5, -4, -3);
    scene.add(cyanRimLight);

    // Main Pivot
    const globePivot = new THREE.Group();
    scene.add(globePivot);

    globePivot.rotation.y = -Math.PI * 0.42;
    globePivot.rotation.x = 0.22;

    const globeRadius = 1.95;

    // 1. Earth Sphere
    const earthTexture = createCleanEarthTexture();
    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.45,
      metalness: 0.25,
    });
    const globeMesh = new THREE.Mesh(new THREE.SphereGeometry(globeRadius, 64, 64), globeMat);
    globePivot.add(globeMesh);

    // 2. Atmospheric Halo Glow Shell
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmoMesh = new THREE.Mesh(new THREE.SphereGeometry(globeRadius * 1.13, 32, 32), atmoMat);
    scene.add(atmoMesh);

    // -------------------------------------------------------------------------
    // TRACK 1: AIR CORRIDOR (ROUND THE GLOBE IN THE SKY)
    // -------------------------------------------------------------------------
    const flightAltitude = globeRadius * 1.32;
    const flightTiltX = 0.45; // 26 deg tilt
    const flightTiltZ = 0.35; // 20 deg tilt

    // Clear glowing flight track ring
    const flightRingPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const a = (i / 100) * Math.PI * 2;
      flightRingPoints.push(getTiltedCirclePoint(a, flightAltitude, flightTiltX, flightTiltZ));
    }
    const flightRingGeom = new THREE.BufferGeometry().setFromPoints(flightRingPoints);
    const flightRingMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55, linewidth: 2 });
    globePivot.add(new THREE.Line(flightRingGeom, flightRingMat));

    // The ONE Flight
    const { group: planeGroup, inner: planeInner, lights: planeLights } = buildCargoAirplane();
    globePivot.add(planeGroup);

    // Contrail particles
    const contrailGeom = new THREE.SphereGeometry(0.018, 6, 6);
    const contrailMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.7 });
    const contrailParticles: { mesh: THREE.Mesh; life: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(contrailGeom, contrailMat.clone());
      globePivot.add(m);
      contrailParticles.push({ mesh: m, life: i / 14 });
    }

    // -------------------------------------------------------------------------
    // TRACK 2: SEA LANE (ROUND THE GLOBE ON THE OCEAN)
    // -------------------------------------------------------------------------
    const shipAltitude = globeRadius * 1.008;
    const shipTiltX = -0.55; // -31 deg tilt
    const shipTiltZ = -0.3; // -17 deg tilt

    // Clear dashed sea-lane ring
    const shipRingPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const a = (i / 100) * Math.PI * 2;
      shipRingPoints.push(getTiltedCirclePoint(a, shipAltitude, shipTiltX, shipTiltZ));
    }
    const shipRingGeom = new THREE.BufferGeometry().setFromPoints(shipRingPoints);
    const shipRingMat = new THREE.LineDashedMaterial({ color: 0x06b6d4, dashSize: 0.1, gapSize: 0.06, transparent: true, opacity: 0.45 });
    const shipRingLine = new THREE.Line(shipRingGeom, shipRingMat);
    shipRingLine.computeLineDistances();
    globePivot.add(shipRingLine);

    // The ONE Ship
    const { group: shipGroup, inner: shipInner, radar: shipRadar } = buildCargoShip();
    globePivot.add(shipGroup);

    // Foamy stern wake
    const wakeGeom = new THREE.RingGeometry(0.025, 0.08, 12);
    const wakeMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const wakeParticles: { mesh: THREE.Mesh; scale: number; opacity: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(wakeGeom, wakeMat.clone());
      globePivot.add(m);
      wakeParticles.push({ mesh: m, scale: 1, opacity: 0.6 });
    }

    // -------------------------------------------------------------------------
    // TRACK 3: HIGHWAY CORRIDOR (ROUND THE GLOBE ON LAND, SHIFTING GOODS)
    // -------------------------------------------------------------------------
    const roadAltitude = globeRadius * 1.015;
    const roadTiltX = 0.12;
    const roadTiltZ = -0.65; // -37 deg tilt

    // Clear glowing overland road ring
    const roadRingPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const a = (i / 100) * Math.PI * 2;
      roadRingPoints.push(getTiltedCirclePoint(a, roadAltitude, roadTiltX, roadTiltZ));
    }
    const roadRingGeom = new THREE.BufferGeometry().setFromPoints(roadRingPoints);
    const roadRingMat = new THREE.LineBasicMaterial({ color: 0xffa336, transparent: true, opacity: 0.75, linewidth: 2 });
    globePivot.add(new THREE.Line(roadRingGeom, roadRingMat));

    // The ONE Lorry with Active Shifting Cargo
    const { group: lorryGroup, inner: lorryInner, wheels: lorryWheels, shiftingBoxes } = buildLogisticsLorryWithShiftingCargo();
    globePivot.add(lorryGroup);

    // -------------------------------------------------------------------------
    // MOUSE DRAG & TOUCH PARALLAX
    // -------------------------------------------------------------------------
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotX = globePivot.rotation.x;
    let targetRotY = globePivot.rotation.y;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;
      prevMouseX = clientX;
      prevMouseY = clientY;

      targetRotY += deltaX * 0.007;
      targetRotX += deltaY * 0.007;
      targetRotX = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, targetRotX));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onPointerDown);
    domEl.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    domEl.addEventListener("touchstart", onPointerDown, { passive: true });
    domEl.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 540;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // -------------------------------------------------------------------------
    // 60FPS MASTER ANIMATION LOOP
    // -------------------------------------------------------------------------
    let animationFrameId: number;
    let clock = new THREE.Clock();

    let planeAngle = 0;
    let shipAngle = Math.PI * 0.7;
    let lorryAngle = Math.PI * 1.35;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Ambient globe auto-rotation
      if (!isDragging && !prefersReducedMotion) {
        targetRotY += 0.0024;
      }

      globePivot.rotation.y += (targetRotY - globePivot.rotation.y) * 0.08;
      globePivot.rotation.x += (targetRotX - globePivot.rotation.x) * 0.08;

      // 1. FLIGHT ROUNDING THE GLOBE
      planeAngle = (planeAngle + delta * 0.45) % (Math.PI * 2);
      const planePos = getTiltedCirclePoint(planeAngle, flightAltitude, flightTiltX, flightTiltZ);
      const planeNext = getTiltedCirclePoint(planeAngle + 0.01, flightAltitude, flightTiltX, flightTiltZ);
      const planeDir = planeNext.clone().sub(planePos).normalize();
      const planeUp = planePos.clone().normalize();

      planeGroup.position.copy(planePos);
      planeGroup.up.copy(planeUp);
      planeGroup.lookAt(planePos.clone().add(planeDir));

      // Airplane banking
      planeInner.rotation.z = Math.sin(planeAngle * 2) * 0.22;

      // Navigation strobe flash
      const strobeOn = Math.sin(elapsed * 12) > 0.5;
      planeLights.forEach((l) => (l.visible = strobeOn));

      // Contrail particles
      contrailParticles.forEach((c) => {
        c.life += delta * 1.5;
        if (c.life > 1) {
          c.life = 0;
          c.mesh.position.copy(planePos.clone().add(planeDir.clone().multiplyScalar(-0.1)));
        }
        const s = 0.7 + c.life * 1.4;
        c.mesh.scale.set(s, s, s);
        (c.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - c.life * 0.7);
      });

      // 2. SHIP ROUNDING THE GLOBE
      shipAngle = (shipAngle + delta * 0.22) % (Math.PI * 2);
      const shipPos = getTiltedCirclePoint(shipAngle, shipAltitude, shipTiltX, shipTiltZ);
      const shipNext = getTiltedCirclePoint(shipAngle + 0.01, shipAltitude, shipTiltX, shipTiltZ);
      const shipDir = shipNext.clone().sub(shipPos).normalize();
      const shipUp = shipPos.clone().normalize();

      shipGroup.position.copy(shipPos);
      shipGroup.up.copy(shipUp);
      shipGroup.lookAt(shipPos.clone().add(shipDir));

      // Ship swell bobbing (pitch & roll on waves)
      shipInner.rotation.x = Math.sin(elapsed * 2.4) * 0.04;
      shipInner.rotation.z = Math.cos(elapsed * 1.8) * 0.05;
      shipRadar.rotation.y += 0.07;

      // Wake particles
      wakeParticles.forEach((w) => {
        w.scale += delta * 1.2;
        w.opacity -= delta * 0.6;
        if (w.opacity <= 0) {
          w.scale = 1;
          w.opacity = 0.6;
          w.mesh.position.copy(shipPos.clone().add(shipDir.clone().multiplyScalar(-0.08)));
          w.mesh.quaternion.copy(shipGroup.quaternion);
        }
        w.mesh.scale.set(w.scale, w.scale, w.scale);
        (w.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, w.opacity);
      });

      // 3. LORRY ROUNDING THE GLOBE (AND SHIFTING GOODS)
      lorryAngle = (lorryAngle + delta * 0.32) % (Math.PI * 2);
      const lorryPos = getTiltedCirclePoint(lorryAngle, roadAltitude, roadTiltX, roadTiltZ);
      const lorryNext = getTiltedCirclePoint(lorryAngle + 0.01, roadAltitude, roadTiltX, roadTiltZ);
      const lorryDir = lorryNext.clone().sub(lorryPos).normalize();
      const lorryUp = lorryPos.clone().normalize();

      lorryGroup.position.copy(lorryPos);
      lorryGroup.up.copy(lorryUp);
      lorryGroup.lookAt(lorryPos.clone().add(lorryDir));

      // Wheels turning
      lorryWheels.forEach((w) => {
        w.rotation.x += 0.16;
      });

      // Shifting cargo animation: Cartons shifting in a smooth floating arc behind and onto the lorry
      shiftingBoxes.forEach((item, index) => {
        const t = (elapsed * 2.0 + item.phase) % (Math.PI * 2);
        // Box shifts along Z (from behind into the trailer) and Y (lifts and lands)
        const shiftZ = -0.07 + Math.sin(t) * 0.14;
        const shiftY = 0.11 + Math.max(0, Math.sin(t)) * 0.08;
        const shiftX = Math.cos(t) * 0.02;

        item.mesh.position.set(shiftX, shiftY, shiftZ);
        item.mesh.rotation.y = t * 0.5;
        item.mesh.rotation.x = Math.sin(t) * 0.15;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      domEl.removeEventListener("mousedown", onPointerDown);
      domEl.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      domEl.removeEventListener("touchstart", onPointerDown);
      domEl.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
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
    <div className={`relative w-full h-[460px] lg:h-[540px] flex items-center justify-center select-none ${className}`}>
      {/* Pure 3D Canvas - Clean, Uncluttered, Crystal Clear */}
      <div
        ref={mountRef}
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        aria-label="3D Global Trade Animation"
      />

      {/* WebGL Fallback */}
      {!hasWebGL && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0B0F19] to-[#030712] p-8 text-center rounded-2xl border border-white/10">
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FF7A00]/20 border border-[#FF7A00] flex items-center justify-center text-[#FF7A00]">
              <span className="text-2xl">🌐</span>
            </div>
            <h3 className="font-heading font-bold text-lg text-white">Global Trade Ecosystem</h3>
            <p className="font-['Inter'] text-xs text-[#CBD5E1] max-w-xs mx-auto">
              Connecting buyers and suppliers across international air, ocean, and overland logistics networks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

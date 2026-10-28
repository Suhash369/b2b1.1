import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Hero3DCanvasProps {
  className?: string;
}

// Utility: Convert Latitude & Longitude to 3D Cartesian coordinates on a sphere
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// ---------------------------------------------------------------------------
// 1. HIGH-RESOLUTION PROCEDURAL WORLD MAP & CONTINENT TEXTURE
// ---------------------------------------------------------------------------
function createProceduralEarthTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // A. Deep Oceanic Midnight Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, "#050B17");
  oceanGrad.addColorStop(0.3, "#081426");
  oceanGrad.addColorStop(0.7, "#09172E");
  oceanGrad.addColorStop(1, "#040914");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // B. Subtle Nautical Graticule Grid (Meridians & Parallels)
  ctx.strokeStyle = "rgba(14, 165, 233, 0.08)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);

  // Longitude lines every 30 deg
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Latitude lines every 30 deg
  for (let lat = -90; lat <= 90; lat += 30) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Equator Highlight
  ctx.strokeStyle = "rgba(255, 122, 0, 0.22)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  ctx.setLineDash([]); // Reset line dash

  // Helper to convert lat/lon to canvas (x, y)
  const mapPoint = (lat: number, lon: number): [number, number] => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  };

  // C. Draw Realistic Continent Silhouettes with Glowing Coastlines
  const drawContinent = (
    points: [number, number][],
    glowColor = "rgba(6, 182, 212, 0.45)",
    fillColor = "#0F1F38",
    innerColor = "#162E52"
  ) => {
    if (points.length < 3) return;

    // Glowing coastal rim
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

    // Inner contour shading for depth
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

  // 1. Indian Subcontinent & South Asia
  drawContinent(
    [
      [36, 74], [34, 78], [30, 81], [27, 88], [24, 91], [22, 92], [21, 89], [22, 87],
      [19, 85], [16, 82], [13, 80], [10, 79], [8.3, 77.5], [8.5, 77.0], [11, 75.8],
      [15, 73.8], [19, 72.8], [21, 72.5], [23, 68.5], [24.5, 68.2], [28, 70], [32, 73], [35, 74]
    ],
    "rgba(255, 122, 0, 0.8)",
    "#192D4A",
    "#223C63"
  );

  // Sri Lanka
  drawContinent(
    [[9.8, 80.2], [8.5, 81.2], [6.0, 80.7], [6.8, 79.8], [8.5, 79.7]],
    "rgba(255, 122, 0, 0.65)",
    "#192D4A"
  );

  // 2. Southeast Asia & Malay Peninsula
  drawContinent(
    [
      [22, 92], [22, 108], [11, 109], [8.5, 105], [13, 101], [1, 104], [3, 98], [14, 98], [21, 93]
    ],
    "rgba(6, 182, 212, 0.5)",
    "#132644"
  );

  // Indonesia / Sumatra / Java / Borneo
  drawContinent([[5, 95], [2, 98], [-4, 105], [-6, 103], [0, 98]], "rgba(6, 182, 212, 0.4)", "#11223D");
  drawContinent([[-6, 106], [-7, 114], [-8, 114], [-7, 106]], "rgba(6, 182, 212, 0.4)", "#11223D");
  drawContinent([[4, 117], [0, 118], [-4, 115], [-2, 110], [5, 112]], "rgba(6, 182, 212, 0.4)", "#11223D");

  // 3. East Asia (China, Korea, Japan)
  drawContinent(
    [
      [22, 108], [26, 120], [32, 121], [39, 118], [40, 124], [43, 131], [48, 135],
      [53, 120], [45, 100], [40, 80], [34, 78], [24, 91], [22, 108]
    ],
    "rgba(6, 182, 212, 0.5)",
    "#142642"
  );

  // Japan
  drawContinent(
    [[44, 143], [42, 141], [36, 138], [33, 131], [34, 135], [40, 141]],
    "rgba(6, 182, 212, 0.45)",
    "#142642"
  );

  // 4. Middle East & Arabian Peninsula
  drawContinent(
    [
      [31, 35], [32, 40], [30, 48], [27, 50], [25, 55], [24, 57], [22, 59], [17, 54],
      [12.5, 44], [13, 43], [20, 39], [28, 34], [31, 35]
    ],
    "rgba(245, 158, 11, 0.6)",
    "#162740"
  );

  // Iran & Central Asia
  drawContinent(
    [
      [37, 44], [39, 50], [37, 59], [31, 62], [25, 62], [27, 56], [30, 48], [37, 44]
    ],
    "rgba(6, 182, 212, 0.4)",
    "#13243D"
  );

  // 5. Europe
  drawContinent(
    [
      [36, -6], [43, -9], [48, -4], [50, 1], [54, 8], [58, 5], [62, 10], [70, 25],
      [60, 30], [55, 37], [45, 35], [41, 28], [37, 24], [38, 15], [44, 8], [38, 0], [36, -6]
    ],
    "rgba(6, 182, 212, 0.5)",
    "#142540"
  );

  // UK & Ireland
  drawContinent(
    [[50, -5], [54, -3], [58, -4], [56, -6], [51, -1]],
    "rgba(6, 182, 212, 0.45)",
    "#142540"
  );

  // 6. Africa
  drawContinent(
    [
      [36, -6], [37, 10], [32, 31], [28, 34], [12, 44], [11, 51], [0, 42], [-12, 40],
      [-26, 33], [-34, 26], [-34, 18], [-22, 14], [-5, 12], [4, 9], [6, 2], [5, -4],
      [14, -17], [21, -17], [28, -12], [35, -2], [36, -6]
    ],
    "rgba(6, 182, 212, 0.45)",
    "#112035"
  );

  // 7. North America
  drawContinent(
    [
      [70, -160], [71, -125], [60, -75], [50, -55], [44, -65], [30, -81], [25, -80],
      [28, -96], [20, -97], [16, -92], [9, -78], [15, -92], [22, -106], [32, -117],
      [48, -124], [58, -140], [65, -168], [70, -160]
    ],
    "rgba(6, 182, 212, 0.45)",
    "#122238"
  );

  // 8. South America
  drawContinent(
    [
      [11, -74], [10, -62], [4, -51], [-3, -40], [-8, -35], [-23, -43], [-34, -53],
      [-53, -68], [-54, -72], [-40, -73], [-18, -71], [-5, -80], [2, -78], [11, -74]
    ],
    "rgba(6, 182, 212, 0.45)",
    "#122238"
  );

  // 9. Australia
  drawContinent(
    [
      [-12, 131], [-14, 136], [-12, 142], [-23, 151], [-33, 152], [-38, 147],
      [-37, 139], [-34, 115], [-22, 114], [-15, 124], [-12, 131]
    ],
    "rgba(6, 182, 212, 0.45)",
    "#122238"
  );

  // D. Glowing Industrial Belts & City Light Clusters (B2B Hubs)
  const drawCityCluster = (lat: number, lon: number, radius = 6, color = "#FFB020", intensity = 0.95) => {
    const [cx, cy] = mapPoint(lat, lon);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 3.5);
    grad.addColorStop(0, color);
    grad.addColorStop(0.3, "rgba(255, 122, 0, 0.7)");
    grad.addColorStop(0.7, "rgba(245, 158, 11, 0.25)");
    grad.addColorStop(1, "rgba(255, 122, 0, 0)");
    ctx.fillStyle = grad;
    ctx.globalAlpha = intensity;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Hot center pin
    ctx.fillStyle = "#FFFFFF";
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  };

  // Indian Industrial Hubs
  drawCityCluster(19.076, 72.877, 9, "#FF7A00", 1.0); // Mumbai (Central Port & B2B Hub)
  drawCityCluster(28.613, 77.209, 8, "#FFA336", 0.95); // Delhi NCR
  drawCityCluster(12.971, 77.594, 7, "#FFB84D", 0.9); // Bengaluru
  drawCityCluster(13.082, 80.27, 7, "#FF921F", 0.9); // Chennai Port
  drawCityCluster(23.022, 72.571, 7, "#FF921F", 0.9); // Gujarat / Ahmedabad
  drawCityCluster(22.572, 88.363, 7, "#FFA336", 0.85); // Kolkata
  drawCityCluster(17.385, 78.486, 6, "#FFB84D", 0.85); // Hyderabad

  // International Gateways
  drawCityCluster(25.204, 55.27, 8, "#38BDF8", 0.95); // Dubai
  drawCityCluster(1.352, 103.819, 8, "#38BDF8", 0.95); // Singapore
  drawCityCluster(31.23, 121.473, 8, "#38BDF8", 0.9); // Shanghai
  drawCityCluster(50.11, 8.682, 7, "#38BDF8", 0.9); // Frankfurt / Europe
  drawCityCluster(40.712, -74.006, 7, "#38BDF8", 0.9); // New York

  // E. Luminous Overland Highway Grid
  ctx.strokeStyle = "rgba(255, 163, 54, 0.55)";
  ctx.lineWidth = 2.0;
  ctx.setLineDash([3, 4]);

  const drawHighway = (stops: [number, number][]) => {
    ctx.beginPath();
    const [x0, y0] = mapPoint(stops[0][0], stops[0][1]);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < stops.length; i++) {
      const [xi, yi] = mapPoint(stops[i][0], stops[i][1]);
      ctx.lineTo(xi, yi);
    }
    ctx.stroke();
  };

  // Indian Industrial Corridor
  drawHighway([[19.07, 72.87], [23.02, 72.57], [28.61, 77.2], [22.57, 88.36], [13.08, 80.27], [12.97, 77.59], [19.07, 72.87]]);

  // Trans-Eurasian Corridor
  drawHighway([[19.07, 72.87], [25.2, 55.27], [32.0, 44.0], [41.0, 28.0], [50.11, 8.68]]);

  ctx.setLineDash([]);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

// ---------------------------------------------------------------------------
// 2. PROCEDURAL CLOUD COVER TEXTURE
// ---------------------------------------------------------------------------
function createProceduralCloudTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < 45; i++) {
      const cy = Math.random() * height;
      const cx = Math.random() * width;
      const rX = 70 + Math.random() * 130;
      const rY = 18 + Math.random() * 40;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rX);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.28)");
      grad.addColorStop(0.5, "rgba(240, 249, 255, 0.12)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rX, rY, Math.random() * 0.4 - 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// ---------------------------------------------------------------------------
// 3. 3D AIR CARGO PLANE BUILDER
// ---------------------------------------------------------------------------
function buildCargoAirplane(): { group: THREE.Group; inner: THREE.Group; lights: THREE.Mesh[] } {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
    metalness: 0.7,
  });

  const orangeLivery = new THREE.MeshStandardMaterial({
    color: 0xff7a00,
    roughness: 0.2,
    metalness: 0.5,
    emissive: 0xff7a00,
    emissiveIntensity: 0.4,
  });

  const cockpitMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.9,
  });

  // Fuselage (Length ~0.48)
  const fuselageGeom = new THREE.CylinderGeometry(0.046, 0.05, 0.42, 16);
  fuselageGeom.rotateX(Math.PI / 2);
  const fuselage = new THREE.Mesh(fuselageGeom, bodyMat);
  inner.add(fuselage);

  // Nose Cone
  const noseGeom = new THREE.ConeGeometry(0.046, 0.12, 16);
  noseGeom.rotateX(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeom, bodyMat);
  nose.position.z = 0.27;
  inner.add(nose);

  // Cockpit Glass
  const cockpitGeom = new THREE.BoxGeometry(0.055, 0.024, 0.09);
  const cockpit = new THREE.Mesh(cockpitGeom, cockpitMat);
  cockpit.position.set(0, 0.034, 0.22);
  inner.add(cockpit);

  // Swept Wings (Wingspan ~0.72)
  const wingGeom = new THREE.BoxGeometry(0.72, 0.014, 0.15);
  const wings = new THREE.Mesh(wingGeom, bodyMat);
  wings.position.set(0, 0, 0.04);
  inner.add(wings);

  // Winglets (Angled tabs)
  const leftWinglet = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.045, 0.07), orangeLivery);
  leftWinglet.position.set(-0.36, 0.022, 0.04);
  const rightWinglet = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.045, 0.07), orangeLivery);
  rightWinglet.position.set(0.36, 0.022, 0.04);
  inner.add(leftWinglet, rightWinglet);

  // Jet Engines (Mounted under wings with glowing exhausts)
  const engineGeom = new THREE.CylinderGeometry(0.026, 0.026, 0.12, 12);
  engineGeom.rotateX(Math.PI / 2);

  const leftEngine = new THREE.Mesh(engineGeom, bodyMat);
  leftEngine.position.set(-0.18, -0.035, 0.03);
  const rightEngine = new THREE.Mesh(engineGeom, bodyMat);
  rightEngine.position.set(0.18, -0.035, 0.03);

  // Engine Exhaust Glow Core
  const exhaustMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const leftExhaust = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), exhaustMat);
  leftExhaust.position.set(-0.18, -0.035, -0.03);
  const rightExhaust = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), exhaustMat);
  rightExhaust.position.set(0.18, -0.035, -0.03);

  inner.add(leftEngine, rightEngine, leftExhaust, rightExhaust);

  // Tail Vertical Stabilizer
  const tailFinGeom = new THREE.BoxGeometry(0.014, 0.13, 0.12);
  const tailFin = new THREE.Mesh(tailFinGeom, orangeLivery);
  tailFin.position.set(0, 0.075, -0.18);
  tailFin.rotation.x = -0.25;

  // Horizontal Stabilizers
  const tailHoriGeom = new THREE.BoxGeometry(0.26, 0.012, 0.09);
  const tailHori = new THREE.Mesh(tailHoriGeom, bodyMat);
  tailHori.position.set(0, 0.02, -0.2);

  inner.add(tailFin, tailHori);

  // Strobe Navigation Lights
  const redLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const whiteLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const strobeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), redLightMat);
  strobeLeft.position.set(-0.36, 0.045, 0.04);
  const strobeRight = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), greenLightMat);
  strobeRight.position.set(0.36, 0.045, 0.04);
  const strobeTail = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), whiteLightMat);
  strobeTail.position.set(0, 0.14, -0.2);

  inner.add(strobeLeft, strobeRight, strobeTail);

  return { group, inner, lights: [strobeLeft, strobeRight, strobeTail] };
}

// ---------------------------------------------------------------------------
// 4. 3D CARGO CONTAINER SHIP BUILDER
// ---------------------------------------------------------------------------
function buildCargoShip(): { group: THREE.Group; inner: THREE.Group; radar: THREE.Mesh } {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);

  const hullUpperMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.4 });
  const hullLowerMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6, metalness: 0.2 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

  // Main hull body
  const upperHull = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.58), hullUpperMat);
  upperHull.position.y = 0.022;
  const lowerHull = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.54), hullLowerMat);
  lowerHull.position.y = -0.016;
  inner.add(upperHull, lowerHull);

  // Pointed Bow
  const bowGeom = new THREE.ConeGeometry(0.09, 0.14, 4);
  bowGeom.rotateX(Math.PI / 2);
  bowGeom.rotateY(Math.PI / 4);
  const bow = new THREE.Mesh(bowGeom, hullUpperMat);
  bow.position.set(0, 0.022, 0.35);
  inner.add(bow);

  // Deck Surface
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.012, 0.52), deckMat);
  deck.position.y = 0.046;
  inner.add(deck);

  // Multi-colored ISO freight containers stacked in bays
  const containerColors = [0xff7a00, 0x0d9488, 0xf59e0b, 0x1e40af, 0xff7a00, 0x10b981];
  const containerGeom = new THREE.BoxGeometry(0.055, 0.04, 0.12);

  let colorIdx = 0;
  for (let z = -0.07; z <= 0.2; z += 0.13) {
    for (let x = -0.045; x <= 0.045; x += 0.09) {
      const mat1 = new THREE.MeshStandardMaterial({
        color: containerColors[colorIdx % containerColors.length],
        roughness: 0.4,
        metalness: 0.3,
      });
      const c1 = new THREE.Mesh(containerGeom, mat1);
      c1.position.set(x, 0.07, z);
      inner.add(c1);
      colorIdx++;

      // Top tier container
      const mat2 = new THREE.MeshStandardMaterial({
        color: containerColors[(colorIdx + 2) % containerColors.length],
        roughness: 0.4,
        metalness: 0.3,
      });
      const c2 = new THREE.Mesh(containerGeom, mat2);
      c2.position.set(x, 0.112, z);
      inner.add(c2);
      colorIdx++;
    }
  }

  // Aft Superstructure (Bridge Tower)
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.09), bridgeMat);
  bridge.position.set(0, 0.1, -0.2);
  inner.add(bridge);

  // Bridge Windows
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const windows = new THREE.Mesh(new THREE.BoxGeometry(0.132, 0.02, 0.07), windowMat);
  windows.position.set(0, 0.128, -0.19);
  inner.add(windows);

  // Smokestack Funnel
  const funnelMat = new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.3 });
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.055, 8), funnelMat);
  funnel.position.set(0, 0.165, -0.23);
  inner.add(funnel);

  // Rotating Radar Scanner
  const radarGeom = new THREE.BoxGeometry(0.055, 0.009, 0.012);
  const radarMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const radar = new THREE.Mesh(radarGeom, radarMat);
  radar.position.set(0, 0.19, -0.2);
  inner.add(radar);

  return { group, inner, radar };
}

// ---------------------------------------------------------------------------
// 5. 3D LOGISTICS LORRY (TRUCK) BUILDER
// ---------------------------------------------------------------------------
function buildLogisticsLorry(): { group: THREE.Group; inner: THREE.Group; wheels: THREE.Mesh[] } {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);

  const cabMat = new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.3, metalness: 0.5 });
  const trailerMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4, metalness: 0.2 });
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  // Chassis Frame
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.02, 0.45), chassisMat);
  chassis.position.y = 0.032;
  inner.add(chassis);

  // Cabin (Front)
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.088, 0.11), cabMat);
  cab.position.set(0, 0.08, 0.15);
  inner.add(cab);

  // Windshield
  const windshieldMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.038, 0.02), windshieldMat);
  windshield.position.set(0, 0.096, 0.205);
  inner.add(windshield);

  // Glowing Headlights
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const leftHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.016, 0.01), headlightMat);
  leftHeadlight.position.set(-0.045, 0.055, 0.208);
  const rightHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.016, 0.01), headlightMat);
  rightHeadlight.position.set(0.045, 0.055, 0.208);
  inner.add(leftHeadlight, rightHeadlight);

  // Forward Light Cones (Illuminating the road ahead)
  const coneGeom = new THREE.ConeGeometry(0.08, 0.28, 8);
  coneGeom.rotateX(Math.PI / 2);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  });
  const leftBeam = new THREE.Mesh(coneGeom, coneMat);
  leftBeam.position.set(-0.045, 0.04, 0.35);
  const rightBeam = new THREE.Mesh(coneGeom, coneMat);
  rightBeam.position.set(0.045, 0.04, 0.35);
  inner.add(leftBeam, rightBeam);

  // Cargo Box Trailer
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.105, 0.29), trailerMat);
  trailer.position.set(0, 0.092, -0.065);
  inner.add(trailer);

  // Orange Accent Band on Trailer
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.3 });
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.132, 0.022, 0.292), bandMat);
  band.position.set(0, 0.092, -0.065);
  inner.add(band);

  // Wheels (6 wheels)
  const wheels: THREE.Mesh[] = [];
  const wheelGeom = new THREE.CylinderGeometry(0.026, 0.026, 0.022, 12);
  wheelGeom.rotateZ(Math.PI / 2);

  const wheelPositions: [number, number, number][] = [
    [-0.068, 0.026, 0.15],
    [0.068, 0.026, 0.15],
    [-0.068, 0.026, -0.1],
    [0.068, 0.026, -0.1],
    [-0.068, 0.026, -0.18],
    [0.068, 0.026, -0.18],
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeom, wheelMat);
    w.position.set(x, y, z);
    inner.add(w);
    wheels.push(w);
  });

  return { group, inner, wheels };
}

// ---------------------------------------------------------------------------
// 6. CARGO PACKAGE BUILDER (Shiftable Cartons with Strapping Tape)
// ---------------------------------------------------------------------------
function buildCargoPackage(size = 0.06): THREE.Group {
  const pkg = new THREE.Group();
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6, metalness: 0.1 });
  const tapeMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.3 });

  const box = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), boxMat);
  pkg.add(box);

  const tape1 = new THREE.Mesh(new THREE.BoxGeometry(size * 1.02, size * 1.02, size * 0.18), tapeMat);
  const tape2 = new THREE.Mesh(new THREE.BoxGeometry(size * 0.18, size * 1.02, size * 1.02), tapeMat);
  pkg.add(tape1, tape2);

  return pkg;
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT (Pure 3D Animation Only - No UI Overlays)
// ---------------------------------------------------------------------------
export default function Hero3DCanvas({ className = "" }: Hero3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // A. WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (e) {
      console.warn("[Hero3DCanvas] WebGL initialization failed", e);
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 460;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // B. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 6.4);
    camera.lookAt(0, 0, 0);

    // C. Illumination System
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambientLight);

    // Key Sunlight
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.7);
    sunLight.position.set(8, 6, 7);
    scene.add(sunLight);

    // Accent Rim Lights (Orange + Cyan)
    const orangeRimLight = new THREE.PointLight(0xff7a00, 4.0, 15);
    orangeRimLight.position.set(-6, -2, 4);
    scene.add(orangeRimLight);

    const cyanRimLight = new THREE.PointLight(0x06b6d4, 3.4, 15);
    cyanRimLight.position.set(5, -4, -3);
    scene.add(cyanRimLight);

    // D. Main Globe Pivot Group
    const globePivot = new THREE.Group();
    scene.add(globePivot);

    // Orient initial globe face towards India & Arabian Sea
    globePivot.rotation.y = -Math.PI * 0.42;
    globePivot.rotation.x = 0.22;

    const globeRadius = 1.95;

    // 1. Earth Sphere with Procedural World Map
    const earthTexture = createProceduralEarthTexture();
    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.45,
      metalness: 0.25,
    });

    const globeMesh = new THREE.Mesh(new THREE.SphereGeometry(globeRadius, 64, 64), globeMat);
    globePivot.add(globeMesh);

    // 2. Procedural Clouds Outer Sphere
    const cloudTexture = createProceduralCloudTexture();
    const cloudMat = new THREE.MeshLambertMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(globeRadius * 1.018, 48, 48), cloudMat);
    globePivot.add(cloudMesh);

    // 3. Atmospheric Halo Glow Shell
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmoMesh = new THREE.Mesh(new THREE.SphereGeometry(globeRadius * 1.12, 32, 32), atmoMat);
    scene.add(atmoMesh);

    // -------------------------------------------------------------------------
    // E. GLOBAL LOGISTICS HUBS & BEACONS
    // -------------------------------------------------------------------------
    const hubs = [
      { name: "Mumbai (Central)", lat: 19.076, lon: 72.877, color: 0xff7a00, primary: true },
      { name: "Singapore", lat: 1.352, lon: 103.819, color: 0x06b6d4 },
      { name: "Dubai", lat: 25.204, lon: 55.27, color: 0xf59e0b },
      { name: "Frankfurt", lat: 50.11, lon: 8.682, color: 0x38bdf8 },
      { name: "Shanghai", lat: 31.23, lon: 121.473, color: 0x06b6d4 },
    ];

    const hubBeacons: { ring: THREE.Mesh; scale: number; speed: number }[] = [];

    hubs.forEach((hub) => {
      const pos = latLonToVector3(hub.lat, hub.lon, globeRadius * 1.002);
      const hubGroup = new THREE.Group();
      hubGroup.position.copy(pos);
      hubGroup.lookAt(pos.clone().multiplyScalar(2));

      // Central core node
      const coreGeom = new THREE.SphereGeometry(hub.primary ? 0.055 : 0.038, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: hub.color });
      const core = new THREE.Mesh(coreGeom, coreMat);
      hubGroup.add(core);

      // Pulsing Base Ring
      const ringGeom = new THREE.RingGeometry(0.04, 0.085, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: hub.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      hubGroup.add(ring);
      hubBeacons.push({ ring, scale: 1, speed: 0.015 + Math.random() * 0.01 });

      // Vertical Beacon Light Beam
      const beamHeight = hub.primary ? 0.48 : 0.3;
      const beamGeom = new THREE.CylinderGeometry(0.007, 0.015, beamHeight, 8);
      beamGeom.rotateX(Math.PI / 2);
      const beamMat = new THREE.MeshBasicMaterial({
        color: hub.color,
        transparent: true,
        opacity: 0.55,
      });
      const beam = new THREE.Mesh(beamGeom, beamMat);
      beam.position.z = beamHeight / 2;
      hubGroup.add(beam);

      globePivot.add(hubGroup);
    });

    // -------------------------------------------------------------------------
    // F. FLIGHT (AIR CARGO) ROUTE & DYNAMIC AIRPLANE ANIMATION
    // -------------------------------------------------------------------------
    const flightAltitude = globeRadius * 1.25;
    const flightPoints = [
      latLonToVector3(19.076, 72.877, flightAltitude), // Mumbai
      latLonToVector3(25.204, 55.27, flightAltitude * 1.02), // Dubai
      latLonToVector3(50.11, 8.682, flightAltitude * 1.03), // Frankfurt
      latLonToVector3(31.23, 121.473, flightAltitude * 1.02), // Shanghai
      latLonToVector3(1.352, 103.819, flightAltitude), // Singapore
    ];

    const flightCurve = new THREE.CatmullRomCurve3(flightPoints, true);

    // Glowing Neon Flight Arc Line
    const flightArcPoints = flightCurve.getPoints(120);
    const flightArcGeom = new THREE.BufferGeometry().setFromPoints(flightArcPoints);
    const flightArcMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      linewidth: 2,
    });
    const flightLine = new THREE.Line(flightArcGeom, flightArcMat);
    globePivot.add(flightLine);

    // Build Cargo Airplane Model
    const { group: planeGroup, inner: planeInner, lights: planeLights } = buildCargoAirplane();
    globePivot.add(planeGroup);

    // Dynamic Jet Contrail Particle Stream
    const contrailCount = 35;
    const contrailGeom = new THREE.SphereGeometry(0.018, 6, 6);
    const contrailMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.7,
    });
    const contrails: { mesh: THREE.Mesh; t: number; life: number }[] = [];

    for (let i = 0; i < contrailCount; i++) {
      const mesh = new THREE.Mesh(contrailGeom, contrailMat.clone());
      globePivot.add(mesh);
      contrails.push({ mesh, t: 0, life: i / contrailCount });
    }

    // -------------------------------------------------------------------------
    // G. MARITIME CARGO CONTAINER SHIP ROUTE & VESSEL ANIMATION
    // -------------------------------------------------------------------------
    const shipAltitude = globeRadius * 1.005;
    const shipPoints = [
      latLonToVector3(18.5, 72.6, shipAltitude), // Mumbai Port
      latLonToVector3(22.0, 62.0, shipAltitude), // Arabian Sea
      latLonToVector3(24.5, 57.5, shipAltitude), // Gulf of Oman
      latLonToVector3(12.0, 50.0, shipAltitude), // Gulf of Aden
      latLonToVector3(5.5, 80.5, shipAltitude), // South Sri Lanka maritime corridor
      latLonToVector3(1.2, 103.8, shipAltitude), // Strait of Malacca / Singapore
      latLonToVector3(10.0, 110.0, shipAltitude), // South China Sea
      latLonToVector3(20.0, 118.0, shipAltitude), // Taiwan Strait
      latLonToVector3(12.0, 90.0, shipAltitude), // Bay of Bengal return
    ];

    const shipCurve = new THREE.CatmullRomCurve3(shipPoints, true);

    // Maritime Route Spline Line
    const shipArcPoints = shipCurve.getPoints(100);
    const shipArcGeom = new THREE.BufferGeometry().setFromPoints(shipArcPoints);
    const shipArcMat = new THREE.LineDashedMaterial({
      color: 0x06b6d4,
      dashSize: 0.08,
      gapSize: 0.05,
      transparent: true,
      opacity: 0.45,
    });
    const shipLine = new THREE.Line(shipArcGeom, shipArcMat);
    shipLine.computeLineDistances();
    globePivot.add(shipLine);

    // Build Cargo Container Ship Model
    const { group: shipGroup, inner: shipInner, radar: shipRadar } = buildCargoShip();
    globePivot.add(shipGroup);

    // Foamy Water Wake Behind Stern
    const wakeCount = 18;
    const wakeGeom = new THREE.RingGeometry(0.02, 0.065, 12);
    const wakeMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const wakes: { mesh: THREE.Mesh; scale: number; opacity: number }[] = [];

    for (let i = 0; i < wakeCount; i++) {
      const mesh = new THREE.Mesh(wakeGeom, wakeMat.clone());
      globePivot.add(mesh);
      wakes.push({ mesh, scale: 1, opacity: 0.6 });
    }

    // -------------------------------------------------------------------------
    // H. OVERLAND HIGHWAY CORRIDOR, LORRY & FREIGHT SHIFTING ANIMATION
    // -------------------------------------------------------------------------
    const roadAltitude = globeRadius * 1.008;
    const roadPoints = [
      latLonToVector3(19.076, 72.877, roadAltitude), // Mumbai Logistics Hub
      latLonToVector3(23.022, 72.571, roadAltitude), // Ahmedabad / Gujarat Hub
      latLonToVector3(28.613, 77.209, roadAltitude), // Delhi NCR Depot
      latLonToVector3(26.449, 80.331, roadAltitude), // Kanpur Central
      latLonToVector3(22.572, 88.363, roadAltitude), // Kolkata Port
      latLonToVector3(17.385, 78.486, roadAltitude), // Hyderabad Hub
      latLonToVector3(12.971, 77.594, roadAltitude), // Bengaluru Terminal
      latLonToVector3(13.082, 80.27, roadAltitude), // Chennai Terminal
    ];

    const roadCurve = new THREE.CatmullRomCurve3(roadPoints, true);

    // Overland Highway Illuminated Corridor
    const roadArcPoints = roadCurve.getPoints(80);
    const roadArcGeom = new THREE.BufferGeometry().setFromPoints(roadArcPoints);
    const roadArcMat = new THREE.LineBasicMaterial({
      color: 0xffa336,
      transparent: true,
      opacity: 0.75,
      linewidth: 2,
    });
    const roadLine = new THREE.Line(roadArcGeom, roadArcMat);
    globePivot.add(roadLine);

    // Build Logistics Lorry (Truck) Model
    const { group: lorryGroup, inner: lorryInner, wheels: lorryWheels } = buildLogisticsLorry();
    globePivot.add(lorryGroup);

    // -------------------------------------------------------------------------
    // I. ACTIVE FREIGHT SHIFTING MECHANISM (Packages transferring at Hub)
    // -------------------------------------------------------------------------
    // At the Mumbai Central Logistics Hub, cargo packages actively shift between depot & lorry
    const mumbaiHubPos = latLonToVector3(19.076, 72.877, roadAltitude);
    const shiftGroup = new THREE.Group();
    shiftGroup.position.copy(mumbaiHubPos);
    shiftGroup.lookAt(mumbaiHubPos.clone().multiplyScalar(2));
    globePivot.add(shiftGroup);

    // Warehouse Loading Dock Platform
    const dockMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const dock = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.04), dockMat);
    shiftGroup.add(dock);

    // Multiple Shifting Cartons
    const shiftingPackages: { group: THREE.Group; progress: number; speed: number; offset: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const p = buildCargoPackage(0.052);
      shiftGroup.add(p);
      shiftingPackages.push({
        group: p,
        progress: i * 0.25,
        speed: 0.009,
        offset: (i - 1.5) * 0.055,
      });
    }

    // Glowing Holographic Cargo Conveyor Beam
    const conveyorMat = new THREE.MeshBasicMaterial({
      color: 0xff7a00,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const conveyor = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.035), conveyorMat);
    conveyor.position.set(0, 0, 0.028);
    shiftGroup.add(conveyor);

    // -------------------------------------------------------------------------
    // J. SMOOTH INTERACTIVE ROTATION & CINEMATIC AUTO-DRIFT
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

    // Viewport Intersection Observer
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

    // -------------------------------------------------------------------------
    // K. 60FPS MASTER ANIMATION LOOP
    // -------------------------------------------------------------------------
    let animationFrameId: number;
    let clock = new THREE.Clock();

    let planeT = 0;
    let shipT = 0.15;
    let lorryT = 0.4;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Continuous, elegant auto-rotation
      if (!isDragging && !prefersReducedMotion) {
        targetRotY += 0.0022;
      }

      globePivot.rotation.y += (targetRotY - globePivot.rotation.y) * 0.08;
      globePivot.rotation.x += (targetRotX - globePivot.rotation.x) * 0.08;

      // Cloud Sphere Counter-Drift
      cloudMesh.rotation.y += 0.0006;

      // 1. Animate Air Cargo Plane
      planeT = (planeT + delta * 0.038) % 1;
      const planePos = flightCurve.getPoint(planeT);
      const planeNext = flightCurve.getPoint((planeT + 0.01) % 1);
      const planeDir = planeNext.clone().sub(planePos).normalize();
      const planeUp = planePos.clone().normalize();

      planeGroup.position.copy(planePos);
      planeGroup.up.copy(planeUp);
      planeGroup.lookAt(planePos.clone().add(planeDir));

      // Natural Bank/Roll into Turns
      const bank = Math.sin(planeT * Math.PI * 4) * 0.28;
      planeInner.rotation.z = bank;

      // Blinking Navigation Strobes
      const strobeOn = Math.sin(elapsed * 12) > 0.5;
      planeLights.forEach((l) => (l.visible = strobeOn));

      // Contrail Particle Evolution
      contrails.forEach((c) => {
        c.life += delta * 1.5;
        if (c.life > 1) {
          c.life = 0;
          c.mesh.position.copy(planePos.clone().add(planeDir.clone().multiplyScalar(-0.08)));
        }
        const s = 0.6 + c.life * 1.2;
        c.mesh.scale.set(s, s, s);
        (c.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - c.life * 0.7);
      });

      // 2. Animate Maritime Cargo Ship
      shipT = (shipT + delta * 0.016) % 1;
      const shipPos = shipCurve.getPoint(shipT);
      const shipNext = shipCurve.getPoint((shipT + 0.01) % 1);
      const shipDir = shipNext.clone().sub(shipPos).normalize();
      const shipUp = shipPos.clone().normalize();

      shipGroup.position.copy(shipPos);
      shipGroup.up.copy(shipUp);
      shipGroup.lookAt(shipPos.clone().add(shipDir));

      // Swell Bobbing (Pitch & Roll)
      shipInner.rotation.x = Math.sin(elapsed * 2.2) * 0.035;
      shipInner.rotation.z = Math.cos(elapsed * 1.8) * 0.045;

      // Rotating Radar Scanner
      shipRadar.rotation.y += 0.06;

      // Foamy Stern Wake
      wakes.forEach((w, idx) => {
        w.scale += delta * 1.2;
        w.opacity -= delta * 0.6;
        if (w.opacity <= 0) {
          w.scale = 1;
          w.opacity = 0.6;
          w.mesh.position.copy(shipPos.clone().add(shipDir.clone().multiplyScalar(-0.06 - idx * 0.01)));
          w.mesh.quaternion.copy(shipGroup.quaternion);
        }
        w.mesh.scale.set(w.scale, w.scale, w.scale);
        (w.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, w.opacity);
      });

      // 3. Animate Logistics Lorry
      lorryT = (lorryT + delta * 0.024) % 1;
      const lorryPos = roadCurve.getPoint(lorryT);
      const lorryNext = roadCurve.getPoint((lorryT + 0.01) % 1);
      const lorryDir = lorryNext.clone().sub(lorryPos).normalize();
      const lorryUp = lorryPos.clone().normalize();

      lorryGroup.position.copy(lorryPos);
      lorryGroup.up.copy(lorryUp);
      lorryGroup.lookAt(lorryPos.clone().add(lorryDir));

      // Rotate Wheels As Truck Drives
      lorryWheels.forEach((w) => {
        w.rotation.x += 0.15;
      });

      // 4. Active Freight Shifting Animation at Logistics Terminal
      shiftingPackages.forEach((pkg) => {
        pkg.progress = (pkg.progress + pkg.speed) % 1;
        // Shift along X axis from warehouse platform onto the lorry transfer bay
        const shiftX = (pkg.progress - 0.5) * 0.22;
        // Arching trajectory lifting carton up and shifting it
        const shiftZ = 0.03 + Math.sin(pkg.progress * Math.PI) * 0.04;
        pkg.group.position.set(shiftX, pkg.offset, shiftZ);
        pkg.group.rotation.y = pkg.progress * Math.PI * 0.5;
      });

      // 5. Hub Pulse Beacons
      hubBeacons.forEach((b) => {
        b.scale += b.speed;
        if (b.scale > 2.6) b.scale = 1;
        b.ring.scale.set(b.scale, b.scale, 1);
        (b.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - (b.scale - 1) / 1.6);
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
      {/* Pure 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D Global Trade Animation"
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
              Connecting buyers and suppliers across international air cargo, ocean freight, and overland logistics networks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

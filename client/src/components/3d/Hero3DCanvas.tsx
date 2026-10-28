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
// 1. PROCEDURAL WORLD CONTINENTS & INDUSTRIAL CITY LIGHTS TEXTURE
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

  // Deep Oceanic Midnight Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, "#040814");
  oceanGrad.addColorStop(0.3, "#071224");
  oceanGrad.addColorStop(0.7, "#08162b");
  oceanGrad.addColorStop(1, "#030610");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Nautical Graticule Grid
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

  // Equator Highlight
  ctx.strokeStyle = "rgba(255, 122, 0, 0.22)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  ctx.setLineDash([]);

  const mapPoint = (lat: number, lon: number): [number, number] => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  };

  const drawContinent = (
    points: [number, number][],
    glowColor = "rgba(6, 182, 212, 0.5)",
    fillColor = "#0F1F38",
    innerColor = "#162E52"
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

  // Indian Subcontinent
  drawContinent(
    [
      [36, 74], [34, 78], [30, 81], [27, 88], [24, 91], [22, 92], [21, 89], [22, 87],
      [19, 85], [16, 82], [13, 80], [10, 79], [8.3, 77.5], [8.5, 77.0], [11, 75.8],
      [15, 73.8], [19, 72.8], [21, 72.5], [23, 68.5], [24.5, 68.2], [28, 70], [32, 73], [35, 74]
    ],
    "rgba(255, 122, 0, 0.85)",
    "#192D4A",
    "#223C63"
  );
  drawContinent([[9.8, 80.2], [8.5, 81.2], [6.0, 80.7], [6.8, 79.8], [8.5, 79.7]], "rgba(255, 122, 0, 0.7)", "#192D4A");

  // Southeast Asia & Malay
  drawContinent([[22, 92], [22, 108], [11, 109], [8.5, 105], [13, 101], [1, 104], [3, 98], [14, 98], [21, 93]], "rgba(6, 182, 212, 0.5)", "#132644");
  drawContinent([[5, 95], [2, 98], [-4, 105], [-6, 103], [0, 98]], "rgba(6, 182, 212, 0.4)", "#11223D");
  drawContinent([[-6, 106], [-7, 114], [-8, 114], [-7, 106]], "rgba(6, 182, 212, 0.4)", "#11223D");
  drawContinent([[4, 117], [0, 118], [-4, 115], [-2, 110], [5, 112]], "rgba(6, 182, 212, 0.4)", "#11223D");

  // East Asia & Japan
  drawContinent([[22, 108], [26, 120], [32, 121], [39, 118], [40, 124], [43, 131], [48, 135], [53, 120], [45, 100], [40, 80], [34, 78], [24, 91], [22, 108]], "rgba(6, 182, 212, 0.5)", "#142642");
  drawContinent([[44, 143], [42, 141], [36, 138], [33, 131], [34, 135], [40, 141]], "rgba(6, 182, 212, 0.45)", "#142642");

  // Middle East & Arabia
  drawContinent([[31, 35], [32, 40], [30, 48], [27, 50], [25, 55], [24, 57], [22, 59], [17, 54], [12.5, 44], [13, 43], [20, 39], [28, 34], [31, 35]], "rgba(245, 158, 11, 0.6)", "#162740");
  drawContinent([[37, 44], [39, 50], [37, 59], [31, 62], [25, 62], [27, 56], [30, 48], [37, 44]], "rgba(6, 182, 212, 0.4)", "#13243D");

  // Europe & UK
  drawContinent([[36, -6], [43, -9], [48, -4], [50, 1], [54, 8], [58, 5], [62, 10], [70, 25], [60, 30], [55, 37], [45, 35], [41, 28], [37, 24], [38, 15], [44, 8], [38, 0], [36, -6]], "rgba(6, 182, 212, 0.5)", "#142540");
  drawContinent([[50, -5], [54, -3], [58, -4], [56, -6], [51, -1]], "rgba(6, 182, 212, 0.45)", "#142540");

  // Africa
  drawContinent([[36, -6], [37, 10], [32, 31], [28, 34], [12, 44], [11, 51], [0, 42], [-12, 40], [-26, 33], [-34, 26], [-34, 18], [-22, 14], [-5, 12], [4, 9], [6, 2], [5, -4], [14, -17], [21, -17], [28, -12], [35, -2], [36, -6]], "rgba(6, 182, 212, 0.45)", "#112035");

  // North America
  drawContinent([[70, -160], [71, -125], [60, -75], [50, -55], [44, -65], [30, -81], [25, -80], [28, -96], [20, -97], [16, -92], [9, -78], [15, -92], [22, -106], [32, -117], [48, -124], [58, -140], [65, -168], [70, -160]], "rgba(6, 182, 212, 0.5)", "#122238");

  // South America
  drawContinent([[11, -74], [10, -62], [4, -51], [-3, -40], [-8, -35], [-23, -43], [-34, -53], [-53, -68], [-54, -72], [-40, -73], [-18, -71], [-5, -80], [2, -78], [11, -74]], "rgba(6, 182, 212, 0.5)", "#122238");

  // Australia
  drawContinent([[-12, 131], [-14, 136], [-12, 142], [-23, 151], [-33, 152], [-38, 147], [-37, 139], [-34, 115], [-22, 114], [-15, 124], [-12, 131]], "rgba(6, 182, 212, 0.5)", "#122238");

  // Global City Light Clusters Across All Continents
  const drawCityCluster = (lat: number, lon: number, radius = 6, color = "#FFB020") => {
    const [cx, cy] = mapPoint(lat, lon);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 3.5);
    grad.addColorStop(0, color);
    grad.addColorStop(0.3, "rgba(255, 122, 0, 0.7)");
    grad.addColorStop(0.7, "rgba(245, 158, 11, 0.25)");
    grad.addColorStop(1, "rgba(255, 122, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  };

  // Indian Subcontinent
  drawCityCluster(19.076, 72.877, 9, "#FF7A00"); // Mumbai
  drawCityCluster(28.613, 77.209, 8, "#FFA336"); // Delhi NCR
  drawCityCluster(12.971, 77.594, 7, "#FFB84D"); // Bengaluru
  drawCityCluster(13.082, 80.27, 7, "#FF921F"); // Chennai
  drawCityCluster(23.022, 72.571, 7, "#FF921F"); // Gujarat
  drawCityCluster(22.572, 88.363, 7, "#FFA336"); // Kolkata

  // East & Southeast Asia
  drawCityCluster(1.352, 103.819, 8, "#38BDF8"); // Singapore
  drawCityCluster(31.23, 121.473, 9, "#38BDF8"); // Shanghai
  drawCityCluster(35.676, 139.65, 8, "#38BDF8"); // Tokyo
  drawCityCluster(22.319, 114.169, 7, "#38BDF8"); // Hong Kong
  drawCityCluster(39.904, 116.407, 8, "#38BDF8"); // Beijing

  // Middle East & Africa
  drawCityCluster(25.204, 55.27, 9, "#38BDF8"); // Dubai
  drawCityCluster(24.713, 46.675, 7, "#F59E0B"); // Riyadh
  drawCityCluster(30.044, 31.236, 7, "#F59E0B"); // Cairo
  drawCityCluster(-26.204, 28.047, 7, "#F59E0B"); // Johannesburg

  // Europe
  drawCityCluster(50.11, 8.682, 8, "#38BDF8"); // Frankfurt
  drawCityCluster(51.507, -0.128, 8, "#38BDF8"); // London
  drawCityCluster(48.856, 2.352, 7, "#38BDF8"); // Paris
  drawCityCluster(51.924, 4.478, 8, "#38BDF8"); // Rotterdam

  // North America
  drawCityCluster(40.712, -74.006, 9, "#38BDF8"); // New York
  drawCityCluster(34.052, -118.244, 9, "#38BDF8"); // Los Angeles
  drawCityCluster(41.878, -87.629, 8, "#38BDF8"); // Chicago
  drawCityCluster(37.774, -122.419, 7, "#38BDF8"); // San Francisco
  drawCityCluster(25.761, -80.191, 7, "#38BDF8"); // Miami

  // South America & Australia
  drawCityCluster(-23.55, -46.633, 8, "#F59E0B"); // São Paulo
  drawCityCluster(-34.603, -58.381, 7, "#F59E0B"); // Buenos Aires
  drawCityCluster(-33.868, 151.209, 8, "#38BDF8"); // Sydney
  drawCityCluster(-37.813, 144.963, 7, "#38BDF8"); // Melbourne

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

// ---------------------------------------------------------------------------
// 2. PROCEDURAL CLOUD COVER
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

    for (let i = 0; i < 48; i++) {
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

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.7 });
  const orangeLivery = new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.2, metalness: 0.5, emissive: 0xff7a00, emissiveIntensity: 0.4 });
  const cockpitMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9 });

  // Fuselage
  const fuselageGeom = new THREE.CylinderGeometry(0.046, 0.05, 0.42, 16);
  fuselageGeom.rotateX(Math.PI / 2);
  inner.add(new THREE.Mesh(fuselageGeom, bodyMat));

  // Nose Cone
  const noseGeom = new THREE.ConeGeometry(0.046, 0.12, 16);
  noseGeom.rotateX(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeom, bodyMat);
  nose.position.z = 0.27;
  inner.add(nose);

  // Cockpit
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.024, 0.09), cockpitMat);
  cockpit.position.set(0, 0.034, 0.22);
  inner.add(cockpit);

  // Wings & Winglets
  const wings = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.014, 0.15), bodyMat);
  wings.position.set(0, 0, 0.04);
  inner.add(wings);

  const leftWinglet = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.045, 0.07), orangeLivery);
  leftWinglet.position.set(-0.36, 0.022, 0.04);
  const rightWinglet = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.045, 0.07), orangeLivery);
  rightWinglet.position.set(0.36, 0.022, 0.04);
  inner.add(leftWinglet, rightWinglet);

  // Jet Engines
  const engineGeom = new THREE.CylinderGeometry(0.026, 0.026, 0.12, 12);
  engineGeom.rotateX(Math.PI / 2);

  const leftEngine = new THREE.Mesh(engineGeom, bodyMat);
  leftEngine.position.set(-0.18, -0.035, 0.03);
  const rightEngine = new THREE.Mesh(engineGeom, bodyMat);
  rightEngine.position.set(0.18, -0.035, 0.03);

  const exhaustMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const leftExhaust = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), exhaustMat);
  leftExhaust.position.set(-0.18, -0.035, -0.03);
  const rightExhaust = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), exhaustMat);
  rightExhaust.position.set(0.18, -0.035, -0.03);

  inner.add(leftEngine, rightEngine, leftExhaust, rightExhaust);

  // Tail
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.13, 0.12), orangeLivery);
  tailFin.position.set(0, 0.075, -0.18);
  tailFin.rotation.x = -0.25;

  const tailHori = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.012, 0.09), bodyMat);
  tailHori.position.set(0, 0.02, -0.2);

  inner.add(tailFin, tailHori);

  // Strobes
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

  const upperHull = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.58), hullUpperMat);
  upperHull.position.y = 0.022;
  const lowerHull = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.54), hullLowerMat);
  lowerHull.position.y = -0.016;
  inner.add(upperHull, lowerHull);

  const bowGeom = new THREE.ConeGeometry(0.09, 0.14, 4);
  bowGeom.rotateX(Math.PI / 2);
  bowGeom.rotateY(Math.PI / 4);
  const bow = new THREE.Mesh(bowGeom, hullUpperMat);
  bow.position.set(0, 0.022, 0.35);
  inner.add(bow);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.012, 0.52), deckMat);
  deck.position.y = 0.046;
  inner.add(deck);

  // Containers
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

  // Superstructure
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.09), bridgeMat);
  bridge.position.set(0, 0.1, -0.2);
  inner.add(bridge);

  const windowMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const windows = new THREE.Mesh(new THREE.BoxGeometry(0.132, 0.02, 0.07), windowMat);
  windows.position.set(0, 0.128, -0.19);
  inner.add(windows);

  const funnelMat = new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.3 });
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.055, 8), funnelMat);
  funnel.position.set(0, 0.165, -0.23);
  inner.add(funnel);

  const radarMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const radar = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.009, 0.012), radarMat);
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

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.02, 0.45), chassisMat);
  chassis.position.y = 0.032;
  inner.add(chassis);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.088, 0.11), cabMat);
  cab.position.set(0, 0.08, 0.15);
  inner.add(cab);

  const windshieldMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.038, 0.02), windshieldMat);
  windshield.position.set(0, 0.096, 0.205);
  inner.add(windshield);

  // Headlights
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const leftHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.016, 0.01), headlightMat);
  leftHeadlight.position.set(-0.045, 0.055, 0.208);
  const rightHeadlight = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.016, 0.01), headlightMat);
  rightHeadlight.position.set(0.045, 0.055, 0.208);
  inner.add(leftHeadlight, rightHeadlight);

  // Light Cones
  const coneGeom = new THREE.ConeGeometry(0.08, 0.28, 8);
  coneGeom.rotateX(Math.PI / 2);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  });
  const leftBeam = new THREE.Mesh(coneGeom, coneMat);
  leftBeam.position.set(-0.045, 0.04, 0.35);
  const rightBeam = new THREE.Mesh(coneGeom, coneMat);
  rightBeam.position.set(0.045, 0.04, 0.35);
  inner.add(leftBeam, rightBeam);

  // Trailer
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.105, 0.29), trailerMat);
  trailer.position.set(0, 0.092, -0.065);
  inner.add(trailer);

  const band = new THREE.Mesh(new THREE.BoxGeometry(0.132, 0.022, 0.292), new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.3 }));
  band.position.set(0, 0.092, -0.065);
  inner.add(band);

  // Wheels
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
// 6. CARGO PACKAGE BUILDER
// ---------------------------------------------------------------------------
function buildCargoPackage(size = 0.055): THREE.Group {
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
// 7. FREIGHT SHIFTING TERMINAL (Warehouse Dock with Conveyor & Shifting Boxes)
// ---------------------------------------------------------------------------
function buildCargoTransferHub(pos: THREE.Vector3): { group: THREE.Group; packages: { group: THREE.Group; progress: number; speed: number; offset: number }[] } {
  const group = new THREE.Group();
  group.position.copy(pos);
  group.lookAt(pos.clone().multiplyScalar(2));

  // Dock
  const dockMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const dock = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.04), dockMat);
  group.add(dock);

  // Conveyor beam
  const conveyorMat = new THREE.MeshBasicMaterial({
    color: 0xff7a00,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  });
  const conveyor = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.035), conveyorMat);
  conveyor.position.set(0, 0, 0.028);
  group.add(conveyor);

  // Shifting packages
  const packages: { group: THREE.Group; progress: number; speed: number; offset: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const p = buildCargoPackage(0.048);
    group.add(p);
    packages.push({
      group: p,
      progress: i * 0.25,
      speed: 0.01 + Math.random() * 0.004,
      offset: (i - 1.5) * 0.05,
    });
  }

  return { group, packages };
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT - CONTINUOUS GLOBAL MULTI-MODAL LOGISTICS GRID
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 6.6);
    camera.lookAt(0, 0, 0);

    // Illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
    sunLight.position.set(8, 6, 7);
    scene.add(sunLight);

    const orangeRimLight = new THREE.PointLight(0xff7a00, 4.2, 16);
    orangeRimLight.position.set(-6, -2, 4);
    scene.add(orangeRimLight);

    const cyanRimLight = new THREE.PointLight(0x06b6d4, 3.8, 16);
    cyanRimLight.position.set(5, -4, -3);
    scene.add(cyanRimLight);

    // Main Pivot Group
    const globePivot = new THREE.Group();
    scene.add(globePivot);

    globePivot.rotation.y = -Math.PI * 0.42;
    globePivot.rotation.x = 0.22;

    const globeRadius = 1.95;

    // 1. Earth Sphere
    const earthTexture = createProceduralEarthTexture();
    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.45,
      metalness: 0.25,
    });
    const globeMesh = new THREE.Mesh(new THREE.SphereGeometry(globeRadius, 64, 64), globeMat);
    globePivot.add(globeMesh);

    // 2. Procedural Clouds
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
      opacity: 0.14,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmoMesh = new THREE.Mesh(new THREE.SphereGeometry(globeRadius * 1.13, 32, 32), atmoMat);
    scene.add(atmoMesh);

    // -------------------------------------------------------------------------
    // A. GLOBAL TRADE HUBS & BEACONS ACROSS ALL CONTINENTS
    // -------------------------------------------------------------------------
    const hubs = [
      // South Asia & Middle East
      { name: "Mumbai", lat: 19.076, lon: 72.877, color: 0xff7a00, primary: true },
      { name: "Dubai", lat: 25.204, lon: 55.27, color: 0xf59e0b },
      { name: "Delhi", lat: 28.613, lon: 77.209, color: 0xff7a00 },
      // East & Southeast Asia
      { name: "Singapore", lat: 1.352, lon: 103.819, color: 0x06b6d4 },
      { name: "Shanghai", lat: 31.23, lon: 121.473, color: 0x06b6d4 },
      { name: "Tokyo", lat: 35.676, lon: 139.65, color: 0x38bdf8 },
      // Europe
      { name: "Frankfurt", lat: 50.11, lon: 8.682, color: 0x38bdf8 },
      { name: "London", lat: 51.507, lon: -0.128, color: 0x38bdf8 },
      { name: "Rotterdam", lat: 51.924, lon: 4.478, color: 0x06b6d4 },
      // Americas
      { name: "New York", lat: 40.712, lon: -74.006, color: 0x38bdf8 },
      { name: "Los Angeles", lat: 34.052, lon: -118.244, color: 0x38bdf8 },
      { name: "São Paulo", lat: -23.55, lon: -46.633, color: 0xf59e0b },
      // Africa & Oceania
      { name: "Cairo", lat: 30.044, lon: 31.236, color: 0xf59e0b },
      { name: "Johannesburg", lat: -26.204, lon: 28.047, color: 0xf59e0b },
      { name: "Sydney", lat: -33.868, lon: 151.209, color: 0x06b6d4 },
    ];

    const hubBeacons: { ring: THREE.Mesh; scale: number; speed: number }[] = [];

    hubs.forEach((hub) => {
      const pos = latLonToVector3(hub.lat, hub.lon, globeRadius * 1.002);
      const hubGroup = new THREE.Group();
      hubGroup.position.copy(pos);
      hubGroup.lookAt(pos.clone().multiplyScalar(2));

      // Core sphere
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(hub.primary ? 0.055 : 0.038, 16, 16),
        new THREE.MeshBasicMaterial({ color: hub.color })
      );
      hubGroup.add(core);

      // Pulsing ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.04, 0.085, 24),
        new THREE.MeshBasicMaterial({ color: hub.color, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
      );
      hubGroup.add(ring);
      hubBeacons.push({ ring, scale: 1, speed: 0.015 + Math.random() * 0.01 });

      // Vertical beacon beam
      const beamHeight = hub.primary ? 0.48 : 0.28;
      const beamGeom = new THREE.CylinderGeometry(0.007, 0.015, beamHeight, 8);
      beamGeom.rotateX(Math.PI / 2);
      const beam = new THREE.Mesh(beamGeom, new THREE.MeshBasicMaterial({ color: hub.color, transparent: true, opacity: 0.5 }));
      beam.position.z = beamHeight / 2;
      hubGroup.add(beam);

      globePivot.add(hubGroup);
    });

    // -------------------------------------------------------------------------
    // B. FLIGHT FLEET ACROSS ALL CONTINENTS (NO EMPTY SPACES)
    // -------------------------------------------------------------------------
    const flightAltitude = globeRadius * 1.25;

    // 1. Eurasian & Middle East Loop
    const flightPointsA = [
      latLonToVector3(19.076, 72.877, flightAltitude), // Mumbai
      latLonToVector3(25.204, 55.27, flightAltitude * 1.02), // Dubai
      latLonToVector3(50.11, 8.682, flightAltitude * 1.03), // Frankfurt
      latLonToVector3(51.507, -0.128, flightAltitude * 1.02), // London
      latLonToVector3(30.044, 31.236, flightAltitude), // Cairo
      latLonToVector3(19.076, 72.877, flightAltitude), // Back to Mumbai
    ];
    const flightCurveA = new THREE.CatmullRomCurve3(flightPointsA, true);

    // 2. Trans-Pacific & East Asia Loop
    const flightPointsB = [
      latLonToVector3(31.23, 121.473, flightAltitude * 1.02), // Shanghai
      latLonToVector3(35.676, 139.65, flightAltitude * 1.03), // Tokyo
      latLonToVector3(34.052, -118.244, flightAltitude * 1.04), // Los Angeles
      latLonToVector3(21.307, -157.858, flightAltitude * 1.02), // Hawaii
      latLonToVector3(-33.868, 151.209, flightAltitude * 1.02), // Sydney
      latLonToVector3(1.352, 103.819, flightAltitude), // Singapore
      latLonToVector3(31.23, 121.473, flightAltitude * 1.02), // Back to Shanghai
    ];
    const flightCurveB = new THREE.CatmullRomCurve3(flightPointsB, true);

    // 3. Trans-Atlantic & Pan-American Loop
    const flightPointsC = [
      latLonToVector3(51.507, -0.128, flightAltitude * 1.02), // London
      latLonToVector3(40.712, -74.006, flightAltitude * 1.03), // New York
      latLonToVector3(34.052, -118.244, flightAltitude * 1.04), // Los Angeles
      latLonToVector3(8.982, -79.519, flightAltitude * 1.02), // Panama
      latLonToVector3(-23.55, -46.633, flightAltitude * 1.03), // São Paulo
      latLonToVector3(14.716, -17.467, flightAltitude * 1.02), // West Africa
      latLonToVector3(50.11, 8.682, flightAltitude * 1.02), // Frankfurt
      latLonToVector3(51.507, -0.128, flightAltitude * 1.02), // London
    ];
    const flightCurveC = new THREE.CatmullRomCurve3(flightPointsC, true);

    // Glowing Neon Flight Arc Lines
    const flightArcMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      linewidth: 2,
    });

    [flightCurveA, flightCurveB, flightCurveC].forEach((curve) => {
      const geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(100));
      const line = new THREE.Line(geom, flightArcMat);
      globePivot.add(line);
    });

    // Planes Fleet: 6 planes moving continuously with staggered offsets
    interface PlaneEntity {
      group: THREE.Group;
      inner: THREE.Group;
      lights: THREE.Mesh[];
      curve: THREE.CatmullRomCurve3;
      offset: number;
      speed: number;
    }

    const planeFleet: PlaneEntity[] = [];

    const planeConfigurations = [
      { curve: flightCurveA, offset: 0.0, speed: 0.038 },
      { curve: flightCurveA, offset: 0.5, speed: 0.038 },
      { curve: flightCurveB, offset: 0.15, speed: 0.034 },
      { curve: flightCurveB, offset: 0.65, speed: 0.034 },
      { curve: flightCurveC, offset: 0.3, speed: 0.036 },
      { curve: flightCurveC, offset: 0.8, speed: 0.036 },
    ];

    // Contrail particles
    const contrailGeom = new THREE.SphereGeometry(0.016, 6, 6);
    const contrailMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.7 });
    const contrailPool: { mesh: THREE.Mesh; planeIdx: number; life: number }[] = [];

    planeConfigurations.forEach((cfg, idx) => {
      const { group: pGroup, inner: pInner, lights: pLights } = buildCargoAirplane();
      globePivot.add(pGroup);
      planeFleet.push({
        group: pGroup,
        inner: pInner,
        lights: pLights,
        curve: cfg.curve,
        offset: cfg.offset,
        speed: cfg.speed,
      });

      // 8 contrails per plane
      for (let i = 0; i < 8; i++) {
        const cMesh = new THREE.Mesh(contrailGeom, contrailMat.clone());
        globePivot.add(cMesh);
        contrailPool.push({ mesh: cMesh, planeIdx: idx, life: i / 8 });
      }
    });

    // -------------------------------------------------------------------------
    // C. MARITIME SHIPPING FLEET ACROSS ALL OCEANS (NO EMPTY SPACES)
    // -------------------------------------------------------------------------
    const seaRadius = globeRadius * 1.005;

    // 1. Indian Ocean & Middle East Shipping Lane
    const shipPointsA = [
      latLonToVector3(18.5, 72.6, seaRadius), // Mumbai Port
      latLonToVector3(22.0, 62.0, seaRadius), // Arabian Sea
      latLonToVector3(24.5, 57.5, seaRadius), // Gulf of Oman
      latLonToVector3(12.0, 50.0, seaRadius), // Gulf of Aden
      latLonToVector3(5.5, 80.5, seaRadius), // South Sri Lanka
      latLonToVector3(1.2, 103.8, seaRadius), // Singapore
      latLonToVector3(12.0, 90.0, seaRadius), // Bay of Bengal
      latLonToVector3(18.5, 72.6, seaRadius), // Mumbai Port
    ];
    const shipCurveA = new THREE.CatmullRomCurve3(shipPointsA, true);

    // 2. Atlantic Ocean Shipping Lane
    const shipPointsB = [
      latLonToVector3(51.924, 4.478, seaRadius), // Rotterdam
      latLonToVector3(48.0, -6.0, seaRadius), // English Channel exit
      latLonToVector3(42.0, -40.0, seaRadius), // Mid North Atlantic
      latLonToVector3(40.5, -73.8, seaRadius), // New York Port
      latLonToVector3(25.0, -75.0, seaRadius), // Caribbean
      latLonToVector3(9.5, -79.8, seaRadius), // Panama Canal entrance
      latLonToVector3(35.0, -15.0, seaRadius), // Approach to Gibraltar
      latLonToVector3(36.0, -5.0, seaRadius), // Strait of Gibraltar
      latLonToVector3(44.0, -8.0, seaRadius), // Bay of Biscay
      latLonToVector3(51.924, 4.478, seaRadius), // Rotterdam
    ];
    const shipCurveB = new THREE.CatmullRomCurve3(shipPointsB, true);

    // 3. Pacific Ocean Shipping Lane
    const shipPointsC = [
      latLonToVector3(31.0, 122.0, seaRadius), // Shanghai Port
      latLonToVector3(34.0, 140.0, seaRadius), // Tokyo Bay approach
      latLonToVector3(40.0, 175.0, seaRadius), // North Pacific
      latLonToVector3(33.7, -118.2, seaRadius), // Los Angeles Port
      latLonToVector3(10.0, -140.0, seaRadius), // Central Pacific
      latLonToVector3(-33.8, 151.3, seaRadius), // Sydney Harbor approach
      latLonToVector3(-5.0, 130.0, seaRadius), // Indonesian archipelago
      latLonToVector3(1.2, 103.8, seaRadius), // Singapore
      latLonToVector3(14.0, 114.0, seaRadius), // South China Sea
      latLonToVector3(31.0, 122.0, seaRadius), // Shanghai Port
    ];
    const shipCurveC = new THREE.CatmullRomCurve3(shipPointsC, true);

    // Nautical dashed lines
    const shipArcMat = new THREE.LineDashedMaterial({
      color: 0x06b6d4,
      dashSize: 0.08,
      gapSize: 0.05,
      transparent: true,
      opacity: 0.45,
    });

    [shipCurveA, shipCurveB, shipCurveC].forEach((curve) => {
      const geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(90));
      const line = new THREE.Line(geom, shipArcMat);
      line.computeLineDistances();
      globePivot.add(line);
    });

    // Ship Fleet: 6 vessels distributed across the oceans
    interface ShipEntity {
      group: THREE.Group;
      inner: THREE.Group;
      radar: THREE.Mesh;
      curve: THREE.CatmullRomCurve3;
      offset: number;
      speed: number;
    }

    const shipFleet: ShipEntity[] = [];

    const shipConfigurations = [
      { curve: shipCurveA, offset: 0.0, speed: 0.016 },
      { curve: shipCurveA, offset: 0.5, speed: 0.016 },
      { curve: shipCurveB, offset: 0.2, speed: 0.015 },
      { curve: shipCurveB, offset: 0.7, speed: 0.015 },
      { curve: shipCurveC, offset: 0.1, speed: 0.014 },
      { curve: shipCurveC, offset: 0.6, speed: 0.014 },
    ];

    // Wake ripples
    const wakeGeom = new THREE.RingGeometry(0.02, 0.065, 12);
    const wakeMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const wakePool: { mesh: THREE.Mesh; shipIdx: number; scale: number; opacity: number }[] = [];

    shipConfigurations.forEach((cfg, idx) => {
      const { group: sGroup, inner: sInner, radar: sRadar } = buildCargoShip();
      globePivot.add(sGroup);
      shipFleet.push({
        group: sGroup,
        inner: sInner,
        radar: sRadar,
        curve: cfg.curve,
        offset: cfg.offset,
        speed: cfg.speed,
      });

      for (let i = 0; i < 4; i++) {
        const wMesh = new THREE.Mesh(wakeGeom, wakeMat.clone());
        globePivot.add(wMesh);
        wakePool.push({ mesh: wMesh, shipIdx: idx, scale: 1, opacity: 0.6 });
      }
    });

    // -------------------------------------------------------------------------
    // D. OVERLAND HIGHWAYS & LORRIES FLEET ACROSS CONTINENTS (SHIFTING GOODS)
    // -------------------------------------------------------------------------
    const roadAltitude = globeRadius * 1.008;

    // 1. South Asia Industrial Corridor
    const roadCurveIndia = new THREE.CatmullRomCurve3([
      latLonToVector3(19.076, 72.877, roadAltitude), // Mumbai
      latLonToVector3(23.022, 72.571, roadAltitude), // Gujarat
      latLonToVector3(28.613, 77.209, roadAltitude), // Delhi NCR
      latLonToVector3(26.449, 80.331, roadAltitude), // Kanpur
      latLonToVector3(22.572, 88.363, roadAltitude), // Kolkata
      latLonToVector3(17.385, 78.486, roadAltitude), // Hyderabad
      latLonToVector3(12.971, 77.594, roadAltitude), // Bengaluru
      latLonToVector3(13.082, 80.27, roadAltitude), // Chennai
      latLonToVector3(19.076, 72.877, roadAltitude), // Mumbai
    ], true);

    // 2. North America Interstate Corridor
    const roadCurveUSA = new THREE.CatmullRomCurve3([
      latLonToVector3(40.712, -74.006, roadAltitude), // New York
      latLonToVector3(41.878, -87.629, roadAltitude), // Chicago
      latLonToVector3(39.739, -104.99, roadAltitude), // Denver
      latLonToVector3(34.052, -118.244, roadAltitude), // Los Angeles
      latLonToVector3(32.776, -96.797, roadAltitude), // Dallas
      latLonToVector3(29.76, -95.369, roadAltitude), // Houston
      latLonToVector3(33.749, -84.388, roadAltitude), // Atlanta
      latLonToVector3(40.712, -74.006, roadAltitude), // New York
    ], true);

    // 3. European Intermodal Artery
    const roadCurveEurope = new THREE.CatmullRomCurve3([
      latLonToVector3(51.924, 4.478, roadAltitude), // Rotterdam
      latLonToVector3(50.11, 8.682, roadAltitude), // Frankfurt
      latLonToVector3(48.135, 11.582, roadAltitude), // Munich
      latLonToVector3(45.464, 9.19, roadAltitude), // Milan
      latLonToVector3(48.856, 2.352, roadAltitude), // Paris
      latLonToVector3(51.219, 4.402, roadAltitude), // Antwerp
      latLonToVector3(51.924, 4.478, roadAltitude), // Rotterdam
    ], true);

    // 4. East Asian Manufacturing Belt
    const roadCurveChina = new THREE.CatmullRomCurve3([
      latLonToVector3(31.23, 121.473, roadAltitude), // Shanghai
      latLonToVector3(39.904, 116.407, roadAltitude), // Beijing
      latLonToVector3(30.592, 114.305, roadAltitude), // Wuhan
      latLonToVector3(22.543, 114.057, roadAltitude), // Shenzhen
      latLonToVector3(23.129, 113.264, roadAltitude), // Guangzhou
      latLonToVector3(30.274, 120.155, roadAltitude), // Hangzhou
      latLonToVector3(31.23, 121.473, roadAltitude), // Shanghai
    ], true);

    // Illuminated overland roads
    const roadArcMat = new THREE.LineBasicMaterial({
      color: 0xffa336,
      transparent: true,
      opacity: 0.75,
      linewidth: 2,
    });

    [roadCurveIndia, roadCurveUSA, roadCurveEurope, roadCurveChina].forEach((curve) => {
      const geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(70));
      const line = new THREE.Line(geom, roadArcMat);
      globePivot.add(line);
    });

    // Lorry Fleet: multiple trucks driving on each major continental highway
    interface LorryEntity {
      group: THREE.Group;
      inner: THREE.Group;
      wheels: THREE.Mesh[];
      curve: THREE.CatmullRomCurve3;
      offset: number;
      speed: number;
    }

    const lorryFleet: LorryEntity[] = [];

    const lorryConfigurations = [
      { curve: roadCurveIndia, offset: 0.0, speed: 0.024 },
      { curve: roadCurveIndia, offset: 0.5, speed: 0.024 },
      { curve: roadCurveUSA, offset: 0.1, speed: 0.022 },
      { curve: roadCurveUSA, offset: 0.6, speed: 0.022 },
      { curve: roadCurveEurope, offset: 0.25, speed: 0.025 },
      { curve: roadCurveEurope, offset: 0.75, speed: 0.025 },
      { curve: roadCurveChina, offset: 0.35, speed: 0.023 },
    ];

    lorryConfigurations.forEach((cfg) => {
      const { group: lGroup, inner: lInner, wheels: lWheels } = buildLogisticsLorry();
      globePivot.add(lGroup);
      lorryFleet.push({
        group: lGroup,
        inner: lInner,
        wheels: lWheels,
        curve: cfg.curve,
        offset: cfg.offset,
        speed: cfg.speed,
      });
    });

    // -------------------------------------------------------------------------
    // E. ACTIVE FREIGHT SHIFTING HUBS (Goods Shifting at Key Terminals)
    // -------------------------------------------------------------------------
    // Continuous dynamic cargo package shifting across 4 global hub locations
    const shiftHubs = [
      latLonToVector3(19.076, 72.877, roadAltitude), // Mumbai Terminal
      latLonToVector3(50.11, 8.682, roadAltitude), // Frankfurt Terminal
      latLonToVector3(41.878, -87.629, roadAltitude), // Chicago Terminal
      latLonToVector3(31.23, 121.473, roadAltitude), // Shanghai Terminal
    ];

    const allShiftingPackages: { group: THREE.Group; progress: number; speed: number; offset: number }[] = [];

    shiftHubs.forEach((hubPos) => {
      const { group: hubGroup, packages } = buildCargoTransferHub(hubPos);
      globePivot.add(hubGroup);
      packages.forEach((pkg) => allShiftingPackages.push(pkg));
    });

    // -------------------------------------------------------------------------
    // F. SMOOTH INTERACTIVE ROTATION & CINEMATIC AUTO-DRIFT
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
    // G. 60FPS MASTER ANIMATION LOOP
    // -------------------------------------------------------------------------
    let animationFrameId: number;
    let clock = new THREE.Clock();

    let globalT = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Continuous auto-rotation
      if (!isDragging && !prefersReducedMotion) {
        targetRotY += 0.0022;
      }

      globePivot.rotation.y += (targetRotY - globePivot.rotation.y) * 0.08;
      globePivot.rotation.x += (targetRotX - globePivot.rotation.x) * 0.08;

      cloudMesh.rotation.y += 0.0006;

      globalT += delta;

      // 1. Animate Entire Air Fleet Across All Continents
      const strobeOn = Math.sin(elapsed * 12) > 0.5;

      planeFleet.forEach((p, idx) => {
        const t = (p.offset + globalT * p.speed) % 1;
        const pos = p.curve.getPoint(t);
        const nextPos = p.curve.getPoint((t + 0.01) % 1);
        const dir = nextPos.clone().sub(pos).normalize();
        const up = pos.clone().normalize();

        p.group.position.copy(pos);
        p.group.up.copy(up);
        p.group.lookAt(pos.clone().add(dir));

        // Banking
        const bank = Math.sin((t + idx * 0.2) * Math.PI * 4) * 0.28;
        p.inner.rotation.z = bank;

        p.lights.forEach((l) => (l.visible = strobeOn));
      });

      // Update contrails for each plane
      contrailPool.forEach((c) => {
        c.life += delta * 1.5;
        const p = planeFleet[c.planeIdx];
        if (p) {
          if (c.life > 1) {
            c.life = 0;
            const t = (p.offset + globalT * p.speed) % 1;
            const pos = p.curve.getPoint(t);
            const nextPos = p.curve.getPoint((t + 0.01) % 1);
            const dir = nextPos.clone().sub(pos).normalize();
            c.mesh.position.copy(pos.clone().add(dir.clone().multiplyScalar(-0.08)));
          }
          const s = 0.6 + c.life * 1.2;
          c.mesh.scale.set(s, s, s);
          (c.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - c.life * 0.7);
        }
      });

      // 2. Animate Entire Maritime Fleet Across All Oceans
      shipFleet.forEach((s) => {
        const t = (s.offset + globalT * s.speed) % 1;
        const pos = s.curve.getPoint(t);
        const nextPos = s.curve.getPoint((t + 0.01) % 1);
        const dir = nextPos.clone().sub(pos).normalize();
        const up = pos.clone().normalize();

        s.group.position.copy(pos);
        s.group.up.copy(up);
        s.group.lookAt(pos.clone().add(dir));

        s.inner.rotation.x = Math.sin(elapsed * 2.2 + s.offset * 10) * 0.035;
        s.inner.rotation.z = Math.cos(elapsed * 1.8 + s.offset * 10) * 0.045;
        s.radar.rotation.y += 0.06;
      });

      // Update wake ripples for each ship
      wakePool.forEach((w) => {
        w.scale += delta * 1.2;
        w.opacity -= delta * 0.6;
        const s = shipFleet[w.shipIdx];
        if (s) {
          if (w.opacity <= 0) {
            w.scale = 1;
            w.opacity = 0.6;
            const t = (s.offset + globalT * s.speed) % 1;
            const pos = s.curve.getPoint(t);
            const nextPos = s.curve.getPoint((t + 0.01) % 1);
            const dir = nextPos.clone().sub(pos).normalize();
            w.mesh.position.copy(pos.clone().add(dir.clone().multiplyScalar(-0.06)));
            w.mesh.quaternion.copy(s.group.quaternion);
          }
          w.mesh.scale.set(w.scale, w.scale, w.scale);
          (w.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, w.opacity);
        }
      });

      // 3. Animate Entire Overland Logistics Fleet Across All Continents
      lorryFleet.forEach((l) => {
        const t = (l.offset + globalT * l.speed) % 1;
        const pos = l.curve.getPoint(t);
        const nextPos = l.curve.getPoint((t + 0.01) % 1);
        const dir = nextPos.clone().sub(pos).normalize();
        const up = pos.clone().normalize();

        l.group.position.copy(pos);
        l.group.up.copy(up);
        l.group.lookAt(pos.clone().add(dir));

        l.wheels.forEach((w) => {
          w.rotation.x += 0.15;
        });
      });

      // 4. Active Freight Shifting Across All Continental Terminals
      allShiftingPackages.forEach((pkg) => {
        pkg.progress = (pkg.progress + pkg.speed) % 1;
        const shiftX = (pkg.progress - 0.5) * 0.22;
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
              Continuous international air cargo, ocean freight, and overland logistics network connecting all continents.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

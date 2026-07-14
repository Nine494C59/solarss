import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import {OrbitControls} from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls";

console.clear();

//mau hanh tinh
const SUN_CFG = {
  colorA: [255, 250, 210], colorB: [255, 150, 40],
  shellMin: 2.4, shellMax: 2.8, shellCount: 26000, ring: null,
  tilt: 0
};

const PLANETS = {
  MERCURY: {
    colorA: [210, 210, 210], colorB: [105, 105, 105],
    shellMin: 5.6, shellMax: 6.0, shellCount: 45000, ring: null,
    tilt: 0.05, camZ: 16, orbitRadius: 10, orbitSpeed: 0.85, eccentricity: 0.18
  },
  VENUS: {
    colorA: [245, 240, 220], colorB: [225, 200, 160],
    shellMin: 7.6, shellMax: 8.0, shellCount: 55000, ring: null,
    tilt: 0.02, camZ: 20, orbitRadius: 15, orbitSpeed: 0.62, eccentricity: 0.03
  },
  EARTH: {
    colorA: [150, 190, 240], colorB: [25, 60, 130],
    shellMin: 8.0, shellMax: 8.4, shellCount: 60000, ring: null,
    tilt: 0.41, camZ: 21, orbitRadius: 20, orbitSpeed: 0.50, eccentricity: 0.08
  },
  MARS: {
    colorA: [195, 110, 75], colorB: [130, 55, 35],
    shellMin: 6.6, shellMax: 7.0, shellCount: 48000, ring: null,
    tilt: 0.44, camZ: 18, orbitRadius: 28, orbitSpeed: 0.40, eccentricity: 0.14
  },
  JUPITER: {
    colorA: [235, 210, 185], colorB: [180, 120, 80],
    shellMin: 13.4, shellMax: 14.0, shellCount: 90000, ring: null,
    tilt: 0.06, camZ: 34, orbitRadius: 38, orbitSpeed: 0.21, eccentricity: 0.10
  },
  SATURN: {
    colorA: [240, 225, 180], colorB: [195, 170, 125],
    shellMin: 10.0, shellMax: 10.5, shellCount: 60000,
    ring: { rMin: 15, rMax: 20, count: 100000, tilt: 0.25 },
    tilt: 0.47, camZ: 30, orbitRadius: 50, orbitSpeed: 0.16, eccentricity: 0.12
  },
  URANUS: {
    colorA: [200, 245, 245], colorB: [150, 205, 215],
    shellMin: 9.0, shellMax: 9.4, shellCount: 55000,
    ring: { rMin: 11, rMax: 13.5, count: 70000, tilt: 1.4 },
    tilt: 1.4, camZ: 24, orbitRadius: 63, orbitSpeed: 0.115, eccentricity: 0.08
  },
  NEPTUNE: {
    colorA: [180, 220, 255], colorB: [110, 155, 215],
    shellMin: 8.6, shellMax: 9.0, shellCount: 58000, ring: null,
    tilt: 0.49, camZ: 21, orbitRadius: 75, orbitSpeed: 0.09, eccentricity: 0.06
  },
  PLUTO: {
    colorA: [230, 215, 200], colorB: [140, 110, 95],
    shellMin: 4.4, shellMax: 4.8, shellCount: 38000, ring: null,
    tilt: 0.30, camZ: 13, orbitRadius: 92, orbitSpeed: 0.07, eccentricity: 0.10
  }
};
const MAP_SCALE = 0.15;       
const MAP_BODY_SCALE = 0.005;
const MAP_COUNT_SCALE = 0.05;
const ORBIT_SPEED_MULT = 0.15;

// background galaxy
let scene = new THREE.Scene();
scene.background = null;
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 10000);
const OVERVIEW_CAM_POS = new THREE.Vector3(0, 53, 124);
const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 0);
camera.position.copy(OVERVIEW_CAM_POS);

let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

function buildStarfield(count, radius) {
  let positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let v = new THREE.Vector3().randomDirection().multiplyScalar(radius * (0.55 + Math.random() * 0.45));
    positions[i * 3] = v.x;
    positions[i * 3 + 1] = v.y;
    positions[i * 3 + 2] = v.z;
  }
  let g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  let m = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.15,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.75,
    depthWrite: false
  });
  return new THREE.Points(g, m);
}
scene.add(buildStarfield(7000, 1600));
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.target.copy(OVERVIEW_TARGET);

let gu = { time: { value: 0 } };
function colStr(c) {
  return `vec3(${c[0].toFixed(1)}, ${c[1].toFixed(1)}, ${c[2].toFixed(1)})`;
}

function buildPoints(cfg, opts = {}) {
  const scale = opts.scale ?? 1;
  const countScale = opts.countScale ?? 1;
  const pointSize = opts.pointSize ?? 0.125;

  let sizes = [];
  let shift = [];
  const pushShift = () => {
    shift.push(
      Math.random() * Math.PI,
      Math.random() * Math.PI * 2,
      (Math.random() * 0.5 + 0.1) * Math.PI * 0.02,
      Math.random() * 0.5 + 0.1
    );
  };

  let pts = [];
  const shellMin = cfg.shellMin * scale;
  const shellMax = cfg.shellMax * scale;
  const shellCount = Math.max(200, Math.round(cfg.shellCount * countScale));

  for (let i = 0; i < shellCount; i++) {
    sizes.push(Math.random() * 1.5 + 0.5);
    pushShift();
    pts.push(
      new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * (shellMax - shellMin) + shellMin)
    );
  }

  let ringRMax = shellMax * 3;
  if (cfg.ring) {
    const r = cfg.ring.rMin * scale, R = cfg.ring.rMax * scale;
    const ringCount = Math.max(150, Math.round(cfg.ring.count * countScale));
    ringRMax = R;
    for (let i = 0; i < ringCount; i++) {
      const rand = Math.random();
      const radius = Math.sqrt(R * R * rand + (1 - rand) * r * r);
      pts.push(new THREE.Vector3().setFromCylindricalCoords(radius, Math.random() * 2 * Math.PI, (Math.random() - 0.5) * 2 * scale));
      sizes.push(Math.random() * 1.5 + 0.1);
      pushShift();
    }
  }

  let g = new THREE.BufferGeometry().setFromPoints(pts);
  g.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
  g.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 3));

  const normFactor = cfg.ring ? ringRMax : shellMax * 3;

  let m = new THREE.PointsMaterial({
    size: pointSize,
    transparent: true,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  m.customProgramCacheKey = () => `${colStr(cfg.colorA)}|${colStr(cfg.colorB)}|${normFactor.toFixed(2)}`;
  m.onBeforeCompile = shader => {
    shader.uniforms.time = gu.time;
    shader.vertexShader = `
      uniform float time;
      attribute float sizes;
      attribute vec4 shift;
      varying vec3 vColor;
      ${shader.vertexShader}
    `.replace(
      `gl_PointSize = size;`,
      `gl_PointSize = size * sizes;`
    ).replace(
      `#include <color_vertex>`,
      `#include <color_vertex>
        float d = length(position) / ${normFactor.toFixed(2)};
        d = clamp(d, 0., 1.);
        vColor = mix(${colStr(cfg.colorA)}, ${colStr(cfg.colorB)}, d) / 250.;
      `
    ).replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
        float t = time;
        float moveT = mod(shift.x + shift.z * t, PI2);
        float moveS = mod(shift.y + shift.z * t, PI2);
        transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.a;
      `
    );
    shader.fragmentShader = `
      varying vec3 vColor;
      ${shader.fragmentShader}
    `.replace(
      `#include <clipping_planes_fragment>`,
      `#include <clipping_planes_fragment>
        float d = length(gl_PointCoord.xy - 0.5);
      `
    ).replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( vColor, smoothstep(0.5, 0.1, d) * opacity );`
    );
  };

  let p = new THREE.Points(g, m);
  p.rotation.order = "ZYX";
  p.rotation.z = cfg.ring ? cfg.ring.tilt : cfg.tilt;
  return p;
}

//dung lai ban do 
let mapGroup = new THREE.Group();
scene.add(mapGroup);
let sunPoints = buildPoints(SUN_CFG, { scale: 0.2, countScale: 0.6, pointSize: 0.16 });
mapGroup.add(sunPoints);

let labelsContainer = document.getElementById("labels");
let entries = {}; // mesh, hitbox, label, cfg, orbitLine, angle
function orbitPoint(cfg, angle, scale = MAP_SCALE) {
  const e = cfg.eccentricity || 0;
  const a = cfg.orbitRadius * scale;
  const r = a * (1 - e * e) / (1 + e * Math.cos(angle));
  return new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle));
}

Object.entries(PLANETS).forEach(([name, cfg]) => {
  let angle = Math.random() * Math.PI * 2;
  let pos = orbitPoint(cfg, angle);

  let mesh = buildPoints(cfg, { scale: MAP_BODY_SCALE, countScale: MAP_COUNT_SCALE, pointSize: 0.06 });
  mesh.position.copy(pos);
  mapGroup.add(mesh);
  let hitRadius = Math.max((cfg.ring ? cfg.ring.rMax : cfg.shellMax) * MAP_BODY_SCALE * 1.4, 0.1);
  let hitbox = new THREE.Mesh(
    new THREE.SphereGeometry(hitRadius, 12, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitbox.position.copy(pos);
  hitbox.userData.planetName = name;
  mapGroup.add(hitbox);

  // thuat toan chuyen dong
  let orbitPts = [];
  for (let i = 0; i <= 128; i++) {
    orbitPts.push(orbitPoint(cfg, (i / 128) * Math.PI * 2));
  }
  let orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
  let orbitLineMat = new THREE.LineBasicMaterial({ color: 0x1a5c6e, transparent: true, opacity: 0.5 });
  orbitLineMat.userData.baseOpacity = 0.5;
  let orbitLine = new THREE.LineLoop(orbitGeo, orbitLineMat);
  mapGroup.add(orbitLine);

  // the hanh tinh
  let label = document.createElement("div");
  label.className = "planet-label";
  label.textContent = name.charAt(0) + name.slice(1).toLowerCase();
  labelsContainer.appendChild(label);

  entries[name] = { mesh, hitbox, label, cfg, orbitLine, angle };
});

//nut an 
let ui = document.getElementById("ui");
Object.keys(PLANETS).forEach(name => {
  let btn = document.createElement("button");
  btn.className = "planet-btn";
  btn.textContent = name.charAt(0) + name.slice(1).toLowerCase();
  btn.dataset.planet = name;
  btn.onclick = () => zoomToPlanet(name);
  ui.appendChild(btn);
});

//phong to 
let detailObject = null;
let detailPlanetName = null;
function mapMaterials() {
  let mats = [sunPoints.material];
  Object.values(entries).forEach(e => {
    mats.push(e.mesh.material, e.orbitLine.material);
  });
  return mats;
}

function setGroupOpacity(mats, value) {
  mats.forEach(m => { m.opacity = value * (m.userData.baseOpacity ?? 1); });
}

function exitDetail() {
  if (detailObject) {
    detailObject.geometry.dispose();
    detailObject.material.dispose();
    scene.remove(detailObject);
    detailObject = null;
  }
  detailPlanetName = null;
  labelsContainer.style.display = "block";
  document.getElementById("back-btn").style.display = "none";
  document.getElementById("word").textContent = "SOLAR";
  document.getElementById("word").style.color = "#9fe8ff";
  document.querySelectorAll(".planet-btn").forEach(b => b.classList.remove("active"));
}

let transition = null;
function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

function startTransition(toCamPos, toTarget, duration, opts) {
  controls.enabled = false;
  transition = {
    fromPos: camera.position.clone(),
    toPos: toCamPos.clone(),
    fromTarget: controls.target.clone(),
    toTarget: toTarget.clone(),
    start: performance.now(),
    duration,
    fadeOut: opts.fadeOut || null,
    fadeIn: opts.fadeIn || null, 
    onComplete: opts.onComplete
  };
}

let orbitPaused = false;

function zoomToPlanet(name) {
  if (transition || detailPlanetName === name) return;
  orbitPaused = true;
  const e = entries[name];
  const cfg = PLANETS[name];
  let worldPos = new THREE.Vector3();
  e.mesh.getWorldPosition(worldPos);
  let dir = worldPos.clone().normalize();
  if (dir.lengthSq() < 0.0001) dir.set(0, 0, 1);
  let camTarget = worldPos.clone().add(dir.multiplyScalar(cfg.camZ)).add(new THREE.Vector3(0, cfg.camZ * 0.15, 0));
  let outgoingDetail = detailObject;
// hieu ung hoat anh 
  detailObject = buildPoints(cfg, { scale: 1, countScale: 1, pointSize: 0.125 });
  detailObject.position.copy(worldPos);
  detailObject.material.opacity = 0;
  scene.add(detailObject);
  detailPlanetName = name;

  labelsContainer.style.display = "none";
  document.getElementById("back-btn").style.display = "block";
  document.getElementById("word").textContent = name;
  let hex = "#" + cfg.colorA.map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
  document.getElementById("word").style.color = hex;
  document.querySelectorAll(".planet-btn").forEach(b => b.classList.toggle("active", b.dataset.planet === name));

  startTransition(camTarget, worldPos, 1400, {
    fadeOut: outgoingDetail ? [outgoingDetail.material] : mapMaterials(),
    fadeIn: [detailObject.material],
    onComplete: () => {
      mapGroup.visible = false;
      controls.enabled = true;
      if (outgoingDetail) {
        outgoingDetail.geometry.dispose();
        outgoingDetail.material.dispose();
        scene.remove(outgoingDetail);
      }
    }
  });
}

function backToMap() {
  if (transition) return;
  const outgoingMats = detailObject ? [detailObject.material] : [];
  mapGroup.visible = true;
  setGroupOpacity(mapMaterials(), 0); // start transparent, will fade in below

  startTransition(OVERVIEW_CAM_POS, OVERVIEW_TARGET, 1400, {
    fadeOut: outgoingMats,
    fadeIn: mapMaterials(),
    onComplete: () => {
      exitDetail();
      orbitPaused = false;
      controls.enabled = true;
    }
  });
}
document.getElementById("back-btn").onclick = backToMap;

const CLICK_RADIUS_PX = 26; //r hanh tinh 

let pointerDownPos = null;

renderer.domElement.addEventListener("pointerdown", e => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener("pointerup", e => {
  if (!pointerDownPos) return;
  let dx = e.clientX - pointerDownPos.x, dy = e.clientY - pointerDownPos.y;
  if (Math.sqrt(dx * dx + dy * dy) > 6) return; // keo xoay 
  if (detailPlanetName || transition) return; //skip chuyen canh

  //click path
  const clickX = e.clientX;
  const clickY = e.clientY;

  //han che chuyen bam 
  const projected = new THREE.Vector3();
  let closestName = null;
  let closestDist = CLICK_RADIUS_PX;

  Object.entries(entries).forEach(([name, entry]) => {
    entry.mesh.getWorldPosition(projected);
    projected.project(camera);

    if (projected.z > 1) return;
    const screenX = (projected.x * 0.5 + 0.5) * innerWidth;
    const screenY = (-projected.y * 0.5 + 0.5) * innerHeight;

    const dist = Math.hypot(screenX - clickX, screenY - clickY);
    if (dist < closestDist) {
      closestDist = dist;
      closestName = name;
    }
  });

  if (closestName) {
    zoomToPlanet(closestName);
  }
});

// lap lai hieu ung
let clock = new THREE.Clock();
let pauseAccum = 0;
let pauseStart = 0;

renderer.setAnimationLoop(() => {
  let now = performance.now();
  let dt = clock.getDelta();
  gu.time.value += dt * Math.PI * 0.05;
  if (!orbitPaused) {
    Object.values(entries).forEach(e => {
      let pos = orbitPoint(e.cfg, e.angle);
      let r = pos.length();
      let a = e.cfg.orbitRadius * MAP_SCALE;
      let angularRate = e.cfg.orbitSpeed * ORBIT_SPEED_MULT * (a / r) * (a / r);
      e.angle += dt * angularRate;
      let newPos = orbitPoint(e.cfg, e.angle);
      e.mesh.position.copy(newPos);
      e.hitbox.position.copy(newPos);
    });
  }
  Object.values(entries).forEach(e => { e.mesh.rotation.y += dt * 0.3; });
  sunPoints.rotation.y += dt * 0.05;
  if (detailObject) detailObject.rotation.y += dt * 0.375 * 0.05 * 20; // xoay
  if (transition) {
    let t = Math.min(1, (now - transition.start) / transition.duration);
    let te = easeInOutQuad(t);
    camera.position.lerpVectors(transition.fromPos, transition.toPos, te);
    controls.target.lerpVectors(transition.fromTarget, transition.toTarget, te);
    if (transition.fadeOut) setGroupOpacity(transition.fadeOut, 1 - te);
    if (transition.fadeIn) setGroupOpacity(transition.fadeIn, te);
    if (t >= 1) {
      let cb = transition.onComplete;
      transition = null;
      if (cb) cb();
    }
  }

  controls.update();

// chuyen ban do 
  if (mapGroup.visible) {
    scene.updateMatrixWorld(true);
    let v = new THREE.Vector3();
    Object.values(entries).forEach(e => {
      e.mesh.getWorldPosition(v);
      let vp = v.clone().project(camera);
      if (vp.z > 1) { e.label.style.display = "none"; return; }
      e.label.style.display = "block";
      e.label.style.left = ((vp.x * 0.5 + 0.5) * innerWidth) + "px";
      e.label.style.top = ((-vp.y * 0.5 + 0.5) * innerHeight) + "px";
    });
  }

  renderer.render(scene, camera);
});
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Scene, camera, renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfc4698);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 2.5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("canvas-container").appendChild(renderer.domElement);

// Renderer settings
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.7;

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(3, 5, 4);
dirLight.castShadow = true;
scene.add(dirLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableRotate = false;
controls.enableZoom = false;
controls.enablePan = false;

// Load Blender model
const loader = new GLTFLoader();
let model = null;

loader.load("assets/ID-card.glb", (gltf) => {
  model = gltf.scene;
  model.scale.set(5, 5, 5);

  model.traverse((child) => {
    if (child.isMesh && child.material.map) {
      const map = child.material.map;

      map.anisotropy = renderer.capabilities.getMaxAnisotropy();
      map.minFilter = THREE.LinearMipMapLinearFilter;
      map.magFilter = THREE.LinearFilter;
      map.needsUpdate = true;
    }
  });

  scene.add(model);
});

// Model Resize
function adjustCameraForAspect(smooth = true) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;

  // Base distance by width
  let targetZ;
  if (w <= 400) targetZ = 4.6; // very small phones
  else if (w <= 600) targetZ = 4.2; // phones
  else if (w <= 900) targetZ = 3.8; // small tablets
  else if (w <= 1200) targetZ = 3.3; // tablets
  else targetZ = 2.7; // desktop baseline

  if (aspect < 0.65) targetZ += 0.7;
  else if (aspect < 0.85) targetZ += 0.35;

  targetZ = Math.min(Math.max(targetZ, 2.6), 6.0);

  if (smooth && typeof gsap !== "undefined") {
    gsap.to(camera.position, { z: targetZ, duration: 0.4, ease: "power2.out" });
  } else {
    camera.position.z = targetZ;
  }
  camera.updateProjectionMatrix();
}

adjustCameraForAspect(false);
window.addEventListener("resize", () => adjustCameraForAspect(true));

// Drag Setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let dragging = false;
let dragPlane = new THREE.Plane();
let dragOffset = new THREE.Vector3();

window.addEventListener("mousedown", (event) => {
  if (!model) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(model, true);
  if (hits.length === 0) return;

  const hitPointWorld = hits[0].point.clone();
  dragPlane.setFromNormalAndCoplanarPoint(
    camera.getWorldDirection(new THREE.Vector3()).negate(),
    hitPointWorld
  );

  const modelWorldPos = model.getWorldPosition(new THREE.Vector3());
  dragOffset.copy(hitPointWorld).sub(modelWorldPos);
  dragging = true;
});

function clampNDC(v) {
  v.x = Math.max(-1, Math.min(1, v.x));
  v.y = Math.max(-1, Math.min(1, v.y));
  return v;
}

function clampModelToScreen(model, camera) {
  const box = new THREE.Box3().setFromObject(model);
  const points = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
  ];

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  points.forEach((p) => {
    const ndc = p.clone().project(camera);
    minX = Math.min(minX, ndc.x);
    maxX = Math.max(maxX, ndc.x);
    minY = Math.min(minY, ndc.y);
    maxY = Math.max(maxY, ndc.y);
  });

  let offsetX = 0,
    offsetY = 0;
  if (minX < -1) offsetX = -1 - minX;
  if (maxX > 1) offsetX = 1 - maxX;
  if (minY < -1) offsetY = -1 - minY;
  if (maxY > 1) offsetY = 1 - maxY;

  if (offsetX !== 0 || offsetY !== 0) {
    const modelCenter = box.getCenter(new THREE.Vector3());
    const ndcCenter = modelCenter.clone().project(camera);

    ndcCenter.x += offsetX;
    ndcCenter.y += offsetY;

    const correctedWorld = ndcCenter.unproject(camera);
    const worldCenter = box.getCenter(new THREE.Vector3());
    const delta = correctedWorld.sub(worldCenter);
    model.position.add(delta);
  }
}

window.addEventListener("mousemove", (event) => {
  if (dragging && model) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersection = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(dragPlane, intersection)) return;

    const targetWorld = intersection.sub(dragOffset);
    const ndc = targetWorld.clone().project(camera);
    clampNDC(ndc);
    ndc.z = targetWorld.clone().project(camera).z;

    const clampedWorld = ndc.unproject(camera);
    const local = clampedWorld.clone();
    model.parent.worldToLocal(local);
    model.position.copy(local);

    clampModelToScreen(model, camera);
  }

  mouseNormX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseNormY = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("mouseup", () => {
  dragging = false;
});

// Hover Rotation
let mouseNormX = 0,
  mouseNormY = 0;

// Flip on Click
let isFlipped = false;
let targetRotationY = 0;

window.addEventListener("click", () => {
  if (!model) return;
  isFlipped = !isFlipped;
  targetRotationY = isFlipped ? Math.PI : 0;
});

// Touch Support
function pt(e) {
  return e.touches && e.touches[0] ? e.touches[0] : e;
}
window.addEventListener(
  "touchstart",
  (e) => {
    const t = pt(e);
    window.dispatchEvent(
      new MouseEvent("mousedown", { clientX: t.clientX, clientY: t.clientY })
    );
  },
  { passive: true }
);
window.addEventListener(
  "touchmove",
  (e) => {
    const t = pt(e);
    window.dispatchEvent(
      new MouseEvent("mousemove", { clientX: t.clientX, clientY: t.clientY })
    );
  },
  { passive: true }
);
window.addEventListener("touchend", () => {
  window.dispatchEvent(new MouseEvent("mouseup"));
  window.dispatchEvent(new MouseEvent("click"));
});

// ---------- Animate ----------
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (model) {
    const targetRotX = mouseNormY * 0.35;
    model.rotation.x += (targetRotX - model.rotation.x) * 0.05;

    model.rotation.y += (targetRotationY - model.rotation.y) * 0.1;
  }

  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

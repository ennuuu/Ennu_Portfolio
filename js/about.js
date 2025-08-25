// GREETING
const greetings = [
  "Hello, I'm Anna!",
  "안녕, 저는 안나예요!",
  "你好，我是安娜！",
  "Bonjour, je suis Anna!",
  "Hola, soy Anna!",
  "こんにちは、アンナです！",
  "Xin chào, tôi là Anna!",
];

let index = 0;
const greetingEl = document.getElementById("greeting");

function showGreeting(text) {
  greetingEl.innerHTML = "";
  [...text].forEach((char, i) => {
    const span = document.createElement("span");
    span.textContent = char;
    span.style.animationDelay = `${i * 0.05}s`;
    greetingEl.appendChild(span);
  });
}

setInterval(() => {
  index = (index + 1) % greetings.length;
  showGreeting(greetings[index]);
}, 2500);

showGreeting(greetings[index]); // initial render

// CARDS
// SWIPER.JS
const swiper = new Swiper(".card-swiper", {
  loop: true,
  autoplay: { delay: 2500, disableOnInteraction: false },
  centeredSlides: true,
  grabCursor: true,
  spaceBetween: 20,
  slidesPerView: 1,
  watchOverflow: true,
  pagination: { el: ".swiper-pagination", clickable: true },
  navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
  effect: "coverflow",
  coverflowEffect: {
    rotate: 20,
    stretch: 0,
    depth: 200,
    modifier: 1,
    slideShadows: true,
  },
  breakpoints: {
    768: { slidesPerView: 1.5, spaceBetween: 24 },
    1024: { slidesPerView: 2.2, spaceBetween: 30 },
  },
});

// 3D BACKGROUND
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfc4698);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-2.5, 6, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("three-container").appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Load model
const loader = new GLTFLoader();
loader.load("assets/ennu-selfie.glb", (gltf) => {
  const model = gltf.scene;
  model.scale.set(4, 4, 4);
  model.position.set(0, -1.9, -5); // move behind text
  model.rotation.set(
    THREE.MathUtils.degToRad(13), // up/down tilt
    THREE.MathUtils.degToRad(-20), // left/right turn
    THREE.MathUtils.degToRad(5) // roll sideways
  );
  scene.add(model);

  // --- Hover interaction ---
  let targetRotationX = model.rotation.x;
  let targetRotationY = model.rotation.y;

  document.addEventListener("mousemove", (e) => {
    const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    const mouseY = (e.clientY / window.innerHeight) * 2 - 1;

    // Subtle rotation effect
    targetRotationY = THREE.MathUtils.degToRad(-20) + mouseX * 0.2; // left/right
    targetRotationX = THREE.MathUtils.degToRad(13) + mouseY * 0.05; // up/down
  });

  function animate() {
    requestAnimationFrame(animate);

    // Smoothly lerp rotation toward target
    model.rotation.y += (targetRotationY - model.rotation.y) * 0.05;
    model.rotation.x += (targetRotationX - model.rotation.x) * 0.05;

    renderer.render(scene, camera);
  }
  animate();
});

// Responsive
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Responsive sizing for Three.js ===
const threeContainer = document.getElementById("three-container");

function sizeThreeForBreakpoint() {
  const isMobile = window.matchMedia("(max-width: 767.98px)").matches;

  if (isMobile) {
    // Fit the container (top banner style)
    const w = threeContainer.clientWidth;
    const h =
      threeContainer.clientHeight || Math.round(window.innerHeight * 0.55);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Small nudge so the model reads nicely on phones
    camera.position.set(-1.6, 5.2, 2.0);
  } else {
    // Keep your original full-window render for the right-half crop trick
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.set(-2.5, 6, 1);
  }
  camera.updateProjectionMatrix();
}

// call once after appending canvas
sizeThreeForBreakpoint();
window.addEventListener("resize", sizeThreeForBreakpoint);

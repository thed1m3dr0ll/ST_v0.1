// Интерактивная 3D-модель тёплого алюминиевого профиля (блок «Технологии» на главной).
// Модель строится из сечения профиля (размеры в мм), «вытянутого» в глубину — как настоящий профиль.
// Управление: покачивание в покое, параллакс за курсором, вращение мышью/пальцем с инерцией.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type Rect = [x: number, y: number, w: number, h: number, r?: number];

// ---------- Геометрия сечения ----------
function rrectPath<T extends THREE.Path>(p: T, [x, y, w, h, r = 1]: Rect, reverse = false): T {
  // Прямоугольник со скруглёнными углами; отверстия (камеры) обходим в обратную сторону
  r = Math.min(r, w / 2, h / 2);
  if (!reverse) {
    p.moveTo(x + r, y);
    p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r);
    p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r);
    p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y);
  } else {
    p.moveTo(x + r, y);
    p.quadraticCurveTo(x, y, x, y + r);
    p.lineTo(x, y + h - r); p.quadraticCurveTo(x, y + h, x + r, y + h);
    p.lineTo(x + w - r, y + h); p.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
    p.lineTo(x + w, y + r); p.quadraticCurveTo(x + w, y, x + w - r, y);
    p.lineTo(x + r, y);
  }
  return p;
}

function shape(outer: Rect | [number, number][], holes: Rect[] = []): THREE.Shape {
  let s: THREE.Shape;
  if (typeof outer[0] === 'number') s = rrectPath(new THREE.Shape(), outer as Rect);
  else {
    s = new THREE.Shape();
    (outer as [number, number][]).forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
  }
  holes.forEach((h) => s.holes.push(rrectPath(new THREE.Path(), h, true)));
  return s;
}

const LENGTH = 120; // длина отрезка профиля, мм

function extrude(s: THREE.Shape, bevel = 0.35) {
  return new THREE.ExtrudeGeometry(s, {
    depth: LENGTH,
    curveSegments: 6,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 2,
  });
}

function buildProfile(env: THREE.Texture) {
  // Материалы: [торец (срез), боковые грани]
  const aluSide = new THREE.MeshStandardMaterial({ color: 0x394044, metalness: 0.78, roughness: 0.36, envMap: env, envMapIntensity: 1.1 });
  const aluCut = new THREE.MeshStandardMaterial({ color: 0xc9d0d2, metalness: 0.35, roughness: 0.42, envMap: env, envMapIntensity: 1 });
  const poly = new THREE.MeshStandardMaterial({ color: 0x24282a, metalness: 0.05, roughness: 0.62, envMap: env, envMapIntensity: 0.5 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x101213, metalness: 0, roughness: 0.85, envMap: env, envMapIntensity: 0.3 });
  const foam = new THREE.MeshStandardMaterial({ color: 0xdfe5e3, metalness: 0, roughness: 0.95, envMap: env, envMapIntensity: 0.4 });
  const spacer = new THREE.MeshStandardMaterial({ color: 0x8e979a, metalness: 0.85, roughness: 0.35, envMap: env });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xcfeeea, metalness: 0, roughness: 0.04, envMap: env, envMapIntensity: 1.6,
    transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.05,
  });
  const glassEdge = new THREE.MeshStandardMaterial({ color: 0x7fbfb4, metalness: 0.1, roughness: 0.1, envMap: env, transparent: true, opacity: 0.85 });

  const group = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], order = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.renderOrder = order;
    group.add(m);
    return m;
  };
  // ExtrudeGeometry: группа 0 — торцы (срез), группа 1 — боковые грани вдоль длины
  const alu = [aluCut, aluSide];

  // Рама: наружная и внутренняя алюминиевые части с камерами
  add(extrude(shape([0, 0, 30, 46, 1.6], [[3, 3, 24, 21, 1.2], [3, 27, 13, 16, 1]])), alu);
  add(extrude(shape([44, 0, 30, 46, 1.6], [[47, 3, 24, 21, 1.2], [58, 27, 13, 16, 1]])), alu);
  // Термомост (полиамид) и вспененная вставка
  add(extrude(shape([30, 8, 14, 4, 0.6]), 0.2), poly);
  add(extrude(shape([30, 34, 14, 4, 0.6]), 0.2), poly);
  add(extrude(shape([30.4, 13, 13.2, 20, 0.8]), 0.2), foam);

  // Створка
  add(extrude(shape([[2, 47], [32, 47], [32, 71], [12, 71], [12, 90], [2, 90]], [[5, 50, 24, 17, 1.2], [4.6, 73.5, 5, 13, 0.8]])), alu);
  add(extrude(shape([46, 47, 30, 24, 1.6], [[49, 50, 24, 17, 1.2]])), alu);
  add(extrude(shape([32, 51, 14, 4, 0.6]), 0.2), poly);
  add(extrude(shape([32, 63, 14, 4, 0.6]), 0.2), poly);
  // Штапик
  add(extrude(shape([62, 72, 12, 17, 1.2], [[64.6, 74.6, 6.8, 11.8, 0.8]])), alu);

  // Уплотнители
  add(extrude(shape([12, 79, 3, 9, 1.2]), 0.2), rubber);
  add(extrude(shape([59, 79, 3, 9, 1.2]), 0.2), rubber);
  add(extrude(shape([6, 46, 8, 1, 0.4]), 0), rubber);
  add(extrude(shape([64, 46, 8, 1, 0.4]), 0), rubber);
  add(extrude(shape([15, 72, 44, 2, 0.4]), 0), rubber); // подкладка под стеклопакет

  // Тройной стеклопакет: три стекла и две дистанционные рамки
  for (const x of [15, 35, 55]) {
    const g = extrude(shape([x, 74, 4, 70, 0.3]), 0);
    add(g, [glassEdge, glass], 2);
  }
  add(extrude(shape([19, 74, 16, 7, 0.6]), 0.2), spacer);
  add(extrude(shape([39, 74, 16, 7, 0.6]), 0.2), spacer);
  add(extrude(shape([19, 74, 16, 2.4, 0.3]), 0), rubber);
  add(extrude(shape([39, 74, 16, 2.4, 0.3]), 0), rubber);

  // Центрируем
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.children.forEach((c) => c.position.sub(center));
  const pivot = new THREE.Group();
  pivot.add(group);
  const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
  return { pivot, radius };
}

// ---------- Сцена и управление ----------
export interface Profile3D { setActive(active: boolean): void; reset(): void; }

const BASE_YAW = -0.62;
const BASE_PITCH = 0.32;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function mountProfile3D(root: HTMLElement): Profile3D | null {
  const host = root.querySelector<HTMLElement>('[data-p3d-canvas]')!;
  const hint = root.querySelector<HTMLElement>('[data-p3d-hint]');
  const resetBtn = root.querySelector<HTMLButtonElement>('[data-p3d-reset]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null; // нет WebGL — остаётся статичная картинка
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = 'p3d__canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '3D-модель тёплого алюминиевого профиля. Перетащите или используйте стрелки, чтобы повернуть.');
  host.append(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const { pivot, radius } = buildProfile(env);
  scene.add(pivot);
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(60, 120, 160);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.35));

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 3000);
  const fit = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const fitH = radius / Math.sin(vFov / 2);
    const fitW = radius / Math.sin(Math.atan(Math.tan(vFov / 2) * camera.aspect));
    // смещаем взгляд чуть вниз — модель стоит выше и не прячется за подсказкой
    const dy = -radius * 0.1;
    camera.position.set(0, dy, Math.max(fitH, fitW) * 0.98);
    camera.lookAt(0, dy, 0);
    camera.updateProjectionMatrix();
  };

  // Состояние вращения
  let yaw = BASE_YAW, pitch = BASE_PITCH;          // текущее
  let restYaw = BASE_YAW, restPitch = BASE_PITCH;  // куда «положил» пользователь
  let parX = 0, parY = 0, tParX = 0, tParY = 0;     // параллакс за курсором
  let vel = 0;                                      // инерция после броска
  let sway = reduce ? 0 : 1;                        // сила покачивания (0..1)
  let lastInteract = -Infinity;
  let dragging = false, lastX = 0, lastY = 0, lastDx = 0;
  let visible = false, active = true, running = false;

  const interacted = () => {
    lastInteract = performance.now();
    if (hint && !hint.hidden) {
      hint.classList.add('is-gone');
      try { sessionStorage.setItem('p3d-hint', '1'); } catch { /* ignore */ }
    }
  };
  try { if (hint && sessionStorage.getItem('p3d-hint')) hint.classList.add('is-gone'); } catch { /* ignore */ }

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY; lastDx = 0; vel = 0;
    canvas.setPointerCapture(e.pointerId);
    root.classList.add('is-dragging');
    interacted(); wake();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (dragging) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY; lastDx = dx;
      restYaw += dx * 0.009;
      if (e.pointerType === 'mouse') restPitch = clamp(restPitch + dy * 0.006, -0.35, 1.15);
      interacted(); wake();
    } else if (e.pointerType === 'mouse') {
      const r = canvas.getBoundingClientRect();
      tParX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      tParY = ((e.clientY - r.top) / r.height - 0.5) * 2;
      lastInteract = performance.now(); wake();
    }
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-dragging');
    if (!reduce) vel = lastDx * 0.009;
    wake();
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => { tParX = 0; tParY = 0; wake(); });
  canvas.addEventListener('dblclick', () => reset());
  canvas.addEventListener('keydown', (e) => {
    const step = 0.25;
    if (e.key === 'ArrowLeft') restYaw -= step;
    else if (e.key === 'ArrowRight') restYaw += step;
    else if (e.key === 'ArrowUp') restPitch = clamp(restPitch - step, -0.35, 1.15);
    else if (e.key === 'ArrowDown') restPitch = clamp(restPitch + step, -0.35, 1.15);
    else if (e.key === 'Home' || e.key === '0') reset();
    else return;
    e.preventDefault(); interacted(); wake();
  });
  resetBtn?.addEventListener('click', () => { reset(); interacted(); });

  function reset() {
    // вращаем к исходному виду кратчайшим путём
    const twoPi = Math.PI * 2;
    restYaw = BASE_YAW + Math.round((yaw - BASE_YAW) / twoPi) * twoPi;
    restPitch = BASE_PITCH; vel = 0; wake();
  }

  function frame() {
    if (!running) return;
    const t = performance.now() / 1000;
    const idleFor = performance.now() - lastInteract;
    // покачивание возвращается через 3.5 с без взаимодействия
    const swayTarget = reduce || dragging || idleFor < 3500 ? 0 : 1;
    sway += (swayTarget - sway) * 0.03;
    if (Math.abs(vel) > 0.0001) { restYaw += vel; vel *= 0.94; }
    parX += (tParX - parX) * 0.08; parY += (tParY - parY) * 0.08;
    const k = reduce ? 0.4 : 1;
    const targetYaw = restYaw + Math.sin(t * 0.55) * 0.42 * sway + parX * 0.32 * k;
    const targetPitch = restPitch + Math.sin(t * 0.37) * 0.06 * sway + parY * 0.18 * k;
    yaw += (targetYaw - yaw) * (dragging ? 0.35 : 0.08);
    pitch += (targetPitch - pitch) * (dragging ? 0.35 : 0.08);
    pivot.rotation.set(pitch, yaw, 0, 'XYZ');
    renderer.render(scene, camera);
    // спокойная модель без покачивания — останавливаем цикл, чтобы не тратить батарею
    const settled = sway < 0.002 && Math.abs(targetYaw - yaw) < 0.0005 && Math.abs(targetPitch - pitch) < 0.0005 && Math.abs(vel) < 0.0001;
    if (settled && swayTarget === 0 && !dragging && idleFor > 4000 && reduce) { running = false; return; }
    requestAnimationFrame(frame);
  }
  function wake() {
    if (!running && visible && active) { running = true; requestAnimationFrame(frame); }
  }
  function sleep() { running = false; }

  new ResizeObserver(fit).observe(host);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? wake() : sleep(); }, { rootMargin: '100px' }).observe(root);
  fit();
  renderer.render(scene, camera);
  root.classList.add('is-ready');

  return {
    setActive(a: boolean) { active = a; a ? wake() : sleep(); },
    reset,
  };
}

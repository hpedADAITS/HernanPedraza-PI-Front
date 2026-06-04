import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CoverCubeTextureMessageSource, CoverCubeWorkerMessage, SetCoverCubeTextureOptions } from './coverCubeWorkerMessages';
import { getTextureTransitionRotation } from './coverCubeRotation';

interface TextureTransitionState {
  durationMs: number;
  fadeTexture: THREE.Texture;
  ownsTexture: boolean;
  requestId: number;
  startedAt: number;
  startRotationX: number;
  startRotationY: number;
}

interface WorkerState {
  accentColor: string;
  currentRotationX: number;
  currentRotationY: number;
  currentDevicePixelRatio: number;
  currentWidth: number;
  currentHeight: number;
  currentSpillScale: number;
  displayRotationX: number;
  displayRotationY: number;
  dragStartX: number;
  dragStartY: number;
  lastFrameAt: number;
  popAnimation: {
    requestId: number;
    startedAt: number;
    progress: number;
  } | null;
  requestId: number;
  spinAngle: number;
  targetRotationX: number;
  targetRotationY: number;
  textureTransition: TextureTransitionState | null;
  isDragging: boolean;
  isDisposed: boolean;
}

const state: WorkerState = {
  accentColor: '#32d583',
  currentRotationX: 0,
  currentRotationY: 0,
  currentDevicePixelRatio: 1,
  currentWidth: 1,
  currentHeight: 1,
  currentSpillScale: 1.03,
  displayRotationX: 0,
  displayRotationY: 0,
  dragStartX: 0,
  dragStartY: 0,
  isDragging: false,
  isDisposed: false,
  lastFrameAt: 0,
  popAnimation: null,
  requestId: 0,
  spinAngle: 0,
  targetRotationX: 0,
  targetRotationY: 0,
  textureTransition: null,
};

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let cube: THREE.Mesh | null = null;
let fadeFront: THREE.Mesh | null = null;
let fadeMaterial: THREE.MeshBasicMaterial | null = null;
let frontGlare: THREE.Mesh | null = null;
let secondGlare: THREE.Mesh | null = null;
let pmrem: THREE.PMREMGenerator | null = null;
let ruggedMap: THREE.Texture | null = null;
let defaultFrontTexture: THREE.Texture | null = null;
let defaultSideTexture: THREE.Texture | null = null;
let materials: THREE.MeshPhysicalMaterial[] = [];
let animationFrameId = 0;
const ownedTextures = new Set<THREE.Texture>();
const materialOwnsMap = [false, false, false, false, false, false];
const cubeRenderOrder = 0;
const fadeRenderOrder = 1;
const glareRenderOrder = 2;

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized;
  const value = Number.parseInt(expanded, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function blendRgb(
  source: { r: number; g: number; b: number },
  target: { r: number; g: number; b: number },
  amount: number,
) {
  const mix = (start: number, end: number) =>
    Math.round(start + (end - start) * amount);

  return {
    r: mix(source.r, target.r),
    g: mix(source.g, target.g),
    b: mix(source.b, target.b),
  };
}

function rgbString({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}) {
  return `rgb(${r}, ${g}, ${b})`;
}

function rgbaString(
  color: { r: number; g: number; b: number },
  alpha: number,
) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function getMaxAnisotropy() {
  return renderer?.capabilities.getMaxAnisotropy() ?? 1;
}

function createCanvas(size: number) {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(size, size);
  }

  throw new Error('OffscreenCanvas is unavailable in worker');
}

function createDefaultTexture(
  accentColor: string,
  { icon = true }: { icon?: boolean } = {},
) {
  const size = 768;
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('2D canvas context is unavailable');
  }

  const accent = hexToRgb(accentColor);
  const baseStart = blendRgb(accent, { r: 78, g: 63, b: 192 }, 0.48);
  const baseEnd = blendRgb(accent, { r: 65, g: 215, b: 222 }, 0.65);
  const cyanGlow = blendRgb(accent, { r: 36, g: 224, b: 223 }, 0.24);

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, rgbString(baseStart));
  base.addColorStop(1, rgbString(baseEnd));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const violet = ctx.createRadialGradient(
    size * 0.34,
    size * 0.18,
    0,
    size * 0.34,
    size * 0.18,
    size * 0.55,
  );
  violet.addColorStop(0, 'rgba(117, 83, 255, 0.95)');
  violet.addColorStop(1, 'rgba(117, 83, 255, 0)');
  ctx.fillStyle = violet;
  ctx.fillRect(0, 0, size, size);

  const cyan = ctx.createRadialGradient(
    size * 0.78,
    size * 0.82,
    0,
    size * 0.78,
    size * 0.82,
    size * 0.48,
  );
  cyan.addColorStop(0, rgbaString(cyanGlow, 0.95));
  cyan.addColorStop(1, rgbaString(cyanGlow, 0));
  ctx.fillStyle = cyan;
  ctx.fillRect(0, 0, size, size);

  const shine = ctx.createLinearGradient(0, 0, size, size);
  shine.addColorStop(0, 'rgba(255,255,255,.3)');
  shine.addColorStop(0.22, 'rgba(255,255,255,.06)');
  shine.addColorStop(0.48, 'rgba(255,255,255,.24)');
  shine.addColorStop(1, 'rgba(255,255,255,.04)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255,255,255,.13)';
  ctx.lineWidth = 2;

  for (let i = -size; i < size * 2; i += 48) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
  }

  if (icon) {
    ctx.save();
    ctx.translate(size * 0.5, size * 0.5);
    ctx.scale(5.8, 5.8);
    ctx.translate(-48, -48);
    ctx.shadowColor = 'rgba(0,0,0,.32)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = 'rgba(255,255,255,.97)';

    const path = new Path2D(
      'M38 29.5v39.4a10.6 10.6 0 1 1-6.3-9.7V28.1c0-2 1.4-3.8 3.4-4.2l34.6-7.1c2.7-.6 5.3 1.5 5.3 4.2v39a10.6 10.6 0 1 1-6.3-9.7V28.7L38 35z',
    );
    ctx.fill(path);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = getMaxAnisotropy();

  return texture;
}

function createRuggedGlassMap() {
  const size = 512;
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('2D canvas context is unavailable');
  }

  const image = ctx.createImageData(size, size);

  for (let i = 0; i < image.data.length; i += 4) {
    const value = 100 + Math.random() * 90;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.anisotropy = getMaxAnisotropy();

  return texture;
}

function orientFrontTexture(texture: THREE.Texture) {
  texture.flipY = true;
  texture.center.set(0.5, 0.5);
  texture.rotation = 0;
  texture.repeat.set(0.9, 0.9);
  texture.offset.set(0.05, 0.05);
  texture.needsUpdate = true;
  return texture;
}

function setSideTextureTransform(texture: THREE.Texture) {
  texture.repeat.set(0.9, 0.9);
  texture.offset.set(0.05, 0.05);
  texture.needsUpdate = true;
  return texture;
}

function createBitmapTexture(bitmap: ImageBitmap) {
  const texture = new THREE.Texture(bitmap);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = getMaxAnisotropy();
  return texture;
}

function clearOwnedTextures() {
  ownedTextures.forEach((texture) => texture.dispose());
  ownedTextures.clear();
}

function clearFadeTexture() {
  if (!fadeMaterial) {
    return;
  }

  if (fadeMaterial.map) {
    if (ownedTextures.has(fadeMaterial.map)) {
      ownedTextures.delete(fadeMaterial.map);
      fadeMaterial.map.dispose();
    }
    fadeMaterial.map = null;
  }

  fadeMaterial.opacity = 0;
  fadeMaterial.needsUpdate = true;

  if (fadeFront) {
    fadeFront.visible = false;
  }
}

function setMaterialTexture(
  materialIndex: number,
  texture: THREE.Texture,
  ownsTexture = false,
) {
  const material = materials[materialIndex];
  const nextTexture = materialIndex === 4 ? orientFrontTexture(texture) : setSideTextureTransform(texture);
  const previousTexture = material.map;

  if (
    materialOwnsMap[materialIndex] &&
    previousTexture &&
    previousTexture !== nextTexture &&
    ownedTextures.has(previousTexture)
  ) {
    ownedTextures.delete(previousTexture);
    previousTexture.dispose();
  }

  material.map = nextTexture;
  material.needsUpdate = true;
  materialOwnsMap[materialIndex] = ownsTexture;

  if (ownsTexture) {
    ownedTextures.add(nextTexture);
  }
}

function clearFrontTexture() {
  if (defaultFrontTexture) {
    setMaterialTexture(4, defaultFrontTexture, false);
  }
}

function applyTexture(
  texture: THREE.Texture,
  options: SetCoverCubeTextureOptions = {},
  ownsTexture = false,
) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = getMaxAnisotropy();

  if (options.frontOnly) {
    setMaterialTexture(4, texture, ownsTexture);
    return;
  }

  for (let index = 0; index < materials.length; index += 1) {
    const faceTexture = index === 4 ? texture.clone() : texture;
    setMaterialTexture(index, faceTexture, ownsTexture);
  }
}

function rebuildDefaultTextures() {
  if (!cube) {
    return;
  }

  const nextFrontTexture = orientFrontTexture(
    createDefaultTexture(state.accentColor, { icon: true }),
  );
  const nextSideTexture = createDefaultTexture(state.accentColor, {
    icon: false,
  });
  ownedTextures.add(nextFrontTexture);
  ownedTextures.add(nextSideTexture);

  if (defaultFrontTexture && ownedTextures.has(defaultFrontTexture)) {
    ownedTextures.delete(defaultFrontTexture);
    defaultFrontTexture.dispose();
  }

  if (defaultSideTexture && ownedTextures.has(defaultSideTexture)) {
    ownedTextures.delete(defaultSideTexture);
    defaultSideTexture.dispose();
  }

  defaultFrontTexture = nextFrontTexture;
  defaultSideTexture = nextSideTexture;

  for (let index = 0; index < materials.length; index += 1) {
    const replacement = index === 4 ? nextFrontTexture : nextSideTexture;
    if (!materialOwnsMap[index]) {
      setMaterialTexture(index, replacement, false);
    }
  }
}

async function loadTextureFromSource(source: CoverCubeTextureMessageSource) {
  if (!source) {
    return null;
  }

  if (source.kind === 'bitmap') {
    return createBitmapTexture(source.bitmap);
  }

  const response = await fetch(source.url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  return createBitmapTexture(bitmap);
}

function startFrontTextureTransition(
  texture: THREE.Texture,
  ownsTexture: boolean,
  requestId: number,
) {
  clearFadeTexture();

  const fadeTexture = orientFrontTexture(texture);

  if (ownsTexture) {
    ownedTextures.add(fadeTexture);
  }

  if (!fadeMaterial || !fadeFront) {
    return;
  }

  fadeMaterial.map = fadeTexture;
  fadeMaterial.opacity = 0;
  fadeMaterial.needsUpdate = true;
  fadeFront.visible = true;

  state.textureTransition = {
    durationMs: 620,
    fadeTexture,
    ownsTexture,
    requestId,
    startedAt: performance.now(),
    startRotationX: state.displayRotationX,
    startRotationY: state.displayRotationY,
  };
}

function syncRendererSize() {
  if (!renderer || !camera) {
    return;
  }

  const spillWidth = state.currentWidth * state.currentSpillScale;
  const spillHeight = state.currentHeight * state.currentSpillScale;

  renderer.setPixelRatio(Math.min(state.currentDevicePixelRatio ?? 1, 3));
  renderer.setSize(spillWidth, spillHeight, false);
  camera.aspect = state.currentWidth / state.currentHeight;
  camera.updateProjectionMatrix();
}

function updateScene(deltaSeconds: number) {
  if (!cube || !fadeMaterial || !fadeFront) {
    return;
  }

  if (state.textureTransition) {
    const elapsed = performance.now() - state.textureTransition.startedAt;
    const progress = Math.min(elapsed / state.textureTransition.durationMs, 1);
    const eased = 1 - (1 - progress) * (1 - progress);
    const rotation = getTextureTransitionRotation(
      state.textureTransition.startRotationX,
      state.textureTransition.startRotationY,
      progress,
    );

    state.displayRotationX = rotation.x;
    state.displayRotationY = rotation.y;
    fadeMaterial.opacity = eased;

    if (progress >= 1) {
      setMaterialTexture(
        4,
        state.textureTransition.fadeTexture,
        state.textureTransition.ownsTexture,
      );
      fadeMaterial.map = null;
      fadeMaterial.opacity = 0;
      fadeMaterial.needsUpdate = true;
      fadeFront.visible = false;
      state.textureTransition = null;
      state.currentRotationX = 0;
      state.currentRotationY = 0;
      state.displayRotationX = 0;
      state.displayRotationY = 0;
      state.targetRotationX = 0;
      state.targetRotationY = 0;
      state.spinAngle = 0;
    }
  } else {
    state.currentRotationX = THREE.MathUtils.lerp(
      state.currentRotationX,
      state.targetRotationX,
      0.12,
    );
    state.currentRotationY = THREE.MathUtils.lerp(
      state.currentRotationY,
      state.targetRotationY,
      0.12,
    );
    state.spinAngle += deltaSeconds * 0.8;
    state.displayRotationX = state.currentRotationX;
    state.displayRotationY = state.spinAngle + state.currentRotationY;
  }

  // Pop animation: scale cube toward camera
  let popScale = 1;
  if (state.popAnimation) {
    const elapsed = performance.now() - state.popAnimation.startedAt;
    const progress = Math.min(elapsed / POP_DURATION_MS, 1);

    // Elastic easing: overshoot and settle
    const elastic = progress === 1
      ? 1
      : 1 - Math.pow(2, -10 * progress) * Math.cos(progress * Math.PI * 2.5);

    popScale = 1 + elastic * 0.15; // Scale up to 115%

    if (progress >= 1) {
      state.popAnimation = null;
    }
  }

  cube.scale.setScalar(popScale);
  cube.rotation.x = state.displayRotationX;
  cube.rotation.y = state.displayRotationY;
}

function animate() {
  if (!renderer || !scene || !camera || state.isDisposed) {
    return;
  }

  const now = performance.now();
  const deltaSeconds = state.lastFrameAt === 0 ? 0 : (now - state.lastFrameAt) / 1000;
  state.lastFrameAt = now;

  updateScene(deltaSeconds);
  renderer.render(scene, camera);
  animationFrameId = self.requestAnimationFrame(animate);
}

function disposeScene() {
  if (animationFrameId) {
    self.cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
  }

  state.isDisposed = true;
  clearFadeTexture();
  clearOwnedTextures();
  ruggedMap?.dispose();
  ruggedMap = null;
  defaultFrontTexture = null;
  defaultSideTexture = null;
  cube?.geometry.dispose();
  frontGlare?.geometry.dispose();
  secondGlare?.geometry.dispose();
  fadeFront?.geometry.dispose();
  fadeMaterial?.dispose();
  (frontGlare?.material as THREE.Material | undefined)?.dispose();
  (secondGlare?.material as THREE.Material | undefined)?.dispose();
  materials.forEach((material) => material.dispose());
  materials = [];
  pmrem?.dispose();
  renderer?.dispose();
  scene = null;
  camera = null;
  cube = null;
  fadeFront = null;
  fadeMaterial = null;
  frontGlare = null;
  secondGlare = null;
  renderer = null;
}

function initScene(message: Extract<CoverCubeWorkerMessage, { type: 'init' }>) {
  disposeScene();
  state.isDisposed = false;
  state.accentColor = message.accentColor;
  state.currentWidth = message.width;
  state.currentHeight = message.height;
  state.currentSpillScale = message.spillScale;
  state.currentDevicePixelRatio = message.devicePixelRatio;
  state.currentRotationX = 0;
  state.currentRotationY = 0;
  state.displayRotationX = 0;
  state.displayRotationY = 0;
  state.spinAngle = 0;
  state.targetRotationX = 0;
  state.targetRotationY = 0;
  state.textureTransition = null;
  state.lastFrameAt = 0;
  state.requestId = 0;

  renderer = new THREE.WebGLRenderer({
    canvas: message.canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(34, message.width / message.height, 0.1, 100);
  camera.position.set(0, 0, 4.4);

  pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 1).texture;

  ruggedMap = createRuggedGlassMap();
  defaultFrontTexture = orientFrontTexture(
    createDefaultTexture(message.accentColor, { icon: true }),
  );
  defaultSideTexture = createDefaultTexture(message.accentColor, { icon: false });
  ownedTextures.add(defaultFrontTexture);
  ownedTextures.add(defaultSideTexture);

  const glassSettings = {
    roughness: 0.4195,
    metalness: 0.02,
    transmission: 0.72,
    thickness: 0.95,
    ior: 1.48,
    reflectivity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.015,
    transparent: true,
    opacity: 0.94,
    envMapIntensity: 2.8,
    roughnessMap: ruggedMap,
    normalMap: ruggedMap,
    normalScale: new THREE.Vector2(0.045, 0.045),
  } satisfies Partial<THREE.MeshPhysicalMaterialParameters>;

  materials = Array.from({ length: 6 }, (_, index) =>
    new THREE.MeshPhysicalMaterial({
      map: index === 4 ? defaultFrontTexture : defaultSideTexture,
      ...glassSettings,
    }),
  );
  materialOwnsMap.fill(false);

  cube = new THREE.Mesh(
    new RoundedBoxGeometry(1.87, 1.87, 1.87, 40, 0.19),
    materials,
  );
  cube.renderOrder = cubeRenderOrder;
  scene.add(cube);

  frontGlare = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.18),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  frontGlare.position.set(0, 0.48, 1.035);
  frontGlare.rotation.z = -0.42;
  frontGlare.renderOrder = glareRenderOrder;
  cube.add(frontGlare);

  secondGlare = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 0.09),
    new THREE.MeshBasicMaterial({
      color: 0x9fffff,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  secondGlare.position.set(-0.16, -0.28, 1.04);
  secondGlare.rotation.z = -0.42;
  secondGlare.renderOrder = glareRenderOrder;
  cube.add(secondGlare);

  fadeMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  fadeFront = new THREE.Mesh(
    new THREE.PlaneGeometry(1.48, 1.48),
    fadeMaterial,
  );
  fadeFront.position.set(0, 0, 0.955);
  fadeFront.renderOrder = fadeRenderOrder;
  fadeFront.visible = false;
  cube.add(fadeFront);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x7cecff, 2.2);
  rimLight.position.set(-4, -2, 3);
  scene.add(rimLight);

  const pinkReflection = new THREE.DirectionalLight(0x9b7cff, 1.4);
  pinkReflection.position.set(0, 4, -3);
  scene.add(pinkReflection);

  syncRendererSize();
  animate();
}

async function handleSetTexture(
  requestId: number,
  source: CoverCubeTextureMessageSource,
  options: SetCoverCubeTextureOptions,
) {
  state.requestId = requestId;
  state.textureTransition = null;
  clearFadeTexture();

  if (!source) {
    clearFrontTexture();
    return;
  }

  const texture = await loadTextureFromSource(source);

  if (!texture || requestId !== state.requestId) {
    texture?.dispose();
    return;
  }

  const ownsTexture = true;

  if (options.frontOnly) {
    startFrontTextureTransition(texture, ownsTexture, requestId);
    return;
  }

  applyTexture(texture, options, ownsTexture);
}

const POP_DURATION_MS = 450;

function handlePop(requestId: number) {
  state.popAnimation = {
    requestId,
    startedAt: performance.now(),
    progress: 0,
  };
}

function handlePointerDown(x: number, y: number) {
  if (state.textureTransition) {
    return;
  }

  state.isDragging = true;
  state.dragStartX = x;
  state.dragStartY = y;
}

function handlePointerMove(x: number, y: number) {
  if (!state.isDragging || state.textureTransition) {
    return;
  }

  const deltaX = x - state.dragStartX;
  const deltaY = y - state.dragStartY;
  state.dragStartX = x;
  state.dragStartY = y;

  state.targetRotationY += deltaX * 0.012;
  state.targetRotationX = THREE.MathUtils.clamp(
    state.targetRotationX + deltaY * 0.012,
    -0.9,
    0.9,
  );
}

function handlePointerUp() {
  state.isDragging = false;
}

self.onmessage = (event: MessageEvent<CoverCubeWorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case 'init':
      initScene(message);
      break;
    case 'resize':
      state.currentWidth = message.width;
      state.currentHeight = message.height;
      state.currentSpillScale = message.spillScale;
      state.currentDevicePixelRatio = message.devicePixelRatio;
      syncRendererSize();
      break;
    case 'setAccentColor':
      state.accentColor = message.accentColor;
      rebuildDefaultTextures();
      break;
    case 'setTexture':
      void handleSetTexture(message.requestId, message.source, message.options);
      break;
    case 'pop':
      handlePop(message.requestId);
      break;
    case 'pointerDown':
      handlePointerDown(message.x, message.y);
      break;
    case 'pointerMove':
      handlePointerMove(message.x, message.y);
      break;
    case 'pointerUp':
      handlePointerUp();
      break;
    case 'destroy':
      disposeScene();
      break;
  }
};

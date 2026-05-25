"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

type ControlState = {
  count: number;
  quality: number;
  flow: number;
  burst: number;
  swirl: number;
  force: number;
  light: number;
};

const MAX_COUNT = 600;
const MOUSE_FORCE_RADIUS = 4.8;
const MOUSE_SWEEP_MULTIPLIER = 26;
const MOUSE_REPEL_MULTIPLIER = 5;
const FLOW_TARGET_RADIUS = 2.2;
const FLOW_RETURN_STRENGTH = 9;
const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const DEFAULT_QUALITY = 1;

const clampDelta = (delta: number) => Math.min(delta, 0.033);
const getTargetPixelRatio = (quality: number) => {
  const qualityClamped = Math.max(1, Math.min(10, quality));
  const ratioCap = 0.5 + qualityClamped * 0.15;
  return Math.min(window.devicePixelRatio, ratioCap);
};

export function CoffeeBeansCtaScene() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const qualityRef = useRef(DEFAULT_QUALITY);
  const controlRef = useRef({
    activeCount: 600,
    flowMult: 1 / 4,
    burstMult: 1 / 5,
    swirlMult: 1 / 4,
    forceMult: 10 / 5,
    lightMult: 10 / 7,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState("loading...");
  const [controls, setControls] = useState<ControlState>({
    count: 600,
    quality: DEFAULT_QUALITY,
    flow: 1,
    burst: 1,
    swirl: 1,
    force: 10,
    light: 10,
  });

  useEffect(() => {
    controlRef.current = {
      activeCount: controls.count,
      flowMult: controls.flow / 4,
      burstMult: controls.burst / 5,
      swirlMult: controls.swirl / 4,
      forceMult: controls.force / 5,
      lightMult: controls.light / 7,
    };
  }, [controls]);

  useEffect(() => {
    if (!rendererRef.current || !wrapRef.current) return;

    qualityRef.current = controls.quality;
    const renderer = rendererRef.current;
    renderer.setPixelRatio(getTargetPixelRatio(controls.quality));
    const rect = wrapRef.current.getBoundingClientRect();
    renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1), false);
  }, [controls.quality]);

  useEffect(() => {
    if (!wrapRef.current) return;

    const wrap = wrapRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1410);
    scene.fog = new THREE.Fog(0x1a1410, 5, 18);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    rendererRef.current = renderer;
    renderer.setPixelRatio(getTargetPixelRatio(qualityRef.current));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    wrap.appendChild(renderer.domElement);

    const keyLight = new THREE.DirectionalLight(0xffd9a0, 1.0);
    keyLight.position.set(5, 10, 5);
    scene.add(keyLight);

    const mouseLight = new THREE.PointLight(0xff8c3c, 8, 12, 2);
    mouseLight.position.set(0, 0, 2);
    scene.add(mouseLight);

    let beanInstancedMesh: THREE.InstancedMesh | null = null;
    let beanGeometry: THREE.BufferGeometry | null = null;
    let beanMaterial: THREE.Material | null = null;
    let envMap: THREE.Texture | null = null;
    let normalizeScale = 1;
    const beans: Array<{
      position: THREE.Vector3;
      rotation: THREE.Euler;
      rotationSpeed: THREE.Vector3;
      scale: number;
      velocity: THREE.Vector3;
      expandRate: number;
      swirlBias: number;
    }> = [];

    const FLOW_DIRECTION = new THREE.Vector3(1, -1, 0).normalize();
    const SWIRL_AXIS = FLOW_DIRECTION.clone();
    const SPAWN_CENTER = new THREE.Vector3(-12, 7, 0);

    const clock = new THREE.Clock();
    const dummy = new THREE.Object3D();
    const tmpVec = new THREE.Vector3();
    const radialVec = new THREE.Vector3();
    const tangentVec = new THREE.Vector3();

    const mouse = new THREE.Vector2(0, 0);
    const mouseWorld = new THREE.Vector3();
    const prevMouseWorld = new THREE.Vector3();
    const mouseVelocity = new THREE.Vector3();
    const lightTarget = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const interactPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    let frameCount = 0;
    let rafId = 0;
    let disposed = false;
    let hasPrevMouse = false;
    let fpsAverage = 60;

    const spawnPosition = () => {
      const spread = (Math.random() - 0.5) * 6;
      return new THREE.Vector3(
        SPAWN_CENTER.x + 0.707 * spread,
        SPAWN_CENTER.y + 0.707 * spread,
        (Math.random() - 0.5) * 4,
      );
    };

    const makeBean = (initSpread = false) => {
      const b = {
        position: spawnPosition(),
        rotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ),
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04,
        ),
        scale: 0.18 + Math.random() * 0.45,
        velocity: new THREE.Vector3(0, 0, 0),
        expandRate: 0.7 + Math.random() * 0.6,
        swirlBias: 0.7 + Math.random() * 0.6,
      };

      if (initSpread) {
        const t = Math.random() * 20;
        b.position.x += FLOW_DIRECTION.x * t;
        b.position.y += FLOW_DIRECTION.y * t;
      }

      return b;
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const pointerMove = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) return;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${localX}px, ${localY}px)`;
      }

      mouse.x = (localX / rect.width) * 2 - 1;
      mouse.y = -(localY / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.ray.intersectPlane(interactPlane, mouseWorld);

      if (hit) {
        if (!hasPrevMouse) {
          prevMouseWorld.copy(mouseWorld);
          hasPrevMouse = true;
        } else {
          tmpVec.subVectors(mouseWorld, prevMouseWorld);
          mouseVelocity.lerp(tmpVec, 0.55);
          prevMouseWorld.copy(mouseWorld);
        }
      }
    };

    const animate = () => {
      if (disposed) return;

      const { activeCount, flowMult, burstMult, swirlMult, forceMult, lightMult } = controlRef.current;
      const dt = clampDelta(clock.getDelta());
      frameCount += 1;
      const instantFps = 1 / Math.max(dt, 0.0001);
      fpsAverage = fpsAverage * 0.9 + instantFps * 0.1;
      mouseVelocity.multiplyScalar(0.88);

      lightTarget.lerp(mouseWorld, 0.15);
      mouseLight.position.set(lightTarget.x, lightTarget.y, lightTarget.z + 2);
      mouseLight.intensity = lightMult * 8;

      if (beanInstancedMesh) {
        for (let i = 0; i < MAX_COUNT; i += 1) {
          const b = beans[i];

          if (i >= activeCount) {
            dummy.position.set(0, 0, 0);
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            beanInstancedMesh.setMatrixAt(i, dummy.matrix);
            continue;
          }

          radialVec.subVectors(b.position, SPAWN_CENTER);
          const currentRadius = radialVec.length();

          if (currentRadius > 0.01 && currentRadius < 8) {
            const burstSpeed = (b.expandRate * burstMult * 1.5) / (0.6 + currentRadius * 0.5);
            tmpVec.copy(radialVec).normalize().multiplyScalar(burstSpeed * dt);
            b.position.add(tmpVec);
          }

          tmpVec.copy(FLOW_DIRECTION).multiplyScalar(flowMult * 3.0 * dt);
          b.position.add(tmpVec);

          const projection = radialVec.dot(SWIRL_AXIS);
          tmpVec.copy(SWIRL_AXIS).multiplyScalar(projection);
          radialVec.sub(tmpVec);

          if (radialVec.lengthSq() > 0.0001) {
            tangentVec.crossVectors(SWIRL_AXIS, radialVec).normalize();
            const swirlSpeed = swirlMult * b.swirlBias * 2.0;
            b.position.addScaledVector(tangentVec, swirlSpeed * dt);
          }

          tmpVec.subVectors(b.position, mouseWorld);
          const distMouse = tmpVec.length();
          if (distMouse < MOUSE_FORCE_RADIUS && distMouse > 0.01) {
            const influence = 1 - distMouse / MOUSE_FORCE_RADIUS;

            if (mouseVelocity.lengthSq() > 0.000001) {
              tangentVec.copy(mouseVelocity).normalize();
              const sweepStrength = influence * forceMult * MOUSE_SWEEP_MULTIPLIER;
              b.velocity.addScaledVector(tangentVec, sweepStrength * dt);
            }

            const repelStrength = influence * influence * forceMult * MOUSE_REPEL_MULTIPLIER;
            tmpVec.normalize().multiplyScalar(repelStrength);
            b.velocity.add(tmpVec.multiplyScalar(dt));
          }

          tmpVec.subVectors(b.position, SPAWN_CENTER);
          const axisProgress = tmpVec.dot(SWIRL_AXIS);
          tangentVec.copy(SWIRL_AXIS).multiplyScalar(axisProgress).add(SPAWN_CENTER);
          radialVec.subVectors(b.position, tangentVec);
          const axisDistance = radialVec.length();
          if (axisDistance > FLOW_TARGET_RADIUS) {
            const returnInfluence = Math.min((axisDistance - FLOW_TARGET_RADIUS) / 3.5, 1);
            const returnStrength = returnInfluence * flowMult * FLOW_RETURN_STRENGTH;
            radialVec.normalize().multiplyScalar(-returnStrength * dt);
            b.velocity.add(radialVec);
          }

          b.velocity.multiplyScalar(0.95);
          b.position.add(tmpVec.copy(b.velocity).multiplyScalar(dt));

          b.rotation.x += b.rotationSpeed.x * (flowMult + burstMult) * 0.5;
          b.rotation.y += b.rotationSpeed.y * (flowMult + burstMult) * 0.5;
          b.rotation.z += b.rotationSpeed.z * (flowMult + burstMult) * 0.5;

          const flowDistance = b.position.x - b.position.y;
          if (flowDistance > 17) {
            b.position.copy(spawnPosition());
            b.velocity.set(0, 0, 0);
          }

          dummy.position.copy(b.position);
          dummy.rotation.copy(b.rotation);
          const s = b.scale * normalizeScale;
          dummy.scale.set(s, s, s);
          dummy.updateMatrix();
          beanInstancedMesh.setMatrixAt(i, dummy.matrix);
        }

        beanInstancedMesh.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (frameCount % 30 === 0) {
        const renderInfo = renderer.info.render;
        const memoryInfo = renderer.info.memory;
        setDebug(
          `FPS: ${Math.round(fpsAverage)} | Q: ${qualityRef.current}/10 | Draw: ${renderInfo.calls} | Tri: ${renderInfo.triangles.toLocaleString()} | Geo: ${memoryInfo.geometries} | Tex: ${memoryInfo.textures} | Beans: ${activeCount}/${MAX_COUNT}`,
        );
      }

      rafId = window.requestAnimationFrame(animate);
    };

    const loadHDRI = async () => {
      const rgbeLoader = new RGBELoader();
      const hdrTexture = await rgbeLoader.loadAsync(`${PUBLIC_BASE_PATH}/3d/assets/studio_kominka_01_1k.hdr`);
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;

      scene.environment = envMap;
      hdrTexture.dispose();
      pmremGenerator.dispose();
    };

    const loadBean = async () => {
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
      loader.setDRACOLoader(dracoLoader);

      const gltf = await loader.loadAsync(`${PUBLIC_BASE_PATH}/3d/assets/coffee_beans.glb`);

      const meshes: THREE.Mesh[] = [];
      gltf.scene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.geometry) {
          meshes.push(mesh);
        }
      });

      const sourceMesh = meshes[0];
      if (!sourceMesh) throw new Error("找不到豆子模型");

      beanGeometry = sourceMesh.geometry.clone();
      beanGeometry.computeBoundingBox();
      const size = new THREE.Vector3();
      beanGeometry.boundingBox?.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      normalizeScale = 1 / maxDim;

      beanMaterial = (sourceMesh.material as THREE.MeshStandardMaterial).clone();
      (beanMaterial as THREE.MeshStandardMaterial).envMapIntensity = 0.7;
    };

    const init = async () => {
      try {
        await Promise.all([loadHDRI(), loadBean()]);
        if (!beanGeometry || !beanMaterial) throw new Error("模型初始化失敗");

        beanInstancedMesh = new THREE.InstancedMesh(beanGeometry, beanMaterial, MAX_COUNT);
        beanInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        beanInstancedMesh.frustumCulled = false;

        const dummyColor = new THREE.Color();
        for (let i = 0; i < MAX_COUNT; i += 1) {
          const brightness = 0.7 + Math.random() * 0.5;
          const warmTint = Math.random() < 0.1 ? 0.05 : 0;
          dummyColor.setRGB(brightness + warmTint, brightness, brightness * 0.95);
          beanInstancedMesh.setColorAt(i, dummyColor);
          beans.push(makeBean(true));
        }

        if (beanInstancedMesh.instanceColor) {
          beanInstancedMesh.instanceColor.needsUpdate = true;
        }
        scene.add(beanInstancedMesh);

        resize();
        setLoading(false);
        animate();
      } catch (initError) {
        const message = initError instanceof Error ? initError.message : "3D 載入失敗";
        setError(message);
        setLoading(false);
      }
    };

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(wrap);
    wrap.addEventListener("pointermove", pointerMove);

    init();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      wrap.removeEventListener("pointermove", pointerMove);
      resizeObserver.disconnect();

      if (beanInstancedMesh) {
        scene.remove(beanInstancedMesh);
      }

      if (beanGeometry) beanGeometry.dispose();
      if (beanMaterial) beanMaterial.dispose();
      if (envMap) envMap.dispose();

      scene.remove(keyLight);
      scene.remove(mouseLight);
      renderer.dispose();
      rendererRef.current = null;

      if (renderer.domElement.parentNode === wrap) {
        wrap.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={wrapRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      <div
        ref={dotRef}
        className="pointer-events-none absolute left-0 top-0 z-[3] hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(255,175,93,0.95)] md:block"
      />

      {loading && (
        <div className="absolute inset-0 z-[4] flex items-center justify-center bg-[#1a1410]/90 text-xs font-semibold tracking-[0.2em] text-[#f5e6d3]">
          LOADING ASSETS...
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[4] flex items-center justify-center bg-[#1a1410]/90 px-6 text-center text-sm text-red-200">
          3D 載入失敗：{error}
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 z-[5] flex w-[calc(100%-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-[11px] text-[#f5e6d3] backdrop-blur md:w-auto md:gap-3 md:px-4 md:text-xs">
        <Control label="豆數" id="count" min={60} max={600} value={controls.count} onChange={(value) => setControls((prev) => ({ ...prev, count: value }))} />
        <Control label="畫質" id="quality" min={1} max={10} value={controls.quality} onChange={(value) => setControls((prev) => ({ ...prev, quality: value }))} />
        <Control label="流速" id="flow" min={0} max={10} value={controls.flow} onChange={(value) => setControls((prev) => ({ ...prev, flow: value }))} />
        <Control label="爆發" id="burst" min={0} max={10} value={controls.burst} onChange={(value) => setControls((prev) => ({ ...prev, burst: value }))} />
        <Control label="旋轉" id="swirl" min={0} max={10} value={controls.swirl} onChange={(value) => setControls((prev) => ({ ...prev, swirl: value }))} />
        <Control label="推力" id="force" min={0} max={10} value={controls.force} onChange={(value) => setControls((prev) => ({ ...prev, force: value }))} />
        <Control label="光源" id="light" min={0} max={10} value={controls.light} onChange={(value) => setControls((prev) => ({ ...prev, light: value }))} />
      </div>

      <div className="absolute right-4 top-4 z-[5] hidden rounded-md bg-black/35 px-2 py-1 text-[11px] text-white/70 md:block">
        {debug}
      </div>
    </div>
  );
}

type ControlProps = {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
};

function Control({ id, label, min, max, value, onChange }: ControlProps) {
  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={id} className="opacity-80">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-14 accent-amber-500 md:w-16"
      />
      <span className="w-5 text-right tabular-nums opacity-90">{value}</span>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ARCHITECTURAL_POIS,
  ATMOSPHERE_PRESETS,
  AtmosphereId,
  CAMERA_PRESETS,
  CameraPresetId,
  EasterEggState,
} from '../types/scene';
import { createProceduralTextures } from '../three/textures';
import { buildNantesCathedral } from '../three/cathedralBuilder';
import { buildAutumnEnvironment } from '../three/treesAndEnvironment';
import { buildAnimatedCharacters } from '../three/animatedCharacters';
import { computeAtmosphereForHour, getDecimalHoursFromDate } from '../utils/solarTime';

interface CathedralCanvasProps {
  cameraPreset: CameraPresetId;
  atmosphereId: AtmosphereId;
  customHour: number | null;
  zoomCommand: { seq: number; factor: number } | null;
  autumnMaturity: number;
  windStrength: number;
  autoOrbit: boolean;
  cutawayMode: boolean;
  easterEgg: EasterEggState;
  selectedPoiId: string | null;
  onSelectPoi: (poiId: string | null) => void;
  onUserCameraOverride: () => void;
}

// Pre-allocated scratch vectors & colors outside the loop (Zero GC)
const _skyTopTarget = new THREE.Color();
const _skyColorTarget = new THREE.Color();
const _sunColorTarget = new THREE.Color();
const _hemiSkyTarget = new THREE.Color();
const _hemiGroundTarget = new THREE.Color();
const _rimColorTarget = new THREE.Color();
const _pointerNdc = new THREE.Vector2();
const _zoomOffset = new THREE.Vector3();

export const CathedralCanvas: React.FC<CathedralCanvasProps> = ({
  cameraPreset,
  atmosphereId,
  customHour,
  zoomCommand,
  autumnMaturity,
  windStrength,
  autoOrbit,
  cutawayMode,
  easterEgg,
  selectedPoiId,
  onSelectPoi,
  onUserCameraOverride,
}) => {
  const canvasMountRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    atmosphereId,
    customHour,
    autumnMaturity,
    windStrength,
    autoOrbit,
    cutawayMode,
    easterEgg,
    selectedPoiId,
    cameraTransitionActive: false,
    desiredCamPos: new THREE.Vector3(-68, 22, 48),
    desiredTarget: new THREE.Vector3(-3, 12.5, 0),
    currentCamPos: new THREE.Vector3(-68, 22, 48),
    currentTarget: new THREE.Vector3(-3, 12.5, 0),
  });

  const callbacksRef = useRef({
    onSelectPoi,
    onUserCameraOverride,
  });
  callbacksRef.current = { onSelectPoi, onUserCameraOverride };

  useEffect(() => {
    if (selectedPoiId) {
      const poi = ARCHITECTURAL_POIS.find((p) => p.id === selectedPoiId);
      if (poi) {
        stateRef.current.desiredCamPos.set(...poi.cameraPosition);
        stateRef.current.desiredTarget.set(...poi.cameraTarget);
        stateRef.current.cameraTransitionActive = true;
        return;
      }
    }
    const preset = CAMERA_PRESETS.find((c) => c.id === cameraPreset);
    if (preset) {
      stateRef.current.desiredCamPos.set(...preset.position);
      stateRef.current.desiredTarget.set(...preset.target);
      stateRef.current.cameraTransitionActive = true;
    }
  }, [cameraPreset, selectedPoiId]);

  useEffect(() => {
    if (!zoomCommand) return;
    const basePos = stateRef.current.cameraTransitionActive
      ? stateRef.current.desiredCamPos
      : stateRef.current.currentCamPos;
    const baseTarget = stateRef.current.cameraTransitionActive
      ? stateRef.current.desiredTarget
      : stateRef.current.currentTarget;

    _zoomOffset.subVectors(basePos, baseTarget);
    const currentDist = _zoomOffset.length();
    const nextDist = THREE.MathUtils.clamp(currentDist * zoomCommand.factor, 8, 155);
    _zoomOffset.normalize().multiplyScalar(nextDist);

    stateRef.current.desiredTarget.copy(baseTarget);
    stateRef.current.desiredCamPos.copy(baseTarget).add(_zoomOffset);
    // Keep camera above ground
    if (stateRef.current.desiredCamPos.y < 2.2) {
      stateRef.current.desiredCamPos.y = 2.2;
    }
    stateRef.current.cameraTransitionActive = true;
  }, [zoomCommand]);

  useEffect(() => {
    stateRef.current.atmosphereId = atmosphereId;
  }, [atmosphereId]);

  useEffect(() => {
    stateRef.current.customHour = customHour;
  }, [customHour]);

  useEffect(() => {
    stateRef.current.windStrength = windStrength;
  }, [windStrength]);

  useEffect(() => {
    stateRef.current.autoOrbit = autoOrbit;
  }, [autoOrbit]);

  const envApiRef = useRef<{ setAutumnTone: (m: number) => void } | null>(null);
  const cathedralApiRef = useRef<{ setCutawayMode: (enabled: boolean) => void } | null>(null);
  const charactersApiRef = useRef<{ setVisibility: (s: EasterEggState) => void } | null>(null);

  useEffect(() => {
    stateRef.current.autumnMaturity = autumnMaturity;
    envApiRef.current?.setAutumnTone(autumnMaturity);
  }, [autumnMaturity]);

  useEffect(() => {
    stateRef.current.cutawayMode = cutawayMode;
    cathedralApiRef.current?.setCutawayMode(cutawayMode);
  }, [cutawayMode]);

  useEffect(() => {
    stateRef.current.easterEgg = easterEgg;
    charactersApiRef.current?.setVisibility(easterEgg);
  }, [easterEgg]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software-WebGL Guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Scene, Studio Environment Map (RoomEnvironment + PMREMGenerator), & Horizon Fog
    const scene = new THREE.Scene();
    const initialAtmo = ATMOSPHERE_PRESETS[stateRef.current.atmosphereId];
    scene.background = new THREE.Color(initialAtmo.horizonColor);
    scene.fog = new THREE.FogExp2(initialAtmo.horizonColor, initialAtmo.fogDensity);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // 3. Camera & OrbitControls
    const camera = new THREE.PerspectiveCamera(
      46,
      container.clientWidth / container.clientHeight,
      0.5,
      340
    );
    camera.position.copy(stateRef.current.desiredCamPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(stateRef.current.desiredTarget);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.15;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.minDistance = 6;
    controls.maxDistance = 160;
    controls.update();

    const onControlsStart = () => {
      stateRef.current.cameraTransitionActive = false;
      callbacksRef.current.onUserCameraOverride();
    };
    controls.addEventListener('start', onControlsStart);

    // 4. Balanced 3-Point Studio & Outdoor Lighting Rig
    const sunLight = new THREE.DirectionalLight(initialAtmo.sunColor, initialAtmo.sunIntensity);
    sunLight.position.set(...initialAtmo.sunPosition);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    const d = 48;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(
      initialAtmo.hemiSkyColor,
      initialAtmo.hemiGroundColor,
      initialAtmo.hemiIntensity
    );
    hemiLight.position.set(0, 60, 0);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(initialAtmo.rimColor, initialAtmo.rimIntensity);
    rimLight.position.set(45, 28, -40);
    scene.add(rimLight);

    // 5. Build Procedural Textures, Nantes Cathedral, Autumn Trees & Animated Characters
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const textures = createProceduralTextures(maxAnisotropy);
    const cathedral = buildNantesCathedral(textures, isSoftwareGl);
    const environment = buildAutumnEnvironment(textures, isSoftwareGl);
    const characters = buildAnimatedCharacters(textures, isSoftwareGl);

    envApiRef.current = { setAutumnTone: environment.setAutumnTone };
    cathedralApiRef.current = { setCutawayMode: cathedral.setCutawayMode };
    charactersApiRef.current = { setVisibility: characters.setVisibility };

    environment.setAutumnTone(stateRef.current.autumnMaturity);
    cathedral.setCutawayMode(stateRef.current.cutawayMode);
    characters.setVisibility(stateRef.current.easterEgg);

    scene.add(cathedral.group);
    scene.add(environment.group);
    scene.add(characters.group);

    // 6. Interactive 3D Architectural POI Inspection Nodes (Layer 1)
    const poiMeshes: THREE.Mesh[] = [];
    const poiGeo = new THREE.OctahedronGeometry(0.62, 0);
    const poiMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: new THREE.Color(0xd97706),
      emissiveIntensity: 0.75,
      roughness: 0.2,
      metalness: 0.8,
    });

    for (const poi of ARCHITECTURAL_POIS) {
      const marker = new THREE.Mesh(poiGeo, poiMat);
      marker.position.set(...poi.worldPosition);
      marker.userData = { poiId: poi.id };
      marker.layers.enable(1);
      scene.add(marker);
      poiMeshes.push(marker);
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 7. Raycasting for clicking 3D Architectural POI markers
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (dx * dx + dy * dy > 36) return;

      const rect = renderer.domElement.getBoundingClientRect();
      _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_pointerNdc, camera);
      const hits = raycaster.intersectObjects(poiMeshes, false);
      if (hits.length > 0) {
        const hitPoiId = hits[0].object.userData.poiId as string;
        if (hitPoiId) {
          callbacksRef.current.onSelectPoi(hitPoiId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // 8. Responsive Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 9. Animation Loop with Software-WebGL `afterDraw` Pacing & Exponential Damping
    const clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      if (stateRef.current.cameraTransitionActive) {
        const lambda = 4.5;
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          stateRef.current.desiredCamPos.x,
          lambda,
          delta
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          stateRef.current.desiredCamPos.y,
          lambda,
          delta
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          stateRef.current.desiredCamPos.z,
          lambda,
          delta
        );

        controls.target.x = THREE.MathUtils.damp(
          controls.target.x,
          stateRef.current.desiredTarget.x,
          lambda,
          delta
        );
        controls.target.y = THREE.MathUtils.damp(
          controls.target.y,
          stateRef.current.desiredTarget.y,
          lambda,
          delta
        );
        controls.target.z = THREE.MathUtils.damp(
          controls.target.z,
          stateRef.current.desiredTarget.z,
          lambda,
          delta
        );

        if (
          camera.position.distanceToSquared(stateRef.current.desiredCamPos) < 0.04 &&
          controls.target.distanceToSquared(stateRef.current.desiredTarget) < 0.04
        ) {
          stateRef.current.cameraTransitionActive = false;
        }
      } else if (stateRef.current.autoOrbit && !isSoftwareGl) {
        const angle = delta * 0.11;
        const dx = camera.position.x - controls.target.x;
        const dz = camera.position.z - controls.target.z;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        camera.position.x = controls.target.x + dx * cosA - dz * sinA;
        camera.position.z = controls.target.z + dx * sinA + dz * cosA;
      }

      controls.update();
      stateRef.current.currentCamPos.copy(camera.position);
      stateRef.current.currentTarget.copy(controls.target);

      let activeDecimalHour = 16.5;
      let targetAtmo = ATMOSPHERE_PRESETS[stateRef.current.atmosphereId];

      if (stateRef.current.customHour !== null) {
        activeDecimalHour = stateRef.current.customHour;
        targetAtmo = computeAtmosphereForHour(activeDecimalHour, false);
      } else if (stateRef.current.atmosphereId === 'temps_reel') {
        activeDecimalHour = getDecimalHoursFromDate();
        targetAtmo = computeAtmosphereForHour(activeDecimalHour, true);
      } else {
        activeDecimalHour = targetAtmo.defaultHour ?? 16.5;
      }

      const lightLambda = 3.5;
      const lerpAlpha = 1 - Math.exp(-lightLambda * delta);

      _skyTopTarget.set(targetAtmo.skyColor);
      _skyColorTarget.set(targetAtmo.horizonColor);
      _sunColorTarget.set(targetAtmo.sunColor);

      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(_skyColorTarget, lerpAlpha);
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(_skyColorTarget, lerpAlpha);
        scene.fog.density = THREE.MathUtils.damp(
          scene.fog.density,
          targetAtmo.fogDensity,
          lightLambda,
          delta
        );
      }

      environment.skyUniforms.uTopColor.value.lerp(_skyTopTarget, lerpAlpha);
      environment.skyUniforms.uHorizonColor.value.lerp(_skyColorTarget, lerpAlpha);
      environment.skyUniforms.uSunColor.value.lerp(_sunColorTarget, lerpAlpha);

      sunLight.color.lerp(_sunColorTarget, lerpAlpha);
      sunLight.intensity = THREE.MathUtils.damp(
        sunLight.intensity,
        targetAtmo.sunIntensity,
        lightLambda,
        delta
      );
      sunLight.position.x = THREE.MathUtils.damp(
        sunLight.position.x,
        targetAtmo.sunPosition[0],
        lightLambda,
        delta
      );
      sunLight.position.y = THREE.MathUtils.damp(
        sunLight.position.y,
        targetAtmo.sunPosition[1],
        lightLambda,
        delta
      );
      sunLight.position.z = THREE.MathUtils.damp(
        sunLight.position.z,
        targetAtmo.sunPosition[2],
        lightLambda,
        delta
      );
      environment.skyUniforms.uSunPosition.value.copy(sunLight.position);

      _hemiSkyTarget.set(targetAtmo.hemiSkyColor);
      _hemiGroundTarget.set(targetAtmo.hemiGroundColor);
      hemiLight.color.lerp(_hemiSkyTarget, lerpAlpha);
      hemiLight.groundColor.lerp(_hemiGroundTarget, lerpAlpha);
      hemiLight.intensity = THREE.MathUtils.damp(
        hemiLight.intensity,
        targetAtmo.hemiIntensity,
        lightLambda,
        delta
      );

      _rimColorTarget.set(targetAtmo.rimColor);
      rimLight.color.lerp(_rimColorTarget, lerpAlpha);
      rimLight.intensity = THREE.MathUtils.damp(
        rimLight.intensity,
        targetAtmo.rimIntensity,
        lightLambda,
        delta
      );

      renderer.toneMappingExposure = THREE.MathUtils.damp(
        renderer.toneMappingExposure,
        targetAtmo.exposure,
        lightLambda,
        delta
      );

      const isNightLight = targetAtmo.lanternGlow > 0.8;
      const targetBeamOpacity = isNightLight ? 0.12 : 0.65;
      cathedral.sunbeamMaterial.opacity = THREE.MathUtils.damp(
        cathedral.sunbeamMaterial.opacity,
        targetBeamOpacity,
        lightLambda,
        delta
      );

      cathedral.stainedGlassMaterial.emissiveIntensity = THREE.MathUtils.damp(
        cathedral.stainedGlassMaterial.emissiveIntensity,
        targetAtmo.stainedGlassGlow,
        lightLambda,
        delta
      );
      environment.lanternBulbMat.emissiveIntensity = THREE.MathUtils.damp(
        environment.lanternBulbMat.emissiveIntensity,
        targetAtmo.lanternGlow * 2.2,
        lightLambda,
        delta
      );
      environment.townhouseWindowMat.emissiveIntensity = THREE.MathUtils.damp(
        environment.townhouseWindowMat.emissiveIntensity,
        targetAtmo.lanternGlow * 0.75,
        lightLambda,
        delta
      );

      for (let i = 0; i < cathedral.uplights.length; i++) {
        cathedral.uplights[i].intensity = THREE.MathUtils.damp(
          cathedral.uplights[i].intensity,
          targetAtmo.lanternGlow * 18,
          lightLambda,
          delta
        );
      }
      for (let i = 0; i < environment.streetLights.length; i++) {
        environment.streetLights[i].intensity = THREE.MathUtils.damp(
          environment.streetLights[i].intensity,
          targetAtmo.lanternGlow * 11,
          lightLambda,
          delta
        );
      }

      for (let i = 0; i < poiMeshes.length; i++) {
        const m = poiMeshes[i];
        m.rotation.y = elapsed * 1.2 + i;
        const isSelected = m.userData.poiId === stateRef.current.selectedPoiId;
        const s = isSelected ? 1.45 : 1.0;
        m.scale.setScalar(s);
      }

      cathedral.updateBellSwing(elapsed, activeDecimalHour);
      environment.updateAnimation(elapsed, delta, stateRef.current.windStrength);
      characters.update(elapsed, delta);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('start', onControlsStart);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      poiGeo.dispose();
      poiMat.dispose();
      cathedral.dispose();
      environment.dispose();
      characters.dispose();
      textures.dispose();
      envTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={canvasMountRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden cursor-grab active:cursor-grabbing"
      aria-label="Scène 3D interactive de la Cathédrale Saint-Pierre-et-Saint-Paul de Nantes en automne"
    />
  );
};

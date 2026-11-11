import * as THREE from 'three';
import { ProceduralTextureSet } from './textures';

export interface CathedralModel {
  group: THREE.Group;
  cutawayGroup: THREE.Group;
  interiorGroup: THREE.Group;
  stainedGlassMaterial: THREE.MeshStandardMaterial;
  clockGoldMaterial: THREE.MeshStandardMaterial;
  sunbeamMaterial: THREE.MeshBasicMaterial;
  uplights: THREE.PointLight[];
  interiorLights: THREE.PointLight[];
  setCutawayMode: (enabled: boolean) => void;
  updateBellSwing: (elapsed: number, decimalHours?: number) => void;
  dispose: () => void;
}

function createPointedArchShape(width: number, height: number, archStartRatio = 0.56): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const springY = height * archStartRatio;
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, springY);
  shape.quadraticCurveTo(-hw * 0.86, height * 0.89, 0, height);
  shape.quadraticCurveTo(hw * 0.86, height * 0.89, hw, springY);
  shape.lineTo(hw, 0);
  shape.closePath();
  return shape;
}

function createGothicPortalFrameGeometry(
  outerW: number,
  outerH: number,
  archW: number,
  archH: number,
  depth: number,
  bevel = 0.1
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const how = outerW / 2;
  shape.moveTo(-how, 0);
  shape.lineTo(how, 0);
  shape.lineTo(how, outerH);
  shape.lineTo(-how, outerH);
  shape.closePath();

  const hole = new THREE.Path();
  const haw = archW / 2;
  const springY = archH * 0.56;
  hole.moveTo(-haw, 0);
  hole.lineTo(-haw, springY);
  hole.quadraticCurveTo(-haw * 0.86, archH * 0.89, 0, archH);
  hole.quadraticCurveTo(haw * 0.86, archH * 0.89, haw, springY);
  hole.lineTo(haw, 0);
  hole.closePath();

  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
  });
  geo.rotateY(Math.PI / 2);
  return geo;
}

function createGothicArchRingGeometry(
  outerW: number,
  outerH: number,
  innerW: number,
  innerH: number,
  depth: number
): THREE.ExtrudeGeometry {
  const shape = createPointedArchShape(outerW, outerH, 0.56);
  const hole = new THREE.Path();
  const hiw = innerW / 2;
  const springY = innerH * 0.56;
  hole.moveTo(-hiw, 0);
  hole.lineTo(-hiw, springY);
  hole.quadraticCurveTo(-hiw * 0.86, innerH * 0.89, 0, innerH);
  hole.quadraticCurveTo(hiw * 0.86, innerH * 0.89, hiw, springY);
  hole.lineTo(hiw, 0);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  });
  return geo;
}

function createFlyingButtressFlyerGeometry(
  spanZ: number,
  riseY: number,
  thicknessY: number,
  widthX: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(spanZ * 0.45, riseY * 0.72, spanZ, riseY);
  shape.lineTo(spanZ, riseY + thicknessY);
  shape.quadraticCurveTo(spanZ * 0.45, riseY * 0.72 + thicknessY * 1.05, 0, thicknessY);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: widthX,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.05,
    bevelThickness: 0.05,
  });
  geo.rotateY(Math.PI / 2);
  geo.translate(-widthX / 2, 0, 0);
  return geo;
}

export function buildNantesCathedral(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): CathedralModel {
  const group = new THREE.Group();
  group.name = 'CathedraleDeNantes';

  const cutawayGroup = new THREE.Group();
  cutawayGroup.name = 'CutawayShell';
  group.add(cutawayGroup);

  const interiorGroup = new THREE.Group();
  interiorGroup.name = 'InteriorArchitecture';
  group.add(interiorGroup);

  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometriesToDispose.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materialsToDispose.push(m);
    return m;
  };

  // --- Materials ---
  const tuffeauMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf5efe3,
      map: textures.tuffeauMap,
      normalMap: textures.tuffeauNormal,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.74,
      metalness: 0.04,
    })
  );

  const carvedTuffeauMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfcf9f2,
      normalMap: textures.tuffeauNormal,
      normalScale: new THREE.Vector2(0.22, 0.22),
      roughness: 0.44,
      metalness: 0.08,
    })
  );

  const weatheredStoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd6cdbe,
      map: textures.tuffeauMap,
      normalMap: textures.tuffeauNormal,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughness: 0.84,
      metalness: 0.05,
    })
  );

  const graniteBaseMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8e867c,
      map: textures.cobbleMap,
      normalMap: textures.cobbleNormal,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.85,
      metalness: 0.05,
    })
  );

  const slateRoofMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2c3545,
      map: textures.slateMap,
      normalMap: textures.slateNormal,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.36,
      metalness: 0.26,
    })
  );

  const verdigrisCopperMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x4b8072,
      roughness: 0.32,
      metalness: 0.76,
    })
  );

  const darkOakMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2b1c12,
      roughness: 0.62,
      metalness: 0.14,
    })
  );

  const wroughtIronMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1b1d20,
      roughness: 0.32,
      metalness: 0.85,
    })
  );

  const stainedGlassMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.stainedGlassMap,
      emissive: new THREE.Color(0xff9b38),
      emissiveMap: textures.stainedGlassMap,
      emissiveIntensity: 0.32,
      roughness: 0.12,
      metalness: 0.12,
      side: THREE.DoubleSide,
    })
  );

  const clockGoldMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.18,
      metalness: 0.92,
    })
  );

  const organPipeMetalMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd6d3cd,
      roughness: 0.18,
      metalness: 0.9,
    })
  );

  const blackMarbleMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1c1f24,
      roughness: 0.18,
      metalness: 0.18,
    })
  );

  // Translucent Volumetric Sunbeam Material (God Rays)
  const sunbeamCanvas = document.createElement('canvas');
  sunbeamCanvas.width = 128;
  sunbeamCanvas.height = 256;
  const sbCtx = sunbeamCanvas.getContext('2d')!;
  const sbGrad = sbCtx.createLinearGradient(0, 0, 0, 256);
  sbGrad.addColorStop(0, 'rgba(255, 215, 130, 0.0)');
  sbGrad.addColorStop(0.25, 'rgba(255, 210, 125, 0.14)');
  sbGrad.addColorStop(0.75, 'rgba(255, 195, 105, 0.06)');
  sbGrad.addColorStop(1, 'rgba(255, 185, 90, 0.0)');
  sbCtx.fillStyle = sbGrad;
  sbCtx.fillRect(0, 0, 128, 256);
  const sunbeamTex = new THREE.CanvasTexture(sunbeamCanvas);
  sunbeamTex.colorSpace = THREE.SRGBColorSpace;

  const sunbeamMaterial = trackMat(
    new THREE.MeshBasicMaterial({
      map: sunbeamTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );

  const shadowCast = !isSoftwareGl;

  // ============================================================================
  // 1. STEPPED GRANITE PARVIS PLINTH & MOLDED SOCLE
  // ============================================================================
  const stepsData = [
    { w: 51.5, d: 35.5, h: 0.28, y: 0.14, x: 0.5 },
    { w: 49.8, d: 33.8, h: 0.28, y: 0.42, x: 0.8 },
    { w: 48.2, d: 32.2, h: 0.28, y: 0.70, x: 1.0 },
  ];
  for (const st of stepsData) {
    const stepGeo = trackGeo(new THREE.BoxGeometry(st.w, st.h, st.d));
    const stepMesh = new THREE.Mesh(stepGeo, graniteBaseMat);
    stepMesh.position.set(st.x, st.y, 0);
    stepMesh.receiveShadow = true;
    group.add(stepMesh);
  }

  const baseY = 0.84;

  // Soft Radial Contact Shadow under the cathedral
  const contactGeo = trackGeo(new THREE.PlaneGeometry(70, 50));
  const contactMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  const contactPlane = new THREE.Mesh(contactGeo, contactMat);
  contactPlane.rotation.x = -Math.PI / 2;
  contactPlane.position.set(1, 0.02, 0);
  group.add(contactPlane);

  const socleGeo = trackGeo(new THREE.BoxGeometry(33.2, 1.15, 19.2));
  const socleMesh = new THREE.Mesh(socleGeo, weatheredStoneMat);
  socleMesh.position.set(-0.5, baseY + 0.57, 0);
  group.add(socleMesh);

  // ============================================================================
  // 2. SHARED ARCHITECTURAL ORNAMENT BUILDERS (Windows, Pinnacles, Balustrades)
  // ============================================================================
  const lancetW = 1.65;
  const lancetH = 4.65;
  const lancetShape = createPointedArchShape(lancetW, lancetH, 0.58);
  const lancetGlassGeo = trackGeo(
    new THREE.ExtrudeGeometry(lancetShape, { depth: 0.16, bevelEnabled: false })
  );
  const lancetArchHoodGeo = trackGeo(
    createGothicArchRingGeometry(
      lancetW + 0.46,
      lancetH + 0.36,
      lancetW - 0.04,
      lancetH - 0.04,
      0.3
    )
  );
  const mullionVGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.055, lancetH * 0.74, 6));
  const traceryOculusGeo = trackGeo(new THREE.TorusGeometry(0.34, 0.055, 6, 16));
  const sillGeo = trackGeo(new THREE.BoxGeometry(lancetW + 0.58, 0.2, 0.42));

  const createDetailedLancetWindow = (scaleX = 1, scaleY = 1): THREE.Group => {
    const wGroup = new THREE.Group();
    const glass = new THREE.Mesh(lancetGlassGeo, stainedGlassMaterial);
    glass.position.z = -0.08;
    wGroup.add(glass);

    const hood = new THREE.Mesh(lancetArchHoodGeo, carvedTuffeauMat);
    hood.position.z = -0.14;
    wGroup.add(hood);

    const mullion = new THREE.Mesh(mullionVGeo, carvedTuffeauMat);
    mullion.position.set(0, lancetH * 0.37, 0.04);
    wGroup.add(mullion);

    for (const sx of [-lancetW * 0.46, lancetW * 0.46]) {
      const jamb = new THREE.Mesh(mullionVGeo, carvedTuffeauMat);
      jamb.position.set(sx, lancetH * 0.32, 0.06);
      wGroup.add(jamb);
    }

    const oculus = new THREE.Mesh(traceryOculusGeo, carvedTuffeauMat);
    oculus.position.set(0, lancetH * 0.74, 0.05);
    wGroup.add(oculus);

    const sill = new THREE.Mesh(sillGeo, weatheredStoneMat);
    sill.position.set(0, -0.05, 0.05);
    wGroup.add(sill);

    wGroup.scale.set(scaleX, scaleY, 1);
    return wGroup;
  };

  // Multi-Part Crocketed Gothic Pinnacles (Pinacles à crochets)
  const pinTabernacleGeo = trackGeo(new THREE.BoxGeometry(0.92, 1.48, 0.92));
  const pinColGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.09, 1.38, 6));
  const pinGableGeo = trackGeo(new THREE.ConeGeometry(0.78, 0.68, 4));
  pinGableGeo.rotateY(Math.PI / 4);
  const pinSpireGeo = trackGeo(new THREE.ConeGeometry(0.68, 3.4, 4));
  pinSpireGeo.rotateY(Math.PI / 4);
  const crocketGeo = trackGeo(new THREE.OctahedronGeometry(0.14, 0));
  const fleuronGeo = trackGeo(new THREE.OctahedronGeometry(0.27, 0));

  const createDetailedPinnacle = (scale = 1): THREE.Group => {
    const pGroup = new THREE.Group();
    const core = new THREE.Mesh(pinTabernacleGeo, carvedTuffeauMat);
    core.position.y = 0.74;
    core.castShadow = shadowCast;
    pGroup.add(core);

    for (const cx of [-0.42, 0.42]) {
      for (const cz of [-0.42, 0.42]) {
        const col = new THREE.Mesh(pinColGeo, carvedTuffeauMat);
        col.position.set(cx, 0.74, cz);
        pGroup.add(col);
      }
    }

    const cap = new THREE.Mesh(pinGableGeo, weatheredStoneMat);
    cap.position.y = 1.68;
    pGroup.add(cap);

    const spire = new THREE.Mesh(pinSpireGeo, carvedTuffeauMat);
    spire.position.y = 3.4;
    spire.castShadow = shadowCast;
    pGroup.add(spire);

    for (let tier = 0; tier < 3; tier++) {
      const ty = 2.15 + tier * 0.8;
      const r = 0.52 - tier * 0.13;
      for (let a = 0; a < 4; a++) {
        const ang = (a / 4) * Math.PI * 2 + Math.PI / 4;
        const crocket = new THREE.Mesh(crocketGeo, carvedTuffeauMat);
        crocket.position.set(Math.cos(ang) * r, ty, Math.sin(ang) * r);
        pGroup.add(crocket);
      }
    }

    const fleuron = new THREE.Mesh(fleuronGeo, carvedTuffeauMat);
    fleuron.position.y = 5.22;
    pGroup.add(fleuron);

    pGroup.scale.setScalar(scale);
    return pGroup;
  };

  // Openwork Gothic Balustrades (Galeries à quadrilobes)
  const balPostGeo = trackGeo(new THREE.BoxGeometry(0.18, 1.18, 0.22));
  const balQuatrefoilGeo = trackGeo(new THREE.TorusGeometry(0.24, 0.055, 6, 12));

  const createOpenworkBalustrade = (length: number, segments: number): THREE.Group => {
    const bGroup = new THREE.Group();
    const topRailGeo = trackGeo(new THREE.BoxGeometry(length, 0.14, 0.26));
    const botRailGeo = trackGeo(new THREE.BoxGeometry(length, 0.16, 0.26));

    const botRail = new THREE.Mesh(botRailGeo, carvedTuffeauMat);
    botRail.position.y = 0.08;
    bGroup.add(botRail);

    const topRail = new THREE.Mesh(topRailGeo, carvedTuffeauMat);
    topRail.position.y = 1.14;
    bGroup.add(topRail);

    const step = length / segments;
    for (let i = 0; i <= segments; i++) {
      const x = -length / 2 + i * step;
      const post = new THREE.Mesh(balPostGeo, carvedTuffeauMat);
      post.position.set(x, 0.6, 0);
      bGroup.add(post);

      if (i < segments) {
        const qf = new THREE.Mesh(balQuatrefoilGeo, carvedTuffeauMat);
        qf.position.set(x + step / 2, 0.6, 0);
        bGroup.add(qf);
      }
    }
    return bGroup;
  };

  // ============================================================================
  // 3. HIGH GOTHIC NAVE, SIDE AISLES, GABLED LATERAL CHAPELS & ROOF DORMERS
  // ============================================================================
  const naveLength = 31;
  const naveWidth = 9.2;
  const naveWallH = 17.5;
  const naveCenterX = -0.5;
  const wallThickness = 0.85;

  const northWallGeo = trackGeo(new THREE.BoxGeometry(naveLength, naveWallH, wallThickness));
  const northWall = new THREE.Mesh(northWallGeo, tuffeauMat);
  northWall.position.set(naveCenterX, baseY + naveWallH / 2, -naveWidth / 2 + wallThickness / 2);
  northWall.castShadow = shadowCast;
  northWall.receiveShadow = true;
  group.add(northWall);

  const southWall = new THREE.Mesh(northWallGeo, tuffeauMat);
  southWall.position.set(naveCenterX, baseY + naveWallH / 2, naveWidth / 2 - wallThickness / 2);
  southWall.castShadow = shadowCast;
  southWall.receiveShadow = true;
  cutawayGroup.add(southWall);

  const naveCorniceGeo = trackGeo(new THREE.BoxGeometry(naveLength + 0.4, 0.36, 0.45));
  for (const hOff of [10.4, 17.4]) {
    const northCornice = new THREE.Mesh(naveCorniceGeo, carvedTuffeauMat);
    northCornice.position.set(naveCenterX, baseY + hOff, -naveWidth / 2 - 0.08);
    group.add(northCornice);

    const southCornice = new THREE.Mesh(naveCorniceGeo, carvedTuffeauMat);
    southCornice.position.set(naveCenterX, baseY + hOff, naveWidth / 2 + 0.08);
    cutawayGroup.add(southCornice);
  }

  const northHighBal = createOpenworkBalustrade(naveLength - 1, 26);
  northHighBal.position.set(naveCenterX, baseY + naveWallH, -naveWidth / 2 - 0.05);
  group.add(northHighBal);

  const southHighBal = createOpenworkBalustrade(naveLength - 1, 26);
  southHighBal.position.set(naveCenterX, baseY + naveWallH, naveWidth / 2 + 0.05);
  cutawayGroup.add(southHighBal);

  // Side Aisles
  const aisleWidth = 4.6;
  const aisleHeight = 9.4;
  for (const sign of [-1, 1]) {
    const targetParent = sign > 0 ? cutawayGroup : group;

    const aisleGeo = trackGeo(new THREE.BoxGeometry(naveLength - 1, aisleHeight, aisleWidth));
    const aisleMesh = new THREE.Mesh(aisleGeo, tuffeauMat);
    aisleMesh.position.set(naveCenterX, baseY + aisleHeight / 2, sign * 6.6);
    aisleMesh.castShadow = shadowCast;
    aisleMesh.receiveShadow = true;
    targetParent.add(aisleMesh);

    const aisleBal = createOpenworkBalustrade(naveLength - 1.5, 24);
    aisleBal.position.set(naveCenterX, baseY + aisleHeight, sign * 8.85);
    targetParent.add(aisleBal);

    const aisleRoofShape = new THREE.Shape();
    aisleRoofShape.moveTo(0, 0);
    aisleRoofShape.lineTo(aisleWidth + 0.4, 0);
    aisleRoofShape.lineTo(0, 2.2);
    aisleRoofShape.closePath();

    const aisleRoofGeo = trackGeo(
      new THREE.ExtrudeGeometry(aisleRoofShape, {
        depth: naveLength - 1.2,
        bevelEnabled: false,
      })
    );
    aisleRoofGeo.rotateY(Math.PI / 2);
    if (sign < 0) {
      aisleRoofGeo.scale(1, 1, -1);
    }
    const aisleRoof = new THREE.Mesh(aisleRoofGeo, slateRoofMat);
    aisleRoof.position.set(
      naveCenterX - (naveLength - 1.2) / 2,
      baseY + aisleHeight,
      sign * 4.4
    );
    aisleRoof.castShadow = shadowCast;
    aisleRoof.receiveShadow = true;
    targetParent.add(aisleRoof);
  }

  // Steep Loire Slate Roof on High Nave
  const roofPitchH = 6.3;
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-naveWidth / 2 - 0.35, 0);
  roofShape.lineTo(naveWidth / 2 + 0.35, 0);
  roofShape.lineTo(0, roofPitchH);
  roofShape.closePath();

  const mainRoofGeo = trackGeo(
    new THREE.ExtrudeGeometry(roofShape, {
      depth: naveLength + 0.5,
      bevelEnabled: true,
      bevelSize: 0.08,
      bevelThickness: 0.08,
      bevelSegments: 2,
    })
  );
  mainRoofGeo.rotateY(Math.PI / 2);
  const mainRoofMesh = new THREE.Mesh(mainRoofGeo, slateRoofMat);
  mainRoofMesh.position.set(
    naveCenterX - (naveLength + 0.5) / 2,
    baseY + naveWallH,
    0
  );
  mainRoofMesh.castShadow = shadowCast;
  mainRoofMesh.receiveShadow = true;
  cutawayGroup.add(mainRoofMesh);

  // Ornate Oxidized-Copper Ridge Cresting
  const crestBarGeo = trackGeo(new THREE.BoxGeometry(naveLength + 0.4, 0.34, 0.14));
  const crestBar = new THREE.Mesh(crestBarGeo, verdigrisCopperMat);
  crestBar.position.set(naveCenterX, baseY + naveWallH + roofPitchH + 0.16, 0);
  cutawayGroup.add(crestBar);

  const spikeGeo = trackGeo(new THREE.ConeGeometry(0.15, 0.78, 4));
  for (let sx = -15; sx <= 14; sx += 0.9) {
    const spike = new THREE.Mesh(spikeGeo, verdigrisCopperMat);
    spike.position.set(sx, baseY + naveWallH + roofPitchH + 0.54, 0);
    cutawayGroup.add(spike);
  }

  // Gothic Slate Roof Dormers (Lucarnes)
  const dormerBodyGeo = trackGeo(new THREE.BoxGeometry(0.95, 1.38, 1.1));
  const dormerRoofGeo = trackGeo(new THREE.ConeGeometry(0.8, 1.15, 4));
  dormerRoofGeo.rotateY(Math.PI / 4);
  for (let b = 0; b < 6; b++) {
    if (b === 4) continue;
    const dx = -12.5 + b * 4.1;
    for (const sign of [-1, 1]) {
      const dGroup = new THREE.Group();
      dGroup.position.set(dx, baseY + naveWallH + 2.1, sign * 2.85);
      dGroup.add(new THREE.Mesh(dormerBodyGeo, carvedTuffeauMat));
      const dRoof = new THREE.Mesh(dormerRoofGeo, slateRoofMat);
      dRoof.position.y = 1.15;
      dGroup.add(dRoof);
      cutawayGroup.add(dGroup);
    }
  }

  // ============================================================================
  // 4. INTERIOR RIBBED VAULTS (37.5m), GREAT ORGAN, ALTAR & RENAISSANCE TOMBS
  // ============================================================================
  const interiorFloorGeo = trackGeo(new THREE.PlaneGeometry(36, 16));
  const interiorFloorMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd8d0c1,
      map: textures.tuffeauMap,
      roughness: 0.42,
      metalness: 0.08,
    })
  );
  const interiorFloor = new THREE.Mesh(interiorFloorGeo, interiorFloorMat);
  interiorFloor.rotation.x = -Math.PI / 2;
  interiorFloor.position.set(2, baseY + 0.04, 0);
  interiorFloor.receiveShadow = true;
  interiorGroup.add(interiorFloor);

  const pierClusterCoreGeo = trackGeo(new THREE.CylinderGeometry(0.48, 0.52, 15.8, 12));
  const attachedShaftGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.15, 16.2, 8));
  const pierBasePlinthGeo = trackGeo(new THREE.CylinderGeometry(0.78, 0.88, 1.1, 8));
  const transverseArchGeo = trackGeo(
    new THREE.TorusGeometry(naveWidth / 2 - 0.65, 0.18, 8, 24, Math.PI)
  );
  const diagonalRibGeo = trackGeo(
    new THREE.TorusGeometry(5.6, 0.14, 8, 24, Math.PI * 0.85)
  );
  const keystoneGeo = trackGeo(new THREE.CylinderGeometry(0.38, 0.38, 0.26, 8));

  const interiorLights: THREE.PointLight[] = [];

  for (let b = 0; b <= 7; b++) {
    const bx = -13.5 + b * 4.1;

    for (const sign of [-1, 1]) {
      const pz = sign * (naveWidth / 2 - 0.65);
      const pGroup = new THREE.Group();
      pGroup.position.set(bx, baseY, pz);

      const basePlinth = new THREE.Mesh(pierBasePlinthGeo, weatheredStoneMat);
      basePlinth.position.y = 0.55;
      pGroup.add(basePlinth);

      const core = new THREE.Mesh(pierClusterCoreGeo, carvedTuffeauMat);
      core.position.y = 7.9;
      pGroup.add(core);

      for (let a = 0; a < 4; a++) {
        const ang = (a / 4) * Math.PI * 2;
        const shaft = new THREE.Mesh(attachedShaftGeo, carvedTuffeauMat);
        shaft.position.set(Math.cos(ang) * 0.44, 8.1, Math.sin(ang) * 0.44);
        pGroup.add(shaft);
      }

      interiorGroup.add(pGroup);
    }

    const doubleau = new THREE.Mesh(transverseArchGeo, carvedTuffeauMat);
    doubleau.rotation.y = Math.PI / 2;
    doubleau.position.set(bx, baseY + 13.2, 0);
    interiorGroup.add(doubleau);

    if (b < 7) {
      const midX = bx + 2.05;
      for (const diagAngle of [0.68, -0.68]) {
        const ogive = new THREE.Mesh(diagonalRibGeo, carvedTuffeauMat);
        ogive.rotation.y = Math.PI / 2 + diagAngle;
        ogive.position.set(midX, baseY + 12.6, 0);
        interiorGroup.add(ogive);
      }

      const boss = new THREE.Mesh(keystoneGeo, clockGoldMaterial);
      boss.position.set(midX, baseY + 16.9, 0);
      interiorGroup.add(boss);

      const triforiumBal = createOpenworkBalustrade(3.8, 5);
      triforiumBal.position.set(midX, baseY + 8.6, -naveWidth / 2 + 0.55);
      interiorGroup.add(triforiumBal);
    }
  }

  // High Vault Webbing Ceiling (Voûtains)
  const vaultCeilingGeo = trackGeo(
    new THREE.CylinderGeometry(
      naveWidth / 2 - 0.5,
      naveWidth / 2 - 0.5,
      naveLength,
      16,
      1,
      true,
      0,
      Math.PI
    )
  );
  vaultCeilingGeo.rotateZ(Math.PI / 2);
  const vaultCeilingMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf7f2e7,
      side: THREE.DoubleSide,
      roughness: 0.68,
    })
  );
  const vaultCeiling = new THREE.Mesh(vaultCeilingGeo, vaultCeilingMat);
  vaultCeiling.position.set(naveCenterX, baseY + 13.0, 0);
  interiorGroup.add(vaultCeiling);

  // Great Organ on the West Tribune (Grand Orgue de 1619 / Girardet)
  const organGroup = new THREE.Group();
  organGroup.position.set(-14.6, baseY + 5.8, 0);
  const organTribune = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.2, 0.65, 7.2)),
    carvedTuffeauMat
  );
  organGroup.add(organTribune);

  const organCase = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.4, 5.2, 5.6)),
    darkOakMat
  );
  organCase.position.y = 2.9;
  organGroup.add(organCase);

  const pipeGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 3.8, 8));
  for (let p = -10; p <= 10; p++) {
    const pipe = new THREE.Mesh(pipeGeo, organPipeMetalMat);
    const hScale = 0.55 + Math.abs(Math.cos(p * 0.45)) * 0.55;
    pipe.scale.set(1, hScale, 1);
    pipe.position.set(0.75, 2.8, p * 0.24);
    organGroup.add(pipe);
  }
  interiorGroup.add(organGroup);

  // High Altar & Gilded Choir Baldachin at East Sanctuary
  const altarGroup = new THREE.Group();
  altarGroup.position.set(12.2, baseY, 0);
  const altarSteps = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(3.4, 3.9, 0.55, 8)),
    carvedTuffeauMat
  );
  altarSteps.position.y = 0.28;
  altarGroup.add(altarSteps);

  const mensa = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.6, 1.1, 3.2)),
    clockGoldMaterial
  );
  mensa.position.y = 1.05;
  altarGroup.add(mensa);
  interiorGroup.add(altarGroup);

  // Renaissance Tomb of Francis II, Duke of Brittany & Margaret of Foix (South Transept)
  const tombGroup = new THREE.Group();
  tombGroup.position.set(3.2, baseY, 4.2);
  const tombPlinth = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.9, 0.35, 2.3)),
    weatheredStoneMat
  );
  tombPlinth.position.y = 0.175;
  tombGroup.add(tombPlinth);

  const tombSarcophagus = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.3, 1.18, 1.7)),
    carvedTuffeauMat
  );
  tombSarcophagus.position.y = 0.94;
  tombGroup.add(tombSarcophagus);

  const tombBlackSlab = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.45, 0.15, 1.85)),
    blackMarbleMat
  );
  tombBlackSlab.position.y = 1.58;
  tombGroup.add(tombBlackSlab);

  for (const oz of [-0.36, 0.36]) {
    const gisant = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(2.25, 0.28, 0.42)),
      carvedTuffeauMat
    );
    gisant.position.set(0, 1.78, oz);
    tombGroup.add(gisant);
  }
  for (const cx of [-1.68, 1.68]) {
    for (const cz of [-0.92, 0.92]) {
      const virtue = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.16, 0.2, 1.48, 8)),
        carvedTuffeauMat
      );
      virtue.position.set(cx, 1.06, cz);
      tombGroup.add(virtue);
    }
  }
  interiorGroup.add(tombGroup);

  // Cenotaph of General de Lamoricière (North Transept)
  const cenotaphGroup = new THREE.Group();
  cenotaphGroup.position.set(3.2, baseY, -4.2);
  const cenoBase = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.4, 1.2, 2.0)),
    blackMarbleMat
  );
  cenoBase.position.y = 0.6;
  cenotaphGroup.add(cenoBase);
  const cenoCanopy = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(3.2, 0.35, 1.85)),
    carvedTuffeauMat
  );
  cenoCanopy.position.y = 2.85;
  cenotaphGroup.add(cenoCanopy);
  for (const cx of [-1.4, 1.4]) {
    for (const cz of [-0.75, 0.75]) {
      const cCol = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.12, 0.14, 1.6, 8)),
        wroughtIronMat
      );
      cCol.position.set(cx, 1.95, cz);
      cenotaphGroup.add(cCol);
    }
  }
  interiorGroup.add(cenotaphGroup);

  for (const lx of [-8, 1, 10]) {
    const iLight = new THREE.PointLight(0xffbe6b, 6, 22, 1.5);
    iLight.position.set(lx, baseY + 11.5, 0);
    interiorGroup.add(iLight);
    interiorLights.push(iLight);
  }

  // ============================================================================
  // 5. 7 BAYS OF DOUBLE-TIER FLYING BUTTRESSES, GABLED CHAPELS, PINNACLES & GARGOYLES
  // ============================================================================
  const bayCount = 7;
  const startBayX = -13.5;
  const baySpacing = 4.1;

  const pierLowGeo = trackGeo(new THREE.BoxGeometry(1.36, 6.2, 2.1));
  const pierMidGeo = trackGeo(new THREE.BoxGeometry(1.2, 5.2, 1.78));
  const pierTopGeo = trackGeo(new THREE.BoxGeometry(1.06, 4.4, 1.48));
  const glacisCapGeo = trackGeo(new THREE.BoxGeometry(1.3, 0.35, 1.92));
  const gargoyleBodyGeo = trackGeo(new THREE.BoxGeometry(0.26, 0.28, 1.45));
  const gargoyleHeadGeo = trackGeo(new THREE.ConeGeometry(0.24, 0.48, 5));
  gargoyleHeadGeo.rotateX(Math.PI / 2);

  const flyerLowerGeo = trackGeo(createFlyingButtressFlyerGeometry(4.4, 2.8, 0.55, 0.72));
  const flyerUpperGeo = trackGeo(createFlyingButtressFlyerGeometry(4.4, 3.1, 0.52, 0.68));
  const flyerSpandrelColGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 1.65, 6));

  // Projecting Lateral Chapel Gable & Roof Geometries
  const latChapelGableShape = new THREE.Shape();
  latChapelGableShape.moveTo(-1.85, 0);
  latChapelGableShape.lineTo(1.85, 0);
  latChapelGableShape.lineTo(0, 2.35);
  latChapelGableShape.closePath();
  const latChapelGableGeo = trackGeo(
    new THREE.ExtrudeGeometry(latChapelGableShape, {
      depth: 0.26,
      bevelEnabled: true,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    })
  );

  for (let b = 0; b < bayCount; b++) {
    const bx = startBayX + b * baySpacing;
    const isTranseptBay = b === 4;

    for (const sign of [-1, 1]) {
      const bayParent = sign > 0 ? cutawayGroup : group;

      if (!isTranseptBay) {
        // High Clerestory Window
        const highWin = createDetailedLancetWindow(1, 1);
        highWin.position.set(bx, baseY + 11.2, sign * (naveWidth / 2 + 0.04));
        if (sign < 0) highWin.rotation.y = Math.PI;
        bayParent.add(highWin);

        // Lower Aisle Traceried Window + Projecting Lateral Chapel Gable
        const lowWin = createDetailedLancetWindow(0.92, 0.84);
        lowWin.position.set(bx, baseY + 2.9, sign * 8.92);
        if (sign < 0) lowWin.rotation.y = Math.PI;
        bayParent.add(lowWin);

        const cGable = new THREE.Mesh(latChapelGableGeo, carvedTuffeauMat);
        cGable.position.set(bx, baseY + aisleHeight - 0.2, sign * 8.85);
        bayParent.add(cGable);

        const cFinial = new THREE.Mesh(fleuronGeo, carvedTuffeauMat);
        cFinial.position.set(bx, baseY + aisleHeight + 2.25, sign * 8.95);
        bayParent.add(cFinial);
      }

      if (!isTranseptBay) {
        // Multi-stage Stepped Buttress Pier
        const pierGroup = new THREE.Group();
        pierGroup.position.set(bx, baseY, sign * 9.5);

        const pLow = new THREE.Mesh(pierLowGeo, tuffeauMat);
        pLow.position.y = 3.1;
        pLow.castShadow = shadowCast;
        pLow.receiveShadow = true;
        pierGroup.add(pLow);

        const glacis1 = new THREE.Mesh(glacisCapGeo, weatheredStoneMat);
        glacis1.position.set(0, 6.25, sign * 0.08);
        glacis1.rotation.x = sign * 0.22;
        pierGroup.add(glacis1);

        const pMid = new THREE.Mesh(pierMidGeo, tuffeauMat);
        pMid.position.y = 8.8;
        pMid.castShadow = shadowCast;
        pMid.receiveShadow = true;
        pierGroup.add(pMid);

        const glacis2 = new THREE.Mesh(glacisCapGeo, weatheredStoneMat);
        glacis2.scale.set(0.9, 1, 0.85);
        glacis2.position.set(0, 11.45, sign * 0.06);
        glacis2.rotation.x = sign * 0.22;
        pierGroup.add(glacis2);

        const pTop = new THREE.Mesh(pierTopGeo, tuffeauMat);
        pTop.position.y = 13.6;
        pTop.castShadow = shadowCast;
        pTop.receiveShadow = true;
        pierGroup.add(pTop);

        const pinnacle = createDetailedPinnacle(1.02);
        pinnacle.position.y = 15.8;
        pierGroup.add(pinnacle);

        const gargoyle = new THREE.Mesh(gargoyleBodyGeo, weatheredStoneMat);
        gargoyle.position.set(0, 14.8, sign * 1.18);
        gargoyle.rotation.x = sign * 0.12;
        pierGroup.add(gargoyle);

        const gHead = new THREE.Mesh(gargoyleHeadGeo, weatheredStoneMat);
        gHead.position.set(0, 14.72, sign * 1.9);
        if (sign < 0) gHead.rotation.y = Math.PI;
        pierGroup.add(gHead);

        group.add(pierGroup);

        const lowerFlyer = new THREE.Mesh(flyerLowerGeo, carvedTuffeauMat);
        const upperFlyer = new THREE.Mesh(flyerUpperGeo, carvedTuffeauMat);

        if (sign > 0) {
          lowerFlyer.scale.set(1, 1, -1);
          lowerFlyer.position.set(bx, baseY + 10.6, 8.95);
          upperFlyer.scale.set(1, 1, -1);
          upperFlyer.position.set(bx, baseY + 13.3, 8.95);
        } else {
          lowerFlyer.position.set(bx, baseY + 10.6, -8.95);
          upperFlyer.position.set(bx, baseY + 13.3, -8.95);
        }
        lowerFlyer.castShadow = shadowCast;
        upperFlyer.castShadow = shadowCast;
        group.add(lowerFlyer);
        group.add(upperFlyer);

        for (const tFrac of [0.28, 0.52, 0.76]) {
          const strutZ = sign * (8.95 - tFrac * 4.4);
          const strutY = baseY + 11.35 + tFrac * 2.65;
          const strut = new THREE.Mesh(flyerSpandrelColGeo, carvedTuffeauMat);
          strut.position.set(bx, strutY, strutZ);
          group.add(strut);
        }
      }
    }
  }

  // ============================================================================
  // 6. NORTH & SOUTH TRANSEPTS (Bras du Transept, Rosaces & Portails Latéraux)
  // ============================================================================
  const transeptX = startBayX + 4 * baySpacing;
  const transeptSpanZ = 27.6;
  const transeptW = 7.8;
  const transeptH = 17.4;

  const transeptGeo = trackGeo(new THREE.BoxGeometry(transeptW, transeptH, transeptSpanZ));
  const transeptMesh = new THREE.Mesh(transeptGeo, tuffeauMat);
  transeptMesh.position.set(transeptX, baseY + transeptH / 2, 0);
  transeptMesh.castShadow = shadowCast;
  transeptMesh.receiveShadow = true;
  group.add(transeptMesh);

  const tRoofShape = new THREE.Shape();
  tRoofShape.moveTo(-transeptW / 2 - 0.35, 0);
  tRoofShape.lineTo(transeptW / 2 + 0.35, 0);
  tRoofShape.lineTo(0, 5.8);
  tRoofShape.closePath();

  const tRoofGeo = trackGeo(
    new THREE.ExtrudeGeometry(tRoofShape, {
      depth: transeptSpanZ + 0.5,
      bevelEnabled: true,
      bevelSize: 0.06,
      bevelThickness: 0.06,
      bevelSegments: 2,
    })
  );
  const tRoofMesh = new THREE.Mesh(tRoofGeo, slateRoofMat);
  tRoofMesh.position.set(transeptX, baseY + transeptH, -(transeptSpanZ + 0.5) / 2);
  tRoofMesh.castShadow = shadowCast;
  tRoofMesh.receiveShadow = true;
  group.add(tRoofMesh);

  // Octagonal Crossing Lantern & Spire
  const lanternBaseGeo = trackGeo(new THREE.CylinderGeometry(1.55, 1.75, 3.6, 8));
  const lanternBase = new THREE.Mesh(lanternBaseGeo, carvedTuffeauMat);
  lanternBase.position.set(transeptX, baseY + naveWallH + roofPitchH + 0.7, 0);
  group.add(lanternBase);

  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    const lCol = new THREE.Mesh(pinColGeo, carvedTuffeauMat);
    lCol.scale.set(1.2, 2.4, 1.2);
    lCol.position.set(
      transeptX + Math.cos(ang) * 1.55,
      baseY + naveWallH + roofPitchH + 0.7,
      Math.sin(ang) * 1.55
    );
    group.add(lCol);
  }

  const lanternSpireGeo = trackGeo(new THREE.ConeGeometry(1.6, 6.6, 8));
  const lanternSpire = new THREE.Mesh(lanternSpireGeo, verdigrisCopperMat);
  lanternSpire.position.set(transeptX, baseY + naveWallH + roofPitchH + 5.6, 0);
  lanternSpire.castShadow = shadowCast;
  group.add(lanternSpire);

  const crossVGeo = trackGeo(new THREE.BoxGeometry(0.12, 1.8, 0.12));
  const crossHGeo = trackGeo(new THREE.BoxGeometry(0.95, 0.12, 0.12));
  const spireCross = new THREE.Group();
  spireCross.position.set(transeptX, baseY + naveWallH + roofPitchH + 9.4, 0);
  spireCross.add(new THREE.Mesh(crossVGeo, clockGoldMaterial));
  const ch = new THREE.Mesh(crossHGeo, clockGoldMaterial);
  ch.position.y = 0.35;
  spireCross.add(ch);
  group.add(spireCross);

  // Detailed Rose Window Builder
  const roseGlassGeo = trackGeo(new THREE.CylinderGeometry(2.85, 2.85, 0.32, 24));
  roseGlassGeo.rotateX(Math.PI / 2);
  const roseOuterRingGeo = trackGeo(new THREE.TorusGeometry(2.9, 0.28, 10, 32));
  const roseInnerRingGeo = trackGeo(new THREE.TorusGeometry(1.48, 0.14, 8, 24));
  const roseSpokeGeo = trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 5.6, 6));

  const createDetailedRoseWindow = (scale = 1): THREE.Group => {
    const rGroup = new THREE.Group();
    rGroup.add(new THREE.Mesh(roseGlassGeo, stainedGlassMaterial));
    rGroup.add(new THREE.Mesh(roseOuterRingGeo, carvedTuffeauMat));
    rGroup.add(new THREE.Mesh(roseInnerRingGeo, carvedTuffeauMat));

    for (let s = 0; s < 6; s++) {
      const spoke = new THREE.Mesh(roseSpokeGeo, carvedTuffeauMat);
      spoke.rotation.z = (s / 6) * Math.PI;
      rGroup.add(spoke);
    }
    for (let c = 0; c < 12; c++) {
      const ang = (c / 12) * Math.PI * 2;
      const lobe = new THREE.Mesh(traceryOculusGeo, carvedTuffeauMat);
      lobe.position.set(Math.cos(ang) * 2.18, Math.sin(ang) * 2.18, 0.08);
      rGroup.add(lobe);
    }

    rGroup.scale.setScalar(scale);
    return rGroup;
  };

  for (const sign of [-1, 1]) {
    const endZ = sign * (transeptSpanZ / 2);

    const tRose = createDetailedRoseWindow(1.02);
    tRose.position.set(transeptX, baseY + 12.2, endZ + sign * 0.14);
    group.add(tRose);

    const tBal = createOpenworkBalustrade(transeptW - 0.6, 8);
    tBal.position.set(transeptX, baseY + transeptH, endZ + sign * 0.12);
    group.add(tBal);

    // Transept Gable Oculus
    const gOculus = new THREE.Mesh(traceryOculusGeo, carvedTuffeauMat);
    gOculus.scale.setScalar(2.2);
    gOculus.position.set(transeptX, baseY + transeptH + 2.6, endZ + sign * 0.16);
    group.add(gOculus);

    const tPortalFrameGeo = trackGeo(
      createGothicPortalFrameGeometry(4.8, 6.8, 3.3, 5.5, 1.3, 0.08)
    );
    const tPortalFrame = new THREE.Mesh(tPortalFrameGeo, carvedTuffeauMat);
    tPortalFrame.rotation.y = sign > 0 ? Math.PI / 2 : -Math.PI / 2;
    tPortalFrame.position.set(transeptX, baseY, endZ + sign * 0.65);
    group.add(tPortalFrame);

    const tPortalShape = createPointedArchShape(3.3, 5.4, 0.55);
    const tPortalGeo = trackGeo(
      new THREE.ExtrudeGeometry(tPortalShape, { depth: 0.4, bevelEnabled: false })
    );
    const tDoor = new THREE.Mesh(tPortalGeo, darkOakMat);
    tDoor.position.set(transeptX, baseY, endZ - (sign > 0 ? 0.1 : 0.3));
    group.add(tDoor);

    for (const dx of [-transeptW / 2 - 0.35, transeptW / 2 + 0.35]) {
      const tButtGeo = trackGeo(new THREE.CylinderGeometry(0.85, 0.95, transeptH + 2.4, 8));
      const tButt = new THREE.Mesh(tButtGeo, carvedTuffeauMat);
      tButt.position.set(transeptX + dx, baseY + (transeptH + 2.4) / 2, endZ);
      tButt.castShadow = shadowCast;
      group.add(tButt);

      const tPin = createDetailedPinnacle(0.98);
      tPin.position.set(transeptX + dx, baseY + transeptH + 2.4, endZ);
      group.add(tPin);
    }
  }

  // ============================================================================
  // 7. EAST END CHOIR, APSE, RADIAL FLYING BUTTRESSES & 5 RADIATING CHAPELS
  // ============================================================================
  const eastEndX = naveCenterX + naveLength / 2;

  const apseGeo = trackGeo(new THREE.CylinderGeometry(4.6, 4.6, naveWallH, 7, 1, false, 0, Math.PI));
  const apseMesh = new THREE.Mesh(apseGeo, tuffeauMat);
  apseMesh.position.set(eastEndX - 0.2, baseY + naveWallH / 2, 0);
  apseMesh.castShadow = shadowCast;
  apseMesh.receiveShadow = true;
  group.add(apseMesh);

  const apseRoofGeo = trackGeo(new THREE.ConeGeometry(4.98, roofPitchH, 7, 1, false, 0, Math.PI));
  const apseRoofMesh = new THREE.Mesh(apseRoofGeo, slateRoofMat);
  apseRoofMesh.position.set(eastEndX - 0.2, baseY + naveWallH + roofPitchH / 2, 0);
  apseRoofMesh.castShadow = shadowCast;
  group.add(apseRoofMesh);

  const ambGeo = trackGeo(new THREE.CylinderGeometry(8.2, 8.2, aisleHeight, 9, 1, false, 0, Math.PI));
  const ambMesh = new THREE.Mesh(ambGeo, tuffeauMat);
  ambMesh.position.set(eastEndX - 0.2, baseY + aisleHeight / 2, 0);
  ambMesh.castShadow = shadowCast;
  ambMesh.receiveShadow = true;
  group.add(ambMesh);

  const ambRoofGeo = trackGeo(new THREE.ConeGeometry(8.55, 3.2, 9, 1, false, 0, Math.PI));
  const ambRoof = new THREE.Mesh(ambRoofGeo, slateRoofMat);
  ambRoof.position.set(eastEndX - 0.2, baseY + aisleHeight + 1.6, 0);
  group.add(ambRoof);

  const chapelGeo = trackGeo(new THREE.CylinderGeometry(2.4, 2.5, 7.8, 7));
  const chapelRoofGeo = trackGeo(new THREE.ConeGeometry(2.75, 3.1, 7));

  for (let c = 0; c < 5; c++) {
    const angle = -Math.PI * 0.38 + (c / 4) * (Math.PI * 0.76);
    const radius = 8.4;
    const cx = eastEndX + Math.cos(angle) * radius;
    const cz = Math.sin(angle) * radius;

    const chapelGroup = new THREE.Group();
    chapelGroup.position.set(cx, baseY, cz);
    chapelGroup.rotation.y = -angle;

    const chapel = new THREE.Mesh(chapelGeo, tuffeauMat);
    chapel.position.y = 3.9;
    chapel.castShadow = shadowCast;
    chapel.receiveShadow = true;
    chapelGroup.add(chapel);

    const cRoof = new THREE.Mesh(chapelRoofGeo, slateRoofMat);
    cRoof.position.y = 7.8 + 1.55;
    cRoof.castShadow = shadowCast;
    chapelGroup.add(cRoof);

    const cFinial = new THREE.Mesh(spikeGeo, verdigrisCopperMat);
    cFinial.position.y = 7.8 + 3.2;
    chapelGroup.add(cFinial);

    for (const wAng of [-0.55, 0, 0.55]) {
      const cWin = createDetailedLancetWindow(0.55, 0.62);
      cWin.position.set(Math.cos(wAng) * 2.42, 2.6, Math.sin(wAng) * 2.42);
      cWin.rotation.y = Math.PI / 2 - wAng;
      chapelGroup.add(cWin);
    }

    const radPier = new THREE.Mesh(pierMidGeo, carvedTuffeauMat);
    radPier.scale.set(0.85, 2.2, 0.85);
    radPier.position.set(-0.6, 8.2, 0);
    chapelGroup.add(radPier);

    const radPin = createDetailedPinnacle(0.78);
    radPin.position.set(-0.6, 13.8, 0);
    chapelGroup.add(radPin);

    // Radial Flying Buttress Arch connecting Choir Pier to High Apse Wall
    const radFlyer = new THREE.Mesh(flyerUpperGeo, carvedTuffeauMat);
    radFlyer.rotation.y = -Math.PI / 2;
    radFlyer.position.set(-3.8, 11.4, 0);
    chapelGroup.add(radFlyer);

    const radFlyerLow = new THREE.Mesh(flyerLowerGeo, carvedTuffeauMat);
    radFlyerLow.rotation.y = -Math.PI / 2;
    radFlyerLow.position.set(-3.8, 8.9, 0);
    chapelGroup.add(radFlyerLow);

    group.add(chapelGroup);
  }

  // ============================================================================
  // 8. MONUMENTAL WEST FACADE, TWIN 38m TOWERS, CLOCK PAVILION & SWINGING BELLS
  // ============================================================================
  const westX = -17.5;
  const towerZOffset = 7.6;
  const towerWidth = 6.6;
  const towerDepth = 6.6;
  const towerHeight = 25.4;

  // Central West Facade Wall between the twin towers
  const centralFacadeGeo = trackGeo(new THREE.BoxGeometry(5.2, 20.6, 8.8));
  const centralFacade = new THREE.Mesh(centralFacadeGeo, tuffeauMat);
  centralFacade.position.set(westX + 0.2, baseY + 10.3, 0);
  centralFacade.castShadow = shadowCast;
  centralFacade.receiveShadow = true;
  group.add(centralFacade);

  // Visible High Nave West Gable rising behind the upper balustrade between the towers
  const westNaveGableShape = new THREE.Shape();
  westNaveGableShape.moveTo(-4.4, 0);
  westNaveGableShape.lineTo(4.4, 0);
  westNaveGableShape.lineTo(0, 6.2);
  westNaveGableShape.closePath();
  const westNaveGableGeo = trackGeo(
    new THREE.ExtrudeGeometry(westNaveGableShape, {
      depth: 0.65,
      bevelEnabled: true,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    })
  );
  westNaveGableGeo.rotateY(Math.PI / 2);
  const westNaveGable = new THREE.Mesh(westNaveGableGeo, carvedTuffeauMat);
  westNaveGable.position.set(westX + 1.4, baseY + naveWallH + 0.2, 0);
  westNaveGable.castShadow = shadowCast;
  group.add(westNaveGable);

  // Statue of Saint Peter at the apex of the West Nave Gable
  const apexFinial = createDetailedPinnacle(0.75);
  apexFinial.position.set(westX + 1.7, baseY + naveWallH + 6.3, 0);
  group.add(apexFinial);

  // Lower & Upper Flamboyant Openwork Galleries across the West Central Bay
  const lowerWestGal = createOpenworkBalustrade(8.6, 10);
  lowerWestGal.rotation.y = Math.PI / 2;
  lowerWestGal.position.set(westX - 2.65, baseY + 9.3, 0);
  group.add(lowerWestGal);

  const upperWestGal = createOpenworkBalustrade(8.8, 10);
  upperWestGal.rotation.y = Math.PI / 2;
  upperWestGal.position.set(westX - 2.45, baseY + 20.4, 0);
  group.add(upperWestGal);

  // Grand Flamboyant West Organ Window (Grande verrière occidentale sous arc brisé)
  const westWinW = 5.2;
  const westWinH = 8.8;
  const westWinShape = createPointedArchShape(westWinW, westWinH, 0.56);
  const westWinGlassGeo = trackGeo(
    new THREE.ExtrudeGeometry(westWinShape, { depth: 0.22, bevelEnabled: false })
  );
  westWinGlassGeo.rotateY(Math.PI / 2);
  const westWinGlass = new THREE.Mesh(westWinGlassGeo, stainedGlassMaterial);
  westWinGlass.position.set(westX - 2.48, baseY + 10.2, 0);
  group.add(westWinGlass);

  const westArchFrameGeo = trackGeo(
    createGothicPortalFrameGeometry(6.8, 9.8, westWinW, westWinH, 0.95, 0.1)
  );
  const westArchFrame = new THREE.Mesh(westArchFrameGeo, carvedTuffeauMat);
  westArchFrame.position.set(westX - 3.1, baseY + 10.0, 0);
  westArchFrame.castShadow = shadowCast;
  group.add(westArchFrame);

  // Flamboyant Rose & Mullion Tracery inside the Grand West Window
  const westRose = createDetailedRoseWindow(0.88);
  westRose.rotation.y = Math.PI / 2;
  westRose.position.set(westX - 2.55, baseY + 15.6, 0);
  group.add(westRose);

  const organMullionGeo = trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 5.6, 8));
  for (const mz of [-1.8, -0.9, 0, 0.9, 1.8]) {
    const om = new THREE.Mesh(organMullionGeo, carvedTuffeauMat);
    om.position.set(westX - 2.55, baseY + 13.0, mz);
    group.add(om);
  }

  const louverShape = createPointedArchShape(1.3, 5.0, 0.65);
  const louverGeo = trackGeo(
    new THREE.ExtrudeGeometry(louverShape, {
      depth: 0.38,
      bevelEnabled: true,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    })
  );
  const louverHoodGeo = trackGeo(createGothicArchRingGeometry(1.62, 5.3, 1.24, 4.95, 0.26));
  const abatsonSlatGeo = trackGeo(new THREE.BoxGeometry(1.18, 0.08, 0.34));
  const blindLancetGeo = trackGeo(createGothicArchRingGeometry(1.15, 3.8, 0.82, 3.5, 0.18));
  const bellGeo = trackGeo(new THREE.ConeGeometry(0.52, 0.85, 12, 1, true));
  const swingingBells: THREE.Group[] = [];

  for (const sign of [-1, 1]) {
    const tz = sign * towerZOffset;

    const shaftGeo = trackGeo(new THREE.BoxGeometry(towerDepth, towerHeight, towerWidth));
    const shaft = new THREE.Mesh(shaftGeo, tuffeauMat);
    shaft.position.set(westX, baseY + towerHeight / 2, tz);
    shaft.castShadow = shadowCast;
    shaft.receiveShadow = true;
    group.add(shaft);

    // Vertical Flamboyant Pilaster Ribs dividing each tower face
    const pilasterRibGeo = trackGeo(new THREE.BoxGeometry(0.28, towerHeight - 1, 0.28));
    for (const roff of [-1.85, 0, 1.85]) {
      const pRibW = new THREE.Mesh(pilasterRibGeo, carvedTuffeauMat);
      pRibW.position.set(westX - towerDepth / 2 - 0.06, baseY + towerHeight / 2, tz + roff);
      group.add(pRibW);
    }

    for (const bx of [-towerDepth / 2 + 0.2, towerDepth / 2 - 0.2]) {
      for (const bz of [-towerWidth / 2 + 0.2, towerWidth / 2 - 0.2]) {
        const cornerButtGeo = trackGeo(new THREE.BoxGeometry(1.34, towerHeight + 0.6, 1.34));
        const cornerButt = new THREE.Mesh(cornerButtGeo, carvedTuffeauMat);
        cornerButt.position.set(westX + bx, baseY + (towerHeight + 0.6) / 2, tz + bz);
        cornerButt.castShadow = shadowCast;
        cornerButt.receiveShadow = true;
        group.add(cornerButt);

        for (const gh of [6.8, 13.2, 18.5]) {
          const gCap = new THREE.Mesh(
            trackGeo(new THREE.BoxGeometry(1.54, 0.32, 1.54)),
            weatheredStoneMat
          );
          gCap.position.set(westX + bx, baseY + gh, tz + bz);
          group.add(gCap);
        }

        const towerPin = createDetailedPinnacle(1.06);
        towerPin.position.set(westX + bx, baseY + towerHeight + 0.6, tz + bz);
        group.add(towerPin);
      }
    }

    // Octagonal Spiral Staircase Turret
    const stairTurretGeo = trackGeo(
      new THREE.CylinderGeometry(0.95, 1.05, towerHeight + 2.8, 8)
    );
    const stairTurret = new THREE.Mesh(stairTurretGeo, carvedTuffeauMat);
    stairTurret.position.set(
      westX + 1.8,
      baseY + (towerHeight + 2.8) / 2,
      tz + sign * (towerWidth / 2 + 0.35)
    );
    stairTurret.castShadow = shadowCast;
    group.add(stairTurret);

    const stairCrown = createDetailedPinnacle(0.94);
    stairCrown.position.set(
      westX + 1.8,
      baseY + towerHeight + 2.8,
      tz + sign * (towerWidth / 2 + 0.35)
    );
    group.add(stairCrown);

    for (const stageH of [7.2, 13.5, 18.8, 25.4]) {
      const corniceGeo = trackGeo(
        new THREE.BoxGeometry(towerDepth + 1.08, 0.48, towerWidth + 1.08)
      );
      const cornice = new THREE.Mesh(corniceGeo, carvedTuffeauMat);
      cornice.position.set(westX, baseY + stageH, tz);
      cornice.castShadow = shadowCast;
      group.add(cornice);
    }

    for (const side of [-1, 1]) {
      const balNS = createOpenworkBalustrade(towerWidth + 0.4, 7);
      balNS.position.set(westX, baseY + towerHeight, tz + side * (towerWidth / 2 + 0.1));
      group.add(balNS);

      const balEW = createOpenworkBalustrade(towerDepth + 0.4, 7);
      balEW.rotation.y = Math.PI / 2;
      balEW.position.set(westX + side * (towerDepth / 2 + 0.1), baseY + towerHeight, tz);
      group.add(balEW);
    }

    // Belfry Louvers & Swinging Bronze Bells
    for (const lOff of [-1.2, 1.2]) {
      const louverW = new THREE.Mesh(louverGeo, darkOakMat);
      louverW.rotation.y = -Math.PI / 2;
      louverW.position.set(westX - towerDepth / 2 - 0.04, baseY + 19.2, tz + lOff);
      group.add(louverW);

      const hoodW = new THREE.Mesh(louverHoodGeo, carvedTuffeauMat);
      hoodW.rotation.y = -Math.PI / 2;
      hoodW.position.set(westX - towerDepth / 2 - 0.15, baseY + 19.2, tz + lOff);
      group.add(hoodW);

      for (let s = 0; s < 6; s++) {
        const slat = new THREE.Mesh(abatsonSlatGeo, slateRoofMat);
        slat.rotation.y = -Math.PI / 2;
        slat.rotation.z = 0.45;
        slat.position.set(westX - towerDepth / 2 - 0.22, baseY + 19.6 + s * 0.55, tz + lOff);
        group.add(slat);
      }

      // Visible Bronze Bell suspended in the belfry arch
      const bellPivot = new THREE.Group();
      bellPivot.position.set(westX - towerDepth / 2 - 0.32, baseY + 22.8, tz + lOff);
      const bellMesh = new THREE.Mesh(bellGeo, clockGoldMaterial);
      bellMesh.position.y = -0.45;
      bellPivot.add(bellMesh);
      group.add(bellPivot);
      swingingBells.push(bellPivot);

      const blindW = new THREE.Mesh(blindLancetGeo, carvedTuffeauMat);
      blindW.rotation.y = -Math.PI / 2;
      blindW.position.set(westX - towerDepth / 2 - 0.08, baseY + 8.2, tz + lOff);
      group.add(blindW);

      const louverFlank = new THREE.Mesh(louverGeo, darkOakMat);
      if (sign < 0) louverFlank.rotation.y = Math.PI;
      louverFlank.position.set(
        westX + lOff,
        baseY + 19.2,
        tz + sign * (towerWidth / 2 + 0.04)
      );
      group.add(louverFlank);

      const hoodFlank = new THREE.Mesh(louverHoodGeo, carvedTuffeauMat);
      if (sign < 0) hoodFlank.rotation.y = Math.PI;
      hoodFlank.position.set(
        westX + lOff,
        baseY + 19.2,
        tz + sign * (towerWidth / 2 + 0.15)
      );
      group.add(hoodFlank);
    }

    const midWin = createDetailedLancetWindow(0.95, 0.95);
    midWin.rotation.y = -Math.PI / 2;
    midWin.position.set(westX - towerDepth / 2 - 0.05, baseY + 13.6, tz);
    group.add(midWin);
  }

  // North Tower Clock Pavilion & Wrought-Iron Bell Cage (Campanile de l'Horloge)
  const clockPavilion = new THREE.Group();
  clockPavilion.position.set(westX, baseY + towerHeight, -towerZOffset);
  const pavBase = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.35, 1.5, 2.2, 8)),
    carvedTuffeauMat
  );
  pavBase.position.y = 1.1;
  clockPavilion.add(pavBase);

  const pavCage = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.95, 1.1, 2.1, 8, 1, true)),
    wroughtIronMat
  );
  pavCage.position.y = 3.2;
  clockPavilion.add(pavCage);

  const pavBell = new THREE.Mesh(bellGeo, clockGoldMaterial);
  pavBell.position.y = 3.3;
  clockPavilion.add(pavBell);

  const pavDome = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(1.15, 1.8, 8)),
    verdigrisCopperMat
  );
  pavDome.position.y = 5.1;
  clockPavilion.add(pavDome);
  group.add(clockPavilion);

  // Historic Clock Dial & Live Gilded Hands on the North Tower
  const clockDialGeo = trackGeo(new THREE.CylinderGeometry(1.28, 1.28, 0.2, 24));
  clockDialGeo.rotateZ(Math.PI / 2);
  const clockDialMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x131d33,
      roughness: 0.25,
      metalness: 0.58,
    })
  );
  const clockGroup = new THREE.Group();
  clockGroup.position.set(westX - towerDepth / 2 - 0.16, baseY + 16.6, -towerZOffset);
  clockGroup.add(new THREE.Mesh(clockDialGeo, clockDialMat));

  const clockRimGeo = trackGeo(new THREE.TorusGeometry(1.3, 0.11, 8, 24));
  clockRimGeo.rotateY(Math.PI / 2);
  clockGroup.add(new THREE.Mesh(clockRimGeo, clockGoldMaterial));

  // 12 Gilded Roman Hour Studs around the dial
  const hourStudGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.16, 0.08));
  for (let h = 0; h < 12; h++) {
    const ang = (h / 12) * Math.PI * 2;
    const stud = new THREE.Mesh(hourStudGeo, clockGoldMaterial);
    stud.position.set(-0.12, Math.cos(ang) * 1.06, Math.sin(ang) * 1.06);
    stud.rotation.x = -ang;
    clockGroup.add(stud);
  }

  const handHourGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.68, 0.09));
  const handMinGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.98, 0.06));

  const hourHandPivot = new THREE.Group();
  hourHandPivot.position.set(-0.14, 0, 0);
  const hourHand = new THREE.Mesh(handHourGeo, clockGoldMaterial);
  hourHand.position.set(0, 0.28, 0);
  hourHandPivot.add(hourHand);
  clockGroup.add(hourHandPivot);

  const minHandPivot = new THREE.Group();
  minHandPivot.position.set(-0.16, 0, 0);
  const minHand = new THREE.Mesh(handMinGeo, clockGoldMaterial);
  minHand.position.set(0, 0.42, 0);
  minHandPivot.add(minHand);
  clockGroup.add(minHandPivot);

  group.add(clockGroup);

  // ============================================================================
  // 9. TRIPLE RECESSED GOTHIC PORTALS (Voussures, Statues-Colonnes, Gâbles & Chaire)
  // ============================================================================
  const portals = [
    { z: 0, outerW: 6.8, outerH: 8.6, archW: 4.7, archH: 7.2, depth: 2.3, isCentral: true },
    { z: -towerZOffset, outerW: 5.3, outerH: 7.2, archW: 3.5, archH: 5.8, depth: 1.85, isCentral: false },
    { z: towerZOffset, outerW: 5.3, outerH: 7.2, archW: 3.5, archH: 5.8, depth: 1.85, isCentral: false },
  ];

  const jambColGeo = trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 3.8, 8));
  const statueBodyGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.17, 1.25, 8));
  const statueCanopyGeo = trackGeo(new THREE.ConeGeometry(0.26, 0.65, 6));
  const ironStrapGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.08, 1.35));

  for (const p of portals) {
    const portalX = westX - towerDepth / 2;

    for (let ring = 0; ring < 5; ring++) {
      const t = ring / 4;
      const rw = THREE.MathUtils.lerp(p.outerW, p.archW * 0.84, t);
      const rh = THREE.MathUtils.lerp(p.outerH, p.archH * 0.84, t);
      const iw = THREE.MathUtils.lerp(p.archW, p.archW * 0.72, t);
      const ih = THREE.MathUtils.lerp(p.archH, p.archH * 0.76, t);
      const rDepth = p.depth * (1 - t * 0.76);

      const stepGeo = trackGeo(
        createGothicPortalFrameGeometry(rw, rh, iw, ih, rDepth, 0.05)
      );
      const stepMesh = new THREE.Mesh(
        stepGeo,
        ring % 2 === 0 ? carvedTuffeauMat : tuffeauMat
      );
      stepMesh.position.set(portalX - rDepth + 0.25, baseY, p.z);
      stepMesh.castShadow = shadowCast;
      stepMesh.receiveShadow = true;
      group.add(stepMesh);
    }

    for (const side of [-1, 1]) {
      for (let j = 0; j < 3; j++) {
        const jx = portalX - 0.35 - j * 0.45;
        const jz = p.z + side * (p.archW * 0.36 + j * 0.25);
        const jCol = new THREE.Mesh(jambColGeo, carvedTuffeauMat);
        jCol.position.set(jx, baseY + 1.9, jz);
        group.add(jCol);

        const statue = new THREE.Mesh(statueBodyGeo, weatheredStoneMat);
        statue.position.set(jx - 0.12, baseY + 2.4, jz);
        group.add(statue);

        const canopy = new THREE.Mesh(statueCanopyGeo, carvedTuffeauMat);
        canopy.position.set(jx - 0.12, baseY + 3.45, jz);
        group.add(canopy);
      }
    }

    const doorShape = createPointedArchShape(p.archW * 0.78, p.archH * 0.82, 0.56);
    const doorGeo = trackGeo(
      new THREE.ExtrudeGeometry(doorShape, { depth: 0.25, bevelEnabled: false })
    );
    doorGeo.rotateY(Math.PI / 2);
    const doorMesh = new THREE.Mesh(doorGeo, darkOakMat);
    doorMesh.position.set(portalX + 0.05, baseY, p.z);
    group.add(doorMesh);

    // Carved Tympanum Relief above the lintel
    const tympW = p.archW * 0.74;
    const tympH = p.archH * 0.34;
    const tympShape = createPointedArchShape(tympW, tympH, 0.25);
    const tympGeo = trackGeo(
      new THREE.ExtrudeGeometry(tympShape, { depth: 0.28, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04 })
    );
    tympGeo.rotateY(Math.PI / 2);
    const tympMesh = new THREE.Mesh(tympGeo, carvedTuffeauMat);
    tympMesh.position.set(portalX - 0.06, baseY + p.archH * 0.49, p.z);
    group.add(tympMesh);

    for (const sy of [1.1, 2.1, 3.1]) {
      const strap = new THREE.Mesh(ironStrapGeo, wroughtIronMat);
      strap.position.set(portalX - 0.02, baseY + sy, p.z);
      group.add(strap);
    }

    const lintelGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.38, p.archW * 0.76));
    const lintel = new THREE.Mesh(lintelGeo, carvedTuffeauMat);
    lintel.position.set(portalX - 0.12, baseY + p.archH * 0.48, p.z);
    group.add(lintel);

    const trumeauGeo = trackGeo(new THREE.BoxGeometry(0.36, p.archH * 0.48, 0.36));
    const trumeau = new THREE.Mesh(trumeauGeo, carvedTuffeauMat);
    trumeau.position.set(portalX - 0.18, baseY + (p.archH * 0.48) / 2, p.z);
    group.add(trumeau);

    const trumeauStatue = new THREE.Mesh(statueBodyGeo, carvedTuffeauMat);
    trumeauStatue.position.set(portalX - 0.4, baseY + 2.2, p.z);
    group.add(trumeauStatue);

    // Openwork Crocketed Gable (Gâble ajouré à crochets)
    const gw = p.isCentral ? 3.2 : 2.35;
    const gh = p.isCentral ? 3.4 : 2.55;
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-gw, 0);
    gableShape.lineTo(gw, 0);
    gableShape.lineTo(0, gh);
    gableShape.closePath();

    const gableHole = new THREE.Path();
    gableHole.absarc(0, gh * 0.38, gw * 0.32, 0, Math.PI * 2, false);
    gableShape.holes.push(gableHole);

    const gableGeo = trackGeo(
      new THREE.ExtrudeGeometry(gableShape, {
        depth: 0.24,
        bevelEnabled: true,
        bevelSize: 0.05,
        bevelThickness: 0.05,
      })
    );
    gableGeo.rotateY(Math.PI / 2);
    const gableMesh = new THREE.Mesh(gableGeo, carvedTuffeauMat);
    gableMesh.position.set(portalX - p.depth + 0.32, baseY + p.outerH - 0.9, p.z);
    group.add(gableMesh);

    const gFinial = new THREE.Mesh(fleuronGeo, carvedTuffeauMat);
    gFinial.scale.setScalar(1.25);
    gFinial.position.set(portalX - p.depth + 0.42, baseY + p.outerH + gh - 0.8, p.z);
    group.add(gFinial);
  }

  // Historic Exterior Preaching Pulpit (Chaire extérieure du XVe siècle)
  const pulpitGroup = new THREE.Group();
  pulpitGroup.position.set(westX - towerDepth / 2 - 1.75, baseY + 2.8, -4.1);
  const pulpitCorbel = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.68, 1.1, 6)),
    weatheredStoneMat
  );
  pulpitCorbel.rotation.x = Math.PI;
  pulpitGroup.add(pulpitCorbel);

  const pulpitBasket = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.72, 0.65, 1.05, 6)),
    carvedTuffeauMat
  );
  pulpitBasket.position.y = 0.95;
  pulpitGroup.add(pulpitBasket);

  const pulpitCanopy = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.82, 1.4, 6)),
    carvedTuffeauMat
  );
  pulpitCanopy.position.y = 3.1;
  pulpitGroup.add(pulpitCanopy);
  group.add(pulpitGroup);

  // ============================================================================
  // 10. VOLUMETRIC AUTUMN SUNBEAMS (Rayons Crépusculaires Dorés)
  // ============================================================================
  const beamGeo = trackGeo(new THREE.ConeGeometry(5.5, 36, 16, 1, true));
  const sunbeamConfigs = [
    { x: -24, y: 18, z: 4, rx: -0.35, rz: -0.42, scale: 1.1 },
    { x: -16, y: 20, z: 12, rx: -0.32, rz: -0.38, scale: 0.95 },
    { x: -2, y: 19, z: 10, rx: -0.35, rz: -0.4, scale: 0.9 },
  ];
  for (const sb of sunbeamConfigs) {
    const beam = new THREE.Mesh(beamGeo, sunbeamMaterial);
    beam.position.set(sb.x, sb.y, sb.z);
    beam.rotation.set(sb.rx, 0, sb.rz);
    beam.scale.setScalar(sb.scale);
    beam.renderOrder = 2;
    group.add(beam);
  }

  // ============================================================================
  // 11. ARCHITECTURAL UPLIGHTS
  // ============================================================================
  const uplights: THREE.PointLight[] = [];
  const uplightPositions: [number, number, number][] = [
    [westX - 5.2, baseY + 2.2, 0],
    [westX - 5.2, baseY + 2.2, -towerZOffset],
    [westX - 5.2, baseY + 2.2, towerZOffset],
    [westX - 3.5, baseY + 18.0, 0],
    [0, baseY + 3.5, 13.5],
    [0, baseY + 3.5, -13.5],
  ];

  for (const [ux, uy, uz] of uplightPositions) {
    const pLight = new THREE.PointLight(0xffb454, 0, 28, 1.6);
    pLight.position.set(ux, uy, uz);
    group.add(pLight);
    uplights.push(pLight);
  }

  const setCutawayMode = (enabled: boolean) => {
    cutawayGroup.visible = !enabled;
  };

  const updateBellSwing = (elapsed: number, decimalHours = 16.5) => {
    for (let i = 0; i < swingingBells.length; i++) {
      swingingBells[i].rotation.z = Math.sin(elapsed * 2.4 + i) * 0.22;
    }

    // Sync North Tower Clock Hands to exact time!
    // Facing West (-X), clockwise rotation around the -X normal corresponds to positive rotation.x
    const h = ((decimalHours % 12) + 12) % 12;
    const m = ((decimalHours * 60) % 60 + 60) % 60;
    hourHandPivot.rotation.x = -(h / 12) * Math.PI * 2;
    minHandPivot.rotation.x = -(m / 60) * Math.PI * 2;
  };

  return {
    group,
    cutawayGroup,
    interiorGroup,
    stainedGlassMaterial,
    clockGoldMaterial,
    sunbeamMaterial,
    uplights,
    interiorLights,
    setCutawayMode,
    updateBellSwing,
    dispose: () => {
      sunbeamTex.dispose();
      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
    },
  };
}

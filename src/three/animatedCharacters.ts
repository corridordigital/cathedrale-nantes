import * as THREE from 'three';
import { EasterEggState } from '../types/scene';
import { ProceduralTextureSet } from './textures';

export interface AnimatedCharactersManager {
  group: THREE.Group;
  setVisibility: (state: EasterEggState) => void;
  update: (elapsed: number, delta: number) => void;
  dispose: () => void;
}

interface WalkerActor {
  root: THREE.Group;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  leftArm?: THREE.Object3D;
  rightArm?: THREE.Object3D;
  head?: THREE.Object3D;
  jawOrNeck?: THREE.Object3D;
  tail?: THREE.Object3D;
  pathCenter: THREE.Vector2;
  pathRadiusX: number;
  pathRadiusZ: number;
  speed: number;
  phase: number;
  actorType: 'trex' | 'sauropod' | 'triceratops' | 'zombie' | 'zemmour';
  category: keyof EasterEggState;
}

export function buildAnimatedCharacters(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): AnimatedCharactersManager {
  const group = new THREE.Group();
  group.name = 'AnimatedCharactersParvis';

  const dinosaursGroup = new THREE.Group();
  dinosaursGroup.name = 'EasterEggDinosaurs';
  dinosaursGroup.visible = false; // Hidden by default

  const zombiesGroup = new THREE.Group();
  zombiesGroup.name = 'EasterEggZombies';
  zombiesGroup.visible = false; // Hidden by default

  const zemmourGroup = new THREE.Group();
  zemmourGroup.name = 'EasterEggZemmour';
  zemmourGroup.visible = false; // Hidden by default

  group.add(dinosaursGroup, zombiesGroup, zemmourGroup);

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

  const shadowCast = !isSoftwareGl;
  const actors: WalkerActor[] = [];

  const shadowGeo = trackGeo(new THREE.PlaneGeometry(3.2, 3.2));
  const shadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );

  // ============================================================================
  // MATERIALS FOR DINOSAURS, ZOMBIES & CARICATURE CHARACTER
  // ============================================================================
  const trexSkinMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x4d6b3c,
      bumpMap: textures.barkMap,
      bumpScale: 0.04,
      roughness: 0.72,
      metalness: 0.05,
    })
  );
  const trexBellyMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x9ca877,
      roughness: 0.85,
      metalness: 0.02,
    })
  );
  const dinoSpineMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2f4224,
      roughness: 0.5,
      metalness: 0.12,
    })
  );
  const sauropodSkinMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x7b684b,
      bumpMap: textures.barkMap,
      bumpScale: 0.03,
      roughness: 0.78,
      metalness: 0.04,
    })
  );
  const triceratopsSkinMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8f5638,
      bumpMap: textures.barkMap,
      bumpScale: 0.035,
      roughness: 0.74,
      metalness: 0.05,
    })
  );
  const ivoryHornMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf7f2e1,
      roughness: 0.3,
      metalness: 0.08,
    })
  );
  const dinoEyeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: new THREE.Color(0xd97706),
      emissiveIntensity: 0.5,
      roughness: 0.2,
    })
  );

  const zombieSkinMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x748c69,
      roughness: 0.82,
      metalness: 0.03,
    })
  );
  const zombieCoatMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x36322e,
      roughness: 0.9,
      metalness: 0.02,
    })
  );
  const zombiePantsMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x242c38,
      roughness: 0.88,
      metalness: 0.02,
    })
  );
  const zombieEyeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xff3b1f,
      emissive: new THREE.Color(0xff2a00),
      emissiveIntensity: 0.9,
      roughness: 0.2,
    })
  );

  const skinToneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe8be9e,
      roughness: 0.58,
      metalness: 0.04,
    })
  );
  const navySuitMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x17253b,
      roughness: 0.65,
      metalness: 0.08,
    })
  );
  const whiteShirtMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.45,
      metalness: 0.04,
    })
  );
  const darkTieMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      roughness: 0.4,
      metalness: 0.15,
    })
  );
  const charcoalHairMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2b2d30,
      roughness: 0.82,
      metalness: 0.05,
    })
  );
  const darkShoeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x141414,
      roughness: 0.28,
      metalness: 0.25,
    })
  );

  type BaseActorParts = Omit<
    WalkerActor,
    'pathCenter' | 'pathRadiusX' | 'pathRadiusZ' | 'speed' | 'phase' | 'actorType' | 'category'
  >;

  // ============================================================================
  // 1. T-REX BUILDER
  // ============================================================================
  const buildTRex = (scale = 1.0): BaseActorParts => {
    const root = new THREE.Group();

    const contact = new THREE.Mesh(shadowGeo, shadowMat);
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.02;
    contact.scale.setScalar(1.8 * scale);
    root.add(contact);

    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 2.35 * scale, 0);
    const torso = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.5, 1.55, 2.85)),
      trexSkinMat
    );
    torso.rotation.x = -0.18;
    torso.castShadow = shadowCast;
    torsoGroup.add(torso);

    const belly = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.32, 0.45, 2.5)),
      trexBellyMat
    );
    belly.position.set(0, -0.62, 0.05);
    belly.rotation.x = -0.18;
    torsoGroup.add(belly);

    for (let s = 0; s < 6; s++) {
      const spine = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.16, 0.42, 4)),
        dinoSpineMat
      );
      spine.position.set(0, 0.82 - s * 0.06, 0.9 - s * 0.42);
      torsoGroup.add(spine);
    }
    root.add(torsoGroup);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 3.05 * scale, 1.45 * scale);

    const neck = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.95, 1.15, 1.1)),
      trexSkinMat
    );
    neck.position.set(0, 0.2, 0.1);
    neck.rotation.x = -0.35;
    neck.castShadow = shadowCast;
    headPivot.add(neck);

    const skull = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.12, 0.88, 1.75)),
      trexSkinMat
    );
    skull.position.set(0, 0.72, 0.85);
    skull.castShadow = shadowCast;
    headPivot.add(skull);

    const eyeGeo = trackGeo(new THREE.SphereGeometry(0.11, 8, 8));
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, dinoEyeMat);
      eye.position.set(side * 0.56, 0.88, 0.65);
      headPivot.add(eye);
    }

    const toothGeo = trackGeo(new THREE.ConeGeometry(0.05, 0.18, 4));
    for (let t = 0; t < 5; t++) {
      for (const side of [-0.46, 0.46]) {
        const tooth = new THREE.Mesh(toothGeo, ivoryHornMat);
        tooth.rotation.x = Math.PI;
        tooth.position.set(side, 0.22, 0.45 + t * 0.25);
        headPivot.add(tooth);
      }
    }

    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, 0.28, 0.25);
    const lowerJaw = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.96, 0.34, 1.55)),
      trexSkinMat
    );
    lowerJaw.position.set(0, -0.1, 0.55);
    jawPivot.add(lowerJaw);
    headPivot.add(jawPivot);
    headPivot.scale.setScalar(scale);
    root.add(headPivot);

    const armGeo = trackGeo(new THREE.BoxGeometry(0.22, 0.65, 0.22));
    const leftArm = new THREE.Mesh(armGeo, trexSkinMat);
    leftArm.position.set(0.78 * scale, 2.25 * scale, 1.15 * scale);
    leftArm.rotation.x = -0.8;
    root.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, trexSkinMat);
    rightArm.position.set(-0.78 * scale, 2.25 * scale, 1.15 * scale);
    rightArm.rotation.x = -0.8;
    root.add(rightArm);

    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 2.2 * scale, -1.25 * scale);
    for (let seg = 0; seg < 4; seg++) {
      const sLen = 1.15;
      const r = 0.58 - seg * 0.12;
      const tMesh = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(r * 1.4, r * 1.4, sLen)),
        trexSkinMat
      );
      tMesh.position.set(0, seg * 0.04, -seg * 0.98 - 0.5);
      tMesh.castShadow = shadowCast;
      tailPivot.add(tMesh);
    }
    tailPivot.scale.setScalar(scale);
    root.add(tailPivot);

    const buildDinoLeg = (side: number) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(side * 0.78 * scale, 2.05 * scale, -0.1 * scale);

      const thigh = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.58, 1.25, 0.78)),
        trexSkinMat
      );
      thigh.position.set(0, -0.5, 0);
      thigh.castShadow = shadowCast;
      legPivot.add(thigh);

      const shin = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.38, 1.1, 0.42)),
        trexSkinMat
      );
      shin.position.set(0, -1.35, -0.12);
      shin.castShadow = shadowCast;
      legPivot.add(shin);

      const foot = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.62, 0.25, 0.88)),
        trexSkinMat
      );
      foot.position.set(0, -1.92, 0.18);
      legPivot.add(foot);

      legPivot.scale.setScalar(scale);
      root.add(legPivot);
      return legPivot;
    };

    torsoGroup.scale.setScalar(scale);
    const leftLeg = buildDinoLeg(1);
    const rightLeg = buildDinoLeg(-1);

    return {
      root,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      head: headPivot,
      jawOrNeck: jawPivot,
      tail: tailPivot,
    };
  };

  // ============================================================================
  // 2. LONG-NECKED BRACHIOSAURUS / DIPLODOCUS BUILDER
  // ============================================================================
  const buildSauropod = (scale = 1.0): BaseActorParts => {
    const root = new THREE.Group();

    const contact = new THREE.Mesh(shadowGeo, shadowMat);
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.02;
    contact.scale.setScalar(2.4 * scale);
    root.add(contact);

    const body = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(1.15, 1.25, 3.6, 12)),
      sauropodSkinMat
    );
    body.rotation.x = Math.PI / 2 - 0.12;
    body.position.set(0, 2.6 * scale, 0);
    body.scale.setScalar(scale);
    body.castShadow = shadowCast;
    root.add(body);

    const neckPivot = new THREE.Group();
    neckPivot.position.set(0, 3.1 * scale, 1.45 * scale);
    const neckCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1.8, 0.85),
      new THREE.Vector3(0, 3.6, 1.35),
      new THREE.Vector3(0, 4.9, 1.75),
    ]);
    const neckMesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(neckCurve, 12, 0.42, 8, false)),
      sauropodSkinMat
    );
    neckMesh.castShadow = shadowCast;
    neckPivot.add(neckMesh);

    const headMesh = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.68, 0.62, 1.15)),
      sauropodSkinMat
    );
    headMesh.position.set(0, 5.0, 2.15);
    neckPivot.add(headMesh);
    neckPivot.scale.setScalar(scale);
    root.add(neckPivot);

    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 2.4 * scale, -1.65 * scale);
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.35, -1.6),
      new THREE.Vector3(0, -0.65, -3.2),
      new THREE.Vector3(0, -0.75, -4.6),
    ]);
    const tailMesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(tailCurve, 10, 0.34, 8, false)),
      sauropodSkinMat
    );
    tailPivot.add(tailMesh);
    tailPivot.scale.setScalar(scale);
    root.add(tailPivot);

    const legGeo = trackGeo(new THREE.CylinderGeometry(0.36, 0.42, 2.5, 8));
    const leftLegs = new THREE.Group();
    const fl = new THREE.Mesh(legGeo, sauropodSkinMat);
    fl.position.set(0.85 * scale, 1.25 * scale, 1.1 * scale);
    fl.scale.setScalar(scale);
    fl.castShadow = shadowCast;
    const br = new THREE.Mesh(legGeo, sauropodSkinMat);
    br.position.set(-0.85 * scale, 1.25 * scale, -1.1 * scale);
    br.scale.setScalar(scale);
    br.castShadow = shadowCast;
    leftLegs.add(fl, br);
    root.add(leftLegs);

    const rightLegs = new THREE.Group();
    const fr = new THREE.Mesh(legGeo, sauropodSkinMat);
    fr.position.set(-0.85 * scale, 1.25 * scale, 1.1 * scale);
    fr.scale.setScalar(scale);
    fr.castShadow = shadowCast;
    const bl = new THREE.Mesh(legGeo, sauropodSkinMat);
    bl.position.set(0.85 * scale, 1.25 * scale, -1.1 * scale);
    bl.scale.setScalar(scale);
    bl.castShadow = shadowCast;
    rightLegs.add(fr, bl);
    root.add(rightLegs);

    return {
      root,
      leftLeg: leftLegs,
      rightLeg: rightLegs,
      jawOrNeck: neckPivot,
      tail: tailPivot,
    };
  };

  // ============================================================================
  // 3. TRICERATOPS BUILDER
  // ============================================================================
  const buildTriceratops = (scale = 1.0): BaseActorParts => {
    const root = new THREE.Group();

    const contact = new THREE.Mesh(shadowGeo, shadowMat);
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.02;
    contact.scale.setScalar(1.6 * scale);
    root.add(contact);

    const body = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.55, 1.35, 2.55)),
      triceratopsSkinMat
    );
    body.position.set(0, 1.45 * scale, 0);
    body.scale.setScalar(scale);
    body.castShadow = shadowCast;
    root.add(body);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.65 * scale, 1.35 * scale);

    const frill = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(1.18, 1.05, 0.24, 10)),
      triceratopsSkinMat
    );
    frill.rotation.x = Math.PI / 2 - 0.35;
    frill.position.set(0, 0.42, 0.05);
    frill.castShadow = shadowCast;
    headGroup.add(frill);

    const snout = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.95, 0.78, 1.25)),
      triceratopsSkinMat
    );
    snout.position.set(0, -0.05, 0.65);
    headGroup.add(snout);

    const longHornGeo = trackGeo(new THREE.ConeGeometry(0.11, 1.25, 8));
    for (const side of [-0.38, 0.38]) {
      const horn = new THREE.Mesh(longHornGeo, ivoryHornMat);
      horn.rotation.x = Math.PI * 0.36;
      horn.position.set(side, 0.45, 0.85);
      headGroup.add(horn);
    }
    const noseHorn = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(0.09, 0.52, 8)),
      ivoryHornMat
    );
    noseHorn.rotation.x = Math.PI * 0.2;
    noseHorn.position.set(0, 0.32, 1.15);
    headGroup.add(noseHorn);

    headGroup.scale.setScalar(scale);
    root.add(headGroup);

    const tail = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(0.45, 1.65, 8)),
      triceratopsSkinMat
    );
    tail.rotation.x = -Math.PI / 2 - 0.15;
    tail.position.set(0, 1.35 * scale, -1.85 * scale);
    tail.scale.setScalar(scale);
    root.add(tail);

    const legGeo = trackGeo(new THREE.BoxGeometry(0.42, 1.2, 0.46));
    const leftLeg = new THREE.Mesh(legGeo, triceratopsSkinMat);
    leftLeg.position.set(0.68 * scale, 0.6 * scale, 0.55 * scale);
    leftLeg.scale.setScalar(scale);
    root.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, triceratopsSkinMat);
    rightLeg.position.set(-0.68 * scale, 0.6 * scale, 0.55 * scale);
    rightLeg.scale.setScalar(scale);
    root.add(rightLeg);

    return {
      root,
      leftLeg,
      rightLeg,
      head: headGroup,
      tail,
    };
  };

  // ============================================================================
  // 4. SHAMBLING ZOMBIE BUILDER
  // ============================================================================
  const zombieTorsoGeo = trackGeo(new THREE.BoxGeometry(0.62, 0.92, 0.36));
  const zombieHeadGeo = trackGeo(new THREE.BoxGeometry(0.44, 0.48, 0.44));
  const zombieLimbGeo = trackGeo(new THREE.BoxGeometry(0.2, 0.82, 0.2));
  const zombieEyeGeo = trackGeo(new THREE.SphereGeometry(0.045, 6, 6));

  const buildZombie = (scale = 1.0): BaseActorParts => {
    const root = new THREE.Group();

    const contact = new THREE.Mesh(shadowGeo, shadowMat);
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.02;
    contact.scale.setScalar(0.65 * scale);
    root.add(contact);

    const torso = new THREE.Mesh(zombieTorsoGeo, zombieCoatMat);
    torso.position.set(0, 1.22 * scale, 0);
    torso.rotation.x = 0.22;
    torso.scale.setScalar(scale);
    torso.castShadow = shadowCast;
    root.add(torso);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.75 * scale, 0.1 * scale);
    const headMesh = new THREE.Mesh(zombieHeadGeo, zombieSkinMat);
    headMesh.position.y = 0.22;
    headMesh.castShadow = shadowCast;
    headGroup.add(headMesh);

    for (const side of [-0.11, 0.11]) {
      const eye = new THREE.Mesh(zombieEyeGeo, zombieEyeMat);
      eye.position.set(side, 0.26, 0.22);
      headGroup.add(eye);
    }
    headGroup.rotation.z = 0.24;
    headGroup.scale.setScalar(scale);
    root.add(headGroup);

    const buildZombieArm = (side: number) => {
      const armPivot = new THREE.Group();
      armPivot.position.set(side * 0.42 * scale, 1.55 * scale, 0.08 * scale);
      const sleeve = new THREE.Mesh(zombieLimbGeo, zombieCoatMat);
      sleeve.rotation.x = Math.PI / 2 - 0.15;
      sleeve.position.set(0, 0, 0.35);
      armPivot.add(sleeve);

      const hand = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.16, 0.16, 0.24)),
        zombieSkinMat
      );
      hand.position.set(0, -0.05, 0.78);
      armPivot.add(hand);
      armPivot.scale.setScalar(scale);
      root.add(armPivot);
      return armPivot;
    };

    const leftArm = buildZombieArm(1);
    const rightArm = buildZombieArm(-1);

    const buildZombieLeg = (side: number) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(side * 0.18 * scale, 0.82 * scale, 0);
      const legMesh = new THREE.Mesh(zombieLimbGeo, zombiePantsMat);
      legMesh.position.y = -0.4;
      legMesh.castShadow = shadowCast;
      legPivot.add(legMesh);
      legPivot.scale.setScalar(scale);
      root.add(legPivot);
      return legPivot;
    };

    const leftLeg = buildZombieLeg(1);
    const rightLeg = buildZombieLeg(-1);

    return {
      root,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      head: headGroup,
    };
  };

  // ============================================================================
  // 5. ÉRIC ZEMMOUR WITH GIANT CARICATURE BOBBLEHEAD ("Grosse Tête")
  // ============================================================================
  const buildBigHeadZemmour = (): BaseActorParts => {
    const root = new THREE.Group();

    const contact = new THREE.Mesh(shadowGeo, shadowMat);
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.02;
    contact.scale.setScalar(1.25);
    root.add(contact);

    const suitTorso = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.76, 1.18, 0.44)),
      navySuitMat
    );
    suitTorso.position.set(0, 1.62, 0);
    suitTorso.castShadow = shadowCast;
    root.add(suitTorso);

    const shirtV = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.32, 0.55, 0.46)),
      whiteShirtMat
    );
    shirtV.position.set(0, 1.88, 0.01);
    root.add(shirtV);

    const tie = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.11, 0.62, 0.48)),
      darkTieMat
    );
    tie.position.set(0, 1.78, 0.02);
    root.add(tie);

    const bigHeadGroup = new THREE.Group();
    bigHeadGroup.position.set(0, 2.28, 0);

    const cranium = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(1.05, 20, 20)),
      skinToneMat
    );
    cranium.scale.set(0.84, 1.28, 0.92);
    cranium.position.set(0, 1.15, 0);
    cranium.castShadow = shadowCast;
    bigHeadGroup.add(cranium);

    const chin = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.55, 0.32, 0.75, 12)),
      skinToneMat
    );
    chin.position.set(0, 0.32, 0.12);
    bigHeadGroup.add(chin);

    const noseBridge = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(0.24, 0.88, 8)),
      skinToneMat
    );
    noseBridge.rotation.x = Math.PI * 0.42;
    noseBridge.position.set(0, 1.05, 1.02);
    noseBridge.castShadow = shadowCast;
    bigHeadGroup.add(noseBridge);

    const earGeo = trackGeo(new THREE.CylinderGeometry(0.34, 0.26, 0.12, 12));
    earGeo.rotateZ(Math.PI / 2);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, skinToneMat);
      ear.position.set(side * 0.92, 1.08, -0.05);
      ear.rotation.y = side * -0.35;
      bigHeadGroup.add(ear);
    }

    const hairTop = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.96, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52)),
      charcoalHairMat
    );
    hairTop.scale.set(0.86, 1.1, 0.95);
    hairTop.position.set(0, 1.38, -0.16);
    hairTop.rotation.x = -0.32;
    bigHeadGroup.add(hairTop);

    const browGeo = trackGeo(new THREE.BoxGeometry(0.34, 0.08, 0.12));
    const pupilGeo = trackGeo(new THREE.SphereGeometry(0.09, 10, 10));
    const eyeWhiteGeo = trackGeo(new THREE.SphereGeometry(0.15, 10, 10));

    for (const side of [-1, 1]) {
      const eyeWhite = new THREE.Mesh(eyeWhiteGeo, whiteShirtMat);
      eyeWhite.position.set(side * 0.34, 1.24, 0.82);
      bigHeadGroup.add(eyeWhite);

      const pupil = new THREE.Mesh(pupilGeo, darkShoeMat);
      pupil.position.set(side * 0.34, 1.24, 0.93);
      bigHeadGroup.add(pupil);

      const brow = new THREE.Mesh(browGeo, charcoalHairMat);
      brow.position.set(side * 0.35, 1.46, 0.86);
      brow.rotation.z = side * -0.18;
      bigHeadGroup.add(brow);
    }

    const mouthMesh = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.46, 0.14, 0.22)),
      darkTieMat
    );
    mouthMesh.position.set(0, 0.52, 0.82);
    bigHeadGroup.add(mouthMesh);

    root.add(bigHeadGroup);

    const armGeo = trackGeo(new THREE.BoxGeometry(0.22, 0.95, 0.22));
    const handGeo = trackGeo(new THREE.SphereGeometry(0.13, 8, 8));

    const leftArm = new THREE.Group();
    leftArm.position.set(0.52, 2.08, 0);
    const lSleeve = new THREE.Mesh(armGeo, navySuitMat);
    lSleeve.position.y = -0.42;
    leftArm.add(lSleeve);
    const lHand = new THREE.Mesh(handGeo, skinToneMat);
    lHand.position.y = -0.92;
    leftArm.add(lHand);
    const book = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.12, 0.42, 0.32)),
      whiteShirtMat
    );
    book.position.set(0.08, -0.92, 0.15);
    leftArm.add(book);
    root.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(-0.52, 2.08, 0);
    const rSleeve = new THREE.Mesh(armGeo, navySuitMat);
    rSleeve.position.y = -0.42;
    rightArm.add(rSleeve);
    const rHand = new THREE.Mesh(handGeo, skinToneMat);
    rHand.position.y = -0.92;
    rightArm.add(rHand);
    root.add(rightArm);

    const legGeo = trackGeo(new THREE.BoxGeometry(0.26, 1.0, 0.26));
    const shoeGeo = trackGeo(new THREE.BoxGeometry(0.28, 0.16, 0.46));

    const buildSuitLeg = (side: number) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(side * 0.21, 1.05, 0);
      const trouser = new THREE.Mesh(legGeo, navySuitMat);
      trouser.position.y = -0.48;
      trouser.castShadow = shadowCast;
      legPivot.add(trouser);

      const shoe = new THREE.Mesh(shoeGeo, darkShoeMat);
      shoe.position.set(0, -0.98, 0.08);
      legPivot.add(shoe);

      root.add(legPivot);
      return legPivot;
    };

    const leftLeg = buildSuitLeg(1);
    const rightLeg = buildSuitLeg(-1);

    return {
      root,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      head: bigHeadGroup,
      jawOrNeck: mouthMesh,
    };
  };

  // ============================================================================
  // 6. POPULATE THE GROUPS (All hidden until toggled via Easter Egg Menu)
  // ============================================================================
  // A. Big-Head Éric Zemmour
  const zemmourActor = buildBigHeadZemmour();
  zemmourGroup.add(zemmourActor.root);
  actors.push({
    ...zemmourActor,
    pathCenter: new THREE.Vector2(-32, 1.5),
    pathRadiusX: 5.5,
    pathRadiusZ: 7.5,
    speed: 0.55,
    phase: 0.4,
    actorType: 'zemmour',
    category: 'zemmour',
  });

  // B. Dinosaurs (T-Rex, Brachiosaurus, Triceratops)
  const trexConfigs = [
    { cx: -35, cz: -8, rx: 6.5, rz: 6.0, speed: 0.38, phase: 0.0, scale: 1.05 },
    { cx: -12, cz: 22, rx: 9.0, rz: 4.5, speed: 0.34, phase: 2.4, scale: 0.95 },
  ];
  for (const tc of trexConfigs) {
    const trex = buildTRex(tc.scale);
    dinosaursGroup.add(trex.root);
    actors.push({
      ...trex,
      pathCenter: new THREE.Vector2(tc.cx, tc.cz),
      pathRadiusX: tc.rx,
      pathRadiusZ: tc.rz,
      speed: tc.speed,
      phase: tc.phase,
      actorType: 'trex',
      category: 'dinosaurs',
    });
  }

  const sauropodConfigs = [
    { cx: -27, cz: 14, rx: 7.5, rz: 3.5, speed: 0.24, phase: 1.1, scale: 1.08 },
    { cx: -25, cz: -15, rx: 8.0, rz: 3.5, speed: 0.22, phase: 3.8, scale: 1.0 },
  ];
  for (const sc of sauropodConfigs) {
    const sauropod = buildSauropod(sc.scale);
    dinosaursGroup.add(sauropod.root);
    actors.push({
      ...sauropod,
      pathCenter: new THREE.Vector2(sc.cx, sc.cz),
      pathRadiusX: sc.rx,
      pathRadiusZ: sc.rz,
      speed: sc.speed,
      phase: sc.phase,
      actorType: 'sauropod',
      category: 'dinosaurs',
    });
  }

  const triConfigs = [
    { cx: -39, cz: 7, rx: 5.5, rz: 5.5, speed: 0.36, phase: 2.1, scale: 0.95 },
    { cx: 4, cz: 23, rx: 7.0, rz: 4.0, speed: 0.32, phase: 4.5, scale: 0.92 },
  ];
  for (const trc of triConfigs) {
    const tri = buildTriceratops(trc.scale);
    dinosaursGroup.add(tri.root);
    actors.push({
      ...tri,
      pathCenter: new THREE.Vector2(trc.cx, trc.cz),
      pathRadiusX: trc.rx,
      pathRadiusZ: trc.rz,
      speed: trc.speed,
      phase: trc.phase,
      actorType: 'triceratops',
      category: 'dinosaurs',
    });
  }

  // C. 12 Shambling Zombies
  const zombiePatrols = [
    { cx: -30, cz: 5, rx: 4.5, rz: 4.5, speed: 0.42, phase: 0.2 },
    { cx: -34, cz: -3, rx: 5.0, rz: 4.0, speed: 0.38, phase: 1.1 },
    { cx: -28, cz: 10, rx: 4.0, rz: 5.2, speed: 0.45, phase: 2.0 },
    { cx: -37, cz: 1, rx: 4.8, rz: 5.5, speed: 0.36, phase: 2.9 },
    { cx: -26, cz: -7, rx: 5.2, rz: 3.8, speed: 0.4, phase: 3.7 },
    { cx: -32, cz: 13, rx: 6.0, rz: 3.2, speed: 0.35, phase: 4.4 },
    { cx: -22, cz: 15, rx: 5.0, rz: 3.5, speed: 0.41, phase: 5.1 },
    { cx: -22, cz: -13, rx: 5.0, rz: 3.5, speed: 0.39, phase: 0.8 },
    { cx: -14, cz: 17, rx: 6.0, rz: 3.0, speed: 0.37, phase: 1.7 },
    { cx: -14, cz: -17, rx: 6.0, rz: 3.0, speed: 0.43, phase: 2.6 },
    { cx: -41, cz: -10, rx: 4.5, rz: 4.5, speed: 0.34, phase: 3.3 },
    { cx: -41, cz: 11, rx: 4.5, rz: 4.5, speed: 0.44, phase: 4.9 },
  ];

  for (let z = 0; z < zombiePatrols.length; z++) {
    const zp = zombiePatrols[z];
    const zombie = buildZombie(0.95 + (z % 3) * 0.08);
    zombiesGroup.add(zombie.root);
    actors.push({
      ...zombie,
      pathCenter: new THREE.Vector2(zp.cx, zp.cz),
      pathRadiusX: zp.rx,
      pathRadiusZ: zp.rz,
      speed: zp.speed,
      phase: zp.phase,
      actorType: 'zombie',
      category: 'zombies',
    });
  }

  let currentVisibility: EasterEggState = {
    dinosaurs: false,
    zombies: false,
    zemmour: false,
  };

  const setVisibility = (state: EasterEggState) => {
    currentVisibility = state;
    dinosaursGroup.visible = state.dinosaurs;
    zombiesGroup.visible = state.zombies;
    zemmourGroup.visible = state.zemmour;
  };

  const update = (elapsed: number, _delta: number) => {
    if (!currentVisibility.dinosaurs && !currentVisibility.zombies && !currentVisibility.zemmour) {
      return;
    }

    for (let i = 0; i < actors.length; i++) {
      const a = actors[i];
      if (!currentVisibility[a.category]) continue;

      const t = elapsed * a.speed + a.phase;
      const px = a.pathCenter.x + Math.cos(t) * a.pathRadiusX;
      const pz = a.pathCenter.y + Math.sin(t) * a.pathRadiusZ;
      const dx = -Math.sin(t) * a.pathRadiusX;
      const dz = Math.cos(t) * a.pathRadiusZ;

      a.root.position.x = px;
      a.root.position.z = pz;
      a.root.rotation.y = Math.atan2(dx, dz);

      const walkFreq =
        elapsed * (a.actorType === 'zombie' ? 4.2 : a.actorType === 'zemmour' ? 5.8 : 3.4) +
        a.phase;
      const stride = Math.sin(walkFreq);

      a.leftLeg.rotation.x = stride * 0.48;
      a.rightLeg.rotation.x = -stride * 0.48;

      if (a.actorType === 'trex') {
        a.root.position.y = Math.abs(Math.cos(walkFreq)) * 0.16;
        if (a.tail) a.tail.rotation.y = Math.sin(walkFreq * 0.8) * 0.25;
        if (a.head) a.head.rotation.y = Math.cos(walkFreq * 0.5) * 0.18;
        if (a.jawOrNeck) {
          a.jawOrNeck.rotation.x = 0.18 + Math.max(0, Math.sin(elapsed * 2.2 + a.phase)) * 0.35;
        }
      } else if (a.actorType === 'sauropod') {
        if (a.jawOrNeck) a.jawOrNeck.rotation.x = Math.sin(elapsed * 1.1 + a.phase) * 0.12;
        if (a.tail) a.tail.rotation.y = Math.cos(elapsed * 1.4 + a.phase) * 0.22;
      } else if (a.actorType === 'triceratops') {
        if (a.head) a.head.rotation.z = Math.sin(walkFreq) * 0.1;
        if (a.tail) a.tail.rotation.y = -stride * 0.25;
      } else if (a.actorType === 'zombie') {
        a.root.position.y = Math.abs(stride) * 0.08;
        a.root.rotation.z = Math.sin(walkFreq * 0.5) * 0.12;
        if (a.leftArm) a.leftArm.rotation.x = Math.sin(walkFreq * 0.7) * 0.22;
        if (a.rightArm) a.rightArm.rotation.x = -Math.sin(walkFreq * 0.7) * 0.22;
        if (a.head) a.head.rotation.z = 0.24 + Math.sin(elapsed * 2.5 + a.phase) * 0.14;
      } else if (a.actorType === 'zemmour') {
        a.root.position.y = Math.abs(stride) * 0.1;
        if (a.head) {
          a.head.rotation.z = Math.sin(walkFreq * 0.8) * 0.16;
          a.head.rotation.y = Math.cos(elapsed * 1.9) * 0.28;
          a.head.rotation.x = Math.sin(elapsed * 3.2) * 0.1;
        }
        if (a.leftArm) {
          a.leftArm.rotation.x = -0.35 + stride * 0.45;
        }
        if (a.rightArm) {
          a.rightArm.rotation.x = -0.85 + Math.sin(elapsed * 6.5) * 0.45;
          a.rightArm.rotation.z = -0.25 - Math.abs(Math.cos(elapsed * 3.2)) * 0.3;
        }
        if (a.jawOrNeck) {
          a.jawOrNeck.scale.y = 0.7 + Math.abs(Math.sin(elapsed * 9.0)) * 1.4;
        }
      }
    }
  };

  return {
    group,
    setVisibility,
    update,
    dispose: () => {
      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
    },
  };
}

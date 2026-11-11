import * as THREE from 'three';
import { ProceduralTextureSet } from './textures';

export interface FallingLeafData {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  phase: number;
  scale: number;
}

interface TreeBirdActor {
  root: THREE.Group;
  leftWing: THREE.Group;
  rightWing: THREE.Group;
  state: 'perched' | 'flying';
  timer: number;
  duration: number;
  fromTreeIdx: number;
  toTreeIdx: number;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  arcHeight: number;
  flapPhase: number;
}

interface SkyBirdActor {
  root: THREE.Group;
  leftWing: THREE.Group;
  rightWing: THREE.Group;
  flockCenter: THREE.Vector3;
  orbitRadiusX: number;
  orbitRadiusZ: number;
  baseHeight: number;
  speed: number;
  angleOffset: number;
  localOffset: THREE.Vector3;
  flapPhase: number;
}

export interface AutumnEnvironment {
  group: THREE.Group;
  skyUniforms: {
    uTopColor: { value: THREE.Color };
    uHorizonColor: { value: THREE.Color };
    uSunColor: { value: THREE.Color };
    uSunPosition: { value: THREE.Vector3 };
    uTime: { value: number };
  };
  lanternBulbMat: THREE.MeshStandardMaterial;
  townhouseWindowMat: THREE.MeshStandardMaterial;
  streetLights: THREE.PointLight[];
  updateAnimation: (elapsed: number, delta: number, windStrength: number) => void;
  setAutumnTone: (maturity: number) => void;
  dispose: () => void;
}

// Pre-allocated scratch math objects at module scope (Zero GC in render loop)
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _baseColor = new THREE.Color();
const _lateColor = new THREE.Color();
const _birdPos = new THREE.Vector3();
const _birdNextPos = new THREE.Vector3();

export function buildAutumnEnvironment(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): AutumnEnvironment {
  const group = new THREE.Group();
  group.name = 'NantesAutumnEnvironment';

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

  let seed = 1434;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // ============================================================================
  // 0. PROCEDURAL ATMOSPHERIC SKY DOME WITH SOLAR CORONA & AUTUMN CLOUDS
  // ============================================================================
  const skyUniforms = {
    uTopColor: { value: new THREE.Color('#6999cc') },
    uHorizonColor: { value: new THREE.Color('#e6ceb0') },
    uSunColor: { value: new THREE.Color('#ffdc9c') },
    uSunPosition: { value: new THREE.Vector3(-55, 40, 48) },
    uTime: { value: 0 },
  };

  const skyGeo = trackGeo(new THREE.SphereGeometry(240, 32, 20));
  const skyMat = trackMat(
    new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        uniform vec3 uTopColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uSunColor;
        uniform vec3 uSunPosition;
        uniform float uTime;

        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = clamp(dir.y, 0.0, 1.0);
          float grad = pow(h, 0.52);
          vec3 col = mix(uHorizonColor, uTopColor, grad);

          // Solar disk & warm Mie scattering glow
          vec3 sunDir = normalize(uSunPosition);
          float sunAmt = max(dot(dir, sunDir), 0.0);
          col += uSunColor * pow(sunAmt, 10.0) * 0.30;
          col += uSunColor * smoothstep(0.996, 0.9996, sunAmt) * 0.85;

          // Subtle high-altitude autumn cirrus cloud bands
          if (dir.y > 0.04) {
            vec2 uv = dir.xz / (dir.y + 0.2);
            float cloud = sin(uv.x * 2.1 + uTime * 0.04) * cos(uv.y * 1.7 - uTime * 0.025);
            cloud += 0.5 * sin(uv.x * 4.3 - uv.y * 2.9 + uTime * 0.03);
            float cloudMask = smoothstep(0.22, 1.15, cloud) * smoothstep(0.04, 0.35, dir.y) * 0.14;
            col = mix(col, mix(uHorizonColor, vec3(1.0, 0.96, 0.9), 0.55), cloudMask);
          }

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  );
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  group.add(skyDome);

  // ============================================================================
  // 1. URBAN GROUND, PLACE SAINT-PIERRE COBBLESTONES, STREETS & SIDEWALKS
  // ============================================================================
  const outerGroundGeo = trackGeo(new THREE.PlaneGeometry(320, 320));
  const outerGroundMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x5c5346,
      roughness: 0.92,
      metalness: 0.02,
    })
  );
  const outerGround = new THREE.Mesh(outerGroundGeo, outerGroundMat);
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.04;
  outerGround.receiveShadow = true;
  group.add(outerGround);

  // Main Cobblestone Plaza covering Place Saint-Pierre & Cours Saint-Pierre
  const plazaGeo = trackGeo(new THREE.CircleGeometry(108, 64));
  const plazaMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x9e9589,
      map: textures.cobbleMap,
      normalMap: textures.cobbleNormal,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: textures.cobbleRoughness,
      roughness: 0.72,
      metalness: 0.08,
      envMapIntensity: 1.15,
    })
  );
  const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
  plazaMesh.rotation.x = -Math.PI / 2;
  plazaMesh.position.set(-4, 0.0, 0);
  plazaMesh.receiveShadow = true;
  group.add(plazaMesh);

  // Lighter Granite Forecourt Apron directly in front of the West Facade
  const forecourtGeo = trackGeo(new THREE.PlaneGeometry(29, 32));
  const forecourtMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xc5bcb0,
      map: textures.tuffeauMap,
      normalMap: textures.cobbleNormal,
      normalScale: new THREE.Vector2(0.28, 0.28),
      roughnessMap: textures.cobbleRoughness,
      roughness: 0.65,
      metalness: 0.06,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  const forecourt = new THREE.Mesh(forecourtGeo, forecourtMat);
  forecourt.rotation.x = -Math.PI / 2;
  forecourt.position.set(-35, 0.015, 0);
  forecourt.receiveShadow = true;
  group.add(forecourt);

  const curbMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xa69d90,
      roughness: 0.76,
      metalness: 0.05,
    })
  );
  const castIronMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1e2226,
      roughness: 0.34,
      metalness: 0.82,
    })
  );
  const verdigrisIronMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2f5449,
      roughness: 0.38,
      metalness: 0.68,
    })
  );

  // Axial Paved Street (Rue du Roi-Albert extending West from Place Saint-Pierre)
  const westStreetSidewalkGeo = trackGeo(new THREE.BoxGeometry(55, 0.18, 4.5));
  for (const sz of [-11.5, 11.5]) {
    const sw = new THREE.Mesh(westStreetSidewalkGeo, curbMat);
    sw.position.set(-82, 0.09, sz);
    sw.receiveShadow = true;
    group.add(sw);
  }

  // Granite Bollards & Wrought-Iron Chains lining the West Parvis edge
  const bollardGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.24, 0.95, 10));
  const bollardCapGeo = trackGeo(new THREE.SphereGeometry(0.19, 10, 8));
  const chainBarGeo = trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 3.5, 6));
  chainBarGeo.rotateX(Math.PI / 2);

  for (let bz = -14; bz <= 14; bz += 3.5) {
    if (Math.abs(bz) < 2.5) continue;
    const bGroup = new THREE.Group();
    bGroup.position.set(-25.8, 0, bz);
    const bShaft = new THREE.Mesh(bollardGeo, curbMat);
    bShaft.position.y = 0.475;
    bShaft.castShadow = shadowCast;
    bGroup.add(bShaft);
    const bCap = new THREE.Mesh(bollardCapGeo, curbMat);
    bCap.position.y = 0.95;
    bGroup.add(bCap);

    if (bz + 3.5 <= 14 && Math.abs(bz + 1.75) > 2.5) {
      const chain = new THREE.Mesh(chainBarGeo, castIronMat);
      chain.position.set(0, 0.68, 1.75);
      bGroup.add(chain);
    }
    group.add(bGroup);
  }

  // Autumn Grass Lawns along South & North flanks
  const lawnMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x556338,
      roughness: 0.9,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );

  // South Lawn Bed
  const southCurb = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(54.4, 0.22, 15.4)), curbMat);
  southCurb.position.set(-12, 0.08, 30.5);
  southCurb.receiveShadow = true;
  group.add(southCurb);

  const southLawn = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(54, 15)), lawnMat);
  southLawn.rotation.x = -Math.PI / 2;
  southLawn.position.set(-12, 0.2, 30.5);
  southLawn.receiveShadow = true;
  group.add(southLawn);

  // North Lawn Bed (West of Porte Saint-Pierre)
  const northCurb = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(40.4, 0.22, 15.4)), curbMat);
  northCurb.position.set(-18, 0.08, -30.5);
  northCurb.receiveShadow = true;
  group.add(northCurb);

  const northLawn = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(40, 15)), lawnMat);
  northLawn.rotation.x = -Math.PI / 2;
  northLawn.position.set(-18, 0.2, -30.5);
  northLawn.receiveShadow = true;
  group.add(northLawn);

  // ============================================================================
  // 2. RICH HISTORIC NANTES NEIGHBORHOOD AROUND THE CATHEDRAL
  //    - Porte Saint-Pierre & Gallo-Roman Ramparts (North-East)
  //    - Le Manoir de la Psallette (15th-century Gothic Manor, South-East)
  //    - Colonne Louis XVI & Cours Saint-Pierre Gates (East)
  //    - 16 Historic Nantes Townhouses & Haussmannian Blocks with Café Terraces
  //    - Distant Nantes Cityscape & Church Spires
  // ============================================================================
  const tuffeauWallMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xede4d4,
      map: textures.tuffeauMap,
      normalMap: textures.tuffeauNormal,
      normalScale: new THREE.Vector2(0.4, 0.4),
      roughness: 0.76,
      metalness: 0.04,
    })
  );

  const warmOchreWallMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe3d5be,
      map: textures.tuffeauMap,
      normalMap: textures.tuffeauNormal,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughness: 0.78,
      metalness: 0.04,
    })
  );

  const galloRomanBrickMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x944836,
      roughness: 0.84,
      metalness: 0.04,
    })
  );

  const slateMansardMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2b3444,
      map: textures.slateMap,
      normalMap: textures.slateNormal,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughness: 0.38,
      metalness: 0.24,
    })
  );

  const townhouseWindowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x283242,
      emissive: new THREE.Color(0xffb357),
      emissiveIntensity: 0.15,
      roughness: 0.18,
      metalness: 0.32,
    })
  );

  const cafeAwningMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x7c2326, // Deep Bordeaux café awning
      roughness: 0.75,
      metalness: 0.04,
    })
  );

  const creamParasolMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf2e8d5,
      roughness: 0.7,
      metalness: 0.02,
    })
  );

  // 2A. Porte Saint-Pierre & Gallo-Roman Rampart Vestige (North-East of Cathedral)
  const porteGroup = new THREE.Group();
  porteGroup.position.set(17.5, 0, -27.5);

  const rampartGeo = trackGeo(new THREE.BoxGeometry(17.5, 6.2, 3.4));
  const rampart = new THREE.Mesh(rampartGeo, tuffeauWallMat);
  rampart.position.y = 3.1;
  rampart.castShadow = shadowCast;
  rampart.receiveShadow = true;
  porteGroup.add(rampart);

  for (const by of [1.1, 2.2, 3.3]) {
    const band = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(17.6, 0.22, 3.48)),
      galloRomanBrickMat
    );
    band.position.y = by;
    porteGroup.add(band);
  }

  const porteTowerGeo = trackGeo(new THREE.BoxGeometry(6.2, 10.6, 5.6));
  const porteTower = new THREE.Mesh(porteTowerGeo, tuffeauWallMat);
  porteTower.position.set(-2, 5.3, 0.4);
  porteTower.castShadow = shadowCast;
  porteGroup.add(porteTower);

  const gateHoleGeo = trackGeo(new THREE.CylinderGeometry(1.6, 1.6, 5.8, 12));
  gateHoleGeo.rotateX(Math.PI / 2);
  const gateHole = new THREE.Mesh(gateHoleGeo, castIronMat);
  gateHole.position.set(-2, 1.8, 0.4);
  porteGroup.add(gateHole);

  for (let mx = -4.8; mx <= 0.8; mx += 0.65) {
    const corbel = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.24, 0.55, 5.9)),
      tuffeauWallMat
    );
    corbel.position.set(mx, 10.4, 0.4);
    porteGroup.add(corbel);
  }

  const porteRoofGeo = trackGeo(new THREE.ConeGeometry(4.8, 4.8, 4));
  porteRoofGeo.rotateY(Math.PI / 4);
  const porteRoof = new THREE.Mesh(porteRoofGeo, slateMansardMat);
  porteRoof.position.set(-2, 10.6 + 2.4, 0.4);
  porteGroup.add(porteRoof);
  group.add(porteGroup);

  // 2B. Le Manoir de la Psallette (15th-Century Gothic Tuffeau Manor at South-East of Cathedral)
  const psalletteGroup = new THREE.Group();
  psalletteGroup.position.set(22.5, 0, 23.5);

  const psalletteBody = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(11.5, 9.2, 6.8)),
    tuffeauWallMat
  );
  psalletteBody.position.y = 4.6;
  psalletteBody.castShadow = shadowCast;
  psalletteBody.receiveShadow = true;
  psalletteGroup.add(psalletteBody);

  const psalletteRoof = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(7.2, 5.2, 4)),
    slateMansardMat
  );
  psalletteRoof.rotation.y = Math.PI / 4;
  psalletteRoof.scale.set(1.15, 1, 0.68);
  psalletteRoof.position.y = 9.2 + 2.6;
  psalletteRoof.castShadow = shadowCast;
  psalletteGroup.add(psalletteRoof);

  // Octagonal Gothic Stair Turret on the Psallette
  const psalletteTurret = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.45, 1.5, 11.4, 8)),
    tuffeauWallMat
  );
  psalletteTurret.position.set(-3.2, 5.7, -3.2);
  psalletteTurret.castShadow = shadowCast;
  psalletteGroup.add(psalletteTurret);

  const psalletteTurretRoof = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(1.65, 3.8, 8)),
    slateMansardMat
  );
  psalletteTurretRoof.position.set(-3.2, 11.4 + 1.9, -3.2);
  psalletteGroup.add(psalletteTurretRoof);

  // Medieval Courtyard Wall linking toward the Cathedral South Transept
  const courtyardWall = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.65, 3.4, 6.5)),
    tuffeauWallMat
  );
  courtyardWall.position.set(-5.2, 1.7, -5.8);
  psalletteGroup.add(courtyardWall);
  group.add(psalletteGroup);

  // 2C. Colonne Louis XVI & Monumental Entrance Gates of Cours Saint-Pierre
  const colonneGroup = new THREE.Group();
  colonneGroup.position.set(60, 0, 0);
  const colPedestal = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.2, 4.8, 4.2)),
    tuffeauWallMat
  );
  colPedestal.position.y = 2.4;
  colonneGroup.add(colPedestal);

  const colShaft = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.95, 1.18, 16.5, 16)),
    tuffeauWallMat
  );
  colShaft.position.y = 4.8 + 8.25;
  colShaft.castShadow = shadowCast;
  colonneGroup.add(colShaft);

  const colCapital = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.6, 0.65, 2.6)),
    tuffeauWallMat
  );
  colCapital.position.y = 21.6;
  colonneGroup.add(colCapital);

  const colStatue = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.35, 0.45, 2.6, 8)),
    tuffeauWallMat
  );
  colStatue.position.y = 23.2;
  colonneGroup.add(colStatue);
  group.add(colonneGroup);

  // Stone Gate Pillars at the entrance of Cours Saint-Pierre & Saint-André
  const gatePillarGeo = trackGeo(new THREE.BoxGeometry(1.2, 4.2, 1.2));
  const gateUrnGeo = trackGeo(new THREE.SphereGeometry(0.48, 10, 8));
  for (const gz of [-12.5, -6.5, 6.5, 12.5]) {
    const pil = new THREE.Mesh(gatePillarGeo, tuffeauWallMat);
    pil.position.set(33.5, 2.1, gz);
    pil.castShadow = shadowCast;
    group.add(pil);

    const urn = new THREE.Mesh(gateUrnGeo, curbMat);
    urn.position.set(33.5, 4.5, gz);
    group.add(urn);
  }

  // 2D. 16 Historic Nantes Townhouses & Haussmannian Blocks around Place Saint-Pierre,
  //     Rue du Roi-Albert, Rue Mathelin-Rodier & Cours Saint-Pierre
  const townhouseConfigs: {
    x: number;
    z: number;
    w: number;
    h: number;
    d: number;
    rotY: number;
    hasCafe?: boolean;
    warmStone?: boolean;
  }[] = [
    // West side of Place Saint-Pierre (framing Rue du Roi-Albert)
    { x: -64, z: -22.5, w: 16, h: 13.2, d: 9.0, rotY: 0.12, hasCafe: true },
    { x: -64, z: 22.5, w: 16, h: 13.2, d: 9.0, rotY: -0.12, hasCafe: true },
    { x: -60, z: -37.5, w: 15, h: 12.2, d: 8.8, rotY: 0.38, warmStone: true },
    { x: -60, z: 37.5, w: 15, h: 12.2, d: 8.8, rotY: -0.38, warmStone: true },

    // Rue du Roi-Albert Avenue extending West
    { x: -84, z: -20.5, w: 18, h: 12.8, d: 9.2, rotY: 0, warmStone: true },
    { x: -84, z: 20.5, w: 18, h: 12.8, d: 9.2, rotY: Math.PI },
    { x: -104, z: -20.5, w: 17, h: 12.0, d: 9.0, rotY: 0 },
    { x: -104, z: 20.5, w: 17, h: 12.0, d: 9.0, rotY: Math.PI, warmStone: true },

    // North & South sides of Place Saint-Pierre
    { x: -43, z: 45.5, w: 19, h: 12.6, d: 8.8, rotY: -Math.PI / 2, hasCafe: true },
    { x: -22, z: 46.5, w: 18, h: 11.8, d: 8.6, rotY: -Math.PI / 2, warmStone: true },
    { x: -1, z: 46.5, w: 18, h: 12.4, d: 8.8, rotY: -Math.PI / 2 },

    { x: -43, z: -45.5, w: 19, h: 12.6, d: 8.8, rotY: Math.PI / 2, hasCafe: true },
    { x: -22, z: -46.5, w: 18, h: 11.8, d: 8.6, rotY: Math.PI / 2, warmStone: true },
    { x: -1, z: -46.5, w: 18, h: 12.4, d: 8.8, rotY: Math.PI / 2 },

    // Hôtels particuliers flanking Cours Saint-Pierre & Cours Saint-André (East)
    { x: 46, z: 38.0, w: 20, h: 13.5, d: 9.5, rotY: -Math.PI / 2, warmStone: true },
    { x: 46, z: -38.0, w: 20, h: 13.5, d: 9.5, rotY: Math.PI / 2 },
  ];

  const thWinGeo = trackGeo(new THREE.PlaneGeometry(1.25, 2.15));
  const thShopDoorGeo = trackGeo(new THREE.PlaneGeometry(1.8, 2.7));
  const balconyGeo = trackGeo(new THREE.BoxGeometry(1.55, 0.5, 0.34));
  const chimneyGeo = trackGeo(new THREE.BoxGeometry(0.75, 2.2, 0.75));
  const dormerGeo = trackGeo(new THREE.BoxGeometry(1.0, 1.35, 1.1));
  const bistroTableTopGeo = trackGeo(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 10));
  const bistroTableLegGeo = trackGeo(new THREE.CylinderGeometry(0.05, 0.18, 0.72, 6));
  const parasolConeGeo = trackGeo(new THREE.ConeGeometry(1.35, 0.55, 8));
  const parasolPoleGeo = trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 2.15, 6));

  for (const th of townhouseConfigs) {
    const thGroup = new THREE.Group();
    thGroup.position.set(th.x, 0, th.z);
    thGroup.rotation.y = th.rotY;

    const wallMat = th.warmStone ? warmOchreWallMat : tuffeauWallMat;

    // Sidewalk plinth around the building block
    const swGeo = trackGeo(new THREE.BoxGeometry(th.w + 3.6, 0.18, th.d + 4.4));
    const sw = new THREE.Mesh(swGeo, curbMat);
    sw.position.set(0, 0.09, 0.5);
    sw.receiveShadow = true;
    thGroup.add(sw);

    const bodyGeo = trackGeo(new THREE.BoxGeometry(th.w, th.h, th.d));
    const body = new THREE.Mesh(bodyGeo, wallMat);
    body.position.y = th.h / 2;
    body.castShadow = shadowCast;
    body.receiveShadow = true;
    thGroup.add(body);

    for (const fy of [3.5, 7.4, th.h]) {
      const band = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(th.w + 0.35, 0.28, th.d + 0.35)),
        curbMat
      );
      band.position.y = fy;
      thGroup.add(band);
    }

    const roofGeo = trackGeo(new THREE.ConeGeometry(th.w * 0.65, 4.3, 4));
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, slateMansardMat);
    roof.scale.set(1, 1, th.d / th.w);
    roof.position.y = th.h + 2.15;
    roof.castShadow = shadowCast;
    thGroup.add(roof);

    for (const cx of [-th.w * 0.28, th.w * 0.28]) {
      const chimney = new THREE.Mesh(chimneyGeo, wallMat);
      chimney.position.set(cx, th.h + 3.2, 0);
      thGroup.add(chimney);
    }

    const cols = 4;
    for (let c = 0; c < cols; c++) {
      const wx = -th.w * 0.34 + (c / (cols - 1)) * (th.w * 0.68);

      // Ground-floor arched shopfront / porte-cochère
      const shopWin = new THREE.Mesh(thShopDoorGeo, townhouseWindowMat);
      shopWin.position.set(wx, 1.55, th.d / 2 + 0.06);
      thGroup.add(shopWin);

      // Mansard dormer window
      if (c === 1 || c === 2) {
        const dormer = new THREE.Mesh(dormerGeo, wallMat);
        dormer.position.set(wx, th.h + 0.9, th.d / 2 - 0.65);
        thGroup.add(dormer);
      }

      // Upper 2 floors of windows + wrought-iron balconies
      for (let r = 0; r < 2; r++) {
        const wy = 5.0 + r * 3.85;
        const win = new THREE.Mesh(thWinGeo, townhouseWindowMat);
        win.position.set(wx, wy, th.d / 2 + 0.06);
        thGroup.add(win);

        const balcony = new THREE.Mesh(balconyGeo, castIronMat);
        balcony.position.set(wx, wy - 0.9, th.d / 2 + 0.17);
        thGroup.add(balcony);
      }
    }

    // Café Awning & Bistro Terrace Tables on Place Saint-Pierre blocks
    if (th.hasCafe) {
      const awningGeo = trackGeo(new THREE.BoxGeometry(th.w * 0.78, 0.18, 2.1));
      const awning = new THREE.Mesh(awningGeo, cafeAwningMat);
      awning.position.set(0, 3.15, th.d / 2 + 0.95);
      awning.rotation.x = 0.24;
      awning.castShadow = shadowCast;
      thGroup.add(awning);

      for (const tx of [-3.6, 0, 3.6]) {
        const tGroup = new THREE.Group();
        tGroup.position.set(tx, 0.18, th.d / 2 + 2.2);

        const leg = new THREE.Mesh(bistroTableLegGeo, castIronMat);
        leg.position.y = 0.36;
        tGroup.add(leg);

        const top = new THREE.Mesh(bistroTableTopGeo, creamParasolMat);
        top.position.y = 0.74;
        top.castShadow = shadowCast;
        tGroup.add(top);

        if (tx !== 0) {
          const pole = new THREE.Mesh(parasolPoleGeo, castIronMat);
          pole.position.y = 1.08;
          tGroup.add(pole);

          const cone = new THREE.Mesh(parasolConeGeo, creamParasolMat);
          cone.position.y = 2.22;
          cone.castShadow = shadowCast;
          tGroup.add(cone);
        }

        thGroup.add(tGroup);
      }
    }

    group.add(thGroup);
  }

  // 2E. Historic French Urban Furniture: Colonne Morris & Fontaine Wallace on Place Saint-Pierre
  const morrisGroup = new THREE.Group();
  morrisGroup.position.set(-48.5, 0, -14.2);
  const morrisBase = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.75, 0.82, 0.45, 12)),
    castIronMat
  );
  morrisBase.position.y = 0.225;
  morrisGroup.add(morrisBase);
  const morrisDrum = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.65, 0.65, 3.1, 12)),
    verdigrisIronMat
  );
  morrisDrum.position.y = 2.0;
  morrisDrum.castShadow = shadowCast;
  morrisGroup.add(morrisDrum);
  const morrisCap = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.88, 0.85, 6)),
    verdigrisIronMat
  );
  morrisCap.position.y = 3.95;
  morrisGroup.add(morrisCap);
  group.add(morrisGroup);

  const wallaceGroup = new THREE.Group();
  wallaceGroup.position.set(-48.5, 0, 14.2);
  const wPedestal = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.32, 0.42, 1.25, 8)),
    verdigrisIronMat
  );
  wPedestal.position.y = 0.625;
  wPedestal.castShadow = shadowCast;
  wallaceGroup.add(wPedestal);
  const wCaryatids = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.26, 0.28, 0.95, 6, 1, true)),
    verdigrisIronMat
  );
  wCaryatids.position.y = 1.72;
  wallaceGroup.add(wCaryatids);
  const wDome = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.38, 0.62, 8)),
    verdigrisIronMat
  );
  wDome.position.y = 2.5;
  wallaceGroup.add(wDome);
  group.add(wallaceGroup);

  // 2F. Distant Nantes Cityscape Perimeter Ring & Horizon Spires (`InstancedMesh`)
  const distantBlockCount = 72;
  const distBoxGeo = trackGeo(new THREE.BoxGeometry(1, 1, 1));
  const distRoofGeo = trackGeo(new THREE.ConeGeometry(0.75, 0.4, 4));
  distRoofGeo.rotateY(Math.PI / 4);

  const distWallsInstanced = new THREE.InstancedMesh(distBoxGeo, warmOchreWallMat, distantBlockCount);
  const distRoofsInstanced = new THREE.InstancedMesh(distRoofGeo, slateMansardMat, distantBlockCount);

  for (let i = 0; i < distantBlockCount; i++) {
    const ang = (i / distantBlockCount) * Math.PI * 2;
    const rad = 98 + (i % 3) * 14 + rand() * 8;
    const bx = Math.cos(ang) * rad;
    const bz = Math.sin(ang) * rad;
    const bw = 11 + rand() * 8;
    const bh = 8.5 + rand() * 6.5;
    const bd = 8 + rand() * 5;

    _dummy.position.set(bx, bh / 2, bz);
    _dummy.rotation.set(0, -ang + Math.PI / 2, 0);
    _dummy.scale.set(bw, bh, bd);
    _dummy.updateMatrix();
    distWallsInstanced.setMatrixAt(i, _dummy.matrix);

    _dummy.position.set(bx, bh + 1.6, bz);
    _dummy.scale.set(bw, 8.0, bd);
    _dummy.updateMatrix();
    distRoofsInstanced.setMatrixAt(i, _dummy.matrix);
  }
  distWallsInstanced.instanceMatrix.needsUpdate = true;
  distWallsInstanced.computeBoundingSphere();
  distRoofsInstanced.instanceMatrix.needsUpdate = true;
  distRoofsInstanced.computeBoundingSphere();
  group.add(distWallsInstanced);
  group.add(distRoofsInstanced);

  // Distant Nantes Church Spires on the Horizon (Basilique Saint-Nicolas West & Saint-Clément East)
  const spireTowerGeo = trackGeo(new THREE.BoxGeometry(5.5, 22, 5.5));
  const spireConeGeo = trackGeo(new THREE.ConeGeometry(3.6, 24, 8));
  for (const [sx, sz] of [
    [-128, -28],
    [118, -36],
  ]) {
    const sGroup = new THREE.Group();
    sGroup.position.set(sx, 0, sz);
    const st = new THREE.Mesh(spireTowerGeo, tuffeauWallMat);
    st.position.y = 11;
    sGroup.add(st);
    const sc = new THREE.Mesh(spireConeGeo, slateMansardMat);
    sc.position.y = 22 + 12;
    sGroup.add(sc);
    group.add(sGroup);
  }

  // ============================================================================
  // STRICT 2D/3D COLLISION EXCLUSION CHECKER FOR ALL BUILDINGS & MONUMENTS
  // Ensures zero trees or canopies ever intersect the Cathedral, Porte Saint-Pierre,
  // Manoir de la Psallette, Townhouses, Rue du Roi-Albert, or Colonne Louis XVI.
  // ============================================================================
  const buildingExclusionBoxes: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [
    // 1. Cathedral Sanctuary, Towers, Transepts, Buttresses, Apse & Stepped Plinth
    { minX: -29.0, maxX: 31.5, minZ: -19.5, maxZ: 19.5 },
    // 2. Central West Parvis Sightline & Rue du Roi-Albert Avenue
    { minX: -120.0, maxX: -25.0, minZ: -16.0, maxZ: 16.0 },
    // 3. Porte Saint-Pierre & Gallo-Roman Rampart (North-East)
    { minX: 6.5, maxX: 29.0, minZ: -33.5, maxZ: -21.0 },
    // 4. Le Manoir de la Psallette (South-East)
    { minX: 14.5, maxX: 30.5, minZ: 17.5, maxZ: 29.5 },
    // 5. Colonne Louis XVI & Axial Perspective Corridor
    { minX: 30.0, maxX: 72.0, minZ: -11.0, maxZ: 11.0 },
    // 6. All 16 Townhouse & Haussmannian Blocks around Place & Cours Saint-Pierre
    { minX: -116.0, maxX: -52.0, minZ: -45.0, maxZ: -14.0 },
    { minX: -116.0, maxX: -52.0, minZ: 14.0, maxZ: 45.0 },
    { minX: -55.0, maxX: 12.0, minZ: 38.5, maxZ: 54.0 },
    { minX: -55.0, maxX: 12.0, minZ: -54.0, maxZ: -38.5 },
    { minX: 33.0, maxX: 59.0, minZ: 30.5, maxZ: 46.0 },
    { minX: 33.0, maxX: 59.0, minZ: -46.0, maxZ: -30.5 },
  ];

  const isPositionClearOfBuildings = (x: number, z: number, canopyRadius = 5.5): boolean => {
    for (let i = 0; i < buildingExclusionBoxes.length; i++) {
      const b = buildingExclusionBoxes[i];
      if (
        x >= b.minX - canopyRadius &&
        x <= b.maxX + canopyRadius &&
        z >= b.minZ - canopyRadius &&
        z <= b.maxZ + canopyRadius
      ) {
        return false;
      }
    }
    return true;
  };

  // ============================================================================
  // 3. COMPOSITE MULTI-PART HERO AUTUMN TREES (Painterly Palette & Organic Canopies)
  // ============================================================================
  const barkMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x59493b,
      map: textures.barkMap,
      roughness: 0.88,
      metalness: 0.03,
    })
  );

  const treeGrateMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x262423,
      roughness: 0.55,
      metalness: 0.65,
    })
  );

  const shadowPlaneGeo = trackGeo(new THREE.PlaneGeometry(10.5, 10.5));
  const shadowPlaneMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.52,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );

  // Curated Painterly French Autumn Palette (Harmonized Saffron, Ochre, Copper, Russet & Claret)
  const earlyAutumnHex = [
    0xe5a93c, // Sunlit Saffron Gold
    0xd9862b, // Warm Honey Amber
    0xc46925, // Burnished Copper Ochre
    0xb54b24, // Flamboyant Sienna
    0xa38e36, // Sunlit Linden Olive-Gold
    0x962d25, // Deep Scarlet Chestnut
    0x7d3b20, // Venetian Bronze
    0x6e2428, // Burgundy Claret
  ];
  const lateAutumnHex = [
    0xc47a24,
    0xb0541e,
    0x8f3e19,
    0x82281c,
    0x7d6322,
    0x691b18,
    0x592715,
    0x4d171b,
  ];

  const foliageMaterials: THREE.MeshStandardMaterial[] = earlyAutumnHex.map((hex, idx) =>
    trackMat(
      new THREE.MeshStandardMaterial({
        color: hex,
        map: textures.foliageMap,
        normalMap: textures.foliageNormal,
        normalScale: new THREE.Vector2(0.32, 0.32),
        roughness: 0.68 + (idx % 3) * 0.08,
        metalness: 0.03,
      })
    )
  );

  const rootFlareGeo = trackGeo(new THREE.CylinderGeometry(0.42, 0.74, 0.95, 8));
  const surfaceRootGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.18, 1.2, 6));
  const trunkGeo = trackGeo(new THREE.CylinderGeometry(0.28, 0.45, 4.2, 8));
  const limbGeo = trackGeo(new THREE.CylinderGeometry(0.12, 0.24, 3.2, 7));
  const subBranchGeo = trackGeo(new THREE.CylinderGeometry(0.06, 0.12, 2.2, 6));
  const grateGeo = trackGeo(new THREE.RingGeometry(0.65, 1.55, 16));
  grateGeo.rotateX(-Math.PI / 2);
  const treeCurbRingGeo = trackGeo(new THREE.TorusGeometry(1.58, 0.1, 6, 16));
  treeCurbRingGeo.rotateX(Math.PI / 2);

  // Smooth organic foliage clusters
  const canopyClusterGeo = trackGeo(new THREE.IcosahedronGeometry(2.0, 2));
  const fineLeafPuffGeo = trackGeo(new THREE.IcosahedronGeometry(1.12, 2));

  // Hero Tree Positions carefully placed outside all building & cathedral footprints
  // (including Manoir de la Psallette at South-East and Porte Saint-Pierre at North-East)
  const heroTreeCoords: { x: number; z: number; scale: number; paletteOffset: number }[] = [
    // South Allee (Row 1, West of Manoir de la Psallette)
    { x: -38, z: 24.2, scale: 1.16, paletteOffset: 0 },
    { x: -27, z: 24.8, scale: 1.24, paletteOffset: 1 },
    { x: -16, z: 25.0, scale: 1.14, paletteOffset: 2 },
    { x: -5, z: 25.2, scale: 1.22, paletteOffset: 3 },
    { x: 6, z: 25.2, scale: 1.15, paletteOffset: 4 },

    // South Allee (Row 2 in South Lawn, safely North of South Townhouses at z=46)
    { x: -33, z: 32.8, scale: 1.24, paletteOffset: 7 },
    { x: -21, z: 33.0, scale: 1.16, paletteOffset: 2 },
    { x: -9, z: 33.0, scale: 1.26, paletteOffset: 0 },
    { x: 3, z: 32.8, scale: 1.18, paletteOffset: 3 },

    // North Allee (West of Porte Saint-Pierre)
    { x: -38, z: -24.2, scale: 1.2, paletteOffset: 2 },
    { x: -27, z: -24.8, scale: 1.15, paletteOffset: 4 },
    { x: -16, z: -25.0, scale: 1.25, paletteOffset: 1 },
    { x: -5, z: -25.2, scale: 1.18, paletteOffset: 6 },
    { x: -33, z: -32.8, scale: 1.2, paletteOffset: 5 },
    { x: -21, z: -33.0, scale: 1.25, paletteOffset: 1 },
    { x: -9, z: -33.0, scale: 1.18, paletteOffset: 3 },

    // Cours Saint-Pierre & Cours Saint-André East Double Promenade
    { x: 38, z: 17.5, scale: 1.24, paletteOffset: 0 },
    { x: 48, z: 17.5, scale: 1.2, paletteOffset: 3 },
    { x: 58, z: 17.5, scale: 1.22, paletteOffset: 5 },
    { x: 38, z: -17.5, scale: 1.24, paletteOffset: 4 },
    { x: 48, z: -17.5, scale: 1.18, paletteOffset: 1 },
    { x: 58, z: -17.5, scale: 1.22, paletteOffset: 6 },
  ];

  const allPlacedTreeCenters: { x: number; z: number }[] = [];
  const heroCanopyGroups: { group: THREE.Group; phase: number; worldPos: THREE.Vector3 }[] = [];

  for (let i = 0; i < heroTreeCoords.length; i++) {
    const tc = heroTreeCoords[i];
    allPlacedTreeCenters.push({ x: tc.x, z: tc.z });

    const treeGroup = new THREE.Group();
    treeGroup.position.set(tc.x, 0, tc.z);

    const contact = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.02;
    contact.scale.setScalar(tc.scale);
    treeGroup.add(contact);

    const grate = new THREE.Mesh(grateGeo, treeGrateMat);
    grate.position.y = 0.03;
    treeGroup.add(grate);

    const curbRing = new THREE.Mesh(treeCurbRingGeo, curbMat);
    curbRing.position.y = 0.06;
    treeGroup.add(curbRing);

    const rootFlare = new THREE.Mesh(rootFlareGeo, barkMaterial);
    rootFlare.position.y = 0.45 * tc.scale;
    rootFlare.scale.setScalar(tc.scale);
    rootFlare.castShadow = shadowCast;
    rootFlare.receiveShadow = true;
    treeGroup.add(rootFlare);

    for (let r = 0; r < 4; r++) {
      const rAng = (r / 4) * Math.PI * 2 + i * 0.4;
      const sRoot = new THREE.Mesh(surfaceRootGeo, barkMaterial);
      sRoot.scale.setScalar(tc.scale);
      sRoot.position.set(
        Math.cos(rAng) * 0.55 * tc.scale,
        0.22 * tc.scale,
        Math.sin(rAng) * 0.55 * tc.scale
      );
      sRoot.rotation.z = Math.cos(rAng) * 1.1;
      sRoot.rotation.x = -Math.sin(rAng) * 1.1;
      treeGroup.add(sRoot);
    }

    const trunk = new THREE.Mesh(trunkGeo, barkMaterial);
    trunk.position.y = 2.4 * tc.scale;
    trunk.scale.setScalar(tc.scale);
    trunk.castShadow = shadowCast;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    for (let b = 0; b < 4; b++) {
      const angle = (b / 4) * Math.PI * 2 + i * 0.7;
      const limb = new THREE.Mesh(limbGeo, barkMaterial);
      limb.scale.setScalar(tc.scale);
      limb.position.set(
        Math.cos(angle) * 0.78 * tc.scale,
        4.6 * tc.scale,
        Math.sin(angle) * 0.78 * tc.scale
      );
      limb.rotation.z = -Math.cos(angle) * 0.52;
      limb.rotation.x = Math.sin(angle) * 0.52;
      limb.castShadow = shadowCast;
      treeGroup.add(limb);

      const sub = new THREE.Mesh(subBranchGeo, barkMaterial);
      sub.scale.setScalar(tc.scale);
      sub.position.set(
        Math.cos(angle + 0.35) * 1.55 * tc.scale,
        5.55 * tc.scale,
        Math.sin(angle + 0.35) * 1.55 * tc.scale
      );
      sub.rotation.z = -Math.cos(angle + 0.35) * 0.72;
      sub.rotation.x = Math.sin(angle + 0.35) * 0.72;
      treeGroup.add(sub);
    }

    // Multi-Tiered Autumn Crown
    const crownGroup = new THREE.Group();
    const crownY = 6.2 * tc.scale;
    crownGroup.position.y = crownY;

    const clusterOffsets: [number, number, number, number, number][] = [
      [0, 1.45, 0, 1.28, 0.94],
      [1.55, 0.32, 0.82, 1.08, 0.84],
      [-1.48, 0.42, 0.9, 1.1, 0.85],
      [0.42, 0.22, -1.55, 1.08, 0.82],
      [-1.18, -0.15, -1.18, 1.0, 0.78],
      [1.28, -0.25, -0.78, 0.96, 0.76],
      [0.15, 0.86, 1.42, 0.94, 0.76],
      [-0.85, 0.95, -0.25, 0.95, 0.8],
    ];

    for (let c = 0; c < clusterOffsets.length; c++) {
      const [ox, oy, oz, sx, sy] = clusterOffsets[c];
      const matIdx = (tc.paletteOffset + c) % foliageMaterials.length;
      const lobe = new THREE.Mesh(canopyClusterGeo, foliageMaterials[matIdx]);
      lobe.position.set(ox * tc.scale, oy * tc.scale, oz * tc.scale);
      lobe.scale.set(sx * tc.scale, sy * tc.scale, sx * tc.scale);
      lobe.rotation.set(c * 0.5, i * 0.8 + c, c * 0.3);
      lobe.castShadow = shadowCast;
      lobe.receiveShadow = true;
      crownGroup.add(lobe);
    }

    for (let f = 0; f < 6; f++) {
      const fang = (f / 6) * Math.PI * 2 + i * 0.5;
      const matIdx = (tc.paletteOffset + f + 2) % foliageMaterials.length;
      const puff = new THREE.Mesh(fineLeafPuffGeo, foliageMaterials[matIdx]);
      puff.position.set(
        Math.cos(fang) * 2.45 * tc.scale,
        (-0.35 + (f % 2) * 0.65) * tc.scale,
        Math.sin(fang) * 2.45 * tc.scale
      );
      puff.scale.set(1.06 * tc.scale, 0.75 * tc.scale, 1.06 * tc.scale);
      puff.castShadow = shadowCast;
      crownGroup.add(puff);
    }

    treeGroup.add(crownGroup);
    heroCanopyGroups.push({
      group: crownGroup,
      phase: i * 0.65,
      worldPos: new THREE.Vector3(tc.x, crownY + 0.8 * tc.scale, tc.z),
    });
    group.add(treeGroup);
  }

  // ============================================================================
  // 4. OUTER AUTUMN WOODLAND RING (`THREE.InstancedMesh` with strict collision check)
  // ============================================================================
  const outerTreeCoords: { x: number; z: number; scale: number }[] = [];
  const targetOuterCount = 58;
  let attempts = 0;

  while (outerTreeCoords.length < targetOuterCount && attempts < 1000) {
    attempts++;
    const angle = rand() * Math.PI * 2;
    const radius = 48 + rand() * 38;
    const tx = Math.cos(angle) * radius;
    const tz = Math.sin(angle) * radius;
    const sc = 0.92 + rand() * 0.46;

    // 1. Check strict building/monument/sightline collision with 6.0m canopy buffer
    if (!isPositionClearOfBuildings(tx, tz, 6.0)) continue;

    // 2. Check minimum trunk-to-trunk separation (7.5m) against all placed trees
    let tooClose = false;
    for (let j = 0; j < allPlacedTreeCenters.length; j++) {
      const dx = tx - allPlacedTreeCenters[j].x;
      const dz = tz - allPlacedTreeCenters[j].z;
      if (dx * dx + dz * dz < 7.5 * 7.5) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    allPlacedTreeCenters.push({ x: tx, z: tz });
    outerTreeCoords.push({ x: tx, z: tz, scale: sc });
  }

  const outerTreeCount = outerTreeCoords.length;
  const instancedTrunkMesh = new THREE.InstancedMesh(trunkGeo, barkMaterial, outerTreeCount);
  const instancedCrownGeo = trackGeo(new THREE.IcosahedronGeometry(3.0, 2));
  const instancedCrownMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.foliageMap,
      normalMap: textures.foliageNormal,
      normalScale: new THREE.Vector2(0.28, 0.28),
      roughness: 0.72,
      metalness: 0.03,
    })
  );
  const instancedCrownMesh = new THREE.InstancedMesh(
    instancedCrownGeo,
    instancedCrownMat,
    outerTreeCount * 2
  );
  instancedTrunkMesh.castShadow = shadowCast;
  instancedTrunkMesh.receiveShadow = true;
  instancedCrownMesh.castShadow = shadowCast;
  instancedCrownMesh.receiveShadow = true;

  for (let i = 0; i < outerTreeCount; i++) {
    const { x: tx, z: tz, scale: sc } = outerTreeCoords[i];

    _dummy.position.set(tx, 2.1 * sc, tz);
    _dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    _dummy.scale.set(sc, sc, sc);
    _dummy.updateMatrix();
    instancedTrunkMesh.setMatrixAt(i, _dummy.matrix);

    for (let lobe = 0; lobe < 2; lobe++) {
      const idx = i * 2 + lobe;
      _dummy.position.set(
        tx + (lobe === 0 ? 0 : (rand() - 0.5) * 1.6),
        (5.4 + lobe * 1.85) * sc,
        tz + (lobe === 0 ? 0 : (rand() - 0.5) * 1.6)
      );
      _dummy.rotation.set(rand() * 0.5, rand() * Math.PI, rand() * 0.5);
      _dummy.scale.set(sc * (1.08 - lobe * 0.16), sc * 0.82, sc * (1.08 - lobe * 0.16));
      _dummy.updateMatrix();
      instancedCrownMesh.setMatrixAt(idx, _dummy.matrix);

      const cHex = earlyAutumnHex[(i + lobe) % earlyAutumnHex.length];
      _color.setHex(cHex);
      instancedCrownMesh.setColorAt(idx, _color);
    }
  }

  instancedTrunkMesh.instanceMatrix.needsUpdate = true;
  instancedTrunkMesh.computeBoundingSphere();
  instancedCrownMesh.instanceMatrix.needsUpdate = true;
  if (instancedCrownMesh.instanceColor) instancedCrownMesh.instanceColor.needsUpdate = true;
  instancedCrownMesh.computeBoundingSphere();

  group.add(instancedTrunkMesh);
  group.add(instancedCrownMesh);

  // ============================================================================
  // 5. COMPOSITE STREETLAMPS & PARK BENCHES
  // ============================================================================
  const lanternBulbMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfff3d1,
      emissive: new THREE.Color(0xffaa33),
      emissiveIntensity: 0.0,
      roughness: 0.15,
      metalness: 0.1,
    })
  );

  const lampPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.32, 0.0),
    new THREE.Vector2(0.28, 0.35),
    new THREE.Vector2(0.18, 0.9),
    new THREE.Vector2(0.11, 1.2),
    new THREE.Vector2(0.08, 4.2),
    new THREE.Vector2(0.16, 4.35),
    new THREE.Vector2(0.06, 4.5),
  ];
  const lampPostGeo = trackGeo(new THREE.LatheGeometry(lampPoints, 12));
  const lampCrossBarGeo = trackGeo(new THREE.BoxGeometry(0.85, 0.08, 0.08));
  const lanternBulbGeo = trackGeo(new THREE.CylinderGeometry(0.24, 0.16, 0.58, 6));
  const lanternCapGeo = trackGeo(new THREE.ConeGeometry(0.32, 0.32, 6));

  const lampPositions: [number, number][] = [
    [-42, 14.5],
    [-31, 14.5],
    [-20, 19.5],
    [-42, -14.5],
    [-31, -14.5],
    [-20, -19.5],
    [-2, 20.5],
    [10, 20.5],
    [-2, -20.5],
    [35, 13.0],
    [-58, 12.5],
    [-58, -12.5],
  ];

  const streetLights: THREE.PointLight[] = [];

  for (const [lx, lz] of lampPositions) {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(lx, 0, lz);

    const post = new THREE.Mesh(lampPostGeo, castIronMat);
    post.castShadow = shadowCast;
    lampGroup.add(post);

    const crossBar = new THREE.Mesh(lampCrossBarGeo, castIronMat);
    crossBar.position.y = 4.15;
    lampGroup.add(crossBar);

    const bulb = new THREE.Mesh(lanternBulbGeo, lanternBulbMat);
    bulb.position.y = 4.78;
    lampGroup.add(bulb);

    const cap = new THREE.Mesh(lanternCapGeo, castIronMat);
    cap.position.y = 5.22;
    lampGroup.add(cap);

    if (streetLights.length < 6) {
      const pLight = new THREE.PointLight(0xffa940, 0, 18, 1.8);
      pLight.position.set(0, 4.8, 0);
      lampGroup.add(pLight);
      streetLights.push(pLight);
    }

    group.add(lampGroup);
  }

  const benchWoodMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x6e472b,
      roughness: 0.72,
      metalness: 0.08,
    })
  );
  const benchSeatGeo = trackGeo(new THREE.BoxGeometry(2.4, 0.12, 0.55));
  const benchBackGeo = trackGeo(new THREE.BoxGeometry(2.4, 0.52, 0.1));
  const benchLegGeo = trackGeo(new THREE.BoxGeometry(0.12, 0.55, 0.58));

  const benchPlacements: { x: number; z: number; rotY: number }[] = [
    { x: -36.5, z: 15.2, rotY: Math.PI },
    { x: -25.5, z: 15.2, rotY: Math.PI },
    { x: -36.5, z: -15.2, rotY: 0 },
    { x: -25.5, z: -15.2, rotY: 0 },
    { x: -10.5, z: 21.2, rotY: Math.PI },
    { x: -10.5, z: -21.2, rotY: 0 },
  ];

  for (const bp of benchPlacements) {
    const bGroup = new THREE.Group();
    bGroup.position.set(bp.x, 0, bp.z);
    bGroup.rotation.y = bp.rotY;

    const seat = new THREE.Mesh(benchSeatGeo, benchWoodMat);
    seat.position.set(0, 0.52, 0);
    seat.castShadow = shadowCast;
    bGroup.add(seat);

    const back = new THREE.Mesh(benchBackGeo, benchWoodMat);
    back.position.set(0, 0.85, -0.24);
    back.rotation.x = -0.15;
    back.castShadow = shadowCast;
    bGroup.add(back);

    for (const lx of [-0.95, 0.95]) {
      const leg = new THREE.Mesh(benchLegGeo, castIronMat);
      leg.position.set(lx, 0.275, 0);
      bGroup.add(leg);
    }

    group.add(bGroup);
  }

  // ============================================================================
  // 6. SUBTLE BIRDS SYSTEM (Reduced count for calm, poetic realism):
  //    - 7 Tree-to-Tree Birds (mostly perched quietly, occasionally hopping between trees)
  //    - 4 Passing Sky Birds (1 small high-altitude group gliding slowly past)
  // ============================================================================
  const birdBodyGeo = trackGeo(new THREE.ConeGeometry(0.085, 0.4, 6));
  birdBodyGeo.rotateX(Math.PI / 2);
  const birdHeadGeo = trackGeo(new THREE.SphereGeometry(0.07, 6, 6));
  const birdTailGeo = trackGeo(new THREE.BoxGeometry(0.15, 0.02, 0.17));
  const birdWingPanelGeo = trackGeo(new THREE.BoxGeometry(0.36, 0.018, 0.15));

  const birdPlumageMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2c2826,
      roughness: 0.65,
      metalness: 0.08,
    })
  );
  const birdBreastMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8c583a,
      roughness: 0.7,
      metalness: 0.05,
    })
  );

  const createArticulatedBird = (scale = 1.0) => {
    const root = new THREE.Group();
    const body = new THREE.Mesh(birdBodyGeo, birdPlumageMat);
    body.castShadow = shadowCast;
    root.add(body);

    const head = new THREE.Mesh(birdHeadGeo, birdBreastMat);
    head.position.set(0, 0.04, 0.19);
    root.add(head);

    const tail = new THREE.Mesh(birdTailGeo, birdPlumageMat);
    tail.position.set(0, 0.01, -0.23);
    tail.rotation.x = 0.15;
    root.add(tail);

    const leftWing = new THREE.Group();
    leftWing.position.set(0.05, 0.03, 0.02);
    const lFeather = new THREE.Mesh(birdWingPanelGeo, birdPlumageMat);
    lFeather.position.set(0.18, 0, -0.02);
    lFeather.rotation.y = -0.15;
    leftWing.add(lFeather);
    root.add(leftWing);

    const rightWing = new THREE.Group();
    rightWing.position.set(-0.05, 0.03, 0.02);
    const rFeather = new THREE.Mesh(birdWingPanelGeo, birdPlumageMat);
    rFeather.position.set(-0.18, 0, -0.02);
    rFeather.rotation.y = 0.15;
    rightWing.add(rFeather);
    root.add(rightWing);

    root.scale.setScalar(scale);
    return { root, leftWing, rightWing };
  };

  const treeBirds: TreeBirdActor[] = [];
  const treeBirdCount = 7;

  for (let i = 0; i < treeBirdCount; i++) {
    const startIdx = (i * 3) % heroCanopyGroups.length;
    const nextIdx = (startIdx + 1 + Math.floor(rand() * 4)) % heroCanopyGroups.length;
    const { root, leftWing, rightWing } = createArticulatedBird(0.95 + rand() * 0.2);

    const perchPos = heroCanopyGroups[startIdx].worldPos.clone();
    perchPos.x += (rand() - 0.5) * 2.0;
    perchPos.y += (rand() - 0.3) * 1.2;
    perchPos.z += (rand() - 0.5) * 2.0;

    const targetPos = heroCanopyGroups[nextIdx].worldPos.clone();
    targetPos.x += (rand() - 0.5) * 2.0;
    targetPos.y += (rand() - 0.3) * 1.2;
    targetPos.z += (rand() - 0.5) * 2.0;

    const initialFlying = i === 0;
    root.position.copy(perchPos);
    group.add(root);

    treeBirds.push({
      root,
      leftWing,
      rightWing,
      state: initialFlying ? 'flying' : 'perched',
      timer: rand() * 4.0,
      duration: initialFlying ? 2.6 + rand() * 1.4 : 4.5 + rand() * 7.5,
      fromTreeIdx: startIdx,
      toTreeIdx: nextIdx,
      startPos: perchPos,
      endPos: targetPos,
      arcHeight: 2.4 + rand() * 3.2,
      flapPhase: rand() * Math.PI * 2,
    });
  }

  // Single small passing sky flock of 4 birds high above the cathedral
  const skyBirds: SkyBirdActor[] = [];
  const skyFlockCount = 4;
  for (let b = 0; b < skyFlockCount; b++) {
    const { root, leftWing, rightWing } = createArticulatedBird(1.1);
    group.add(root);

    const rank = Math.floor((b + 1) / 2);
    const side = b % 2 === 0 ? 1 : -1;
    skyBirds.push({
      root,
      leftWing,
      rightWing,
      flockCenter: new THREE.Vector3(-8, 34, 2),
      orbitRadiusX: 48,
      orbitRadiusZ: 34,
      baseHeight: 34,
      speed: 0.19,
      angleOffset: -rank * 0.04,
      localOffset: new THREE.Vector3(
        side * rank * 1.3,
        (rand() - 0.5) * 0.8,
        side * rank * 0.9
      ),
      flapPhase: b * 0.7 + rand(),
    });
  }

  // ============================================================================
  // 7. FALLEN LEAVES CARPET (`InstancedMesh`, 1,400 leaves) & SWIRLING LEAVES (450)
  // ============================================================================
  const leafGeo = trackGeo(new THREE.PlaneGeometry(0.32, 0.22));
  const leafMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.62,
      metalness: 0.05,
      side: THREE.DoubleSide,
    })
  );

  const fallenCount = 1400;
  const fallenLeavesMesh = new THREE.InstancedMesh(leafGeo, leafMat, fallenCount);
  fallenLeavesMesh.receiveShadow = true;

  const cathedralPlinthBox = buildingExclusionBoxes[0];

  for (let i = 0; i < fallenCount; i++) {
    const treeRef = heroTreeCoords[i % heroTreeCoords.length];
    const spread = i < 950 ? 1.8 + rand() * 8.0 : 8 + rand() * 24;
    const ang = rand() * Math.PI * 2;
    let lx = treeRef.x + Math.cos(ang) * spread;
    let lz = treeRef.z + Math.sin(ang) * spread;

    if (
      lx > cathedralPlinthBox.minX + 2 &&
      lx < cathedralPlinthBox.maxX - 2 &&
      lz > cathedralPlinthBox.minZ + 2 &&
      lz < cathedralPlinthBox.maxZ - 2
    ) {
      lz = lz >= 0 ? cathedralPlinthBox.maxZ + 1.5 : cathedralPlinthBox.minZ - 1.5;
    }

    const sc = 0.65 + rand() * 0.95;
    _dummy.position.set(lx, 0.03 + (i % 5) * 0.003, lz);
    _dummy.rotation.set(-Math.PI / 2 + (rand() - 0.5) * 0.22, rand() * Math.PI * 2, 0);
    _dummy.scale.set(sc, sc, sc);
    _dummy.updateMatrix();
    fallenLeavesMesh.setMatrixAt(i, _dummy.matrix);

    _color.setHex(earlyAutumnHex[i % earlyAutumnHex.length]);
    fallenLeavesMesh.setColorAt(i, _color);
  }
  fallenLeavesMesh.instanceMatrix.needsUpdate = true;
  if (fallenLeavesMesh.instanceColor) fallenLeavesMesh.instanceColor.needsUpdate = true;
  fallenLeavesMesh.computeBoundingSphere();
  group.add(fallenLeavesMesh);

  const airLeafCount = 450;
  const airLeavesMesh = new THREE.InstancedMesh(leafGeo, leafMat, airLeafCount);
  airLeavesMesh.frustumCulled = false;

  const airLeavesData: FallingLeafData[] = [];
  for (let i = 0; i < airLeafCount; i++) {
    const treeRef = heroTreeCoords[i % heroTreeCoords.length];
    const x = treeRef.x + (rand() - 0.5) * 16;
    const y = 1.0 + rand() * 14.5;
    const z = treeRef.z + (rand() - 0.5) * 16;
    const scale = 0.7 + rand() * 0.85;

    airLeavesData.push({
      x,
      y,
      z,
      vx: 0.6 + rand() * 1.1,
      vy: 0.65 + rand() * 0.85,
      vz: (rand() - 0.5) * 0.9,
      rx: rand() * Math.PI * 2,
      ry: rand() * Math.PI * 2,
      rz: rand() * Math.PI * 2,
      phase: rand() * Math.PI * 2,
      scale,
    });

    _color.setHex(earlyAutumnHex[i % earlyAutumnHex.length]);
    airLeavesMesh.setColorAt(i, _color);
  }
  if (airLeavesMesh.instanceColor) airLeavesMesh.instanceColor.needsUpdate = true;
  group.add(airLeavesMesh);

  const setAutumnTone = (maturity: number) => {
    const t = THREE.MathUtils.clamp(maturity, 0, 1);
    for (let i = 0; i < foliageMaterials.length; i++) {
      _baseColor.setHex(earlyAutumnHex[i]);
      _lateColor.setHex(lateAutumnHex[i]);
      foliageMaterials[i].color.copy(_baseColor).lerp(_lateColor, t);
    }

    for (let i = 0; i < outerTreeCount * 2; i++) {
      const idx = i % earlyAutumnHex.length;
      _baseColor.setHex(earlyAutumnHex[idx]);
      _lateColor.setHex(lateAutumnHex[idx]);
      _color.copy(_baseColor).lerp(_lateColor, t);
      instancedCrownMesh.setColorAt(i, _color);
    }
    if (instancedCrownMesh.instanceColor) instancedCrownMesh.instanceColor.needsUpdate = true;
  };

  const updateAnimation = (elapsed: number, delta: number, windStrength: number) => {
    const dt = Math.min(delta, 0.1);
    const wind = 0.35 + windStrength * 1.65;

    skyUniforms.uTime.value = elapsed;

    // 1. Gentle wind sway on Hero Tree Canopies
    for (let i = 0; i < heroCanopyGroups.length; i++) {
      const hc = heroCanopyGroups[i];
      hc.group.rotation.z = Math.sin(elapsed * 1.4 * wind + hc.phase) * 0.026 * wind;
      hc.group.rotation.x = Math.cos(elapsed * 1.1 * wind + hc.phase) * 0.02 * wind;
    }

    // 2. Tree-to-Tree Birds (calm perching & occasional flights from tree to tree)
    for (let i = 0; i < treeBirds.length; i++) {
      const tb = treeBirds[i];
      tb.timer += dt;

      if (tb.state === 'perched') {
        tb.leftWing.rotation.z = -0.55 + Math.sin(elapsed * 3.0 + tb.flapPhase) * 0.04;
        tb.rightWing.rotation.z = 0.55 - Math.sin(elapsed * 3.0 + tb.flapPhase) * 0.04;
        tb.root.position.y =
          tb.startPos.y + Math.abs(Math.sin(elapsed * 4.2 + tb.flapPhase)) * 0.06;
        tb.root.rotation.y += Math.sin(elapsed * 2.2 + i) * 0.006;

        if (tb.timer >= tb.duration) {
          tb.state = 'flying';
          tb.timer = 0;
          tb.fromTreeIdx = tb.toTreeIdx;
          const hopStep = 1 + ((i + Math.floor(elapsed)) % 4);
          tb.toTreeIdx = (tb.fromTreeIdx + hopStep) % heroCanopyGroups.length;

          tb.startPos.copy(tb.root.position);
          const targetCrown = heroCanopyGroups[tb.toTreeIdx].worldPos;
          tb.endPos.set(
            targetCrown.x + Math.sin(elapsed + i) * 1.5,
            targetCrown.y + Math.cos(elapsed * 0.7 + i) * 1.0,
            targetCrown.z + Math.cos(elapsed + i) * 1.5
          );
          const dist = tb.startPos.distanceTo(tb.endPos);
          tb.duration = Math.max(1.8, Math.min(4.4, dist / 9.0));
          tb.arcHeight = 2.2 + Math.min(4.2, dist * 0.15);
        }
      } else {
        const u = Math.min(1.0, tb.timer / tb.duration);
        const smoothU = u * u * (3 - 2 * u);

        _birdPos.lerpVectors(tb.startPos, tb.endPos, smoothU);
        _birdPos.y += Math.sin(u * Math.PI) * tb.arcHeight;
        tb.root.position.copy(_birdPos);

        const nextU = Math.min(1.0, u + 0.03);
        const smoothNextU = nextU * nextU * (3 - 2 * nextU);
        _birdNextPos.lerpVectors(tb.startPos, tb.endPos, smoothNextU);
        _birdNextPos.y += Math.sin(nextU * Math.PI) * tb.arcHeight;

        const dx = _birdNextPos.x - _birdPos.x;
        const dy = _birdNextPos.y - _birdPos.y;
        const dz = _birdNextPos.z - _birdPos.z;
        if (dx * dx + dz * dz > 0.00001) {
          tb.root.rotation.y = Math.atan2(dx, dz);
          tb.root.rotation.x = -Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * 0.65;
        }

        const flap = Math.sin(elapsed * 16.0 + tb.flapPhase) * 0.7;
        tb.leftWing.rotation.z = flap;
        tb.rightWing.rotation.z = -flap;

        if (u >= 1.0) {
          tb.state = 'perched';
          tb.timer = 0;
          tb.duration = 5.0 + ((i * 2.1) % 6.5);
          tb.startPos.copy(tb.endPos);
          tb.root.rotation.x = 0;
        }
      }
    }

    // 3. Single Small Passing Sky Flock
    for (let i = 0; i < skyBirds.length; i++) {
      const sb = skyBirds[i];
      const ang = elapsed * sb.speed + sb.angleOffset;
      const nextAng = ang + sb.speed * 0.05;

      const x = sb.flockCenter.x + Math.cos(ang) * sb.orbitRadiusX + sb.localOffset.x;
      const z = sb.flockCenter.z + Math.sin(ang) * sb.orbitRadiusZ + sb.localOffset.z;
      const y =
        sb.baseHeight +
        Math.sin(ang * 2.0 + sb.flapPhase) * 2.0 +
        sb.localOffset.y;

      const nx = sb.flockCenter.x + Math.cos(nextAng) * sb.orbitRadiusX + sb.localOffset.x;
      const nz = sb.flockCenter.z + Math.sin(nextAng) * sb.orbitRadiusZ + sb.localOffset.z;

      sb.root.position.set(x, y, z);
      sb.root.rotation.y = Math.atan2(nx - x, nz - z);
      sb.root.rotation.z = -sb.speed * 0.6;

      const glideCycle = Math.sin(elapsed * 1.6 + sb.flapPhase);
      const flapAmp = glideCycle > -0.15 ? 0.65 : 0.1;
      const flap = Math.sin(elapsed * 12.5 + sb.flapPhase) * flapAmp;
      sb.leftWing.rotation.z = flap;
      sb.rightWing.rotation.z = -flap;
    }

    // 4. Swirling Autumn Leaves in the Breeze
    for (let i = 0; i < airLeafCount; i++) {
      const leaf = airLeavesData[i];
      leaf.y -= leaf.vy * dt * (0.7 + wind * 0.45);
      leaf.x += (leaf.vx * wind + Math.sin(elapsed * 2.1 + leaf.phase) * 1.2) * dt;
      leaf.z += (leaf.vz * wind + Math.cos(elapsed * 1.8 + leaf.phase) * 1.1) * dt;

      leaf.rx += dt * 2.4 * wind;
      leaf.ry += dt * 1.9 * wind;
      leaf.rz += dt * 1.5 * wind;

      if (leaf.y < 0.12) {
        const treeRef = heroTreeCoords[i % heroTreeCoords.length];
        leaf.y = 7.5 + (i % 7) * 1.1;
        leaf.x = treeRef.x + Math.sin(leaf.phase + elapsed) * 6.0;
        leaf.z = treeRef.z + Math.cos(leaf.phase + elapsed) * 6.0;
      }

      _dummy.position.set(leaf.x, leaf.y, leaf.z);
      _dummy.rotation.set(leaf.rx, leaf.ry, leaf.rz);
      _dummy.scale.setScalar(leaf.scale);
      _dummy.updateMatrix();
      airLeavesMesh.setMatrixAt(i, _dummy.matrix);
    }
    airLeavesMesh.instanceMatrix.needsUpdate = true;
  };

  return {
    group,
    skyUniforms,
    lanternBulbMat,
    townhouseWindowMat,
    streetLights,
    updateAnimation,
    setAutumnTone,
    dispose: () => {
      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
    },
  };
}

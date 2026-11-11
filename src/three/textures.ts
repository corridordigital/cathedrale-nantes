import * as THREE from 'three';

export interface ProceduralTextureSet {
  tuffeauMap: THREE.CanvasTexture;
  tuffeauNormal: THREE.CanvasTexture;
  slateMap: THREE.CanvasTexture;
  slateNormal: THREE.CanvasTexture;
  stainedGlassMap: THREE.CanvasTexture;
  cobbleMap: THREE.CanvasTexture;
  cobbleNormal: THREE.CanvasTexture;
  cobbleRoughness: THREE.CanvasTexture;
  barkMap: THREE.CanvasTexture;
  foliageMap: THREE.CanvasTexture;
  foliageNormal: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Converts a grayscale height canvas into a tangent-space RGB normal map canvas
 */
function createNormalCanvasFromHeight(heightCanvas: HTMLCanvasElement, strength = 2.5): HTMLCanvasElement {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const srcCtx = heightCanvas.getContext('2d')!;
  const srcData = srcCtx.getImageData(0, 0, w, h).data;

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = w;
  normalCanvas.height = h;
  const dstCtx = normalCanvas.getContext('2d')!;
  const dstImg = dstCtx.createImageData(w, h);
  const dstData = dstImg.data;

  const sample = (x: number, y: number): number => {
    const wx = (x + w) % w;
    const wy = (y + h) % h;
    return srcData[(wy * w + wx) * 4] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dX = (sample(x + 1, y) - sample(x - 1, y)) * strength;
      const dY = (sample(x, y + 1) - sample(x, y - 1)) * strength;
      let nx = -dX;
      let ny = dY;
      let nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * w + x) * 4;
      dstData[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
      dstData[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      dstData[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      dstData[idx + 3] = 255;
    }
  }

  dstCtx.putImageData(dstImg, 0, 0);
  return normalCanvas;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  let seed = 1434;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // ============================================================================
  // 1. FINELY DRESSED TUFFEAU LIMESTONE MASONRY (Albedo + Tangent Normal Map)
  // ============================================================================
  const tuffeauCanvas = document.createElement('canvas');
  tuffeauCanvas.width = 512;
  tuffeauCanvas.height = 512;
  const tCtx = tuffeauCanvas.getContext('2d')!;

  const tuffeauHeightCanvas = document.createElement('canvas');
  tuffeauHeightCanvas.width = 512;
  tuffeauHeightCanvas.height = 512;
  const thCtx = tuffeauHeightCanvas.getContext('2d')!;

  // Mortar base
  tCtx.fillStyle = '#ddd4c3';
  tCtx.fillRect(0, 0, 512, 512);
  thCtx.fillStyle = '#555555';
  thCtx.fillRect(0, 0, 512, 512);

  const rows = 16;
  const cols = 8;
  const rowH = 512 / rows;
  const colW = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (colW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * colW + offset;
      const y = r * rowH;

      const v = rand();
      const baseL = 235 + Math.floor((v - 0.5) * 16);
      const warmR = Math.min(255, baseL + 9);
      const warmG = Math.min(255, baseL + 4);
      const warmB = Math.max(195, baseL - 10);

      tCtx.fillStyle = `rgb(${warmR}, ${warmG}, ${warmB})`;
      tCtx.fillRect(x + 1.5, y + 1.5, colW - 3, rowH - 3);

      // Subtle diagonal stone-chisel tooling lines inside each ashlar block
      tCtx.strokeStyle = 'rgba(205, 195, 175, 0.25)';
      tCtx.lineWidth = 1;
      for (let s = 4; s < colW - 4; s += 6) {
        tCtx.beginPath();
        tCtx.moveTo(x + s, y + 3);
        tCtx.lineTo(x + Math.max(2, s - 6), y + rowH - 3);
        tCtx.stroke();
      }

      const hVal = 190 + Math.floor((v - 0.5) * 45);
      thCtx.fillStyle = `rgb(${hVal}, ${hVal}, ${hVal})`;
      thCtx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);
    }
  }

  // Fine mineral grain & subtle golden lichen patina
  for (let i = 0; i < 4500; i++) {
    const gx = rand() * 512;
    const gy = rand() * 512;
    tCtx.fillStyle =
      rand() > 0.45 ? 'rgba(255,253,246,0.24)' : 'rgba(175,155,125,0.16)';
    tCtx.fillRect(gx, gy, 2, 2);
  }

  const tuffeauMap = new THREE.CanvasTexture(tuffeauCanvas);
  tuffeauMap.colorSpace = THREE.SRGBColorSpace;
  tuffeauMap.wrapS = THREE.RepeatWrapping;
  tuffeauMap.wrapT = THREE.RepeatWrapping;
  tuffeauMap.repeat.set(3, 3);
  tuffeauMap.anisotropy = maxAnisotropy;

  const tuffeauNormalCanvas = createNormalCanvasFromHeight(tuffeauHeightCanvas, 2.6);
  const tuffeauNormal = new THREE.CanvasTexture(tuffeauNormalCanvas);
  tuffeauNormal.colorSpace = THREE.NoColorSpace;
  tuffeauNormal.wrapS = THREE.RepeatWrapping;
  tuffeauNormal.wrapT = THREE.RepeatWrapping;
  tuffeauNormal.repeat.set(3, 3);
  tuffeauNormal.anisotropy = maxAnisotropy;

  // ============================================================================
  // 2. ANJOU BLUE-GREY SCALLOPED SLATE ROOF TILES (Albedo + Normal Map)
  // ============================================================================
  const slateCanvas = document.createElement('canvas');
  slateCanvas.width = 512;
  slateCanvas.height = 512;
  const sCtx = slateCanvas.getContext('2d')!;

  const slateHeightCanvas = document.createElement('canvas');
  slateHeightCanvas.width = 512;
  slateHeightCanvas.height = 512;
  const shCtx = slateHeightCanvas.getContext('2d')!;

  sCtx.fillStyle = '#232b38';
  sCtx.fillRect(0, 0, 512, 512);
  shCtx.fillStyle = '#404040';
  shCtx.fillRect(0, 0, 512, 512);

  const sRows = 24;
  const sCols = 16;
  const sH = 512 / sRows;
  const sW = 512 / sCols;

  for (let r = 0; r < sRows; r++) {
    const off = (r % 2) * (sW * 0.5);
    for (let c = -1; c <= sCols; c++) {
      const sx = c * sW + off;
      const sy = r * sH;
      const sv = rand();
      const sr = 36 + Math.floor(sv * 20);
      const sg = 45 + Math.floor(sv * 22);
      const sb = 59 + Math.floor(sv * 26);
      sCtx.fillStyle = `rgb(${sr}, ${sg}, ${sb})`;
      sCtx.fillRect(sx + 1, sy + 1, sW - 2, sH - 2);

      // Subtle highlight along bottom overlap edge of each slate tile
      sCtx.fillStyle = 'rgba(140, 165, 195, 0.16)';
      sCtx.fillRect(sx + 1, sy + sH - 3, sW - 2, 1.5);

      const bVal = 140 + Math.floor(sv * 95);
      shCtx.fillStyle = `rgb(${bVal}, ${bVal}, ${bVal})`;
      shCtx.fillRect(sx + 1.5, sy + 1.5, sW - 3, sH - 3);
    }
  }

  const slateMap = new THREE.CanvasTexture(slateCanvas);
  slateMap.colorSpace = THREE.SRGBColorSpace;
  slateMap.wrapS = THREE.RepeatWrapping;
  slateMap.wrapT = THREE.RepeatWrapping;
  slateMap.repeat.set(6, 4);
  slateMap.anisotropy = maxAnisotropy;

  const slateNormalCanvas = createNormalCanvasFromHeight(slateHeightCanvas, 3.0);
  const slateNormal = new THREE.CanvasTexture(slateNormalCanvas);
  slateNormal.colorSpace = THREE.NoColorSpace;
  slateNormal.wrapS = THREE.RepeatWrapping;
  slateNormal.wrapT = THREE.RepeatWrapping;
  slateNormal.repeat.set(6, 4);
  slateNormal.anisotropy = maxAnisotropy;

  // ============================================================================
  // 3. LUMINOUS GOTHIC STAINED GLASS ROSE & LANCET TEXTURE
  // ============================================================================
  const glassCanvas = document.createElement('canvas');
  glassCanvas.width = 512;
  glassCanvas.height = 512;
  const gCtx = glassCanvas.getContext('2d')!;

  gCtx.fillStyle = '#0f131d';
  gCtx.fillRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;
  const stainedPalette = [
    '#f59e0b', // Luminous Amber
    '#dc2626', // Chartres Ruby
    '#2563eb', // Cobalt Sapphire
    '#fbbf24', // Sunlit Gold
    '#9333ea', // Royal Amethyst
    '#059669', // Emerald
    '#ea580c', // Fiery Vermilion
  ];

  const petals = 24;
  for (let ring = 5; ring >= 1; ring--) {
    const radius = ring * 45;
    for (let p = 0; p < petals; p++) {
      const a0 = (p / petals) * Math.PI * 2;
      const a1 = ((p + 1) / petals) * Math.PI * 2;
      gCtx.beginPath();
      gCtx.moveTo(cx, cy);
      gCtx.arc(cx, cy, radius, a0, a1);
      gCtx.closePath();
      gCtx.fillStyle = stainedPalette[(p + ring * 3) % stainedPalette.length];
      gCtx.fill();
      gCtx.lineWidth = 3.5;
      gCtx.strokeStyle = '#141210';
      gCtx.stroke();
    }
  }

  for (let r = 36; r <= 225; r += 38) {
    gCtx.beginPath();
    gCtx.arc(cx, cy, r, 0, Math.PI * 2);
    gCtx.lineWidth = 5;
    gCtx.strokeStyle = '#141210';
    gCtx.stroke();
  }

  const stainedGlassMap = new THREE.CanvasTexture(glassCanvas);
  stainedGlassMap.colorSpace = THREE.SRGBColorSpace;
  stainedGlassMap.anisotropy = maxAnisotropy;

  // ============================================================================
  // 4. NANTES GRANITE COBBLESTONES (Albedo + Normal + Dew/Puddle Roughness Map)
  // ============================================================================
  const cobbleCanvas = document.createElement('canvas');
  cobbleCanvas.width = 512;
  cobbleCanvas.height = 512;
  const cCtx = cobbleCanvas.getContext('2d')!;

  const cobbleHeightCanvas = document.createElement('canvas');
  cobbleHeightCanvas.width = 512;
  cobbleHeightCanvas.height = 512;
  const chCtx = cobbleHeightCanvas.getContext('2d')!;

  const cobbleRoughCanvas = document.createElement('canvas');
  cobbleRoughCanvas.width = 512;
  cobbleRoughCanvas.height = 512;
  const crCtx = cobbleRoughCanvas.getContext('2d')!;

  cCtx.fillStyle = '#4e4740';
  cCtx.fillRect(0, 0, 512, 512);
  chCtx.fillStyle = '#383838';
  chCtx.fillRect(0, 0, 512, 512);
  crCtx.fillStyle = '#d8d8d8'; // High roughness for mortar
  crCtx.fillRect(0, 0, 512, 512);

  const cRows = 24;
  const cCols = 24;
  const cw = 512 / cCols;
  const ch = 512 / cRows;

  for (let r = 0; r < cRows; r++) {
    const off = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cCols; c++) {
      const px = c * cw + off;
      const py = r * ch;
      const v = rand();
      const base = 96 + Math.floor((v - 0.5) * 34);
      const warmShift = Math.floor((rand() - 0.35) * 16);
      cCtx.fillStyle = `rgb(${base + warmShift}, ${base - 1}, ${base - 7})`;
      cCtx.beginPath();
      cCtx.roundRect(px + 1.5, py + 1.5, cw - 3, ch - 3, 3.5);
      cCtx.fill();

      const bVal = 155 + Math.floor(v * 90);
      chCtx.fillStyle = `rgb(${bVal}, ${bVal}, ${bVal})`;
      chCtx.beginPath();
      chCtx.roundRect(px + 2, py + 2, cw - 4, ch - 4, 3.5);
      chCtx.fill();

      // Varied stone polish roughness (some cobblestones are worn smooth and reflective)
      const rVal = 115 + Math.floor(v * 95);
      crCtx.fillStyle = `rgb(${rVal}, ${rVal}, ${rVal})`;
      crCtx.beginPath();
      crCtx.roundRect(px + 1.5, py + 1.5, cw - 3, ch - 3, 3.5);
      crCtx.fill();
    }
  }

  // Add subtle damp autumn dew patches on the roughness map (darker = smoother/wetter reflection)
  for (let p = 0; p < 8; p++) {
    const px = rand() * 512;
    const py = rand() * 512;
    const pr = 40 + rand() * 75;
    const rGrad = crCtx.createRadialGradient(px, py, 4, px, py, pr);
    rGrad.addColorStop(0, 'rgba(35, 35, 35, 0.75)');
    rGrad.addColorStop(1, 'rgba(160, 160, 160, 0.0)');
    crCtx.fillStyle = rGrad;
    crCtx.fillRect(0, 0, 512, 512);
  }

  // Embedded autumn leaf flecks on the cobblestones
  const leafPalette = ['#f59e0b', '#d97706', '#b45309', '#9a3412', '#eab308', '#dc2626'];
  for (let i = 0; i < 220; i++) {
    const lx = rand() * 512;
    const ly = rand() * 512;
    cCtx.fillStyle = leafPalette[Math.floor(rand() * leafPalette.length)];
    cCtx.beginPath();
    cCtx.ellipse(lx, ly, 3.8, 2.2, rand() * Math.PI, 0, Math.PI * 2);
    cCtx.fill();
  }

  const cobbleMap = new THREE.CanvasTexture(cobbleCanvas);
  cobbleMap.colorSpace = THREE.SRGBColorSpace;
  cobbleMap.wrapS = THREE.RepeatWrapping;
  cobbleMap.wrapT = THREE.RepeatWrapping;
  cobbleMap.repeat.set(18, 18);
  cobbleMap.anisotropy = maxAnisotropy;

  const cobbleNormalCanvas = createNormalCanvasFromHeight(cobbleHeightCanvas, 2.8);
  const cobbleNormal = new THREE.CanvasTexture(cobbleNormalCanvas);
  cobbleNormal.colorSpace = THREE.NoColorSpace;
  cobbleNormal.wrapS = THREE.RepeatWrapping;
  cobbleNormal.wrapT = THREE.RepeatWrapping;
  cobbleNormal.repeat.set(18, 18);
  cobbleNormal.anisotropy = maxAnisotropy;

  const cobbleRoughness = new THREE.CanvasTexture(cobbleRoughCanvas);
  cobbleRoughness.colorSpace = THREE.NoColorSpace;
  cobbleRoughness.wrapS = THREE.RepeatWrapping;
  cobbleRoughness.wrapT = THREE.RepeatWrapping;
  cobbleRoughness.repeat.set(18, 18);
  cobbleRoughness.anisotropy = maxAnisotropy;

  // ============================================================================
  // 5. PLATANE & MARRONNIER EXFOLIATING BARK TEXTURE
  // ============================================================================
  const barkCanvas = document.createElement('canvas');
  barkCanvas.width = 256;
  barkCanvas.height = 256;
  const bCtx = barkCanvas.getContext('2d')!;
  bCtx.fillStyle = '#4c3e32';
  bCtx.fillRect(0, 0, 256, 256);

  const barkPatches = ['#3b2f26', '#665645', '#786854', '#42362b', '#594b3b'];
  for (let i = 0; i < 180; i++) {
    const bx = rand() * 256;
    const by = rand() * 256;
    const bw = 6 + rand() * 18;
    const bh = 22 + rand() * 55;
    bCtx.fillStyle = barkPatches[Math.floor(rand() * barkPatches.length)];
    bCtx.beginPath();
    bCtx.roundRect(bx, by, bw, bh, 4);
    bCtx.fill();
  }

  const barkMap = new THREE.CanvasTexture(barkCanvas);
  barkMap.colorSpace = THREE.SRGBColorSpace;
  barkMap.wrapS = THREE.RepeatWrapping;
  barkMap.wrapT = THREE.RepeatWrapping;
  barkMap.anisotropy = maxAnisotropy;

  // ============================================================================
  // 6. ORGANIC MOTTLED LEAF CLUSTER TEXTURE + NORMAL MAP FOR TREE CANOPIES
  // ============================================================================
  const foliageCanvas = document.createElement('canvas');
  foliageCanvas.width = 256;
  foliageCanvas.height = 256;
  const fCtx = foliageCanvas.getContext('2d')!;

  const foliageHeightCanvas = document.createElement('canvas');
  foliageHeightCanvas.width = 256;
  foliageHeightCanvas.height = 256;
  const fhCtx = foliageHeightCanvas.getContext('2d')!;

  fCtx.fillStyle = '#d4c8b0';
  fCtx.fillRect(0, 0, 256, 256);
  fhCtx.fillStyle = '#505050';
  fhCtx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 650; i++) {
    const lx = rand() * 256;
    const ly = rand() * 256;
    const rx = 4 + rand() * 9;
    const ry = 2.5 + rand() * 5.5;
    const rot = rand() * Math.PI;
    const lum = 185 + Math.floor(rand() * 70);
    const warmR = Math.min(255, lum + 12);
    const warmG = Math.min(255, lum + 2);
    const warmB = Math.max(120, lum - 28);
    fCtx.fillStyle = `rgb(${warmR}, ${warmG}, ${warmB})`;
    fCtx.beginPath();
    fCtx.ellipse(lx, ly, rx, ry, rot, 0, Math.PI * 2);
    fCtx.fill();

    const hLum = 90 + Math.floor(rand() * 155);
    fhCtx.fillStyle = `rgb(${hLum}, ${hLum}, ${hLum})`;
    fhCtx.beginPath();
    fhCtx.ellipse(lx, ly, rx, ry, rot, 0, Math.PI * 2);
    fhCtx.fill();
  }

  const foliageMap = new THREE.CanvasTexture(foliageCanvas);
  foliageMap.colorSpace = THREE.SRGBColorSpace;
  foliageMap.wrapS = THREE.RepeatWrapping;
  foliageMap.wrapT = THREE.RepeatWrapping;
  foliageMap.repeat.set(2, 2);
  foliageMap.anisotropy = maxAnisotropy;

  const foliageNormalCanvas = createNormalCanvasFromHeight(foliageHeightCanvas, 2.2);
  const foliageNormal = new THREE.CanvasTexture(foliageNormalCanvas);
  foliageNormal.colorSpace = THREE.NoColorSpace;
  foliageNormal.wrapS = THREE.RepeatWrapping;
  foliageNormal.wrapT = THREE.RepeatWrapping;
  foliageNormal.repeat.set(2, 2);
  foliageNormal.anisotropy = maxAnisotropy;

  // ============================================================================
  // 7. SOFT RADIAL CONTACT SHADOW TEXTURE
  // ============================================================================
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const shdCtx = shadowCanvas.getContext('2d')!;
  const grad = shdCtx.createRadialGradient(128, 128, 12, 128, 128, 124);
  grad.addColorStop(0, 'rgba(15, 10, 5, 0.68)');
  grad.addColorStop(0.55, 'rgba(15, 10, 5, 0.30)');
  grad.addColorStop(1, 'rgba(15, 10, 5, 0.0)');
  shdCtx.fillStyle = grad;
  shdCtx.fillRect(0, 0, 256, 256);

  const contactShadowMap = new THREE.CanvasTexture(shadowCanvas);
  contactShadowMap.colorSpace = THREE.SRGBColorSpace;

  return {
    tuffeauMap,
    tuffeauNormal,
    slateMap,
    slateNormal,
    stainedGlassMap,
    cobbleMap,
    cobbleNormal,
    cobbleRoughness,
    barkMap,
    foliageMap,
    foliageNormal,
    contactShadowMap,
    dispose: () => {
      tuffeauMap.dispose();
      tuffeauNormal.dispose();
      slateMap.dispose();
      slateNormal.dispose();
      stainedGlassMap.dispose();
      cobbleMap.dispose();
      cobbleNormal.dispose();
      cobbleRoughness.dispose();
      barkMap.dispose();
      foliageMap.dispose();
      foliageNormal.dispose();
      contactShadowMap.dispose();
    },
  };
}

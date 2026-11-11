import * as THREE from 'three';
import { AtmospherePreset } from '../types/scene';

interface SolarKeyframe {
  hour: number;
  phaseLabel: string;
  skyColor: string;
  horizonColor: string;
  fogDensity: number;
  sunColor: string;
  sunIntensity: number;
  hemiSkyColor: string;
  hemiGroundColor: string;
  hemiIntensity: number;
  rimColor: string;
  rimIntensity: number;
  exposure: number;
  lanternGlow: number;
  stainedGlassGlow: number;
}

// Continuous 24-hour atmospheric keyframes for Nantes in Autumn (47.218°N, 1.553°W)
const SOLAR_KEYFRAMES: SolarKeyframe[] = [
  {
    hour: 0.0,
    phaseLabel: 'Nuit profonde',
    skyColor: '#0a0f1d',
    horizonColor: '#151d2e',
    fogDensity: 0.0055,
    sunColor: '#5c7bb0',
    sunIntensity: 0.38,
    hemiSkyColor: '#1f2d4a',
    hemiGroundColor: '#1c140e',
    hemiIntensity: 0.52,
    rimColor: '#ffb866',
    rimIntensity: 0.85,
    exposure: 0.96,
    lanternGlow: 1.55,
    stainedGlassGlow: 1.5,
  },
  {
    hour: 6.0,
    phaseLabel: 'Fin de nuit',
    skyColor: '#12192e',
    horizonColor: '#252842',
    fogDensity: 0.0062,
    sunColor: '#7a8ec2',
    sunIntensity: 0.5,
    hemiSkyColor: '#2c395c',
    hemiGroundColor: '#241a14',
    hemiIntensity: 0.6,
    rimColor: '#ffba70',
    rimIntensity: 0.8,
    exposure: 0.98,
    lanternGlow: 1.35,
    stainedGlassGlow: 1.3,
  },
  {
    hour: 7.25,
    phaseLabel: 'Aube sur la Loire',
    skyColor: '#4c5f8a',
    horizonColor: '#e09a78',
    fogDensity: 0.0078,
    sunColor: '#ffb07a',
    sunIntensity: 1.45,
    hemiSkyColor: '#8ba0c4',
    hemiGroundColor: '#543c2c',
    hemiIntensity: 0.95,
    rimColor: '#ffc288',
    rimIntensity: 1.0,
    exposure: 1.04,
    lanternGlow: 0.65,
    stainedGlassGlow: 0.7,
  },
  {
    hour: 8.5,
    phaseLabel: 'Matin nacré',
    skyColor: '#8cb2d9',
    horizonColor: '#e6d8c5',
    fogDensity: 0.0065,
    sunColor: '#ffe6bd',
    sunIntensity: 2.25,
    hemiSkyColor: '#b8cfe6',
    hemiGroundColor: '#6e5842',
    hemiIntensity: 1.2,
    rimColor: '#ffe8c2',
    rimIntensity: 0.95,
    exposure: 1.08,
    lanternGlow: 0.1,
    stainedGlassGlow: 0.3,
  },
  {
    hour: 10.5,
    phaseLabel: 'Matinée lumineuse',
    skyColor: '#5e94cc',
    horizonColor: '#dfd6c7',
    fogDensity: 0.0036,
    sunColor: '#fff1d6',
    sunIntensity: 2.95,
    hemiSkyColor: '#a3c6e8',
    hemiGroundColor: '#785e44',
    hemiIntensity: 1.32,
    rimColor: '#ffdfad',
    rimIntensity: 1.0,
    exposure: 1.12,
    lanternGlow: 0.0,
    stainedGlassGlow: 0.22,
  },
  {
    hour: 12.75,
    phaseLabel: 'Zénith d’automne',
    skyColor: '#4d86c4',
    horizonColor: '#d9d0c1',
    fogDensity: 0.0032,
    sunColor: '#fff5e0',
    sunIntensity: 3.25,
    hemiSkyColor: '#9ec4eb',
    hemiGroundColor: '#7d6246',
    hemiIntensity: 1.38,
    rimColor: '#ffe4b8',
    rimIntensity: 1.05,
    exposure: 1.14,
    lanternGlow: 0.0,
    stainedGlassGlow: 0.2,
  },
  {
    hour: 15.25,
    phaseLabel: 'Après-midi doré',
    skyColor: '#6799cc',
    horizonColor: '#e3cfb4',
    fogDensity: 0.0038,
    sunColor: '#ffe4ad',
    sunIntensity: 3.15,
    hemiSkyColor: '#9dc0e6',
    hemiGroundColor: '#735338',
    hemiIntensity: 1.28,
    rimColor: '#ffd694',
    rimIntensity: 1.1,
    exposure: 1.13,
    lanternGlow: 0.0,
    stainedGlassGlow: 0.25,
  },
  {
    hour: 16.75,
    phaseLabel: 'Heure dorée',
    skyColor: '#789bc4',
    horizonColor: '#e8c49b',
    fogDensity: 0.0044,
    sunColor: '#ffd285',
    sunIntensity: 3.05,
    hemiSkyColor: '#98b8db',
    hemiGroundColor: '#6b4a2e',
    hemiIntensity: 1.2,
    rimColor: '#ffc878',
    rimIntensity: 1.2,
    exposure: 1.11,
    lanternGlow: 0.15,
    stainedGlassGlow: 0.4,
  },
  {
    hour: 18.0,
    phaseLabel: 'Crépuscule flamboyant',
    skyColor: '#3d304c',
    horizonColor: '#cc6f45',
    fogDensity: 0.0054,
    sunColor: '#ff8842',
    sunIntensity: 2.55,
    hemiSkyColor: '#7c5b78',
    hemiGroundColor: '#452b1f',
    hemiIntensity: 0.92,
    rimColor: '#ff9b59',
    rimIntensity: 1.32,
    exposure: 1.05,
    lanternGlow: 0.9,
    stainedGlassGlow: 0.95,
  },
  {
    hour: 19.25,
    phaseLabel: 'Heure bleue',
    skyColor: '#182138',
    horizonColor: '#4a3c54',
    fogDensity: 0.0058,
    sunColor: '#7c8ec4',
    sunIntensity: 0.75,
    hemiSkyColor: '#34446b',
    hemiGroundColor: '#261b14',
    hemiIntensity: 0.65,
    rimColor: '#ffba6e',
    rimIntensity: 0.95,
    exposure: 1.0,
    lanternGlow: 1.4,
    stainedGlassGlow: 1.35,
  },
  {
    hour: 21.0,
    phaseLabel: 'Nocturne illuminé',
    skyColor: '#0d1321',
    horizonColor: '#182133',
    fogDensity: 0.0058,
    sunColor: '#607eb5',
    sunIntensity: 0.42,
    hemiSkyColor: '#243352',
    hemiGroundColor: '#1f1610',
    hemiIntensity: 0.55,
    rimColor: '#ffbb6e',
    rimIntensity: 0.9,
    exposure: 0.98,
    lanternGlow: 1.55,
    stainedGlassGlow: 1.48,
  },
  {
    hour: 24.0,
    phaseLabel: 'Nuit profonde',
    skyColor: '#0a0f1d',
    horizonColor: '#151d2e',
    fogDensity: 0.0055,
    sunColor: '#5c7bb0',
    sunIntensity: 0.38,
    hemiSkyColor: '#1f2d4a',
    hemiGroundColor: '#1c140e',
    hemiIntensity: 0.52,
    rimColor: '#ffb866',
    rimIntensity: 0.85,
    exposure: 0.96,
    lanternGlow: 1.55,
    stainedGlassGlow: 1.5,
  },
];

const _c1 = new THREE.Color();
const _c2 = new THREE.Color();

function lerpHex(hex1: string, hex2: string, t: number): string {
  _c1.set(hex1);
  _c2.set(hex2);
  _c1.lerp(_c2, t);
  return `#${_c1.getHexString()}`;
}

export function getDecimalHoursFromDate(date: Date = new Date()): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

export function formatExactTimeLabel(decimalHours: number, isLive: boolean): string {
  const normalized = ((decimalHours % 24) + 24) % 24;
  const hours = Math.floor(normalized);
  const totalMinutes = (normalized - hours) * 60;
  const minutes = Math.floor(totalMinutes);
  const seconds = Math.floor((totalMinutes - minutes) * 60);

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return isLive ? `${hh}:${mm}:${ss}` : `${hh}h${mm}`;
}

/**
 * Computes realistic solar coordinates and atmospheric lighting for Nantes at any hour of the day
 */
export function computeAtmosphereForHour(
  decimalHours: number,
  isLive = true
): AtmospherePreset {
  const h = ((decimalHours % 24) + 24) % 24;

  let k0 = SOLAR_KEYFRAMES[0];
  let k1 = SOLAR_KEYFRAMES[SOLAR_KEYFRAMES.length - 1];

  for (let i = 0; i < SOLAR_KEYFRAMES.length - 1; i++) {
    if (h >= SOLAR_KEYFRAMES[i].hour && h <= SOLAR_KEYFRAMES[i + 1].hour) {
      k0 = SOLAR_KEYFRAMES[i];
      k1 = SOLAR_KEYFRAMES[i + 1];
      break;
    }
  }

  const span = Math.max(0.0001, k1.hour - k0.hour);
  const rawT = THREE.MathUtils.clamp((h - k0.hour) / span, 0, 1);
  // Smoothstep for natural transitions
  const t = rawT * rawT * (3 - 2 * rawT);

  // Solar trajectory across Nantes sky:
  // East (+X) at 7:00 -> South (+Z, high Y) at 12:45 -> West (-X) at 18:15
  let sunPosition: [number, number, number];
  if (h >= 6.5 && h <= 19.0) {
    const dayFraction = (h - 6.5) / 12.5; // 0 at dawn (East), 0.5 at solar noon (South), 1 at dusk (West)
    const azimuth = (dayFraction - 0.5) * Math.PI * 0.92; // -0.46π (East) to +0.46π (West)
    const elevation = Math.sin(dayFraction * Math.PI) * 0.72 + 0.14; // Autumn max elevation ~48°
    const radius = 78;
    const horizDist = Math.cos(elevation) * radius;
    const sx = -Math.sin(azimuth) * horizDist; // Dawn: +X (East), Noon: 0, Dusk: -X (West)
    const sy = Math.max(12, Math.sin(elevation) * radius);
    const sz = Math.cos(azimuth) * horizDist * 0.85 + 14; // Southerly arc (+Z)
    sunPosition = [sx, sy, sz];
  } else {
    // Moonlight / high nocturnal key position
    sunPosition = [-32, 48, -30];
  }

  const phaseLabel = t < 0.5 ? k0.phaseLabel : k1.phaseLabel;
  const clockStr = formatExactTimeLabel(h, isLive);

  return {
    id: 'temps_reel',
    label: isLive ? 'Heure Actuelle (Direct)' : 'Heure Personnalisée',
    timeLabel: `${clockStr} · ${phaseLabel}`,
    skyColor: lerpHex(k0.skyColor, k1.skyColor, t),
    horizonColor: lerpHex(k0.horizonColor, k1.horizonColor, t),
    fogDensity: THREE.MathUtils.lerp(k0.fogDensity, k1.fogDensity, t),
    sunColor: lerpHex(k0.sunColor, k1.sunColor, t),
    sunIntensity: THREE.MathUtils.lerp(k0.sunIntensity, k1.sunIntensity, t),
    sunPosition,
    hemiSkyColor: lerpHex(k0.hemiSkyColor, k1.hemiSkyColor, t),
    hemiGroundColor: lerpHex(k0.hemiGroundColor, k1.hemiGroundColor, t),
    hemiIntensity: THREE.MathUtils.lerp(k0.hemiIntensity, k1.hemiIntensity, t),
    rimColor: lerpHex(k0.rimColor, k1.rimColor, t),
    rimIntensity: THREE.MathUtils.lerp(k0.rimIntensity, k1.rimIntensity, t),
    exposure: THREE.MathUtils.lerp(k0.exposure, k1.exposure, t),
    lanternGlow: THREE.MathUtils.lerp(k0.lanternGlow, k1.lanternGlow, t),
    stainedGlassGlow: THREE.MathUtils.lerp(k0.stainedGlassGlow, k1.stainedGlassGlow, t),
  };
}

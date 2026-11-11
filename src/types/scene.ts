export type AtmosphereId =
  | 'temps_reel'
  | 'octobre_dore'
  | 'brume_loire'
  | 'crepuscule'
  | 'nocturne';

export type CameraPresetId =
  | 'parvis_overview'
  | 'facade_occidentale'
  | 'allee_automnale'
  | 'arcs_boutants_sud'
  | 'chevet_porte_st_pierre'
  | 'vue_aerienne'
  | 'parvis_insolite';

export interface EasterEggState {
  dinosaurs: boolean;
  zombies: boolean;
  zemmour: boolean;
}

export interface CameraPreset {
  id: CameraPresetId;
  label: string;
  shortLabel: string;
  position: [number, number, number];
  target: [number, number, number];
  description: string;
  secretOnly?: boolean;
}

export interface AtmospherePreset {
  id: AtmosphereId;
  label: string;
  timeLabel: string;
  skyColor: string;
  horizonColor: string;
  fogDensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  hemiSkyColor: string;
  hemiGroundColor: string;
  hemiIntensity: number;
  rimColor: string;
  rimIntensity: number;
  exposure: number;
  lanternGlow: number;
  stainedGlassGlow: number;
  defaultHour?: number;
}

export interface ArchitecturalPOI {
  id: string;
  title: string;
  subtitle: string;
  yearOrMetric: string;
  description: string;
  worldPosition: [number, number, number];
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
}

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'parvis_overview',
    label: 'Grande Perspective (Parvis)',
    shortLabel: 'Ensemble',
    position: [-68, 22, 48],
    target: [-3, 12.5, 0],
    description: 'Vue d’ensemble dézoomée embrassant la façade occidentale, les tours de 38 m, les arcs-boutants, la flèche et le quartier historique de la Place Saint-Pierre.',
  },
  {
    id: 'facade_occidentale',
    label: 'Façade Occidentale',
    shortLabel: 'Façade',
    position: [-50, 9.5, 6],
    target: [-16, 13.5, 0],
    description: 'Vue monumentale en contre-plongée sur le triple portail flamboyant et les deux tours carrées en tuffeau blanc de 38 mètres.',
  },
  {
    id: 'allee_automnale',
    label: 'Allée des Marronniers',
    shortLabel: 'Sous-bois',
    position: [-28, 5.5, 31],
    target: [-5, 11, 2],
    description: 'Promenade sous la voûte dorée et pourpre des grands arbres d’automne bordant les pavés de granit nantais.',
  },
  {
    id: 'arcs_boutants_sud',
    label: 'Arcs-Boutants & Nef',
    shortLabel: 'Nef Sud',
    position: [4, 15, 38],
    target: [2, 12, 0],
    description: 'Élévation latérale révélant les volées d’arcs-boutants gothiques, les pinacles sculptés et le bras du transept sud.',
  },
  {
    id: 'chevet_porte_st_pierre',
    label: 'Chevet & Cours Saint-Pierre',
    shortLabel: 'Chevet Est',
    position: [44, 15, -28],
    target: [8, 10, 0],
    description: 'Le chœur rayonnant à chapelles absidiales, les vestiges de la Porte Saint-Pierre et les frondaisons du Cours Saint-Pierre.',
  },
  {
    id: 'vue_aerienne',
    label: 'Panorama Aérien',
    shortLabel: 'Aérien',
    position: [-52, 42, -44],
    target: [0, 8, 0],
    description: 'Vue cavalière embrassant le plan en croix latine, la haute toiture d’ardoise angevine et la couronne d’arbres en automne.',
  },
  {
    id: 'parvis_insolite',
    label: 'Défilé Insolite du Parvis',
    shortLabel: 'Insolite',
    position: [-43, 6.2, 13],
    target: [-31, 3.2, 1],
    description: 'Cadrage rapproché au ras des pavés sur les créatures et personnages du menu secret.',
    secretOnly: true,
  },
];

export const ATMOSPHERE_PRESETS: Record<AtmosphereId, AtmospherePreset> = {
  temps_reel: {
    id: 'temps_reel',
    label: 'Heure Actuelle',
    timeLabel: 'En direct · Soleil réel',
    skyColor: '#5b8ec9',
    horizonColor: '#dfd3c0',
    fogDensity: 0.0036,
    sunColor: '#fff1d6',
    sunIntensity: 3.1,
    sunPosition: [-25, 48, 52],
    hemiSkyColor: '#9ec4eb',
    hemiGroundColor: '#75583c',
    hemiIntensity: 1.32,
    rimColor: '#ffe0b2',
    rimIntensity: 1.05,
    exposure: 1.12,
    lanternGlow: 0.0,
    stainedGlassGlow: 0.25,
  },
  octobre_dore: {
    id: 'octobre_dore',
    label: "Soleil d'Octobre",
    timeLabel: '16h30 · Lumière dorée',
    skyColor: '#6999cc',
    horizonColor: '#e6ceb0',
    fogDensity: 0.004,
    sunColor: '#ffdc9c',
    sunIntensity: 3.1,
    sunPosition: [-55, 40, 48],
    hemiSkyColor: '#9bc0e6',
    hemiGroundColor: '#6e4e32',
    hemiIntensity: 1.26,
    rimColor: '#ffd28a',
    rimIntensity: 1.12,
    exposure: 1.12,
    lanternGlow: 0.0,
    stainedGlassGlow: 0.28,
    defaultHour: 16.5,
  },
  brume_loire: {
    id: 'brume_loire',
    label: 'Brume de Loire',
    timeLabel: '08h15 · Matin nacré',
    skyColor: '#9ab6d4',
    horizonColor: '#e3d9cc',
    fogDensity: 0.0075,
    sunColor: '#ffe8c4',
    sunIntensity: 2.1,
    sunPosition: [52, 28, 38],
    hemiSkyColor: '#c2d3e3',
    hemiGroundColor: '#786149',
    hemiIntensity: 1.32,
    rimColor: '#e6eff7',
    rimIntensity: 0.88,
    exposure: 1.08,
    lanternGlow: 0.2,
    stainedGlassGlow: 0.35,
    defaultHour: 8.25,
  },
  crepuscule: {
    id: 'crepuscule',
    label: 'Crépuscule Flamboyant',
    timeLabel: '18h15 · Heure ambrée',
    skyColor: '#3a2c47',
    horizonColor: '#c96e46',
    fogDensity: 0.0052,
    sunColor: '#ff8a47',
    sunIntensity: 2.75,
    sunPosition: [-68, 18, 28],
    hemiSkyColor: '#7d5c78',
    hemiGroundColor: '#452b1f',
    hemiIntensity: 0.95,
    rimColor: '#ff9d5c',
    rimIntensity: 1.35,
    exposure: 1.05,
    lanternGlow: 0.88,
    stainedGlassGlow: 0.92,
    defaultHour: 18.25,
  },
  nocturne: {
    id: 'nocturne',
    label: 'Nocturne Patrimoine',
    timeLabel: '21h30 · Illumination',
    skyColor: '#0c1220',
    horizonColor: '#172032',
    fogDensity: 0.0056,
    sunColor: '#6482b8',
    sunIntensity: 0.45,
    sunPosition: [-30, 50, -35],
    hemiSkyColor: '#263554',
    hemiGroundColor: '#1f1610',
    hemiIntensity: 0.56,
    rimColor: '#ffbb6e',
    rimIntensity: 0.92,
    exposure: 0.98,
    lanternGlow: 1.52,
    stainedGlassGlow: 1.48,
    defaultHour: 21.5,
  },
};

export const ARCHITECTURAL_POIS: ArchitecturalPOI[] = [
  {
    id: 'portail_occidental',
    title: 'Triple Portail Gothique Flamboyant',
    subtitle: 'Façade occidentale · Première pierre posée en 1434',
    yearOrMetric: '1434 · Jean V de Bretagne & Guillaume de Malestroit',
    description:
      'Érigé sous l’impulsion du duc Jean V de Bretagne, le triple portail à voussures finement sculptées dans la pierre blanche de tuffeau illustre l’apogée du gothique flamboyant ligérien.',
    worldPosition: [-21.5, 6.0, 0],
    cameraPosition: [-35, 6.5, 6],
    cameraTarget: [-19, 6.5, 0],
  },
  {
    id: 'tours_jumelles',
    title: 'Tours Jumelles & Beffrois en Tuffeau',
    subtitle: 'Tour Nord et Tour Sud à terrasses à balustrades',
    yearOrMetric: '38 m de hauteur · Bourdon de 5,6 tonnes',
    description:
      'Contrairement aux flèches normandes, les deux tours massives s’achèvent par des terrasses couronnées de balustrades ajourées et de pinacles d’angle, abritant l’horloge et les huit cloches historiques.',
    worldPosition: [-19.5, 23.5, 7.8],
    cameraPosition: [-38, 22, 18],
    cameraTarget: [-18, 20, 5],
  },
  {
    id: 'grande_nef',
    title: 'Grande Nef & Voûtes de Tuffeau',
    subtitle: 'Vaisseau central plus élevé que Notre-Dame de Paris',
    yearOrMetric: '37,5 m sous voûte · 103 m de longueur interne',
    description:
      'Avec ses 37,5 mètres sous clef de voûte (contre 33 m à Paris), la nef de Nantes frappe par son élancement vertical exceptionnel et sa toiture en ardoise bleue d’Anjou reconstruite après 1972.',
    worldPosition: [-2.0, 23.0, 0],
    cameraPosition: [-16, 26, 26],
    cameraTarget: [-2, 16, 0],
  },
  {
    id: 'arcs_boutants',
    title: 'Arcs-Boutants à Double Volée & Pinacles',
    subtitle: 'Contreforts extérieurs et gargouilles sculptées',
    yearOrMetric: '14 travées latérales · Équilibre des poussées',
    description:
      'Les culées extérieures coiffées de hauts pinacles à crochets reprennent la poussée des voûtes d’ogives au-dessus des bas-côtés et des chapelles latérales.',
    worldPosition: [1.5, 15.5, 11.2],
    cameraPosition: [9, 16, 26],
    cameraTarget: [1, 13, 6],
  },
  {
    id: 'chevet_choeur',
    title: 'Chœur, Chevet & Porte Saint-Pierre',
    subtitle: 'Achèvement néogothique du XIXe siècle (1891)',
    yearOrMetric: '457 ans de chantier (1434 – 1891)',
    description:
      'Le chevet à chapelles rayonnantes achève la cathédrale en 1891 après plus de quatre siècles de travaux, jouxtant les vestiges gallo-romains de la Porte Saint-Pierre et les frondaisons du Cours.',
    worldPosition: [21.0, 12.0, -4.0],
    cameraPosition: [36, 14, -18],
    cameraTarget: [15, 10, -2],
  },
  {
    id: 'couronne_automnale',
    title: 'Platanes & Marronniers de la Place Saint-Pierre',
    subtitle: 'Écrin végétal d’automne au cœur historique de Nantes',
    yearOrMetric: 'Feuillage ambre, ocre, cuivre et carmin',
    description:
      'À la fin octobre, les alignements d’arbres du parvis et du Cours Saint-Pierre offrent un contraste saisissant entre leurs feuillages fauves et la blancheur lumineuse du tuffeau nantais.',
    worldPosition: [-25.0, 8.5, 17.5],
    cameraPosition: [-36, 10, 29],
    cameraTarget: [-18, 9, 10],
  },
];

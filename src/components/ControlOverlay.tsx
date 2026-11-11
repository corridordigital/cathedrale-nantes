import React, { useEffect, useState } from 'react';
import {
  Bell,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Compass,
  Eye,
  Footprints,
  KeyRound,
  Landmark,
  Layers,
  RotateCw,
  Skull,
  Sparkles,
  Sun,
  UserCheck,
  Volume2,
  VolumeX,
  Wind,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  ARCHITECTURAL_POIS,
  ATMOSPHERE_PRESETS,
  AtmosphereId,
  CAMERA_PRESETS,
  CameraPresetId,
  EasterEggState,
} from '../types/scene';
import {
  computeAtmosphereForHour,
  formatExactTimeLabel,
  getDecimalHoursFromDate,
} from '../utils/solarTime';

interface ControlOverlayProps {
  cameraPreset: CameraPresetId;
  onSelectCameraPreset: (id: CameraPresetId) => void;
  onZoom: (factor: number) => void;
  atmosphereId: AtmosphereId;
  onSelectAtmosphere: (id: AtmosphereId) => void;
  customHour: number | null;
  onChangeCustomHour: (hour: number | null) => void;
  autumnMaturity: number;
  onChangeAutumnMaturity: (val: number) => void;
  windStrength: number;
  onChangeWindStrength: (val: number) => void;
  autoOrbit: boolean;
  onToggleAutoOrbit: () => void;
  cutawayMode: boolean;
  onToggleCutawayMode: () => void;
  easterEgg: EasterEggState;
  onChangeEasterEgg: (next: EasterEggState) => void;
  selectedPoiId: string | null;
  onSelectPoi: (id: string | null) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onRingBell: () => void;
}

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  cameraPreset,
  onSelectCameraPreset,
  onZoom,
  atmosphereId,
  onSelectAtmosphere,
  customHour,
  onChangeCustomHour,
  autumnMaturity,
  onChangeAutumnMaturity,
  windStrength,
  onChangeWindStrength,
  autoOrbit,
  onToggleAutoOrbit,
  cutawayMode,
  onToggleCutawayMode,
  easterEgg,
  onChangeEasterEgg,
  selectedPoiId,
  onSelectPoi,
  audioEnabled,
  onToggleAudio,
  onRingBell,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'vues' | 'lumiere' | 'patrimoine'>('vues');
  const [secretMenuOpen, setSecretMenuOpen] = useState(false);
  const [liveDecimalHour, setLiveDecimalHour] = useState<number>(() => getDecimalHoursFromDate());

  // Update live clock every second
  useEffect(() => {
    const interval = window.setInterval(() => {
      setLiveDecimalHour(getDecimalHoursFromDate());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const anyEasterEggActive = easterEgg.dinosaurs || easterEgg.zombies || easterEgg.zemmour;
  const visibleCameraPresets = CAMERA_PRESETS.filter(
    (p) => !p.secretOnly || anyEasterEggActive
  );

  const isRealTimeActive = atmosphereId === 'temps_reel' && customHour === null;
  const displayedAtmo =
    customHour !== null
      ? computeAtmosphereForHour(customHour, false)
      : atmosphereId === 'temps_reel'
        ? computeAtmosphereForHour(liveDecimalHour, true)
        : ATMOSPHERE_PRESETS[atmosphereId];

  const sliderHourValue =
    customHour !== null
      ? customHour
      : atmosphereId === 'temps_reel'
        ? liveDecimalHour
        : ATMOSPHERE_PRESETS[atmosphereId].defaultHour ?? 16.5;

  const activePoi = ARCHITECTURAL_POIS.find((p) => p.id === selectedPoiId) || null;
  const activeCamera = CAMERA_PRESETS.find((c) => c.id === cameraPreset);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setIsCollapsed((prev) => !prev);
      } else if (e.key === 'e' || e.key === 'E') {
        setSecretMenuOpen((prev) => !prev);
      } else if (e.key === '+' || e.key === '=') {
        onZoom(0.8);
      } else if (e.key === '-' || e.key === '_') {
        onZoom(1.25);
      } else if (e.key === 'Escape') {
        if (secretMenuOpen) {
          setSecretMenuOpen(false);
        } else if (selectedPoiId) {
          onSelectPoi(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPoiId, onSelectPoi, secretMenuOpen, onZoom]);

  const handleCyclePoi = (dir: 1 | -1) => {
    if (!selectedPoiId) {
      onSelectPoi(ARCHITECTURAL_POIS[0].id);
      return;
    }
    const idx = ARCHITECTURAL_POIS.findIndex((p) => p.id === selectedPoiId);
    const nextIdx = (idx + dir + ARCHITECTURAL_POIS.length) % ARCHITECTURAL_POIS.length;
    onSelectPoi(ARCHITECTURAL_POIS[nextIdx].id);
  };

  const handleToggleSingleEgg = (key: keyof EasterEggState) => {
    const next = { ...easterEgg, [key]: !easterEgg[key] };
    onChangeEasterEgg(next);
  };

  const handleSummonAll = () => {
    onChangeEasterEgg({ dinosaurs: true, zombies: true, zemmour: true });
    onSelectPoi(null);
    onSelectCameraPreset('parvis_insolite');
  };

  const handleDismissAll = () => {
    onChangeEasterEgg({ dinosaurs: false, zombies: false, zemmour: false });
    if (cameraPreset === 'parvis_insolite') {
      onSelectCameraPreset('parvis_overview');
    }
  };

  const handleActivateRealTime = () => {
    onChangeCustomHour(null);
    onSelectAtmosphere('temps_reel');
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between">
      {/* Top Minimal Architectural Title & Unboxed Spec Header */}
      <header className="px-6 pt-5 flex items-start justify-between gap-4 flex-wrap">
        <div className="pointer-events-auto bg-stone-950/88 border border-stone-800/80 px-5 py-3.5 rounded-xl shadow-lg max-w-xl">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-stone-100 leading-tight">
            Cathédrale Saint-Pierre-et-Saint-Paul de Nantes
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-400">
            <button
              type="button"
              onClick={() => setSecretMenuOpen((prev) => !prev)}
              className="hover:text-amber-300 transition-colors cursor-pointer"
              title="1434 – Pierre secrète du maître d'œuvre"
            >
              Gothique flamboyant (1434–1891)
            </button>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">Tours 38 m</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">Voûtes 37,5 m</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-300/95 font-mono-tabular">{displayedAtmo.timeLabel}</span>
          </div>
        </div>

        {/* Single Primary Action Cluster in Top Right */}
        <div className="pointer-events-auto flex items-center gap-2 bg-stone-950/88 border border-stone-800/80 p-1.5 rounded-xl shadow-lg">
          <button
            type="button"
            onClick={handleActivateRealTime}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isRealTimeActive
                ? 'bg-amber-950/85 border-amber-500/80 text-amber-200'
                : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
            title="Synchroniser le soleil, le ciel et l'horloge de la tour Nord sur l'heure actuelle exacte"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono-tabular">
              {isRealTimeActive
                ? `Heure actuelle (${formatExactTimeLabel(liveDecimalHour, true)})`
                : 'Heure actuelle'}
            </span>
          </button>

          <button
            type="button"
            onClick={onRingBell}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-amber-200 hover:text-white bg-amber-950/70 hover:bg-amber-900/80 border border-amber-700/40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Faire sonner le grand bourdon de la Cathédrale"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Sonner le bourdon</span>
          </button>

          <button
            type="button"
            onClick={onToggleAudio}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              audioEnabled
                ? 'bg-stone-800 text-amber-300 border border-stone-700'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
            title="Activer ou couper le vent d'automne et les cloches"
          >
            {audioEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">{audioEnabled ? 'Son actif' : 'Ambiance'}</span>
          </button>
        </div>
      </header>

      {/* Unified Collapsible Bottom Control Dock */}
      <div
        className="w-full flex flex-col items-center px-3 pb-4"
        style={{ maxWidth: 'min(960px, 95vw)', margin: '0 auto' }}
      >
        {/* Secret Easter Egg Drawer (Hidden by default) */}
        {secretMenuOpen && (
          <div className="pointer-events-auto w-full mb-2.5 bg-stone-950/95 border border-amber-700/60 rounded-xl px-5 py-4 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <div>
                  <h2 className="text-sm font-semibold text-amber-200">
                    Cabinet Secret des Gargouilles (Easter Egg)
                  </h2>
                  <p className="text-[11px] text-stone-400">
                    Invoquez ou retirez les apparitions insolites sur le parvis de la Place Saint-Pierre
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSummonAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-600/60 rounded-lg transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Tout invoquer sur le parvis</span>
                </button>
                {anyEasterEggActive && (
                  <button
                    type="button"
                    onClick={handleDismissAll}
                    className="px-3 py-1.5 text-xs font-medium bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Tout dissiper
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSecretMenuOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-100 bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                  aria-label="Fermer le menu secret"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => handleToggleSingleEgg('dinosaurs')}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  easterEgg.dinosaurs
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                    : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Footprints className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">Dinosaures en promenade</div>
                    <div className="text-[11px] text-stone-400 truncate">
                      T-Rex, 2 Brachiosaures & 2 Tricératops
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono-tabular px-2 py-0.5 rounded border ${
                    easterEgg.dinosaurs
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                      : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >
                  {easterEgg.dinosaurs ? 'ACTIF' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleSingleEgg('zombies')}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  easterEgg.zombies
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                    : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Skull className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">Horde de Zombies</div>
                    <div className="text-[11px] text-stone-400 truncate">
                      12 marcheurs titubants sur les pavés
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono-tabular px-2 py-0.5 rounded border ${
                    easterEgg.zombies
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                      : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >
                  {easterEgg.zombies ? 'ACTIF' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleSingleEgg('zemmour')}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  easterEgg.zemmour
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                    : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">Éric Zemmour (Grosse Tête)</div>
                    <div className="text-[11px] text-stone-400 truncate">
                      Pupitre & caricature sur le parvis
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono-tabular px-2 py-0.5 rounded border ${
                    easterEgg.zemmour
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                      : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >
                  {easterEgg.zemmour ? 'ACTIF' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        )}

        {activePoi && !isCollapsed && (
          <div className="pointer-events-auto w-full mb-2.5 bg-stone-950/92 border border-amber-800/50 rounded-xl px-5 py-3.5 shadow-xl transition-transform duration-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-amber-400/90">
                  <span>{activePoi.subtitle}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular text-stone-400">{activePoi.yearOrMetric}</span>
                </div>
                <h2 className="text-lg font-semibold text-stone-100 mt-0.5">{activePoi.title}</h2>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed max-w-3xl">
                  {activePoi.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCyclePoi(-1)}
                  className="p-2 text-stone-400 hover:text-stone-100 bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                  aria-label="Point d'intérêt précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCyclePoi(1)}
                  className="p-2 text-stone-400 hover:text-stone-100 bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                  aria-label="Point d'intérêt suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPoi(null)}
                  className="p-2 text-stone-400 hover:text-stone-100 bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                  aria-label="Fermer la fiche"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collapse / Expand Toggle Handle + Discreet Secret Key Trigger */}
        <div className="pointer-events-auto flex items-center justify-center gap-1.5 mb-1.5">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-stone-300 hover:text-white bg-stone-950/92 hover:bg-stone-900 border border-stone-800/90 rounded-lg shadow-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Afficher les commandes (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                <span>Mode contemplation (H)</span>
              </>
            )}
          </button>

          {/* Discreet hidden Easter egg button */}
          <button
            type="button"
            onClick={() => setSecretMenuOpen((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              secretMenuOpen || anyEasterEggActive
                ? 'bg-amber-950/90 border-amber-600/70 text-amber-300 opacity-100'
                : 'bg-stone-950/75 border-stone-800/60 text-stone-500 opacity-35 hover:opacity-100 hover:text-amber-300 hover:border-stone-700'
            }`}
            title="Cabinet secret (E)"
            aria-label="Ouvrir le menu caché (Easter Egg)"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Bottom Dock Container */}
        {!isCollapsed && (
          <section
            aria-label="Commandes de la scène 3D"
            className="pointer-events-auto w-full bg-stone-950/92 border border-stone-800/90 rounded-2xl p-3.5 shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800/80">
              <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('vues')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'vues'
                      ? 'bg-stone-800 text-amber-300 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Angles & Caméra</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('lumiere')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'lumiere'
                      ? 'bg-stone-800 text-amber-300 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Heure & Atmosphère</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('patrimoine')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'patrimoine'
                      ? 'bg-stone-800 text-amber-300 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Détails & Architecture ({ARCHITECTURAL_POIS.length})</span>
                </button>
              </div>

              {/* Right Quick Controls: Zoom -/+, Foliage Slider, Wind Slider, Cutaway Voûtes & Auto-Orbit */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => onZoom(1.25)}
                    className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
                    title="Dézoomer (-)"
                    aria-label="Dézoomer"
                  >
                    <ZoomOut className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                  <span className="text-[11px] text-stone-400 px-1.5 select-none">Zoom</span>
                  <button
                    type="button"
                    onClick={() => onZoom(0.78)}
                    className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
                    title="Zoomer (+)"
                    aria-label="Zoomer"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>

                <label className="flex items-center gap-1.5 text-xs text-stone-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="whitespace-nowrap">Feuillage :</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={autumnMaturity}
                    onChange={(e) => onChangeAutumnMaturity(parseFloat(e.target.value))}
                    className="w-14 accent-amber-500 cursor-pointer"
                    aria-label="Maturité du feuillage d'automne"
                  />
                </label>

                <label className="flex items-center gap-1.5 text-xs text-stone-300">
                  <Wind className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="whitespace-nowrap">Brise :</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={windStrength}
                    onChange={(e) => onChangeWindStrength(parseFloat(e.target.value))}
                    className="w-14 accent-amber-500 cursor-pointer"
                    aria-label="Intensité du vent d'automne"
                  />
                </label>

                <button
                  type="button"
                  onClick={onToggleCutawayMode}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    cutawayMode
                      ? 'bg-amber-950/85 border-amber-600/70 text-amber-200'
                      : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white'
                  }`}
                  title="Ouvrir la toiture et la nef sud pour inspecter les voûtes d'ogives (37,5 m) et le tombeau de François II"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>{cutawayMode ? 'Vue Extérieure' : 'Coupe / Voûtes'}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleAutoOrbit}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    autoOrbit
                      ? 'bg-amber-950/80 border-amber-700/60 text-amber-200'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotation 360°</span>
                </button>
              </div>
            </div>

            {/* Bottom Row: Active Tab Content */}
            <div className="pt-3">
              {activeTab === 'vues' && (
                <div className="flex flex-col gap-2">
                  <div
                    className={`grid grid-cols-2 sm:grid-cols-3 ${
                      visibleCameraPresets.length > 6 ? 'md:grid-cols-7' : 'md:grid-cols-6'
                    } gap-2`}
                  >
                    {visibleCameraPresets.map((preset) => {
                      const isActive = cameraPreset === preset.id && !selectedPoiId;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            onSelectPoi(null);
                            onSelectCameraPreset(preset.id);
                          }}
                          className={`px-3 py-2 rounded-xl text-left border transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-amber-950/75 border-amber-600/70 text-amber-200'
                              : 'bg-stone-900/90 border-stone-800/80 text-stone-300 hover:bg-stone-800/80 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-semibold whitespace-nowrap truncate">
                            {preset.shortLabel}
                          </div>
                          <div className="text-[11px] text-stone-400 truncate mt-0.5">
                            {preset.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {activeCamera && !selectedPoiId && (
                    <div className="flex items-center justify-between text-xs text-stone-400 px-1 pt-0.5">
                      <span>{activeCamera.description}</span>
                      <span className="hidden md:inline text-stone-500 whitespace-nowrap ml-4">
                        Glisser pour orbiter · Molette pour zoomer · Clic sur un repère doré
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'lumiere' && (
                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(Object.keys(ATMOSPHERE_PRESETS) as AtmosphereId[]).map((id) => {
                      const isLivePreset = id === 'temps_reel';
                      const atmo = isLivePreset
                        ? computeAtmosphereForHour(liveDecimalHour, true)
                        : ATMOSPHERE_PRESETS[id];
                      const isSelected = atmosphereId === id && customHour === null;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            onChangeCustomHour(null);
                            onSelectAtmosphere(id);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                              : 'bg-stone-900/90 border-stone-800/80 text-stone-300 hover:bg-stone-800/80'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                              {isLivePreset && <Clock className="w-3 h-3 text-amber-400 shrink-0" />}
                              <span>{atmo.label}</span>
                            </div>
                            <div className="text-[11px] text-stone-400 font-mono-tabular truncate mt-0.5">
                              {atmo.timeLabel}
                            </div>
                          </div>
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: atmo.sunColor }}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Interactive 24h Solar Time Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/85 border border-stone-800/80 rounded-xl px-3.5 py-2">
                    <div className="flex items-center gap-2 text-xs text-stone-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Course solaire (24h) :</span>
                      <span className="font-mono-tabular text-amber-300 font-medium">
                        {formatExactTimeLabel(sliderHourValue, isRealTimeActive)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-1 max-w-md">
                      <span className="text-[11px] font-mono-tabular text-stone-500">00h</span>
                      <input
                        type="range"
                        min={0}
                        max={23.95}
                        step={0.05}
                        value={sliderHourValue}
                        onChange={(e) => onChangeCustomHour(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                        aria-label="Choisir l'heure exacte de la journée"
                      />
                      <span className="text-[11px] font-mono-tabular text-stone-500">24h</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleActivateRealTime}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer ${
                        isRealTimeActive
                          ? 'bg-amber-900/60 border-amber-500/70 text-amber-200'
                          : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-300'
                      }`}
                    >
                      Synchroniser l’heure actuelle
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'patrimoine' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {ARCHITECTURAL_POIS.map((poi, idx) => {
                    const isSelected = selectedPoiId === poi.id;
                    return (
                      <button
                        key={poi.id}
                        type="button"
                        onClick={() => onSelectPoi(isSelected ? null : poi.id)}
                        className={`px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                            : 'bg-stone-900/90 border-stone-800/80 text-stone-300 hover:bg-stone-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] font-mono-tabular text-amber-400/90">
                          <Compass className="w-3 h-3 shrink-0" />
                          <span>0{idx + 1}</span>
                        </div>
                        <div className="text-xs font-medium truncate mt-0.5">{poi.title}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

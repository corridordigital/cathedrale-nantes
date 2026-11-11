/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { AtmosphereId, CameraPresetId, EasterEggState } from './types/scene';
import { CathedralCanvas } from './components/CathedralCanvas';
import { ControlOverlay } from './components/ControlOverlay';
import { cathedralSoundscape } from './utils/soundscape';

export default function App() {
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('parvis_overview');
  const [atmosphereId, setAtmosphereId] = useState<AtmosphereId>('temps_reel');
  const [customHour, setCustomHour] = useState<number | null>(null);
  const [zoomCommand, setZoomCommand] = useState<{ seq: number; factor: number } | null>(null);
  const [autumnMaturity, setAutumnMaturity] = useState<number>(0.42);
  const [windStrength, setWindStrength] = useState<number>(0.45);
  const [autoOrbit, setAutoOrbit] = useState<boolean>(false);
  const [cutawayMode, setCutawayMode] = useState<boolean>(false);
  const [easterEgg, setEasterEgg] = useState<EasterEggState>({
    dinosaurs: false,
    zombies: false,
    zemmour: false,
  });
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  const handleZoom = useCallback((factor: number) => {
    setZoomCommand((prev) => ({ seq: (prev?.seq ?? 0) + 1, factor }));
  }, []);

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev;
      if (next) {
        cathedralSoundscape.startAmbient(windStrength);
      } else {
        cathedralSoundscape.stopAmbient();
      }
      return next;
    });
  }, [windStrength]);

  const handleRingBell = useCallback(() => {
    cathedralSoundscape.ringBourdonBell(0.45);
  }, []);

  const handleChangeWind = useCallback((val: number) => {
    setWindStrength(val);
    cathedralSoundscape.updateWindIntensity(val);
  }, []);

  const handleUserCameraOverride = useCallback(() => {
    setAutoOrbit(false);
  }, []);

  const handleToggleCutaway = useCallback(() => {
    setCutawayMode((prev) => {
      const next = !prev;
      if (next) {
        setSelectedPoiId(null);
        setCameraPreset('arcs_boutants_sud');
      }
      return next;
    });
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-stone-950 select-none">
      {/* Stable 100vw x 100vh WebGL 3D Viewport */}
      <CathedralCanvas
        cameraPreset={cameraPreset}
        atmosphereId={atmosphereId}
        customHour={customHour}
        zoomCommand={zoomCommand}
        autumnMaturity={autumnMaturity}
        windStrength={windStrength}
        autoOrbit={autoOrbit}
        cutawayMode={cutawayMode}
        easterEgg={easterEgg}
        selectedPoiId={selectedPoiId}
        onSelectPoi={setSelectedPoiId}
        onUserCameraOverride={handleUserCameraOverride}
      />

      {/* Semantic Non-Occluding UI Overlay & Collapsible Bottom Dock */}
      <ControlOverlay
        cameraPreset={cameraPreset}
        onSelectCameraPreset={setCameraPreset}
        onZoom={handleZoom}
        atmosphereId={atmosphereId}
        onSelectAtmosphere={setAtmosphereId}
        customHour={customHour}
        onChangeCustomHour={setCustomHour}
        autumnMaturity={autumnMaturity}
        onChangeAutumnMaturity={setAutumnMaturity}
        windStrength={windStrength}
        onChangeWindStrength={handleChangeWind}
        autoOrbit={autoOrbit}
        onToggleAutoOrbit={() => setAutoOrbit((prev) => !prev)}
        cutawayMode={cutawayMode}
        onToggleCutawayMode={handleToggleCutaway}
        easterEgg={easterEgg}
        onChangeEasterEgg={setEasterEgg}
        selectedPoiId={selectedPoiId}
        onSelectPoi={setSelectedPoiId}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        onRingBell={handleRingBell}
      />
    </main>
  );
}

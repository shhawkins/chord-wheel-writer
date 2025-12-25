/**
 * useAudioSync Hook
 * 
 * This hook is responsible for syncing Zustand store audio settings to the audio engine.
 * It MUST be placed in a component that never unmounts (like App.tsx) to ensure
 * audio settings always stay in sync with the store.
 * 
 * Previously this logic lived in PlaybackControls, but that component conditionally
 * renders based on UI state (e.g., mobile immersive mode, chord panel visibility),
 * causing audio settings to stop syncing when PlaybackControls was unmounted.
 */

import { useEffect } from 'react';
import { useSongStore } from '../store/useSongStore';
import {
    scheduleSong,
    setTempo as setAudioTempo,
    setInstrument as setAudioInstrument,
    toggleLoopMode,
    setToneControl as setAudioTone,
    setMasterGain as setAudioMasterGain,
    setReverbMix as setAudioReverbMix,
    setDelayMix as setAudioDelayMix,
    setChorusMix as setAudioChorusMix,
    setStereoWidth as setAudioStereoWidth,
    preloadAudio
} from '../utils/audioEngine';

export const useAudioSync = () => {
    const {
        currentSong,
        tempo,
        instrument,
        isLooping,
        playingSectionId,
        selectedSectionId,
        toneControl,
        instrumentGain,
        reverbMix,
        delayMix,
        chorusMix,
        stereoWidth
    } = useSongStore();

    // Sync song structure to audio engine
    useEffect(() => {
        scheduleSong(currentSong);
    }, [currentSong]);

    // Sync tempo to audio engine
    useEffect(() => {
        setAudioTempo(tempo);
    }, [tempo]);

    // Sync instrument to audio engine
    useEffect(() => {
        setAudioInstrument(instrument);
    }, [instrument]);

    // Sync looping state to audio engine
    useEffect(() => {
        toggleLoopMode();
    }, [isLooping, currentSong, playingSectionId, selectedSectionId]);

    // Sync tone control (treble/bass)
    useEffect(() => {
        setAudioTone(toneControl.treble, toneControl.bass);
    }, [toneControl]);

    // Sync master gain
    useEffect(() => {
        setAudioMasterGain(instrumentGain);
    }, [instrumentGain]);

    // Sync reverb mix
    useEffect(() => {
        setAudioReverbMix(reverbMix);
    }, [reverbMix]);

    // Sync delay mix
    useEffect(() => {
        setAudioDelayMix(delayMix);
    }, [delayMix]);

    // Sync chorus mix
    useEffect(() => {
        setAudioChorusMix(chorusMix);
    }, [chorusMix]);

    // Sync stereo width
    useEffect(() => {
        setAudioStereoWidth(stereoWidth);
    }, [stereoWidth]);

    // Preload audio on mount
    useEffect(() => {
        preloadAudio().catch(console.error);
    }, []);
};

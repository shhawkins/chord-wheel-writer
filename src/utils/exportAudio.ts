/**
 * Audio Export Utility
 * Exports song as WAV using Tone.js offline rendering
 */

import * as Tone from 'tone';
import type { Song, Section, InstrumentType } from '../types';
import { useSongStore } from '../store/useSongStore';

export interface AudioExportOptions {
    /** Whether to apply effects (wet) or export dry audio */
    wet: boolean;
    /** Sample rate for export (default 44100) */
    sampleRate?: number;
}

export interface EffectSettings {
    tone: number;
    instrumentGain: number;
    reverbMix: number;
    delayMix: number;
    delayFeedback: number;
    chorusMix: number;
    vibratoDepth: number;
    distortionAmount: number;
    tremoloDepth: number;
    phaserMix: number;
    filterMix: number;
    pitchShift: number;
}

/**
 * Calculate the total duration of a song in seconds
 */
export const calculateSongDuration = (song: Song): number => {
    const secondsPerBeat = 60 / song.tempo;
    let totalBeats = 0;

    song.sections.forEach((section: Section) => {
        section.measures.forEach((measure) => {
            measure.beats.forEach((beat) => {
                totalBeats += beat.duration;
            });
        });
    });

    // Add a small buffer for reverb tail
    return (totalBeats * secondsPerBeat) + 2;
};

/**
 * Create an instrument for offline rendering
 */
const createInstrumentForExport = async (
    instrumentType: InstrumentType,
    destination: Tone.ToneAudioNode
): Promise<Tone.Sampler | Tone.PolySynth> => {
    // Import instrument creation logic similar to audioEngine
    const baseUrl = 'https://tonejs.github.io/audio/salamander/';
    const guitarBaseUrl = '/samples/';

    let instrument: Tone.Sampler | Tone.PolySynth;

    switch (instrumentType) {
        case 'piano':
            instrument = new Tone.Sampler({
                urls: {
                    'C4': 'C4.mp3',
                    'D#4': 'Ds4.mp3',
                    'F#4': 'Fs4.mp3',
                    'A4': 'A4.mp3',
                },
                release: 1,
                attack: 0.05,
                baseUrl,
            });
            break;

        case 'guitar':
        case 'guitar-jazzmaster':
            instrument = new Tone.Sampler({
                urls: {
                    'C3': 'electric-guitar-c3.m4a',
                    'C4': 'electric-guitar-c4.m4a',
                    'C5': 'electric-guitar-c5.m4a',
                },
                release: 2,
                attack: 0.05,
                baseUrl: guitarBaseUrl,
            });
            break;

        case 'organ':
            instrument = new Tone.PolySynth(Tone.AMSynth, {
                harmonicity: 3,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.02, decay: 0.3, sustain: 0.9, release: 0.8 },
                modulation: { type: 'square' },
                modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 },
            });
            break;

        case 'synth':
            instrument = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
            });
            break;

        case 'strings':
            instrument = new Tone.PolySynth(Tone.FMSynth, {
                harmonicity: 2,
                modulationIndex: 1,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 1.5 },
                modulation: { type: 'triangle' },
                modulationEnvelope: { attack: 0.2, decay: 0.3, sustain: 0.7, release: 0.5 },
            });
            break;

        case 'pad':
            instrument = new Tone.PolySynth(Tone.FMSynth, {
                harmonicity: 1.5,
                modulationIndex: 0.5,
                oscillator: { type: 'sine' },
                envelope: { attack: 1.0, decay: 0.5, sustain: 0.9, release: 2.0 },
                modulation: { type: 'triangle' },
                modulationEnvelope: { attack: 0.8, decay: 0.5, sustain: 0.8, release: 1.0 },
            });
            break;

        case 'brass':
            instrument = new Tone.PolySynth(Tone.MonoSynth, {
                oscillator: { type: 'sawtooth' },
                filter: { Q: 2, type: 'lowpass', rolloff: -12 },
                envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.3 },
                filterEnvelope: { attack: 0.06, decay: 0.2, sustain: 0.5, release: 0.2 },
            });
            break;

        case 'epiano':
            instrument = new Tone.PolySynth(Tone.FMSynth, {
                harmonicity: 8,
                modulationIndex: 2,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 1.4, sustain: 0, release: 0.2 },
                modulation: { type: 'sine' },
                modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 },
            });
            break;

        default:
            // Fallback to basic synth
            instrument = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.5 },
            });
    }

    instrument.connect(destination);

    // Wait for samples to load if it's a sampler
    if (instrument instanceof Tone.Sampler) {
        await new Promise<void>((resolve) => {
            if ((instrument as Tone.Sampler).loaded) {
                resolve();
            } else {
                (instrument as Tone.Sampler).onload = () => resolve();
            }
        });
    }

    return instrument;
};

/**
 * Create effects chain for wet export
 */
const createEffectsChain = (settings: EffectSettings, destination: Tone.ToneAudioNode) => {
    // Create effects in reverse order (last effect connects to destination first)
    const limiter = new Tone.Limiter(-3).connect(destination);

    const reverb = new Tone.Reverb({
        decay: 4.0,
        wet: settings.reverbMix,
        preDelay: 0.02,
    }).connect(limiter);

    const delay = new Tone.PingPongDelay({
        delayTime: 0.25,
        feedback: settings.delayFeedback,
        wet: settings.delayMix,
    }).connect(reverb);

    const chorus = new Tone.Chorus({
        frequency: 1.5,
        delayTime: 3.5,
        depth: 0.7,
        wet: settings.chorusMix,
    }).connect(delay);
    chorus.start();

    const gain = new Tone.Gain(settings.instrumentGain).connect(chorus);

    const eq = new Tone.EQ3({
        low: -settings.tone,
        mid: 0,
        high: settings.tone,
    }).connect(gain);

    const distortion = new Tone.Distortion({
        distortion: settings.distortionAmount,
        wet: settings.distortionAmount > 0 ? 0.5 : 0,
    }).connect(eq);

    const vibrato = new Tone.Vibrato({
        frequency: 5,
        depth: settings.vibratoDepth,
    }).connect(distortion);
    vibrato.wet.value = settings.vibratoDepth > 0 ? 1 : 0;

    const tremolo = new Tone.Tremolo({
        frequency: 5,
        depth: settings.tremoloDepth,
    }).connect(vibrato);
    tremolo.start();
    tremolo.wet.value = settings.tremoloDepth > 0 ? 1 : 0;

    const phaser = new Tone.Phaser({
        frequency: 0.5,
        octaves: 3,
        baseFrequency: 1000,
    }).connect(tremolo);
    phaser.wet.value = settings.phaserMix;

    const autoFilter = new Tone.AutoFilter({
        frequency: 0.5,
        baseFrequency: 200,
        octaves: 4,
    }).connect(phaser);
    autoFilter.start();
    autoFilter.wet.value = settings.filterMix;

    const pitchShift = new Tone.PitchShift({
        pitch: settings.pitchShift,
    }).connect(autoFilter);

    // Return the input of the chain (where instrument should connect)
    return {
        input: pitchShift,
        dispose: () => {
            pitchShift.dispose();
            autoFilter.dispose();
            phaser.dispose();
            tremolo.dispose();
            vibrato.dispose();
            distortion.dispose();
            eq.dispose();
            gain.dispose();
            chorus.dispose();
            delay.dispose();
            reverb.dispose();
            limiter.dispose();
        },
    };
};

/**
 * Export a song as a WAV audio file
 */
export const exportSongAsAudio = async (
    song: Song,
    instrumentType: InstrumentType,
    options: AudioExportOptions
): Promise<Blob> => {
    const { wet, sampleRate = 44100 } = options;

    // Calculate song duration
    const duration = calculateSongDuration(song);
    const secondsPerBeat = 60 / song.tempo;

    // Get current effect settings from store
    const store = useSongStore.getState();
    const effectSettings: EffectSettings = {
        tone: store.tone,
        instrumentGain: store.instrumentGain,
        reverbMix: store.reverbMix,
        delayMix: store.delayMix,
        delayFeedback: store.delayFeedback,
        chorusMix: store.chorusMix,
        vibratoDepth: store.vibratoDepth,
        distortionAmount: store.distortionAmount,
        tremoloDepth: store.tremoloDepth,
        phaserMix: store.phaserMix,
        filterMix: store.filterMix,
        pitchShift: store.pitchShift,
    };

    // Use Tone.Offline to render audio
    const buffer = await Tone.Offline(async ({ transport, destination }) => {
        let effectsChain: ReturnType<typeof createEffectsChain> | null = null;

        // Create destination (with or without effects)
        const instrumentDest = wet
            ? (effectsChain = createEffectsChain(effectSettings, destination)).input
            : destination;

        // Create instrument
        const instrument = await createInstrumentForExport(instrumentType, instrumentDest);

        // Schedule all chords
        let currentTime = 0;

        song.sections.forEach((section: Section) => {
            section.measures.forEach((measure) => {
                measure.beats.forEach((beat) => {
                    if (beat.chord && beat.chord.notes && beat.chord.notes.length > 0) {
                        const durationSeconds = beat.duration * secondsPerBeat;
                        const notes = beat.chord.notes;

                        // Schedule chord
                        transport.schedule((time) => {
                            instrument.triggerAttackRelease(notes, durationSeconds, time);
                        }, currentTime);
                    }

                    currentTime += beat.duration * secondsPerBeat;
                });
            });
        });

        // Start transport
        transport.start(0);

        // Cleanup after rendering
        return () => {
            instrument.dispose();
            effectsChain?.dispose();
        };
    }, duration, 2, sampleRate);

    // Convert AudioBuffer to WAV
    return audioBufferToWav(buffer);
};

/**
 * Convert AudioBuffer to WAV Blob
 */
const audioBufferToWav = (buffer: Tone.ToneAudioBuffer): Blob => {
    const audioBuffer = buffer.get();
    if (!audioBuffer) {
        throw new Error('Failed to get audio buffer');
    }

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;

    // Create interleaved buffer
    const interleaved = new Float32Array(length * numChannels);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            interleaved[i * numChannels + channel] = channelData[i];
        }
    }

    // Convert to 16-bit PCM
    const samples = new Int16Array(interleaved.length);
    for (let i = 0; i < interleaved.length; i++) {
        const s = Math.max(-1, Math.min(1, interleaved[i]));
        samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Create WAV file
    const wavBuffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(wavBuffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true);  // AudioFormat (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
    view.setUint16(32, numChannels * 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write samples
    const offset = 44;
    for (let i = 0; i < samples.length; i++) {
        view.setInt16(offset + i * 2, samples[i], true);
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
};

/**
 * Get human-readable instrument name
 */
export const getInstrumentDisplayName = (instrumentType: InstrumentType): string => {
    const names: Record<string, string> = {
        'piano': 'Piano',
        'epiano': 'Electric Piano',
        'guitar': 'Electric Guitar',
        'guitar-jazzmaster': 'Jazzmaster',
        'organ': 'Organ',
        'synth': 'Synth',
        'strings': 'Strings',
        'pad': 'Pad',
        'brass': 'Brass',
        'marimba': 'Marimba',
        'bell': 'Bell',
        'lead': 'Lead',
        'bass': 'Bass',
        'harmonica': 'Harmonica',
        'choir': 'Choir',
        'ocarina': 'Ocarina',
        'acoustic-archtop': 'Archtop',
        'nylon-string': 'Nylon String',
        'melodica': 'Melodica',
        'wine-glass': 'Wine Glass',
    };
    return names[instrumentType] || instrumentType;
};

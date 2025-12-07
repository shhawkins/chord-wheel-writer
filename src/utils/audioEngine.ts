import * as Tone from 'tone';

let instruments: {
    piano: Tone.Sampler | null;
    guitar: Tone.PolySynth | null;
    organ: Tone.PolySynth | null;
    synth: Tone.PolySynth | null;
} = {
    piano: null,
    guitar: null,
    organ: null,
    synth: null
};

let currentInstrument: keyof typeof instruments = 'piano';

export const setInstrument = (name: string) => {
    if (name in instruments) {
        currentInstrument = name as keyof typeof instruments;
    }
};

export const setVolume = (volume: number) => {
    // Convert 0-1 linear volume to decibels
    // -60dB is effectively silent, 0dB is full volume
    // We can use Tone.gainToDb but let's just do a simple log approximation or use Tone's helpers if available
    // For now simple approach:
    const db = volume <= 0 ? -Infinity : 20 * Math.log10(volume);
    console.log(`Setting volume: ${volume} -> ${db} db`);
    try {
        Tone.Destination.volume.rampTo(db, 0.1);
    } catch (e) {
        console.error("Error setting volume:", e);
    }
};

export const setMute = (muted: boolean) => {
    console.log(`Setting mute: ${muted}`);
    Tone.Destination.mute = muted;
};

export const initAudio = async () => {
    if (instruments.piano) return;

    // Use a free soundfont URL or basic synth fallback
    // Salamander Grand Piano is a good free option often used with Tone.js
    const baseUrl = "https://tonejs.github.io/audio/salamander/";

    instruments.piano = new Tone.Sampler({
        urls: {
            "C4": "C4.mp3",
            "D#4": "Ds4.mp3",
            "F#4": "Fs4.mp3",
            "A4": "A4.mp3",
        },
        release: 1,
        baseUrl,
    }).toDestination();

    instruments.guitar = new Tone.PolySynth(Tone.PluckSynth as any, {
        attackNoise: 1,
        dampening: 4000,
        resonance: 0.7
    } as any).toDestination();

    // Organ - PolySynth with AMSynth
    instruments.organ = new Tone.PolySynth(Tone.AMSynth, {
        harmonicity: 3,
        detune: 0,
        oscillator: {
            type: "sine"
        },
        envelope: {
            attack: 0.01,
            decay: 0.01,
            sustain: 1,
            release: 0.5
        },
        modulation: {
            type: "square"
        },
        modulationEnvelope: {
            attack: 0.5,
            decay: 0,
            sustain: 1,
            release: 0.5
        }
    }).toDestination();

    // Synth - PolySynth with FMSynth
    instruments.synth = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 10,
        detune: 0,
        oscillator: {
            type: "sine"
        },
        envelope: {
            attack: 0.01,
            decay: 0.01,
            sustain: 1,
            release: 0.5
        },
        modulation: {
            type: "square"
        },
        modulationEnvelope: {
            attack: 0.5,
            decay: 0,
            sustain: 1,
            release: 0.5
        }
    }).toDestination();

    await Tone.loaded();
    console.log("Audio initialized");
};

// NOTES array for octave calculation
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Play a chord with proper voicing
 * Notes are spread across octaves to sound musical
 */
export const playChord = async (notes: string[], duration: string = "1n") => {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }

    if (!instruments.piano) {
        await initAudio();
    }

    if (!notes || notes.length === 0) return;

    // Build voiced notes with proper octaves
    // Root in octave 3, rest spread intelligently
    const rootNote = notes[0];
    const rootIndex = NOTES.indexOf(rootNote.replace(/\d/, ''));

    const voicedNotes = notes.map((note, i) => {
        // If note already has octave, use it
        if (note.match(/\d/)) return note;

        const noteName = note;
        const noteIndex = NOTES.indexOf(noteName);

        if (i === 0) {
            // Root note in octave 3
            return `${noteName}3`;
        }

        // Other notes: if they're "below" the root in the chromatic scale, put them an octave up
        // This creates proper voice leading
        let octave = 3;
        if (noteIndex < rootIndex || (noteIndex - rootIndex > 6)) {
            octave = 4;
        }

        // For extended chords (9, 11, 13), put those even higher
        if (i >= 4) {
            octave = 4;
        }
        if (i >= 5) {
            octave = 5;
        }

        return `${noteName}${octave}`;
    });

    const inst = instruments[currentInstrument];
    if (!inst) return;

    inst.triggerAttackRelease(voicedNotes, duration);
};

export const stopAudio = () => {
    Object.values(instruments).forEach(inst => inst?.releaseAll());
};

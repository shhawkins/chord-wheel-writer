import * as Tone from 'tone';

let sampler: Tone.Sampler | null = null;

export const initAudio = async () => {
    if (sampler) return;

    // Use a free soundfont URL or basic synth fallback
    // Salamander Grand Piano is a good free option often used with Tone.js
    const baseUrl = "https://tonejs.github.io/audio/salamander/";

    sampler = new Tone.Sampler({
        urls: {
            "C4": "C4.mp3",
            "D#4": "Ds4.mp3",
            "F#4": "Fs4.mp3",
            "A4": "A4.mp3",
        },
        release: 1,
        baseUrl,
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

    if (!sampler) {
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

    sampler?.triggerAttackRelease(voicedNotes, duration);
};

export const stopAudio = () => {
    sampler?.releaseAll();
};

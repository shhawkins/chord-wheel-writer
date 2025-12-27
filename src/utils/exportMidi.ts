/**
 * MIDI Export Utility
 * Converts song data to MIDI file format using midi-writer-js
 */

import MidiWriter from 'midi-writer-js';
import type { Song, Section, Measure } from '../types';

export interface MidiExportOptions {
    /** Base filename (without extension) */
    filename?: string;
    /** Velocity for all notes (1-127, default 100) */
    velocity?: number;
}

/**
 * Convert a note name like "C4", "F#3" to MIDI pitch
 */
const noteToMidiPitch = (note: string): string => {
    // midi-writer-js accepts note names directly like 'C4', 'D#5', etc.
    // We just need to ensure the format is correct
    return note.replace('♯', '#').replace('♭', 'b');
};

/**
 * Convert beat duration to MIDI ticks
 * Standard MIDI uses 128 ticks per beat (quarter note)
 */
const durationToTicks = (durationBeats: number): number => {
    // midi-writer-js tick resolution
    return Math.round(durationBeats * 128);
};

/**
 * Export a song as a MIDI file blob
 */
export const exportSongAsMidi = (song: Song, options: MidiExportOptions = {}): Blob => {
    const { velocity = 100 } = options;

    // Create a new MIDI track
    const track = new MidiWriter.Track();

    // Set tempo
    track.setTempo(song.tempo);

    // Set time signature - midi-writer-js uses different args
    const [numerator, denominator] = song.timeSignature;
    // The setTimeSignature method signature may vary - wrap in try/catch
    try {
        // Some versions expect (numerator, denominator, clocksPerClick, notesPerQuarter)
        (track as any).setTimeSignature(numerator, denominator, 24, 8);
    } catch {
        // Fallback if the method doesn't exist or has different signature
        console.warn('Could not set time signature on MIDI track');
    }

    // Add track name
    track.addTrackName(song.title);

    // Keep track of accumulated time for scheduling
    let tickPosition = 0;

    // Process each section
    song.sections.forEach((section: Section) => {
        section.measures.forEach((measure: Measure) => {
            measure.beats.forEach((beat) => {
                if (beat.chord && beat.chord.notes && beat.chord.notes.length > 0) {
                    // Convert notes to MIDI format
                    const pitches = beat.chord.notes.map(noteToMidiPitch);

                    // Calculate duration in ticks
                    const durationTicks = durationToTicks(beat.duration);

                    // Create note event for the chord
                    const noteEvent = new MidiWriter.NoteEvent({
                        pitch: pitches as any,
                        duration: `T${durationTicks}`,
                        velocity: velocity,
                        startTick: tickPosition,
                    });

                    track.addEvent(noteEvent);
                }

                // Advance position regardless of whether there's a chord (rests)
                tickPosition += durationToTicks(beat.duration);
            });
        });
    });

    // Generate MIDI file
    const write = new MidiWriter.Writer([track]);

    // Get the data URI and convert to Blob
    const dataUri = write.dataUri();
    const base64Data = dataUri.split(',')[1];
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
    }

    return new Blob([bytes], { type: 'audio/midi' });
};

/**
 * Generate a sanitized filename from song title
 */
export const sanitizeFilename = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

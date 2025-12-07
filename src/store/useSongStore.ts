import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song, Section, InstrumentType, Measure } from '../types';
import { CIRCLE_OF_FIFTHS, type Chord } from '../utils/musicTheory';
import { v4 as uuidv4 } from 'uuid';

interface SongState {
    // Song data
    currentSong: Song;

    // Wheel state
    selectedKey: string;
    wheelRotation: number;        // Cumulative rotation (not reset at 360°)
    wheelMode: 'rotating' | 'fixed';  // Rotating = wheel spins, Fixed = highlights move
    chordPanelVisible: boolean;   // Toggle chord panel visibility
    timelineVisible: boolean;     // Toggle timeline visibility

    // Selection state
    selectedChord: Chord | null;
    selectedSectionId: string | null;
    selectedSlotId: string | null;

    // Playback state
    isPlaying: boolean;
    tempo: number;
    volume: number;
    instrument: InstrumentType;
    isMuted: boolean;

    // Actions
    setKey: (key: string) => void;
    rotateWheel: (direction: 'cw' | 'ccw') => void;  // Cumulative rotation
    toggleWheelMode: () => void;
    toggleChordPanel: () => void;
    toggleTimeline: () => void;

    setSelectedChord: (chord: Chord | null) => void;
    setSelectedSlot: (sectionId: string | null, slotId: string | null) => void;
    selectNextSlotAfter: (sectionId: string, slotId: string) => boolean;

    setTempo: (tempo: number) => void;
    setVolume: (volume: number) => void;
    setInstrument: (instrument: InstrumentType) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    toggleMute: () => void;

    // Song Actions
    setTitle: (title: string) => void;
    loadSong: (song: Song) => void;
    newSong: () => void;
    addSection: (type: Section['type']) => void;
    updateSection: (id: string, updates: Partial<Section>) => void;
    removeSection: (id: string) => void;
    duplicateSection: (id: string) => void;
    reorderSections: (sections: Section[]) => void;
    setSectionMeasures: (id: string, count: number) => void;
    setSectionTimeSignature: (id: string, signature: [number, number]) => void;
    setMeasureSubdivision: (sectionId: string, measureId: string, steps: number) => void;

    addChordToSlot: (chord: Chord, sectionId: string, slotId: string) => void;
    clearSlot: (sectionId: string, slotId: string) => void;
    moveChord: (fromSectionId: string, fromSlotId: string, toSectionId: string, toSlotId: string) => void;
}

const DEFAULT_TIME_SIGNATURE: [number, number] = [4, 4];

const beatsFromSignature = (signature: [number, number] = DEFAULT_TIME_SIGNATURE) => {
    const [top, bottom] = signature;
    if (!top || !bottom) return 4;
    return top * (4 / bottom);
};

const createEmptyMeasure = (signature: [number, number]) => {
    const duration = beatsFromSignature(signature);
    return {
        id: uuidv4(),
        beats: [{ id: uuidv4(), chord: null, duration }],
    };
};

const ensureSelectionStillExists = (
    sections: Section[],
    selectedSectionId: string | null,
    selectedSlotId: string | null
) => {
    if (!selectedSlotId || !selectedSectionId) return { selectedSectionId, selectedSlotId };

    const slotExists = sections.some(
        (section) =>
            section.id === selectedSectionId &&
            section.measures.some((measure) => measure.beats.some((beat) => beat.id === selectedSlotId))
    );

    return slotExists ? { selectedSectionId, selectedSlotId } : { selectedSectionId: null, selectedSlotId: null };
};

const findNextSlot = (sections: Section[], sectionId: string, slotId: string) => {
    let foundCurrent = false;

    for (const section of sections) {
        for (const measure of section.measures) {
            for (const beat of measure.beats) {
                if (foundCurrent) {
                    return { sectionId: section.id, slotId: beat.id };
                }
                if (section.id === sectionId && beat.id === slotId) {
                    foundCurrent = true;
                }
            }
        }
    }

    return null;
};

const DEFAULT_SONG: Song = {
    id: 'default',
    title: 'Untitled Song',
    artist: '',
    key: 'C',
    tempo: 120,
    timeSignature: [4, 4],
    sections: [
        {
            id: 'verse-1',
            name: 'Verse 1',
            type: 'verse',
            timeSignature: DEFAULT_TIME_SIGNATURE,
            measures: Array(4).fill(null).map(() => createEmptyMeasure(DEFAULT_TIME_SIGNATURE)),
        },
        {
            id: 'chorus-1',
            name: 'Chorus',
            type: 'chorus',
            timeSignature: DEFAULT_TIME_SIGNATURE,
            measures: Array(4).fill(null).map(() => createEmptyMeasure(DEFAULT_TIME_SIGNATURE)),
        },
    ],
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
};

export const useSongStore = create<SongState>()(
    persist(
        (set) => ({
            currentSong: DEFAULT_SONG,
            selectedKey: 'C',
            wheelRotation: 0,
            wheelMode: 'fixed' as const,
            chordPanelVisible: true,
            timelineVisible: true,
            selectedChord: null,
            selectedSectionId: null,
            selectedSlotId: null,
            isPlaying: false,
            tempo: 120,
            volume: 0.8,
            instrument: 'piano',
            isMuted: false,

            setKey: (key) => set({ selectedKey: key }),

            // Cumulative rotation to avoid wrap-around animation issues
            rotateWheel: (direction) => set((state) => ({
                wheelRotation: state.wheelMode === 'rotating'
                    ? state.wheelRotation + (direction === 'cw' ? -30 : 30)
                    : 0  // In fixed mode, wheel doesn't rotate
            })),

            toggleWheelMode: () => set((state) => {
                const newMode = state.wheelMode === 'rotating' ? 'fixed' : 'rotating';

                // When unlocking (switching to rotating), snap the selected key to the top
                // When locking (switching to fixed), snap the wheel to 0 (C at top)
                let newRotation = 0;

                if (newMode === 'rotating') {
                    const keyIndex = CIRCLE_OF_FIFTHS.indexOf(state.selectedKey);
                    if (keyIndex !== -1) {
                        newRotation = -(keyIndex * 30);
                    }
                }

                return {
                    wheelMode: newMode,
                    wheelRotation: newRotation
                };
            }),

            toggleChordPanel: () => set((state) => ({ chordPanelVisible: !state.chordPanelVisible })),
            toggleTimeline: () => set((state) => ({ timelineVisible: !state.timelineVisible })),

            setSelectedChord: (chord) => set({ selectedChord: chord }),
            setSelectedSlot: (sectionId, slotId) => set({ selectedSectionId: sectionId, selectedSlotId: slotId }),
            selectNextSlotAfter: (sectionId, slotId) => {
                let advanced = false;
                set((state) => {
                    const next = findNextSlot(state.currentSong.sections, sectionId, slotId);
                    if (!next) return {};

                    const nextChord = state.currentSong.sections
                        .find((s) => s.id === next.sectionId)
                        ?.measures.flatMap((m) => m.beats)
                        .find((b) => b.id === next.slotId)?.chord ?? null;

                    advanced = true;
                    return {
                        selectedSectionId: next.sectionId,
                        selectedSlotId: next.slotId,
                        selectedChord: nextChord
                    };
                });
                return advanced;
            },

            setTempo: (tempo) => set((state) => ({
                tempo,
                currentSong: {
                    ...state.currentSong,
                    tempo
                }
            })),
            setVolume: (volume) => set({ volume }),
            setInstrument: (instrument) => set({ instrument }),
            setIsPlaying: (isPlaying) => set({ isPlaying }),
            toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

            setTitle: (title) => set((state) => ({
                currentSong: { ...state.currentSong, title }
            })),

            loadSong: (song) => set((state) => {
                const key = song.key || 'C';
                const tempo = song.tempo ?? DEFAULT_SONG.tempo;
                let rotation = 0;

                if (state.wheelMode === 'rotating') {
                    const keyIndex = CIRCLE_OF_FIFTHS.indexOf(key);
                    if (keyIndex !== -1) {
                        rotation = -(keyIndex * 30);
                    }
                }

                return {
                    currentSong: { ...song, tempo },
                    selectedKey: key,
                    wheelRotation: rotation,
                    selectedChord: null,
                    selectedSectionId: null,
                    selectedSlotId: null,
                    tempo,
                };
            }),

            newSong: () => set({
                currentSong: {
                    ...DEFAULT_SONG,
                    id: uuidv4(),
                    title: 'Untitled Song',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    tempo: DEFAULT_SONG.tempo,
                    sections: [
                        {
                            id: uuidv4(),
                            name: 'Verse 1',
                            type: 'verse',
                            timeSignature: DEFAULT_TIME_SIGNATURE,
                            measures: Array(4).fill(null).map(() => createEmptyMeasure(DEFAULT_TIME_SIGNATURE)),
                        },
                        {
                            id: uuidv4(),
                            name: 'Chorus',
                            type: 'chorus',
                            timeSignature: DEFAULT_TIME_SIGNATURE,
                            measures: Array(4).fill(null).map(() => createEmptyMeasure(DEFAULT_TIME_SIGNATURE)),
                        },
                    ],
                },
                selectedKey: 'C',
                wheelRotation: 0,
                selectedChord: null,
                selectedSectionId: null,
                selectedSlotId: null,
                tempo: DEFAULT_SONG.tempo,
            }),

            addSection: (type) => set((state) => {
                const newSection: Section = {
                    id: uuidv4(),
                    name: type.charAt(0).toUpperCase() + type.slice(1),
                    type,
                    timeSignature: state.currentSong.timeSignature || DEFAULT_TIME_SIGNATURE,
                    measures: Array(4).fill(null).map(() => createEmptyMeasure(state.currentSong.timeSignature || DEFAULT_TIME_SIGNATURE))
                };
                return {
                    currentSong: {
                        ...state.currentSong,
                        sections: [...state.currentSong.sections, newSection]
                    }
                };
            }),

            updateSection: (id, updates) => set((state) => ({
                currentSong: {
                    ...state.currentSong,
                    sections: state.currentSong.sections.map(s => s.id === id ? { ...s, ...updates } : s)
                }
            })),

            removeSection: (id) => set((state) => ({
                currentSong: {
                    ...state.currentSong,
                    sections: state.currentSong.sections.filter(s => s.id !== id)
                }
            })),

            duplicateSection: (id) => set((state) => {
                const sectionToCopy = state.currentSong.sections.find(s => s.id === id);
                if (!sectionToCopy) return {};

                const newSection: Section = {
                    ...sectionToCopy,
                    id: uuidv4(),
                    name: `${sectionToCopy.name} (Copy)`,
                    timeSignature: sectionToCopy.timeSignature || state.currentSong.timeSignature || DEFAULT_TIME_SIGNATURE,
                    measures: sectionToCopy.measures.map(m => ({
                        ...m,
                        id: uuidv4(),
                        beats: m.beats.map(b => ({ ...b, id: uuidv4() }))
                    }))
                };

                const index = state.currentSong.sections.findIndex(s => s.id === id);
                const newSections = [...state.currentSong.sections];
                newSections.splice(index + 1, 0, newSection);

                return {
                    currentSong: {
                        ...state.currentSong,
                        sections: newSections
                    }
                };
            }),

            reorderSections: (sections) => set((state) => ({
                currentSong: { ...state.currentSong, sections }
            })),

            setSectionMeasures: (id, count) => set((state) => {
                const targetCount = Math.max(1, Math.min(32, Math.round(count)));

                const newSections = state.currentSong.sections.map((section) => {
                    if (section.id !== id) return section;

                    const signature = section.timeSignature || state.currentSong.timeSignature || DEFAULT_TIME_SIGNATURE;
                    let measures: Measure[] = [...section.measures];

                    if (measures.length < targetCount) {
                        while (measures.length < targetCount) {
                            measures.push(createEmptyMeasure(signature));
                        }
                    } else if (measures.length > targetCount) {
                        measures = measures.slice(0, targetCount);
                    }

                    return { ...section, measures };
                });

                const selection = ensureSelectionStillExists(newSections, state.selectedSectionId, state.selectedSlotId);

                return {
                    currentSong: { ...state.currentSong, sections: newSections },
                    ...selection,
                };
            }),

            setSectionTimeSignature: (id, signature) => set((state) => {
                const newSections = state.currentSong.sections.map((section) => {
                    if (section.id !== id) return section;

                    const newTotalBeats = beatsFromSignature(signature);

                    return {
                        ...section,
                        timeSignature: signature,
                        // Reset beats to align with the new meter and clear chords to avoid mismatched slots
                        measures: section.measures.map((measure) => ({
                            ...measure,
                            beats: [
                                {
                                    id: uuidv4(),
                                    chord: null,
                                    duration: newTotalBeats,
                                },
                            ],
                        })),
                    };
                });

                const selection = ensureSelectionStillExists(newSections, state.selectedSectionId, state.selectedSlotId);

                return {
                    currentSong: { ...state.currentSong, sections: newSections },
                    ...selection,
                };
            }),

            setMeasureSubdivision: (sectionId, measureId, steps) => set((state) => {
                const targetSteps = Math.max(1, Math.min(16, Math.round(steps)));

                const newSections = state.currentSong.sections.map((section) => {
                    if (section.id !== sectionId) return section;
                    const signature = section.timeSignature || state.currentSong.timeSignature || DEFAULT_TIME_SIGNATURE;
                    const totalBeats = beatsFromSignature(signature);

                    return {
                        ...section,
                        measures: section.measures.map((measure) => {
                            if (measure.id !== measureId) return measure;

                            const beatDuration = totalBeats / targetSteps;
                            const nextBeats = Array.from({ length: targetSteps }).map((_, idx) => {
                                const existing = measure.beats[idx];
                                return {
                                    id: existing?.id ?? uuidv4(),
                                    chord: existing?.chord ?? null,
                                    duration: beatDuration,
                                };
                            });

                            return { ...measure, beats: nextBeats };
                        }),
                    };
                });

                const selection = ensureSelectionStillExists(newSections, state.selectedSectionId, state.selectedSlotId);

                return {
                    currentSong: { ...state.currentSong, sections: newSections },
                    ...selection,
                };
            }),

            addChordToSlot: (chord, sectionId, slotId) => set((state) => {
                const newSections = state.currentSong.sections.map(section => {
                    if (section.id !== sectionId) return section;
                    return {
                        ...section,
                        measures: section.measures.map(measure => ({
                            ...measure,
                            beats: measure.beats.map(beat => {
                                if (beat.id !== slotId) return beat;
                                return { ...beat, chord };
                            })
                        }))
                    };
                });
                return { currentSong: { ...state.currentSong, sections: newSections } };
            }),

            clearSlot: (sectionId, slotId) => set((state) => {
                const newSections = state.currentSong.sections.map(section => {
                    if (section.id !== sectionId) return section;
                    return {
                        ...section,
                        measures: section.measures.map(measure => ({
                            ...measure,
                            beats: measure.beats.map(beat => {
                                if (beat.id !== slotId) return beat;
                                return { ...beat, chord: null };
                            })
                        }))
                    };
                });
                return { currentSong: { ...state.currentSong, sections: newSections } };
            }),

            moveChord: (_fromSectionId, fromSlotId, _toSectionId, toSlotId) => set((state) => {
                // Find both chords
                let sourceChord: Chord | null = null;
                let targetChord: Chord | null = null;

                // First pass: find both chords
                state.currentSong.sections.forEach(s => {
                    s.measures.forEach(m => {
                        m.beats.forEach(b => {
                            if (b.id === fromSlotId) {
                                sourceChord = b.chord;
                            }
                            if (b.id === toSlotId) {
                                targetChord = b.chord; // This might be null, which is fine
                            }
                        });
                    });
                });

                if (!sourceChord && !targetChord) return {};
                // Note: sourceChord might be null if we allow dragging empty slots, 
                // but usually the UI prevents dragging empty slots. 
                // If source is null, we are just "swapping" null into the target, clearing it,
                // and moving the target back to source.

                // Second pass: swap
                const newSections = state.currentSong.sections.map(section => {
                    return {
                        ...section,
                        measures: section.measures.map(measure => ({
                            ...measure,
                            beats: measure.beats.map(beat => {
                                if (beat.id === fromSlotId) {
                                    return { ...beat, chord: targetChord };
                                }
                                if (beat.id === toSlotId) {
                                    return { ...beat, chord: sourceChord };
                                }
                                return beat;
                            })
                        }))
                    };
                });

                return { currentSong: { ...state.currentSong, sections: newSections } };
            }),
        }),
        {
            name: 'songwriter-wheel-storage',
            partialize: (state) => ({
                currentSong: state.currentSong,
                tempo: state.tempo,
                volume: state.volume,
                instrument: state.instrument,
                isMuted: state.isMuted
            }),
        }
    )
);

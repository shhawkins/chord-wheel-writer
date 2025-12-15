/**
 * PlayableProgression
 * 
 * An interactive chord progression player that displays roman numerals
 * and allows users to:
 * 1. Play the entire progression in sequence
 * 2. Tap individual chords to hear them
 * 3. Add the progression to their timeline as a new section
 */

import React, { useState } from 'react';
import { Play, Square, Plus } from 'lucide-react';
import { useSongStore } from '../../store/useSongStore';
import {
    playProgression,
    stopProgression,
    progressionToChords,
    type ProgressionPreset
} from '../../utils/progressionPlayback';
import { playChord } from '../../utils/audioEngine';
import { type Chord } from '../../utils/musicTheory';

interface PlayableProgressionProps {
    preset: ProgressionPreset;
    showAddButton?: boolean;
    compact?: boolean;
    onAddToTimeline?: () => void; // Called after adding progression to timeline
}

export const PlayableProgression: React.FC<PlayableProgressionProps> = ({
    preset,
    showAddButton = true,
    compact = false,
    onAddToTimeline
}) => {
    const { selectedKey, currentSong, openTimeline } = useSongStore();
    const addCustomSection = useSongStore(state => state.addCustomSection);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentChordIndex, setCurrentChordIndex] = useState<number | null>(null);
    const [justAdded, setJustAdded] = useState(false);

    // Get chords for current key
    const chords = progressionToChords(preset.numerals, selectedKey);

    const handlePlay = async () => {
        if (isPlaying) {
            stopProgression();
            setIsPlaying(false);
            setCurrentChordIndex(null);
            return;
        }

        setIsPlaying(true);
        setCurrentChordIndex(0);

        try {
            await playProgression(
                preset.numerals,
                selectedKey,
                currentSong.tempo,
                preset.beatsPerChord, // Use preset's rhythm
                (index) => {
                    setCurrentChordIndex(index);
                }
            );
        } finally {
            setIsPlaying(false);
            setCurrentChordIndex(null);
        }
    };

    const handleChordClick = async (chord: Chord, index: number) => {
        if (isPlaying) return;
        setCurrentChordIndex(index);
        // Use appropriate duration based on beats per chord
        const duration = preset.beatsPerChord >= 4 ? '1n' : '2n';
        await playChord(chord.notes, duration);
        setTimeout(() => setCurrentChordIndex(null), 400);
    };

    const handleAddToTimeline = () => {
        if (!addCustomSection) return;

        // Create section with the progression's chords using proper rhythm
        addCustomSection(
            preset.sectionName,
            preset.sectionType,
            chords,
            {
                beatsPerChord: preset.beatsPerChord,
                totalBars: preset.totalBars
            }
        );

        // Open timeline so user can see the new section
        openTimeline();

        // Visual feedback
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1500);

        // Notify parent (e.g., to close the modal)
        onAddToTimeline?.();
    };

    return (
        <div
            className={`
                p-2.5 rounded bg-bg-tertiary transition-all duration-300 overflow-hidden
                ${compact ? 'text-xs' : 'text-sm'}
                ${justAdded ? 'ring-2 ring-green-500 bg-green-500/10' : ''}
            `}
        >
            {/* Title row */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0">
                    <span className="font-bold text-white">{preset.name}</span>
                    {preset.artists && (
                        <span className="block text-xs text-gray-500 truncate">{preset.artists}</span>
                    )}
                </div>

                {/* Add to Timeline Button */}
                {showAddButton && (
                    <button
                        onClick={handleAddToTimeline}
                        className={`
                            flex items-center gap-1 px-2 py-1 rounded text-xs font-medium shrink-0
                            transition-all duration-200
                            ${justAdded
                                ? 'bg-green-500 text-white'
                                : 'bg-bg-elevated hover:bg-accent-primary/20 text-gray-400 hover:text-accent-primary'
                            }
                        `}
                        title="Add to timeline"
                    >
                        <Plus size={12} />
                        <span className="hidden sm:inline">{justAdded ? 'Added!' : 'Add'}</span>
                    </button>
                )}
            </div>

            {/* Controls row - grid layout with max 4 chord pills per row */}
            <div
                className="grid gap-1.5"
                style={{
                    gridTemplateColumns: 'auto repeat(4, minmax(0, max-content))',
                    justifyContent: 'start'
                }}
            >
                {/* Play Button */}
                <button
                    onClick={handlePlay}
                    className={`
                        flex items-center justify-center w-7 h-7 rounded-full shrink-0
                        transition-all duration-200
                        ${isPlaying
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-accent-primary/20 hover:bg-accent-primary/40 text-accent-primary'
                        }
                    `}
                    title={isPlaying ? 'Stop' : 'Play progression'}
                >
                    {isPlaying ? <Square size={12} /> : <Play size={12} className="ml-0.5" />}
                </button>

                {/* Chord Pills - max 4 per row after play button on first row */}
                {preset.numerals.map((numeral, index) => {
                    const chord = chords[index];
                    const isCurrentlyPlaying = currentChordIndex === index;
                    // After the first 4 chords, start each group of 4 in column 2
                    const gridColumn = index < 4 ? undefined : ((index % 4) + 2);

                    return (
                        <button
                            key={`${numeral}-${index}`}
                            onClick={() => handleChordClick(chord, index)}
                            disabled={isPlaying}
                            className={`
                                text-xs px-2 py-1 rounded font-medium
                                transition-all duration-150
                                ${isCurrentlyPlaying
                                    ? `bg-${preset.color} text-white scale-110 shadow-lg shadow-${preset.color}/30`
                                    : `bg-black/40 text-${preset.color} hover:bg-black/60 hover:scale-105`
                                }
                                ${isPlaying && !isCurrentlyPlaying ? 'opacity-50' : ''}
                                disabled:cursor-not-allowed
                            `}
                            style={{
                                ...(isCurrentlyPlaying ? { backgroundColor: `var(--color-${preset.color})` } : {}),
                                ...(gridColumn ? { gridColumn } : {})
                            }}
                            title={`Play ${chord.symbol}`}
                        >
                            {numeral}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

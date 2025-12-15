/**
 * PlayableCadence
 * 
 * An interactive cadence demonstrator that allows users to hear
 * the characteristic sound of different musical cadences.
 */

import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { useSongStore } from '../../store/useSongStore';
import {
    playProgression,
    stopProgression,
    progressionToChords,
    type CadencePreset
} from '../../utils/progressionPlayback';
import { playChord } from '../../utils/audioEngine';
import { type Chord } from '../../utils/musicTheory';

interface PlayableCadenceProps {
    preset: CadencePreset;
}

export const PlayableCadence: React.FC<PlayableCadenceProps> = ({ preset }) => {
    const { selectedKey, currentSong } = useSongStore();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentChordIndex, setCurrentChordIndex] = useState<number | null>(null);

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
                2,
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
        await playChord(chord.notes, '2n');
        setTimeout(() => setCurrentChordIndex(null), 400);
    };

    // Get color classes based on preset
    const textColor = `text-${preset.color.replace('-500', '-400')}`;

    return (
        <div
            className={`
                group p-3 rounded bg-bg-tertiary hover:bg-bg-tertiary/80 
                transition-all duration-200 border-l-2
            `}
            style={{ borderColor: `var(--color-${preset.color}, currentColor)` }}
        >
            <div className="flex justify-between items-center mb-1 gap-2">
                <span className="font-bold text-white">{preset.name}</span>
                <div className="flex items-center gap-1">
                    {/* Play button */}
                    <button
                        onClick={handlePlay}
                        className={`
                            w-6 h-6 rounded-full flex items-center justify-center
                            transition-all duration-200
                            ${isPlaying
                                ? 'bg-red-500 text-white'
                                : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
                            }
                        `}
                        title={isPlaying ? 'Stop' : 'Play cadence'}
                    >
                        {isPlaying ? (
                            <div className="w-2 h-2 bg-white rounded-sm" />
                        ) : (
                            <Play size={10} className="ml-0.5" />
                        )}
                    </button>

                    {/* Chord pills */}
                    <div className="flex gap-0.5">
                        {preset.numerals.map((numeral, index) => {
                            const chord = chords[index];
                            const isCurrentlyPlaying = currentChordIndex === index;

                            return (
                                <React.Fragment key={`${numeral}-${index}`}>
                                    <button
                                        onClick={() => handleChordClick(chord, index)}
                                        disabled={isPlaying}
                                        className={`
                                            text-xs px-1.5 py-0.5 rounded
                                            transition-all duration-150
                                            ${isCurrentlyPlaying
                                                ? 'bg-white text-black scale-110'
                                                : `bg-black/30 ${textColor} hover:bg-black/50 hover:scale-105`
                                            }
                                        `}
                                        style={
                                            isCurrentlyPlaying
                                                ? { backgroundColor: `var(--color-${preset.color})`, color: 'white' }
                                                : undefined
                                        }
                                        title={`Play ${chord.symbol}`}
                                    >
                                        {numeral}
                                    </button>
                                    {index < preset.numerals.length - 1 && (
                                        <span className="text-gray-500 text-xs flex items-center">→</span>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
            <p className="text-gray-400 text-xs">{preset.description}</p>
        </div>
    );
};

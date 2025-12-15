/**
 * PlayableChordPill
 * 
 * A single chord pill that can be tapped to play the chord.
 * Used as a building block for progressions and standalone chord display.
 */

import React from 'react';
import { type Chord } from '../../utils/musicTheory';
import { playChord } from '../../utils/audioEngine';

interface PlayableChordPillProps {
    chord: Chord;
    numeral: string;
    isPlaying?: boolean;
    color?: string;
    size?: 'sm' | 'md';
    onClick?: () => void;
}

export const PlayableChordPill: React.FC<PlayableChordPillProps> = ({
    chord,
    numeral,
    isPlaying = false,
    color = 'accent-primary',
    size = 'sm',
    onClick
}) => {
    const handleClick = async () => {
        await playChord(chord.notes, '2n');
        onClick?.();
    };

    const sizeClasses = size === 'sm'
        ? 'text-xs px-2 py-1'
        : 'text-sm px-3 py-1.5';

    return (
        <button
            onClick={handleClick}
            className={`
                ${sizeClasses}
                rounded font-medium
                transition-all duration-150
                ${isPlaying
                    ? `bg-${color} text-white scale-110 shadow-lg`
                    : `bg-black/40 text-${color} hover:bg-black/60 hover:scale-105`
                }
                active:scale-95
            `}
            title={`Play ${chord.symbol} (${numeral})`}
        >
            {numeral}
        </button>
    );
};

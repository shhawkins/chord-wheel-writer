import React from 'react';
import clsx from 'clsx';
import { normalizeNote } from '../../utils/musicTheory';

interface PianoKeyboardProps {
    highlightedNotes: string[]; // e.g., ['C', 'E', 'G']
    rootNote?: string;
    color?: string;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
    highlightedNotes,
    rootNote,
    color = '#6366f1'
}) => {
    const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

    // Normalize all highlighted notes for comparison (handles flats/sharps)
    const normalizedHighlighted = highlightedNotes.map(n => normalizeNote(n));
    const normalizedRoot = rootNote ? normalizeNote(rootNote) : null;

    const getIsHighlighted = (note: string) => {
        const normalized = normalizeNote(note);
        return normalizedHighlighted.includes(normalized);
    };

    const getIsRoot = (note: string) => {
        if (!normalizedRoot) return false;
        return normalizeNote(note) === normalizedRoot;
    };

    const renderKeys = () => {
        const keys: React.ReactNode[] = [];
        const totalWhiteKeys = 14;

        // Generate White Keys (2 octaves)
        for (let oct = 3; oct <= 4; oct++) {
            whiteKeys.forEach((note) => {
                const isHighlighted = getIsHighlighted(note);
                const isRoot = getIsRoot(note);

                keys.push(
                    <div
                        key={`white-${oct}-${note}`}
                        className={clsx(
                            "h-full rounded-b-md relative transition-all duration-200 ease-out",
                            "border-x border-b",
                            !isHighlighted && "border-[#2a2a35] hover:border-[#3a3a45]"
                        )}
                        style={{
                            width: `${100 / totalWhiteKeys}%`,
                            background: isHighlighted
                                ? `linear-gradient(180deg, ${color} 0%, ${color}dd 100%)`
                                : 'linear-gradient(180deg, #e8e6e3 0%, #d4d2cf 60%, #c8c6c3 100%)',
                            borderColor: isHighlighted ? color : undefined,
                            boxShadow: isHighlighted
                                ? `0 0 20px ${color}60, inset 0 1px 0 rgba(255,255,255,0.3)`
                                : 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -3px 6px rgba(0,0,0,0.1)',
                            transform: isHighlighted ? 'translateY(1px)' : undefined
                        }}
                    >
                        {/* Key reflection/shine */}
                        {!isHighlighted && (
                            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-sm pointer-events-none" />
                        )}
                        {/* Root indicator */}
                        {isRoot && (
                            <div
                                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full shadow-md"
                                style={{
                                    background: 'linear-gradient(135deg, #fff 0%, #e0e0e0 100%)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 #fff'
                                }}
                            />
                        )}
                        {/* Chord note indicator (non-root) */}
                        {isHighlighted && !isRoot && (
                            <div
                                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/80"
                            />
                        )}
                    </div>
                );
            });
        }
        return keys;
    };

    const renderBlackKeys = () => {
        const keys: React.ReactNode[] = [];
        // Positions as percentages within the white key layout
        const blackKeyOffsets = [
            14.3, // C#/Db
            28.6, // D#/Eb
            57.1, // F#/Gb
            71.4, // G#/Ab
            85.7  // A#/Bb
        ];

        for (let oct = 0; oct < 2; oct++) {
            const octaveOffset = oct * 50;
            const blackNotes = ['C#', 'D#', 'F#', 'G#', 'A#'];

            blackNotes.forEach((note, i) => {
                const isHighlighted = getIsHighlighted(note);
                const isRoot = getIsRoot(note);
                const leftPos = octaveOffset + (blackKeyOffsets[i] / 2);

                keys.push(
                    <div
                        key={`black-${oct}-${note}`}
                        className={clsx(
                            "absolute top-0 h-[62%] w-[5%] -translate-x-1/2 rounded-b-md z-10 transition-all duration-200 ease-out"
                        )}
                        style={{
                            left: `${leftPos}%`,
                            background: isHighlighted
                                ? `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`
                                : 'linear-gradient(180deg, #2a2a35 0%, #1a1a22 60%, #101015 100%)',
                            boxShadow: isHighlighted
                                ? `0 0 16px ${color}80, 0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)`
                                : '0 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.3)',
                            transform: isHighlighted ? 'translateX(-50%) translateY(2px)' : 'translateX(-50%)'
                        }}
                    >
                        {/* Key shine */}
                        {!isHighlighted && (
                            <div className="absolute inset-x-1 top-0 h-1/4 bg-gradient-to-b from-white/10 to-transparent rounded-t-sm pointer-events-none" />
                        )}
                        {/* Root indicator */}
                        {isRoot && (
                            <div
                                className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                                style={{
                                    background: 'linear-gradient(135deg, #fff 0%, #e0e0e0 100%)',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.4)'
                                }}
                            />
                        )}
                        {/* Chord note indicator (non-root) */}
                        {isHighlighted && !isRoot && (
                            <div
                                className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/80"
                            />
                        )}
                    </div>
                );
            });
        }
        return keys;
    };

    return (
        <div
            className="relative w-full h-14 rounded-lg overflow-hidden select-none"
            style={{
                background: 'linear-gradient(180deg, #1a1a22 0%, #0d0d12 100%)',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)',
                padding: '3px 2px 2px 2px'
            }}
        >
            <div className="flex w-full h-full gap-[1px]">
                {renderKeys()}
            </div>
            {renderBlackKeys()}
        </div>
    );
};

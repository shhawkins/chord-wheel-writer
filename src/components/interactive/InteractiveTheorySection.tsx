/**
 * InteractiveTheorySection
 * 
 * A reusable wrapper for theory content that includes playable chord pills.
 * Use this to wrap any educational content that references specific chords.
 */

import React from 'react';
import { useSongStore } from '../../store/useSongStore';
import { progressionToChords } from '../../utils/progressionPlayback';
import { playChord } from '../../utils/audioEngine';
import { Volume2 } from 'lucide-react';

interface InteractiveTheorySectionProps {
    children: React.ReactNode;
    title?: string;
    /** Optional chord numerals to show as playable examples */
    exampleNumerals?: string[];
}

export const InteractiveTheorySection: React.FC<InteractiveTheorySectionProps> = ({
    children,
    title,
    exampleNumerals
}) => {
    const { selectedKey } = useSongStore();

    const handlePlayChord = async (numeral: string) => {
        const [chord] = progressionToChords([numeral], selectedKey);
        if (chord) {
            await playChord(chord.notes, '2n');
        }
    };

    return (
        <div className="space-y-2">
            {title && (
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                    {title}
                    <Volume2 size={12} className="text-accent-primary/50" />
                </h5>
            )}
            <div className="text-sm text-gray-300">
                {children}
            </div>
            {exampleNumerals && exampleNumerals.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs text-gray-500">Try:</span>
                    {exampleNumerals.map((numeral, index) => (
                        <button
                            key={`${numeral}-${index}`}
                            onClick={() => handlePlayChord(numeral)}
                            className="text-xs px-2 py-0.5 rounded bg-accent-primary/20 text-accent-primary 
                                     hover:bg-accent-primary/40 active:scale-95 transition-all"
                            title={`Play ${numeral} chord in ${selectedKey}`}
                        >
                            {numeral}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

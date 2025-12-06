import { useSongStore } from '../../store/useSongStore';
import { PianoKeyboard } from './PianoKeyboard';
import { getWheelColors, getChordNotes } from '../../utils/musicTheory';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { playChord } from '../../utils/audioEngine';
import { useState } from 'react';

export const ChordDetails: React.FC = () => {
    const { selectedChord, selectedKey, setSelectedChord, chordPanelVisible, toggleChordPanel } = useSongStore();
    const colors = getWheelColors();
    const [previewVariant, setPreviewVariant] = useState<string | null>(null);

    // Task 18: Collapse button when panel is hidden
    if (!chordPanelVisible) {
        return (
            <button
                onClick={toggleChordPanel}
                className="h-full w-8 flex items-center justify-center bg-bg-secondary border-l border-border-subtle hover:bg-bg-tertiary transition-colors"
                title="Show chord details"
            >
                <ChevronLeft size={16} className="text-text-muted" />
            </button>
        );
    }

    if (!selectedChord) {
        return (
            <div className="w-72 h-full flex flex-col bg-bg-secondary border-l border-border-subtle">
                {/* Header with hide button */}
                <div className="p-3 border-b border-border-subtle flex justify-between items-center shrink-0">
                    <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Chord Details</span>
                    <button
                        onClick={toggleChordPanel}
                        className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                        title="Hide panel"
                    >
                        <ChevronRight size={14} className="text-text-muted" />
                    </button>
                </div>
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-sm text-text-muted">
                        Select a chord from the wheel or timeline to view details
                    </p>
                </div>
            </div>
        );
    }

    const chordColor = colors[selectedChord.root as keyof typeof colors] || '#6366f1';
    
    // Get notes for preview (either selected chord or variant)
    const displayNotes = previewVariant 
        ? getChordNotes(selectedChord.root, previewVariant)
        : selectedChord.notes;

    // Task 19: Play chord variation and update display
    const handleVariationClick = (variant: string) => {
        const variantNotes = getChordNotes(selectedChord.root, variant);
        playChord(variantNotes);
        setPreviewVariant(variant);
        
        // Reset preview after a short delay
        setTimeout(() => setPreviewVariant(null), 2000);
    };

    // Task 27: Get theory note based on chord function
    const getTheoryNote = () => {
        const numeral = selectedChord.numeral;
        
        const theoryNotes: Record<string, string> = {
            'I': 'The tonic chord — your home base. Most songs begin and end here. It creates a sense of resolution and stability. Try adding maj7 or 6 for a jazzier sound.',
            'ii': 'The supertonic — a pre-dominant chord that naturally leads to V. The ii-V-I progression is fundamental in jazz and pop. Works great as m7.',
            'iii': 'The mediant — shares two notes with I and one with V. Can substitute for I or lead to vi. Often used for color and smooth voice leading.',
            'IV': 'The subdominant — creates a "plagal" sound. The IV-I progression is the "Amen" cadence. Adds warmth and often appears in the chorus of pop songs.',
            'V': 'The dominant — creates tension that wants to resolve to I. The V-I is the strongest resolution in tonal music. Add a 7th for extra pull.',
            'vi': 'The relative minor — shares the same notes as the I major scale. The vi-IV-I-V is one of the most popular progressions in pop music.',
            'vii°': 'The leading tone chord — unstable and wants to resolve to I. The diminished quality creates tension. Often used as a passing chord.',
            'II': 'Secondary dominant (V/V) — borrows dominant function to approach V. Creates a stronger pull to V. Common in jazz and classical.',
            'III': 'Secondary dominant (V/vi) — leads strongly to vi. Creates a dramatic shift to the relative minor.',
        };

        return theoryNotes[numeral || ''] || 'This chord adds color and interest to your progression.';
    };

    return (
        <div className="w-72 h-full flex flex-col bg-bg-secondary border-l border-border-subtle overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border-subtle relative shrink-0">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-baseline gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-text-primary">
                                {selectedChord.symbol}
                            </h2>
                            {selectedChord.numeral && (
                                <span className="text-lg text-text-muted font-serif italic">
                                    {selectedChord.numeral}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-text-muted">
                            in key of <span className="font-bold text-text-primary">{selectedKey}</span>
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setSelectedChord(null)}
                            className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                            title="Clear selection"
                        >
                            <X size={14} className="text-text-muted" />
                        </button>
                        <button
                            onClick={toggleChordPanel}
                            className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                            title="Hide panel"
                        >
                            <ChevronRight size={14} className="text-text-muted" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
                {/* Piano */}
                <div className="p-4 border-b border-border-subtle">
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
                        Voicing {previewVariant && <span className="text-accent-primary">({previewVariant})</span>}
                    </h3>
                    <PianoKeyboard
                        highlightedNotes={displayNotes}
                        rootNote={selectedChord.root}
                        color={chordColor}
                    />
                    <div className="mt-3 flex justify-around text-xs">
                        {displayNotes.map((note, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <span className="font-bold text-text-primary">{note}</span>
                                <span className="text-[10px] text-text-muted">
                                    {i === 0 ? 'Root' : i === 1 ? '3rd' : i === 2 ? '5th' : i === 3 ? '7th' : `${i + 1}th`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Extensions & Modifications */}
                <div className="p-4 border-b border-border-subtle">
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
                        Variations
                    </h3>
                    <div className="grid grid-cols-3 gap-1.5">
                        {['7', 'maj7', 'm7', 'sus2', 'sus4', 'dim', 'add9', '9', '11'].map((ext) => (
                            <button
                                key={ext}
                                className={`px-2 py-1.5 rounded text-[10px] font-medium transition-colors border ${
                                    previewVariant === ext 
                                        ? 'bg-accent-primary text-white border-accent-primary' 
                                        : 'bg-bg-elevated hover:bg-bg-tertiary text-text-secondary hover:text-text-primary border-border-subtle'
                                }`}
                                onClick={() => handleVariationClick(ext)}
                            >
                                {ext}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Task 25: Fixed Theory Info styling */}
                <div className="p-4">
                    <div className="p-3 bg-bg-elevated rounded-lg border border-border-subtle">
                        <h3 className="text-[10px] font-bold text-accent-primary uppercase tracking-wider mb-2">
                            Theory Note
                        </h3>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            {getTheoryNote()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

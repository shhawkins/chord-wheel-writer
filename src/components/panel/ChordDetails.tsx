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
                className="h-full w-6 flex items-center justify-center bg-bg-secondary border-l border-border-subtle hover:bg-bg-tertiary transition-colors shrink-0"
                title="Show chord details"
            >
                <ChevronLeft size={14} className="text-text-muted" />
            </button>
        );
    }

    if (!selectedChord) {
        return (
            <div className="w-64 h-full flex flex-col bg-bg-secondary border-l border-border-subtle shrink-0">
                {/* Header with hide button */}
                <div className="p-3 border-b border-border-subtle flex justify-between items-center shrink-0">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Details</span>
                    <button
                        onClick={toggleChordPanel}
                        className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                        title="Hide panel"
                    >
                        <ChevronRight size={14} className="text-text-muted" />
                    </button>
                </div>
                <div className="flex-1 flex items-center justify-center p-4 text-center">
                    <p className="text-xs text-text-muted">
                        Select a chord to view details
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

    // Get interval names based on count
    const getIntervalName = (index: number, total: number): string => {
        const names = ['R', '3', '5', '7', '9', '11', '13'];
        if (index < names.length) return names[index];
        return `${index + 1}`;
    };

    // Task 27: Get theory note based on chord function
    const getTheoryNote = () => {
        const numeral = selectedChord.numeral;
        
        const theoryNotes: Record<string, string> = {
            'I': 'Tonic — home base. Try maj7 or 6.',
            'ii': 'Supertonic — leads to V. Try m7.',
            'iii': 'Mediant — color chord. Shares notes with I.',
            'IV': 'Subdominant — warm, stable. The "amen" chord.',
            'V': 'Dominant — creates tension. Add 7 for pull.',
            'vi': 'Relative minor — the sad cousin of I.',
            'vii°': 'Leading tone — unstable, resolves to I.',
            'II': 'V/V — secondary dominant to V.',
            'III': 'V/vi — leads to relative minor.',
        };

        return theoryNotes[numeral || ''] || 'Adds color to your progression.';
    };

    return (
        <div className="w-64 h-full flex flex-col bg-bg-secondary border-l border-border-subtle overflow-hidden shrink-0">
            {/* Header */}
            <div className="p-3 border-b border-border-subtle shrink-0">
                <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 mb-0.5">
                            <h2 className="text-xl font-bold text-text-primary truncate">
                                {selectedChord.symbol}
                            </h2>
                            {selectedChord.numeral && (
                                <span className="text-sm text-text-muted font-serif italic shrink-0">
                                    {selectedChord.numeral}
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-text-muted">
                            Key of <span className="font-bold">{selectedKey}</span>
                        </p>
                    </div>
                    <div className="flex gap-0.5 shrink-0 ml-2">
                        <button
                            onClick={() => setSelectedChord(null)}
                            className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                            title="Clear"
                        >
                            <X size={12} className="text-text-muted" />
                        </button>
                        <button
                            onClick={toggleChordPanel}
                            className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                            title="Hide"
                        >
                            <ChevronRight size={12} className="text-text-muted" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {/* Piano */}
                <div className="p-3 border-b border-border-subtle">
                    <h3 className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-2">
                        Voicing {previewVariant && <span className="text-accent-primary">({previewVariant})</span>}
                    </h3>
                    <PianoKeyboard
                        highlightedNotes={displayNotes}
                        rootNote={selectedChord.root}
                        color={chordColor}
                    />
                    {/* Notes display - flexible grid that wraps */}
                    <div className="mt-2 flex flex-wrap justify-center gap-1">
                        {displayNotes.map((note, i) => (
                            <div 
                                key={i} 
                                className="flex flex-col items-center px-1.5 py-0.5 bg-bg-elevated rounded text-[10px]"
                            >
                                <span className="font-bold text-text-primary">{note}</span>
                                <span className="text-[8px] text-text-muted">
                                    {getIntervalName(i, displayNotes.length)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Variations */}
                <div className="p-3 border-b border-border-subtle">
                    <h3 className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-2">
                        Variations
                    </h3>
                    <div className="grid grid-cols-3 gap-1">
                        {['7', 'maj7', 'm7', 'sus2', 'sus4', 'dim', 'add9', '9', '11'].map((ext) => (
                            <button
                                key={ext}
                                className={`px-1.5 py-1 rounded text-[9px] font-medium transition-colors border ${
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

                {/* Theory Note */}
                <div className="p-3">
                    <div className="p-2 bg-bg-elevated rounded border border-border-subtle">
                        <h3 className="text-[9px] font-bold text-accent-primary uppercase tracking-wider mb-1">
                            Theory
                        </h3>
                        <p className="text-[10px] text-text-secondary leading-relaxed break-words">
                            {getTheoryNote()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

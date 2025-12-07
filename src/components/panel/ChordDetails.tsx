import React from 'react';
import { useSongStore } from '../../store/useSongStore';
import { PianoKeyboard } from './PianoKeyboard';
import { getWheelColors, getChordNotes, getIntervalFromKey } from '../../utils/musicTheory';
import { PanelRightClose, PanelRight, GripVertical, HelpCircle } from 'lucide-react';
import { playChord } from '../../utils/audioEngine';
import { useState, useCallback, useEffect } from 'react';
import { HelpModal } from '../HelpModal';

interface ChordDetailsProps {
    variant?: 'sidebar' | 'drawer';
}

export const ChordDetails: React.FC<ChordDetailsProps> = ({ variant = 'sidebar' }) => {
    const { selectedChord, selectedKey, chordPanelVisible, toggleChordPanel, selectedSectionId, selectedSlotId, addChordToSlot, setSelectedChord } = useSongStore();
    const isDrawer = variant === 'drawer';
    const colors = getWheelColors();
    const [previewVariant, setPreviewVariant] = useState<string | null>(null);
    const [previewNotes, setPreviewNotes] = useState<string[]>([]);
    const [panelWidth, setPanelWidth] = useState(280);
    const [isResizing, setIsResizing] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [persistedChord, setPersistedChord] = useState(selectedChord);
    const chord = selectedChord ?? persistedChord;
    const voicingTooltips: Record<string, string> = {
        'maj': 'Bright, stable major triad — home base sound.',
        '7': 'Dominant 7: bluesy tension that wants to resolve.',
        'maj7': 'Dreamy, smooth major color — great on I or IV.',
        'maj9': 'Airy, modern major flavor; adds sparkle without tension.',
        'maj13': 'Lush, extended major pad; orchestral/jazz sheen.',
        '6': 'Warm vintage major; softer than maj7 for tonic use.',
        '13': 'Dominant with a soulful top; funky/jazz turnaround vibe.',
        'm7': 'Soulful, laid-back minor — default jazz ii sound.',
        'm9': 'Lush, cinematic minor color with extra depth.',
        'm11': 'Spacious, modal minor; great for grooves and vamps.',
        'm6': 'Bittersweet/film-noir minor; nice tonic minor option.',
        'sus2': 'Open and airy with no third; neutral pop/ambient feel.',
        'sus4': 'Suspended tension that likes to resolve to major.',
        'dim': 'Tense and unstable; classic passing/leading chord.',
        'm7b5': 'Half-diminished; dark ii chord in minor keys.',
        'add9': 'Sparkly major with no 7th; modern pop shimmer.',
        '9': 'Dominant 9: rich funk/jazz tension with color.',
        '11': 'Dominant 11: suspended, modal flavor over V.',
    };
    const voicingOptions = [
        'maj',
        '7',
        'maj7',
        'maj9',
        'maj13',
        '6',
        '13',
        'm7',
        'm9',
        'm11',
        'm6',
        'sus2',
        'sus4',
        'dim',
        'm7b5',
        'add9',
        '9',
        '11',
    ];

    // Handle resize drag
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (isDrawer) return;
        e.preventDefault();
        setIsResizing(true);
    }, [isDrawer]);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = window.innerWidth - e.clientX;
            setPanelWidth(Math.max(200, Math.min(400, newWidth)));
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    useEffect(() => {
        if (selectedChord) {
            setPersistedChord(selectedChord);
        }
    }, [selectedChord]);

    // Clear preview when chord changes
    useEffect(() => {
        setPreviewVariant(null);
        setPreviewNotes([]);
    }, [chord?.root, chord?.quality]);

    const chordColor = chord
        ? (colors[chord.root as keyof typeof colors] || '#6366f1')
        : '#6366f1';

    const getAbsoluteDegree = (note: string): string => {
        if (!chord?.root) return '-';

        const normalize = (n: string) => n.replace(/[\d]/g, '').replace(/♭/, 'b').replace(/♯/, '#');
        const semitoneMap: Record<string, number> = {
            'C': 0,
            'B#': 0,
            'C#': 1,
            'Db': 1,
            'D': 2,
            'D#': 3,
            'Eb': 3,
            'E': 4,
            'Fb': 4,
            'E#': 5,
            'F': 5,
            'F#': 6,
            'Gb': 6,
            'G': 7,
            'G#': 8,
            'Ab': 8,
            'A': 9,
            'A#': 10,
            'Bb': 10,
            'B': 11,
            'Cb': 11,
        };

        const rootPc = semitoneMap[normalize(chord.root)];
        const notePc = semitoneMap[normalize(note)];
        if (rootPc === undefined || notePc === undefined) return '-';

        const interval = (notePc - rootPc + 12) % 12;
        const degreeMap: Record<number, string> = {
            0: 'R',
            1: '♭2',
            2: '2',
            3: '♭3',
            4: '3',
            5: '4',
            6: '♭5',
            7: '5',
            8: '♭6',
            9: '6',
            10: '♭7',
            11: '7',
        };

        return degreeMap[interval] ?? '-';
    };

    // Notes to display: preview notes (if any) > selected chord notes
    const displayNotes = previewNotes.length > 0
        ? previewNotes
        : (chord?.notes || []);

    // Play chord variation and show notes until another is clicked
    const handleVariationClick = (variant: string) => {
        if (!chord) return;

        const variantNotes = getChordNotes(chord.root, variant);
        console.log(`Playing ${chord.root}${variant}:`, variantNotes);

        playChord(variantNotes);
        setPreviewVariant(variant);
        setPreviewNotes(variantNotes);

        // If a timeline slot is selected, update the chord in that slot
        if (selectedSectionId && selectedSlotId) {
            // Construct the new chord object
            // We need to map quality back to the internal quality type if possible, or just pass it as is 
            // since getChordNotes handles the mapping. 
            // Ideally we should use a proper type for quality.
            // For now, we rely on the fact that our Chord type has 'quality' as a union, 
            // but we might need to be careful with 'variant' being just a string. 
            // Let's assume 'variant' maps to one of the extended qualities in most cases.

            // We'll update the selected chord in the store to reflect the change immediately
            const newChord = {
                ...chord,
                quality: variant as any, // Cast to any because our variant string might be 'sus2' etc which are valid qualities
                symbol: `${chord.root}${variant === 'major' ? '' : variant}`, // basic symbol construction
                notes: variantNotes
            };

            // Fix symbol if it looks weird (like Cmajor) - actually variant usually comes from the button text like 'maj7'
            // We can improve symbol generation logic or import CHORD_SYMBOLS reversed or similar.
            // For 'maj7', symbol is Root + 'maj7'. For '7', Root + '7'.
            // The button labels match common symbol suffixes.
            newChord.symbol = `${chord.root}${variant}`;

            addChordToSlot(newChord, selectedSectionId, selectedSlotId);
            setSelectedChord(newChord);
        }
    };

    // Clear preview (back to base chord)
    const clearPreview = () => {
        setPreviewVariant(null);
        setPreviewNotes([]);
    };



    // Get theory note
    const getTheoryNote = () => {
        if (!chord) return '';
        const numeral = chord.numeral;

        const theoryNotes: Record<string, string> = {
            'I': 'The tonic chord — your home base. Most songs begin and end here. Try adding maj7 or 6 for a jazzier sound.',
            'ii': 'The supertonic — a pre-dominant chord that naturally leads to V. The ii-V-I progression is fundamental in jazz and pop.',
            'iii': 'The mediant — shares two notes with I. Can substitute for I or lead to vi. Often used for color.',
            'IV': 'The subdominant — creates a "plagal" sound. The IV-I is the "Amen" cadence. Adds warmth to choruses.',
            'V': 'The dominant — creates tension that resolves to I. Add a 7th for extra pull toward home.',
            'vi': 'The relative minor — shares the same notes as I major. The vi-IV-I-V is hugely popular in pop music.',
            'vii°': 'The leading tone chord — unstable and wants to resolve to I. Often used as a passing chord.',
            'II': 'Secondary dominant (V/V) — borrows dominant function to approach V. Common in jazz.',
            'III': 'Secondary dominant (V/vi) — leads strongly to vi. Creates a dramatic shift.',
        };

        return theoryNotes[numeral || ''] || 'This chord adds color and interest to your progression.';
    };

    // Get suggested voicings based on chord function
    const getSuggestedVoicings = (): { extensions: string[], description: string } => {
        if (!chord) return { extensions: [], description: '' };
        let numeral = chord.numeral;
        
        // Extract base numeral if it contains parentheses (e.g., "II (V of V)" -> "II")
        if (numeral && numeral.includes('(')) {
            const match = numeral.match(/^(.+?)\s*\(/);
            if (match) {
                numeral = match[1].trim();
            }
        }

        const suggestions: Record<string, { extensions: string[], description: string }> = {
            'I': {
                extensions: ['maj7', 'maj9', 'maj13', '6'],
                description: 'Major 7th or 6th voicings sound rich and resolved'
            },
            'IV': {
                extensions: ['maj7', 'maj9', 'maj13', '6'],
                description: 'Same as I — warm major extensions work beautifully'
            },
            'V': {
                extensions: ['7', '9', '11', 'sus4', '13'],
                description: 'Dominant 7th adds tension that pulls to I'
            },
            'ii': {
                extensions: ['m7', 'm9', 'm11', 'm6'],
                description: 'Minor 7th extensions for a smooth jazz sound'
            },
            'iii': {
                extensions: ['m7'],
                description: 'Keep it simple — m7 is most common for iii'
            },
            'vi': {
                extensions: ['m7', 'm9', 'm11'],
                description: 'Minor extensions add depth and emotion'
            },
            'vii°': {
                extensions: ['m7♭5'],
                description: 'Half-diminished (ø7) is the standard voicing'
            },
            'II': {
                extensions: ['7', 'sus4'],
                description: 'Dominant voicing as V/V — leads strongly to V'
            },
            'III': {
                extensions: ['7', 'sus4'],
                description: 'Dominant voicing as V/vi — leads strongly to vi'
            },
        };

        return suggestions[numeral || ''] || { extensions: [], description: 'Try different extensions to find your sound' };
    };

    // Collapsed state - just show a button
    if (!chordPanelVisible) {
        return (
            <button
                onClick={toggleChordPanel}
                className="h-full px-2 flex items-center justify-center bg-bg-secondary border-l border-border-subtle hover:bg-bg-tertiary transition-colors shrink-0"
                title="Show chord details"
            >
                <PanelRight size={18} className="text-text-muted" />
            </button>
        );
    }

    return (
        <div
            className="h-full flex bg-bg-secondary border-l border-border-subtle shrink-0"
            style={{ width: panelWidth, minWidth: panelWidth }}
        >
            {/* Resize handle */}
            <div
                className={`w-2 flex items-center justify-center cursor-ew-resize hover:bg-bg-tertiary transition-colors ${isResizing ? 'bg-accent-primary/20' : ''}`}
                onMouseDown={handleMouseDown}
            >
                <GripVertical size={12} className="text-text-muted" />
            </div>

            {/* Panel content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
                {/* Header with single hide button */}
                <div className="p-3 border-b border-border-subtle flex justify-between items-center shrink-0">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
                        {chord ? chord.symbol : 'Chord Details'}
                        {chord?.numeral && (
                            <span className="ml-2 font-serif italic text-text-secondary">{chord.numeral}</span>
                        )}
                    </span>
                    <button
                        onClick={toggleChordPanel}
                        className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                        title="Hide panel"
                    >
                        <PanelRightClose size={16} className="text-text-muted" />
                    </button>
                </div>

                {/* Content */}
                {!chord ? (
                    <div className="flex-1 flex items-center justify-center p-6">
                        <p className="text-sm text-text-muted text-center">
                            Select a chord from the wheel or timeline
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {/* Key indicator */}
                        <div className="px-4 py-3 border-b border-border-subtle bg-bg-elevated/30">
                            <p className="text-xs text-text-muted">
                                Key of <span className="font-bold text-text-primary text-sm">{selectedKey}</span>
                            </p>
                        </div>

                        {/* Piano & Voicing Section */}
                        <div className="px-4 py-4 border-b border-border-subtle">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                    Voicing {previewVariant && <span className="text-accent-primary ml-1">({previewVariant})</span>}
                                </h3>
                                {previewVariant && (
                                    <button
                                        onClick={clearPreview}
                                        className="text-[9px] text-accent-primary hover:text-accent-secondary transition-colors"
                                    >
                                        ← back to {chord.symbol}
                                    </button>
                                )}
                            </div>
                            <PianoKeyboard
                                highlightedNotes={displayNotes}
                                rootNote={chord.root}
                                color={chordColor}
                            />
                            {/* Notes display with absolute and relative lines */}
                            <div className="mt-4 w-full">
                                <div
                                    className="grid w-full items-center gap-y-1"
                                    style={{
                                        gridTemplateColumns: `auto repeat(${displayNotes.length}, minmax(0,1fr))`,
                                        columnGap: '6px',
                                        rowGap: '4px',
                                    }}
                                >
                                    <div className="text-[9px] font-semibold uppercase tracking-wide text-text-muted leading-tight">Notes</div>
                                    {displayNotes.map((note, i) => (
                                        <div
                                            key={`note-${i}`}
                                            className="text-center text-[12px] font-bold text-text-primary leading-none py-1"
                                            style={{ minHeight: 24 }}
                                        >
                                            {note}
                                        </div>
                                    ))}

                                    <div className="text-[9px] font-semibold uppercase tracking-wide text-text-muted leading-tight">Absolute</div>
                                    {displayNotes.map((note, i) => (
                                        <div
                                            key={`abs-${i}`}
                                            className="text-center text-[11px] text-text-primary font-semibold leading-none py-1"
                                            style={{ minHeight: 24 }}
                                        >
                                            {getAbsoluteDegree(note)}
                                        </div>
                                    ))}

                                    <div className="text-[9px] font-semibold uppercase tracking-wide text-text-muted leading-tight">Relative to Key</div>
                                    {displayNotes.map((note, i) => (
                                        <div
                                            key={`rel-${i}`}
                                            className="text-center text-[11px] text-text-secondary leading-none py-1"
                                            style={{ minHeight: 24 }}
                                        >
                                            {getIntervalFromKey(selectedKey, note).replace(/^1/, 'R')}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Variations */}
                        <div className="px-4 py-4 border-b border-border-subtle">
                            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
                                Variations
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {voicingOptions.map((ext, idx) => {
                                    const colIndex = idx % 3;
                                    const isLeftCol = colIndex === 0;
                                    const tooltipPositionStyle = isLeftCol
                                        ? { left: 'calc(100% + 10px)', top: '50%', transform: 'translateY(-50%)' }
                                        : { right: 'calc(100% + 10px)', top: '50%', transform: 'translateY(-50%)' };

                                    return (
                                        <button
                                            key={ext}
                                            className={`relative group px-2 py-1.5 rounded text-[10px] font-medium transition-colors border ${previewVariant === ext
                                                ? 'bg-accent-primary text-white border-accent-primary'
                                                : 'bg-bg-elevated hover:bg-bg-tertiary text-text-secondary hover:text-text-primary border-border-subtle'
                                                }`}
                                            onClick={() => handleVariationClick(ext)}
                                            onDoubleClick={() => handleVariationClick(ext)}
                                        >
                                            {ext}
                                            {voicingTooltips[ext] && (
                                                <span
                                                    className="pointer-events-none absolute whitespace-normal text-[10px] leading-tight bg-black text-white px-3 py-2 rounded border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 group-active:opacity-0 group-active:delay-1000 group-focus:opacity-0 transition-opacity duration-150 group-hover:delay-150 z-50 w-44 text-left"
                                                    style={{
                                                        ...tooltipPositionStyle,
                                                        backgroundColor: '#000',
                                                        color: '#fff',
                                                        padding: '8px 10px'
                                                    }}
                                                >
                                                    {voicingTooltips[ext]}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Suggested Voicings - now after variations */}
                        {chord?.numeral && getSuggestedVoicings().extensions.length > 0 && (
                            <div className="px-4 py-4 border-b border-border-subtle bg-accent-primary/5">
                                <h3 className="text-[10px] font-bold text-accent-primary uppercase tracking-wider mb-3">
                                    Suggested for {chord.numeral}
                                </h3>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {getSuggestedVoicings().extensions.map((ext) => (
                                        <button
                                            key={ext}
                                            className={`relative group px-3 py-1.5 rounded text-xs font-semibold transition-colors ${previewVariant === ext
                                                ? 'bg-accent-primary text-white'
                                                : 'bg-bg-elevated hover:bg-accent-primary/20 text-text-primary border border-border-subtle'
                                                }`}
                                            onClick={() => handleVariationClick(ext)}
                                        >
                                            {chord.root}{ext}
                                            {voicingTooltips[ext] && (
                                                <span
                                                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-normal text-[10px] leading-tight bg-black text-white px-3 py-2 rounded border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 group-active:opacity-0 group-active:delay-1000 group-focus:opacity-0 transition-opacity duration-150 group-hover:delay-150 z-50 w-44 text-left"
                                                    style={{
                                                        top: 'calc(100% + 10px)',
                                                        backgroundColor: '#000',
                                                        color: '#fff',
                                                        padding: '8px 10px'
                                                    }}
                                                >
                                                    {voicingTooltips[ext]}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-text-muted leading-relaxed">
                                    {getSuggestedVoicings().description}
                                </p>
                            </div>
                        )}

                        {/* Theory Note - with proper text wrapping */}
                        <div className="px-4 py-4">
                            <div className="p-4 bg-bg-elevated rounded-lg border border-border-subtle">
                                <h3 className="text-[10px] font-bold text-accent-primary uppercase tracking-wider mb-2">
                                    Theory
                                </h3>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    {getTheoryNote()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Help button at bottom left */}
                <button
                    onClick={() => setShowHelp(true)}
                    className="absolute bottom-3 left-3 w-7 h-7 flex items-center justify-center bg-bg-tertiary hover:bg-accent-primary/20 border border-border-subtle rounded-full text-text-muted hover:text-accent-primary transition-colors"
                    title="Chord Wheel Guide"
                >
                    <HelpCircle size={14} />
                </button>
            </div>

            {/* Help Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        </div>
    );
};

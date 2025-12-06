import React, { useMemo } from 'react';
import { useSongStore } from '../../store/useSongStore';
import { 
    MAJOR_POSITIONS,
    getWheelColors, 
    getChordNotes,
    getKeySignature,
    CIRCLE_OF_FIFTHS,
    type Chord 
} from '../../utils/musicTheory';
import { WheelSegment } from './WheelSegment';
import { polarToCartesian } from '../../utils/geometry';
import { RotateCw, RotateCcw } from 'lucide-react';
import { playChord } from '../../utils/audioEngine';

export const ChordWheel: React.FC = () => {
    const {
        selectedKey,
        setKey,
        addChordToSlot,
        selectedSectionId,
        selectedSlotId,
        showRomanNumerals,
        currentSong,
        setSelectedChord
    } = useSongStore();

    const colors = getWheelColors();

    // SVG dimensions
    const size = 600;
    const cx = size / 2;
    const cy = size / 2;
    
    // Ring radii
    const centerRadius = 60;
    const majorInnerRadius = centerRadius + 8;
    const majorOuterRadius = 145;
    const minorInnerRadius = majorOuterRadius;
    const minorOuterRadius = 210;
    const dimInnerRadius = minorOuterRadius;
    const dimOuterRadius = 250;

    // Key signature info
    const keySig = useMemo(() => getKeySignature(selectedKey), [selectedKey]);
    const keySigDisplay = useMemo(() => {
        if (keySig.sharps > 0) return `${keySig.sharps}♯`;
        if (keySig.flats > 0) return `${keySig.flats}♭`;
        return '';
    }, [keySig]);

    // Calculate wheel rotation based on selected key
    // The wheel rotates so the selected key appears at the TOP (under position I)
    const keyIndex = CIRCLE_OF_FIFTHS.indexOf(selectedKey);
    const calculatedRotation = -keyIndex * 30; // Negative because we rotate the wheel to bring the key to top

    const handleChordClick = (chord: Chord) => {
        playChord(chord.notes);
        setSelectedChord(chord);

        if (selectedSectionId && selectedSlotId) {
            addChordToSlot(chord, selectedSectionId, selectedSlotId);
            return;
        }

        if (selectedSectionId) {
            const section = currentSong.sections.find(s => s.id === selectedSectionId);
            if (section) {
                for (const measure of section.measures) {
                    for (const beat of measure.beats) {
                        if (!beat.chord) {
                            addChordToSlot(chord, section.id, beat.id);
                            return;
                        }
                    }
                }
            }
        }

        for (const section of currentSong.sections) {
            for (const measure of section.measures) {
                for (const beat of measure.beats) {
                    if (!beat.chord) {
                        addChordToSlot(chord, section.id, beat.id);
                        return;
                    }
                }
            }
        }
    };

    const handleRotate = (direction: 'cw' | 'ccw') => {
        // Change key - wheel will auto-rotate to position
        const currentIndex = CIRCLE_OF_FIFTHS.indexOf(selectedKey);
        const newIndex = direction === 'cw'
            ? (currentIndex + 1) % 12
            : (currentIndex - 1 + 12) % 12;

        setKey(CIRCLE_OF_FIFTHS[newIndex]);
    };

    // Create the FIXED triangular overlay - this shows the diatonic positions
    // The triangle encompasses: IV, I, V (inner), ii, iii, vi (middle), vii° (outer)
    const createTriangleOverlay = () => {
        // The triangle spans from IV position (-30° from center) through I (center) to V (+30°)
        // But it's shaped to encompass all 7 diatonic chord positions
        
        // Angular positions (0° = top/12 o'clock):
        // I = 0° (center top)
        // V = 30° (clockwise, right side)
        // IV = -30° (counter-clockwise, left side)
        // iii = centered on I (0°)
        // ii = between IV and I (around -15°)
        // vi = between I and V (around 15°)
        // vii° = above iii (0°)
        
        const leftAngle = -52;   // Left edge (past IV)
        const rightAngle = 52;   // Right edge (past V)
        
        const outerLeft = polarToCartesian(cx, cy, dimOuterRadius + 8, leftAngle);
        const outerRight = polarToCartesian(cx, cy, dimOuterRadius + 8, rightAngle);
        const innerLeft = polarToCartesian(cx, cy, majorInnerRadius - 5, leftAngle);
        const innerRight = polarToCartesian(cx, cy, majorInnerRadius - 5, rightAngle);
        
        return `
            M ${outerLeft.x} ${outerLeft.y}
            A ${dimOuterRadius + 8} ${dimOuterRadius + 8} 0 0 1 ${outerRight.x} ${outerRight.y}
            L ${innerRight.x} ${innerRight.y}
            A ${majorInnerRadius - 5} ${majorInnerRadius - 5} 0 0 0 ${innerLeft.x} ${innerLeft.y}
            Z
        `;
    };

    // Check if a position is within the highlighted triangle (diatonic)
    // After rotation, the chord at position keyIndex is at the top (I position)
    // We need to check the RELATIVE position after rotation
    const getRelativePosition = (posIndex: number): number => {
        // Returns 0 if this position is at I, 1 if at V, 11 if at IV, etc.
        return (posIndex - keyIndex + 12) % 12;
    };

    const isPositionDiatonic = (posIndex: number, type: 'major' | 'ii' | 'iii' | 'dim'): boolean => {
        const relPos = getRelativePosition(posIndex);
        
        if (type === 'major') {
            // I (relPos 0), IV (relPos 11), V (relPos 1)
            return relPos === 0 || relPos === 1 || relPos === 11;
        }
        if (type === 'ii') {
            // ii is at I position (relPos 0), left slot
            return relPos === 0;
        }
        if (type === 'iii') {
            // iii is at I position (relPos 0), right slot
            return relPos === 0;
        }
        if (type === 'dim') {
            // vii° is at I position (relPos 0)
            return relPos === 0;
        }
        return false;
    };

    // Also need to highlight vi - which is the ii (left slot) of the V position
    const isViPosition = (posIndex: number): boolean => {
        const relPos = getRelativePosition(posIndex);
        return relPos === 1; // V position's left slot = vi
    };

    // Get roman numeral for a diatonic position
    const getRomanNumeral = (posIndex: number, type: 'major' | 'ii' | 'iii' | 'dim'): string => {
        const relPos = getRelativePosition(posIndex);
        
        if (type === 'major') {
            if (relPos === 0) return 'I';
            if (relPos === 1) return 'V';
            if (relPos === 11) return 'IV';
        }
        if (type === 'ii') {
            if (relPos === 0) return 'ii';
            if (relPos === 1) return 'vi'; // ii of V = vi of I
        }
        if (type === 'iii') {
            if (relPos === 0) return 'iii';
        }
        if (type === 'dim') {
            if (relPos === 0) return 'vii°';
        }
        return '';
    };

    return (
        <div className="relative flex flex-col items-center justify-center w-full h-full max-w-[540px] max-h-[540px] aspect-square p-2">
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${size} ${size}`}
                className="w-full h-full select-none"
            >
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* ROTATING WHEEL - rotates based on selected key */}
                <g
                    style={{
                        transform: `rotate(${calculatedRotation}deg)`,
                        transformOrigin: `${cx}px ${cy}px`,
                        transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                >
                    {MAJOR_POSITIONS.map((position, i) => {
                        const majorAngleSize = 30;
                        const majorStartAngle = i * majorAngleSize - 90 - (majorAngleSize / 2);
                        const majorEndAngle = majorStartAngle + majorAngleSize;
                        
                        const baseColor = colors[position.major as keyof typeof colors] || colors.C;
                        
                        // Extract roots
                        const iiRoot = position.ii.replace('m', '');
                        const iiiRoot = position.iii.replace('m', '');
                        const dimRoot = position.diminished.replace('°', '');

                        // Check if this position is in the diatonic area
                        const majorIsDiatonic = isPositionDiatonic(i, 'major');
                        // ii slot: diatonic if at I position (as ii) OR at V position (as vi)
                        const iiIsDiatonic = isPositionDiatonic(i, 'ii') || isViPosition(i);
                        const iiiIsDiatonic = isPositionDiatonic(i, 'iii');
                        const dimIsDiatonic = isPositionDiatonic(i, 'dim');

                        // Create chord objects
                        const majorChord: Chord = {
                            root: position.major,
                            quality: 'major',
                            numeral: getRomanNumeral(i, 'major'),
                            notes: getChordNotes(position.major, 'major'),
                            symbol: position.major
                        };

                        const iiChord: Chord = {
                            root: iiRoot,
                            quality: 'minor',
                            numeral: getRomanNumeral(i, 'ii'),
                            notes: getChordNotes(iiRoot, 'minor'),
                            symbol: position.ii
                        };

                        const iiiChord: Chord = {
                            root: iiiRoot,
                            quality: 'minor',
                            numeral: getRomanNumeral(i, 'iii'),
                            notes: getChordNotes(iiiRoot, 'minor'),
                            symbol: position.iii
                        };

                        const dimChord: Chord = {
                            root: dimRoot,
                            quality: 'diminished',
                            numeral: getRomanNumeral(i, 'dim'),
                            notes: getChordNotes(dimRoot, 'diminished'),
                            symbol: position.diminished
                        };

                        // Minor ring: 24 segments (15° each)
                        const minorAngleSize = 15;
                        const iiStartAngle = majorStartAngle;
                        const iiEndAngle = iiStartAngle + minorAngleSize;
                        const iiiStartAngle = iiEndAngle;
                        const iiiEndAngle = iiiStartAngle + minorAngleSize;

                        // Diminished: narrow notch (15° width) centered on the position
                        const dimAngleSize = 15;
                        const dimStartAngle = majorStartAngle + (majorAngleSize - dimAngleSize) / 2;
                        const dimEndAngle = dimStartAngle + dimAngleSize;

                        // Determine labels
                        const majorLabel = showRomanNumerals && majorIsDiatonic 
                            ? getRomanNumeral(i, 'major') 
                            : position.major;
                        const iiLabel = showRomanNumerals && iiIsDiatonic 
                            ? getRomanNumeral(i, 'ii') 
                            : position.ii;
                        const iiiLabel = showRomanNumerals && iiiIsDiatonic 
                            ? getRomanNumeral(i, 'iii') 
                            : position.iii;
                        const dimLabel = showRomanNumerals && dimIsDiatonic 
                            ? getRomanNumeral(i, 'dim') 
                            : position.diminished;

                        return (
                            <g key={position.major}>
                                {/* INNER RING: Major chords (12 segments, 30° each) */}
                                <WheelSegment
                                    cx={cx}
                                    cy={cy}
                                    innerRadius={majorInnerRadius}
                                    outerRadius={majorOuterRadius}
                                    startAngle={majorStartAngle}
                                    endAngle={majorEndAngle}
                                    color={baseColor}
                                    label={majorLabel}
                                    chord={majorChord}
                                    isSelected={false}
                                    isDiatonic={majorIsDiatonic}
                                    onClick={handleChordClick}
                                    ringType="major"
                                />

                                {/* MIDDLE RING: ii chord (left 15° slot) */}
                                <WheelSegment
                                    cx={cx}
                                    cy={cy}
                                    innerRadius={minorInnerRadius}
                                    outerRadius={minorOuterRadius}
                                    startAngle={iiStartAngle}
                                    endAngle={iiEndAngle}
                                    color={baseColor}
                                    label={iiLabel}
                                    chord={iiChord}
                                    isSelected={false}
                                    isDiatonic={iiIsDiatonic}
                                    onClick={handleChordClick}
                                    ringType="minor"
                                />

                                {/* MIDDLE RING: iii chord (right 15° slot) */}
                                <WheelSegment
                                    cx={cx}
                                    cy={cy}
                                    innerRadius={minorInnerRadius}
                                    outerRadius={minorOuterRadius}
                                    startAngle={iiiStartAngle}
                                    endAngle={iiiEndAngle}
                                    color={baseColor}
                                    label={iiiLabel}
                                    chord={iiiChord}
                                    isSelected={false}
                                    isDiatonic={iiiIsDiatonic}
                                    onClick={handleChordClick}
                                    ringType="minor"
                                />

                                {/* OUTER RING: Diminished chord (narrow 15° notch, centered) */}
                                <WheelSegment
                                    cx={cx}
                                    cy={cy}
                                    innerRadius={dimInnerRadius}
                                    outerRadius={dimOuterRadius}
                                    startAngle={dimStartAngle}
                                    endAngle={dimEndAngle}
                                    color={baseColor}
                                    label={dimLabel}
                                    chord={dimChord}
                                    isSelected={false}
                                    isDiatonic={dimIsDiatonic}
                                    onClick={handleChordClick}
                                    ringType="diminished"
                                />
                            </g>
                        );
                    })}
                </g>

                {/* FIXED Triangular Overlay - always stays at top, shows diatonic area */}
                <g pointerEvents="none">
                    <path
                        d={createTriangleOverlay()}
                        fill="none"
                        stroke="rgba(255,255,255,0.9)"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                    />
                </g>

                {/* Center Circle */}
                <circle cx={cx} cy={cy} r={centerRadius} fill="#1a1a24" stroke="#3a3a4a" strokeWidth="2" />
                
                {/* KEY Label */}
                <text x={cx} y={cy - 22} textAnchor="middle" fill="#6366f1" fontSize="9" fontWeight="bold" letterSpacing="2">
                    KEY
                </text>
                
                {/* Key Name */}
                <text x={cx} y={cy + 6} textAnchor="middle" fill="white" fontSize="26" fontWeight="bold">
                    {selectedKey}
                </text>
                
                {/* Key Signature */}
                <text x={cx} y={cy + 24} textAnchor="middle" fill="#9898a6" fontSize="11">
                    {keySigDisplay || 'No ♯/♭'}
                </text>

                {/* Rotation Controls */}
                <g 
                    transform={`translate(${cx - 22}, ${cy + 38})`} 
                    onClick={() => handleRotate('ccw')} 
                    className="cursor-pointer"
                    style={{ pointerEvents: 'all' }}
                >
                    <circle r="9" fill="#282833" className="hover:fill-[#3a3a4a] transition-colors" />
                    <g transform="translate(-4.5, -4.5)">
                        <RotateCcw size={9} color="#9898a6" />
                    </g>
                </g>
                <g 
                    transform={`translate(${cx + 22}, ${cy + 38})`} 
                    onClick={() => handleRotate('cw')} 
                    className="cursor-pointer"
                    style={{ pointerEvents: 'all' }}
                >
                    <circle r="9" fill="#282833" className="hover:fill-[#3a3a4a] transition-colors" />
                    <g transform="translate(-4.5, -4.5)">
                        <RotateCw size={9} color="#9898a6" />
                    </g>
                </g>
            </svg>
        </div>
    );
};

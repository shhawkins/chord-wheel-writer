import React from 'react';
import { describeSector, polarToCartesian } from '../../utils/geometry';
import type { Chord } from '../../utils/musicTheory';
import clsx from 'clsx';

interface WheelSegmentProps {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    color: string;
    label: string;
    chord: Chord;
    isSelected: boolean;
    isDiatonic: boolean;
    isSecondary?: boolean;
    onClick: (chord: Chord) => void;
    ringType?: 'major' | 'minor' | 'diminished';
    wheelRotation?: number;
    romanNumeral?: string;
    voicingSuggestion?: string;
}

export const WheelSegment: React.FC<WheelSegmentProps> = ({
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    color,
    label,
    chord,
    isSelected,
    isDiatonic,
    isSecondary = false,
    onClick,
    ringType = 'major',
    wheelRotation = 0,
    romanNumeral,
    voicingSuggestion
}) => {
    const path = describeSector(cx, cy, innerRadius, outerRadius, startAngle, endAngle);
    const midAngle = (startAngle + endAngle) / 2;

    // Calculate final screen angle after wheel rotation
    const screenAngle = midAngle + wheelRotation;
    const normalizedScreenAngle = ((screenAngle % 360) + 360) % 360;
    
    // Determine if text should be flipped (when segment is in bottom half of screen)
    const shouldFlip = normalizedScreenAngle > 90 && normalizedScreenAngle < 270;
    
    // Text rotation: counter-rotate by wheel rotation, then flip if needed
    const baseTextRotation = -wheelRotation;
    const textRotation = shouldFlip ? baseTextRotation + 180 : baseTextRotation;

    // Calculate positions for different text elements
    // Voicing: near outer edge (top of ring when right-side up, bottom when flipped)
    // Chord name: center of ring
    // Numeral: near inner edge (bottom of ring when right-side up, top when flipped)
    
    const ringHeight = outerRadius - innerRadius;
    const voicingRadius = shouldFlip 
        ? innerRadius + ringHeight * 0.15  // Near inner edge when flipped
        : outerRadius - ringHeight * 0.15; // Near outer edge normally
    const chordRadius = innerRadius + ringHeight * 0.5;  // Center
    const numeralRadius = shouldFlip
        ? outerRadius - ringHeight * 0.18  // Near outer edge when flipped  
        : innerRadius + ringHeight * 0.18; // Near inner edge normally

    const voicingPos = polarToCartesian(cx, cy, voicingRadius, midAngle);
    const chordPos = polarToCartesian(cx, cy, chordRadius, midAngle);
    const numeralPos = polarToCartesian(cx, cy, numeralRadius, midAngle);

    // Adjust color based on ring type and diatonic status
    const getSegmentStyle = () => {
        let baseOpacity = 0.35;
        let baseSaturation = 0.5;
        
        if (isDiatonic) {
            baseOpacity = 1;
            baseSaturation = 1;
        } else if (isSecondary) {
            baseOpacity = 0.7;
            baseSaturation = 0.65;
        }
        
        const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (hslMatch) {
            const h = parseInt(hslMatch[1]);
            const s = Math.round(parseInt(hslMatch[2]) * baseSaturation);
            const l = parseInt(hslMatch[3]);
            
            let adjustedL = l;
            if (ringType === 'minor') {
                adjustedL = Math.max(l - 8, 30);
            } else if (ringType === 'diminished') {
                adjustedL = Math.max(l - 15, 25);
            }
            
            return {
                fill: `hsl(${h}, ${s}%, ${adjustedL}%)`,
                opacity: baseOpacity
            };
        }
        
        return { fill: color, opacity: baseOpacity };
    };

    const segmentStyle = getSegmentStyle();
    
    // Font sizes
    const getChordFontSize = () => {
        if (ringType === 'diminished') return '11px';
        if (ringType === 'minor') return '11px';
        return '14px';
    };

    const isHighlighted = isDiatonic || isSecondary;
    const textColor = isHighlighted ? '#000000' : 'rgba(255,255,255,0.7)';
    const textWeight = isDiatonic ? 'bold' : (isSecondary ? '600' : 'normal');

    return (
        <g
            className={clsx(
                "cursor-pointer transition-all duration-200",
                !isHighlighted && "hover:opacity-70"
            )}
            onClick={(e) => {
                e.stopPropagation();
                onClick(chord);
            }}
        >
            <path
                d={path}
                fill={segmentStyle.fill}
                opacity={segmentStyle.opacity}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1"
                className={clsx(
                    "transition-all duration-200 hover:brightness-110",
                    isSelected && "brightness-125 stroke-white stroke-2",
                    isHighlighted && "hover:brightness-105"
                )}
            />
            
            {/* Voicing suggestion - at top/outer edge of ring */}
            {isDiatonic && voicingSuggestion && ringType === 'major' && (
                <text
                    x={voicingPos.x}
                    y={voicingPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(0,0,0,0.55)"
                    fontSize="6px"
                    className="pointer-events-none select-none"
                    transform={`rotate(${textRotation}, ${voicingPos.x}, ${voicingPos.y})`}
                >
                    {voicingSuggestion}
                </text>
            )}
            
            {/* Minor voicing - smaller */}
            {isDiatonic && voicingSuggestion && ringType === 'minor' && (
                <text
                    x={voicingPos.x}
                    y={voicingPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(0,0,0,0.5)"
                    fontSize="5px"
                    className="pointer-events-none select-none"
                    transform={`rotate(${textRotation}, ${voicingPos.x}, ${voicingPos.y})`}
                >
                    {voicingSuggestion}
                </text>
            )}
            
            {/* Main chord label - center of ring */}
            <text
                x={chordPos.x}
                y={chordPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={textColor}
                fontWeight={textWeight}
                fontSize={getChordFontSize()}
                className="pointer-events-none select-none"
                transform={`rotate(${textRotation}, ${chordPos.x}, ${chordPos.y})`}
            >
                {label}
            </text>
            
            {/* Roman numeral - at bottom/inner edge of ring */}
            {isDiatonic && romanNumeral && (
                <text
                    x={numeralPos.x}
                    y={numeralPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(0,0,0,0.6)"
                    fontSize={ringType === 'diminished' ? '7px' : ringType === 'minor' ? '7px' : '9px'}
                    fontStyle="italic"
                    className="pointer-events-none select-none"
                    transform={`rotate(${textRotation}, ${numeralPos.x}, ${numeralPos.y})`}
                >
                    {romanNumeral}
                </text>
            )}
            
            {/* Diminished voicing - special handling due to narrow segment */}
            {isDiatonic && voicingSuggestion && ringType === 'diminished' && (
                <text
                    x={voicingPos.x}
                    y={voicingPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(0,0,0,0.5)"
                    fontSize="5px"
                    className="pointer-events-none select-none"
                    transform={`rotate(${textRotation}, ${voicingPos.x}, ${voicingPos.y})`}
                >
                    {voicingSuggestion}
                </text>
            )}
        </g>
    );
};

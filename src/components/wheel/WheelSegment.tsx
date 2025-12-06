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
    romanNumeral?: string;  // Roman numeral to display for diatonic chords
    voicingSuggestion?: string;  // Voicing suggestions like "maj7, maj9"
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

    // Calculate center of the segment for text placement
    const midAngle = (startAngle + endAngle) / 2;
    const textRadius = (innerRadius + outerRadius) / 2;
    
    const textPos = polarToCartesian(cx, cy, textRadius, midAngle);
    const textX = textPos.x;
    const textY = textPos.y;

    // Calculate text rotation accounting for wheel rotation
    const absoluteAngle = midAngle + wheelRotation;
    const normalizedAbsoluteAngle = ((absoluteAngle % 360) + 360) % 360;
    
    let textRotation = -wheelRotation;
    if (normalizedAbsoluteAngle > 90 && normalizedAbsoluteAngle < 270) {
        textRotation += 180;
    }

    // Adjust color based on ring type and diatonic/secondary status
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
    
    // Font sizes based on ring type
    const getMainFontSize = () => {
        if (ringType === 'diminished') return '11px';
        if (ringType === 'minor') return '12px';
        return '14px';
    };

    const isHighlighted = isDiatonic || isSecondary;
    const textColor = isHighlighted ? '#000000' : 'rgba(255,255,255,0.7)';
    const textWeight = isDiatonic ? 'bold' : (isSecondary ? '600' : 'normal');

    // Position for numeral (below main label)
    const numeralY = textY + (ringType === 'diminished' ? 10 : ringType === 'minor' ? 11 : 12);
    
    // Position for voicing suggestion (above main label, smaller)
    const voicingY = textY - (ringType === 'diminished' ? 10 : ringType === 'minor' ? 11 : 14);

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
            
            {/* Voicing suggestion (top, small) - only for diatonic chords */}
            {isDiatonic && voicingSuggestion && ringType !== 'diminished' && (
                <text
                    x={textX}
                    y={voicingY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(0,0,0,0.5)"
                    fontSize={ringType === 'minor' ? '6px' : '7px'}
                    className="pointer-events-none select-none"
                    transform={`rotate(${textRotation}, ${textX}, ${voicingY})`}
                >
                    {voicingSuggestion}
                </text>
            )}
            
            {/* Main chord label */}
            <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={textColor}
                fontWeight={textWeight}
                fontSize={getMainFontSize()}
                className="pointer-events-none select-none"
                transform={`rotate(${textRotation}, ${textX}, ${textY})`}
            >
                {label}
            </text>
            
            {/* Roman numeral (bottom, smaller) - only for diatonic chords */}
            {isDiatonic && romanNumeral && (
                <text
                    x={textX}
                    y={numeralY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(0,0,0,0.6)"
                    fontSize={ringType === 'diminished' ? '7px' : ringType === 'minor' ? '8px' : '9px'}
                    fontStyle="italic"
                    className="pointer-events-none select-none"
                    transform={`rotate(${textRotation}, ${textX}, ${numeralY})`}
                >
                    {romanNumeral}
                </text>
            )}
        </g>
    );
};

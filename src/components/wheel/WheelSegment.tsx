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
    subLabel?: string;
    chord: Chord;
    isSelected: boolean;
    isDiatonic: boolean;
    isSecondary?: boolean;
    onClick: (chord: Chord) => void;
    ringType?: 'major' | 'minor' | 'diminished';
    wheelRotation?: number;  // Task 20: Pass wheel rotation for text orientation
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
    subLabel,
    chord,
    isSelected,
    isDiatonic,
    isSecondary = false,
    onClick,
    ringType = 'major',
    wheelRotation = 0
}) => {
    const path = describeSector(cx, cy, innerRadius, outerRadius, startAngle, endAngle);

    // Calculate center of the segment for text placement
    const midAngle = (startAngle + endAngle) / 2;
    const textRadius = (innerRadius + outerRadius) / 2;
    
    const textPos = polarToCartesian(cx, cy, textRadius, midAngle);
    const textX = textPos.x;
    const textY = textPos.y;

    // Task 20: Calculate text rotation accounting for wheel rotation
    // The wheel rotates the entire SVG group, so we need to counter-rotate text
    // to keep it upright, PLUS flip it if it would be upside down on screen
    
    // Calculate the absolute screen angle of this segment after wheel rotation
    const absoluteAngle = midAngle + wheelRotation;
    const normalizedAbsoluteAngle = ((absoluteAngle % 360) + 360) % 360;
    
    // Text should be counter-rotated by the wheel rotation to stay upright
    // Plus flipped 180° if in the bottom half of the screen
    let textRotation = -wheelRotation;  // Counter-rotate to undo wheel rotation
    
    // If the segment is in the bottom half of the screen (after wheel rotation),
    // we need to flip the text so it's not upside down
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
    
    const getFontSize = () => {
        const segmentSpan = endAngle - startAngle;
        if (ringType === 'diminished') return '9px';
        if (ringType === 'minor') {
            return segmentSpan <= 15 ? '10px' : '12px';
        }
        return '13px';
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
            <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={textColor}
                fontWeight={textWeight}
                fontSize={getFontSize()}
                className="pointer-events-none select-none"
                transform={`rotate(${textRotation}, ${textX}, ${textY})`}
            >
                {label}
            </text>
            {subLabel && (
                <text
                    x={textX}
                    y={textY + 14}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(0,0,0,0.5)"
                    fontSize="9px"
                    className="pointer-events-none select-none"
                    transform={`rotate(${textRotation}, ${textX}, ${textY + 14})`}
                >
                    {subLabel}
                </text>
            )}
        </g>
    );
};

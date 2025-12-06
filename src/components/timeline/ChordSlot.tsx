import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { ChordSlot as IChordSlot } from '../../types';
import clsx from 'clsx';
import { useSongStore } from '../../store/useSongStore';
import { getWheelColors, normalizeNote } from '../../utils/musicTheory';

interface ChordSlotProps {
    slot: IChordSlot;
    sectionId: string;
    size?: number;
}

export const ChordSlot: React.FC<ChordSlotProps> = ({ slot, sectionId, size = 48 }) => {
    const { selectedSlotId, setSelectedSlot, selectedSectionId, setSelectedChord } = useSongStore();
    const colors = getWheelColors();

    const { isOver, setNodeRef: setDroppableRef } = useDroppable({
        id: `slot-${slot.id}`,
        data: { type: 'slot', sectionId, slotId: slot.id }
    });

    const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
        id: `chord-${slot.id}`,
        data: { type: 'chord', chord: slot.chord, originSlotId: slot.id, originSectionId: sectionId },
        disabled: !slot.chord
    });

    const isSelected = selectedSlotId === slot.id && selectedSectionId === sectionId;

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999
    } : undefined;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedSlot(sectionId, slot.id);
        if (slot.chord) {
            setSelectedChord(slot.chord);
        }
    };

    // Get color for this chord based on its root
    const getChordColor = () => {
        if (!slot.chord) return undefined;
        
        const root = slot.chord.root;
        
        if (colors[root as keyof typeof colors]) {
            return colors[root as keyof typeof colors];
        }
        
        const normalized = normalizeNote(root);
        for (const key of Object.keys(colors)) {
            if (normalizeNote(key) === normalized) {
                return colors[key as keyof typeof colors];
            }
        }
        
        return 'hsl(230, 60%, 50%)';
    };

    const chordColor = getChordColor();

    // Calculate font size based on slot size
    const fontSize = Math.max(8, Math.min(12, size * 0.22));

    return (
        <div
            ref={setDroppableRef}
            onClick={handleClick}
            style={{ width: size, height: size }}
            className={clsx(
                "rounded border-2 flex items-center justify-center transition-all relative flex-shrink-0",
                isOver ? "border-accent-primary bg-accent-glow scale-105" : "border-border-medium bg-bg-elevated",
                isSelected ? "ring-2 ring-accent-primary ring-offset-1 ring-offset-bg-primary" : "",
                !slot.chord && "hover:border-text-muted cursor-pointer"
            )}
        >
            {!slot.chord && (
                <span className="text-text-muted font-light select-none" style={{ fontSize: fontSize + 4 }}>+</span>
            )}

            {slot.chord && (
                <div
                    ref={setDraggableRef}
                    {...listeners}
                    {...attributes}
                    style={{
                        ...style,
                        backgroundColor: chordColor,
                    }}
                    className={clsx(
                        "w-full h-full rounded flex items-center justify-center font-bold shadow cursor-grab active:cursor-grabbing select-none overflow-hidden",
                        isDragging ? "opacity-50" : "opacity-100"
                    )}
                >
                    <span 
                        className="text-black/80 truncate px-0.5 text-center"
                        style={{ fontSize }}
                    >
                        {slot.chord.symbol}
                    </span>
                </div>
            )}
        </div>
    );
};

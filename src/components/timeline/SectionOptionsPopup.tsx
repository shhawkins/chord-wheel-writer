import React, { useRef, useEffect } from 'react';
import { Copy, Trash2, X } from 'lucide-react';
import type { Section } from '../../types';

interface SectionOptionsPopupProps {
    section: Section;
    isOpen: boolean;
    onClose: () => void;
    onTimeSignatureChange: (value: string) => void;
    onBarsChange: (value: number) => void;
    onCopy: () => void;
    onDelete: () => void;
    songTimeSignature: [number, number];
}

const TIME_SIGNATURE_OPTIONS: [number, number][] = [
    [4, 4],
    [3, 4],
    [5, 4],
    [2, 4],
    [6, 8],
];

export const SectionOptionsPopup: React.FC<SectionOptionsPopupProps> = ({
    section,
    isOpen,
    onClose,
    onTimeSignatureChange,
    onBarsChange,
    onCopy,
    onDelete,
    songTimeSignature,
}) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const sectionTimeSignature = section.timeSignature || songTimeSignature;
    const signatureValue = `${sectionTimeSignature[0]}/${sectionTimeSignature[1]}`;
    const measureCount = section.measures.length;

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        // Use setTimeout to avoid immediate close on the same tap
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Transparent overlay to capture outside clicks */}
            <div
                className="fixed inset-0 z-[99]"
                onClick={onClose}
            />

            {/* Compact floating card - positioned above timeline */}
            <div
                ref={popupRef}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100]
                           bg-bg-elevated border border-border-medium rounded-xl 
                           shadow-2xl shadow-black/50
                           animate-in fade-in slide-in-from-bottom-2 duration-150"
                style={{ minWidth: '220px', maxWidth: '260px' }}
            >
                {/* Compact Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
                    <div className="flex items-center gap-1.5">
                        <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        />
                        <span className="text-xs font-bold text-text-primary">
                            {section.name}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
                    >
                        <X size={12} />
                    </button>
                </div>

                {/* Compact Options - horizontal layout */}
                <div className="p-2.5 space-y-2">
                    {/* Time Signature & Bars in a row */}
                    <div className="flex items-center gap-3">
                        {/* Time Signature */}
                        <div className="flex items-center gap-1.5">
                            <label className="text-[9px] font-semibold text-text-muted uppercase">
                                Time
                            </label>
                            <select
                                value={signatureValue}
                                onChange={(e) => onTimeSignatureChange(e.target.value)}
                                className="bg-bg-tertiary text-text-primary text-[11px] font-semibold rounded-lg 
                                           px-2 py-1 border border-border-subtle 
                                           focus:outline-none focus:ring-1 focus:ring-accent-primary/50
                                           appearance-none cursor-pointer text-center"
                                style={{
                                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 4px center',
                                    paddingRight: '18px',
                                    minWidth: '52px'
                                }}
                            >
                                {TIME_SIGNATURE_OPTIONS.map(([top, bottom]) => (
                                    <option key={`${top}/${bottom}`} value={`${top}/${bottom}`} className="bg-bg-secondary">
                                        {top}/{bottom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Bars */}
                        <div className="flex items-center gap-1.5 flex-1">
                            <label className="text-[9px] font-semibold text-text-muted uppercase">
                                Bars
                            </label>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onBarsChange(Math.max(1, measureCount - 1))}
                                    disabled={measureCount <= 1}
                                    className="w-6 h-6 flex items-center justify-center rounded-md 
                                               bg-bg-tertiary border border-border-subtle
                                               text-text-muted hover:text-text-primary hover:bg-bg-secondary
                                               disabled:opacity-30 disabled:cursor-not-allowed
                                               transition-all text-sm font-semibold active:scale-95"
                                >
                                    −
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-text-primary tabular-nums">
                                    {measureCount}
                                </span>
                                <button
                                    onClick={() => onBarsChange(Math.min(32, measureCount + 1))}
                                    disabled={measureCount >= 32}
                                    className="w-6 h-6 flex items-center justify-center rounded-md 
                                               bg-bg-tertiary border border-border-subtle
                                               text-text-muted hover:text-text-primary hover:bg-bg-secondary
                                               disabled:opacity-30 disabled:cursor-not-allowed
                                               transition-all text-sm font-semibold active:scale-95"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons - compact */}
                    <div className="flex gap-1.5 pt-1 border-t border-border-subtle">
                        <button
                            onClick={() => {
                                onCopy();
                                onClose();
                            }}
                            className="flex-1 flex items-center justify-center gap-1 
                                       px-2 py-1.5 rounded-lg
                                       bg-accent-primary/10 border border-accent-primary/30
                                       text-accent-primary hover:bg-accent-primary/20
                                       transition-all text-[10px] font-bold active:scale-95"
                        >
                            <Copy size={11} />
                            Copy
                        </button>
                        <button
                            onClick={() => {
                                onDelete();
                                onClose();
                            }}
                            className="flex-1 flex items-center justify-center gap-1 
                                       px-2 py-1.5 rounded-lg
                                       bg-red-500/10 border border-red-500/30
                                       text-red-400 hover:bg-red-500/20
                                       transition-all text-[10px] font-bold active:scale-95"
                        >
                            <Trash2 size={11} />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Arrow pointing down to the button */}
                <div
                    className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                    style={{
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: '8px solid var(--bg-elevated)',
                    }}
                />
            </div>
        </>
    );
};

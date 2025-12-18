import React, { useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import {
    Keyboard,
    Guitar,
    Mic,
    Wind,
    Music,
    ChevronDown,
    Plus,
    Check,
    Wine
} from 'lucide-react';
import { useSongStore } from '../../store/useSongStore';
import { playChord, setInstrument as setAudioInstrument } from '../../utils/audioEngine';
import type { InstrumentType } from '../../types';

interface VoiceSelectorProps {
    className?: string;
    variant?: 'default' | 'compact' | 'tiny';
    showLabel?: boolean;
    onInteraction?: () => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
    className,
    variant = 'default',
    showLabel = true,
    onInteraction
}) => {
    const {
        instrument,
        setInstrument,
        customInstruments,
        toggleInstrumentManagerModal
    } = useSongStore();

    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const getInstrumentIcon = (type: InstrumentType | string) => {
        if (type.includes('piano') || type.includes('organ') || type.includes('marimba') || type.includes('synth') || type.includes('pad')) return <Keyboard size={variant === 'tiny' ? 12 : 14} />;
        if (type.includes('guitar') || type.includes('bass') || type.includes('archtop') || type.includes('string')) return <Guitar size={variant === 'tiny' ? 12 : 14} />;
        if (type.includes('mic') || type.includes('choir')) return <Mic size={variant === 'tiny' ? 12 : 14} />;
        if (type.includes('wind') || type.includes('sax') || type.includes('flute') || type.includes('ocarina') || type.includes('harmonica') || type.includes('brass') || type.includes('melodica')) return <Wind size={variant === 'tiny' ? 12 : 14} />;
        if (type.includes('wine')) return <Wine size={variant === 'tiny' ? 12 : 14} />;
        return <Music size={variant === 'tiny' ? 12 : 14} />;
    };

    const instrumentOptions: { value: InstrumentType, label: string }[] = [
        { value: 'piano', label: 'Piano' },
        { value: 'guitar-jazzmaster', label: 'Jazzmaster' },
        { value: 'acoustic-archtop', label: 'Acoustic Archtop' },
        { value: 'nylon-string', label: 'Nylon String' },
        { value: 'ocarina', label: 'Ocarina' },
        { value: 'bass-electric', label: 'Electric Bass' },
        { value: 'harmonica', label: 'Harmonica' },
        { value: 'melodica', label: 'Melodica' },
        { value: 'wine-glass', label: 'Wine Glass' },
        { value: 'organ', label: 'Organ' },
        { value: 'epiano', label: 'Electric Piano' },
        { value: 'pad', label: 'Pad' },
        ...customInstruments.map((inst: any) => ({ value: inst.id, label: inst.name })),
    ];

    // Touch handling for better responsiveness
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const itemTouchStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = Math.abs(endX - touchStartRef.current.x);
        const deltaY = Math.abs(endY - touchStartRef.current.y);

        if (deltaX < 10 && deltaY < 10) {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            setShowMenu(!showMenu);
            onInteraction?.();
        }
        touchStartRef.current = null;
    };

    const handleItemTouchStart = (e: React.TouchEvent) => {
        itemTouchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    };

    const handleItemTouchEnd = (e: React.TouchEvent, value: InstrumentType) => {
        if (!itemTouchStartRef.current) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = Math.abs(endX - itemTouchStartRef.current.x);
        const deltaY = Math.abs(endY - itemTouchStartRef.current.y);

        // Only select if it was a tap (not a scroll)
        if (deltaX < 10 && deltaY < 10) {
            e.preventDefault();
            e.stopPropagation();
            handleSelect(value);
        }
        itemTouchStartRef.current = null;
    };

    const handleManageButtonTouchEnd = (e: React.TouchEvent) => {
        if (!itemTouchStartRef.current) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = Math.abs(endX - itemTouchStartRef.current.x);
        const deltaY = Math.abs(endY - itemTouchStartRef.current.y);

        // Only trigger if it was a tap (not a scroll)
        if (deltaX < 10 && deltaY < 10) {
            e.preventDefault();
            e.stopPropagation();
            toggleInstrumentManagerModal(true);
            setShowMenu(false);
            onInteraction?.();
        }
        itemTouchStartRef.current = null;
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside as any);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside as any);
        };
    }, [showMenu]);

    const handleSelect = (val: InstrumentType) => {
        const { selectedChord } = useSongStore.getState();
        setAudioInstrument(val);
        setInstrument(val);
        playChord(selectedChord?.notes || ['C4', 'E4', 'G4']);
        setShowMenu(false);
    };

    const currentLabel = instrumentOptions.find(opt => opt.value === instrument)?.label || 'Piano';

    return (
        <div className={clsx("relative", className)} ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                    onInteraction?.();
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={clsx(
                    "flex items-center justify-center rounded-lg transition-all gap-2",
                    "bg-bg-tertiary border border-white/10 text-text-secondary hover:text-text-primary hover:bg-bg-elevated",
                    showMenu && "bg-bg-elevated text-text-primary border-accent-primary/50",
                    variant === 'tiny' ? "min-h-[36px] min-w-[36px] px-2 text-[10px]" :
                        variant === 'compact' ? "h-9 px-3 text-xs" :
                            "h-10 px-4 text-sm"
                )}
            >
                {getInstrumentIcon(instrument)}
                {showLabel && <span className="font-medium whitespace-nowrap">{currentLabel}</span>}
                <ChevronDown size={variant === 'tiny' ? 10 : 12} className={clsx("transition-transform", showMenu && "rotate-180")} />
            </button>

            {showMenu && (
                <div
                    className={clsx(
                        "absolute bottom-full right-0 mb-2 w-48 bg-bg-elevated border border-border-medium rounded-xl shadow-2xl overflow-y-auto max-h-72 z-[10000] flex flex-col p-1.5",
                        "animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-2 py-1.5 mb-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        Select Voice
                    </div>
                    {instrumentOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleSelect(opt.value)}
                            onTouchStart={handleItemTouchStart}
                            onTouchEnd={(e) => handleItemTouchEnd(e, opt.value)}
                            className={clsx(
                                "text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group",
                                instrument === opt.value
                                    ? "bg-accent-primary/20 text-accent-primary"
                                    : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                            )}
                        >
                            <div className="flex items-center gap-2.5">
                                <span className={clsx(
                                    "transition-colors",
                                    instrument === opt.value ? "text-accent-primary" : "text-text-muted group-hover:text-text-secondary"
                                )}>
                                    {getInstrumentIcon(opt.value)}
                                </span>
                                <span className="font-medium">{opt.label}</span>
                            </div>
                            {instrument === opt.value && <Check size={14} className="text-accent-primary" />}
                        </button>
                    ))}

                    <div className="h-px bg-border-subtle my-1.5 mx-2" />

                    <button
                        onClick={() => {
                            toggleInstrumentManagerModal(true);
                            setShowMenu(false);
                            onInteraction?.();
                        }}
                        onTouchStart={handleItemTouchStart}
                        onTouchEnd={handleManageButtonTouchEnd}
                        className={clsx(
                            "text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2.5",
                            "text-accent-primary hover:bg-accent-primary/10 font-semibold"
                        )}
                    >
                        <Plus size={16} />
                        Manage Instruments
                    </button>
                </div>
            )}
        </div>
    );
};

import { useSongStore } from '../../store/useSongStore';
import { Play, Pause, SkipBack, SkipForward, Repeat, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { initAudio } from '../../utils/audioEngine';
import type { InstrumentType } from '../../types';

export const PlaybackControls: React.FC = () => {
    const {
        isPlaying,
        tempo,
        volume,
        setIsPlaying,
        setTempo,
        setVolume,
        instrument,
        setInstrument,
        isMuted,
        toggleMute
    } = useSongStore();

    const handlePlayPause = async () => {
        if (!isPlaying) {
            await initAudio();
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    };

    const instrumentOptions: { value: InstrumentType, label: string }[] = [
        { value: 'piano', label: 'Piano' },
        { value: 'epiano', label: 'Electric Piano' },
        { value: 'organ', label: 'Organ' },
        { value: 'pad', label: 'Pad' },
        { value: 'guitar', label: 'Guitar' },
    ];

    // Clamp instrument to available options
    if (!instrumentOptions.find((o) => o.value === instrument)) {
        setInstrument('piano');
    }

    const cycleInstrument = (direction: 'prev' | 'next') => {
        const idx = instrumentOptions.findIndex(o => o.value === instrument);
        if (idx === -1) {
            setInstrument('piano');
            return;
        }
        const nextIndex = direction === 'next'
            ? (idx + 1) % instrumentOptions.length
            : (idx - 1 + instrumentOptions.length) % instrumentOptions.length;
        setInstrument(instrumentOptions[nextIndex].value);
    };

    return (
        <div className="h-14 bg-bg-elevated border-t border-border-subtle flex items-center justify-between px-6">
            {/* Transport */}
            <div className="flex items-center gap-2">
                <button className="p-1.5 text-text-secondary hover:text-text-primary transition-colors">
                    <SkipBack size={16} />
                </button>
                <button
                    onClick={handlePlayPause}
                    className="w-9 h-9 rounded-full bg-accent-primary hover:bg-indigo-500 flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                </button>
                <button className="p-1.5 text-text-secondary hover:text-text-primary transition-colors">
                    <SkipForward size={16} />
                </button>
                <button className="p-1.5 text-text-secondary hover:text-text-primary transition-colors ml-1">
                    <Repeat size={14} />
                </button>
            </div>

            {/* Tempo & Info */}
            <div className="flex items-center gap-3 text-[10px] text-text-muted">
                <div className="flex items-center gap-1.5">
                    <span>Tempo</span>
                    <input
                        type="number"
                        value={tempo}
                        onChange={(e) => setTempo(Number(e.target.value))}
                        className="w-10 bg-bg-tertiary border border-border-subtle rounded px-1 py-0.5 text-center text-text-primary text-[10px]"
                    />
                    <span>BPM</span>
                </div>
                <span className="text-text-muted">•</span>
                <span>4/4</span>
            </div>

            {/* Volume & Instrument */}
            <div className="flex items-center gap-4">
                {/* Instrument Selector with quick cycle buttons */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded bg-bg-tertiary/60 border border-border-subtle/70 h-8">
                        <button
                            onClick={() => cycleInstrument('prev')}
                            className="px-1.5 h-full text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-l transition-colors flex items-center"
                            title="Previous instrument"
                        >
                            <ChevronLeft size={12} />
                        </button>
                        <button
                            onClick={() => cycleInstrument('next')}
                            className="px-1.5 h-full text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-r transition-colors flex items-center"
                            title="Next instrument"
                        >
                            <ChevronRight size={12} />
                        </button>
                    </div>
                    <select
                        value={instrument}
                        onChange={(e) => setInstrument(e.target.value as InstrumentType)}
                        className="bg-bg-tertiary border border-border-subtle rounded px-2 h-8 text-[10px] text-text-secondary focus:outline-none focus:border-accent-primary cursor-pointer min-w-[140px]"
                    >
                        {instrumentOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-2 w-32">
                    <button
                        onClick={toggleMute}
                        className="text-text-secondary hover:text-text-primary transition-colors"
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                            if (isMuted) toggleMute();
                            setVolume(Number(e.target.value));
                        }}
                        className={`w-full h-1 bg-bg-tertiary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-accent-primary [&::-webkit-slider-thumb]:rounded-full ${isMuted ? 'opacity-50' : ''}`}
                    />
                </div>
            </div>
        </div>
    );
};

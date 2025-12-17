import React, { useState, useRef } from 'react';
import { useSongStore } from '../../store/useSongStore';
import { X, Mic, Upload, Trash2, Play, Square, Check, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { CustomInstrument } from '../../types';

interface InstrumentManagerModalProps {
    onClose: () => void;
}

export const InstrumentManagerModal: React.FC<InstrumentManagerModalProps> = ({ onClose }) => {
    const { customInstruments, addCustomInstrument, removeCustomInstrument } = useSongStore();
    const [view, setView] = useState<'list' | 'create'>('list');

    // Creation State
    const [name, setName] = useState('');
    const [samples, setSamples] = useState<Record<string, string>>({});
    const [recordingNote, setRecordingNote] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const NOTES_TO_SAMPLE = ['C3', 'C4', 'C5']; // Minimal set for good coverage

    const handleStartRecording = async (note: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    setSamples(prev => ({ ...prev, [note]: base64data }));
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingNote(note);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please allow permissions.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setRecordingNote(null);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, note: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSamples(prev => ({ ...prev, [note]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!name.trim()) return;
        if (Object.keys(samples).length === 0) {
            alert("Please add at least one sample.");
            return;
        }

        const newInstrument: CustomInstrument = {
            id: uuidv4(),
            name: name.trim(),
            samples,
            createdAt: Date.now()
        };

        addCustomInstrument(newInstrument);
        setView('list');
        setName('');
        setSamples({});
    };

    const handlePreview = async (note: string) => {
        const sample = samples[note];
        if (!sample) return;

        // Simple preview using HTML Audio
        const audio = new Audio(sample);
        await audio.play();
    };

    if (view === 'create') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-bg-elevated border border-border-subtle rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="p-4 border-b border-border-subtle flex items-center justify-between">
                        <h2 className="text-lg font-bold text-text-primary">Create Instrument</h2>
                        <button onClick={() => setView('list')} className="text-text-secondary hover:text-text-primary">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Instrument Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-bg-tertiary border border-border-subtle rounded px-3 py-2 text-text-primary focus:border-accent-primary focus:outline-none"
                                placeholder="e.g. My Acoustic Guitar"
                            />
                        </div>

                        <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <AlertCircle size={16} className="text-accent-primary mt-0.5 shrink-0" />
                                <p className="text-xs text-text-secondary">
                                    <strong>Efficiency Tip:</strong> You don't need a sample for every note!
                                    Just record <strong>C3, C4, and C5</strong>. The audio engine will automatically
                                    pitch-shift them to fill the keyboard.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-text-secondary">Samples</label>
                            {NOTES_TO_SAMPLE.map(note => (
                                <div key={note} className="flex items-center justify-between bg-bg-tertiary p-3 rounded-lg border border-border-subtle">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-bold text-text-primary border border-border-subtle">
                                            {note}
                                        </div>
                                        {samples[note] ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                                                    <Check size={12} /> Recorded
                                                </span>
                                                <button onClick={() => handlePreview(note)} className="p-1 text-text-secondary hover:text-text-primary">
                                                    <Play size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-text-muted italic">No sample</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {recordingNote === note ? (
                                            <button
                                                onClick={handleStopRecording}
                                                className="p-2 rounded-full bg-red-500/20 text-red-500 animate-pulse hover:bg-red-500/30 transition-colors"
                                            >
                                                <Square size={16} fill="currentColor" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStartRecording(note)}
                                                disabled={isRecording}
                                                className="p-2 rounded-full hover:bg-bg-elevated text-text-secondary hover:text-accent-primary transition-colors disabled:opacity-50"
                                                title="Record Microphone"
                                            >
                                                <Mic size={16} />
                                            </button>
                                        )}

                                        <label className="p-2 rounded-full hover:bg-bg-elevated text-text-secondary hover:text-accent-primary transition-colors cursor-pointer">
                                            <input
                                                type="file"
                                                accept="audio/*"
                                                className="hidden"
                                                onChange={(e) => handleFileUpload(e, note)}
                                            />
                                            <Upload size={16} />
                                        </label>

                                        {samples[note] && (
                                            <button
                                                onClick={() => setSamples(prev => {
                                                    const next = { ...prev };
                                                    delete next[note];
                                                    return next;
                                                })}
                                                className="p-2 rounded-full hover:bg-bg-elevated text-text-secondary hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 border-t border-border-subtle flex justify-end gap-2">
                        <button
                            onClick={() => setView('list')}
                            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!name || Object.keys(samples).length === 0}
                            className="px-4 py-2 text-sm font-medium bg-accent-primary text-white rounded hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Save Instrument
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-bg-elevated border border-border-subtle rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-border-subtle flex items-center justify-between">
                    <h2 className="text-lg font-bold text-text-primary">Manage Instruments</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {customInstruments.length === 0 ? (
                        <div className="text-center py-8 text-text-muted">
                            <p className="mb-4">No custom instruments yet.</p>
                            <button
                                onClick={() => setView('create')}
                                className="px-4 py-2 text-sm font-medium bg-accent-primary text-white rounded hover:bg-indigo-500 transition-colors"
                            >
                                Create Your First Instrument
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {customInstruments.map(inst => (
                                <div key={inst.id} className="flex items-center justify-between bg-bg-tertiary p-3 rounded-lg border border-border-subtle group">
                                    <div>
                                        <h3 className="text-sm font-medium text-text-primary">{inst.name}</h3>
                                        <p className="text-xs text-text-muted">{Object.keys(inst.samples).length} samples</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete "${inst.name}"?`)) {
                                                removeCustomInstrument(inst.id);
                                            }
                                        }}
                                        className="p-2 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {customInstruments.length > 0 && (
                    <div className="p-4 border-t border-border-subtle">
                        <button
                            onClick={() => setView('create')}
                            className="w-full px-4 py-2 text-sm font-medium bg-bg-tertiary border border-border-subtle text-text-primary rounded hover:bg-bg-elevated transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="text-xl leading-none">+</span> Add New Instrument
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

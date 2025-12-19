import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useSongStore } from '../../store/useSongStore';
import { X, Music, Mic2, Mail, Lock, User as UserIcon, AlertCircle, Loader2, ArrowLeft, Chrome } from 'lucide-react';
import { playChord, setInstrument } from '../../utils/audioEngine';


interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Auth Store selectors
    const isPasswordRecovery = useAuthStore(state => state.isPasswordRecovery);
    const authDefaultView = useAuthStore(state => state.authDefaultView);
    const authError = useAuthStore(state => state.authError);
    const user = useAuthStore(state => state.user);

    // Auth Store actions
    const setView = useAuthStore(state => state.setAuthDefaultView);
    const setAuthError = useAuthStore(state => state.setAuthError);
    const checkEmailExists = useAuthStore(state => state.checkEmailExists);

    // Song Store state
    const cloudSongs = useSongStore(state => state.cloudSongs);
    const customInstruments = useSongStore(state => state.customInstruments);
    const loadSong = useSongStore(state => state.loadSong);
    const setCurrentInstrument = useSongStore(state => state.setInstrument);
    const selectedChord = useSongStore(state => state.selectedChord);

    // Clear error when view changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setAuthError(null);
        }
    }, [isOpen, authDefaultView, setAuthError]);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setAuthError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        if (error) setAuthError(error.message);
        setLoading(false);
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAuthError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setAuthError(error.message);
        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAuthError(null);

        // Pre-check if email exists
        const exists = await checkEmailExists(email);
        if (exists) {
            setAuthError('An account with this email already exists. Please sign in instead.');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin }
        });

        if (error) {
            setAuthError(error.message);
        } else {
            setView('sign_in');
            setAuthError('Success! Please check your email to confirm your account.');
        }
        setLoading(false);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAuthError(null);

        // Pre-check if email exists
        const exists = await checkEmailExists(email);
        if (!exists) {
            setAuthError('No account found with this email address.');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });

        if (error) {
            setAuthError(error.message);
        } else {
            setAuthError('Recovery email sent! Please check your inbox.');
        }
        setLoading(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAuthError(null);

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setAuthError(error.message);
        } else {
            // Note: USER_UPDATED event will trigger exiting recovery mode in authStore
        }
        setLoading(false);
    };

    const handleSongClick = (song: typeof cloudSongs[0]) => {
        loadSong(song);
        onClose();
    };

    const handleInstrumentClick = (instrument: typeof customInstruments[0]) => {
        // Set as current instrument
        setCurrentInstrument(instrument.id);
        setInstrument(instrument.id);

        // Play the currently selected chord (or C major by default)
        const chordToPlay = selectedChord || { root: 'C', quality: 'major' as const, notes: ['C', 'E', 'G'] };
        playChord(chordToPlay.notes);

        onClose();
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-900/50">
                    <h2 className="text-lg font-semibold text-stone-200">
                        {isPasswordRecovery ? 'Update Password' : 'Account'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {(!user && !isPasswordRecovery) || isPasswordRecovery ? (
                        <div className="flex flex-col gap-4">
                            {/* Error/Success Message */}
                            {authError && (
                                <div className={`flex items-start gap-3 p-3 rounded-lg text-sm border ${authError.includes('Success') || authError.includes('sent')
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                                    }`}>
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <p>{authError}</p>
                                </div>
                            )}

                            {/* Forms */}
                            {(isPasswordRecovery || authDefaultView === 'update_password') ? (
                                <form onSubmit={handleUpdatePassword} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                                            <input
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-10 pr-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500 transition-colors"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                                    </button>
                                </form>
                            ) : authDefaultView === 'forgotten_password' ? (
                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <button
                                        type="button"
                                        onClick={() => setView('sign_in')}
                                        className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1.5 mb-2 transition-colors"
                                    >
                                        <ArrowLeft className="w-3 h-3" /> Back to Sign In
                                    </button>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                                            <input
                                                type="email"
                                                required
                                                placeholder="someone@example.com"
                                                className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-10 pr-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500 transition-colors"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Instructions'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={authDefaultView === 'sign_up' ? handleSignUp : handleSignIn} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                                            <input
                                                type="email"
                                                required
                                                placeholder="someone@example.com"
                                                className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-10 pr-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500 transition-colors"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Password</label>
                                            {authDefaultView === 'sign_in' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setView('forgotten_password')}
                                                    className="text-[10px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wide transition-colors"
                                                >
                                                    Forgot?
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                                            <input
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-10 pr-4 py-2.5 text-stone-200 focus:outline-none focus:border-amber-500 transition-colors"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-900/20"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (authDefaultView === 'sign_up' ? 'Create Account' : 'Sign In')}
                                    </button>

                                    {/* Link to switch between sign in/up */}
                                    <div className="pt-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => setView(authDefaultView === 'sign_up' ? 'sign_in' : 'sign_up')}
                                            className="text-xs text-stone-400 hover:text-stone-200 transition-colors"
                                        >
                                            {authDefaultView === 'sign_up' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                                        </button>
                                    </div>

                                    {/* Google Login Separator */}
                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-stone-800"></div>
                                        </div>
                                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                                            <span className="bg-stone-900 px-3 text-stone-500">Or continue with</span>
                                        </div>
                                    </div>

                                    {/* Google Button */}
                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        disabled={loading}
                                        className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg font-medium transition-all flex items-center justify-center gap-3 border border-stone-700 disabled:opacity-50"
                                    >
                                        <Chrome className="w-4 h-4" />
                                        Continue with Google
                                    </button>
                                </form>
                            )}
                            {/* Policy Links */}
                            <div className="mt-4 pt-3 border-t border-stone-800 text-center">
                                <p className="text-[10px] text-stone-500">
                                    By using Songwriter Wheel, you agree to our{' '}
                                    <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-300 underline">Terms</a>
                                    {' '}and{' '}
                                    <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-300 underline">Privacy Policy</a>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            {/* User Info */}
                            <div className="text-center pb-4 border-b border-stone-800">
                                <p className="text-stone-400 text-sm mb-1">Signed in as</p>
                                <p className="text-white font-medium">{user?.email}</p>
                            </div>

                            {/* Saved Songs */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Music size={14} className="text-amber-500" />
                                    <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Saved Songs ({cloudSongs.length})</h3>
                                </div>
                                {cloudSongs.length > 0 ? (
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {cloudSongs.map(song => (
                                            <button
                                                key={song.id}
                                                onClick={() => handleSongClick(song)}
                                                className="w-full text-left px-3 py-2 text-sm text-stone-200 hover:bg-stone-800 rounded-lg transition-colors truncate"
                                            >
                                                {song.title}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-stone-500 italic px-3">No saved songs yet</p>
                                )}
                            </div>

                            {/* Custom Instruments */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Mic2 size={14} className="text-indigo-500" />
                                    <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Custom Instruments ({customInstruments.length})</h3>
                                </div>
                                {customInstruments.length > 0 ? (
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {customInstruments.map(inst => (
                                            <button
                                                key={inst.id}
                                                onClick={() => handleInstrumentClick(inst)}
                                                className="w-full text-left px-3 py-2 text-sm text-stone-200 hover:bg-stone-800 rounded-lg transition-colors truncate"
                                            >
                                                {inst.name}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-stone-500 italic px-3">No custom instruments yet</p>
                                )}
                            </div>

                            {/* Sign Out */}
                            <button
                                onClick={() => {
                                    useAuthStore.getState().signOut();
                                    onClose();
                                }}
                                className="w-full py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors font-medium border border-stone-700 mt-2"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

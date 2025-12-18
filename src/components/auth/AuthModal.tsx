import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { X } from 'lucide-react';


interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [mounted, setMounted] = useState(false);
    const isPasswordRecovery = useAuthStore(state => state.isPasswordRecovery);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-xl shadow-2xl overflow-hidden">
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
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <Auth
                        supabaseClient={supabase}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: '#d97706', // amber-600
                                        brandAccent: '#b45309', // amber-700
                                        inputText: '#e7e5e4', // stone-200
                                        inputBackground: '#292524', // stone-800
                                        inputBorder: '#44403c', // stone-700
                                        inputLabelText: '#a8a29e', // stone-400
                                    },
                                },
                            },
                            className: {
                                container: 'font-sans',
                                button: 'font-medium',
                                input: 'font-sans',
                            }
                        }}
                        providers={['google', 'apple']}
                        theme="dark"
                        redirectTo={window.location.origin}
                        view={isPasswordRecovery ? 'update_password' : undefined}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
}


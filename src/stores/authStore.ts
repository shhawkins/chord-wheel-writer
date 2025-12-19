import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isPasswordRecovery: boolean;
    isAuthModalOpen: boolean;
    initialize: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPasswordRecovery: () => void;
    setAuthModalOpen: (open: boolean) => void;
}


export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    loading: true,
    isPasswordRecovery: false,
    isAuthModalOpen: false,
    initialize: async () => {

        try {
            // 1. Set up listener FIRST to capture any immediate events from URL parsing
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                const isPasswordRecovery = event === 'PASSWORD_RECOVERY';
                set({
                    session,
                    user: session?.user ?? null,
                    loading: false,
                    isPasswordRecovery,
                    isAuthModalOpen: isPasswordRecovery // Auto-open if recovery
                });
            });

            // 2. Then check session (which might trigger URL parsing and events)
            const { data: { session } } = await supabase.auth.getSession();

            // Check for recovery mode in URL hash explicitly
            const isRecovery = window.location.hash && window.location.hash.includes('type=recovery');

            // Only update if we haven't already received an event update (to avoid overwrite/flicker)
            // But usually safe to update
            set(state => ({
                session,
                user: session?.user ?? null,
                loading: false,
                isPasswordRecovery: !!isRecovery || state.isPasswordRecovery,
                isAuthModalOpen: (!!isRecovery || state.isPasswordRecovery) || state.isAuthModalOpen
            }));

            // Clean up the URL hash if we have a session (removes access_token, etc.)
            if (session && window.location.hash && window.location.hash.includes('access_token')) {
                window.history.replaceState(null, '', window.location.pathname);
            }

        } catch (error) {
            console.error('Error initializing auth:', error);
            set({ loading: false });
        }
    },
    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, isPasswordRecovery: false });
    },
    resetPasswordRecovery: () => set({ isPasswordRecovery: false }),
    setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
}));

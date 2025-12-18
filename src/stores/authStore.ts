import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isPasswordRecovery: boolean;
    initialize: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPasswordRecovery: () => void;
}


export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    loading: true,
    isPasswordRecovery: false,
    initialize: async () => {

        try {
            const { data: { session } } = await supabase.auth.getSession();
            set({ session, user: session?.user ?? null, loading: false });

            supabase.auth.onAuthStateChange((event, session) => {
                const isPasswordRecovery = event === 'PASSWORD_RECOVERY';
                set({
                    session,
                    user: session?.user ?? null,
                    loading: false,
                    isPasswordRecovery
                });
            });

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

}));

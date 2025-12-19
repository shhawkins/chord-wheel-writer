import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

type AuthView = 'sign_in' | 'sign_up' | 'forgotten_password' | 'update_password';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isPasswordRecovery: boolean;
    wasPasswordJustUpdated: boolean;
    isAuthModalOpen: boolean;
    authDefaultView: AuthView;
    initialize: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPasswordRecovery: () => void;
    setAuthModalOpen: (open: boolean) => void;
    setAuthDefaultView: (view: AuthView) => void;
    clearPasswordUpdatedFlag: () => void;
}


export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    loading: true,
    isPasswordRecovery: false,
    wasPasswordJustUpdated: false,
    isAuthModalOpen: false,
    authDefaultView: 'sign_in',
    initialize: async () => {
        try {
            // Check for recovery mode in URL hash explicitly BEFORE other async calls might clear it
            const isRecoveryFromHash = typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('type=recovery');
            const hasErrorInHash = typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('error=');

            // 1. If recovery detected, set state IMMEDIATELY so listeners/effects see it
            if (isRecoveryFromHash) {
                console.log('[Auth] Recovery link detected in URL');
                set({
                    isPasswordRecovery: true,
                    isAuthModalOpen: true,
                    authDefaultView: 'update_password'
                });
            }

            // Handle error in hash (e.g., "otp_expired")
            if (hasErrorInHash) {
                const errorMatch = window.location.hash.match(/error_description=([^&]+)/);
                if (errorMatch) {
                    const errorMessage = decodeURIComponent(errorMatch[1].replace(/\+/g, ' '));
                    console.log('[Auth] Error in hash:', errorMessage);
                    window.dispatchEvent(new CustomEvent('show-auth-error', {
                        detail: { message: errorMessage }
                    }));
                }
                window.history.replaceState(null, '', window.location.pathname);
            }

            // 2. Set up listener
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                console.log(`[Auth] Listener event: ${event}`, { hasSession: !!session });

                set(state => {
                    // EXIT RECOVERY: Only on successful update or sign out
                    if (event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
                        const wasPasswordUpdate = event === 'USER_UPDATED' && state.isPasswordRecovery;
                        console.log(`[Auth] Exiting recovery mode. Was update: ${wasPasswordUpdate}`);
                        return {
                            session,
                            user: session?.user ?? null,
                            loading: false,
                            isPasswordRecovery: false,
                            wasPasswordJustUpdated: wasPasswordUpdate,
                            isAuthModalOpen: event === 'USER_UPDATED' ? false : state.isAuthModalOpen,
                            authDefaultView: 'sign_in'
                        };
                    }

                    // ENTER RECOVERY: Explicit recovery event
                    if (event === 'PASSWORD_RECOVERY') {
                        console.log('[Auth] PASSWORD_RECOVERY event received');
                        return {
                            session,
                            user: session?.user ?? null,
                            loading: false,
                            isPasswordRecovery: true,
                            isAuthModalOpen: true,
                            authDefaultView: 'update_password'
                        };
                    }

                    // NORMAL SIGN IN: Welcome toast for new users
                    if (event === 'SIGNED_IN' && session?.user && !state.isPasswordRecovery) {
                        const createdAt = new Date(session.user.created_at || 0);
                        const now = new Date();
                        if ((now.getTime() - createdAt.getTime()) < 60000) {
                            window.dispatchEvent(new CustomEvent('show-welcome-toast', {
                                detail: { email: session.user.email }
                            }));
                        }
                    }

                    // GENERAL UPDATE: Preserve existing recovery state for other events (TOKEN_REFRESHED, etc.)
                    const shouldBeInRecovery = state.isPasswordRecovery;
                    return {
                        session,
                        user: session?.user ?? null,
                        loading: false,
                        isPasswordRecovery: shouldBeInRecovery,
                        isAuthModalOpen: shouldBeInRecovery || state.isAuthModalOpen,
                        authDefaultView: shouldBeInRecovery ? 'update_password' : state.authDefaultView
                    };
                });
            });

            // 3. Final session check
            const { data: { session } } = await supabase.auth.getSession();
            console.log('[Auth] getSession result:', { hasSession: !!session });

            set(state => ({
                session,
                user: session?.user ?? null,
                loading: false,
                // Ensure we don't accidentally clear recovery state if it was set by hash or listener
                isPasswordRecovery: state.isPasswordRecovery || !!isRecoveryFromHash,
                isAuthModalOpen: state.isPasswordRecovery || state.isAuthModalOpen || !!isRecoveryFromHash,
                authDefaultView: (state.isPasswordRecovery || isRecoveryFromHash) ? 'update_password' : state.authDefaultView
            }));

            if (session && window.location.hash && window.location.hash.includes('access_token')) {
                window.history.replaceState(null, '', window.location.pathname);
            }

        } catch (error) {
            console.error('Error initializing auth:', error);
            set({ loading: false });
        }
    },
    signOut: async () => {
        const { useSongStore } = await import('../store/useSongStore'); // Dynamic import to avoid circular dependency
        await supabase.auth.signOut();
        set({ session: null, user: null, isPasswordRecovery: false, authDefaultView: 'sign_in' });
        useSongStore.getState().resetState(); // You need to implement this in useSongStore
    },
    resetPasswordRecovery: () => set({ isPasswordRecovery: false, authDefaultView: 'sign_in' }),
    setAuthModalOpen: (open) => set(state => ({
        isAuthModalOpen: open,
        // Reset default view to sign_in when closing modal
        authDefaultView: open ? state.authDefaultView : 'sign_in'
    })),
    setAuthDefaultView: (view) => set({ authDefaultView: view }),
    clearPasswordUpdatedFlag: () => set({ wasPasswordJustUpdated: false }),
}));

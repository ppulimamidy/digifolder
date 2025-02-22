import { AuthError } from '../types/auth';
import { supabase } from '../lib/supabase';

export const authService = {
  async signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      const authError = error as AuthError;
      return {
        data: null,
        error: {
          message: authError.message || 'Failed to sign up',
        },
      };
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      const authError = error as AuthError;
      return {
        data: null,
        error: {
          message: authError.message || 'Failed to sign in',
        },
      };
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const authError = error as AuthError;
      return {
        data: null,
        error: {
          message: authError.message || 'Failed to reset password',
        },
      };
    }
  },
}; 
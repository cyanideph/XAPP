import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError('Supabase is not configured.');
      return;
    }

    let mounted = true;

    const restore = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setError(sessionError?.message ?? null);
      setLoading(false);
    };

    void restore();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return;
      setSession(next);
      setError(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, loading, error };
}

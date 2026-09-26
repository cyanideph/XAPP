import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Button, H1, Input, Paragraph, Text, YStack } from 'tamagui';
import { supabase } from '../../src/lib/supabase';

function readTokens(url: string) {
  const fragment = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
  const params = new URLSearchParams(fragment || query);
  return { access_token: params.get('access_token'), refresh_token: params.get('refresh_token') };
}

export default function RestoreScreen() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function prepare(url?: string) {
      try {
        const target = url ?? await Linking.getInitialURL();
        if (target && supabase) {
          const tokens = readTokens(target);
          if (tokens.access_token && tokens.refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
            });
            if (sessionError) throw sessionError;
          }
        }
        if (mounted) setReady(true);
      } catch (e) {
        if (mounted) { setError(e instanceof Error ? e.message : 'Unable to restore the recovery session.'); setReady(true); }
      }
    }
    void prepare();
    const subscription = Linking.addEventListener('url', event => { void prepare(event.url); });
    return () => { mounted = false; subscription.remove(); };
  }, []);

  async function updatePassword() {
    if (!supabase || !password || busy) return;
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage('Password updated. You can continue to X-App.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update password.');
    } finally { setBusy(false); }
  }

  if (!ready) return <YStack flex={1} p="$5" style={{ justifyContent: 'center', alignItems: 'center' }} bg="$background"><Text>Restoring secure session…</Text></YStack>;

  return <YStack flex={1} p="$5" style={{ justifyContent: 'center' }} gap="$4" bg="$background">
    <YStack gap="$2"><Text fontSize="$3" fontWeight="800" color="$colorPress">X-APP</Text><H1>Choose a new password.</H1><Paragraph color="$colorPress">Set a new password for your account.</Paragraph></YStack>
    <YStack gap="$3">
      <Input secureTextEntry placeholder="New password" value={password} onChangeText={setPassword} />
      <Input secureTextEntry placeholder="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} />
      {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      {message ? <Paragraph>{message}</Paragraph> : null}
      <Button onPress={() => { void updatePassword(); }} disabled={busy || !password || !confirmPassword}>{busy ? 'Updating…' : 'Update password'}</Button>
      <Button chromeless onPress={() => router.replace('/(auth)/sign-in')}>Back to sign in</Button>
    </YStack>
  </YStack>;
}

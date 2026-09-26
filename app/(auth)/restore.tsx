import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Button, H1, Input, Paragraph, Spinner, Text, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { supabase } from '../../src/lib/supabase';

function readAuthParams(url: string) {
  const fragment = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
  const params = new URLSearchParams(fragment || query);
  return { code: params.get('code'), access_token: params.get('access_token'), refresh_token: params.get('refresh_token'), error: params.get('error_description') ?? params.get('error') };
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
          const auth = readAuthParams(target);
          if (auth.error) throw new Error(auth.error);
          if (auth.code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(auth.code);
            if (exchangeError) throw exchangeError;
          } else if (auth.access_token && auth.refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({ access_token: auth.access_token, refresh_token: auth.refresh_token });
            if (sessionError) throw sessionError;
          }
        }
        if (mounted) setReady(true);
      } catch (e) {
        if (mounted) { setError(e instanceof Error ? e.message : 'Unable to restore the secure authentication session.'); setReady(true); }
      }
    }
    void prepare();
    const subscription = Linking.addEventListener('url', event => { void prepare(event.url); });
    return () => { mounted = false; subscription.remove(); };
  }, []);

  async function updatePassword() {
    if (!supabase || !password || busy) return;
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
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

  if (!ready) return <YStack flex={1} p="$5" style={{ justifyContent: 'center', alignItems: 'center' }} bg="$background"><Spinner /><Text marginTop="$3">Restoring secure session…</Text></YStack>;

  return (
    <YStack flex={1} p="$5" style={{ justifyContent: 'center' }} gap="$4" bg="$background">
      <YStack gap="$2">
        <Text fontSize="$3" fontWeight="900" color="$colorPress" letterSpacing={1}>X-APP</Text>
        <H1 fontWeight="900">Choose a new password.</H1>
        <Paragraph color="$colorPress">Set a new password for your account.</Paragraph>
      </YStack>
      <BentoCard title="Secure recovery" description="Choose a new password to finish account recovery.">
        <YStack gap="$3">
          <Input secureTextEntry placeholder="New password" value={password} onChangeText={setPassword} />
          <Input secureTextEntry placeholder="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} />
          {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
          {message ? <Paragraph>{message}</Paragraph> : null}
          <Button onPress={() => { void updatePassword(); }} disabled={busy || !password || !confirmPassword}>{busy ? 'Updating…' : 'Update password'}</Button>
        </YStack>
      </BentoCard>
      <Button chromeless onPress={() => router.replace('/(auth)/sign-in')}>Back to sign in</Button>
    </YStack>
  );
}
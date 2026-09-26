import { useState } from 'react';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Button, H1, Input, Paragraph, Text, YStack } from 'tamagui';
import { supabase } from '../../src/lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    const value = email.trim().toLowerCase();
    if (!supabase || !value || busy) return;
    setBusy(true); setMessage(''); setError('');
    try {
      const redirectTo = Linking.createURL('/restore');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(value, { redirectTo });
      if (resetError) { setError(resetError.message); return; }
      setMessage('If the email is registered, a password reset link has been sent.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to request a password reset.');
    } finally { setBusy(false); }
  }

  return <YStack flex={1} p="$5" style={{ justifyContent: 'center' }} gap="$4" bg="$background">
    <YStack gap="$2"><Text fontSize="$3" fontWeight="800" color="$colorPress">X-APP</Text><H1 fontSize="$10">Reset password.</H1><Paragraph color="$colorPress">Enter your account email and check your inbox.</Paragraph></YStack>
    <YStack gap="$3">
      <Input autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} />
      {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      {message ? <Paragraph>{message}</Paragraph> : null}
      <Button onPress={() => { void submit(); }} disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Send reset link'}</Button>
      <Button chromeless onPress={() => router.replace('/(auth)/sign-in')}>Back to sign in</Button>
    </YStack>
  </YStack>;
}

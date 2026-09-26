import { useState } from 'react';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { H1, Input, Paragraph, Text, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { BentoCard } from '../../src/components/BentoCard';
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

  return (
    <YStack flex={1} p="$5" style={{ justifyContent: 'center' }} gap="$4" bg="$background">
      <YStack gap="$2">
        <Text fontSize="$3" fontWeight="900" color="$colorPress" letterSpacing={1}>X-APP</Text>
        <H1 fontSize="$10" fontWeight="900">Reset password.</H1>
        <Paragraph color="$colorPress">We will send a secure reset link to your account email.</Paragraph>
      </YStack>
      <BentoCard title="Password recovery" description="Enter the email associated with your account.">
        <YStack gap="$3">
          <Input autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} />
          {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
          {message ? <Paragraph>{message}</Paragraph> : null}
          <XButton onPress={() => { void submit(); }} disabled={busy || !email.trim()}>{busy ? 'Sending…' : 'Send reset link'}</XButton>
        </YStack>
      </BentoCard>
      <XButton chromeless onPress={() => router.replace('/(auth)/sign-in')}>Back to sign in</XButton>
    </YStack>
  );
}
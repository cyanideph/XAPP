import { useState } from 'react';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { H1, Input, Paragraph, Separator, Text, XStack, YStack } from 'tamagui';
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
    <YStack flex={1} bg="$background" p="$5" items="center" justify="center">
      <YStack width="100%" maxW={520} gap="$5">
        <YStack gap="$3">
          <XStack bg="$brandSoft" px="$3" py="$2" rounded="$10" self="flex-start">
            <Text color="$brandBackground" fontSize="$2" fontWeight="900" letterSpacing={1}>X-APP</Text>
          </XStack>
          <YStack gap="$2">
            <H1 fontSize="$10" fontWeight="900">Reset password.</H1>
            <Paragraph color="$colorPress" size="$4">We will send a secure reset link to your account email.</Paragraph>
          </YStack>
        </YStack>

        <BentoCard title="Password recovery" description="Enter the email associated with your account.">
          <YStack gap="$3">
            <Input autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} onSubmitEditing={() => { void submit(); }} />
            {error ? <Paragraph color="$error">{error}</Paragraph> : null}
            {message ? <Paragraph color="$success">{message}</Paragraph> : null}
            <XButton onPress={() => { void submit(); }} disabled={busy || !email.trim()}>
              {busy ? 'Sending…' : 'Send reset link'}
            </XButton>
          </YStack>
        </BentoCard>

        <YStack gap="$3" items="center">
          <Separator width="100%" borderColor="$borderColor" />
          <XButton chromeless onPress={() => router.replace('/(auth)/sign-in')}>Back to sign in</XButton>
        </YStack>
      </YStack>
    </YStack>
  );
}
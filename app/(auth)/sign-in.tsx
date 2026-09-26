import { useState } from 'react';
import { router } from 'expo-router';
import { Button, H1, Input, Paragraph, Text, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { supabase } from '../../src/lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    const value = email.trim().toLowerCase();
    if (!supabase || !value || !password || busy) return;
    setBusy(true); setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: value, password });
      if (signInError) { setError(signInError.message); return; }
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.');
    } finally { setBusy(false); }
  }

  return (
    <YStack flex={1} p="$5" style={{ justifyContent: 'center' }} gap="$4" bg="$background">
      <YStack gap="$2">
        <Text fontSize="$3" fontWeight="900" color="$colorPress" letterSpacing={1}>X-APP</Text>
        <H1 fontSize="$10" fontWeight="900">Welcome back.</H1>
        <Paragraph color="$colorPress">Sign in to continue to your community.</Paragraph>
      </YStack>
      <BentoCard title="Sign in" description="Use your account credentials to continue.">
        <YStack gap="$3">
          <Input autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} />
          <Input secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} onSubmitEditing={() => { void submit(); }} />
          {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
          <Button onPress={() => { void submit(); }} disabled={busy || !email.trim() || !password}>{busy ? 'Signing in…' : 'Sign in'}</Button>
          <Button chromeless onPress={() => router.push('/(auth)/forgot-password')}>Forgot password?</Button>
        </YStack>
      </BentoCard>
      <Button chromeless onPress={() => router.push('/(auth)/sign-up')}>Create an account</Button>
    </YStack>
  );
}
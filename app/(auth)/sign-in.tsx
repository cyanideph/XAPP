import { useState } from 'react';
import { router } from 'expo-router';
import { Button, H1, Input, Paragraph, Text, YStack } from 'tamagui';
import { supabase } from '../../src/lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!supabase || !email.trim() || !password) return;
    setBusy(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(error.message);
    else router.replace('/(tabs)');
    setBusy(false);
  }

  return <YStack flex={1} padding="$5" justifyContent="center" gap="$4" backgroundColor="$background">
    <YStack gap="$2"><Text fontSize="$3" fontWeight="800" color="$colorPress">X-APP</Text><H1 fontSize="$10">Welcome back.</H1><Paragraph color="$colorPress">Sign in to continue.</Paragraph></YStack>
    <YStack gap="$3">
      <Input autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} />
      <Input secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} onSubmitEditing={submit} />
      {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      <Button onPress={submit} disabled={busy || !email.trim() || !password}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      <Button chromeless onPress={() => router.push('/(auth)/sign-up')}>Create an account</Button>
    </YStack>
  </YStack>;
}

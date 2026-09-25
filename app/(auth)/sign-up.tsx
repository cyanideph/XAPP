import { useState } from 'react';
import { router } from 'expo-router';
import { Button, H1, Input, Paragraph, Text, YStack } from 'tamagui';
import { supabase } from '../../src/lib/supabase';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    if (!supabase || !email.trim() || !password || !username.trim()) return;
    setBusy(true); setMessage('');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: username.trim() } },
    });
    setMessage(error ? error.message : 'Account created. Check your email if confirmation is required.');
    if (!error && data.session) router.replace('/(tabs)');
    setBusy(false);
  }

  return <YStack flex={1} padding="$5" justifyContent="center" gap="$4" backgroundColor="$background">
    <YStack gap="$2"><Text fontSize="$3" fontWeight="800" color="$colorPress">X-APP</Text><H1 fontSize="$10">Create account.</H1><Paragraph color="$colorPress">Your username is sent as signup metadata; backend profile creation remains authoritative.</Paragraph></YStack>
    <YStack gap="$3">
      <Input autoCapitalize="none" placeholder="Username" value={username} onChangeText={setUsername} />
      <Input autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} />
      <Input secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} onSubmitEditing={submit} />
      {message ? <Paragraph>{message}</Paragraph> : null}
      <Button onPress={submit} disabled={busy || !email.trim() || !password || !username.trim()}>{busy ? 'Creating…' : 'Create account'}</Button>
      <Button chromeless onPress={() => router.replace('/(auth)/sign-in')}>Back to sign in</Button>
    </YStack>
  </YStack>;
}

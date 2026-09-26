import { useState } from 'react';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Button, H1, Input, Paragraph, Text, YStack } from 'tamagui';
import { supabase } from '../../src/lib/supabase';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    const emailValue = email.trim().toLowerCase();
    const usernameValue = username.trim();
    if (!supabase || !emailValue || !password || !usernameValue || busy) return;
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true); setMessage(''); setError('');
    try {
      const redirectTo = Linking.createURL('/restore');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailValue,
        password,
        options: { data: { username: usernameValue }, emailRedirectTo: redirectTo },
      });
      if (signUpError) { setError(signUpError.message); return; }
      if (data.session) router.replace('/(tabs)');
      else setMessage('Account created. Check your email to confirm your address, then sign in.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create account.');
    } finally { setBusy(false); }
  }

  return <YStack flex={1} p="$5" style={{ justifyContent: 'center' }} gap="$4" bg="$background">
    <YStack gap="$2"><Text fontSize="$3" fontWeight="800" color="$colorPress">X-APP</Text><H1 fontSize="$10">Create account.</H1><Paragraph color="$colorPress">Choose your username, email and password.</Paragraph></YStack>
    <YStack gap="$3">
      <Input autoCapitalize="none" autoCorrect={false} placeholder="Username" value={username} onChangeText={setUsername} />
      <Input autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} />
      <Input secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} />
      <Input secureTextEntry placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} onSubmitEditing={() => { void submit(); }} />
      {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      {message ? <Paragraph>{message}</Paragraph> : null}
      <Button onPress={() => { void submit(); }} disabled={busy || !email.trim() || !password || !confirmPassword || !username.trim()}>{busy ? 'Creating…' : 'Create account'}</Button>
      <Button chromeless onPress={() => router.replace('/(auth)/sign-in')}>Back to sign in</Button>
    </YStack>
  </YStack>;
}

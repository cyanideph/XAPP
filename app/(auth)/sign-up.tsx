import { useState } from 'react';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { H1, Input, Paragraph, Separator, Text, XStack, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { BentoCard } from '../../src/components/BentoCard';
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
    if (busy) return;
    setMessage(''); setError('');
    if (!supabase) { setError('Supabase is not configured in this Expo build.'); return; }
    const emailValue = email.trim().toLowerCase();
    const usernameValue = username.trim();
    if (!emailValue || !password || !usernameValue) { setError('Please complete username, email, password and confirmation.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setBusy(true);
    try {
      const redirectTo = Linking.createURL('/restore');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailValue, password,
        options: { data: { username: usernameValue }, emailRedirectTo: redirectTo },
      });
      if (signUpError) { setError(signUpError.message); return; }
      if (data.session) router.replace('/(tabs)');
      else setMessage('Account created. Check your email to confirm your address, then sign in.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create account.');
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
            <H1 fontSize="$10" fontWeight="900">Create account.</H1>
            <Paragraph color="$colorPress" size="$4">Join the community with a username and secure account.</Paragraph>
          </YStack>
        </YStack>

        <BentoCard title="Your account" description="Set up the details you will use to sign in.">
          <YStack gap="$3">
            <Input autoCapitalize="none" autoCorrect={false} placeholder="Username" value={username} onChangeText={setUsername} />
            <Input autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} />
            <Input secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} />
            <Input secureTextEntry placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} onSubmitEditing={() => { void submit(); }} />
            {error ? <Paragraph color="$error">{error}</Paragraph> : null}
            {message ? <Paragraph color="$success">{message}</Paragraph> : null}
            <XButton onPress={() => { void submit(); }} disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
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
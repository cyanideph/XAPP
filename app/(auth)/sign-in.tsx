import { useState } from 'react';
import { router } from 'expo-router';
import { H1, Input, Paragraph, Separator, Text, XStack, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { supabase } from '../../src/lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit() {
    const value=email.trim().toLowerCase(); if(!supabase||!value||!password||busy)return;
    setBusy(true);setError('');
    try{const {error:signInError}=await supabase.auth.signInWithPassword({email:value,password});if(signInError){setError(signInError.message);return;}router.replace('/(tabs)');}
    catch(e){setError(e instanceof Error?e.message:'Unable to sign in.');}finally{setBusy(false);}
  }
  return <YStack flex={1} bg="$background" p="$5" items="center" justify="center">
    <YStack width="100%" maxW={520} gap="$5">
      <YStack gap="$3" items="flex-start"><XStack bg="$brandSoft" px="$3" py="$2" rounded="$10"><Text color="$brandBackground" fontSize="$2" fontWeight="900" letterSpacing={1}>X-APP</Text></XStack>
        <YStack gap="$2"><H1 fontSize="$10" fontWeight="900">Welcome back.</H1><Paragraph color="$colorPress" size="$4">Sign in to continue to your community.</Paragraph></YStack>
      </YStack>
      <YStack gap="$3"><Text fontSize="$5" fontWeight="800">Sign in</Text><Paragraph color="$colorPress">Use your account credentials to continue.</Paragraph>
        <Input autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} returnKeyType="next"/>
        <Input secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} onSubmitEditing={()=>{void submit();}} returnKeyType="done"/>
        {error?<Paragraph color="$error">{error}</Paragraph>:null}
        <XButton onPress={()=>{void submit();}} disabled={busy||!email.trim()||!password}>{busy?'Signing in…':'Sign in'}</XButton>
        <XButton chromeless onPress={()=>router.push('/(auth)/forgot-password')}>Forgot password?</XButton>
      </YStack>
      <YStack gap="$3" items="center"><Separator width="100%" borderColor="$borderColor"/><Text color="$colorPress">New to X-App?</Text><XButton chromeless onPress={()=>router.push('/(auth)/sign-up')}>Create an account</XButton></YStack>
    </YStack>
  </YStack>;
}
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, H1, Input, Paragraph, Spinner, Text, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { BentoCard } from '../../src/components/BentoCard';
import { getNotificationPreferences, setNotificationPreferences, NotificationPreferences } from '../../src/lib/backend';
import { supabase } from '../../src/lib/supabase';

const keys = [
  ['follow_enabled', 'Follow notifications'],
  ['block_enabled', 'Block notifications'],
  ['content_comment_enabled', 'Content comments'],
  ['comment_reply_enabled', 'Comment replies'],
  ['content_reaction_enabled', 'Content reactions'],
  ['room_message_reaction_enabled', 'Room reactions'],
  ['profile_comment_enabled', 'Profile comments'],
  ['mention_enabled', 'Mentions'],
  ['room_invite_enabled', 'Room invitations'],
  ['conversation_invite_enabled', 'Conversation invitations'],
] as const;

export default function Settings() {
  const [preferences, setPreferences] = useState<Omit<NotificationPreferences, 'user_id'> | null>(null);
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getNotificationPreferences()
      .then(({ user_id: _userId, ...rest }) => setPreferences(rest))
      .catch((error) => setStatus(error instanceof Error ? error.message : 'Unable to load settings.'));
    void supabase?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''));
  }, []);

  async function changePassword() {
    setStatus('');
    if (newPassword.length < 8) return setStatus('Password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return setStatus('Passwords do not match.');
    if (!supabase) return setStatus('Supabase is not configured.');
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword, current_password: currentPassword });
      if (error) throw error;
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus('Password updated successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to update password.');
    } finally {
      setBusy(false);
    }
  }

  async function changeEmail() {
    setStatus('');
    if (!supabase || !email.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) throw error;
      setStatus('Email change requested. Check the confirmation email(s).');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to update email.');
    } finally {
      setBusy(false);
    }
  }

  if (!preferences) {
    return (
      <YStack flex={1} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Spinner />
      </YStack>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 40 }}>
      <YStack gap="$4">
        <H1>Settings.</H1>

        <BentoCard title="Account security" description="Manage your password and email identity.">
          <YStack gap="$2">
            <Paragraph>Manage your password and email identity.</Paragraph>
            <Input secureTextEntry placeholder="Current password" value={currentPassword} onChangeText={setCurrentPassword} />
            <Input secureTextEntry placeholder="New password" value={newPassword} onChangeText={setNewPassword} />
            <Input secureTextEntry placeholder="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} />
            <XButton disabled={busy} onPress={() => void changePassword()}>Change password</XButton>
            <Input keyboardType="email-address" autoCapitalize="none" placeholder="Email address" value={email} onChangeText={setEmail} />
            <XButton disabled={busy} onPress={() => void changeEmail()}>Change email</XButton>
          </YStack>
        </BentoCard>

        <BentoCard title="Notifications" description="Choose which community events notify you.">
          <YStack gap="$2">
            {keys.map(([key, label]) => (
              <Button key={key} onPress={() => setPreferences({ ...preferences, [key]: !preferences[key] })}>
                {label}: {preferences[key] ? 'ON' : 'OFF'}
              </Button>
            ))}
            <XButton onPress={() => void setNotificationPreferences(preferences).then(() => setStatus('Settings saved.')).catch((error) => setStatus(error instanceof Error ? error.message : 'Unable to save settings.'))}>
              Save settings
            </XButton>
          </YStack>
        </BentoCard>

        {status ? <Text color="$colorPress">{status}</Text> : null}
        <Button chromeless onPress={() => router.back()}>Back</Button>
      </YStack>
    </ScrollView>
  );
}

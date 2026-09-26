import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Accordion, H1, Input, Paragraph, Separator, Spinner, Switch, Text, XStack, YGroup, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { getNotificationPreferences, setNotificationPreferences, NotificationPreferences } from '../../src/lib/backend';
import { supabase } from '../../src/lib/supabase';

const keys = [
  ['follow_enabled', 'Follow notifications'], ['block_enabled', 'Block notifications'],
  ['content_comment_enabled', 'Content comments'], ['comment_reply_enabled', 'Comment replies'],
  ['content_reaction_enabled', 'Content reactions'], ['room_message_reaction_enabled', 'Room reactions'],
  ['profile_comment_enabled', 'Profile comments'], ['mention_enabled', 'Mentions'],
  ['room_invite_enabled', 'Room invitations'], ['conversation_invite_enabled', 'Conversation invitations'],
] as const;

export default function Settings() {
  const [preferences, setPreferences] = useState<Omit<NotificationPreferences, 'user_id'> | null>(null);
  const [status, setStatus] = useState(''); const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState(''); const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getNotificationPreferences().then(({ user_id: _userId, ...rest }) => setPreferences(rest))
      .catch(error => setStatus(error instanceof Error ? error.message : 'Unable to load settings.'));
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
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setStatus('Password updated successfully.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to update password.'); }
    finally { setBusy(false); }
  }

  async function changeEmail() {
    setStatus(''); if (!supabase || !email.trim()) return; setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) throw error; setStatus('Email change requested. Check the confirmation email(s).');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to update email.'); }
    finally { setBusy(false); }
  }

  if (!preferences) return <YStack flex={1} bg="$background" items="center" justify="center"><Spinner color="$brandBackground" /></YStack>;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 40 }}>
      <YStack gap="$5">
        <H1>Settings.</H1>

        <Accordion type="multiple" defaultValue={['security', 'notifications']} overflow="hidden">
          <Accordion.Item value="security">
            <Accordion.Header>
              <Accordion.Trigger unstyled p="$3" borderWidth={0} bg="$backgroundHover">
                <XStack flex={1} items="center" justify="space-between" gap="$3">
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$5" fontWeight="800">Account security</Text>
                    <Paragraph color="$colorPress">Manage your password and email identity.</Paragraph>
                  </YStack>
                  <Text color="$colorPress">⌄</Text>
                </XStack>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content transition="medium" exitStyle={{ opacity: 0, y: -8 }} p="$3">
              <YStack gap="$3">
                <Input secureTextEntry placeholder="Current password" value={currentPassword} onChangeText={setCurrentPassword} />
                <Input secureTextEntry placeholder="New password" value={newPassword} onChangeText={setNewPassword} />
                <Input secureTextEntry placeholder="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} />
                <XButton disabled={busy} onPress={() => void changePassword()}>Change password</XButton>
                <Separator />
                <Input keyboardType="email-address" autoCapitalize="none" placeholder="Email address" value={email} onChangeText={setEmail} />
                <XButton disabled={busy} onPress={() => void changeEmail()}>Change email</XButton>
              </YStack>
            </Accordion.Content>
          </Accordion.Item>

          <Separator />

          <Accordion.Item value="notifications">
            <Accordion.Header>
              <Accordion.Trigger unstyled p="$3" borderWidth={0} bg="$backgroundHover">
                <XStack flex={1} items="center" justify="space-between" gap="$3">
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$5" fontWeight="800">Notifications</Text>
                    <Paragraph color="$colorPress">Choose which community events notify you.</Paragraph>
                  </YStack>
                  <Text color="$colorPress">⌄</Text>
                </XStack>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content transition="medium" exitStyle={{ opacity: 0, y: -8 }} p="$3">
              <YStack gap="$3">
                <YGroup borderWidth={1} borderColor="$borderColor">
                  {keys.map(([key, label], index) => (
                    <YGroup.Item key={key}>
                      <XStack items="center" justify="space-between" px="$3" py="$3">
                        <Text flex={1}>{label}</Text>
                        <Switch size="$3" checked={Boolean(preferences[key])}
                          onCheckedChange={checked => setPreferences({ ...preferences, [key]: checked })}>
                          <Switch.Thumb />
                        </Switch>
                      </XStack>
                      {index < keys.length - 1 ? <Separator /> : null}
                    </YGroup.Item>
                  ))}
                </YGroup>
                <XButton onPress={() => void setNotificationPreferences(preferences)
                  .then(() => setStatus('Settings saved.'))
                  .catch(error => setStatus(error instanceof Error ? error.message : 'Unable to save settings.'))}>Save settings</XButton>
              </YStack>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>

        {status ? <Text color="$colorPress">{status}</Text> : null}
        <XButton chromeless onPress={() => router.back()}>Back</XButton>
      </YStack>
    </ScrollView>
  );
}

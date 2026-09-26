import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { H1, Input, Paragraph, Text, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { getCurrentProfile, updateCurrentProfile } from '../../src/lib/backend';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void getCurrentProfile()
      .then(setProfile)
      .catch(e => setError(e instanceof Error ? e.message : 'Unable to load profile.'));
  }, []);

  if (!profile) return <YStack flex={1} p="$5" items="center" justify="center"><Text>{error || 'Loading…'}</Text></YStack>;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64 }}>
      <YStack gap="$4">
        <Text fontSize="$3" color="$colorPress" fontWeight="800">PROFILE</Text>
        <H1>Edit profile.</H1>
        <YStack gap="$3">
          <Text fontSize="$5" fontWeight="800">Public identity</Text>
          <Paragraph color="$colorPress">Keep your identity and status current.</Paragraph>
          <Input value={profile.username} onChangeText={v => setProfile({ ...profile, username: v })} placeholder="Username" autoCapitalize="none" />
          <Input value={profile.display_name ?? ''} onChangeText={v => setProfile({ ...profile, display_name: v })} placeholder="Display name" />
          <Input value={profile.status_text ?? ''} onChangeText={v => setProfile({ ...profile, status_text: v })} placeholder="Status" />
          <Input value={profile.bio ?? ''} onChangeText={v => setProfile({ ...profile, bio: v })} placeholder="Bio" multiline />
          {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
          {saved ? <Paragraph color="$brandBackground">Profile saved.</Paragraph> : null}
        </YStack>
        <XButton onPress={() => {
          setSaved(false); setError('');
          void updateCurrentProfile(profile).then(setProfile).then(() => setSaved(true))
            .catch(e => setError(e instanceof Error ? e.message : 'Unable to save profile.'));
        }}>Save profile</XButton>
        <XButton chromeless onPress={() => router.back()}>Back</XButton>
      </YStack>
    </ScrollView>
  );
}

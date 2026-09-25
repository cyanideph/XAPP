import { ScrollView } from 'react-native';
import { H1, Paragraph, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';

export default function MeScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64 }}>
      <YStack gap="$4">
        <H1 fontSize="$10" fontWeight="900">Me</H1>
        <Paragraph color="$colorPress">Profile, favorites, notifications and settings.</Paragraph>
        <BentoCard title="Profile" description="Your public identity and activity." />
        <BentoCard title="Favorites" description="People you have saved." />
        <BentoCard title="Settings" description="Notifications, chat preferences and account controls." />
      </YStack>
    </ScrollView>
  );
}

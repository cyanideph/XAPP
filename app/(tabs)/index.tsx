import { ScrollView } from 'react-native';
import { H1, Paragraph, Text, XStack, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';
import { BentoSection } from '../../src/components/BentoSection';

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64 }}>
      <YStack gap="$5">
        <YStack gap="$2">
          <Text fontSize="$3" color="$colorPress" fontWeight="700">X-APP</Text>
          <H1 fontSize="$10" fontWeight="900">Good evening.</H1>
          <Paragraph color="$colorPress">Your people, rooms and conversations in one place.</Paragraph>
        </YStack>

        <BentoSection>
          <XStack gap="$3">
            <BentoCard title="Online" value="128" description="People active recently" />
            <BentoCard title="Rooms" value="24" description="Public communities" />
          </XStack>

          <BentoCard
            title="Active community"
            value="General Chat"
            description="18 people online · Join the conversation"
          />

          <XStack gap="$3">
            <BentoCard title="Discover" description="Find people and public rooms." />
            <BentoCard title="Saved" value="12" description="Favorite people." />
          </XStack>

          <BentoCard
            title="Community"
            description="Your latest posts, comments and activity will appear here."
          />
        </BentoSection>
      </YStack>
    </ScrollView>
  );
}

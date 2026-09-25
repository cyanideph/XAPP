import { ScrollView } from 'react-native';
import { H1, Paragraph, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';

export default function ChatsScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64 }}>
      <YStack gap="$4">
        <H1 fontSize="$10" fontWeight="900">Chats</H1>
        <Paragraph color="$colorPress">Rooms and private conversations will live here.</Paragraph>
        <BentoCard title="Room conversations" description="Realtime room chat with presence, typing and reactions." />
        <BentoCard title="Direct messages" description="Private and group conversations with read state." />
      </YStack>
    </ScrollView>
  );
}

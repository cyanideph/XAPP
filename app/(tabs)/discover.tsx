import { ScrollView } from 'react-native';
import { H1, Paragraph, YStack } from 'tamagui';
import { BentoCard } from '../../src/components/BentoCard';

export default function DiscoverScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64 }}>
      <YStack gap="$4">
        <H1 fontSize="$10" fontWeight="900">Discover</H1>
        <Paragraph color="$colorPress">People, public rooms and community content.</Paragraph>
        <BentoCard title="Online users" value="128" description="Discover people active recently." />
        <BentoCard title="Public rooms" value="24" description="Explore active communities." />
        <BentoCard title="Content" description="Search posts, wikis and polls." />
      </YStack>
    </ScrollView>
  );
}

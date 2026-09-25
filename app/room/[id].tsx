import { Text, YStack } from 'tamagui';
import { useLocalSearchParams } from 'expo-router';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <YStack flex={1} padding="$4" backgroundColor="$background">
      <Text fontSize="$7" fontWeight="800">Room</Text>
      <Text color="$colorPress">Room ID: {id}</Text>
    </YStack>
  );
}

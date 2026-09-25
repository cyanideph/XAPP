import { Text, YStack } from 'tamagui';

export function BentoStat({ label, value }: { label: string; value: string | number }) {
  return (
    <YStack gap="$1">
      <Text fontSize="$8" fontWeight="900">{value}</Text>
      <Text fontSize="$3" color="$colorPress" fontWeight="600">{label}</Text>
    </YStack>
  );
}

import { Card, Paragraph, Text, XStack, YStack } from 'tamagui';
import type { ReactNode } from 'react';

type BentoCardProps = {
  title: string;
  value?: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  flex?: number;
  onPress?: () => void;
};

export function BentoCard({
  title,
  value,
  description,
  icon,
  children,
  flex = 1,
  onPress,
}: BentoCardProps) {
  return (
    <Card
      flex={flex}
      backgroundColor="$background"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$6"
      padding="$4"
      minHeight={132}
      pressStyle={{ opacity: 0.92, scale: 0.99 }}
      onPress={onPress}
    >
      <YStack flex={1} justifyContent="space-between" gap="$3">
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize="$3" fontWeight="700" color="$color">
            {title}
          </Text>
          {icon}
        </XStack>
        {value ? <Text fontSize="$9" fontWeight="800" color="$color">{value}</Text> : null}
        {description ? <Paragraph color="$colorPress" size="$3">{description}</Paragraph> : null}
        {children}
      </YStack>
    </Card>
  );
}

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
  delay?: number;
};

export function BentoCard({
  title,
  value,
  description,
  icon,
  children,
  flex = 1,
  onPress,
  delay = 0,
}: BentoCardProps) {
  return (
    <Card
      flex={flex}
      bg="$background"
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$6"
      p="$4"
      minHeight={132}
      transition={['quick', { delay }]}
      enterStyle={{ opacity: 0, y: 10 }}
      pressStyle={{ opacity: 0.92, scale: 0.985 }}
      hoverStyle={{
        borderColor: '$borderColorHover',
        bg: '$backgroundHover',
      }}
      onPress={onPress}
    >
      <YStack flex={1} gap="$3" justify="space-between">
        <XStack items="center" justify="space-between">
          <Text fontSize="$3" fontWeight="700" color="$color">{title}</Text>
          {icon}
        </XStack>
        {value ? <Text fontSize="$9" fontWeight="800" color="$color">{value}</Text> : null}
        {description ? <Paragraph color="$colorPress" size="$3">{description}</Paragraph> : null}
        {children}
      </YStack>
    </Card>
  );
}

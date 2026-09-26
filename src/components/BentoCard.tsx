import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
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
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 320, delay, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={{ flex, opacity, transform: [{ translateY }] }}>
      <Card
        bg="$background"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$6"
        p="$4"
        minHeight={132}
        pressStyle={{ opacity: 0.92, scale: 0.985 }}
        hoverStyle={{ borderColor: '$borderColorHover', backgroundColor: '$backgroundHover' }}
        onPress={onPress}
      >
        <YStack flex={1} gap="$3" style={{ justifyContent: 'space-between' }}>
          <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Text fontSize="$3" fontWeight="700" color="$color">{title}</Text>
            {icon}
          </XStack>
          {value ? <Text fontSize="$9" fontWeight="800" color="$color">{value}</Text> : null}
          {description ? <Paragraph color="$colorPress" size="$3">{description}</Paragraph> : null}
          {children}
        </YStack>
      </Card>
    </Animated.View>
  );
}

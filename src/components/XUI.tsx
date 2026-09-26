import { Button, Image, Input, Paragraph, Text, XStack, YStack } from 'tamagui';
import type { ComponentProps, ReactNode } from 'react';

export type XButtonProps = ComponentProps<typeof Button> & { loading?: boolean };

export function XButton({ loading = false, disabled, children, ...props }: XButtonProps) {
  return <Button {...props} disabled={disabled || loading} borderRadius="$6" fontWeight="700"
    pressStyle={{ opacity: 0.88, scale: 0.985 }} hoverStyle={{ backgroundColor: '$backgroundHover' }}
    focusStyle={{ borderColor: '$borderColorFocus' }}>{loading ? 'Loading…' : children}</Button>;
}

export function XInput({ label, error, ...props }: ComponentProps<typeof Input> & { label?: string; error?: string }) {
  return <YStack gap="$2" width="100%">
    {label ? <Text fontSize="$3" fontWeight="700" color="$color">{label}</Text> : null}
    <Input {...props} width="100%" borderRadius="$5" borderWidth={1} borderColor={error ? '$borderColorPress' : '$borderColor'}
      backgroundColor="$background" color="$color" placeholderTextColor="$placeholderColor" focusStyle={{ borderColor: '$borderColorFocus' }} />
    {error ? <Text fontSize="$2" color="$colorPress">{error}</Text> : null}
  </YStack>;
}

export function XBadge({ children }: { children: ReactNode }) {
  return <XStack bg="$backgroundPress" px="$3" py="$2" borderRadius="$10" items="center" self="flex-start">
    <Text fontSize="$2" fontWeight="700" color="$color">{children}</Text>
  </XStack>;
}

export function XAvatar({ uri, name = '?', size = 44 }: { uri?: string | null; name?: string; size?: number }) {
  const initials = name.trim().slice(0, 2).toUpperCase() || '?';
  return <XStack width={size} height={size} borderRadius="$10" overflow="hidden" backgroundColor="$backgroundPress"
    borderWidth={1} borderColor="$borderColor" items="center" justify="center">
    {uri ? <Image source={{ uri }} width="100%" height="100%" resizeMode="cover" /> : <Text fontWeight="800" color="$color">{initials}</Text>}
  </XStack>;
}

export function XIconButton({ children, accessibilityLabel, ...props }: Omit<ComponentProps<typeof Button>, 'children'> & { children: ReactNode; accessibilityLabel: string }) {
  return <Button {...props} accessibilityLabel={accessibilityLabel} circular size="$4" chromeless
    pressStyle={{ opacity: 0.7, scale: 0.94 }} hoverStyle={{ backgroundColor: '$backgroundHover' }}>{children}</Button>;
}

export function XMessageBubble({ children, mine = false, timestamp }: { children: ReactNode; mine?: boolean; timestamp?: string }) {
  return <YStack self={mine ? 'flex-end' : 'flex-start'} maxWidth="82%" backgroundColor={mine ? '$color' : '$background'}
    borderWidth={1} borderColor="$borderColor" borderRadius="$6" px="$4" py="$3" gap="$2">
    <Paragraph color={mine ? '$background' : '$color'} size="$3">{children}</Paragraph>
    {timestamp ? <Paragraph color={mine ? '$backgroundFocus' : '$colorPress'} size="$1">{timestamp}</Paragraph> : null}
  </YStack>;
}

export function XRoomHeader({ title, subtitle, left, right }: { title: string; subtitle?: string; left?: ReactNode; right?: ReactNode }) {
  return <XStack width="100%" px="$4" py="$3" items="center" gap="$3" borderBottomWidth={1} borderColor="$borderColor" backgroundColor="$background">
    {left}
    <YStack flex={1} minWidth={0}>
      <Text fontSize="$5" fontWeight="800" color="$color" numberOfLines={1}>{title}</Text>
      {subtitle ? <Text fontSize="$2" color="$colorPress" numberOfLines={1}>{subtitle}</Text> : null}
    </YStack>
    {right}
  </XStack>;
}

export function XRoomComposer({ value, onChangeText, onSend, disabled = false, accessory, placeholder = 'Write a message…' }: {
  value: string; onChangeText: (value: string) => void; onSend: () => void; disabled?: boolean; accessory?: ReactNode; placeholder?: string;
}) {
  return <XStack width="100%" px="$3" py="$3" gap="$2" items="flex-end" borderTopWidth={1} borderColor="$borderColor" backgroundColor="$background">
    {accessory}
    <Input flex={1} value={value} onChangeText={onChangeText} placeholder={placeholder} multiline maxHeight={120}
      borderRadius="$6" backgroundColor="$backgroundPress" borderWidth={1} borderColor="$borderColor" />
    <Button onPress={onSend} disabled={disabled || !value.trim()} borderRadius="$6" fontWeight="800"
      pressStyle={{ opacity: 0.86, scale: 0.98 }}>Send</Button>
  </XStack>;
}

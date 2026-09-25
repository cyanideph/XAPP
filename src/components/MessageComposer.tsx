import { useState } from 'react';
import { Button, Input, XStack } from 'tamagui';

export function MessageComposer({ onSend, disabled }: { onSend: (body: string) => Promise<void>; disabled?: boolean }) {
  const [value, setValue] = useState('');
  async function submit() {
    if (!value.trim() || disabled) return;
    const text = value;
    setValue('');
    try { await onSend(text); } catch { setValue(text); }
  }
  return (
    <XStack gap="$2" padding="$3" borderTopWidth={1} borderColor="$borderColor">
      <Input flex={1} value={value} onChangeText={setValue} placeholder="Message..." onSubmitEditing={submit} returnKeyType="send" />
      <Button onPress={submit} disabled={disabled || !value.trim()}>Send</Button>
    </XStack>
  );
}

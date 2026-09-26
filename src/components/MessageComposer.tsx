import { useEffect, useState } from 'react';
import { Button, Input, XStack } from 'tamagui';

type Props = {
  onSend: (body: string) => Promise<void>;
  disabled?: boolean;
  editValue?: string | null;
  onEditCancel?: () => void;
  onTyping?: () => void;
};

export function MessageComposer({ onSend, disabled, editValue, onEditCancel, onTyping }: Props) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (editValue !== undefined && editValue !== null) setValue(editValue);
  }, [editValue]);

  const editing = editValue !== undefined && editValue !== null;

  async function submit() {
    if (!value.trim() || disabled) return;
    const text = value;
    setValue('');
    try {
      await onSend(text);
    } catch {
      setValue(text);
    }
  }

  function cancelEdit() {
    setValue('');
    onEditCancel?.();
  }

  return (
    <XStack gap="$2" p="$3" borderTopWidth={1} borderColor="$borderColor" ai="center">
      <Input
        flex={1}
        value={value}
        onChangeText={(text) => { setValue(text); onTyping?.(); }}
        placeholder={editing ? 'Edit message...' : 'Message...'}
        onSubmitEditing={submit}
        returnKeyType="send"
        disabled={disabled}
      />
      {editing ? <Button size="$3" chromeless onPress={cancelEdit} disabled={disabled}>Cancel</Button> : null}
      <Button onPress={submit} disabled={disabled || !value.trim()}>{editing ? 'Save' : 'Send'}</Button>
    </XStack>
  );
}

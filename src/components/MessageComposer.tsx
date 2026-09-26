import { useEffect, useState } from 'react';
import { Input, XStack } from 'tamagui';
import { XButton } from './XButton';


type Props = {
  onSend: (body: string) => Promise<void>;
  disabled?: boolean;
  editValue?: string | null;
  onEditCancel?: () => void;
  onTyping?: () => void;
  onSendSticker?: (stickerId: string) => Promise<void>;
  onPickMedia?: () => Promise<void>;
};

export function MessageComposer({ onSend, disabled, editValue, onEditCancel, onTyping, onSendSticker, onPickMedia }: Props) {
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
    <XStack gap="$2" p="$3" borderTopWidth={1} borderColor="$borderColor" style={{ alignItems: "center", flexWrap: "wrap" }}>
      {!editing && onPickMedia ? <XButton size="$2" chromeless disabled={disabled} onPress={() => { void onPickMedia(); }}>+ Media</XButton> : null}
      {!editing && onSendSticker ? (
        <XStack gap="$1">
          {['smile', 'laugh', 'heart', 'thumbs_up', 'fire'].map(stickerId => (
            <XButton
              key={stickerId}
              size="$2"
              chromeless
              disabled={disabled}
              onPress={() => { void onSendSticker(stickerId); }}
            >
              {stickerId === 'smile' ? ':)' : stickerId === 'laugh' ? ':D' : stickerId === 'heart' ? '<3' : stickerId === 'thumbs_up' ? '+1' : '🔥'}
            </XButton>
          ))}
        </XStack>
      ) : null}
      <Input
        flex={1}
        value={value}
        onChangeText={(text) => { setValue(text); onTyping?.(); }}
        placeholder={editing ? 'Edit message...' : 'Message...'}
        onSubmitEditing={submit}
        returnKeyType="send"
        disabled={disabled}
      />
      {editing ? <XButton size="$3" chromeless onPress={cancelEdit} disabled={disabled}>Cancel</XButton> : null}
      <XButton onPress={submit} disabled={disabled || !value.trim()}>{editing ? 'Save' : 'Send'}</XButton>
    </XStack>
  );
}

import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { H1, Paragraph, Text, XStack, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { cancelRoomCoHostRequest, requestRoomCoHost } from '../../src/features/chat/roomManagement';

export default function RequestCoHostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const request = await requestRoomCoHost(id) as { id?: string };
      setRequestId(request?.id ?? null);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to request co-host access.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!requestId) return;
    setBusy(true);
    setError(null);
    try {
      await cancelRoomCoHostRequest(requestId);
      setDone(false);
      setRequestId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to cancel request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <YStack flex={1} p="$5" pt="$8" gap="$4" bg="$background">
      <Text fontSize="$3" color="$colorPress" fontWeight="800">ROOMS</Text>
      <H1 fontSize="$8">Request co-host</H1>
      <Paragraph color="$colorPress">Send a request to the Room owner or current staff. Authorization is enforced by the backend.</Paragraph>
      {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      {done ? (
        <>
          <Text fontWeight="800">Request submitted.</Text>
          <XStack gap="$2">
            <XButton disabled={busy || !requestId} onPress={() => void cancel()}>Cancel request</XButton>
            <XButton onPress={() => router.back()}>Done</XButton>
          </XStack>
        </>
      ) : (
        <XButton disabled={busy} onPress={() => void submit()}>
          {busy ? 'Sending…' : 'Request co-host'}
        </XButton>
      )}
    </YStack>
  );
}

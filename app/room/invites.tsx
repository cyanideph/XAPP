import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { BentoCard } from '../../src/components/BentoCard';
import { joinRoom, listPendingRoomInvites, respondRoomInvite, type RoomInvite } from '../../src/lib/backend';

export default function RoomInvitesScreen() {
  const [invites, setInvites] = useState<RoomInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setInvites(await listPendingRoomInvites(50)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load Room invitations.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const respond = async (invite: RoomInvite, accept: boolean) => {
    if (busy) return;
    setBusy(invite.id);
    setError(null);
    try {
      await respondRoomInvite(invite.id, accept);
      if (accept) {
        await joinRoom(invite.room_id);
        router.replace({ pathname: '/room/[id]', params: { id: invite.room_id } });
        return;
      }
      setInvites(rows => rows.filter(row => row.id !== invite.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to respond to Room invitation.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <YStack flex={1} p="$5" pt="$8" gap="$4" bg="$background">
      <XStack items="center" justify="space-between">
        <YStack>
          <Text fontSize="$3" color="$colorPress" fontWeight="800">ROOMS</Text>
          <H1 fontSize="$8">Invitations</H1>
        </YStack>
        <XButton chromeless onPress={() => router.back()}>Done</XButton>
      </XStack>
      {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      {loading ? <Spinner color="$brandBackground" /> : invites.length ? (
        <YStack gap="$3">
          {invites.map(invite => (
            <BentoCard
              key={invite.id}
              title={invite.room?.name || 'Room invitation'}
              description={invite.inviter ? `@${invite.inviter.username} invited you` : 'You have been invited to this Room.'}
              value={invite.room?.province_code || 'ROOM'}
            >
              <Text fontSize="$5" fontWeight="800">{invite.room?.name || 'Room invitation'}</Text>
              <Text color="$colorPress">{invite.inviter ? `@${invite.inviter.username} invited you` : 'You have been invited to this Room.'}</Text>
              {invite.room?.province_code ? <Text fontSize="$2" color="$colorPress">{invite.room.province_code}</Text> : null}
              <XStack gap="$2">
                <XButton disabled={busy === invite.id} onPress={() => void respond(invite, true)}>
                  {busy === invite.id ? 'Joining…' : 'Accept & Join'}
                </XButton>
                <XButton chromeless disabled={busy === invite.id} onPress={() => void respond(invite, false)}>Decline</XButton>
              </XStack>
            </BentoCard>
          ))}
        </YStack>
      ) : (
        <BentoCard title="No pending invitations" description="New Room invitations will appear here." />
      )}
    </YStack>
  );
}

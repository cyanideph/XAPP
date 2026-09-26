import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { H1, Paragraph, Spinner, Text, XStack, YGroup, YStack } from 'tamagui';
import { XButton as ActionButton } from '../../src/components/XButton';
import { XIcon } from '../../src/components/XIcon';
import { XListItem } from '../../src/components/XListItem';
import { joinRoom, listPendingRoomInvites, respondRoomInvite, type RoomInvite } from '../../src/lib/backend';

export default function RoomInvitesScreen() {
  const [invites, setInvites] = useState<RoomInvite[]>([]); const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setInvites(await listPendingRoomInvites(50)); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load Room invitations.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const respond = async (invite: RoomInvite, accept: boolean) => {
    if (busy) return; setBusy(invite.id); setError(null);
    try { await respondRoomInvite(invite.id, accept); if (accept) { await joinRoom(invite.room_id); router.replace({ pathname: '/room/[id]', params: { id: invite.room_id } }); return; } setInvites(rows => rows.filter(row => row.id !== invite.id)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to respond to Room invitation.'); } finally { setBusy(null); }
  };
  return (
    <YStack flex={1} p="$5" pt="$8" gap="$4" bg="$background">
      <XStack items="center" justify="space-between"><YStack><Text fontSize="$3" color="$colorPress" fontWeight="800">ROOMS</Text><H1 fontSize="$8">Invitations</H1></YStack><ActionButton chromeless icon={<XIcon name="check" size={18} color="#8B85FF" />} onPress={() => router.back()}>Done</ActionButton></XStack>
      {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      {loading ? <Spinner color="$brandBackground" /> : invites.length ? (
        <YGroup>
          {invites.map(invite => <YGroup.Item key={invite.id}>
            <XListItem title={invite.room?.name || 'Room invitation'}
              subTitle={invite.inviter ? `@${invite.inviter.username} invited you` : 'You have been invited to this Room.'}
              iconAfter={<XStack gap="$2">
                <ActionButton size="$2" icon={<XIcon name="check" size={16} color="#FFFFFF" />} disabled={busy === invite.id} onPress={() => void respond(invite, true)}>{busy === invite.id ? 'Joining…' : 'Accept'}</ActionButton>
                <ActionButton size="$2" chromeless icon={<XIcon name="close" size={16} color="#8B85FF" />} disabled={busy === invite.id} onPress={() => void respond(invite, false)}>Decline</ActionButton>
              </XStack>} />
          </YGroup.Item>)}
        </YGroup>
      ) : <Text color="$colorPress">No pending invitations.</Text>}
    </YStack>
  );
}

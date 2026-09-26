import { useCallback, useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { Button, H1, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { MessageComposer } from '../../src/components/MessageComposer';
import { listOnlineRoomMembers, listRoomMembers, listRoomCoHosts, setRoomCoHost, kickRoomMember, moderateRoomMember, strikeRoomMember, type RoomMember } from '../../src/features/chat/backend';
import { createRoomInvite, listOnlineUsers } from '../../src/lib/backend';
import { MessageList } from '../../src/components/MessageList';
import { useSession } from '../../src/hooks/useSession';
import { useChatMessages } from '../../src/features/chat/useChatMessages';
import { getRoom, type Room } from '../../src/lib/backend';
import type { ChatMessage } from '../../src/features/chat/types';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [editTarget, setEditTarget] = useState<ChatMessage | null>(null);
  const [onlineMembers, setOnlineMembers] = useState<Array<{ user_id: string; nickname: string | null; role: string; is_online: boolean }>>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteCandidates, setInviteCandidates] = useState<Array<{ user_id: string; username: string; display_name: string | null }>>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteBusy, setInviteBusy] = useState<string | null>(null);
  const [coHostIds, setCoHostIds] = useState<Set<string>>(new Set());
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminBusy, setAdminBusy] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const loadRoom = useCallback(async () => {
    try { setRoomError(null); setRoom(await getRoom(id)); }
    catch (e) { setRoomError(e instanceof Error ? e.message : 'Unable to load room.'); }
  }, [id]);
  useEffect(() => { void loadRoom(); }, [loadRoom]);

  const { messages, loading, sending, error, hasMore, loadOlder, send, reply, edit, remove, react, profiles, onTyping } = useChatMessages({ scope: 'room', id });
  useEffect(() => { let active = true; const refresh = async () => { try { const online = await listOnlineRoomMembers(id, 20, 0); if (active) setOnlineMembers(Array.isArray(online) ? online : []); } catch {} }; void refresh(); const timer = setInterval(refresh, 30000); return () => { active = false; clearInterval(timer); }; }, [id]);
  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const rows = await listRoomMembers(id, 100, 0);
      setMembers(Array.isArray(rows) ? rows : []);
      setMembersOpen(true);
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Unable to load room members.');
    } finally {
      setMembersLoading(false);
    }
  }, [id]);

  const loadInviteCandidates = useCallback(async () => {
    setInviteLoading(true);
    setRoomError(null);
    try {
      const [memberRows, onlineUsers] = await Promise.all([
        listRoomMembers(id, 100, 0),
        listOnlineUsers(50, 0),
      ]);
      const roomUserIds = new Set((Array.isArray(memberRows) ? memberRows : []).map(member => member.user_id));
      const candidates = (Array.isArray(onlineUsers) ? onlineUsers : [])
        .filter((user): user is { user_id: string; username: string; display_name: string | null } =>
          typeof user?.user_id === 'string' && typeof user?.username === 'string' && !roomUserIds.has(user.user_id),
        )
        .map(user => ({ user_id: user.user_id, username: user.username, display_name: user.display_name ?? null }));
      setMembers(Array.isArray(memberRows) ? memberRows : []);
      setInviteCandidates(candidates);
      setInviteOpen(true);
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Unable to load people to invite.');
    } finally {
      setInviteLoading(false);
    }
  }, [id]);

  const inviteUser = useCallback(async (userId: string) => {
    if (inviteBusy) return;
    setInviteBusy(userId);
    setRoomError(null);
    try {
      await createRoomInvite(id, userId);
      setInviteCandidates(current => current.filter(user => user.user_id !== userId));
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Unable to send room invitation.');
    } finally {
      setInviteBusy(null);
    }
  }, [id, inviteBusy]);

  const loadAdministration = useCallback(async () => {
    setAdminBusy('load');
    setRoomError(null);
    try {
      const rows = await listRoomCoHosts(id);
      setCoHostIds(new Set((Array.isArray(rows) ? rows : []).map(row => row.user_id)));
      setAdminOpen(true);
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Unable to load Room administration.');
    } finally {
      setAdminBusy(null);
    }
  }, [id]);

  const runAdminAction = useCallback((member: RoomMember, action: 'cohost' | 'kick' | 'mute' | 'ban' | 'strike') => {
    const label = member.profile?.display_name || member.profile?.username || member.nickname || 'member';
    const confirmText = action === 'cohost'
      ? (coHostIds.has(member.user_id) ? `Remove ${label} as co-host?` : `Make ${label} a co-host?`)
      : action === 'kick'
        ? `Kick ${label} from this Room?`
        : action === 'mute'
          ? `Mute ${label} for 60 minutes?`
          : action === 'ban'
            ? `Ban ${label} for 24 hours?`
            : `Issue a 24-hour strike to ${label}?`;
    Alert.alert('Room administration', confirmText, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: action === 'ban' || action === 'kick' ? 'destructive' : 'default',
        onPress: () => { void (async () => {
          setAdminBusy(member.user_id);
          setRoomError(null);
          try {
            if (action === 'cohost') {
              const enabled = !coHostIds.has(member.user_id);
              await setRoomCoHost(id, member.user_id, enabled);
              setCoHostIds(current => {
                const next = new Set(current);
                if (enabled) next.add(member.user_id); else next.delete(member.user_id);
                return next;
              });
            } else if (action === 'kick') {
              await kickRoomMember(id, member.user_id, true, 'Room moderation');
              setMembers(current => current.filter(row => row.user_id !== member.user_id));
            } else if (action === 'mute') {
              await moderateRoomMember(id, member.user_id, 'mute', 60, 'Room moderation');
              setMembers(current => current.map(row => row.user_id === member.user_id ? { ...row, muted_until: new Date(Date.now() + 60 * 60000).toISOString() } : row));
            } else if (action === 'ban') {
              await moderateRoomMember(id, member.user_id, 'ban', 1440, 'Room moderation');
              setMembers(current => current.map(row => row.user_id === member.user_id ? { ...row, banned_until: new Date(Date.now() + 1440 * 60000).toISOString() } : row));
            } else {
              await strikeRoomMember(id, member.user_id, 1440, 'Room moderation');
            }
          } catch (e) {
            setRoomError(e instanceof Error ? e.message : 'Room administration action failed.');
          } finally {
            setAdminBusy(null);
          }
        })(); },
      },
    ]);
  }, [coHostIds, id]);

  const submit = async (body: string) => {
    if (replyTarget) { await reply(replyTarget.id, body); setReplyTarget(null); }
    else if (editTarget) { await edit(editTarget.id, body); setEditTarget(null); }
    else await send(body);
  };
  return <YStack flex={1} bg="$background">
    <YStack p="$4" borderBottomWidth={1} borderColor="$borderColor">
      <H1 fontSize="$7">{room?.name ?? 'Room'}</H1><Text fontSize="$2" color="$colorPress">{room?.province_code ? `${room.province_code} · ` : ''}{onlineMembers.filter(member => member.is_online).length} online</Text>{room?.description ? <Paragraph color="$colorPress">{room.description}</Paragraph> : null}{room?.announcement ? <Paragraph fontWeight="800">{room.announcement}</Paragraph> : null}{room?.view_only ? <Text color="$colorPress">View-only room</Text> : null}{room?.is_locked ? <Text color="$red10">Room locked</Text> : null}{roomError ? <Paragraph color="$red10">{roomError}</Paragraph> : null}{error ? <Paragraph color="$red10">{error}</Paragraph> : null}
    </YStack>
    {loading ? <YStack flex={1} style={{ alignItems: "center", justifyContent: "center" }}><Spinner /></YStack> :
      <YStack flex={1}><MessageList messages={messages} currentUserId={session?.user.id} hasMore={hasMore} onLoadOlder={loadOlder} profiles={profiles} onReply={m => { setEditTarget(null); setReplyTarget(m); }} onEdit={m => { setReplyTarget(null); setEditTarget(m); }} onDelete={m => remove(m.id)} onReact={(m,r) => react(m.id,r)} /></YStack>}
    {replyTarget ? <YStack px="$3" pt="$2"><Text fontSize="$2" color="$colorPress">Replying to: {replyTarget.body.slice(0, 80)}</Text></YStack> : null}
    {onlineMembers.length ? <XStack px="$3" pb="$2" gap="$2" flexWrap="wrap"><Text fontSize="$2" color="$colorPress">Online:</Text>{onlineMembers.filter(member => member.is_online).slice(0, 8).map(member => <Text key={member.user_id} fontSize="$2">{member.nickname || 'Member'}</Text>)}</XStack> : null}
    <YStack px="$3" pb="$2" gap="$2">
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Text fontSize="$3" fontWeight="800">Members {members.length ? `(${members.length})` : ''}</Text>
        <XStack gap="$2">
          <Button size="$2" chromeless disabled={adminBusy === 'load'} onPress={() => { void loadAdministration(); }}>
            {adminBusy === 'load' ? 'Loading…' : 'Admin'}
          </Button>
          <Button size="$2" chromeless disabled={inviteLoading} onPress={() => { void loadInviteCandidates(); }}>
            {inviteLoading ? 'Loading…' : 'Invite'}
          </Button>
          <Text onPress={() => { if (membersOpen) setMembersOpen(false); else void loadMembers(); }} color="$colorPress">
            {membersOpen ? 'Hide' : membersLoading ? 'Loading…' : 'Show'}
          </Text>
        </XStack>
      </XStack>
      {membersOpen ? <YStack gap="$2">
        {members.map(member => {
          const profile = member.profile;
          return <XStack key={member.user_id} gap="$2" style={{ alignItems: 'center' }}>
            <Text fontWeight="700">{member.nickname || profile?.display_name || profile?.username || 'Member'}</Text>
            <Text fontSize="$2" color="$colorPress">@{profile?.username || 'unknown'} · {member.role}</Text>
          </XStack>;
        })}
        {!members.length ? <Text color="$colorPress">No members found.</Text> : null}
      </YStack> : null}
      {adminOpen ? <YStack gap="$2" pt="$2">
        <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Text fontSize="$3" fontWeight="800">Room administration</Text>
          <Text color="$colorPress" onPress={() => setAdminOpen(false)}>Hide</Text>
        </XStack>
        <Text fontSize="$2" color="$colorPress">Controls are enforced by the Supabase Room authorization rules.</Text>
        {members.map(member => {
          const label = member.profile?.display_name || member.profile?.username || member.nickname || 'Member';
          const isSelf = member.user_id === session?.user.id;
          const busy = adminBusy === member.user_id;
          return <YStack key={`admin-${member.user_id}`} gap="$2" p="$2" borderWidth={1} borderColor="$borderColor">
            <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <YStack flex={1}>
                <Text fontWeight="700">{label}</Text>
                <Text fontSize="$2" color="$colorPress">@{member.profile?.username || 'unknown'} · {member.role}{coHostIds.has(member.user_id) ? ' · co-host' : ''}</Text>
              </YStack>
              {busy ? <Spinner size="small" /> : null}
            </XStack>
            {!isSelf && member.role !== 'owner' ? <XStack gap="$2" flexWrap="wrap">
              <Button size="$2" disabled={busy} onPress={() => runAdminAction(member, 'cohost')}>
                {coHostIds.has(member.user_id) ? 'Remove co-host' : 'Make co-host'}
              </Button>
              <Button size="$2" disabled={busy} onPress={() => runAdminAction(member, 'mute')}>Mute 60m</Button>
              <Button size="$2" disabled={busy} onPress={() => runAdminAction(member, 'ban')}>Ban 24h</Button>
              <Button size="$2" disabled={busy} onPress={() => runAdminAction(member, 'kick')}>Kick</Button>
              <Button size="$2" disabled={busy} onPress={() => runAdminAction(member, 'strike')}>Strike</Button>
            </XStack> : null}
          </YStack>;
        })}
      </YStack> : null}
      {inviteOpen ? <YStack gap="$2" pt="$2">
        <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Text fontSize="$3" fontWeight="800">Invite people</Text>
          <Text color="$colorPress" onPress={() => setInviteOpen(false)}>Hide</Text>
        </XStack>
        {inviteCandidates.map(user => (
          <XStack key={user.user_id} gap="$2" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <YStack flex={1}>
              <Text fontWeight="700">{user.display_name || user.username}</Text>
              <Text fontSize="$2" color="$colorPress">@{user.username}</Text>
            </YStack>
            <Button
              size="$2"
              disabled={inviteBusy === user.user_id}
              onPress={() => { void inviteUser(user.user_id); }}
            >
              {inviteBusy === user.user_id ? 'Sending…' : 'Invite'}
            </Button>
          </XStack>
        ))}
        {!inviteCandidates.length ? <Text color="$colorPress">No online people available to invite.</Text> : null}
      </YStack> : null}
    </YStack>
    <MessageComposer onSend={submit} disabled={sending || loading || room?.view_only || room?.is_locked} editValue={editTarget?.body ?? null} onEditCancel={() => setEditTarget(null)} onTyping={onTyping} />
  </YStack>;
}

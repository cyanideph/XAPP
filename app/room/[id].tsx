import { useCallback, useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, H1, Input, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { MessageComposer } from '../../src/components/MessageComposer';
import { listOnlineRoomMembers, listRoomMembers, listRoomCoHosts, setRoomCoHost, kickRoomMember, moderateRoomMember, strikeRoomMember, setRoomChatSettings, setRoomLock, setRoomMemberChatPreferences, setRoomPinnedMessage, setRoomMessageMentions, createRoomReport, listRoomReports, updateRoomReport, uploadRoomMedia, attachRoomMediaToMessage, deleteRoomMedia, type RoomMember, type RoomReport } from '../../src/features/chat/backend';
import { createRoomInvite, listOnlineUsers } from '../../src/lib/backend';
import { MessageList } from '../../src/components/MessageList';
import { useSession } from '../../src/hooks/useSession';
import { useChatMessages } from '../../src/features/chat/useChatMessages';
import { getRoom, type Room } from '../../src/lib/backend';
import { searchRoomInviteCandidates } from '../../src/features/chat/roomManagement';
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
  const [inviteQuery, setInviteQuery] = useState('');
  const [coHostIds, setCoHostIds] = useState<Set<string>>(new Set());
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminBusy, setAdminBusy] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState<string | null>(null);
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [viewOnlyDraft, setViewOnlyDraft] = useState(false);
  const [membersCanInviteDraft, setMembersCanInviteDraft] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [roomPinned, setRoomPinned] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [reports, setReports] = useState<RoomReport[]>([]);
  const [reportTarget, setReportTarget] = useState<{ messageId?: string; userId?: string; label: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const loadRoom = useCallback(async () => {
    try { setRoomError(null); setRoom(await getRoom(id)); }
    catch (e) { setRoomError(e instanceof Error ? e.message : 'Unable to load room.'); }
  }, [id]);
  useEffect(() => { void loadRoom(); }, [loadRoom]);

  const { messages, loading, sending, error, hasMore, loadOlder, send, sendMedia, sendSticker, reply, edit, remove, react, profiles, onTyping } = useChatMessages({ scope: 'room', id });
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

  const loadInviteCandidates = useCallback(async (query = inviteQuery) => {
    setInviteLoading(true);
    setRoomError(null);
    try {
      const memberRows = await listRoomMembers(id, 100, 0);
      const roomMembers = (Array.isArray(memberRows) ? memberRows : []) as RoomMember[];
      const roomUserIds = new Set(roomMembers.map(member => member.user_id));
      let candidates: Array<{ user_id: string; username: string; display_name: string | null }>;
      if (query.trim().length >= 2) {
        candidates = await searchRoomInviteCandidates(query, 50);
      } else {
        const onlineRows = await listOnlineUsers(50, 0);
        const onlineUsers = (Array.isArray(onlineRows) ? onlineRows : []) as Array<{ user_id: string; username: string; display_name: string | null }>;
        candidates = onlineUsers.filter(user => !roomUserIds.has(user.user_id));
      }
      setMembers(roomMembers);
      setInviteCandidates(candidates.filter(user => !roomUserIds.has(user.user_id)));
      setInviteOpen(true);
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Unable to load people to invite.');
    } finally {
      setInviteLoading(false);
    }
  }, [id, inviteQuery]);

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
      const [rows, reportRows] = await Promise.all([listRoomCoHosts(id), listRoomReports(id, null, 50, 0)]);
      setCoHostIds(new Set((Array.isArray(rows) ? rows : []).map(row => row.user_id)));
      setReports(Array.isArray(reportRows) ? reportRows : []);
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

  const openReport = useCallback((target: { messageId?: string; userId?: string; label: string }) => {
    setReportTarget(target);
    setReportReason('');
    setRoomError(null);
  }, []);

  const submitReport = useCallback(async () => {
    if (!reportTarget || reportBusy) return;
    const reason = reportReason.trim();
    if (reason.length < 3) {
      setRoomError('Please provide a short reason for the report.');
      return;
    }
    setReportBusy(true);
    setRoomError(null);
    try {
      await createRoomReport(id, reason, reportTarget.userId ?? null, reportTarget.messageId ?? null);
      setReportTarget(null);
      setReportReason('');
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Unable to submit report.');
    } finally {
      setReportBusy(false);
    }
  }, [id, reportBusy, reportReason, reportTarget]);

  const resolveReport = useCallback(async (reportId: string, status: 'resolved' | 'dismissed') => {
    if (reportBusy) return;
    setReportBusy(true);
    setRoomError(null);
    try {
      const updated = await updateRoomReport(reportId, status, status === 'resolved' ? 'Reviewed by Room staff' : 'Dismissed by Room staff');
      setReports(current => current.map(report => report.id === reportId ? updated : report));
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Unable to update report.');
    } finally {
      setReportBusy(false);
    }
  }, [reportBusy]);

  const loadSettings = useCallback(async () => {
    setSettingsBusy('load');
    setRoomError(null);
    try {
      const [freshRoom, memberRows] = await Promise.all([
        getRoom(id),
        listRoomMembers(id, 100, 0),
      ]);
      setRoom(freshRoom);
      setAnnouncementDraft(freshRoom?.announcement ?? '');
      setViewOnlyDraft(Boolean(freshRoom?.view_only));
      setMembersCanInviteDraft(freshRoom?.members_can_invite !== false);
      const selfMember = (Array.isArray(memberRows) ? memberRows : []).find(member => member.user_id === session?.user.id);
      setNotificationsEnabled(selfMember?.chat_notifications_enabled ?? true);
      setRoomPinned(selfMember?.is_pinned ?? false);
      setSettingsOpen(true);
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Unable to load Room settings.');
    } finally {
      setSettingsBusy(null);
    }
  }, [id, session?.user.id]);

  const saveChatSettings = useCallback(async () => {
    setSettingsBusy('chat');
    setRoomError(null);
    try {
      const updated = await setRoomChatSettings(id, announcementDraft.trim() || null, viewOnlyDraft, membersCanInviteDraft);
      setRoom(updated as Room);
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Unable to save Room settings.');
    } finally {
      setSettingsBusy(null);
    }
  }, [announcementDraft, id, membersCanInviteDraft, viewOnlyDraft]);

  const toggleRoomLock = useCallback(async () => {
    if (!room) return;
    const locked = !room.is_locked;
    setSettingsBusy('lock');
    setRoomError(null);
    try {
      const updated = await setRoomLock(id, locked, locked ? 'Room settings' : 'Room unlocked');
      setRoom(updated as Room);
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Unable to update Room lock.');
    } finally {
      setSettingsBusy(null);
    }
  }, [id, room]);

  const saveMemberPreferences = useCallback(async () => {
    setSettingsBusy('prefs');
    setRoomError(null);
    try {
      await setRoomMemberChatPreferences(id, notificationsEnabled, roomPinned);
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Unable to save your Room preferences.');
    } finally {
      setSettingsBusy(null);
    }
  }, [id, notificationsEnabled, roomPinned]);

  const pinRoomMessage = useCallback(async (messageId: string | null) => {
    setSettingsBusy(messageId ? 'pin-' + messageId : 'unpin');
    setRoomError(null);
    try {
      const updated = await setRoomPinnedMessage(id, messageId);
      setRoom(updated as Room);
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Unable to update the pinned message.');
    } finally {
      setSettingsBusy(null);
    }
  }, [id]);

  const pickMedia = useCallback(async () => {
    if (mediaBusy || sending || room?.view_only || room?.is_locked) return;
    setMediaBusy(true);
    setRoomError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Media library permission is required.');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const media = await uploadRoomMedia(id, {
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
        type: asset.type,
      });

      let message: ChatMessage | null = null;
      try {
        message = await sendMedia(media.caption ?? '', {
          media_id: media.id,
          bucket: media.bucket,
          path: media.path,
          mime_type: media.mime_type,
          filename: media.filename,
          width: media.width,
          height: media.height,
          duration_ms: media.duration_ms,
          size_bytes: media.size_bytes,
        });
      } catch (sendError) {
        await deleteRoomMedia(media).catch(() => undefined);
        throw sendError;
      }

      if (message) {
        try {
          await attachRoomMediaToMessage(media.id, message.id);
        } catch {
          setRoomError('Media sent, but its attachment record could not be linked.');
        }
      }
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Unable to upload media.');
    } finally {
      setMediaBusy(false);
    }
  }, [id, mediaBusy, room?.is_locked, room?.view_only, sendMedia, sending]);

  const submit = async (body: string) => {
    if (replyTarget) { await reply(replyTarget.id, body); setReplyTarget(null); return; }
    if (editTarget) { await edit(editTarget.id, body); setEditTarget(null); return; }

    const message = await send(body);
    if (!message) return;

    const usernames = [...body.matchAll(/@([a-zA-Z0-9_.-]{2,32})/g)].map(match => match[1].toLowerCase());
    if (!usernames.length) return;

    try {
      const roomMembers = members.length ? members : await listRoomMembers(id, 100, 0);
      if (!members.length) setMembers(roomMembers);
      const mentionedIds = roomMembers
        .filter(member => member.profile?.username && usernames.includes(member.profile.username.toLowerCase()))
        .map(member => member.user_id);
      if (mentionedIds.length) await setRoomMessageMentions(message.id, [...new Set(mentionedIds)]);
    } catch (e) {
      setRoomError(e instanceof Error ? e.message : 'Message sent, but mentions could not be saved.');
    }
  };
  return <YStack flex={1} bg="$background">
    <YStack px="$4" pt="$3" pb="$2" gap="$3">
      <YStack p="$4" gap="$2" bg="$background" borderWidth={1} borderColor="$borderColor" rounded="$6">
        <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <YStack flex={1} gap="$1">
            <Text fontSize="$2" color="$colorPress" fontWeight="800" letterSpacing={1}>ROOM</Text>
            <H1 fontSize="$7" fontWeight="900">{room?.name ?? 'Room'}</H1>
            <Text fontSize="$2" color="$colorPress">
              {room?.province_code ? `${room.province_code} · ` : ''}{onlineMembers.filter(member => member.is_online).length} online
            </Text>
          </YStack>
          <YStack px="$3" py="$2" rounded="$10" bg="$backgroundHover" style={{ alignItems: 'center' }}>
            <Text fontSize="$2" fontWeight="800">{onlineMembers.filter(member => member.is_online).length}</Text>
            <Text fontSize="$1" color="$colorPress">ONLINE</Text>
          </YStack>
        </XStack>
        {room?.description ? <Paragraph color="$colorPress">{room.description}</Paragraph> : null}
        <XStack gap="$2" flexWrap="wrap">
          {room?.announcement ? <YStack px="$3" py="$2" rounded="$4" bg="$backgroundHover"><Text fontSize="$2" fontWeight="700">{room.announcement}</Text></YStack> : null}
          {room?.view_only ? <YStack px="$3" py="$2" rounded="$4" bg="$backgroundHover"><Text fontSize="$2" color="$colorPress">View-only</Text></YStack> : null}
          {room?.is_locked ? <YStack px="$3" py="$2" rounded="$4" bg="$backgroundHover"><Text fontSize="$2" color="$red10" fontWeight="700">Locked</Text></YStack> : null}
        </XStack>
        {roomError ? <Paragraph color="$red10">{roomError}</Paragraph> : null}
        {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      </YStack>
    </YStack>
    {loading ? <YStack flex={1} style={{ alignItems: "center", justifyContent: "center" }}><Spinner /></YStack> :
      <YStack flex={1}><MessageList messages={messages} currentUserId={session?.user.id} pinnedMessageId={room?.pinned_message_id ?? null} hasMore={hasMore} onLoadOlder={loadOlder} profiles={profiles} onReply={m => { setEditTarget(null); setReplyTarget(m); }} onEdit={m => { setReplyTarget(null); setEditTarget(m); }} onDelete={m => remove(m.id)} onReact={(m,r) => react(m.id,r)} onReport={m => openReport({ messageId: m.id, userId: m.sender_id, label: 'message' })} /></YStack>}
    {replyTarget ? <YStack px="$3" pt="$2"><Text fontSize="$2" color="$colorPress">Replying to: {(replyTarget.body ?? '').slice(0, 80)}</Text></YStack> : null}
    {onlineMembers.length ? <XStack px="$3" pb="$2" gap="$2" flexWrap="wrap"><Text fontSize="$2" color="$colorPress">Online:</Text>{onlineMembers.filter(member => member.is_online).slice(0, 8).map(member => <Text key={member.user_id} fontSize="$2">{member.nickname || 'Member'}</Text>)}</XStack> : null}
    {reportTarget ? <YStack mx="$3" mb="$2" gap="$2" p="$3" borderWidth={1} borderColor="$borderColor">
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Text fontSize="$3" fontWeight="800">Report {reportTarget.label}</Text>
        <Text color="$colorPress" onPress={() => setReportTarget(null)}>Cancel</Text>
      </XStack>
      <Text fontSize="$2" color="$colorPress">Your report is visible to Room staff for review.</Text>
      <Input value={reportReason} onChangeText={setReportReason} placeholder="Reason for report" multiline />
      <Button size="$2" disabled={reportBusy} onPress={() => { void submitReport(); }}>
        {reportBusy ? 'Submitting…' : 'Submit report'}
      </Button>
    </YStack> : null}
    <YStack px="$3" pb="$2" gap="$2">
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Text fontSize="$3" fontWeight="800">Members {members.length ? `(${members.length})` : ''}</Text>
        <XStack gap="$2">
          <Button size="$2" chromeless disabled={adminBusy === 'load'} onPress={() => { void loadAdministration(); }}>
            {adminBusy === 'load' ? 'Loading…' : 'Admin'}
          </Button>
          <Button size="$2" chromeless disabled={settingsBusy === 'load'} onPress={() => { void loadSettings(); }}>
            {settingsBusy === 'load' ? 'Loading…' : 'Settings'}
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
        <Text fontSize="$3" fontWeight="800" pt="$2">Reports ({reports.length})</Text>
        {reports.length ? reports.map(report => (
          <YStack key={'report-' + report.id} gap="$2" p="$2" borderWidth={1} borderColor="$borderColor">
            <Text fontWeight="700">{report.status.toUpperCase()}</Text>
            <Text fontSize="$2">Reason: {report.reason}</Text>
            {report.message_id ? <Text fontSize="$2" color="$colorPress">Message: {report.message_id}</Text> : null}
            {report.reported_user_id ? <Text fontSize="$2" color="$colorPress">Member: {report.reported_user_id}</Text> : null}
            <XStack gap="$2" flexWrap="wrap">
              {report.status !== 'resolved' && report.status !== 'dismissed' ? <>
                <Button size="$2" disabled={reportBusy} onPress={() => { void resolveReport(report.id, 'resolved'); }}>Resolve</Button>
                <Button size="$2" disabled={reportBusy} onPress={() => { void resolveReport(report.id, 'dismissed'); }}>Dismiss</Button>
              </> : null}
            </XStack>
          </YStack>
        )) : <Text fontSize="$2" color="$colorPress">No reports found.</Text>}
        {members.map(member => {
          const profile = member.profile;
          return <XStack key={member.user_id} gap="$2" style={{ alignItems: 'center' }}>
            <Text fontWeight="700">{member.nickname || profile?.display_name || profile?.username || 'Member'}</Text>
            <Text fontSize="$2" color="$colorPress">@{profile?.username || 'unknown'} · {member.role}</Text>
          </XStack>;
        })}
        {!members.length ? <Text color="$colorPress">No members found.</Text> : null}
      </YStack> : null}
      {settingsOpen ? <YStack gap="$2" pt="$2" borderWidth={1} borderColor="$borderColor" p="$2">
        <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Text fontSize="$3" fontWeight="800">Room settings</Text>
          <Text color="$colorPress" onPress={() => setSettingsOpen(false)}>Hide</Text>
        </XStack>
        <Text fontSize="$2" color="$colorPress">Room controls are enforced by Supabase authorization.</Text>
        <Text fontWeight="700">Announcement</Text>
        <Input value={announcementDraft} onChangeText={setAnnouncementDraft} placeholder="Optional Room announcement" />
        <XStack gap="$2" flexWrap="wrap">
          <Button size="$2" disabled={settingsBusy !== null} onPress={() => setViewOnlyDraft(value => !value)}>
            {viewOnlyDraft ? 'View-only: ON' : 'View-only: OFF'}
          </Button>
          <Button size="$2" disabled={settingsBusy !== null} onPress={() => setMembersCanInviteDraft(value => !value)}>
            {membersCanInviteDraft ? 'Member invites: ON' : 'Member invites: OFF'}
          </Button>
          <Button size="$2" disabled={settingsBusy !== null} onPress={() => { void saveChatSettings(); }}>
            {settingsBusy === 'chat' ? 'Saving…' : 'Save chat settings'}
          </Button>
        </XStack>
        <XStack gap="$2" flexWrap="wrap">
          <Button size="$2" disabled={settingsBusy !== null} onPress={() => { void toggleRoomLock(); }}>
            {settingsBusy === 'lock' ? 'Updating…' : room?.is_locked ? 'Unlock Room' : 'Lock Room'}
          </Button>
          <Button size="$2" disabled={settingsBusy !== null} onPress={() => { void pinRoomMessage(null); }}>
            {settingsBusy === 'unpin' ? 'Clearing…' : 'Clear pinned message'}
          </Button>
        </XStack>
        <Text fontWeight="700">Pinned message</Text>
        {room?.pinned_message_id ? (
          <YStack gap="$1" p="$2" borderWidth={1} borderColor="$borderColor">
            <Text fontSize="$2" color="$colorPress">Pinned message ID: {room.pinned_message_id}</Text>
            {messages.filter(message => message.id === room.pinned_message_id).map(message => (
              <Text key={message.id}>{message.body}</Text>
            ))}
          </YStack>
        ) : <Text fontSize="$2" color="$colorPress">No message is pinned.</Text>}
        <Text fontSize="$2" color="$colorPress">Choose a recent Room message to pin.</Text>
        {messages.slice(0, 10).map(message => (
          <XStack key={'pin-' + message.id} gap="$2" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Text flex={1} numberOfLines={2}>{message.body}</Text>
            <Button size="$2" disabled={settingsBusy !== null} onPress={() => { void pinRoomMessage(message.id); }}>
              {settingsBusy === 'pin-' + message.id ? 'Pinning…' : room?.pinned_message_id === message.id ? 'Pinned' : 'Pin'}
            </Button>
          </XStack>
        ))}
        <Text fontWeight="700">My Room preferences</Text>
        <XStack gap="$2" flexWrap="wrap">
          <Button size="$2" disabled={settingsBusy !== null} onPress={() => setNotificationsEnabled(value => !value)}>
            {notificationsEnabled ? 'Notifications: ON' : 'Notifications: OFF'}
          </Button>
          <Button size="$2" disabled={settingsBusy !== null} onPress={() => setRoomPinned(value => !value)}>
            {roomPinned ? 'Room pinned: ON' : 'Room pinned: OFF'}
          </Button>
          <Button size="$2" disabled={settingsBusy !== null} onPress={() => { void saveMemberPreferences(); }}>
            {settingsBusy === 'prefs' ? 'Saving…' : 'Save my preferences'}
          </Button>
        </XStack>
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
              {!isSelf ? <Button size="$2" disabled={reportBusy} onPress={() => openReport({ userId: member.user_id, label: label + ' (member)' })}>Report</Button> : null}
            </XStack> : null}
          </YStack>;
        })}
      </YStack> : null}
      {inviteOpen ? <YStack gap="$2" pt="$2">
        <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Text fontSize="$3" fontWeight="800">Invite people</Text>
          <Text color="$colorPress" onPress={() => setInviteOpen(false)}>Hide</Text>
        </XStack>
        <Input value={inviteQuery} onChangeText={setInviteQuery} placeholder="Search by username or name" returnKeyType="search" onSubmitEditing={() => { void loadInviteCandidates(inviteQuery); }} />
        <Button size="$2" disabled={inviteLoading || inviteQuery.trim().length < 2} onPress={() => { void loadInviteCandidates(inviteQuery); }}>
          {inviteLoading ? 'Searching…' : 'Search'}
        </Button>
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
        {!inviteCandidates.length ? <Text color="$colorPress">No matching people available to invite.</Text> : null}
      </YStack> : null}
    </YStack>
    <MessageComposer onSend={submit} onSendSticker={async stickerId => { await sendSticker(stickerId); }} onPickMedia={pickMedia} disabled={sending || loading || mediaBusy || room?.view_only || room?.is_locked} editValue={editTarget?.body ?? null} onEditCancel={() => setEditTarget(null)} onTyping={onTyping} />
  </YStack>;
}

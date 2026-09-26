import { useCallback, useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { H1, Input, ListItem, Menu, Paragraph, Separator, Spinner, Switch, Text, XStack, YGroup, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
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

  const { messages, loading, sending, error, hasMore, loadOlder, send, sendMedia, sendSticker, reply, edit, remove, react, profiles, typingUsers, onTyping } = useChatMessages({ scope: 'room', id });
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
      <YStack gap="$3">
        <XStack items="center" justify="space-between">
          <YStack flex={1} gap="$1">
            <Text fontSize="$2" color="$colorPress" fontWeight="800" letterSpacing={1}>ROOM</Text>
            <H1 fontSize="$7" fontWeight="900">{room?.name ?? 'Room'}</H1>
            <Text fontSize="$2" color="$colorPress">
              {room?.province_code ? `${room.province_code} · ` : ''}{onlineMembers.filter(member => member.is_online).length} online
            </Text>
          </YStack>
          <Text bg="$brandSoft" color="$brandColor" px="$3" py="$2" rounded="$6" fontWeight="800">{onlineMembers.filter(member => member.is_online).length}</Text>
        </XStack>
        {room?.description ? <Paragraph color="$colorPress">{room.description}</Paragraph> : null}
        <XStack gap="$2" flexWrap="wrap">
          {room?.announcement ? <Text bg="$backgroundHover" color="$colorPress" px="$2" py="$1" rounded="$4" fontSize="$2">{room.announcement}</Text> : null}
          {room?.view_only ? <Text bg="$backgroundHover" color="$colorPress" px="$2" py="$1" rounded="$4" fontSize="$2">View-only</Text> : null}
          {room?.is_locked ? <Text bg="$red3" color="$red10" px="$2" py="$1" rounded="$4" fontSize="$2">Locked</Text> : null}
        </XStack>
        {roomError ? <Paragraph color="$red10">{roomError}</Paragraph> : null}
        {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
        <XStack gap="$2" items="center">
          <Menu native={false}>
            <Menu.Trigger asChild action="press">
              <XButton size="$3">Manage</XButton>
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Content>
                <Menu.Item key="members" onSelect={() => { if (membersOpen) setMembersOpen(false); else void loadMembers(); }}>
                  <Menu.ItemTitle>{membersOpen ? 'Hide members' : 'Members'}</Menu.ItemTitle>
                </Menu.Item>
                <Menu.Item key="invite" onSelect={() => { void loadInviteCandidates(); }}>
                  <Menu.ItemTitle>Invite people</Menu.ItemTitle>
                </Menu.Item>
                <Menu.Item key="admin" onSelect={() => { void loadAdministration(); }}>
                  <Menu.ItemTitle>Administration</Menu.ItemTitle>
                </Menu.Item>
                <Menu.Item key="settings" onSelect={() => { void loadSettings(); }}>
                  <Menu.ItemTitle>Room settings</Menu.ItemTitle>
                </Menu.Item>
              </Menu.Content>
            </Menu.Portal>
          </Menu>
        </XStack>
      </YStack>
    </YStack>

    {loading ? <YStack flex={1} items="center" justify="center"><Spinner /></YStack> :
      <YStack flex={1}><MessageList messages={messages} currentUserId={session?.user.id} pinnedMessageId={room?.pinned_message_id ?? null} hasMore={hasMore} onLoadOlder={loadOlder} profiles={profiles} onReply={m => { setEditTarget(null); setReplyTarget(m); }} onEdit={m => { setReplyTarget(null); setEditTarget(m); }} onDelete={m => remove(m.id)} onReact={(m,r) => react(m.id,r)} onReport={m => openReport({ messageId: m.id, userId: m.sender_id, label: 'message' })} /></YStack>}

    {replyTarget ? <YStack px="$3" pt="$2"><Text fontSize="$2" color="$colorPress">Replying to: {(replyTarget.body ?? '').slice(0, 80)}</Text></YStack> : null}
    {Object.keys(typingUsers).length ? <XStack px="$3" pb="$2" items="center"><Text fontSize="$2" color="$colorPress">{Object.keys(typingUsers).map(userId => profiles[userId]?.display_name || profiles[userId]?.username || 'Someone').slice(0, 2).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing…</Text></XStack> : null}
    {onlineMembers.length ? <XStack px="$3" pb="$2" gap="$2" flexWrap="wrap"><Text fontSize="$2" color="$colorPress">Online:</Text>{onlineMembers.filter(member => member.is_online).slice(0, 8).map(member => <Text key={member.user_id} bg="$backgroundHover" color="$colorPress" px="$2" py="$1" rounded="$4" fontSize="$2">{member.nickname || "Member"}</Text>)}</XStack> : null}

    {reportTarget ? <YStack mx="$3" mb="$2" gap="$2" p="$3" borderWidth={1} borderColor="$borderColor">
      <XStack items="center" justify="space-between">
        <Text fontSize="$3" fontWeight="800">Report {reportTarget.label}</Text>
        <XButton size="$2" chromeless onPress={() => setReportTarget(null)}>Cancel</XButton>
      </XStack>
      <Text fontSize="$2" color="$colorPress">Your report is visible to Room staff for review.</Text>
      <Input value={reportReason} onChangeText={setReportReason} placeholder="Reason for report" multiline />
      <XButton size="$2" disabled={reportBusy} onPress={() => { void submitReport(); }}>
        {reportBusy ? 'Submitting…' : 'Submit report'}
      </XButton>
    </YStack> : null}

    {membersOpen ? <YStack px="$3" pb="$2" gap="$2">
      <XStack items="center" justify="space-between">
        <Text fontSize="$3" fontWeight="800">Members {members.length ? `(${members.length})` : ''}</Text>
        <XButton size="$2" chromeless onPress={() => setMembersOpen(false)}>Hide</XButton>
      </XStack>
      <YGroup borderWidth={1} borderColor="$borderColor">
        {members.map(member => {
          const profile = member.profile;
          return <YGroup.Item key={member.user_id}>
            <ListItem
              title={member.nickname || profile?.display_name || profile?.username || 'Member'}
              subTitle={`@${profile?.username || 'unknown'} · ${member.role}`}
              iconAfter={<Text color="$colorPress">›</Text>}
            />
          </YGroup.Item>;
        })}
      </YGroup>
      {!members.length ? <Text color="$colorPress">No members found.</Text> : null}
    </YStack> : null}

    {settingsOpen ? <YStack px="$3" pb="$2" gap="$2">
      <XStack items="center" justify="space-between">
        <Text fontSize="$3" fontWeight="800">Room settings</Text>
        <XButton size="$2" chromeless onPress={() => setSettingsOpen(false)}>Hide</XButton>
      </XStack>
      <Text fontSize="$2" color="$colorPress">Room controls are enforced by Supabase authorization.</Text>
      <Input value={announcementDraft} onChangeText={setAnnouncementDraft} placeholder="Optional Room announcement" />
      <YGroup borderWidth={1} borderColor="$borderColor">
        <YGroup.Item>
          <ListItem title="View-only mode" subTitle={viewOnlyDraft ? 'Members can read but not send messages.' : 'Members can send messages.'}
            iconAfter={<Switch size="$3" checked={viewOnlyDraft} onCheckedChange={setViewOnlyDraft} disabled={settingsBusy !== null} />} />
        </YGroup.Item>
        <Separator />
        <YGroup.Item>
          <ListItem title="Member invites" subTitle={membersCanInviteDraft ? 'Members can invite people.' : 'Only staff can invite people.'}
            iconAfter={<Switch size="$3" checked={membersCanInviteDraft} onCheckedChange={setMembersCanInviteDraft} disabled={settingsBusy !== null} />} />
        </YGroup.Item>
        <Separator />
        <YGroup.Item>
          <ListItem title={room?.is_locked ? 'Unlock Room' : 'Lock Room'} subTitle={room?.is_locked ? 'Allow normal room access.' : 'Restrict room access.'}
            onPress={() => { void toggleRoomLock(); }} disabled={settingsBusy !== null} />
        </YGroup.Item>
        <Separator />
        <YGroup.Item>
          <ListItem title="Save chat settings" subTitle={settingsBusy === 'chat' ? 'Saving…' : 'Apply announcement and room access changes.'}
            onPress={() => { void saveChatSettings(); }} disabled={settingsBusy !== null} />
        </YGroup.Item>
      </YGroup>

      <Text fontSize="$3" fontWeight="800" pt="$2">Pinned message</Text>
      {room?.pinned_message_id ? (
        <ListItem title={messages.find(message => message.id === room.pinned_message_id)?.body || 'Pinned message'} subTitle={`ID: ${room.pinned_message_id}`} iconAfter={<XButton size="$2" chromeless onPress={() => { void pinRoomMessage(null); }}>Clear</XButton>} />
      ) : <Text fontSize="$2" color="$colorPress">No message is pinned.</Text>}
      <YGroup borderWidth={1} borderColor="$borderColor">
        {messages.slice(0, 10).map(message => (
          <YGroup.Item key={'pin-' + message.id}>
            <ListItem title={message.body} subTitle={room?.pinned_message_id === message.id ? 'Currently pinned' : 'Pin this message'}
              onPress={() => { void pinRoomMessage(message.id); }} disabled={settingsBusy !== null} />
          </YGroup.Item>
        ))}
      </YGroup>

      <Text fontSize="$3" fontWeight="800" pt="$2">My Room preferences</Text>
      <YGroup borderWidth={1} borderColor="$borderColor">
        <YGroup.Item>
          <ListItem title="Notifications" subTitle={notificationsEnabled ? 'Room notifications are enabled.' : 'Room notifications are muted.'}
            iconAfter={<Switch size="$3" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} disabled={settingsBusy !== null} />} />
        </YGroup.Item>
        <Separator />
        <YGroup.Item>
          <ListItem title="Pin Room" subTitle={roomPinned ? 'Pinned in your room list.' : 'Not pinned in your room list.'}
            iconAfter={<Switch size="$3" checked={roomPinned} onCheckedChange={setRoomPinned} disabled={settingsBusy !== null} />} />
        </YGroup.Item>
        <Separator />
        <YGroup.Item>
          <ListItem title="Save my preferences" subTitle={settingsBusy === 'prefs' ? 'Saving…' : 'Apply your room preferences.'}
            onPress={() => { void saveMemberPreferences(); }} disabled={settingsBusy !== null} />
        </YGroup.Item>
      </YGroup>
    </YStack> : null}

    {adminOpen ? <YStack px="$3" pb="$2" gap="$2">
      <XStack items="center" justify="space-between">
        <Text fontSize="$3" fontWeight="800">Room administration</Text>
        <XButton size="$2" chromeless onPress={() => setAdminOpen(false)}>Hide</XButton>
      </XStack>
      <Text fontSize="$2" color="$colorPress">Controls are enforced by the Supabase Room authorization rules.</Text>
      <YGroup borderWidth={1} borderColor="$borderColor">
        {members.map(member => {
          const label = member.profile?.display_name || member.profile?.username || member.nickname || 'Member';
          const isSelf = member.user_id === session?.user.id;
          const busy = adminBusy === member.user_id;
          return <YGroup.Item key={`admin-${member.user_id}`}>
            <ListItem title={label}
              subTitle={`@${member.profile?.username || 'unknown'} · ${member.role}${coHostIds.has(member.user_id) ? ' · co-host' : ''}`}
              iconAfter={busy ? <Spinner size="small" /> : <Menu native={false}>
                <Menu.Trigger asChild action="press"><XButton size="$2" chromeless>Actions</XButton></Menu.Trigger>
                <Menu.Portal>
                  <Menu.Content>
                    {!isSelf && member.role !== 'owner' ? <>
                      <Menu.Item key="cohost" onSelect={() => runAdminAction(member, 'cohost')}><Menu.ItemTitle>{coHostIds.has(member.user_id) ? 'Remove co-host' : 'Make co-host'}</Menu.ItemTitle></Menu.Item>
                      <Menu.Item key="mute" onSelect={() => runAdminAction(member, 'mute')}><Menu.ItemTitle>Mute 60m</Menu.ItemTitle></Menu.Item>
                      <Menu.Item key="strike" onSelect={() => runAdminAction(member, 'strike')}><Menu.ItemTitle>Strike 24h</Menu.ItemTitle></Menu.Item>
                      <Menu.Item key="report" onSelect={() => openReport({ userId: member.user_id, label: label + ' (member)' })}><Menu.ItemTitle>Report member</Menu.ItemTitle></Menu.Item>
                      <Menu.Item key="kick" destructive onSelect={() => runAdminAction(member, 'kick')}><Menu.ItemTitle>Kick</Menu.ItemTitle></Menu.Item>
                      <Menu.Item key="ban" destructive onSelect={() => runAdminAction(member, 'ban')}><Menu.ItemTitle>Ban 24h</Menu.ItemTitle></Menu.Item>
                    </> : <Menu.Item key="none" disabled><Menu.ItemTitle>No actions available</Menu.ItemTitle></Menu.Item>}
                  </Menu.Content>
                </Menu.Portal>
              </Menu>} />
          </YGroup.Item>;
        })}
      </YGroup>
    </YStack> : null}

    {inviteOpen ? <YStack px="$3" pb="$2" gap="$2">
      <XStack items="center" justify="space-between">
        <Text fontSize="$3" fontWeight="800">Invite people</Text>
        <XButton size="$2" chromeless onPress={() => setInviteOpen(false)}>Hide</XButton>
      </XStack>
      <Input value={inviteQuery} onChangeText={setInviteQuery} placeholder="Search by username or name" returnKeyType="search" onSubmitEditing={() => { void loadInviteCandidates(inviteQuery); }} />
      <YGroup borderWidth={1} borderColor="$borderColor">
        {inviteCandidates.map(user => (
          <YGroup.Item key={user.user_id}>
            <ListItem title={user.display_name || user.username} subTitle={`@${user.username}`}
              iconAfter={<XButton size="$2" chromeless disabled={inviteBusy === user.user_id} onPress={() => { void inviteUser(user.user_id); }}>{inviteBusy === user.user_id ? 'Sending…' : 'Invite'}</XButton>} />
          </YGroup.Item>
        ))}
      </YGroup>
      {!inviteCandidates.length ? <Text color="$colorPress">No matching people available to invite.</Text> : null}
    </YStack> : null}

    <MessageComposer onSend={submit} onSendSticker={async stickerId => { await sendSticker(stickerId); }} onPickMedia={pickMedia} disabled={sending || loading || mediaBusy || room?.view_only || room?.is_locked} editValue={editTarget?.body ?? null} onEditCancel={() => setEditTarget(null)} onTyping={onTyping} />
  </YStack>;
}

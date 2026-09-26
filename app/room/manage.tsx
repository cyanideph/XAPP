import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { H1, Input, ListItem, Paragraph, Separator, Spinner, Text, XStack, YGroup, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { listRoomMembers, listRoomCoHosts, setRoomCoHost, moderateRoomMember, listRoomReports, updateRoomReport, type RoomMember, type RoomReport } from '../../src/features/chat/backend';
import { acceptRoomCoHostRequest, declineRoomCoHostRequest, listRoomCoHostRequests, listBannedRoomMembers, listMutedRoomMembers, moderateReportedMessage, unbanRoomMember, warnRoomMember, type RoomManagementMember } from '../../src/features/chat/roomManagement';

export default function ManageRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [banned, setBanned] = useState<RoomManagementMember[]>([]);
  const [muted, setMuted] = useState<RoomManagementMember[]>([]);
  const [requests, setRequests] = useState<Array<{ id: string; requester_id: string; status: string; created_at: string; requester?: { username: string; display_name: string | null } | null }>>([]);
  const [reports, setReports] = useState<RoomReport[]>([]);
  const [coHosts, setCoHosts] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [memberRows, bannedRows, mutedRows, requestRows, reportRows, coHostRows] = await Promise.all([
        listRoomMembers(id, 100, 0), listBannedRoomMembers(id), listMutedRoomMembers(id),
        listRoomCoHostRequests(id), listRoomReports(id, null, 50, 0), listRoomCoHosts(id),
      ]);
      setMembers(memberRows); setBanned(bannedRows); setMuted(mutedRows); setRequests(requestRows); setReports(reportRows);
      setCoHosts(new Set(coHostRows.map(row => row.user_id)));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load Room administration.'); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const run = async (key: string, action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(key); setError(null);
    try { await action(); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Room action failed.'); } finally { setBusy(null); }
  };

  const visibleMembers = members.filter(member => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return [member.nickname, member.profile?.username, member.profile?.display_name].some(value => value?.toLowerCase().includes(q));
  });

  return <YStack flex={1} p="$4" pt="$7" gap="$4" bg="$background">
    <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <YStack><Text fontSize="$3" color="$colorPress" fontWeight="800">ROOM ADMIN</Text><H1 fontSize="$8">Moderation</H1></YStack>
      <XButton chromeless onPress={() => router.back()}>Done</XButton>
    </XStack>
    {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
    <Input value={filter} onChangeText={setFilter} placeholder="Find a member" />

    <YStack gap="$2">
      <Text fontSize="$6" fontWeight="800">Co-host requests ({requests.filter(r => r.status === 'pending').length})</Text>
      <YGroup borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">{requests.filter(r => r.status === 'pending').map(request => <YGroup.Item key={request.id}><ListItem title={request.requester?.display_name || request.requester?.username || `User ${request.requester_id.slice(0, 8)}`} subTitle="Pending co-host request" iconAfter={<XStack gap="$2">
        <Text flex={1}>{request.requester?.display_name || request.requester?.username || `User ${request.requester_id.slice(0, 8)}`}</Text>
        <XButton size="$2" disabled={busy !== null} onPress={() => { void run('accept-' + request.id, () => acceptRoomCoHostRequest(request.id)); }}>Accept</XButton>
        <XButton size="$2" chromeless disabled={busy !== null} onPress={() => { void run('decline-' + request.id, () => declineRoomCoHostRequest(request.id)); }}>Decline</XButton>
      </XStack>)}
      </YGroup>}{!requests.some(r => r.status === 'pending') ? <Text color="$colorPress">No pending co-host requests.</Text> : null}
    </YStack>

    <YStack gap="$2">
      <Text fontSize="$6" fontWeight="800">Reports ({reports.filter(r => r.status === 'open' || r.status === 'reviewing').length})</Text>
      {reports.map(report => <YStack key={report.id} gap="$2" p="$3" borderWidth={1} borderColor="$borderColor">
        <Text fontWeight="800">{report.status.toUpperCase()}</Text><Text>{report.reason}</Text>
        {report.message_id ? <Text fontSize="$2" color="$colorPress">Message: {report.message_id}</Text> : null}
        <XStack gap="$2" flexWrap="wrap">
          {report.message_id && report.status !== 'resolved' && report.status !== 'dismissed' ? <XButton size="$2" disabled={busy !== null} onPress={() => { void run('delete-report-' + report.id, async () => { await moderateReportedMessage(report.message_id!); await updateRoomReport(report.id, 'resolved', 'Message removed after report review'); }); }}>Remove message</XButton> : null}
          {report.status !== 'resolved' && report.status !== 'dismissed' ? <XButton size="$2" disabled={busy !== null} onPress={() => { void run('resolve-' + report.id, () => updateRoomReport(report.id, 'resolved', 'Reviewed by Room staff')); }}>Resolve</XButton> : null}
          {report.status !== 'resolved' && report.status !== 'dismissed' ? <XButton size="$2" chromeless disabled={busy !== null} onPress={() => { void run('dismiss-' + report.id, () => updateRoomReport(report.id, 'dismissed', 'Dismissed by Room staff')); }}>Dismiss</XButton> : null}
        </XStack>
      </YStack>)}
      {!reports.length ? <Text color="$colorPress">No reports.</Text> : null}
    </YStack>

    <YStack gap="$2">
      <Text fontSize="$6" fontWeight="800">Banned members ({banned.length})</Text>
      {banned.map(member => <XStack key={member.user_id} gap="$2" style={{ alignItems: 'center', justifyContent: 'space-between' }}><Text flex={1}>{member.nickname || member.user_id}</Text><XButton size="$2" disabled={busy !== null} onPress={() => { void run('unban-' + member.user_id, () => unbanRoomMember(id, member.user_id)); }}>Unban</XButton></XStack>)}
      {!banned.length ? <Text color="$colorPress">No banned members.</Text> : null}
    </YStack>

    <YStack gap="$2">
      <Text fontSize="$6" fontWeight="800">Muted members ({muted.length})</Text>
      {muted.map(member => <XStack key={member.user_id} gap="$2" style={{ alignItems: 'center', justifyContent: 'space-between' }}><Text flex={1}>{member.nickname || member.user_id}</Text><XButton size="$2" disabled={busy !== null} onPress={() => { void run('unmute-' + member.user_id, () => moderateRoomMember(id, member.user_id, 'mute', 0, 'Unmuted by Room staff')); }}>Unmute</XButton></XStack>)}
      {!muted.length ? <Text color="$colorPress">No muted members.</Text> : null}
    </YStack>

    <YStack gap="$2">
      <Text fontSize="$6" fontWeight="800">Members ({visibleMembers.length})</Text>
      {visibleMembers.map(member => { const label = member.nickname || member.profile?.display_name || member.profile?.username || member.user_id; const coHost = coHosts.has(member.user_id); return <YStack key={member.user_id} gap="$2" p="$2" borderWidth={1} borderColor="$borderColor"><XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}><YStack flex={1}><Text fontWeight="800">{label}</Text><Text fontSize="$2" color="$colorPress">@{member.profile?.username || 'unknown'} · {member.role}{coHost ? ' · co-host' : ''}</Text></YStack></XStack><XStack gap="$2" flexWrap="wrap"><XButton size="$2" disabled={busy !== null || member.role === 'owner'} onPress={() => { void run('cohost-' + member.user_id, async () => { const enabled = !coHost; await setRoomCoHost(id, member.user_id, enabled); }); }}>{coHost ? 'Remove co-host' : 'Make co-host'}</XButton><XButton size="$2" disabled={busy !== null || member.role === 'owner'} onPress={() => { void run('warn-' + member.user_id, () => warnRoomMember(id, member.user_id)); }}>Warn</XButton><XButton size="$2" disabled={busy !== null || member.role === 'owner'} onPress={() => { void run('mute-' + member.user_id, () => moderateRoomMember(id, member.user_id, 'mute', 60, 'Room moderation')) }}>Mute</XButton><XButton size="$2" disabled={busy !== null || member.role === 'owner'} onPress={() => { void run('ban-' + member.user_id, () => moderateRoomMember(id, member.user_id, 'ban', 1440, 'Room moderation')) }}>Ban</XButton></XStack></YStack>; })}
    </YStack>
    {busy ? <XStack gap="$2" style={{ alignItems: 'center' }}><Spinner size="small" /><Text>Applying Room action…</Text></XStack> : null}
  </YStack>;
}

import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { H1, Input, ListItem, Menu, Paragraph, Spinner, Text, XStack, YGroup, YStack } from 'tamagui';
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

  return (
    <YStack flex={1} p="$4" pt="$7" gap="$4" bg="$background">
      <XStack items="center" justify="space-between">
        <YStack><Text fontSize="$3" color="$colorPress" fontWeight="800">ROOM ADMIN</Text><H1 fontSize="$8">Moderation</H1></YStack>
        <XButton chromeless onPress={() => router.back()}>Done</XButton>
      </XStack>
      {error ? <Paragraph color="$red10">{error}</Paragraph> : null}
      <Input value={filter} onChangeText={setFilter} placeholder="Find a member" />

      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="800">Co-host requests ({requests.filter(r => r.status === 'pending').length})</Text>
        {requests.filter(r => r.status === 'pending').length ? (
          <YGroup borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
            {requests.filter(r => r.status === 'pending').map(request => (
              <YGroup.Item key={request.id}>
                <ListItem
                  title={request.requester?.display_name || request.requester?.username || `User ${request.requester_id.slice(0, 8)}`}
                  subTitle="Pending co-host request"
                  iconAfter={<XStack gap="$2">
                    <XButton size="$2" disabled={busy !== null} onPress={() => { void run('accept-' + request.id, () => acceptRoomCoHostRequest(request.id)); }}>Accept</XButton>
                    <XButton size="$2" chromeless disabled={busy !== null} onPress={() => { void run('decline-' + request.id, () => declineRoomCoHostRequest(request.id)); }}>Decline</XButton>
                  </XStack>}
                />
              </YGroup.Item>
            ))}
          </YGroup>
        ) : <Text color="$colorPress">No pending co-host requests.</Text>}
      </YStack>

      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="800">Reports ({reports.filter(r => r.status === 'open' || r.status === 'reviewing').length})</Text>
        {reports.length ? (
          <YGroup borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
            {reports.map(report => (
              <YGroup.Item key={report.id}>
                <ListItem
                  title={report.reason}
                  subTitle={`${report.status.toUpperCase()}${report.message_id ? ` · Message ${report.message_id.slice(0, 8)}` : ''}`}
                  iconAfter={
                    <Menu native={false}>
                      <Menu.Trigger asChild action="press">
                        <XButton size="$2" chromeless disabled={busy !== null}>Actions</XButton>
                      </Menu.Trigger>
                      <Menu.Portal zIndex={100}>
                        <Menu.Content>
                          {report.message_id && report.status !== 'resolved' && report.status !== 'dismissed' ? (
                            <Menu.Item key="remove" destructive disabled={busy !== null} onSelect={() => { void run('delete-report-' + report.id, async () => { await moderateReportedMessage(report.message_id!); await updateRoomReport(report.id, 'resolved', 'Message removed after report review'); }); }}>
                              <Menu.ItemTitle>Remove message</Menu.ItemTitle>
                            </Menu.Item>
                          ) : null}
                          {report.status !== 'resolved' && report.status !== 'dismissed' ? (
                            <Menu.Item key="resolve" disabled={busy !== null} onSelect={() => { void run('resolve-' + report.id, () => updateRoomReport(report.id, 'resolved', 'Reviewed by Room staff')); }}>
                              <Menu.ItemTitle>Resolve</Menu.ItemTitle>
                            </Menu.Item>
                          ) : null}
                          {report.status !== 'resolved' && report.status !== 'dismissed' ? (
                            <Menu.Item key="dismiss" disabled={busy !== null} onSelect={() => { void run('dismiss-' + report.id, () => updateRoomReport(report.id, 'dismissed', 'Dismissed by Room staff')); }}>
                              <Menu.ItemTitle>Dismiss</Menu.ItemTitle>
                            </Menu.Item>
                          ) : null}
                        </Menu.Content>
                      </Menu.Portal>
                    </Menu>
                  }
                />
              </YGroup.Item>
            ))}
          </YGroup>
        ) : <Text color="$colorPress">No reports.</Text>}
      </YStack>

      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="800">Banned members ({banned.length})</Text>
        {banned.length ? (
          <YGroup borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
            {banned.map(member => (
              <YGroup.Item key={member.user_id}>
                <ListItem title={member.nickname || member.user_id} subTitle="Banned member" iconAfter={
                  <XButton size="$2" chromeless disabled={busy !== null} onPress={() => { void run('unban-' + member.user_id, () => unbanRoomMember(id, member.user_id)); }}>Unban</XButton>
                } />
              </YGroup.Item>
            ))}
          </YGroup>
        ) : <Text color="$colorPress">No banned members.</Text>}
      </YStack>

      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="800">Muted members ({muted.length})</Text>
        {muted.length ? (
          <YGroup borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
            {muted.map(member => (
              <YGroup.Item key={member.user_id}>
                <ListItem title={member.nickname || member.user_id} subTitle="Muted member" iconAfter={
                  <XButton size="$2" chromeless disabled={busy !== null} onPress={() => { void run('unmute-' + member.user_id, () => moderateRoomMember(id, member.user_id, 'mute', 0, 'Unmuted by Room staff')); }}>Unmute</XButton>
                } />
              </YGroup.Item>
            ))}
          </YGroup>
        ) : <Text color="$colorPress">No muted members.</Text>}
      </YStack>

      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="800">Members ({visibleMembers.length})</Text>
        <YGroup borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
          {visibleMembers.map(member => {
            const label = member.nickname || member.profile?.display_name || member.profile?.username || member.user_id;
            const coHost = coHosts.has(member.user_id);
            const memberBusy = busy !== null;
            return (
              <YGroup.Item key={member.user_id}>
                <ListItem
                  title={label}
                  subTitle={`@${member.profile?.username || 'unknown'} · ${member.role}${coHost ? ' · co-host' : ''}`}
                  iconAfter={
                    member.role === 'owner' ? undefined : (
                      <Menu native={false}>
                        <Menu.Trigger asChild action="press">
                          <XButton size="$2" chromeless disabled={memberBusy}>Actions</XButton>
                        </Menu.Trigger>
                        <Menu.Portal zIndex={100}>
                          <Menu.Content>
                            <Menu.Item key="cohost" disabled={memberBusy} onSelect={() => { void run('cohost-' + member.user_id, async () => { await setRoomCoHost(id, member.user_id, !coHost); }); }}>
                              <Menu.ItemTitle>{coHost ? 'Remove co-host' : 'Make co-host'}</Menu.ItemTitle>
                            </Menu.Item>
                            <Menu.Item key="warn" disabled={memberBusy} onSelect={() => { void run('warn-' + member.user_id, () => warnRoomMember(id, member.user_id)); }}>
                              <Menu.ItemTitle>Warn</Menu.ItemTitle>
                            </Menu.Item>
                            <Menu.Item key="mute" disabled={memberBusy} onSelect={() => { void run('mute-' + member.user_id, () => moderateRoomMember(id, member.user_id, 'mute', 60, 'Room moderation')); }}>
                              <Menu.ItemTitle>Mute 60m</Menu.ItemTitle>
                            </Menu.Item>
                            <Menu.Item key="ban" destructive disabled={memberBusy} onSelect={() => { void run('ban-' + member.user_id, () => moderateRoomMember(id, member.user_id, 'ban', 1440, 'Room moderation')); }}>
                              <Menu.ItemTitle>Ban 24h</Menu.ItemTitle>
                            </Menu.Item>
                          </Menu.Content>
                        </Menu.Portal>
                      </Menu>
                    )
                  }
                />
              </YGroup.Item>
            );
          })}
        </YGroup>
      </YStack>

      {busy ? <XStack gap="$2" items="center"><Spinner size="small" /><Text>Applying Room action…</Text></XStack> : null}
    </YStack>
  );
}

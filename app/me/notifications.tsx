import { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { H1, ListItem, Separator, Spinner, Text, YGroup, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { XIcon } from '../../src/components/XIcon';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../../src/lib/backend';

export default function Notifications() {
  const [n, setN] = useState<any[]>([]);
  const [l, setL] = useState(true);

  const load = useCallback(async () => {
    setL(true);
    try { setN((await listNotifications(50)).items); }
    finally { setL(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 40 }}>
      <YStack gap="$4" maxW={960} self="center" width="100%">
        <H1>Notifications.</H1>
        <XButton chromeless icon={<XIcon name="check" size={18} color="#8B85FF" />} onPress={() => void markAllNotificationsRead().then(load)}>Mark all read</XButton>
        {l ? <Spinner color="$brandBackground" /> : n.length ? (
          <YGroup borderWidth={1} borderColor="$borderColor" rounded="$4" overflow="hidden">
            {n.map((x, index) => (
              <YGroup.Item key={x.id}>
                <ListItem
                  title={x.type}
                  subTitle={String(x.payload?.message ?? x.payload?.text ?? 'You have a new notification.')}
                  iconAfter={<XIcon name={x.read_at ? "check" : "circleDot"} size={18} color={x.read_at ? "#8B85FF" : "#A78BFA"} />}
                  onPress={() => { if (!x.read_at) void markNotificationRead(x.id).then(load); }}
                />
                {index < n.length - 1 ? <Separator /> : null}
              </YGroup.Item>
            ))}
          </YGroup>
        ) : (
          <ListItem title="You're all caught up" subTitle="New notifications will appear here." />
        )}
        <XButton chromeless icon={<XIcon name="chevronLeft" size={18} color="#8B85FF" />} onPress={() => router.back()}>Back</XButton>
      </YStack>
    </ScrollView>
  );
}
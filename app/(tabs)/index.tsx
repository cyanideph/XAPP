import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { H1, Input, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { BentoCard } from '../../src/components/BentoCard';
import {
  checkIn,
  createContent,
  listContentCategories,
  listContentFeed,
  listFeaturedProfiles,
  listOnlineUsers,
  listPublicChats,
  listPublicRooms,
  toggleContentReaction,
  toggleContentSave,
} from '../../src/lib/backend';

type OnlineUser = { user_id: string; username: string; display_name?: string | null; status_text?: string | null };
type PublicChat = { id: string; name: string; description?: string | null; province_code?: string | null; member_count?: number | string | null; online_count?: number | string | null };
type Room = { id: string; name: string; description?: string | null; province_code?: string | null; kind?: string };
type Content = Awaited<ReturnType<typeof listContentFeed>>['items'][number];
type Featured = Awaited<ReturnType<typeof listFeaturedProfiles>>[number];

export default function HomeScreen() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [chats, setChats] = useState<PublicChat[]>([]);
  const [feed, setFeed] = useState<Content[]>([]);
  const [featured, setFeatured] = useState<Featured[]>([]);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof listContentCategories>>>([]);
  const [postBody, setPostBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkin, setCheckin] = useState<{ streak: number; points: number; already_checked_in: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [online, publicChats, publicRooms, content, people, contentCategories] = await Promise.all([
        listOnlineUsers(6, 0),
        listPublicChats(6, 0),
        listPublicRooms(6, 0),
        listContentFeed(10),
        listFeaturedProfiles(6, 0),
        listContentCategories(),
      ]);
      setOnlineUsers(Array.isArray(online) ? online as OnlineUser[] : []);
      setChats(Array.isArray(publicChats) ? publicChats as PublicChat[] : []);
      setRooms(Array.isArray(publicRooms) ? publicRooms as Room[] : []);
      setFeed(content.items);
      setFeatured(people);
      setCategories(contentCategories);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load Home data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function publish() {
    const body = postBody.trim();
    if (!body || posting) return;
    setPosting(true);
    setError(null);
    try {
      await createContent('post', null, body);
      setPostBody('');
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to publish.');
    } finally {
      setPosting(false);
    }
  }

  async function doCheckIn() {
    if (checkingIn) return;
    setCheckingIn(true);
    setError(null);
    try {
      const result = await checkIn();
      setCheckin(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to check in.');
    } finally {
      setCheckingIn(false);
    }
  }

  async function react(contentId: string) {
    try { await toggleContentReaction(contentId, 'like'); await load(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to react.'); }
  }

  async function save(contentId: string) {
    try { await toggleContentSave(contentId); await load(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to save.'); }
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void load(true); }} />}
      contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 40 }}
    >
      <YStack gap="$5">
        <YStack gap="$2">
          <Text fontSize="$3" color="$colorPress" fontWeight="800" letterSpacing={1}>X-APP</Text>
          <H1 fontSize="$10" fontWeight="900">Your space.</H1>
          <Paragraph color="$colorPress">People, rooms, conversations and community posts at a glance.</Paragraph>
        </YStack>

        {error ? <BentoCard title="Unable to complete Home action" description={error} onPress={() => { void load(); }} /> : null}

        <BentoCard title="Check in" description={checkin ? (checkin.already_checked_in ? `Already checked in · ${checkin.streak} day streak · +${checkin.points} points` : `Checked in · ${checkin.streak} day streak · +${checkin.points} points`) : 'Keep your community streak going.'}>
          <XButton onPress={() => { void doCheckIn(); }} disabled={checkingIn || Boolean(checkin?.already_checked_in)}>
            {checkingIn ? 'Checking in…' : checkin?.already_checked_in ? 'Done today' : 'Check in'}
          </XButton>
        </BentoCard>

        <BentoCard title="Share something" description="Post a short update to the community.">
          <YStack gap="$2">
            <Input value={postBody} onChangeText={setPostBody} placeholder="What’s happening?" multiline />
            <XButton onPress={() => { void publish(); }} disabled={posting || !postBody.trim()}>
              {posting ? 'Posting…' : 'Post'}
            </XButton>
          </YStack>
        </BentoCard>

        {!loading && categories.length ? (
          <YStack gap="$2">
            <Text fontSize="$6" fontWeight="800">Topics</Text>
            <XStack gap="$2" flexWrap="wrap">
              {categories.slice(0, 8).map(category => <XButton key={category.id} size="$2" chromeless>{category.name}</XButton>)}
            </XStack>
          </YStack>
        ) : null}

        <YStack gap="$3">
          <XStack items="center" justify="space-between">
            <Text fontSize="$6" fontWeight="800">Community feed</Text>
            <XButton size="$2" chromeless onPress={() => router.push('/(tabs)/discover')}>Discover</XButton>
          </XStack>
          {loading ? <Spinner /> : feed.length ? feed.map(item => (
            <BentoCard
              key={item.id}
              title={item.author?.display_name || item.author?.username || 'Community member'}
              description={item.body || item.title || 'Community post'}
              value={item.kind}
            >
              <XStack gap="$2">
                <XButton size="$2" onPress={() => { void react(item.id); }}>Like</XButton>
                <XButton size="$2" chromeless onPress={() => { void save(item.id); }}>Save</XButton>
              </XStack>
            </BentoCard>
          )) : <BentoCard title="No community posts yet" description="Be the first to share something." />}
        </YStack>

        {!loading && featured.length ? (
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="800">Featured people</Text>
            {featured.map(item => <BentoCard key={item.profile.id} title={item.profile.display_name || item.profile.username} description={item.profile.status_text || item.profile.bio || `@${item.profile.username}`} />)}
          </YStack>
        ) : null}

        <XStack gap="$3">
          <BentoCard title="People" flex={1}>{loading ? <Spinner /> : <Text fontSize="$9" fontWeight="800">{onlineUsers.length}</Text>}</BentoCard>
          <BentoCard title="Rooms" flex={1}>{loading ? <Spinner /> : <Text fontSize="$9" fontWeight="800">{rooms.length}</Text>}</BentoCard>
        </XStack>

        <YStack gap="$3">
          <XStack items="center" justify="space-between">
            <Text fontSize="$6" fontWeight="800">Recently active</Text>
            <XButton size="$2" chromeless onPress={() => router.push('/(tabs)/discover')}>See all</XButton>
          </XStack>
          {loading ? <Spinner /> : onlineUsers.length ? onlineUsers.map(user => (
            <BentoCard key={user.user_id} title={user.display_name || user.username} description={user.status_text ? `@${user.username} · ${user.status_text}` : `@${user.username}`} />
          )) : <BentoCard title="No one else is recently active" description="Refresh to check the community again." />}
        </YStack>

        <YStack gap="$3">
          <XStack items="center" justify="space-between">
            <Text fontSize="$6" fontWeight="800">Public rooms</Text>
            <XButton size="$2" chromeless onPress={() => router.push('/(tabs)/discover')}>See all</XButton>
          </XStack>
          {loading ? <Spinner /> : rooms.length ? rooms.map(room => (
            <BentoCard key={room.id} title={room.name} description={room.province_code ? `${room.province_code} · ${room.description ?? 'Open realtime room'}` : (room.description ?? 'Open realtime room')} onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })} />
          )) : <BentoCard title="No public rooms yet" description="Refresh to check the community again." />}
        </YStack>

        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="800">Public chats</Text>
          {loading ? <Spinner /> : chats.length ? chats.map(chat => (
            <BentoCard key={chat.id} title={chat.name} description={chat.province_code ? `${chat.province_code} · ${chat.description ?? 'Public conversation'}` : (chat.description ?? 'Public conversation')} value={`${chat.member_count ?? 0} members · ${chat.online_count ?? 0} online`} onPress={() => router.push({ pathname: '/room/[id]', params: { id: chat.id } })} />
          )) : <BentoCard title="No public chats yet" description="Discover more community spaces." />}
        </YStack>

        <XStack gap="$3">
          <BentoCard title="Discover" description="Find people and community spaces." onPress={() => router.push('/(tabs)/discover')} />
          <BentoCard title="Chats" description="Open conversations and realtime rooms." onPress={() => router.push('/(tabs)/chats')} />
        </XStack>
      </YStack>
    </ScrollView>
  );
}

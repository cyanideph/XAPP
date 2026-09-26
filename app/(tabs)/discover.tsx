import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { H1, Input, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { BentoCard } from '../../src/components/BentoCard';
import {
  listContentCategories, listCategoryContent, listOnlineUsers, listPublicChats, listPublicRooms,
  searchContent, searchProfiles, searchRooms, searchPublicChats, type ContentCategory, type ContentItem, type ProfileSearchResult, type Room, type PublicChatSearchResult,
} from '../../src/lib/backend';

export default function DiscoverScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContentItem[]>([]);
  const [peopleResults, setPeopleResults] = useState<ProfileSearchResult[]>([]);
  const [roomResults, setRoomResults] = useState<Room[]>([]);
  const [chatResults, setChatResults] = useState<PublicChatSearchResult[]>([]);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ users: 0, rooms: 0, chats: 0 });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [users, roomRows, chats, categoryRows] = await Promise.all([
        listOnlineUsers(50, 0),
        listPublicRooms(20, 0),
        listPublicChats(50, 0),
        listContentCategories(),
      ]);
      const nextRooms = Array.isArray(roomRows) ? roomRows as Room[] : [];
      setRooms(nextRooms);
      setCategories(categoryRows);
      setCounts({
        users: Array.isArray(users) ? users.length : 0,
        rooms: nextRooms.length,
        chats: Array.isArray(chats) ? chats.length : 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load Discover.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function runSearch() {
    if (query.trim().length < 2) return;
    setSearching(true);
    setError('');
    try {
      const q = query.trim();
      const [content, people, roomMatches, chats] = await Promise.all([
        searchContent(q, 20, 0),
        searchProfiles(q, 20),
        searchRooms(q, 20),
        searchPublicChats(q, 20),
      ]);
      setResults(content.items);
      setPeopleResults(people);
      setRoomResults(roomMatches);
      setChatResults(chats);
      setSelectedCategory(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setSearching(false);
    }
  }

  async function selectCategory(categoryId: string | null) {
    setSelectedCategory(categoryId);
    setError('');
    if (!categoryId) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults((await listCategoryContent(categoryId, 20)).items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load category.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { void load(); }} />}
      contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: 40 }}
    >
      <YStack gap="$5">
        <YStack gap="$2">
          <Text fontSize="$3" color="$colorPress" fontWeight="800" letterSpacing={1}>DISCOVER</Text>
          <H1 fontSize="$10" fontWeight="900">Find your people.</H1>
          <Paragraph color="$colorPress">Explore rooms, conversations, people and community content.</Paragraph>
        </YStack>

        <BentoCard title="Search X-App" description="Search people, rooms, public chats and posts from one place.">
          <YStack gap="$2">
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search community"
              onSubmitEditing={() => { void runSearch(); }}
              returnKeyType="search"
            />
            <XButton disabled={query.trim().length < 2 || searching} onPress={() => { void runSearch(); }}>
              {searching ? 'Searching…' : 'Search'}
            </XButton>
          </YStack>
        </BentoCard>

        <XStack gap="$3">
          <BentoCard title="People" flex={1} value={String(counts.users)} description="recently active" />
          <BentoCard title="Rooms" flex={1} value={String(counts.rooms)} description="public spaces" />
        </XStack>
        <BentoCard title="Public chats" value={String(counts.chats)} description="community conversations" />

        {categories.length ? (
          <YStack gap="$3">
            <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Text fontSize="$6" fontWeight="800">Topics</Text>
              <XButton size="$2" chromeless onPress={() => { void selectCategory(null); }}>Clear</XButton>
            </XStack>
            <XStack gap="$2" flexWrap="wrap">
              <XButton size="$3" chromeless={!selectedCategory} onPress={() => { void selectCategory(null); }}>All</XButton>
              {categories.map(category => (
                <XButton
                  key={category.id}
                  size="$3"
                  chromeless={selectedCategory !== category.id}
                  onPress={() => { void selectCategory(category.id); }}
                >
                  {category.name}
                </XButton>
              ))}
            </XStack>
          </YStack>
        ) : null}

        <XStack gap="$2" flexWrap="wrap">
          <XButton onPress={() => router.push('/room/create')}>Create room</XButton>
          <XButton chromeless onPress={() => router.push('/room/invites')}>Invitations</XButton>
        </XStack>

        {error ? <BentoCard title="Something needs attention" description={error} onPress={() => { void load(); }} /> : null}

        {loading ? <Spinner /> : (
          <>
            {(peopleResults.length || roomResults.length || chatResults.length) ? (
              <YStack gap="$3">
                <Text fontSize="$6" fontWeight="800">Search results</Text>

                {peopleResults.map(person => (
                  <BentoCard
                    key={person.id}
                    title={person.display_name || '@' + person.username}
                    description={'@' + person.username}
                    onPress={() => router.push({ pathname: '/me/view-profile', params: { id: person.id } })}
                  />
                ))}

                {roomResults.map(room => (
                  <BentoCard
                    key={room.id}
                    title={room.name}
                    description={room.province_code ? room.province_code + ' · ' + (room.description ?? 'Open community room') : (room.description ?? 'Open community room')}
                    onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}
                  />
                ))}

                {chatResults.map(chat => (
                  <BentoCard
                    key={chat.id}
                    title={String(chat.name ?? chat.title ?? 'Public chat')}
                    description="Public conversation"
                    onPress={() => router.push('/(tabs)/chats')}
                  />
                ))}
              </YStack>
            ) : null}

            {results.length ? (
              <YStack gap="$3">
                <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text fontSize="$6" fontWeight="800">{selectedCategory ? 'Topic posts' : 'Content results'}</Text>
                  <Text fontSize="$3" color="$colorPress">{results.length} loaded</Text>
                </XStack>
                {results.map(item => (
                  <BentoCard
                    key={item.id}
                    title={item.title || item.kind}
                    description={'@' + (item.author?.username || 'user') + ' · ' + item.kind + (item.body ? ' · ' + item.body : '')}
                    onPress={() => router.push({ pathname: '/content/[id]', params: { id: item.id } })}
                  />
                ))}
              </YStack>
            ) : null}

            <YStack gap="$3">
              <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Text fontSize="$6" fontWeight="800">Public rooms</Text>
                <Text fontSize="$3" color="$colorPress">{rooms.length} loaded</Text>
              </XStack>

              {rooms.length ? rooms.map((room, index) => (
                <BentoCard
                  key={room.id}
                  title={room.name}
                  description={room.province_code ? room.province_code + ' · ' + (room.description ?? 'Open realtime room') : (room.description ?? 'Open realtime room')}
                  delay={index * 35}
                  onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}
                >
                  <XStack gap="$2" flexWrap="wrap">
                    <XButton size="$2" onPress={() => router.push({ pathname: '/room/[id]', params: { id: room.id } })}>Open</XButton>
                    <XButton size="$2" chromeless onPress={() => router.push({ pathname: '/room/manage', params: { id: room.id } })}>Manage</XButton>
                    <XButton size="$2" chromeless onPress={() => router.push({ pathname: '/room/request-cohost', params: { id: room.id } })}>Co-host</XButton>
                  </XStack>
                </BentoCard>
              )) : (
                <BentoCard
                  title="No public rooms yet"
                  description="Create the first community room or refresh to check again."
                  onPress={() => { void load(); }}
                />
              )}
            </YStack>
          </>
        )}
      </YStack>
    </ScrollView>
  );
}

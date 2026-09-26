import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Card, H1, Input, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui';
import {
  createContentCategory, getEngagementLeaderboard, hasContentAdminAccess, listContentCategories, listHiddenContent,
  searchContent, searchProfiles, setContentFeatured, setContentVisibility, setFeaturedProfile,
  type ContentCategory, type ContentItem, type ProfileSearchResult,
} from '../../src/lib/backend';

export default function ContentAdminScreen() {
  const [categories,setCategories]=useState<ContentCategory[]>([]), [hidden,setHidden]=useState<ContentItem[]>([]), [leaders,setLeaders]=useState<unknown[]>([]);
  const [profileQuery,setProfileQuery]=useState(''), [profiles,setProfiles]=useState<ProfileSearchResult[]>([]), [contentQuery,setContentQuery]=useState(''), [content,setContent]=useState<ContentItem[]>([]);
  const [name,setName]=useState(''), [slug,setSlug]=useState(''), [kind,setKind]=useState('post'), [busy,setBusy]=useState(true), [authorized,setAuthorized]=useState(false), [error,setError]=useState('');
  async function load(){setBusy(true);setError('');try{const access=await hasContentAdminAccess();setAuthorized(access);if(!access){setError('Administrator access required.');return;}const [a,b,c]=await Promise.all([listContentCategories(),listHiddenContent(50,0),getEngagementLeaderboard('all',25,0)]);setCategories(a);setHidden(b);setLeaders(Array.isArray(c)?c:[]);}catch(e){setError(e instanceof Error?e.message:'Unable to load administration.')}finally{setBusy(false)}}
  useEffect(()=>{void load()},[]);
  return <ScrollView contentContainerStyle={{padding:20,paddingTop:64,paddingBottom:40}}><YStack gap="$5">
    <YStack gap="$2"><H1>Content Administration</H1><Paragraph>Categories, visibility, featured profiles and engagement.</Paragraph>{error?<Paragraph color="$red10">{error}</Paragraph>:null}{busy?<Spinner/>:null}</YStack>
    {!authorized ? <Card p="$4"><Paragraph color="$red10">Administrator access is required for this surface.</Paragraph></Card> : <><Card p="$4"><YStack gap="$3"><Text fontSize="$6" fontWeight="800">Categories</Text><Input placeholder="Name" value={name} onChangeText={setName}/><Input placeholder="Slug" value={slug} onChangeText={setSlug}/><Input placeholder="Kind" value={kind} onChangeText={setKind}/><Button onPress={async()=>{if(!name.trim()||!slug.trim())return;await createContentCategory(name,slug,null,kind);setName('');setSlug('');await load()}}>Create</Button>{categories.map(c=><Text key={c.id}>{c.name} · {c.kind}</Text>)}</YStack></Card>
    <Card p="$4"><YStack gap="$3"><Text fontSize="$6" fontWeight="800">Hidden content</Text>{hidden.map(i=><XStack key={i.id} style={{alignItems:'center'}}><Text flex={1}>{i.title||i.body?.slice(0,60)||i.kind}</Text><Button size="$3" onPress={async()=>{await setContentVisibility(i.id,false);await load()}}>Restore</Button></XStack>)}{!hidden.length?<Text>No hidden content.</Text>:null}</YStack></Card>
    <Card p="$4"><YStack gap="$3"><Text fontSize="$6" fontWeight="800">Content moderation</Text><Input placeholder="Search content" value={contentQuery} onChangeText={setContentQuery}/><Button onPress={async()=>setContent((await searchContent(contentQuery,20,0)).items)}>Find</Button>{content.map(i=><XStack key={i.id} gap="$2" style={{alignItems:'center'}}><Text flex={1}>{i.title||i.kind}</Text><Button size="$3" onPress={async()=>{await setContentVisibility(i.id,true);await load()}}>Hide</Button><Button size="$3" onPress={()=>void setContentFeatured(i.id,true)}>Feature</Button></XStack>)}</YStack></Card>
    <Card p="$4"><YStack gap="$3"><Text fontSize="$6" fontWeight="800">Featured profiles</Text><Input placeholder="Search profiles" value={profileQuery} onChangeText={setProfileQuery}/><Button onPress={async()=>setProfiles(await searchProfiles(profileQuery,10))}>Find</Button>{profiles.map(p=><XStack key={p.id} style={{alignItems:'center',justifyContent:'space-between'}}><Text>@{p.username}</Text><Button size="$3" onPress={()=>void setFeaturedProfile(p.id,168)}>Feature 7 days</Button></XStack>)}</YStack></Card>
    <Card p="$4"><YStack gap="$3"><Text fontSize="$6" fontWeight="800">Engagement leaderboard</Text>{leaders.map((r,i)=><Text key={i}>{i+1}. {typeof r==='object'&&r?String((r as Record<string,unknown>).username??(r as Record<string,unknown>).display_name??JSON.stringify(r)):String(r)}</Text>)}</YStack></Card></>}
  </YStack></ScrollView>
}
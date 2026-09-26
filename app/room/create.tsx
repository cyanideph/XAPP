import { useState } from 'react';
import { router } from 'expo-router';
import { H1, Input, Paragraph, Text, YStack } from 'tamagui';
import { XButton } from '../../src/components/XButton';
import { BentoCard } from '../../src/components/BentoCard';
import { joinRoom } from '../../src/features/chat/backend';
import { createRoom } from '../../src/features/chat/roomManagement';

function slugify(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48); }

export default function CreateRoomScreen() {
  const [name,setName]=useState(''); const [slug,setSlug]=useState(''); const [description,setDescription]=useState(''); const [provinceCode,setProvinceCode]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState<string|null>(null);
  const submit=async()=>{const cleanName=name.trim(),cleanSlug=slugify(slug||name);if(cleanName.length<2){setError('Room name must be at least 2 characters.');return;}if(cleanSlug.length<2){setError('Room slug must be at least 2 characters.');return;}setBusy(true);setError(null);try{const room=await createRoom(cleanName,cleanSlug,description,provinceCode);await joinRoom(room.id);router.replace({pathname:'/room/[id]',params:{id:room.id}});}catch(e){setError(e instanceof Error?e.message:'Unable to create Room.');}finally{setBusy(false);}};
  return <YStack flex={1} p="$5" pt="$8" gap="$4" bg="$background"><Text fontSize="$3" color="$colorPress" fontWeight="800">ROOMS</Text><H1 fontSize="$9">Create a Room</H1><Paragraph color="$colorPress">Create the Room first, then automatically join it as the creator.</Paragraph><BentoCard title="Room identity" description="Create a focused community space."><YStack gap="$3"><Input value={name} onChangeText={value=>{setName(value);if(!slug)setSlug(slugify(value));}} placeholder="Room name"/><Input value={slug} onChangeText={setSlug} placeholder="Slug" autoCapitalize="none"/><Input value={provinceCode} onChangeText={setProvinceCode} placeholder="Province code (optional)" autoCapitalize="characters"/><Input value={description} onChangeText={setDescription} placeholder="Description (optional)" multiline/></YStack></BentoCard>{error?<Paragraph color="$red10">{error}</Paragraph>:null}<XButton size="$4" disabled={busy} onPress={()=>{void submit();}}>{busy?'Creating…':'Create Room'}</XButton><XButton chromeless onPress={()=>router.back()}>Cancel</XButton></YStack>;
}

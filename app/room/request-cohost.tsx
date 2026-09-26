import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Button, H1, Paragraph, Text, YStack } from 'tamagui';
import { requestRoomCoHost } from '../../src/features/chat/roomManagement';

export default function RequestCoHostScreen(){
 const {id}=useLocalSearchParams<{id:string}>(); const [busy,setBusy]=useState(false); const [done,setDone]=useState(false); const [error,setError]=useState<string|null>(null);
 const submit=async()=>{setBusy(true);setError(null);try{await requestRoomCoHost(id);setDone(true);}catch(e){setError(e instanceof Error?e.message:'Unable to request co-host access.');}finally{setBusy(false);}};
 return <YStack flex={1} p="$5" pt="$8" gap="$4" bg="$background"><Text fontSize="$3" color="$colorPress" fontWeight="800">ROOMS</Text><H1 fontSize="$8">Request co-host</H1><Paragraph color="$colorPress">Send a request to the Room owner or current staff. Authorization is enforced by the backend.</Paragraph>{error?<Paragraph color="$red10">{error}</Paragraph>:null}{done?<><Text fontWeight="800">Request submitted.</Text><Button onPress={()=>router.back()}>Done</Button></>:<Button disabled={busy} onPress={()=>{void submit();}}>{busy?'Sending…':'Request co-host'}</Button>}</YStack>;
}

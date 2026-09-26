import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, H1, Input, Paragraph, Spinner, Text, YStack } from 'tamagui';
import { getNotificationPreferences, setNotificationPreferences, NotificationPreferences } from '../../src/lib/backend';
import { supabase } from '../../src/lib/supabase';

const keys=[['follow_enabled','Follow notifications'],['block_enabled','Block notifications'],['content_comment_enabled','Content comments'],['comment_reply_enabled','Comment replies'],['content_reaction_enabled','Content reactions'],['room_message_reaction_enabled','Room reactions'],['profile_comment_enabled','Profile comments'],['mention_enabled','Mentions'],['room_invite_enabled','Room invitations'],['conversation_invite_enabled','Conversation invitations']] as const;

export default function Settings(){
 const [p,setP]=useState<Omit<NotificationPreferences,'user_id'>|null>(null),[s,setS]=useState(''),[email,setEmail]=useState(''),[current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{void getNotificationPreferences().then(x=>{ const {user_id: _userId, ...preferences}=x; setP(preferences); }).catch(e=>setS(e instanceof Error?e.message:'Unable to load settings.')); void supabase?.auth.getUser().then(({data})=>setEmail(data.user?.email??''));},[]);
 async function changePassword(){setS('');if(next.length<8){setS('Password must be at least 8 characters.');return}if(next!==confirm){setS('Passwords do not match.');return}if(!supabase){setS('Supabase is not configured.');return}setBusy(true);try{const {error}=await supabase.auth.updateUser({password:next,current_password:current});if(error)throw error;setCurrent('');setNext('');setConfirm('');setS('Password updated successfully.');}catch(e){setS(e instanceof Error?e.message:'Unable to update password.')}finally{setBusy(false)}}
 async function changeEmail(){setS('');if(!supabase||!email.trim()){return}setBusy(true);try{const {error}=await supabase.auth.updateUser({email:email.trim()});if(error)throw error;setS('Email change requested. Check the confirmation email(s).');}catch(e){setS(e instanceof Error?e.message:'Unable to update email.')}finally{setBusy(false)}}
 if(!p)return <YStack flex={1} style={{justifyContent:'center',alignItems:'center'}}><Spinner/></YStack>;
 return <ScrollView contentContainerStyle={{padding:20,paddingTop:64,paddingBottom:40}}><YStack gap="$4"><H1>Settings.</H1>
  <YStack gap="$2"><Text fontSize="$6"fontWeight="800">Account security</Text><Paragraph>Manage your password and email identity.</Paragraph>
   <Input secureTextEntry placeholder="Current password" value={current} onChangeText={setCurrent}/><Input secureTextEntry placeholder="New password" value={next} onChangeText={setNext}/><Input secureTextEntry placeholder="Confirm new password" value={confirm} onChangeText={setConfirm}/><Button disabled={busy} onPress={()=>void changePassword()}>Change password</Button>
   <Input keyboardType="email-address" autoCapitalize="none" placeholder="Email address" value={email} onChangeText={setEmail}/><Button disabled={busy} onPress={()=>void changeEmail()}>Change email</Button>
  </YStack>
  <YStack gap="$2"><Text fontSize="$6"fontWeight="800">Notifications</Text>{keys.map(([k,label])=><Button key={k}onPress={()=>setP({...p,[k]:!p[k]})}>{label}: {p[k]?'ON':'OFF'}</Button>)}<Button onPress={()=>void setNotificationPreferences(p).then(()=>setS('Settings saved.')).catch(e=>setS(e instanceof Error?e.message:'Unable to save settings.'))}>Save settings</Button></YStack>
  {s?<Text>{s}</Text>:null}<Button chromeless onPress={()=>router.back()}>Back</Button></YStack></ScrollView>;
}
import { router } from 'expo-router';
import { Button, H1, Paragraph, YStack } from 'tamagui';

export default function RestoreScreen() {
  return <YStack flex={1} p="$5" style={{ justifyContent: "center" }} gap="$4" bg="$background">
    <H1>Session expired</H1>
    <Paragraph color="$colorPress">Sign in again to restore your X-App session.</Paragraph>
    <Button onPress={() => router.replace('/(auth)/sign-in')}>Sign in</Button>
  </YStack>;
}

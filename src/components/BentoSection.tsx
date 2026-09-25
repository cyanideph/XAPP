import { YStack } from 'tamagui';
import type { ReactNode } from 'react';

export function BentoSection({ children }: { children: ReactNode }) {
  return <YStack gap="$3">{children}</YStack>;
}

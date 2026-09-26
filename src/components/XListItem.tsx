import type { ReactNode } from 'react';
import { Avatar, ListItem } from 'tamagui';

type Props = {
  title: ReactNode;
  subTitle?: ReactNode;
  avatarUrl?: string | null;
  icon?: ReactNode;
  iconAfter?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

export function XListItem({ title, subTitle, avatarUrl, icon, iconAfter, onPress, disabled }: Props) {
  const leading = avatarUrl ? (
    <Avatar circular size="$3">
      <Avatar.Image source={{ uri: avatarUrl }} />
      <Avatar.Fallback bg="$backgroundHover" />
    </Avatar>
  ) : icon;
  return (
    <ListItem
      size="$4"
      title={title}
      subTitle={subTitle}
      icon={leading}
      iconAfter={iconAfter ?? (onPress ? <ListItem.Text color="$colorPress">›</ListItem.Text> : undefined)}
      onPress={onPress}
      disabled={disabled}
      pressStyle={{ background: '$backgroundPress', opacity: 0.9 }}
    />
  );
}

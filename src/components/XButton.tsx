import { Button, XStack } from 'tamagui';
import type { ComponentProps, ReactNode } from 'react';

type XButtonProps = ComponentProps<typeof Button> & {
  loading?: boolean;
  icon?: ReactNode;
  iconAfter?: ReactNode;
};

export function XButton({
  loading = false,
  disabled,
  children,
  chromeless,
  icon,
  iconAfter,
  ...props
}: XButtonProps) {
  return (
    <Button
      {...props}
      chromeless={chromeless}
      disabled={disabled || loading}
      {...(chromeless ? {} : {
        bg: '$brandBackground',
        color: '$brandColor',
        borderColor: '$brandBackground',
      })}
      rounded="$6"
      fontWeight="700"
      pressStyle={{ opacity: 0.88, scale: 0.985, bg: chromeless ? '$backgroundPress' : '$brandBackgroundPress' }}
      hoverStyle={chromeless ? undefined : { background: '$brandBackgroundHover', borderColor: '$brandBackgroundHover' }}
      focusStyle={{ borderColor: '$focusRing' }}
      focusVisibleStyle={{ borderColor: '$focusRing', outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' }}
      disabledStyle={{ opacity: 0.5 }}
    >
      <XStack items="center" justify="center" gap="$2">
        {icon}
        {loading ? 'Loading…' : children}
        {iconAfter}
      </XStack>
    </Button>
  );
}

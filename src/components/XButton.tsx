import { Button } from 'tamagui';
import type { ComponentProps } from 'react';

type XButtonProps = ComponentProps<typeof Button> & {
  loading?: boolean;
};

export function XButton({ loading = false, disabled, children, chromeless, ...props }: XButtonProps) {
  return (
    <Button
      {...props}
      chromeless={chromeless}
      disabled={disabled || loading}
      rounded="$6"
      fontWeight="700"
      pressStyle={{ opacity: 0.88, scale: 0.985 }}
      hoverStyle={chromeless ? undefined : { background: '$backgroundHover' }}
      focusStyle={{ borderColor: '$borderColorFocus' }}
      focusVisibleStyle={{ borderColor: '$borderColorFocus', outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' }}
    >
      {loading ? 'Loading…' : children}
    </Button>
  );
}

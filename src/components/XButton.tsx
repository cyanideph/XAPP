import { Button } from 'tamagui';
import type { ComponentProps } from 'react';

type XButtonProps = ComponentProps<typeof Button> & {
  loading?: boolean;
};

export function XButton({ loading = false, disabled, children, ...props }: XButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      borderRadius="$6"
      fontWeight="700"
      pressStyle={{ opacity: 0.88, scale: 0.985 }}
      hoverStyle={{ background: '$backgroundHover' }}
      focusStyle={{ borderColor: '$borderColorFocus' }}
    >
      {loading ? 'Loading…' : children}
    </Button>
  );
}

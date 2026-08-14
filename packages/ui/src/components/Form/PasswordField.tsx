'use client';

import { useState } from 'react';

import { TextField, type TextFieldProps } from './TextField';

export type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'suffix' | 'prefix'>;

/**
 * A password control with a toggle that reveals what was typed.
 *
 * Split out of {@link TextField} rather than added as a prop: the toggle owns state
 * and flips the input's `type`, which is not something a text field should carry
 * around for every other use.
 */
export const PasswordField = (props: PasswordFieldProps) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <TextField
      {...props}
      type={revealed ? 'text' : 'password'}
      suffix={
        <button
          data-testid="password-field-toggle"
          type="button"
          // The negative margin reaches back out past the shell's inset, so the
          // toggle's hit area runs closer to the edge than the text does. Its height
          // stays under the shortest field's, so it never stretches the box.
          className="text-2xs tracking-label text-foreground-subtle hover:bg-background-alt hover:text-foreground duration-base ease-standard -mr-2 shrink-0 cursor-pointer self-center rounded-md px-2.5 py-1 font-mono uppercase transition-all"
          onClick={() => setRevealed((current) => !current)}
          aria-pressed={revealed}
        >
          {revealed ? 'Hide' : 'Show'}
        </button>
      }
    />
  );
};

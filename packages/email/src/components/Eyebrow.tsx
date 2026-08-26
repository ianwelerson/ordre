import { Column, Row, Section } from 'react-email';

import { brand } from '../brand.ts';

export type EyebrowProps = {
  children: string;
  /** Space below the label. Section labels sit slightly further from their list. */
  spacing?: number;
};

/**
 * The structural label above a headline: a 32px rule, then mono uppercase type.
 *
 * Mirrors the `Eyebrow` in `@ordre/ui`, which draws the rule with a `::before`
 * pseudo-element. Email clients do not support those, so it is a table column
 * here, but the specification is the same one: `mono-label` type against a
 * `foreground-subtle` rule.
 *
 * @example
 * <Eyebrow>Getting started</Eyebrow>
 */
export const Eyebrow = ({ children, spacing = 16 }: EyebrowProps) => (
  <Section style={{ paddingBottom: `${spacing}px` }}>
    <Row>
      <Column data-skip-in-text="true" style={{ verticalAlign: 'middle', width: '32px' }}>
        <Section
          style={{
            background: brand.token.foregroundSubtle,
            fontSize: '1px',
            height: '1px',
            lineHeight: '1px',
            width: '32px',
          }}
        >
          &nbsp;
        </Section>
      </Column>
      <Column
        style={{
          color: brand.token.foregroundSubtle,
          fontFamily: brand.font.mono,
          fontSize: brand.text['2xs'],
          fontWeight: brand.weight.medium,
          letterSpacing: brand.tracking.eyebrow,
          paddingLeft: '12px',
          textTransform: 'uppercase',
          verticalAlign: 'middle',
        }}
      >
        {children}
      </Column>
    </Row>
  </Section>
);

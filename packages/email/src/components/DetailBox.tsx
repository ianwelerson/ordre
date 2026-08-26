import { Column, Row, Section } from 'react-email';

import { brand } from '../brand.ts';

export type DetailBoxProps = {
  /** Label and value for each row, in the order they should read. */
  rows: { label: string; value: string }[];
};

/**
 * The summary box that restates the facts behind a message: workspace, plan, role.
 *
 * Labels take the `mono-label` specification and values take `mono-token`, so a
 * plan name and an email address line up rather than drifting against the label
 * column.
 *
 * @example
 * <DetailBox rows={[{ label: 'Plan', value: 'Free' }]} />
 */
export const DetailBox = ({ rows }: DetailBoxProps) => (
  <Section
    style={{
      background: brand.token.backgroundAlt,
      borderRadius: brand.radius.md,
      padding: '16px 0 8px 0',
    }}
  >
    {rows.map(({ label, value }) => (
      <Row key={label}>
        <Column
          style={{
            color: brand.token.foregroundSubtle,
            fontFamily: brand.font.mono,
            fontSize: brand.text['2xs'],
            fontWeight: brand.weight.medium,
            letterSpacing: brand.tracking.label,
            padding: '0 20px 8px 20px',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Column>
        <Column
          align="right"
          style={{
            color: brand.token.foreground,
            fontFamily: brand.font.mono,
            fontSize: brand.text.xs,
            lineHeight: brand.leading.caption,
            padding: '0 20px 8px 20px',
          }}
        >
          {value}
        </Column>
      </Row>
    ))}
  </Section>
);

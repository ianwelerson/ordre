import { Column, Row, Section, Text } from 'react-email';

import { brand } from '../brand.ts';

export type StepsProps = {
  /** Rendered in order; the number beside each is its position, not a value. */
  steps: { title: string; body: string }[];
};

/**
 * The numbered list the onboarding messages end with.
 *
 * The number is generated from the index rather than written into the copy, so a
 * translator never has to keep `01` in step with the order. Title and body share
 * a type step and are told apart by weight and tone, which is how `Typography`
 * separates them everywhere else.
 *
 * @example
 * <Steps steps={[{ title: 'Share the link', body: 'Send it by SMS.' }]} />
 */
export const Steps = ({ steps }: StepsProps) => (
  <Section>
    {steps.map(({ title, body }, index) => {
      const last = index === steps.length - 1;

      return (
        <Row key={title}>
          <Column
            style={{
              color: brand.token.accent,
              fontFamily: brand.font.mono,
              fontSize: brand.text.xs,
              fontWeight: brand.weight.medium,
              padding: `0 20px ${last ? 0 : 18}px 0`,
              verticalAlign: 'top',
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </Column>
          <Column style={{ padding: `0 0 ${last ? 0 : 18}px 0` }}>
            <Text
              style={{
                color: brand.token.foreground,
                fontFamily: brand.font.body,
                fontSize: brand.text.sm,
                fontWeight: brand.weight.semibold,
                margin: 0,
                paddingBottom: '4px',
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                color: brand.token.foregroundMuted,
                fontFamily: brand.font.body,
                fontSize: brand.text.sm,
                lineHeight: brand.leading.body,
                margin: 0,
              }}
            >
              {body}
            </Text>
          </Column>
        </Row>
      );
    })}
  </Section>
);

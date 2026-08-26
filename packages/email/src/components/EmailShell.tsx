import type { ReactNode } from 'react';
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from 'react-email';

import type { Locale } from '@ordre/core/enums';
import type { EmailSharedCopy } from '@ordre/core/types';

import { brand } from '../brand.ts';
import { Eyebrow } from './Eyebrow.tsx';

export type EmailShellProps = {
  locale: Locale;
  preview: string;
  /** The word opposite the wordmark in the header, naming the kind of message. */
  category: string;
  eyebrow: string;
  heading: string;
  body: string;
  action: string;
  actionUrl: string;
  /** The line under the button, explaining expiry or naming the account. */
  note: string;
  /**
   * Shown under `note` for the messages whose button carries a one-time link.
   * Omitted where the note only restates an address.
   */
  fallbackUrl?: string;
  disclaimer: string;
  shared: EmailSharedCopy;
  helpUrl: string;
  privacyUrl: string;
  /** The summary box, shown between the body and the button where a message has one. */
  details?: ReactNode;
  /** The numbered steps, shown below a divider where a message has them. */
  children?: ReactNode;
};

/**
 * The frame every transactional email shares.
 *
 * Two rules of the layout are load-bearing for email clients rather than
 * aesthetic: the card's horizontal padding is applied through the `px` class so
 * the media query below can shrink it on narrow screens, and the container is a
 * fixed 600px that the same query collapses to 100%. Inline styles alone cannot
 * express either.
 */
export const EmailShell = ({
  locale,
  preview,
  category,
  eyebrow,
  heading,
  body,
  action,
  actionUrl,
  note,
  fallbackUrl,
  disclaimer,
  shared,
  helpUrl,
  privacyUrl,
  details,
  children,
}: EmailShellProps) => (
  <Html dir="ltr" lang={locale}>
    <Head>
      <style>{`
        a { color: ${brand.token.accentStrong}; }
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .px { padding-left: 24px !important; padding-right: 24px !important; }
        }
      `}</style>
    </Head>
    <Preview>{preview}</Preview>
    <Body style={{ background: brand.token.background, margin: 0, padding: '32px 16px' }}>
      <Container
        className="container"
        style={{ margin: '0 auto', maxWidth: `${brand.size.container}px`, width: '100%' }}
      >
        <Section className="px" style={{ padding: '4px 8px 20px 8px' }}>
          <Row>
            <Column
              style={{
                color: brand.token.foreground,
                fontFamily: brand.font.body,
                fontSize: brand.text.lg,
                fontWeight: brand.weight.bold,
                letterSpacing: brand.tracking.display,
              }}
            >
              Ordre
            </Column>
            <Column
              align="right"
              style={{
                color: brand.token.foregroundSubtle,
                fontFamily: brand.font.mono,
                fontSize: brand.text['2xs'],
                fontWeight: brand.weight.medium,
                letterSpacing: brand.tracking.label,
                textTransform: 'uppercase',
              }}
            >
              {category}
            </Column>
          </Row>
        </Section>

        <Section
          style={{
            background: brand.token.backgroundElevated,
            border: `1px solid ${brand.token.border}`,
            borderRadius: brand.radius.lg,
            overflow: 'hidden',
          }}
        >
          <Section
            data-skip-in-text="true"
            style={{
              background: brand.token.accent,
              borderRadius: `${brand.radius.lg} ${brand.radius.lg} 0 0`,
              fontSize: '4px',
              height: '4px',
              lineHeight: '4px',
            }}
          >
            &nbsp;
          </Section>

          <Section className="px" style={{ padding: '40px 48px 8px 48px' }}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Heading
              style={{
                color: brand.token.foreground,
                fontFamily: brand.font.body,
                fontSize: brand.text['2xl'],
                fontWeight: brand.weight.semibold,
                letterSpacing: brand.tracking.headline,
                lineHeight: brand.leading.headline,
                margin: 0,
              }}
            >
              {heading}
            </Heading>
          </Section>

          <Section
            className="px"
            style={{
              color: brand.token.foregroundMuted,
              fontFamily: brand.font.body,
              fontSize: brand.text.base,
              lineHeight: brand.leading.body,
              padding: '16px 48px 0 48px',
            }}
          >
            <Text style={{ margin: 0 }}>{body}</Text>
          </Section>

          {details ? (
            <Section className="px" style={{ padding: '20px 48px 0 48px' }}>
              {details}
            </Section>
          ) : null}

          <Section className="px" style={{ padding: '28px 48px 8px 48px' }}>
            <Button
              href={actionUrl}
              style={{
                background: brand.token.accent,
                borderRadius: brand.radius.md,
                color: brand.color.white,
                display: 'inline-block',
                fontFamily: brand.font.body,
                fontSize: brand.text.base,
                fontWeight: brand.weight.medium,
                letterSpacing: brand.tracking.button,
                padding: '14px 32px',
                textDecoration: 'none',
              }}
            >
              {action}
            </Button>
          </Section>

          <Section
            className="px"
            style={{
              color: brand.token.foregroundSubtle,
              fontFamily: brand.font.body,
              fontSize: brand.text.xs,
              lineHeight: brand.leading.caption,
              padding: '8px 48px 0 48px',
            }}
          >
            <Text style={{ margin: 0 }}>{note}</Text>
            {fallbackUrl ? (
              <Link
                href={fallbackUrl}
                style={{
                  color: brand.token.accentStrong,
                  fontFamily: brand.font.mono,
                  fontSize: brand.text.xs,
                  wordBreak: 'break-all',
                }}
              >
                {fallbackUrl}
              </Link>
            ) : null}
          </Section>

          {children ? (
            <>
              <Section className="px" style={{ padding: '28px 48px 0 48px' }}>
                <Hr style={{ borderColor: brand.token.border, margin: 0 }} />
              </Section>
              <Section className="px" style={{ padding: '24px 48px 40px 48px' }}>
                {children}
              </Section>
            </>
          ) : (
            <Section data-skip-in-text="true" style={{ height: '24px', lineHeight: '24px' }}>
              &nbsp;
            </Section>
          )}
        </Section>

        <Section
          className="px"
          style={{
            color: brand.token.foregroundSubtle,
            fontFamily: brand.font.body,
            fontSize: brand.text.xs,
            lineHeight: brand.leading.caption,
            padding: '28px 8px 8px 8px',
          }}
        >
          <Text style={{ margin: 0 }}>{disclaimer}</Text>
          <Text style={{ margin: 0, paddingTop: '14px' }}>
            <Link
              href={helpUrl}
              style={{ color: brand.token.foregroundSubtle, textDecoration: 'underline' }}
            >
              {shared.help}
            </Link>
            {'  ·  '}
            <Link
              href={privacyUrl}
              style={{ color: brand.token.foregroundSubtle, textDecoration: 'underline' }}
            >
              {shared.privacy}
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

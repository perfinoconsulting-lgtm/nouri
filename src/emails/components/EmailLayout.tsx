import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components'
import * as React from 'react'

const colors = {
  bgOuter: '#0d2137',
  bgCard: '#ffffff',
  bgHeader: '#1A3A5C',
  accent: '#F5A623',
  text: '#1c1917',
  textMuted: '#78716c',
}

interface EmailLayoutProps {
  previewText: string
  children: React.ReactNode
}

export function EmailLayout({ previewText, children }: EmailLayoutProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lisani.tech'

  return (
    <Html lang="fr">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: colors.bgOuter, margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: '600px',
            backgroundColor: colors.bgCard,
            borderRadius: '16px',
            margin: '40px auto',
            overflow: 'hidden',
          }}
        >
          {/* En-tête */}
          <Section
            style={{
              backgroundColor: colors.bgHeader,
              padding: '24px 40px',
              textAlign: 'center',
            }}
          >
            <Text
              style={{
                color: colors.accent,
                fontSize: '28px',
                fontWeight: 'bold',
                margin: 0,
                fontFamily: 'Georgia, serif',
                letterSpacing: '1px',
              }}
            >
              🌙 Lisani
            </Text>
            <Text
              style={{
                color: '#94a3b8',
                fontSize: '13px',
                margin: '4px 0 0',
              }}
            >
              L&apos;arabe pour vos enfants
            </Text>
          </Section>

          {/* Contenu */}
          <Section style={{ padding: '32px 40px' }}>{children}</Section>

          {/* Pied de page */}
          <Hr style={{ borderColor: '#e5e7eb', margin: '0 40px' }} />
          <Section
            style={{
              padding: '24px 40px',
              backgroundColor: '#f9fafb',
            }}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontSize: '12px',
                textAlign: 'center',
                margin: '0 0 8px',
              }}
            >
              © {new Date().getFullYear()} Lisani — Application d&apos;apprentissage de l&apos;arabe
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: '12px',
                textAlign: 'center',
                margin: 0,
              }}
            >
              <Link
                href={`${appUrl}/legal/confidentialite`}
                style={{ color: colors.textMuted, textDecoration: 'underline' }}
              >
                Confidentialité
              </Link>
              {' · '}
              <Link
                href={`${appUrl}/legal/cgv`}
                style={{ color: colors.textMuted, textDecoration: 'underline' }}
              >
                CGV
              </Link>
              {' · '}
              <Link
                href={`${appUrl}/dashboard/parametres?unsubscribe=1`}
                style={{ color: colors.textMuted, textDecoration: 'underline' }}
              >
                Se désabonner
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

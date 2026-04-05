/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Harte Auto Group'

interface Props {
  customerName?: string
  vehicle?: string
  offerAmount?: string
  portalLink?: string
  dealershipName?: string
}

const OfferAcceptedEmail = ({ customerName, vehicle, offerAmount, portalLink, dealershipName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Offer accepted — next steps for your {vehicle || 'vehicle'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>{(dealershipName || SITE_NAME).toUpperCase()}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Offer Accepted! 🎉</Heading>
          <Text style={text}>Hi {customerName || 'there'},</Text>
          <Text style={text}>
            Thank you for accepting our offer on your {vehicle || 'vehicle'}!
          </Text>
          {offerAmount && (
            <Section style={offerBox}>
              <Text style={offerLabel}>Your Accepted Offer</Text>
              <Text style={offerValue}>{offerAmount}</Text>
            </Section>
          )}
          <Text style={text}>
            <strong>Next Steps:</strong>
          </Text>
          <Text style={text}>
            1. Schedule your inspection visit{'\n'}
            2. Bring your title, registration, and valid ID{'\n'}
            3. We'll handle the rest!
          </Text>
          {portalLink && (
            <Button style={button} href={portalLink}>
              Schedule My Visit
            </Button>
          )}
          <Hr style={hr} />
          <Text style={footer}>Best regards,{'\n'}{dealershipName || SITE_NAME}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OfferAcceptedEmail,
  subject: (data: Record<string, any>) => `Offer Accepted — Next Steps for Your ${data.vehicle || 'Vehicle'}`,
  displayName: 'Customer offer accepted',
  previewData: {
    customerName: 'Jane Smith',
    vehicle: '2022 Honda Accord',
    offerAmount: '$18,500',
    portalLink: 'https://hartecash.lovable.app/offer/abc123',
    dealershipName: 'Harte Nissan',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
const container = { maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: 'hsl(210, 100%, 25%)', padding: '24px 25px', borderRadius: '12px 12px 0 0' }
const logoText = { color: '#ffffff', fontSize: '18px', fontWeight: 'bold' as const, letterSpacing: '2px', margin: '0', textAlign: 'center' as const }
const content = { padding: '32px 25px', border: '1px solid hsl(220, 13%, 91%)', borderTop: 'none', borderRadius: '0 0 12px 12px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(210, 29%, 24%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(220, 9%, 46%)', lineHeight: '1.6', margin: '0 0 20px', whiteSpace: 'pre-line' as const }
const button = { backgroundColor: 'hsl(210, 100%, 25%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const offerBox = { backgroundColor: 'hsl(210, 33%, 96%)', borderRadius: '12px', padding: '20px', textAlign: 'center' as const, margin: '0 0 20px' }
const offerLabel = { fontSize: '12px', color: 'hsl(220, 9%, 46%)', margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const offerValue = { fontSize: '28px', fontWeight: 'bold' as const, color: 'hsl(210, 100%, 25%)', margin: '0' }
const hr = { borderColor: 'hsl(220, 13%, 91%)', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', whiteSpace: 'pre-line' as const }

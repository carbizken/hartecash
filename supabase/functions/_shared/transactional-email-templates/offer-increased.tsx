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
  portalLink?: string
  guaranteeDays?: string
  dealershipName?: string
}

const OfferIncreasedEmail = ({ customerName, vehicle, portalLink, guaranteeDays, dealershipName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Great news — we've increased the offer on your {vehicle || 'vehicle'}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>{(dealershipName || SITE_NAME).toUpperCase()}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Your Offer Has Been Increased! 📈</Heading>
          <Text style={text}>Hi {customerName || 'there'},</Text>
          <Text style={text}>
            Great news! We've increased the offer on your {vehicle || 'vehicle'}.
          </Text>
          {portalLink && (
            <Button style={button} href={portalLink}>
              View Updated Offer
            </Button>
          )}
          {guaranteeDays && (
            <Text style={guaranteeText}>
              ⏰ Don't wait — this offer is valid for {guaranteeDays} days
            </Text>
          )}
          <Hr style={hr} />
          <Text style={footer}>Best regards,{'\n'}{dealershipName || SITE_NAME}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OfferIncreasedEmail,
  subject: 'Great News — Your Offer Has Been Increased!',
  displayName: 'Customer offer increased',
  previewData: {
    customerName: 'Jane Smith',
    vehicle: '2022 Honda Accord',
    portalLink: 'https://hartecash.lovable.app/offer/abc123',
    guaranteeDays: '7',
    dealershipName: 'Harte Nissan',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
const container = { maxWidth: '560px', margin: '0 auto' }
const header = { backgroundColor: 'hsl(210, 100%, 25%)', padding: '24px 25px', borderRadius: '12px 12px 0 0' }
const logoText = { color: '#ffffff', fontSize: '18px', fontWeight: 'bold' as const, letterSpacing: '2px', margin: '0', textAlign: 'center' as const }
const content = { padding: '32px 25px', border: '1px solid hsl(220, 13%, 91%)', borderTop: 'none', borderRadius: '0 0 12px 12px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(210, 29%, 24%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(220, 9%, 46%)', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: 'hsl(210, 100%, 25%)', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const guaranteeText = { fontSize: '13px', color: 'hsl(210, 29%, 24%)', fontWeight: '600' as const, margin: '16px 0 20px', textAlign: 'center' as const }
const hr = { borderColor: 'hsl(220, 13%, 91%)', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', whiteSpace: 'pre-line' as const }

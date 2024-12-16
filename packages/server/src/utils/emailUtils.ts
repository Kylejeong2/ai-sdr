import { EmailType } from '@graham/db'

export function detectEmailType(email: string): EmailType {
  const personalDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'protonmail.com',
    'me.com'
  ]

  const parts = email.split('@')
  const domain = parts[1]?.toLowerCase() || ''
  return personalDomains.includes(domain) ? EmailType.PERSONAL : EmailType.COMPANY
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function extractDomainFromEmail(email: string): string {
  return email.split('@')[1]?.toLowerCase() || ''
} 
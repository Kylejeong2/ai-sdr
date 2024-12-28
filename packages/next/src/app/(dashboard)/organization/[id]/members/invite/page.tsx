'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  ArrowLeft,
  Mail,
  UserPlus 
} from 'lucide-react'

export default function InviteMembersPage() {
  const router = useRouter()
  const { organization } = useOrganization()
  const [emails, setEmails] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleInvite = async () => {
    if (!emails.trim()) {
      toast.error('Please enter at least one email address')
      return
    }

    const emailList = emails
      .split(/[\n,]/)
      .map(email => email.trim())
      .filter(email => email.length > 0)

    if (!emailList.length) {
      toast.error('Please enter valid email addresses')
      return
    }

    setIsLoading(true)

    try {
      const invitations = await Promise.all(
        emailList.map(async (email) => {
          try {
            return await organization?.inviteMember({ emailAddress: email, role: 'org:member' })
          } catch (error) {
            console.error(`Failed to invite ${email}:`, error)
            return null
          }
        })
      )

      const successCount = invitations.filter(Boolean).length
      const failCount = emailList.length - successCount

      if (successCount > 0) {
        toast.success(`Successfully invited ${successCount} member${successCount === 1 ? '' : 's'}`)
      }
      
      if (failCount > 0) {
        toast.error(`Failed to invite ${failCount} email${failCount === 1 ? '' : 's'}`)
      }

      if (successCount > 0) {
        router.push('/onboarding')
      }
    } catch (error) {
      console.error('Failed to send invitations:', error)
      toast.error('Failed to send invitations. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="p-8 w-full max-w-2xl space-y-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/onboarding')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Onboarding
          </Button>
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            Invite Team Members
          </h1>
          <p className="text-gray-400 text-lg">
            Add your colleagues to {organization?.name}
          </p>
        </div>

        <Card className="p-6 border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Addresses
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Textarea
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="Enter email addresses (one per line or comma-separated)"
                  className="pl-10 min-h-[120px] bg-gray-900 border-gray-800 text-white"
                />
              </div>
              <p className="mt-2 text-sm text-gray-400">
                You can enter multiple email addresses separated by commas or new lines
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Personal Message (Optional)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message to your invitation..."
                className="bg-gray-900 border-gray-800 text-white"
              />
            </div>

            <Button
              onClick={handleInvite}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                'Sending Invitations...'
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Send Invitations
                </>
              )}
            </Button>
          </div>
        </Card>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/onboarding')}
            className="text-gray-400 hover:text-white"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
} 
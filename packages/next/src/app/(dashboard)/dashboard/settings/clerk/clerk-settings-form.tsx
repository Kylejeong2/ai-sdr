'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrganization } from '@clerk/nextjs'

const clerkConfigSchema = z.object({
  publishableKey: z.string().min(1, 'Required'),
  secretKey: z.string().min(1, 'Required'),
  webhookSecret: z.string().min(1, 'Required'),
  organizationId: z.string().min(1, 'Required'),
  environment: z.enum(['test', 'production']).default('test'),
  webhookEvents: z.array(z.string()).default([
    'user.created',
    'organization.created',
    'organizationMembership.created',
    'user.updated',
    'organization.updated',
    'organizationMembership.updated',
    'user.deleted',
    'organization.deleted',
    'organizationMembership.deleted'
  ])
})

type ClerkConfigFormData = z.infer<typeof clerkConfigSchema>

interface ClerkSettingsFormProps {
  teamId: string
  initialData?: {
    id: string
    publishableKey: string
    secretKey: string
    webhookSecret: string
    organizationId: string
    isActive: boolean
    environment?: string
    webhookEvents?: string[]
    lastWebhookReceived?: Date
    webhookStatus?: 'healthy' | 'error'
  }
}

export function ClerkSettingsForm({ teamId, initialData }: ClerkSettingsFormProps) {
  const router = useRouter()
  const { organization } = useOrganization()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [webhookHealth, setWebhookHealth] = useState<'healthy' | 'error' | null>(
    initialData?.webhookStatus || null
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ClerkConfigFormData>({
    resolver: zodResolver(clerkConfigSchema),
    defaultValues: {
      ...initialData,
      organizationId: organization?.id || initialData?.organizationId || '',
      environment: (initialData?.environment as 'test' | 'production') || 'test',
      webhookEvents: initialData?.webhookEvents || [
        'user.created',
        'organization.created',
        'organizationMembership.created'
      ]
    }
  })

  useEffect(() => {
    if (organization?.id) {
      setValue('organizationId', organization.id)
    }
  }, [organization?.id, setValue])

  const environment = watch('environment')

  const testConnection = async () => {
    if (!watch('secretKey') || !watch('webhookSecret')) {
      toast.error('Please provide both Secret Key and Webhook Secret')
      return
    }

    try {
      setIsTestingConnection(true)
      const response = await fetch('/api/settings/clerk/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey: watch('secretKey'),
          webhookSecret: watch('webhookSecret')
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Connection test failed')
      }

      toast.success('Connection test successful! API keys and webhook are valid.')
      setWebhookHealth('healthy')
    } catch (error) {
      console.error('Test connection error:', error)
      toast.error(error instanceof Error ? error.message : 'Connection test failed')
      setWebhookHealth('error')
    } finally {
      setIsTestingConnection(false)
    }
  }

  const onSubmit = async (data: ClerkConfigFormData) => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/settings/clerk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          teamId,
          organizationId: organization?.id
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save settings')
      }

      toast.success('Settings saved successfully')
      router.refresh()
    } catch (error) {
      console.error('Save settings error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            {...register('environment')}
            className="bg-gray-900 border-gray-800 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="test">Test Environment</option>
            <option value="production">Production</option>
          </select>

          {webhookHealth && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-opacity-10 border border-opacity-20" 
              style={{
                backgroundColor: webhookHealth === 'healthy' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderColor: webhookHealth === 'healthy' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: webhookHealth === 'healthy' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
              }}
            >
              {webhookHealth === 'healthy' ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              {webhookHealth === 'healthy' ? 'Healthy' : 'Error'}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={testConnection}
          disabled={isTestingConnection}
          className="text-xs"
        >
          {isTestingConnection ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Publishable Key {environment === 'test' ? '(Test)' : '(Live)'}
          </label>
          <Input
            {...register('publishableKey')}
            type="text"
            placeholder={environment === 'test' ? 'pk_test_...' : 'pk_live_...'}
            className="bg-gray-900 border-gray-800 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.publishableKey && (
            <p className="mt-1.5 text-xs text-red-400">{errors.publishableKey.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Secret Key {environment === 'test' ? '(Test)' : '(Live)'}
          </label>
          <Input
            {...register('secretKey')}
            type="password"
            placeholder={environment === 'test' ? 'sk_test_...' : 'sk_live_...'}
            className="bg-gray-900 border-gray-800 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.secretKey && (
            <p className="mt-1.5 text-xs text-red-400">{errors.secretKey.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Webhook Secret
          </label>
          <Input
            {...register('webhookSecret')}
            type="password"
            placeholder="whsec_..."
            className="bg-gray-900 border-gray-800 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.webhookSecret && (
            <p className="mt-1.5 text-xs text-red-400">{errors.webhookSecret.message}</p>
          )}
        </div>
      </div>

      <div className="pt-4 space-y-4">
        <Button 
          onClick={() => testConnection()}
          type="button"
          disabled={isTestingConnection || !watch('secretKey') || !watch('webhookSecret')}
          className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTestingConnection ? 'Testing Connection...' : 'Test Connection'}
        </Button>

        <Button 
          type="submit" 
          disabled={isSubmitting || webhookHealth !== 'healthy'}
          className={cn(
            "w-full transition-all duration-200",
            webhookHealth === 'healthy' 
              ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              : "bg-gradient-to-r from-gray-600 to-gray-700 opacity-50 cursor-not-allowed"
          )}
        >
          {isSubmitting ? 'Saving...' : webhookHealth === 'healthy' ? 'Save Settings' : 'Test Connection First'}
        </Button>
      </div>
    </form>
  )
}
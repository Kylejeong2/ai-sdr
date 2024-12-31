'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [webhookHealth, setWebhookHealth] = useState<'healthy' | 'error' | null>(
    initialData?.webhookStatus || null
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ClerkConfigFormData>({
    resolver: zodResolver(clerkConfigSchema),
    defaultValues: {
      ...initialData,
      environment: (initialData?.environment as 'test' | 'production') || 'test',
      webhookEvents: initialData?.webhookEvents || [
        'user.created',
        'organization.created',
        'organizationMembership.created'
      ]
    }
  })

  const environment = watch('environment')

  const testConnection = async () => {
    try {
      setIsTestingConnection(true)
      const response = await fetch('/api/settings/clerk/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publishableKey: watch('publishableKey'),
          secretKey: watch('secretKey'),
          webhookSecret: watch('webhookSecret')
        })
      })

      if (!response.ok) {
        throw new Error('Connection test failed')
      }

      toast.success('Connection test successful')
      setWebhookHealth('healthy')
    } catch (error) {
      toast.error('Connection test failed')
      setWebhookHealth('error')
    } finally {
      setIsTestingConnection(false)
    }
  }

  const onSubmit = async (data: ClerkConfigFormData) => {
    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/settings/clerk', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          ...data
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast.success('Clerk settings saved successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to save settings')
      console.error(error)
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

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Organization ID
          </label>
          <Input
            {...register('organizationId')}
            type="text"
            placeholder="org_..."
            className="bg-gray-900 border-gray-800 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.organizationId && (
            <p className="mt-1.5 text-xs text-red-400">{errors.organizationId.message}</p>
          )}
        </div>
      </div>

      <div className="pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {isSubmitting ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
} 
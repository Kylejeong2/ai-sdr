'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

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
    setValue,
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
          webhookSecret: watch('webhookSecret'),
          organizationId: watch('organizationId')
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Environment:</span>
            <select
              {...register('environment')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="test">Test</option>
              <option value="production">Production</option>
            </select>
          </div>
          {webhookHealth && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Webhook Status:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                webhookHealth === 'healthy' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {webhookHealth === 'healthy' ? 'Healthy' : 'Error'}
              </span>
            </div>
          )}
          {initialData?.lastWebhookReceived && (
            <div className="text-sm text-gray-500">
              Last webhook received: {new Date(initialData.lastWebhookReceived).toLocaleString()}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={testConnection}
          disabled={isTestingConnection}
        >
          {isTestingConnection ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Publishable Key {environment === 'test' ? '(Test)' : '(Live)'}
        </label>
        <Input
          {...register('publishableKey')}
          type="text"
          placeholder={environment === 'test' ? 'pk_test_...' : 'pk_live_...'}
          className="mt-1"
        />
        {errors.publishableKey && (
          <p className="mt-1 text-sm text-red-600">{errors.publishableKey.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Secret Key {environment === 'test' ? '(Test)' : '(Live)'}
        </label>
        <Input
          {...register('secretKey')}
          type="password"
          placeholder={environment === 'test' ? 'sk_test_...' : 'sk_live_...'}
          className="mt-1"
        />
        {errors.secretKey && (
          <p className="mt-1 text-sm text-red-600">{errors.secretKey.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Webhook Secret
        </label>
        <Input
          {...register('webhookSecret')}
          type="password"
          placeholder="whsec_..."
          className="mt-1"
        />
        {errors.webhookSecret && (
          <p className="mt-1 text-sm text-red-600">{errors.webhookSecret.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Organization ID
        </label>
        <Input
          {...register('organizationId')}
          type="text"
          placeholder="org_..."
          className="mt-1"
        />
        {errors.organizationId && (
          <p className="mt-1 text-sm text-red-600">{errors.organizationId.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Webhook Events
        </label>
        <div className="space-y-2 bg-gray-50 p-4 rounded-md">
          {[
            { id: 'user.created', label: 'User Created' },
            { id: 'user.updated', label: 'User Updated' },
            { id: 'user.deleted', label: 'User Deleted' },
            { id: 'organization.created', label: 'Organization Created' },
            { id: 'organization.updated', label: 'Organization Updated' },
            { id: 'organization.deleted', label: 'Organization Deleted' },
            { id: 'organizationMembership.created', label: 'Organization Membership Created' },
            { id: 'organizationMembership.updated', label: 'Organization Membership Updated' },
            { id: 'organizationMembership.deleted', label: 'Organization Membership Deleted' }
          ].map(event => (
            <label key={event.id} className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                checked={watch('webhookEvents')?.includes(event.id)}
                onChange={(e) => {
                  const events = watch('webhookEvents') || []
                  if (e.target.checked) {
                    setValue('webhookEvents', [...events, event.id])
                  } else {
                    setValue('webhookEvents', events.filter(id => id !== event.id))
                  }
                }}
              />
              <span className="ml-2 text-sm text-gray-600">{event.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-gray-500">
          {environment === 'test' 
            ? 'Using test environment - no real data will be processed'
            : 'Using production environment - real data will be processed'}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update Settings' : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
} 
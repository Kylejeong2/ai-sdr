import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTeam } from '@/providers/team-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

const calendlyConfigSchema = z.object({
  accessToken: z.string().min(1, 'Access Token is required'),
  webhookSigningKey: z.string().min(1, 'Webhook Signing Key is required'),
  organizationId: z.string().optional(),
  isActive: z.boolean().default(true)
})

type CalendlyConfigFormData = z.infer<typeof calendlyConfigSchema>

export function CalendlySettingsForm() {
  const { team } = useTeam()
  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CalendlyConfigFormData>({
    resolver: zodResolver(calendlyConfigSchema),
    defaultValues: {
      accessToken: team?.calendlyConfig?.accessToken || '',
      webhookSigningKey: team?.calendlyConfig?.webhookSigningKey || '',
      organizationId: team?.calendlyConfig?.organizationId || '',
      isActive: team?.calendlyConfig?.isActive ?? true
    }
  })

  const isActive = watch('isActive')

  const onSubmit = async (data: CalendlyConfigFormData) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/settings/calendar/calendly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to save Calendly settings')
      }

      toast.success('Calendly settings saved successfully')
    } catch (error) {
      console.error('Error saving Calendly settings:', error)
      toast.error('Failed to save Calendly settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label>Integration Status</Label>
          <p className="text-sm text-gray-500">Enable or disable the Calendly integration</p>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={(checked) => setValue('isActive', checked)}
        />
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="accessToken">Access Token</Label>
          <Input
            id="accessToken"
            type="password"
            {...register('accessToken')}
            className="mt-1"
            disabled={!isActive}
          />
          {errors.accessToken && (
            <p className="text-sm text-red-500 mt-1">{errors.accessToken.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="webhookSigningKey">Webhook Signing Key</Label>
          <Input
            id="webhookSigningKey"
            type="password"
            {...register('webhookSigningKey')}
            className="mt-1"
            disabled={!isActive}
          />
          {errors.webhookSigningKey && (
            <p className="text-sm text-red-500 mt-1">{errors.webhookSigningKey.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="organizationId">Organization ID (Optional)</Label>
          <Input
            id="organizationId"
            {...register('organizationId')}
            className="mt-1"
            disabled={!isActive}
            placeholder="Enter your Calendly organization ID if applicable"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving || !isActive}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {team?.calendlyConfig?.webhookUrl && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <Label>Webhook URL</Label>
          <p className="text-sm text-gray-600 mt-1">
            Use this URL in your Calendly webhook settings:
          </p>
          <code className="block p-2 mt-2 bg-gray-100 rounded text-sm">
            {team.calendlyConfig.webhookUrl}
          </code>
        </div>
      )}
    </form>
  )
} 
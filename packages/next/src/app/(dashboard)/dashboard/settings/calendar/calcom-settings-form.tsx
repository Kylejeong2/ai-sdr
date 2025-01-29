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

const calComConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
  webhookSecret: z.string().min(1, 'Webhook Secret is required'),
  isActive: z.boolean().default(true),
  environment: z.enum(['production', 'development']).default('production')
})

type CalComConfigFormData = z.infer<typeof calComConfigSchema>

export function CalComSettingsForm() {
  const { team } = useTeam()
  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CalComConfigFormData>({
    resolver: zodResolver(calComConfigSchema),
    defaultValues: {
      apiKey: team?.calComConfig?.apiKey || '',
      webhookSecret: team?.calComConfig?.webhookSecret || '',
      isActive: team?.calComConfig?.isActive ?? true,
      environment: (team?.calComConfig?.environment || 'production') as 'production' | 'development'
    }
  })

  const isActive = watch('isActive')

  const onSubmit = async (data: CalComConfigFormData) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/settings/calendar/calcom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to save Cal.com settings')
      }

      toast.success('Cal.com settings saved successfully')
    } catch (error) {
      console.error('Error saving Cal.com settings:', error)
      toast.error('Failed to save Cal.com settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label>Integration Status</Label>
          <p className="text-sm text-gray-500">Enable or disable the Cal.com integration</p>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={(checked) => setValue('isActive', checked)}
        />
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            {...register('apiKey')}
            className="mt-1"
            disabled={!isActive}
          />
          {errors.apiKey && (
            <p className="text-sm text-red-500 mt-1">{errors.apiKey.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="webhookSecret">Webhook Secret</Label>
          <Input
            id="webhookSecret"
            type="password"
            {...register('webhookSecret')}
            className="mt-1"
            disabled={!isActive}
          />
          {errors.webhookSecret && (
            <p className="text-sm text-red-500 mt-1">{errors.webhookSecret.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="environment">Environment</Label>
          <select
            id="environment"
            {...register('environment')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            disabled={!isActive}
          >
            <option value="production">Production</option>
            <option value="development">Development</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving || !isActive}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {team?.calComConfig?.webhookUrl && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <Label>Webhook URL</Label>
          <p className="text-sm text-gray-600 mt-1">
            Use this URL in your Cal.com webhook settings:
          </p>
          <code className="block p-2 mt-2 bg-gray-100 rounded text-sm">
            {team.calComConfig.webhookUrl}
          </code>
        </div>
      )}
    </form>
  )
} 
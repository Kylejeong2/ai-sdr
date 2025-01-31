'use client'

import { useState } from 'react'
import { useOrganization, useUser } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { CalendarDays, Key } from 'lucide-react'

const webhookSchema = z.object({
  provider: z.enum(['calcom', 'calendly']),
  webhookUrl: z.string().url('Please enter a valid URL'),
  webhookSecret: z.string().min(10, 'Secret key must be at least 10 characters'),
  apiKey: z.string().min(1, 'API Key is required'),
})

export default function WebhooksPage() {
  const { organization } = useOrganization()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof webhookSchema>>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      provider: 'calcom',
      webhookUrl: '',
      webhookSecret: '',
      apiKey: '',
    },
  })

  async function onSubmit(values: z.infer<typeof webhookSchema>) {
    if (!organization?.id || !user?.id) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/webhooks/calendar/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          organizationId: organization.id,
        }),
      })

      if (!res.ok) throw new Error('Failed to save webhook configuration')

      toast.success('Calendar webhook configured successfully')
      form.reset()
    } catch (error) {
      toast.error('Failed to save webhook configuration')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text mb-2">
          Calendar Webhooks
        </h1>
        <p className="text-gray-400">
          Configure your calendar integration webhooks to sync calendar events
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6 border-gray-800 bg-black/40 backdrop-blur-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calendar Provider</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-black/50 border-gray-800">
                          <SelectValue placeholder="Select a calendar provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-black/90 border-gray-800">
                        <SelectItem value="calcom">Cal.com</SelectItem>
                        <SelectItem value="calendly">Calendly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose your calendar integration provider
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="https://your-webhook-url.com/webhook"
                          className="pl-10 bg-black/50 border-gray-800"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      The URL where calendar events will be sent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="webhookSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook Secret</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          type="password"
                          placeholder="Enter your webhook secret key"
                          className="pl-10 bg-black/50 border-gray-800"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Secret key used to verify webhook requests
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input
                          type="password"
                          placeholder="Enter your API key"
                          className="pl-10 bg-black/50 border-gray-800"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your {form.watch('provider') === 'calcom' ? 'Cal.com' : 'Calendly'} API key
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  )
}

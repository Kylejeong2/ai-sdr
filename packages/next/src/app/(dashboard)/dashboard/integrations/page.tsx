"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Calendar,
  Linkedin,
  Building2,
  Webhook,
  Power,
  Settings2,
  Trash,
} from "lucide-react"
import { sdrApi, type Integration } from "@/lib/api"

const INTEGRATION_TYPES = {
  crm: {
    title: "CRM",
    description: "Connect your CRM to sync leads and deals",
    icon: Building2,
    providers: [
      { id: "salesforce", name: "Salesforce" },
      { id: "hubspot", name: "HubSpot" },
      { id: "pipedrive", name: "Pipedrive" },
    ],
  },
  calendar: {
    title: "Calendar",
    description: "Connect your calendar for meeting scheduling",
    icon: Calendar,
    providers: [
      { id: "google", name: "Google Calendar" },
      { id: "outlook", name: "Outlook Calendar" },
      { id: "caldav", name: "CalDAV" },
    ],
  },
  linkedin: {
    title: "LinkedIn",
    description: "Connect LinkedIn for lead enrichment and outreach",
    icon: Linkedin,
    providers: [
      { id: "sales-navigator", name: "Sales Navigator" },
      { id: "recruiter", name: "Recruiter" },
    ],
  },
  webhook: {
    title: "Webhooks",
    description: "Send data to external systems via webhooks",
    icon: Webhook,
    providers: [
      { id: "zapier", name: "Zapier" },
      { id: "make", name: "Make.com" },
      { id: "n8n", name: "n8n" },
    ],
  },
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const data = await sdrApi.getIntegrations()
        setIntegrations(data)
      } catch (error) {
        console.error('Error fetching integrations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchIntegrations()
  }, [])

  const handleConnect = async (type: string, provider: string) => {
    try {
      // This would typically open OAuth flow or config modal
      const config = { /* OAuth tokens or config */ }
      const integration = await sdrApi.connectIntegration(type, provider, config)
      setIntegrations([...integrations, integration])
    } catch (error) {
      console.error('Error connecting integration:', error)
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await sdrApi.updateIntegration(id, { isActive })
      setIntegrations(
        integrations.map((i) =>
          i.id === id ? { ...i, isActive } : i
        )
      )
    } catch (error) {
      console.error('Error toggling integration:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await sdrApi.disconnectIntegration(id)
      setIntegrations(integrations.filter((i) => i.id !== id))
    } catch (error) {
      console.error('Error deleting integration:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {Object.entries(INTEGRATION_TYPES).map(([type, config]) => {
          const Icon = config.icon
          const existingIntegration = integrations.find(
            (i) => i.type === type
          )

          return (
            <Card key={type}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{config.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {existingIntegration ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Connected to {existingIntegration.provider}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last synced{" "}
                          {new Date(
                            existingIntegration.updatedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <Switch
                        checked={existingIntegration.isActive}
                        onCheckedChange={(checked) =>
                          handleToggle(existingIntegration.id, checked)
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // Open settings modal
                        }}
                      >
                        <Settings2 className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Disconnect
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Disconnect {config.title}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the integration and stop all
                              syncing. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDelete(existingIntegration.id)
                              }
                            >
                              Disconnect
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Select
                      onValueChange={(provider) =>
                        handleConnect(type, provider)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {config.providers.map((provider) => (
                          <SelectItem
                            key={provider.id}
                            value={provider.id}
                          >
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Open documentation
                      }}
                    >
                      View Documentation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 
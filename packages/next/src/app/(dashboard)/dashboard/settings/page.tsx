"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Settings,
  Bell,
  Mail,
  CreditCard,
  Users,
  Shield,
} from "lucide-react"

export default function SettingsPage() {
  const [emailSettings, setEmailSettings] = useState({
    dailyLimit: "100",
    fromName: "Sales Team",
    fromEmail: "sales@yourdomain.com",
    signature: "Best regards,\nThe Sales Team",
  })

  const [notifications, setNotifications] = useState({
    emailOpens: true,
    emailClicks: true,
    emailReplies: true,
    leadEnriched: true,
    dailyDigest: true,
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Time Zone</Label>
                <Select defaultValue="America/Los_Angeles">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Los_Angeles">
                      Pacific Time (US & Canada)
                    </SelectItem>
                    <SelectItem value="America/New_York">
                      Eastern Time (US & Canada)
                    </SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Opens</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a lead opens your email
                  </p>
                </div>
                <Switch
                  checked={notifications.emailOpens}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, emailOpens: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Clicks</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a lead clicks a link in your email
                  </p>
                </div>
                <Switch
                  checked={notifications.emailClicks}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, emailClicks: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Replies</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a lead replies to your email
                  </p>
                </div>
                <Switch
                  checked={notifications.emailReplies}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, emailReplies: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Lead Enrichment</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when lead data is enriched
                  </p>
                </div>
                <Switch
                  checked={notifications.leadEnriched}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, leadEnriched: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a daily summary of all activities
                  </p>
                </div>
                <Switch
                  checked={notifications.dailyDigest}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, dailyDigest: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Daily Email Limit</Label>
                <Input
                  type="number"
                  value={emailSettings.dailyLimit}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      dailyLimit: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>From Name</Label>
                <Input
                  value={emailSettings.fromName}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      fromName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>From Email</Label>
                <Input
                  type="email"
                  value={emailSettings.fromEmail}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      fromEmail: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email Signature</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={emailSettings.signature}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      signature: e.target.value,
                    })
                  }
                />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Current Plan</span>
                  <span>Pro ($99/month)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Next Invoice</span>
                  <span>Dec 31, 2023</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Payment Method</span>
                  <span>•••• 4242</span>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="outline">Update Payment Method</Button>
                <Button>Upgrade Plan</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      JD
                    </div>
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-muted-foreground">
                        john@company.com
                      </p>
                    </div>
                  </div>
                  <span className="text-sm">Owner</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      JS
                    </div>
                    <div>
                      <p className="font-medium">Jane Smith</p>
                      <p className="text-sm text-muted-foreground">
                        jane@company.com
                      </p>
                    </div>
                  </div>
                  <span className="text-sm">Admin</span>
                </div>
              </div>
              <Button>Invite Team Member</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>API Keys</Label>
                    <p className="text-sm text-muted-foreground">
                      Manage your API keys
                    </p>
                  </div>
                  <Button variant="outline">Manage Keys</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Management</Label>
                    <p className="text-sm text-muted-foreground">
                      View and manage your active sessions
                    </p>
                  </div>
                  <Button variant="outline">View Sessions</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
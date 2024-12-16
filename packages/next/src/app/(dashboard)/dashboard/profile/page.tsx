"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Loader2, Camera } from "lucide-react"

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [saving, setSaving] = useState(false)
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    title: "SDR Manager",
    company: "Acme Inc",
    phone: "+1 (555) 123-4567",
  })

  const [preferences, setPreferences] = useState({
    darkMode: true,
    emailDigest: true,
    desktopNotifications: true,
    slackNotifications: false,
  })

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center gap-8">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Profile Photo</h3>
                <p className="text-sm text-muted-foreground">
                  Click the camera icon to upload a new photo
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={personalInfo.firstName || user?.firstName || ""}
                  onChange={(e) =>
                    setPersonalInfo({
                      ...personalInfo,
                      firstName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={personalInfo.lastName || user?.lastName || ""}
                  onChange={(e) =>
                    setPersonalInfo({
                      ...personalInfo,
                      lastName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.emailAddresses[0]?.emailAddress} disabled />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={personalInfo.phone}
                  onChange={(e) =>
                    setPersonalInfo({
                      ...personalInfo,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={personalInfo.company}
                  onChange={(e) =>
                    setPersonalInfo({
                      ...personalInfo,
                      company: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={personalInfo.title}
                  onChange={(e) =>
                    setPersonalInfo({
                      ...personalInfo,
                      title: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle dark mode theme
                </p>
              </div>
              <Switch
                checked={preferences.darkMode}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, darkMode: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Digest</Label>
                <p className="text-sm text-muted-foreground">
                  Receive daily email summaries
                </p>
              </div>
              <Switch
                checked={preferences.emailDigest}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, emailDigest: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Desktop Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about important events
                </p>
              </div>
              <Switch
                checked={preferences.desktopNotifications}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    desktopNotifications: checked,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Slack Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Connect and receive notifications in Slack
                </p>
              </div>
              <Switch
                checked={preferences.slackNotifications}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    slackNotifications: checked,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
} 
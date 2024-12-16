"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Editor } from "@/components/editor"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Eye, ArrowLeft } from "lucide-react"
import { sdrApi, TeamMember, type EmailTemplate } from "@/lib/api"

const VARIABLE_OPTIONS = [
  { label: "First Name", value: "{{firstName}}" },
  { label: "Last Name", value: "{{lastName}}" },
  { label: "Company", value: "{{company}}" },
  { label: "Title", value: "{{title}}" },
  { label: "Industry", value: "{{industry}}" },
]

export default function TemplateEditorPage() {
  const router = useRouter()
  const params = useParams()
  const isNew = params.id === "new"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<EmailTemplate>({
    id: "",
    name: "",
    subject: "",
    content: "",
    variables: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    teamId: "",
    isShared: false,
    createdBy: {
      id: "",
      userId: "",
      teamId: "",
      role: "",
      leads: [],
      templates: [],
      activities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as TeamMember,
  })

  useEffect(() => {
    const fetchTemplate = async () => {
      if (isNew) {
        setLoading(false)
        return
      }

      try {
        const data = await sdrApi.getTemplate(params.id as string)
        setTemplate(data)
      } catch (error) {
        console.error('Error fetching template:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [isNew, params.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isNew) {
        await sdrApi.createTemplate(template)
      } else {
        await sdrApi.updateTemplate(template.id, template)
      }
      router.push("/dashboard/templates")
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setSaving(false)
    }
  }

  const insertVariable = (variable: string) => {
    setTemplate({
      ...template,
      content: template.content + " " + variable,
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/templates")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">
            {isNew ? "New Template" : "Edit Template"}
          </h2>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={template.name}
                onChange={(e) =>
                  setTemplate({ ...template, name: e.target.value })
                }
                placeholder="e.g. Initial Outreach"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={template.subject}
                onChange={(e) =>
                  setTemplate({ ...template, subject: e.target.value })
                }
                placeholder="e.g. Quick question about {{company}}"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Select
                onValueChange={(value) => insertVariable(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Insert variable" />
                </SelectTrigger>
                <SelectContent>
                  {VARIABLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                {template.variables.map((variable) => (
                  <Badge key={variable} variant="secondary">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>

            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit">
                <Editor
                  value={template.content}
                  onChange={(value) =>
                    setTemplate({ ...template, content: value })
                  }
                  placeholder="Write your email content here..."
                />
              </TabsContent>
              <TabsContent value="preview">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: template.content
                      .replace(/{{firstName}}/g, "John")
                      .replace(/{{lastName}}/g, "Doe")
                      .replace(/{{company}}/g, "Acme Inc")
                      .replace(/{{title}}/g, "CEO")
                      .replace(/{{industry}}/g, "Technology"),
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
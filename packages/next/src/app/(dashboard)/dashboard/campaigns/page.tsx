"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash } from "lucide-react"
import { sdrApi, type EmailTemplate, type Email } from "@/lib/api"
import { format, startOfToday, endOfToday, subDays } from "date-fns"
import { useRouter } from "next/navigation"
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

export default function CampaignsPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [recentEmails, setRecentEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesData, emailsData] = await Promise.all([
          sdrApi.getTemplates(),
          sdrApi.getEmails({ 
            from: subDays(new Date(), 7).toISOString(),
            limit: 10 
          })
        ])
        setTemplates(templatesData)
        setRecentEmails(emailsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getEmailStats = () => {
    const today = startOfToday()
    const todayEnd = endOfToday()
    
    const todayEmails = recentEmails.filter(
      email => new Date(email.createdAt) >= today && new Date(email.createdAt) <= todayEnd
    )

    const openRate = recentEmails.length > 0 
      ? (recentEmails.filter(e => e.openedAt).length / recentEmails.length * 100)
      : 0

    const responseRate = recentEmails.length > 0
      ? (recentEmails.filter(e => e.repliedAt).length / recentEmails.length * 100)
      : 0

    return {
      sentToday: todayEmails.length,
      openRate,
      responseRate
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await sdrApi.deleteTemplate(templateId)
      setTemplates(templates.filter(t => t.id !== templateId))
      setTemplateToDelete(null)
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const stats = getEmailStats()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Email Campaigns</h2>
        <Button onClick={() => router.push('/dashboard/templates/new')}>
          <Plus className="mr-2 h-4 w-4" /> New Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emails Sent Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sentToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.name}
                    </TableCell>
                    <TableCell>{template.subject}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(template.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/dashboard/templates/${template.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog open={templateToDelete === template.id} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive"
                              onClick={() => setTemplateToDelete(template.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this template? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteTemplate(template.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Emails</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEmails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell>{email.lead?.email || 'Unknown'}</TableCell>
                  <TableCell>{email.template?.name || 'Custom Email'}</TableCell>
                  <TableCell>
                    <Badge variant={email.repliedAt ? 'success' : email.openedAt ? 'secondary' : 'default'}>
                      {email.repliedAt ? 'Replied' : email.openedAt ? 'Opened' : 'Sent'}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(email.createdAt), 'MMM d, h:mm a')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 
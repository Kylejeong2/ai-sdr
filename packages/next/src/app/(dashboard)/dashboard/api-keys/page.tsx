'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Copy, Plus, Trash } from "lucide-react"
import { useState, useEffect } from "react"

interface ApiKey {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsed: string | null
}

export default function ApiKeysPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchApiKeys = async () => {
    try {
      // console.log("Fetching API keys...")
      const res = await fetch("/api/api-keys")
      // console.log("API keys response status:", res.status)
      if (!res.ok) {
        const error = await res.text()
        // console.error("Failed to fetch API keys:", error)
        throw new Error("Failed to fetch API keys", { cause: error })
      }
      const data = await res.json()
      // console.log("Fetched API keys:", data)
      setApiKeys(data)
    } catch (error) {
      // console.error("API keys fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch API keys",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const createApiKey = async () => {
    try {
      // console.log("Creating API key:", { name: newKeyName })
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      })
      // console.log("Create API key response status:", res.status)
      const data = await res.json()
      if (!res.ok) {
        // console.error("Failed to create API key:", data)
        throw new Error(data.error)
      }
      
      // console.log("API key created:", { id: data.id, prefix: data.prefix })
      setNewlyCreatedKey(data.key)
      toast({
        title: "API Key Created",
        description: "Make sure to copy your API key now. You won't be able to see it again.",
      })
      setIsCreating(false)
      setNewKeyName("")
      fetchApiKeys()
    } catch (error) {
      // console.error("API key creation error:", error)
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      })
    }
  }

  const revokeApiKey = async (id: string) => {
    try {
      // console.log("Revoking API key:", id)
      const res = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
      })
      // console.log("Revoke API key response status:", res.status)
      if (!res.ok) {
        const error = await res.text()
        // console.error("Failed to revoke API key:", error)
        throw new Error("Failed to revoke key", { cause: error })
      }
      
      // console.log("API key revoked successfully")
      toast({
        title: "API Key Revoked",
        description: "The API key has been successfully revoked",
      })
      fetchApiKeys()
    } catch (error) {
      // console.error("API key revocation error:", error)
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    })
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage API keys for accessing the Graham SDR API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            {!isCreating ? (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create API Key
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="API Key Name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
                <Button onClick={createApiKey}>Create</Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {newlyCreatedKey && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-yellow-800">New API Key Created</p>
                  <p className="text-xs text-yellow-700 mt-1">Copy this key now. You won't be able to see it again.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(newlyCreatedKey)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <code className="mt-2 block p-2 bg-black rounded text-sm font-mono">
                {newlyCreatedKey}
              </code>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>{key.name}</TableCell>
                  <TableCell>
                    <code className="px-2 py-1 bg-black-100 rounded">{key.prefix}</code>
                  </TableCell>
                  <TableCell>{formatDistanceToNow(new Date(key.createdAt))} ago</TableCell>
                  <TableCell>
                    {key.lastUsed 
                      ? formatDistanceToNow(new Date(key.lastUsed)) + ' ago'
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeApiKey(key.id)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 
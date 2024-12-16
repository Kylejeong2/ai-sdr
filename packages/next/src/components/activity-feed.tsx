"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { Activity } from "@/lib/api"
import {
  Mail,
  Tag,
  UserPlus,
  MessageSquare,
  Star,
  RefreshCw,
} from "lucide-react"

interface ActivityFeedProps {
  activities: Activity[]
  maxHeight?: string
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "email_sent":
      return <Mail className="h-4 w-4" />
    case "tag_added":
      return <Tag className="h-4 w-4" />
    case "lead_assigned":
      return <UserPlus className="h-4 w-4" />
    case "comment_added":
      return <MessageSquare className="h-4 w-4" />
    case "lead_converted":
      return <Star className="h-4 w-4" />
    case "lead_enriched":
      return <RefreshCw className="h-4 w-4" />
    default:
      return null
  }
}

export function ActivityFeed({ activities, maxHeight = "600px" }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={`h-[${maxHeight}] pr-4`}>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 border-b pb-4 last:border-0"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {activity.teamMember.userId[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {activity.teamMember.userId}
                    </span>
                    <span className="text-muted-foreground">
                      {getActivityIcon(activity.type)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{activity.description}</p>
                  {activity.metadata && (
                    <pre className="mt-2 rounded bg-muted p-2 text-xs">
                      {JSON.stringify(activity.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 
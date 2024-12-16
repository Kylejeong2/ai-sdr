'use client';

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { Comment, sdrApi } from "@/lib/api"
import { Loader2 } from "lucide-react"

interface CommentsProps {
  leadId: string
  comments: Comment[]
  onCommentAdded?: (comment: Comment) => void
}

export default function Comments({ leadId, comments, onCommentAdded }: CommentsProps) {
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      const comment = await sdrApi.addComment(leadId, newComment)
      setNewComment("")
      onCommentAdded?.(comment)
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmitting(false)
    }
  }, [leadId, newComment, submitting, onCommentAdded])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex items-start gap-4 border-b pb-4 last:border-0"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {comment.createdBy.userId[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {comment.createdBy.userId}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
              disabled={submitting}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Comment"
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
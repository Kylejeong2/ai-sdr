"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { type Lead } from "@/lib/api"
import { VariantProps } from "class-variance-authority"

interface RecentLeadsProps {
  leads: Lead[]
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  const getStatusColor = (status: string): VariantProps<typeof badgeVariants>['variant'] => {
    switch (status) {
      case 'NEW':
        return 'default';
      case 'ENRICHED':
        return 'secondary';
      case 'EMAIL_QUEUED':
      case 'EMAIL_SENT':
        return 'destructive';
      case 'RESPONDED':
      case 'CONVERTED':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {lead.firstName?.[0]}
                  {lead.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">
                  {lead.firstName} {lead.lastName}
                </span>
                <span className="text-sm text-muted-foreground">
                  {lead.email}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{lead.company}</span>
                <span className="text-sm text-muted-foreground">
                  {lead.title}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusColor(lead.status)}>
                {lead.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 
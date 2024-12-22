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
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  MoreHorizontal,
  Tag,
  Mail,
  UserPlus,
  Trash,
} from "lucide-react"
import { sdrApi, type Lead } from "@/lib/api"
import { format } from "date-fns"
import { VariantProps } from "class-variance-authority"
import { DateRangePicker } from "@/components/date-range-picker"
import { Label } from "@/components/ui/label"
import { DateRange } from "react-day-picker"

type SortField = "name" | "company" | "status" | "type" | "createdAt"
type SortOrder = "asc" | "desc"

interface FilterState {
  dateRange: DateRange | undefined
  companies: string[]
  industries: string[]
  tags: string[]
  assignees: string[]
  emailTypes: string[]
  statuses: string[]
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>({
    dateRange: undefined,
    companies: [],
    industries: [],
    tags: [],
    assignees: [],
    emailTypes: [],
    statuses: [],
  })

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await sdrApi.getLeads()
        setLeads(data)
      } catch (error) {
        console.error('Error fetching leads:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [])

  const handleBulkAction = async (action: string) => {
    if (selectedLeads.length === 0) return

    switch (action) {
      case 'tag':
        // Implement tag selection and application
        break
      case 'assign':
        // Implement team member assignment
        break
      case 'email':
        // Implement bulk email sending
        break
      case 'delete':
        // Implement bulk deletion with confirmation
        break
      case 'export':
        // Generate and download CSV
        const csv = generateCSV(leads.filter(l => selectedLeads.includes(l.id)))
        downloadCSV(csv, 'leads-export.csv')
        break
    }
  }

  const generateCSV = (leads: Lead[]) => {
    const headers = ['First Name', 'Last Name', 'Email', 'Company', 'Title', 'Status']
    const rows = leads.map(lead => [
      lead.firstName || '',
      lead.lastName || '',
      lead.email,
      lead.company || '',
      lead.title || '',
      lead.status,
    ])
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedLeads(checked ? leads.map(l => l.id) : [])
  }

  const handleSelectLead = (leadId: string, checked: boolean) => {
    setSelectedLeads(prev => 
      checked ? [...prev, leadId] : prev.filter(id => id !== leadId)
    )
  }

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    )
  }

  const applyFilters = (lead: Lead) => {
    const matchesSearch =
      searchQuery === "" ||
      lead.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      filters.statuses.length === 0 || filters.statuses.includes(lead.status)

    const matchesEmailType =
      filters.emailTypes.length === 0 || filters.emailTypes.includes(lead.emailType)

    const matchesCompany =
      filters.companies.length === 0 || (lead.company && filters.companies.includes(lead.company))

    const matchesIndustry =
      filters.industries.length === 0 || (lead.industry && filters.industries.includes(lead.industry))

    const matchesDateRange =
      (!filters.dateRange?.from || new Date(lead.createdAt) >= filters.dateRange.from) &&
      (!filters.dateRange?.to || new Date(lead.createdAt) <= filters.dateRange.to)

    return (
      matchesSearch &&
      matchesStatus &&
      matchesEmailType &&
      matchesCompany &&
      matchesIndustry &&
      matchesDateRange
    )
  }

  const filteredAndSortedLeads = leads
    .filter(applyFilters)
    .sort((a, b) => {
      const order = sortOrder === "asc" ? 1 : -1
      switch (sortField) {
        case "name":
          return (
            order *
            ((a.firstName || "") + (a.lastName || "")).localeCompare(
              (b.firstName || "") + (b.lastName || "")
            )
          )
        case "company":
          return order * ((a.company || "").localeCompare(b.company || ""))
        case "status":
          return order * (a.status.localeCompare(b.status))
        case "type":
          return order * (a.emailType.localeCompare(b.emailType))
        case "createdAt":
          return (
            order *
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          )
        default:
          return 0
      }
    })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
        <div className="flex gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Leads</SheetTitle>
                <SheetDescription>
                  Refine your leads list using multiple criteria
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <DateRangePicker
                    value={filters.dateRange}
                    onChange={(range) => setFilters({ ...filters, dateRange: range })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Companies</Label>
                  <Select
                    value={filters.companies[0]}
                    onValueChange={(value) =>
                      setFilters({ ...filters, companies: [value] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set(leads.map((l) => l.company)))
                        .filter(Boolean)
                        .map((company) => (
                          <SelectItem key={company} value={company!}>
                            {company}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Add more filter sections for industries, tags, etc. */}
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="outline" onClick={() => handleBulkAction('export')}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Lead
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(l => l.status === 'NEW').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enriched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(l => l.status === 'ENRICHED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(l => l.status === 'CONVERTED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              {selectedLeads.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Bulk Actions ({selectedLeads.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleBulkAction('tag')}>
                      <Tag className="mr-2 h-4 w-4" /> Add Tags
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('assign')}>
                      <UserPlus className="mr-2 h-4 w-4" /> Assign To
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('email')}>
                      <Mail className="mr-2 h-4 w-4" /> Send Email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleBulkAction('delete')}
                      className="text-destructive"
                    >
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-8">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedLeads.length === leads.length &&
                          leads.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-2"
                      >
                        Name {getSortIcon("name")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("company")}
                        className="flex items-center gap-2"
                      >
                        Company {getSortIcon("company")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("status")}
                        className="flex items-center gap-2"
                      >
                        Status {getSortIcon("status")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("type")}
                        className="flex items-center gap-2"
                      >
                        Type {getSortIcon("type")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("createdAt")}
                        className="flex items-center gap-2"
                      >
                        Created {getSortIcon("createdAt")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) =>
                            handleSelectLead(lead.id, checked as boolean)
                          }
                        />
                      </TableCell>
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
                      <TableCell>
                        <Badge variant="outline">{lead.emailType}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Send Email</DropdownMenuItem>
                            <DropdownMenuItem>Add Tags</DropdownMenuItem>
                            <DropdownMenuItem>Assign To</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
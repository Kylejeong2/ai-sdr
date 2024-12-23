"use client"

import { useEffect, useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GripVertical,
  Mail,
  Clock,
  Trash,
  Save,
  Play,
  Pause,
} from "lucide-react"
import { sdrApi } from "@/lib/api"

interface SequenceStep {
  id: string
  type: "email" | "wait"
  templateId?: string
  waitDays?: number
}

interface Sequence {
  id: string
  name: string
  description?: string
  steps: SequenceStep[]
  isActive: boolean
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [selectedSequence, setSelectedSequence] = useState<Sequence>({
    id: "new",
    name: "New Sequence",
    steps: [],
    isActive: false,
  })
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sequencesData, templatesData] = await Promise.all([
          sdrApi.getSequences(),
          sdrApi.getTemplates(),
        ])
        setSequences(sequencesData)
        setTemplates(templatesData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(selectedSequence.steps)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSelectedSequence({
      ...selectedSequence,
      steps: items,
    })
  }

  const addStep = (type: "email" | "wait") => {
    const newStep: SequenceStep = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      ...(type === "wait" ? { waitDays: 1 } : {}),
    }

    setSelectedSequence({
      ...selectedSequence,
      steps: [...selectedSequence.steps, newStep],
    })
  }

  const updateStep = (index: number, updates: Partial<SequenceStep>) => {
    const newSteps = [...selectedSequence.steps]
    newSteps[index] = { ...newSteps[index], ...updates }
    setSelectedSequence({
      ...selectedSequence,
      steps: newSteps,
    })
  }

  const removeStep = (index: number) => {
    const newSteps = [...selectedSequence.steps]
    newSteps.splice(index, 1)
    setSelectedSequence({
      ...selectedSequence,
      steps: newSteps,
    })
  }

  const handleSave = async () => {
    try {
      if (selectedSequence.id === "new") {
        const newSequence = await sdrApi.createSequence({
          name: selectedSequence.name,
          description: selectedSequence.description,
          steps: selectedSequence.steps,
          isActive: selectedSequence.isActive
        })
        setSequences([...sequences, newSequence])
        setSelectedSequence(newSequence)
      } else {
        const updatedSequence = await sdrApi.updateSequence(selectedSequence.id, {
          name: selectedSequence.name,
          description: selectedSequence.description,
          steps: selectedSequence.steps,
          isActive: selectedSequence.isActive
        })
        setSequences(
          sequences.map((seq) =>
            seq.id === selectedSequence.id ? updatedSequence : seq
          )
        )
        setSelectedSequence(updatedSequence)
      }
    } catch (error) {
      console.error('Error saving sequence:', error)
    }
  }

  const toggleSequenceStatus = async () => {
    const newStatus = !selectedSequence.isActive
    try {
      const updatedSequence = await sdrApi.updateSequence(selectedSequence.id, {
        isActive: newStatus
      })
      setSelectedSequence(updatedSequence)
      setSequences(
        sequences.map((seq) =>
          seq.id === selectedSequence.id ? updatedSequence : seq
        )
      )
    } catch (error) {
      console.error('Error updating sequence status:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Email Sequences</h2>
        <div className="flex gap-4">
          <Select
            value={selectedSequence.id}
            onValueChange={(value) => {
              const sequence = sequences.find((s) => s.id === value)
              setSelectedSequence(
                sequence || {
                  id: "new",
                  name: "New Sequence",
                  steps: [],
                  isActive: false,
                }
              )
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select sequence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New Sequence</SelectItem>
              {sequences.map((sequence) => (
                <SelectItem key={sequence.id} value={sequence.id}>
                  {sequence.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Sequence
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Sequence Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sequence Name</Label>
                  <Input
                    value={selectedSequence.name}
                    onChange={(e) =>
                      setSelectedSequence({
                        ...selectedSequence,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={selectedSequence.description}
                    onChange={(e) =>
                      setSelectedSequence({
                        ...selectedSequence,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="steps">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {selectedSequence.steps.map((step, index) => (
                        <Draggable
                          key={step.id}
                          draggableId={step.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="relative"
                            >
                              <Card>
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-4">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-move"
                                    >
                                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    {step.type === "email" ? (
                                      <div className="flex-1 space-y-2">
                                        <Label>Email Template</Label>
                                        <Select
                                          value={step.templateId}
                                          onValueChange={(value) =>
                                            updateStep(index, {
                                              templateId: value,
                                            })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select template" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {templates.map((template) => (
                                              <SelectItem
                                                key={template.id}
                                                value={template.id}
                                              >
                                                {template.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    ) : (
                                      <div className="flex-1 space-y-2">
                                        <Label>Wait Duration (days)</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={step.waitDays}
                                          onChange={(e) =>
                                            updateStep(index, {
                                              waitDays: parseInt(e.target.value),
                                            })
                                          }
                                        />
                                      </div>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeStep(index)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => addStep("email")}
                  className="flex-1"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Add Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addStep("wait")}
                  className="flex-1"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Add Wait
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Sequence Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSequenceStatus}
                    disabled={selectedSequence.id === "new"}
                  >
                    {selectedSequence.isActive ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Steps</span>
                  <span>{selectedSequence.steps.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Email Steps</span>
                  <span>
                    {
                      selectedSequence.steps.filter(
                        (s) => s.type === "email"
                      ).length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Wait Steps</span>
                  <span>
                    {
                      selectedSequence.steps.filter(
                        (s) => s.type === "wait"
                      ).length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Duration</span>
                  <span>
                    {selectedSequence.steps.reduce(
                      (acc, step) =>
                        acc + (step.type === "wait" ? step.waitDays || 0 : 0),
                      0
                    )}{" "}
                    days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
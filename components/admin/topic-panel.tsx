"use client"

import { useState } from "react"
import type { Employee } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDateISO } from "@/lib/helpers"
import { Plus, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface TopicPanelProps {
  employees: Employee[]
}

export default function TopicPanel({ employees }: TopicPanelProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id.toString() || "")
  const [topicText, setTopicText] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const handleAddTopic = async () => {
    if (!topicText.trim()) return

    setLoading(true)
    try {
      await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          date: formatDateISO(new Date()),
          topic_text: topicText,
        }),
      })

      setTopicText("")
    } catch (error) {
      console.error("Error adding topic:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateTopics = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/topics/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate topics")
      }

      const result = await response.json()
      toast.success(`Generated topics successfully! (${result.coder_topics} coder, ${result.peeper_topics} peeper, ${result.insta_topics} Instagram)`)
    } catch (error: any) {
      console.error("Error generating topics:", error)
      toast.error(error.message || "Failed to generate topics. Make sure OPENAI_API_KEY is set.")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">Auto-Generate Daily Topics</h3>
          <Button
            onClick={handleGenerateTopics}
            disabled={generating}
            className="gap-2"
            variant="default"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Topics (AI)
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Uses OpenAI to generate unique YouTube topics for each employee and 7 shared Instagram topics. This runs automatically at 8:00 AM daily, but you can trigger it manually here.
        </p>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3 text-foreground">Manual Topic Entry</h3>
        <div className="flex gap-4 mb-2">
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter topic suggestion..."
            value={topicText}
            onChange={(e) => setTopicText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTopic()}
            disabled={loading}
          />
          <Button onClick={handleAddTopic} disabled={loading || !topicText.trim()} className="gap-2">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          Topics added here will appear on the employee's dashboard for today
        </p>
      </div>
    </div>
  )
}

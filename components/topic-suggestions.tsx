"use client"

import type { Topic } from "@/lib/types"

interface TopicSuggestionsProps {
  topics: Topic[]
  employeeId: number
}

export default function TopicSuggestions({ topics }: TopicSuggestionsProps) {
  return (
    <div className="space-y-3">
      {topics.length === 0 ? (
        <p className="text-sm text-muted-foreground">No topics suggested yet</p>
      ) : (
        topics.map((topic) => (
          <div key={topic.id} className="p-3 bg-accent/10 border border-accent rounded-lg">
            <p className="text-sm text-foreground">{topic.topic_text}</p>
          </div>
        ))
      )}
    </div>
  )
}

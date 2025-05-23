"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Send, Loader2, FileText } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: string[]
}

interface QueryResponse {
  answer: string
  sources: string[]
  context_used: boolean
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [maxSources, setMaxSources] = useState(3)
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  
    if (!input.trim()) return
  
    const userMessage: Message = {
      role: "user",
      content: input,
    }
  
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)
    setIsStreaming(true)
  
    const newAssistantMessage: Message = {
      role: "assistant",
      content: "",
      sources: [],
    }
  
    setMessages((prev) => [...prev, newAssistantMessage])
  
    const eventSource = new EventSource(
      `http://localhost:8000/api/v1/query/stream?question=${encodeURIComponent(input)}&k=${maxSources}`
    )
  
    eventSource.onmessage = (event) => {
      const data = event.data?.trim()
      if (data === "[END]") {
        eventSource.close()
        setLoading(false)
        setIsStreaming(false)
        return
      }

      setMessages((prev) => {
        const updatedMessages = [...prev]
        const last = updatedMessages[updatedMessages.length - 1]
        last.content += data + " "
        return updatedMessages
      })
    }

    
  
    eventSource.onerror = (err) => {
      console.error("SSE Error:", err)
      eventSource.close()
      setLoading(false)
      setIsStreaming(false)
  
      setMessages((prev) => [
        ...prev.slice(0, -1), // remove the incomplete assistant message
        {
          role: "assistant",
          content: "Sorry, I encountered an error while processing your request. Please try again later.",
        },
      ])
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Assistant</CardTitle>
        <CardDescription>Ask questions about medyouin documents in the knowledge base</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Max Sources: {maxSources}</label>
          </div>
          <Slider value={[maxSources]} min={1} max={10} step={1} onValueChange={(value) => setMaxSources(value[0])} />
        </div>

        <Card className="border bg-muted/40">
          <ScrollArea className="h-[400px] w-full rounded-md">
            <div className="p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No messages yet. Start by asking a question.</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col max-w-[80%] rounded-lg p-4",
                      message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted mr-auto",
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-primary/20 text-xs">
                        <div className="font-semibold mb-1">Sources:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {message.sources.map((source, idx) => (
                            <li key={idx} className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{source.split("/").pop()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </Card>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="w-full flex gap-2">
          <Input
            placeholder="Ask a question about the medical documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

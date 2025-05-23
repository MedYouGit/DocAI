"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Database, Brain, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface HealthStatus {
  status: string
  chroma_db_ready: boolean
  llm_ready: boolean
  details?: {
    chroma_docs_found?: number
    llm_response?: string
  }
}

export default function Dashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<string>("Never")

  const checkHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:8000/api/v1/health")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setHealth(data)
      setError(null)
      setLastChecked(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check system health")
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getSystemStatus = () => {
    if (!health) return "unknown"
    if (health.status === "operational" || 
        (health.chroma_db_ready && health.llm_ready)) {
      return "healthy"
    }
    return "degraded"
  }

  const systemStatus = getSystemStatus()

  if (loading && !health) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Checking system components...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Current status of the RAG system components
                {lastChecked && (
                  <span className="text-xs text-muted-foreground block mt-1">
                    Last checked: {lastChecked}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkHealth}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>
                {error}. Please check:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>API server is running at http://localhost:8000</li>
                  <li>Ollama is running at http://localhost:11434</li>
                  <li>Network connectivity</li>
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="mb-6">
                <Alert variant={systemStatus === "healthy" ? "default" : "warning"}>
                  {systemStatus === "healthy" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <AlertTitle>
                    System Status: {systemStatus === "healthy" ? "Operational" : "Degraded"}
                  </AlertTitle>
                  <AlertDescription>
                    {systemStatus === "healthy"
                      ? "All components are functioning properly."
                      : "Some components are not functioning properly. Check details below."}
                  </AlertDescription>
                </Alert>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      <CardTitle className="text-lg">Vector Database</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {health?.chroma_db_ready ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>Connected</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span>Disconnected</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {health?.chroma_db_ready
                        ? `Found ${health.details?.chroma_docs_found || 0} documents.`
                        : "ChromaDB is not accessible. Check if Chroma is running."}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      <CardTitle className="text-lg">LLM Service</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {health?.llm_ready ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>Connected</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span>Disconnected</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {health?.llm_ready
                        ? health.details?.llm_response 
                          ? `Response: "${health.details.llm_response}"`
                          : "Ollama LLM service is responding."
                        : "Ollama LLM service is not accessible. Check if Ollama is running."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Guide</CardTitle>
          <CardDescription>Steps to resolve common issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(!health?.chroma_db_ready || !health?.llm_ready) && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Degraded System Status</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1">
                    {!health?.chroma_db_ready && (
                      <li>
                        <strong>ChromaDB:</strong> Ensure Chroma is running and the database path is correct.
                        Try resetting with: <code>rm -rf ./chroma_db</code>
                      </li>
                    )}
                    {!health?.llm_ready && (
                      <li>
                        <strong>Ollama:</strong> Verify Ollama is running (<code>ollama serve</code>) and models are pulled:
                        <code className="block mt-1">ollama pull deepseek-r1:7b &amp;&amp; ollama pull mxbai-embed-large</code>
                      </li>
                    )}
                    <li>Check API server logs for detailed error messages</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Service Status</h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="font-medium">API Server:</span>
                    {error ? (
                      <span className="text-red-500">Not reachable</span>
                    ) : (
                      <span className="text-green-500">Running</span>
                    )}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-medium">Ollama:</span>
                    {health?.llm_ready ? (
                      <span className="text-green-500">Running</span>
                    ) : (
                      <span className="text-red-500">Not responding</span>
                    )}
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={checkHealth}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-check Status
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="http://localhost:8000/api/v1/docs" target="_blank">
                      Open API Docs
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
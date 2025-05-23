"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, CheckCircle, RefreshCw, FileText } from "lucide-react"

interface VerificationResponse {
  status: string
  sample_document?: {
    source: string
    content: string
  }
}

export default function VerifyIngestion() {
  const [verification, setVerification] = useState<VerificationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verifyIngestion = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("http://localhost:8000/api/v1/ingest/verify")

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`)
      }

      const data = await response.json()
      setVerification(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify ingestion")
      setVerification(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    verifyIngestion()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Document Ingestion</CardTitle>
        <CardDescription>Check if documents have been properly ingested into the vector database</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : verification ? (
          <div className="space-y-4">
            <Alert variant={verification.status.includes("found") ? "default" : "warning"}>
              {verification.status.includes("found") ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <AlertTitle>{verification.status}</AlertTitle>
              <AlertDescription>
                {verification.status.includes("found")
                  ? "Documents have been successfully ingested into the vector database."
                  : "No documents found in the vector database. Please upload documents first."}
              </AlertDescription>
            </Alert>

            {verification.sample_document && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <CardTitle className="text-sm">Sample Document</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium">Source:</span>
                      <p className="text-sm">{verification.sample_document.source}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium">Content Sample:</span>
                      <p className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded-md">
                        {verification.sample_document.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No verification data</AlertTitle>
            <AlertDescription>Click the verify button to check document ingestion status.</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={verifyIngestion} disabled={loading} variant="outline">
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Verify Again
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

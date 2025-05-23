"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { FileUp, FolderUp, AlertCircle, Loader2, File } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface IngestResponse {
  message: string
  chunks_added: number
  file_name: string
}

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<IngestResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [directoryProcessing, setDirectoryProcessing] = useState(false)
  const [directoryResults, setDirectoryResults] = useState<IngestResponse[]>([])
  const [directoryError, setDirectoryError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const uploadFile = async () => {
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported")
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 5
          return newProgress >= 90 ? 90 : newProgress
        })
      }, 200)

      const response = await fetch("http://localhost:8000/api/v1/ingest/pdf", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to upload file")
      }

      const data: IngestResponse = await response.json()
      setResults((prev) => [data, ...prev])
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  const processDirectory = async () => {
    setDirectoryProcessing(true)
    setDirectoryError(null)

    try {
      const response = await fetch("http://localhost:8000/api/v1/ingest/directory", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to process directory")
      }

      const data: IngestResponse[] = await response.json()
      setDirectoryResults(data)
    } catch (err) {
      setDirectoryError(err instanceof Error ? err.message : "Failed to process directory")
    } finally {
      setDirectoryProcessing(false)
    }
  }

  return (
    <Tabs defaultValue="upload-file">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload-file">Upload Single PDF</TabsTrigger>
        <TabsTrigger value="process-directory">Process Directory</TabsTrigger>
      </TabsList>

      <TabsContent value="upload-file">
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF Document</CardTitle>
            <CardDescription>Upload a PDF document to be processed and added to the knowledge base</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="pdf-upload">PDF Document</Label>
                <Input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </div>

              {file && (
                <div className="flex items-center gap-2 text-sm">
                  <File className="h-4 w-4" />
                  <span>{file.name}</span>
                  <span className="text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={uploadFile} disabled={!file || uploading} className="w-full sm:w-auto">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload and Process
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {results.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Upload Results</CardTitle>
              <CardDescription>Recent document processing results</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <File className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{result.file_name}</h4>
                            <p className="text-sm text-muted-foreground">{result.message}</p>
                          </div>
                        </div>
                        <div className="text-sm font-medium">{result.chunks_added} chunks</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="process-directory">
        <Card>
          <CardHeader>
            <CardTitle>Process Directory</CardTitle>
            <CardDescription>Process all PDF files in the configured data directory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  This will process all PDF files in the configured data directory: <code>./data</code>
                </AlertDescription>
              </Alert>

              {directoryError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{directoryError}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={processDirectory} disabled={directoryProcessing} className="w-full sm:w-auto">
              {directoryProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Directory
                </>
              ) : (
                <>
                  <FolderUp className="mr-2 h-4 w-4" />
                  Process All PDFs
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {directoryResults.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Directory Processing Results</CardTitle>
              <CardDescription>Results of processing the data directory</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-4">
                  {directoryResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <File className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{result.file_name}</h4>
                            <p className="text-sm text-muted-foreground">{result.message}</p>
                          </div>
                        </div>
                        <div className="text-sm font-medium">{result.chunks_added} chunks</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}

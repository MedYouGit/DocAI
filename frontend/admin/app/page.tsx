import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Dashboard from "@/components/dashboard"
import ChatInterface from "@/components/chat-interface"
import DocumentUpload from "@/components/document-upload"
import VerifyIngestion from "@/components/verify-ingestion"

export default function Home() {
  return (
    <div className="container mx-auto py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">MedYouIN RAG System</h1>
        <p className="text-muted-foreground">Professional document retrieval and question answering</p>
      </header>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="verify">Verify Ingestion</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <ChatInterface />
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <DocumentUpload />
        </TabsContent>

        <TabsContent value="verify" className="mt-6">
          <VerifyIngestion />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <Dashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

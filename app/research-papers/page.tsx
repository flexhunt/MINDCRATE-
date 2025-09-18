"use client"
import { PaperUploadForm } from "@/components/research-papers/paper-upload-form"
import { PaperSearch } from "@/components/research-papers/paper-search"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Search, FileText, Brain } from "lucide-react"

export default function ResearchPapersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Research Papers</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload, search, and explore psychological research papers with AI-powered insights and citations
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Papers
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Paper
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Research Papers
                </CardTitle>
                <CardDescription>
                  Find relevant research papers using advanced search with AI-powered insights and automatic citations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaperSearch />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Research Paper
                </CardTitle>
                <CardDescription>
                  Upload PDF research papers to make them searchable and generate automatic citations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaperUploadForm />
              </CardContent>
            </Card>

            {/* Features Overview */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="h-5 w-5 text-blue-500" />
                    AI-Powered Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our AI automatically extracts key insights, methodologies, and findings from uploaded papers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-green-500" />
                    Smart Citations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Generate properly formatted citations and discover related research automatically
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

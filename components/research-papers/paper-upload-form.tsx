"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaperUploadFormProps {
  onUploadSuccess?: (paper: any) => void
}

export function PaperUploadForm({ onUploadSuccess }: PaperUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    authors: "",
    abstract: "",
    keywords: "",
    category: "",
    journal: "",
    publicationDate: "",
    doi: "",
  })
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file",
          variant: "destructive",
        })
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 50MB",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      })
      return
    }

    if (!formData.title || !formData.authors) {
      toast({
        title: "Missing required fields",
        description: "Title and authors are required",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", selectedFile)
      uploadFormData.append("title", formData.title)
      uploadFormData.append("authors", formData.authors)
      uploadFormData.append("abstract", formData.abstract)
      uploadFormData.append("keywords", formData.keywords)
      uploadFormData.append("category", formData.category)
      uploadFormData.append("journal", formData.journal)
      uploadFormData.append("publicationDate", formData.publicationDate)
      uploadFormData.append("doi", formData.doi)

      const response = await fetch("/api/research-papers/upload", {
        method: "POST",
        body: uploadFormData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      toast({
        title: "Upload successful",
        description: "Your research paper has been uploaded successfully",
      })

      // Reset form
      setSelectedFile(null)
      setFormData({
        title: "",
        authors: "",
        abstract: "",
        keywords: "",
        category: "",
        journal: "",
        publicationDate: "",
        doi: "",
      })

      // Reset file input
      const fileInput = document.getElementById("paper-file") as HTMLInputElement
      if (fileInput) fileInput.value = ""

      onUploadSuccess?.(result.paper)
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload research paper",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Research Paper
        </CardTitle>
        <CardDescription>Share your research with the community. Upload PDF files up to 50MB.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="paper-file">PDF File *</Label>
            <div className="flex items-center gap-4">
              <Input
                id="paper-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="flex-1"
                disabled={isUploading}
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {selectedFile.name}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter the paper title"
              disabled={isUploading}
              required
            />
          </div>

          {/* Authors */}
          <div className="space-y-2">
            <Label htmlFor="authors">Authors *</Label>
            <Input
              id="authors"
              value={formData.authors}
              onChange={(e) => handleInputChange("authors", e.target.value)}
              placeholder="Enter authors separated by commas"
              disabled={isUploading}
              required
            />
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <Label htmlFor="abstract">Abstract</Label>
            <Textarea
              id="abstract"
              value={formData.abstract}
              onChange={(e) => handleInputChange("abstract", e.target.value)}
              placeholder="Enter the paper abstract"
              rows={4}
              disabled={isUploading}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange("category", value)}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="psychology">Psychology</SelectItem>
                <SelectItem value="neuroscience">Neuroscience</SelectItem>
                <SelectItem value="cognitive-science">Cognitive Science</SelectItem>
                <SelectItem value="behavioral-science">Behavioral Science</SelectItem>
                <SelectItem value="mental-health">Mental Health</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Journal and Publication Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="journal">Journal</Label>
              <Input
                id="journal"
                value={formData.journal}
                onChange={(e) => handleInputChange("journal", e.target.value)}
                placeholder="Journal name"
                disabled={isUploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publicationDate">Publication Date</Label>
              <Input
                id="publicationDate"
                type="date"
                value={formData.publicationDate}
                onChange={(e) => handleInputChange("publicationDate", e.target.value)}
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Keywords and DOI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => handleInputChange("keywords", e.target.value)}
                placeholder="Enter keywords separated by commas"
                disabled={isUploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doi">DOI</Label>
              <Input
                id="doi"
                value={formData.doi}
                onChange={(e) => handleInputChange("doi", e.target.value)}
                placeholder="10.1000/example"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Paper
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

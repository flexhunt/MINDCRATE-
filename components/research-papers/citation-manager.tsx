"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Quote, Plus, ExternalLink, Calendar, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Citation {
  id: string
  citation_text: string
  page_number: number
  context: string
  created_at: string
  citing_paper: {
    id: string
    title: string
    authors: string[]
    publication_date: string
    journal: string
  }
  cited_paper: {
    id: string
    title: string
    authors: string[]
    publication_date: string
    journal: string
  }
}

interface CitationManagerProps {
  paperId: string
  canEdit?: boolean
}

export function CitationManager({ paperId, canEdit = false }: CitationManagerProps) {
  const [citations, setCitations] = useState<Citation[]>([])
  const [references, setReferences] = useState<Citation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingCitation, setIsAddingCitation] = useState(false)
  const [newCitation, setNewCitation] = useState({
    citedPaperId: "",
    citationText: "",
    pageNumber: "",
    context: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchCitations()
  }, [paperId])

  const fetchCitations = async () => {
    try {
      const response = await fetch(`/api/research-papers/${paperId}/citations`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch citations")
      }

      setCitations(data.citations)
      setReferences(data.references)
    } catch (error: any) {
      console.error("Error fetching citations:", error)
      toast({
        title: "Error",
        description: "Failed to load citations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCitation = async () => {
    if (!newCitation.citedPaperId || !newCitation.citationText) {
      toast({
        title: "Missing information",
        description: "Please provide the cited paper ID and citation text",
        variant: "destructive",
      })
      return
    }

    setIsAddingCitation(true)

    try {
      const response = await fetch(`/api/research-papers/${paperId}/citations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          citedPaperId: newCitation.citedPaperId,
          citationText: newCitation.citationText,
          pageNumber: newCitation.pageNumber ? Number.parseInt(newCitation.pageNumber) : null,
          context: newCitation.context,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add citation")
      }

      toast({
        title: "Citation added",
        description: "Citation has been successfully added",
      })

      // Reset form
      setNewCitation({
        citedPaperId: "",
        citationText: "",
        pageNumber: "",
        context: "",
      })

      // Refresh citations
      fetchCitations()
    } catch (error: any) {
      console.error("Error adding citation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add citation",
        variant: "destructive",
      })
    } finally {
      setIsAddingCitation(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown"
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading citations...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Quote className="h-5 w-5" />
              Citations & References
            </CardTitle>
            <CardDescription>Papers that cite this work and papers referenced by this work</CardDescription>
          </div>
          {canEdit && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Citation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Citation</DialogTitle>
                  <DialogDescription>Add a citation to another research paper from this paper</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="citedPaperId">Cited Paper ID</Label>
                    <Input
                      id="citedPaperId"
                      value={newCitation.citedPaperId}
                      onChange={(e) => setNewCitation({ ...newCitation, citedPaperId: e.target.value })}
                      placeholder="Enter the ID of the paper being cited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="citationText">Citation Text</Label>
                    <Textarea
                      id="citationText"
                      value={newCitation.citationText}
                      onChange={(e) => setNewCitation({ ...newCitation, citationText: e.target.value })}
                      placeholder="Enter the citation text as it appears in the paper"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pageNumber">Page Number</Label>
                      <Input
                        id="pageNumber"
                        type="number"
                        value={newCitation.pageNumber}
                        onChange={(e) => setNewCitation({ ...newCitation, pageNumber: e.target.value })}
                        placeholder="Page number"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="context">Context</Label>
                    <Textarea
                      id="context"
                      value={newCitation.context}
                      onChange={(e) => setNewCitation({ ...newCitation, context: e.target.value })}
                      placeholder="Additional context about this citation"
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleAddCitation} disabled={isAddingCitation} className="w-full">
                    {isAddingCitation ? "Adding..." : "Add Citation"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="citations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="citations">Cited By ({citations.length})</TabsTrigger>
            <TabsTrigger value="references">References ({references.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="citations" className="space-y-4">
            {citations.length > 0 ? (
              citations.map((citation) => (
                <Card key={citation.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm">{citation.citing_paper.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{citation.citing_paper.authors.join(", ")}</span>
                          </div>
                          {citation.citing_paper.publication_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(citation.citing_paper.publication_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {citation.citation_text && (
                        <blockquote className="border-l-2 border-muted pl-4 text-sm italic">
                          "{citation.citation_text}"
                        </blockquote>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {citation.page_number && (
                            <Badge variant="outline" className="text-xs">
                              Page {citation.page_number}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">Added {formatDate(citation.created_at)}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Quote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No citations found</p>
                <p className="text-sm">This paper hasn't been cited yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="references" className="space-y-4">
            {references.length > 0 ? (
              references.map((reference) => (
                <Card key={reference.id} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm">{reference.cited_paper.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{reference.cited_paper.authors.join(", ")}</span>
                          </div>
                          {reference.cited_paper.publication_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(reference.cited_paper.publication_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {reference.citation_text && (
                        <blockquote className="border-l-2 border-muted pl-4 text-sm italic">
                          "{reference.citation_text}"
                        </blockquote>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {reference.page_number && (
                            <Badge variant="outline" className="text-xs">
                              Page {reference.page_number}
                            </Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Quote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No references found</p>
                <p className="text-sm">No references have been added to this paper</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

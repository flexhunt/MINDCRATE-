import { ArticleGenerator } from "@/components/articles/article-generator"

export default function ArticleGeneratorPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">AI Article Generator</h1>
      <div className="max-w-2xl mx-auto">
        <ArticleGenerator />
      </div>
    </div>
  )
}

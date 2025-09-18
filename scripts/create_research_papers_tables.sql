-- Create research papers table
CREATE TABLE IF NOT EXISTS research_papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL,
  abstract TEXT,
  content TEXT NOT NULL,
  pdf_url TEXT,
  doi TEXT,
  publication_date DATE,
  journal TEXT,
  keywords TEXT[],
  category TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_size BIGINT,
  page_count INTEGER,
  is_public BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create citations table
CREATE TABLE IF NOT EXISTS citations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id UUID REFERENCES research_papers(id) ON DELETE CASCADE,
  cited_paper_id UUID REFERENCES research_papers(id) ON DELETE CASCADE,
  citation_text TEXT,
  page_number INTEGER,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create paper_tags table for better categorization
CREATE TABLE IF NOT EXISTS paper_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id UUID REFERENCES research_papers(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(paper_id, tag)
);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS research_papers_search_idx ON research_papers 
USING gin(to_tsvector('english', title || ' ' || abstract || ' ' || content));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_research_papers_category ON research_papers(category);
CREATE INDEX IF NOT EXISTS idx_research_papers_upload_date ON research_papers(upload_date);
CREATE INDEX IF NOT EXISTS idx_research_papers_public ON research_papers(is_public);
CREATE INDEX IF NOT EXISTS idx_citations_paper_id ON citations(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_tags_paper_id ON paper_tags(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_tags_tag ON paper_tags(tag);

-- Enable Row Level Security
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for research_papers
CREATE POLICY "Public papers are viewable by everyone" ON research_papers
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own papers" ON research_papers
  FOR SELECT USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can insert their own papers" ON research_papers
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own papers" ON research_papers
  FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own papers" ON research_papers
  FOR DELETE USING (auth.uid() = uploaded_by);

-- Create policies for citations
CREATE POLICY "Citations are viewable by everyone" ON citations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert citations" ON citations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for paper_tags
CREATE POLICY "Tags are viewable by everyone" ON paper_tags
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert tags" ON paper_tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

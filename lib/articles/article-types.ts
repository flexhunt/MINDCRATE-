export interface Article {
  id: string
  title: string
  slug: string
  cover_image_url?: string
  content: string
  tags?: string[]
  is_published: boolean
  created_at: string
  updated_at: string
  user_id: string
}

export interface Author {
  name?: string
  username?: string
  avatar_url?: string
}

export interface ArticleWithAuthor extends Article {
  author: Author | null
}

export interface ArticleFormData {
  title: string
  slug?: string
  cover_image_url?: string
  content: string
  tags?: string[]
  is_published?: boolean
  user_id: string
}

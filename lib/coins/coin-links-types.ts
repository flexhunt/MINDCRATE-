// lib/coins/coin-links-types.ts

export interface CoinLink {
  id: string
  code: string
  coins: number
  description: string | null
  created_by: string
  active: boolean
  max_uses: number
  created_at: string
  updated_at: string
  restricted_to_user?: string
  opportunity_id?: string
}

export interface CoinLinkUse {
  id: string
  link_id: string
  user_id: string
  used_at: string
}

export interface CoinEarningOpportunity {
  id: string
  title: string
  description: string | null
  coins: number
  short_url: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface ProcessLinkResult {
  success: boolean
  message: string
  coins_awarded?: number
}

export interface CreateCoinLinkParams {
  code?: string
  coins: number
  description?: string
  max_uses?: number
  restricted_to_user?: string
  opportunity_id?: string
}

export interface CreateEarningOpportunityParams {
  title: string
  description?: string
  coins: number
  short_url: string
  original_link_id?: string
}

export interface GenerateShortLinkResult {
  success: boolean
  message?: string
  originalUrl?: string
  shortUrl?: string
  code?: string
  linkId?: string
  shortenerError?: string
  nextAvailableTime?: string
}

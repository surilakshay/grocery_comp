export type CityTier = 'metro' | 'tier2' | 'tier3'
export type AgeGroup = '18-24' | '25-34' | '35-44' | '45+'
export type Vibe = 'deal_hunter' | 'trendy' | 'home_lover' | 'gadget_freak'
export type Language = 'en' | 'hi'

export interface UserProfile {
  id: string
  phone: string
  name: string
  city_tier: CityTier
  age_group: AgeGroup
  vibe: Vibe
  preferred_language: Language
  onboarding_done: boolean
  created_at: string
}

export interface Video {
  id: string
  url: string
  thumbnail_url?: string
  title: string
  title_hi?: string
  description?: string
  description_hi?: string
  price: number
  original_price: number
  product_tags: string[]
  gemini_tags?: string[]
  category: string
  seller_name: string
  likes_count: number
  language: Language
  city_relevance?: CityTier[]
  vibe_relevance?: Vibe[]
  mandli_eligible: boolean
  mandli_min_count?: number
  mandli_discount_percent?: number
  created_at: string
}

export interface CartItem {
  id: string
  user_id: string
  video_id: string
  video: Video
  quantity: number
}

export interface Address {
  id: string
  user_id: string
  name: string
  phone: string
  address_line: string
  city: string
  state: string
  pincode: string
  is_default: boolean
}

export interface Order {
  id: string
  user_id: string
  items: OrderItem[]
  address: Address
  total_amount: number
  status: 'placed' | 'confirmed' | 'shipped' | 'delivered'
  order_type: 'solo' | 'mandli'
  mandli_session_id?: string
  created_at: string
}

export interface OrderItem {
  video_id: string
  title: string
  price: number
  quantity: number
}

export interface MandliSession {
  id: string
  video_id: string
  video: Video
  creator_id: string
  original_price: number
  current_price: number
  target_count: number
  current_count: number
  discount_percent: number
  expires_at: string
  status: 'open' | 'success' | 'expired'
  participants: MandliParticipant[]
  share_url: string
}

export interface MandliParticipant {
  id: string
  mandli_id: string
  user_id: string
  joined_at: string
}

export interface BehaviorSignal {
  video_id: string
  watch_percent: number
  replayed: boolean
  liked: boolean
  shared: boolean
  added_to_cart: boolean
  swiped_off_fast: boolean
}

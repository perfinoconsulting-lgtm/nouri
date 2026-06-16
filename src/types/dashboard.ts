// Types du dashboard parental Lisani

export interface ChildStats {
  lettersLearned: number       // lettres avec score >= 80
  lettersInProgress: number    // lettres avec 0 < score < 80
  lettersNeverSeen: number     // 28 - lettersLearned - lettersInProgress
  avgScore: number             // moyenne des scores (0-100)
  totalSessions: number        // nombre total de sessions
  totalMinutes: number         // temps total en minutes
  currentStreak: number        // jours consécutifs avec au moins 1 session
  lastSessionDate: string | null
}

export interface SubscriptionInfo {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export interface ChildWithStats {
  id: string
  parent_id: string
  prenom: string
  age: number
  avatar: string
  niveau: number
  created_at: string
  last_active: string | null
  stats: ChildStats
  subscription: SubscriptionInfo
}

export interface SessionData {
  id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number
  module_slug: string
  items_reviewed: number
  correct_answers: number
}

export interface ActivityDay {
  date: string     // format YYYY-MM-DD
  minutes: number
  sessions: number
}

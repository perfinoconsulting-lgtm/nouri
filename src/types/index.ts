// Types pour le projet Lisani

export interface User {
  id: string
  email: string
  role: 'parent'
}

export interface ChildProfile {
  id: string
  parentId: string
  name: string
  age: number
  avatarUrl: string | null
}

export interface Subscription {
  id: string
  userId: string
  status: 'active' | 'canceled' | 'past_due'
  stripeCustomerId: string
}

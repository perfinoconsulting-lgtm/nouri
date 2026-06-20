export interface ChildLiveActivity {
  child_id: string
  parent_id: string
  module_slug: string
  activity_label: string | null
  activity_ar: string | null
  view_name: string | null
  is_active: boolean
  progress_percent: number | null
  updated_at: string
}

export interface LiveActivityDetail {
  label?: string | null
  arabicText?: string | null
  viewName?: string | null
  progressPercent?: number | null
}


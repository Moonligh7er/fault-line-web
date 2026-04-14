export type ReportCategory =
  | 'pothole'
  | 'streetlight'
  | 'sidewalk'
  | 'signage'
  | 'drainage'
  | 'graffiti'
  | 'road_debris'
  | 'guardrail'
  | 'crosswalk'
  | 'traffic_signal'
  | 'needed_traffic_light'
  | 'water_main'
  | 'sewer'
  | 'bridge'
  | 'fallen_tree'
  | 'snow_ice'
  | 'accessibility'
  | 'bike_lane'
  | 'abandoned_vehicle'
  | 'illegal_dumping'
  | 'parking_meter'
  | 'park_playground'
  | 'utility_pole'
  | 'other';

export type SizeRating = 'small' | 'medium' | 'large' | 'massive';
export type HazardLevel =
  | 'minor'
  | 'moderate'
  | 'significant'
  | 'dangerous'
  | 'extremely_dangerous';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type ConditionLevel = 'cosmetic' | 'deteriorating' | 'broken' | 'destroyed';

export type ReportStatus =
  | 'draft'
  | 'submitted'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'rejected';

export type AuthorityLevel = 'federal' | 'state' | 'county' | 'city' | 'town';

export interface MediaItem {
  url: string;
  type: 'photo' | 'video';
  thumbnailUrl?: string;
}

export interface ReportRow {
  id: string;
  user_id: string | null;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  description: string | null;
  size_rating: SizeRating;
  hazard_level: HazardLevel;
  media: MediaItem[];
  vehicle_damage: unknown;
  status: ReportStatus;
  authority_id: string | null;
  submission_method: string | null;
  submission_reference: string | null;
  upvote_count: number;
  confirm_count: number;
  is_anonymous: boolean;
  sensor_detected: boolean;
  offline_queued: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface AuthorityRow {
  id: string;
  name: string;
  level: AuthorityLevel;
  state: string;
  city: string | null;
  county: string | null;
  submission_methods: unknown;
  boundary_geojson: unknown;
  response_time_avg_days: number | null;
  fix_rate_percent: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_reports: number;
  total_upvotes: number;
  total_confirms: number;
  points: number;
  badges: unknown[];
  created_at: string;
  updated_at: string;
}

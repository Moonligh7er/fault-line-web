import type {
  ReportCategory,
  SizeRating,
  HazardLevel,
  UrgencyLevel,
  ConditionLevel,
} from './types';

export type SeverityDimension = 'size' | 'hazard' | 'urgency' | 'condition';

export interface CategoryInfo {
  key: ReportCategory;
  label: string;
  description: string;
  severityDimensions: SeverityDimension[];
  quickReportEnabled: boolean;
}

export const CATEGORIES: readonly CategoryInfo[] = [
  { key: 'pothole', label: 'Pothole', description: 'Road surface holes and craters', severityDimensions: ['size', 'hazard'], quickReportEnabled: true },
  { key: 'road_debris', label: 'Road Debris', description: 'Debris or obstacles on roadways', severityDimensions: ['hazard', 'urgency'], quickReportEnabled: true },
  { key: 'guardrail', label: 'Guardrail', description: 'Damaged or missing guardrails', severityDimensions: ['condition', 'hazard'], quickReportEnabled: false },
  { key: 'bridge', label: 'Bridge', description: 'Bridge damage or safety concerns', severityDimensions: ['condition', 'hazard'], quickReportEnabled: false },
  { key: 'traffic_signal', label: 'Traffic Signal', description: 'Malfunctioning traffic lights', severityDimensions: ['urgency', 'hazard'], quickReportEnabled: true },
  { key: 'needed_traffic_light', label: 'Needed Light', description: 'Intersection that needs a new traffic light', severityDimensions: ['hazard', 'urgency'], quickReportEnabled: false },
  { key: 'signage', label: 'Signage', description: 'Missing, damaged, or obscured signs', severityDimensions: ['condition', 'hazard'], quickReportEnabled: false },
  { key: 'crosswalk', label: 'Crosswalk', description: 'Faded or missing crosswalk markings', severityDimensions: ['condition', 'hazard'], quickReportEnabled: false },
  { key: 'sidewalk', label: 'Sidewalk', description: 'Cracked or damaged sidewalks', severityDimensions: ['size', 'hazard'], quickReportEnabled: true },
  { key: 'bike_lane', label: 'Bike Lane', description: 'Obstructed, faded, or missing bike infrastructure', severityDimensions: ['condition', 'hazard'], quickReportEnabled: false },
  { key: 'accessibility', label: 'Accessibility', description: 'Missing curb cuts, broken ramps, blocked ADA paths', severityDimensions: ['condition', 'urgency'], quickReportEnabled: false },
  { key: 'streetlight', label: 'Streetlight', description: 'Broken or flickering streetlights', severityDimensions: ['urgency', 'hazard'], quickReportEnabled: true },
  { key: 'water_main', label: 'Water Main', description: 'Water main breaks or leaks', severityDimensions: ['urgency', 'hazard'], quickReportEnabled: true },
  { key: 'sewer', label: 'Sewer', description: 'Sewer issues or manhole problems', severityDimensions: ['urgency', 'hazard'], quickReportEnabled: false },
  { key: 'utility_pole', label: 'Utility Pole', description: 'Leaning poles, downed or low-hanging wires', severityDimensions: ['hazard', 'urgency'], quickReportEnabled: false },
  { key: 'drainage', label: 'Drainage', description: 'Blocked drains or flooding issues', severityDimensions: ['urgency', 'hazard'], quickReportEnabled: false },
  { key: 'fallen_tree', label: 'Fallen Tree', description: 'Fallen trees or hazardous branches', severityDimensions: ['hazard', 'urgency'], quickReportEnabled: true },
  { key: 'snow_ice', label: 'Snow / Ice', description: 'Unplowed roads, icy sidewalks', severityDimensions: ['hazard', 'urgency'], quickReportEnabled: true },
  { key: 'graffiti', label: 'Graffiti', description: 'Unwanted graffiti or vandalism', severityDimensions: ['condition'], quickReportEnabled: false },
  { key: 'illegal_dumping', label: 'Illegal Dumping', description: 'Tires, mattresses, construction waste', severityDimensions: ['size', 'hazard'], quickReportEnabled: false },
  { key: 'abandoned_vehicle', label: 'Abandoned Vehicle', description: 'Vehicle left abandoned on public property', severityDimensions: ['urgency'], quickReportEnabled: false },
  { key: 'parking_meter', label: 'Parking Meter', description: 'Broken meters or faded lot lines', severityDimensions: ['condition'], quickReportEnabled: false },
  { key: 'park_playground', label: 'Park / Playground', description: 'Broken equipment, unsafe surfaces', severityDimensions: ['condition', 'hazard'], quickReportEnabled: false },
  { key: 'other', label: 'Other', description: 'Other infrastructure issues', severityDimensions: ['hazard', 'urgency'], quickReportEnabled: false },
] as const;

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as readonly ReportCategory[];

export function getCategoryInfo(key: ReportCategory): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.key === key);
}

export const SIZE_RATINGS: readonly { key: SizeRating; label: string; description: string }[] = [
  { key: 'small', label: 'Small', description: 'Smaller than a dinner plate' },
  { key: 'medium', label: 'Medium', description: 'Dinner plate to bicycle wheel' },
  { key: 'large', label: 'Large', description: 'Bicycle wheel to car tire' },
  { key: 'massive', label: 'Massive', description: 'Larger than a car tire' },
] as const;

export const HAZARD_LEVELS: readonly { key: HazardLevel; label: string; color: string }[] = [
  { key: 'minor', label: 'Minor', color: '#4CAF50' },
  { key: 'moderate', label: 'Moderate', color: '#FFC107' },
  { key: 'significant', label: 'Significant', color: '#FF9800' },
  { key: 'dangerous', label: 'Dangerous', color: '#F44336' },
  { key: 'extremely_dangerous', label: 'Extremely Dangerous', color: '#9C27B0' },
] as const;

export const URGENCY_LEVELS: readonly { key: UrgencyLevel; label: string; color: string }[] = [
  { key: 'low', label: 'Low', color: '#4CAF50' },
  { key: 'medium', label: 'Medium', color: '#FFC107' },
  { key: 'high', label: 'High', color: '#FF9800' },
  { key: 'critical', label: 'Critical', color: '#F44336' },
] as const;

export const CONDITION_LEVELS: readonly { key: ConditionLevel; label: string; color: string }[] = [
  { key: 'cosmetic', label: 'Cosmetic', color: '#4CAF50' },
  { key: 'deteriorating', label: 'Deteriorating', color: '#FFC107' },
  { key: 'broken', label: 'Broken', color: '#FF9800' },
  { key: 'destroyed', label: 'Destroyed', color: '#F44336' },
] as const;

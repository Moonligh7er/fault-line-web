// Column lists for every `reports` read. reports.user_id is not readable by
// anon or authenticated (column-level grant), so select('*') fails and no
// query may name user_id. Ownership goes through owns_report() / my_reports().

/** Every reports column except user_id and the _hp honeypot (neither is readable by clients). */
export const REPORT_COLUMN_LIST = [
  'id',
  'category',
  'latitude',
  'longitude',
  'address',
  'city',
  'state',
  'zip',
  'description',
  'size_rating',
  'hazard_level',
  'media',
  'vehicle_damage',
  'status',
  'authority_id',
  'submission_method',
  'submission_reference',
  'upvote_count',
  'confirm_count',
  'is_anonymous',
  'sensor_detected',
  'offline_queued',
  'location_point',
  'created_at',
  'updated_at',
  'resolved_at',
  // migration 001
  'urgency',
  'condition_level',
  'is_quick_report',
  'cluster_id',
  'resolved_media',
  // migration 019
  'geometry_type',
  'corridor_geometry',
  'area_geometry',
  'corridor_street_name',
  'corridor_from_cross_street',
  'corridor_to_cross_street',
  'area_boundary_name',
  'area_census_tract_geoid',
  'parent_cluster_id',
  // migration 020
  'report_subject',
  'commercial_business_name',
  'commercial_business_address',
  'commercial_chain_identifier',
  'commercial_public_view_confirmed',
  'commercial_reporter_attestation',
  'digital_target_url',
  'digital_assistive_tech',
  'digital_browser',
  'digital_platform',
  'digital_wcag_criterion',
  'digital_snapshot_ref',
  'insider_context',
] as const;

export const REPORT_COLUMNS = REPORT_COLUMN_LIST.join(', ');

/** Open311 feed: deliberately narrower than the app's own pages. */
export const OPEN311_REPORT_COLUMNS =
  'id, category, latitude, longitude, address, zip, description, hazard_level, media, status, authority_id, created_at, updated_at, resolved_at';

/** Keyed read API (/api/v1/reports). */
export const API_V1_REPORT_COLUMNS =
  'id, category, latitude, longitude, address, city, state, zip, description, size_rating, hazard_level, urgency, condition_level, media, status, authority_id, submission_reference, upvote_count, confirm_count, is_anonymous, sensor_detected, is_quick_report, created_at, updated_at, resolved_at';

/** CSV export (/api/export/reports). */
export const EXPORT_REPORT_COLUMNS =
  'id,category,state,city,latitude,longitude,size_rating,hazard_level,status,upvote_count,confirm_count,created_at,resolved_at';

/**
 * Realtime payloads carry whatever the server sends; drop user_id before a
 * row reaches component state, in case the publication ever includes it.
 */
export function withoutUserId<T extends object>(row: T): Omit<T, 'user_id'> {
  const rest = { ...row } as T & { user_id?: unknown };
  delete rest.user_id;
  return rest;
}

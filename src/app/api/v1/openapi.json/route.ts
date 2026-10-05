import { apiJson, apiOptions } from '@/lib/api-v1';
import { env } from '@/lib/env';

// GET /api/v1/openapi.json — machine-readable description of the keyed API,
// so AI agents and tools can discover it. No key required for the spec.

const list = (ref: string) => ({
  type: 'object',
  properties: {
    data: { type: 'array', items: { $ref: ref } },
    limit: { type: 'integer' },
    offset: { type: 'integer' },
    next_offset: { type: ['integer', 'null'] },
  },
});

const q = (name: string, description: string, schema: Record<string, unknown> = { type: 'string' }) => ({
  name,
  in: 'query',
  required: false,
  description,
  schema,
});

const paging = [
  q('limit', 'Page size (1–500, default 100)', { type: 'integer' }),
  q('offset', 'Rows to skip', { type: 'integer' }),
];

const errors = {
  '401': { description: 'Missing, invalid, or revoked key' },
  '403': { description: 'Key lacks the required scope' },
  '429': { description: 'Daily request limit reached for this key' },
};

export function GET() {
  return apiJson({
    openapi: '3.1.0',
    info: {
      title: 'Fault Line API',
      version: '1.0.0',
      description:
        'Read access to Fault Line community infrastructure reports. Keys are issued by Fault Line admins. ' +
        'Scopes: read:public (reports, clusters, authorities, escalation record) and read:internal ' +
        '(adds outbound queue, inbound replies, and escalation message bodies). ' +
        'Public no-key feed: /open311/v2/requests.json (Open311 GeoReport v2).',
    },
    servers: [{ url: `${env.NEXT_PUBLIC_APP_ORIGIN}/api/v1` }],
    security: [{ bearer: [] }],
    components: {
      securitySchemes: { bearer: { type: 'http', scheme: 'bearer', description: 'flk_… API key' } },
      schemas: {
        Report: {
          type: 'object',
          description: 'A single resident report. cluster_id groups reports about the same issue.',
          properties: {
            id: { type: 'string', format: 'uuid' },
            category: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            address: { type: ['string', 'null'] },
            city: { type: ['string', 'null'] },
            state: { type: ['string', 'null'] },
            description: { type: ['string', 'null'] },
            hazard_level: { type: 'string' },
            status: { type: 'string' },
            authority_id: { type: ['string', 'null'], format: 'uuid' },
            cluster_id: { type: ['string', 'null'], format: 'uuid' },
            upvote_count: { type: 'integer' },
            confirm_count: { type: 'integer' },
            photos: { type: 'array', items: { type: 'string', format: 'uri' } },
            created_at: { type: 'string', format: 'date-time' },
            resolved_at: { type: ['string', 'null'], format: 'date-time' },
          },
        },
        Cluster: {
          type: 'object',
          description: 'Reports about the same issue. Escalated to the authority once confirmed (3+ reporters, 10+ reports, 30+ days).',
          properties: {
            id: { type: 'string', format: 'uuid' },
            category: { type: 'string' },
            report_count: { type: 'integer' },
            unique_reporters: { type: 'integer' },
            max_hazard_level: { type: 'string' },
            status: { type: 'string' },
            authority_id: { type: ['string', 'null'], format: 'uuid' },
            first_reported_at: { type: 'string', format: 'date-time' },
            escalated_at: { type: ['string', 'null'], format: 'date-time' },
          },
        },
        Authority: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, level: { type: 'string' }, state: { type: 'string' }, city: { type: ['string', 'null'] } } },
        Escalation: { type: 'object', properties: { id: { type: 'string' }, cluster_id: { type: 'string' }, method: { type: 'string' }, recipient: { type: 'string' }, subject: { type: 'string' }, status: { type: 'string' }, sent_at: { type: 'string' } } },
      },
    },
    paths: {
      '/reports': {
        get: {
          summary: 'List reports (newest first)',
          parameters: [
            q('since', 'Created at or after (ISO 8601)'),
            q('until', 'Created at or before (ISO 8601)'),
            q('status', 'submitted | acknowledged | in_progress | resolved | closed | rejected'),
            q('category', 'e.g. pothole, streetlight, sidewalk'),
            q('authority_id', 'Authority UUID'),
            q('cluster_id', 'Cluster UUID'),
            q('state', 'Two-letter state, e.g. MA'),
            ...paging,
          ],
          responses: { '200': { description: 'Page of reports', content: { 'application/json': { schema: list('#/components/schemas/Report') } } }, ...errors },
        },
      },
      '/clusters': {
        get: {
          summary: 'List clusters (most recently reported first)',
          parameters: [q('status', 'unconfirmed | confirmed | submitted | acknowledged | in_progress | resolved | closed'), q('category', 'Category'), q('authority_id', 'Authority UUID'), q('state', 'Two-letter state'), q('since', 'last_reported_at on/after (ISO 8601)'), ...paging],
          responses: { '200': { description: 'Page of clusters', content: { 'application/json': { schema: list('#/components/schemas/Cluster') } } }, ...errors },
        },
      },
      '/authorities': {
        get: {
          summary: 'List authorities',
          parameters: [q('state', 'Two-letter state'), q('level', 'city | town | county | state'), q('q', 'Name contains'), ...paging],
          responses: { '200': { description: 'Page of authorities', content: { 'application/json': { schema: list('#/components/schemas/Authority') } } }, ...errors },
        },
      },
      '/escalations': {
        get: {
          summary: 'Notices sent to authorities (bodies need read:internal)',
          parameters: [q('cluster_id', 'Cluster UUID'), q('authority_id', 'Authority UUID'), q('since', 'sent_at on/after (ISO 8601)'), ...paging],
          responses: { '200': { description: 'Page of escalations', content: { 'application/json': { schema: list('#/components/schemas/Escalation') } } }, ...errors },
        },
      },
      '/internal/outbound': {
        get: {
          summary: 'Outbound review queue (read:internal)',
          parameters: [q('status', 'pending_review | approved | sending | sent | failed | rejected'), q('limit', '1–500', { type: 'integer' })],
          responses: { '200': { description: 'Outbound messages' }, ...errors },
        },
      },
      '/internal/inbound': {
        get: {
          summary: 'Replies received from authorities (read:internal)',
          parameters: [q('status', 'unmatched | pending_review | applied | dismissed'), q('limit', '1–500', { type: 'integer' })],
          responses: { '200': { description: 'Inbound replies' }, ...errors },
        },
      },
    },
  });
}

export const OPTIONS = apiOptions;

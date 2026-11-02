import { Request, Response } from 'express';
import { getDb } from '../db/database';

export function getApiServices(_req: Request, res: Response): void {
  const db = getDb();
  const services = db.prepare('SELECT * FROM api_services WHERE is_active = 1 ORDER BY category, name').all();
  const parsed = services.map((s: any) => ({
    ...s,
    tags: s.tags ? JSON.parse(s.tags) : [],
    example_request: s.example_request ? JSON.parse(s.example_request) : null,
    example_response: s.example_response ? JSON.parse(s.example_response) : null,
  }));
  res.json({ success: true, data: { services: parsed }, timestamp: new Date().toISOString() });
}

export function getApiService(req: Request, res: Response): void {
  const db = getDb();
  const service = db.prepare('SELECT * FROM api_services WHERE slug = ? AND is_active = 1').get(req.params.slug) as any;
  if (!service) {
    res.status(404).json({ success: false, message: 'API service not found', timestamp: new Date().toISOString() });
    return;
  }
  res.json({
    success: true,
    data: {
      service: {
        ...service,
        tags: service.tags ? JSON.parse(service.tags) : [],
        example_request: service.example_request ? JSON.parse(service.example_request) : null,
        example_response: service.example_response ? JSON.parse(service.example_response) : null,
      }
    },
    timestamp: new Date().toISOString()
  });
}

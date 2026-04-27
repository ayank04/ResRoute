import { Disruption } from '../types';

export const mockDisruptions: Disruption[] = [
  {
    id: 'D-001',
    type: 'ACCIDENT',
    severity: 'HIGH',
    location: { lat: 12.9500, lng: 77.6500 },
    radiusMeters: 500,
    estimatedDelayMinutes: 30,
    active: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    isPredicted: false
  },
  {
    id: 'D-002',
    type: 'TRAFFIC',
    severity: 'MEDIUM',
    location: { lat: 12.9400, lng: 77.6200 },
    radiusMeters: 1000,
    estimatedDelayMinutes: 15,
    active: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7200000).toISOString(),
    isPredicted: true
  },
  {
    id: 'D-003',
    type: 'WEATHER',
    severity: 'HIGH',
    location: { lat: 12.9200, lng: 77.6000 },
    radiusMeters: 2000,
    estimatedDelayMinutes: 45,
    active: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10800000).toISOString(),
    isPredicted: false
  },
  {
    id: 'D-004',
    type: 'TRAFFIC',
    severity: 'LOW',
    location: { lat: 12.9600, lng: 77.6600 },
    radiusMeters: 300,
    estimatedDelayMinutes: 5,
    active: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
    isPredicted: false
  }
];

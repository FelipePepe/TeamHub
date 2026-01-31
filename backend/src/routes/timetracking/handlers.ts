import type { Hono } from 'hono';
import type { HonoEnv } from '../../types/hono.js';
import { registerTimetrackingApprovalRoutes } from './handlers/approvals.js';
import { registerTimetrackingListingRoutes } from './handlers/listing.js';
import { registerTimetrackingRecordRoutes } from './handlers/records.js';

export const registerTimetrackingRoutes = (router: Hono<HonoEnv>) => {
  registerTimetrackingListingRoutes(router);
  registerTimetrackingApprovalRoutes(router);
  registerTimetrackingRecordRoutes(router);
};

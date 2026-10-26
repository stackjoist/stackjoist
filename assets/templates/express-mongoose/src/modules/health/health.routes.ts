import { Router } from 'express';

/**
 * `/health` answers whether the process is alive (liveness).
 * `/health/ready` also checks the database, for load balancers and orchestrators (readiness).
 */
export function healthRouter(isDatabaseReady: () => boolean): Router {
  const router = Router();
  router.get('/', (_req, res) => {
    res.json({ status: 'ok' });
  });
  router.get('/ready', (_req, res) => {
    const ready = isDatabaseReady();
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready' });
  });
  return router;
}

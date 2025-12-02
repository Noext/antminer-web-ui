import { router } from '@/lib/trpc';
import { antminerRouter } from './antminer';

export const appRouter = router({
  antminer: antminerRouter,
});

export type AppRouter = typeof appRouter;


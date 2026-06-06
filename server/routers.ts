import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { shopRouter } from "./routers/shop";
import { alertsRouter } from "./routers/alerts";
import { usersRouter } from "./routers/users";
import { suppliersRouter } from "./routers/suppliers";
import { productsRouter } from "./routers/products";
import { salesRouter } from "./routers/sales";
import { expensesRouter } from "./routers/expenses";
import { purchaseOrdersRouter } from "./routers/purchaseOrders";
import { analyticsRouter } from "./routers/analytics";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  shop: shopRouter,
  alerts: alertsRouter,
  users: usersRouter,
  suppliers: suppliersRouter,
  products: productsRouter,
  sales: salesRouter,
  expenses: expensesRouter,
  purchaseOrders: purchaseOrdersRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;

/**
 * User management router — admin only.
 * Provides CRUD for managing users (admin and sales roles).
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { hashPassword } from "../railwayAuth";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

export const usersRouter = router({
  /** List all users — admin only */
  list: adminProcedure.query(async () => {
    const users = await db.getAllUsers();
    return users.map(u => ({
      id: u.id,
      name: u.name ?? "",
      email: u.email ?? "",
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      lastSignedIn: u.lastSignedIn,
    }));
  }),

  /** Create a new user — admin only */
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Valid email required"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      role: z.enum(["admin", "sales"]),
    }))
    .mutation(async ({ input }) => {
      // Check email uniqueness
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "A user with this email already exists" });
      }

      const passwordHash = await hashPassword(input.password);
      const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      await db.upsertUser({
        openId,
        name: input.name,
        email: input.email,
        loginMethod: "email",
        role: input.role,
        isActive: true,
        passwordHash,
        lastSignedIn: new Date(),
      });

      return { success: true };
    }),

  /** Update a user — admin only */
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      role: z.enum(["admin", "sales"]).optional(),
      isActive: z.boolean().optional(),
      password: z.string().min(6).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, password, ...rest } = input;

      // Prevent self-demotion
      if (ctx.user.id === id && rest.role && rest.role !== "admin") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot change your own role" });
      }

      // Prevent self-deactivation
      if (ctx.user.id === id && rest.isActive === false) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot deactivate your own account" });
      }

      // Check email uniqueness if changing email
      if (rest.email) {
        const existing = await db.getUserByEmail(rest.email);
        if (existing && existing.id !== id) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already in use by another user" });
        }
      }

      const updates: Parameters<typeof db.updateUserById>[1] = { ...rest };
      if (password) {
        updates.passwordHash = await hashPassword(password);
      }

      await db.updateUserById(id, updates);
      return { success: true };
    }),

  /** Delete a user — admin only */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.id === input.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot delete your own account" });
      }
      await db.deleteUserById(input.id);
      return { success: true };
    }),

  /** Get current user profile — any authenticated user */
  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      name: ctx.user.name ?? "",
      email: ctx.user.email ?? "",
      role: ctx.user.role,
      isActive: ctx.user.isActive,
    };
  }),

  /** Change own password — any authenticated user */
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6, "New password must be at least 6 characters"),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByOpenId(ctx.user.openId);
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const { verifyPassword } = await import("../railwayAuth");
      const valid = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
      }

      const newHash = await hashPassword(input.newPassword);
      await db.updateUserById(user.id, { passwordHash: newHash });
      return { success: true };
    }),
});

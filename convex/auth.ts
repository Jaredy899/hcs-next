import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Custom auth functions for Clerk integration
export const getCurrentUser = query({
  args: {},
  returns: v.union(v.null(), v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkId: v.optional(v.string()),
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Look for existing user with this Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user;
  },
});

export const createOrGetUser = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user already exists with this Clerk ID
    let existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Check if there's a user with the same email (migration case)
    const userByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email as string))
      .first();

    if (userByEmail) {
      // If user exists by email but doesn't have a Clerk ID, update them
      if (!userByEmail.clerkId) {
        await ctx.db.patch(userByEmail._id, {
          clerkId: identity.subject,
          name: (identity.name as string) || (identity.given_name as string) || userByEmail.name,
        });
      }
      // Return the existing user (whether they had a clerkId or not)
      return userByEmail._id;
    }

    // Create new user only if no user exists with this email
    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: (identity.email as string) || "",
      name: (identity.name as string) || (identity.given_name as string) || "",
    });
  },
});

export const updateUser = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(user._id, updates);
    }

    return null;
  },
});

// Helper function to get current user ID for use in QUERIES (read-only)
export const getCurrentUserIdQuery = async (ctx: { auth: { getUserIdentity: () => Promise<any> }, db: any }): Promise<Id<"users"> | null> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  // First try to find by Clerk ID
  let user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  // If not found by Clerk ID, try by email (migration case) - but don't update in queries
  if (!user && identity.email) {
    user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email))
      .first();
  }

  return user?._id || null;
};

// Helper function to get current user ID for use in MUTATIONS (can update)
export const getCurrentUserId = async (ctx: { auth: { getUserIdentity: () => Promise<any> }, db: any }): Promise<Id<"users"> | null> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  // First try to find by Clerk ID
  let user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  // If not found by Clerk ID, try by email (migration case)
  if (!user && identity.email) {
    user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email))
      .first();
    
    // If found by email but no Clerk ID, update the user (only in mutations)
    if (user && !user.clerkId) {
      await ctx.db.patch(user._id, { clerkId: identity.subject });
    }
  }

  return user?._id || null;
};

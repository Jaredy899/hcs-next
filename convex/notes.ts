import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserId, getCurrentUserIdQuery } from "./auth";

export const list = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdQuery(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("notes")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: { clientId: v.id("clients"), text: v.string() },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("notes", {
      clientId: args.clientId,
      caseManagerId: userId,
      text: args.text,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the note to verify ownership
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Note not found");
    
    // Only the case manager who created the note can delete it
    if (note.caseManagerId !== userId) {
      throw new Error("Not authorized to delete this note");
    }

    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: { id: v.id("notes"), text: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the note to verify ownership
    const note = await ctx.db.get(args.id);
    if (!note) throw new Error("Note not found");
    
    // Only the case manager who created the note can edit it
    if (note.caseManagerId !== userId) {
      throw new Error("Not authorized to edit this note");
    }

    await ctx.db.patch(args.id, { text: args.text });
    return null;
  },
});

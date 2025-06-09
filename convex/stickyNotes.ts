import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserId, getCurrentUserIdQuery } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdQuery(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("stickyNotes")
      .withIndex("by_case_manager", (q) => q.eq("caseManagerId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: { 
    text: v.string(),
    color: v.optional(v.string()),
    position: v.object({
      x: v.number(),
      y: v.number(),
    })
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    return await ctx.db.insert("stickyNotes", {
      caseManagerId: userId,
      text: args.text,
      color: args.color || "#fef3c7", // Default to yellow
      position: args.position,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: { 
    id: v.id("stickyNotes"),
    text: v.optional(v.string()),
    color: v.optional(v.string()),
    position: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    }))
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the sticky note to verify ownership
    const stickyNote = await ctx.db.get(args.id);
    if (!stickyNote) throw new Error("Sticky note not found");
    
    // Only the case manager who created the note can edit it
    if (stickyNote.caseManagerId !== userId) {
      throw new Error("Not authorized to edit this sticky note");
    }

    const updateData: any = { updatedAt: Date.now() };
    if (args.text !== undefined) updateData.text = args.text;
    if (args.color !== undefined) updateData.color = args.color;
    if (args.position !== undefined) updateData.position = args.position;

    await ctx.db.patch(args.id, updateData);
  },
});

export const remove = mutation({
  args: { id: v.id("stickyNotes") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get the sticky note to verify ownership
    const stickyNote = await ctx.db.get(args.id);
    if (!stickyNote) throw new Error("Sticky note not found");
    
    // Only the case manager who created the note can delete it
    if (stickyNote.caseManagerId !== userId) {
      throw new Error("Not authorized to delete this sticky note");
    }

    await ctx.db.delete(args.id);
  },
}); 
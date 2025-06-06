import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.optional(v.string()),
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  clients: defineTable({
    name: v.string(),
    phoneNumber: v.string(),
    insurance: v.string(),
    clientId: v.optional(v.string()),
    firstContactCompleted: v.boolean(),
    secondContactCompleted: v.boolean(),
    lastContactDate: v.optional(v.number()),
    lastFaceToFaceDate: v.optional(v.number()),
    nextQuarterlyReview: v.number(),
    nextAnnualAssessment: v.number(),
    lastQRCompleted: v.optional(v.number()),
    lastAnnualCompleted: v.optional(v.number()),
    qr1Completed: v.optional(v.boolean()),
    qr2Completed: v.optional(v.boolean()),
    qr3Completed: v.optional(v.boolean()),
    qr4Completed: v.optional(v.boolean()),
    qr1Date: v.optional(v.union(v.number(), v.null())),
    qr2Date: v.optional(v.union(v.number(), v.null())),
    qr3Date: v.optional(v.union(v.number(), v.null())),
    qr4Date: v.optional(v.union(v.number(), v.null())),
  })
    .index("by_client_id", ["clientId"]),

  caseManagerClients: defineTable({
    caseManagerId: v.id("users"),
    clientId: v.id("clients"),
    archived: v.boolean(),
    assignedDate: v.number(),
  })
    .index("by_case_manager", ["caseManagerId"])
    .index("by_case_manager_and_archived", ["caseManagerId", "archived"])
    .index("by_client", ["clientId"])
    .index("by_case_manager_client", ["caseManagerId", "clientId"]),

  todos: defineTable({
    clientId: v.id("clients"),
    caseManagerId: v.id("users"),
    text: v.string(),
    completed: v.boolean(),
    dueDate: v.optional(v.number()),
  })
    .index("by_client", ["clientId"])
    .index("by_case_manager", ["caseManagerId"]),

  notes: defineTable({
    clientId: v.id("clients"),
    caseManagerId: v.id("users"),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_client", ["clientId"]),
});

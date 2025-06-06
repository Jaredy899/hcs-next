import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getCurrentUserId, getCurrentUserIdQuery } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdQuery(ctx);
    if (!userId) return [];
    
    // Get all client assignments for this case manager that are not archived
    const assignments = await ctx.db
      .query("caseManagerClients")
      .withIndex("by_case_manager_and_archived", (q) => 
        q.eq("caseManagerId", userId).eq("archived", false)
      )
      .collect();

    // Get the actual client data
    const clients = [];
    for (const assignment of assignments) {
      const client = await ctx.db.get(assignment.clientId);
      if (client) {
        clients.push({
          ...client,
          assignedDate: assignment.assignedDate,
        });
      }
    }
    
    return clients;
  },
});

export const getByClientId = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdQuery(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.db
      .query("clients")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .first();
  },
});

export const getClientCaseManagers = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdQuery(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Get all case manager assignments for this client (including archived ones)
    const assignments = await ctx.db
      .query("caseManagerClients")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return assignments.map(assignment => ({
      caseManagerId: assignment.caseManagerId,
      archived: assignment.archived,
      assignedDate: assignment.assignedDate,
    }));
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    phoneNumber: v.string(),
    insurance: v.string(),
    clientId: v.string(),
    nextQuarterlyReview: v.number(),
    nextAnnualAssessment: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if a client with this clientId already exists
    let existingClient = await ctx.db
      .query("clients")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .first();

    let clientDbId;
    if (existingClient) {
      clientDbId = existingClient._id;
    } else {
      // Create new client if none exists with this clientId
      clientDbId = await ctx.db.insert("clients", {
        name: args.name,
        phoneNumber: args.phoneNumber,
        insurance: args.insurance,
        clientId: args.clientId,
        firstContactCompleted: false,
        secondContactCompleted: false,
        nextQuarterlyReview: args.nextQuarterlyReview,
        nextAnnualAssessment: args.nextAnnualAssessment,
        qr1Date: null,
        qr2Date: null,
        qr3Date: null,
        qr4Date: null,
      });
    }

    // Check if this case manager is already assigned to this client
    const existingAssignment = await ctx.db
      .query("caseManagerClients")
      .withIndex("by_case_manager_client", (q) => 
        q.eq("caseManagerId", userId).eq("clientId", clientDbId)
      )
      .first();

    if (existingAssignment) {
      // Unarchive the assignment if it was archived
      if (existingAssignment.archived) {
        await ctx.db.patch(existingAssignment._id, { archived: false });
      }
    } else {
      // Create new assignment
      await ctx.db.insert("caseManagerClients", {
        caseManagerId: userId,
        clientId: clientDbId,
        archived: false,
        assignedDate: Date.now(),
      });
    }

    return clientDbId;
  },
});

export const archive = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the assignment between this case manager and client
    const assignment = await ctx.db
      .query("caseManagerClients")
      .withIndex("by_case_manager_client", (q) => 
        q.eq("caseManagerId", userId).eq("clientId", args.id)
      )
      .first();

    if (!assignment) {
      throw new Error("Client assignment not found");
    }

    // Archive only this case manager's assignment to the client
    await ctx.db.patch(assignment._id, { archived: true });
  },
});

export const updateContact = mutation({
  args: {
    id: v.id("clients"),
    field: v.union(
      v.literal("name"),
      v.literal("phoneNumber"),
      v.literal("insurance"),
      v.literal("clientId"),
      v.literal("firstContactCompleted"),
      v.literal("secondContactCompleted"),
      v.literal("lastContactDate"),
      v.literal("lastFaceToFaceDate"),
      v.literal("nextQuarterlyReview"),
      v.literal("nextAnnualAssessment"),
      v.literal("lastQRCompleted"),
      v.literal("lastAnnualCompleted"),
      v.literal("qr1Completed"),
      v.literal("qr2Completed"),
      v.literal("qr3Completed"),
      v.literal("qr4Completed"),
      v.literal("qr1Date"),
      v.literal("qr2Date"),
      v.literal("qr3Date"),
      v.literal("qr4Date")
    ),
    value: v.union(v.string(), v.number(), v.boolean(), v.null()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if this case manager has access to this client
    const assignment = await ctx.db
      .query("caseManagerClients")
      .withIndex("by_case_manager_client", (q) => 
        q.eq("caseManagerId", userId).eq("clientId", args.id)
      )
      .first();

    if (!assignment || assignment.archived) {
      throw new Error("Client not found or not accessible");
    }

    const client = await ctx.db.get(args.id);
    if (!client) {
      throw new Error("Client not found");
    }

    if (args.value === undefined) {
      // Remove the field if value is undefined
      const { [args.field]: _, ...rest } = client;
      await ctx.db.patch(args.id, rest);
    } else {
      await ctx.db.patch(args.id, { [args.field]: args.value });
    }
  },
});

export const assignClient = mutation({
  args: {
    clientId: v.string(),
    newCaseManagerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find the client by clientId
    const client = await ctx.db
      .query("clients")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .first();

    if (!client) {
      throw new Error("Client not found");
    }

    // Check if the new case manager is already assigned to this client
    const existingAssignment = await ctx.db
      .query("caseManagerClients")
      .withIndex("by_case_manager_client", (q) => 
        q.eq("caseManagerId", args.newCaseManagerId).eq("clientId", client._id)
      )
      .first();

    if (existingAssignment) {
      // Unarchive the assignment if it was archived
      if (existingAssignment.archived) {
        await ctx.db.patch(existingAssignment._id, { archived: false });
      }
      return existingAssignment._id;
    } else {
      // Create new assignment
      return await ctx.db.insert("caseManagerClients", {
        caseManagerId: args.newCaseManagerId,
        clientId: client._id,
        archived: false,
        assignedDate: Date.now(),
      });
    }
  },
});

export const bulkImport = mutation({
  args: {
    clients: v.array(v.object({
      firstName: v.string(),
      lastName: v.string(),
      preferredName: v.optional(v.string()),
      clientId: v.string(),
      phoneNumber: v.string(),
      insurance: v.string(),
      annualAssessmentDate: v.string(), // MM/DD/YYYY format (Plan End Date)
      planProgram: v.optional(v.string()), // Plan Program field
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Define case management programs and their priority (higher number = higher priority)
    const caseManagementPrograms = {
      "WCCSS": 4,      // Highest priority
      "MH PSH CM": 3,  // High priority
      "BCSS": 2,       // Medium priority  
      "NAV CM": 1      // Lowest priority
    };

    // Function to check if a program is case management
    const isCaseManagement = (program: string | undefined): boolean => {
      if (!program) return false;
      return Object.keys(caseManagementPrograms).includes(program.trim());
    };

    // Function to get program priority
    const getProgramPriority = (program: string | undefined): number => {
      if (!program) return 0;
      return caseManagementPrograms[program.trim() as keyof typeof caseManagementPrograms] || 0;
    };

    // Deduplicate clients by clientId, keeping only case management relevant entries
    const clientMap = new Map<string, typeof args.clients[0]>();
    
    for (const client of args.clients) {
      const existingEntry = clientMap.get(client.clientId);
      
      if (!existingEntry) {
        // First entry for this clientId - only keep if it's case management
        if (isCaseManagement(client.planProgram)) {
          clientMap.set(client.clientId, client);
        }
      } else {
        // Duplicate clientId found - apply case management filtering and priority rules
        const currentPriority = getProgramPriority(client.planProgram);
        const existingPriority = getProgramPriority(existingEntry.planProgram);
        
        // Only consider this entry if it's case management
        if (currentPriority > 0) {
          // If current entry has higher priority, replace the existing one
          if (currentPriority > existingPriority) {
            clientMap.set(client.clientId, client);
          } 
          // If same priority, compare end dates and use the later one
          else if (currentPriority === existingPriority) {
            try {
              const currentDate = new Date(client.annualAssessmentDate);
              const existingDate = new Date(existingEntry.annualAssessmentDate);
              
              // If current date is later (further in the future), use this entry
              if (currentDate > existingDate) {
                clientMap.set(client.clientId, client);
              }
              // If existing date is later or same, keep the existing entry
            } catch (error) {
              console.warn(`Error parsing dates for client ${client.clientId}: current=${client.annualAssessmentDate}, existing=${existingEntry.annualAssessmentDate}`);
              // If date parsing fails, keep the existing entry
            }
          }
          // If current priority is lower, keep the existing entry
        }
        // If current entry is not case management, skip it
      }
    }

    console.log(`Processing ${clientMap.size} unique case management clients after deduplication from ${args.clients.length} total entries`);

    const results = [];
    for (const [clientId, client] of clientMap) {
      // Check if a client with this clientId already exists
      let existingClient = await ctx.db
        .query("clients")
        .withIndex("by_client_id", (q) => q.eq("clientId", client.clientId))
        .first();

      let clientDbId;
      if (existingClient) {
        clientDbId = existingClient._id;
        console.log(`Found existing client: ${client.clientId} (${client.planProgram})`);
      } else {
        // Parse the annual assessment date from MM/DD/YYYY format
        const [month, day, year] = client.annualAssessmentDate.split('/').map(Number);
        console.log('Parsed date:', { month, day, year, original: client.annualAssessmentDate });
        
        // Set the date to the first of the month at noon UTC to avoid timezone issues
        // Note: JavaScript months are 0-based, so we subtract 1 from the month
        const annualAssessmentDate = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)).getTime();
        console.log('Created date:', new Date(annualAssessmentDate).toLocaleDateString());
        
        // Create the client record
        clientDbId = await ctx.db.insert("clients", {
          name: client.preferredName 
            ? `${client.firstName} (${client.preferredName}) ${client.lastName}`
            : `${client.firstName} ${client.lastName}`,
          phoneNumber: client.phoneNumber,
          insurance: client.insurance,
          clientId: client.clientId,
          firstContactCompleted: false,
          secondContactCompleted: false,
          nextQuarterlyReview: Date.now(),
          nextAnnualAssessment: annualAssessmentDate,
          qr1Date: null,
          qr2Date: null,
          qr3Date: null,
          qr4Date: null,
        });
        console.log(`Created new client: ${client.clientId} (${client.planProgram})`);
      }

      // Check if this case manager is already assigned to this client
      const existingAssignment = await ctx.db
        .query("caseManagerClients")
        .withIndex("by_case_manager_client", (q) => 
          q.eq("caseManagerId", userId).eq("clientId", clientDbId)
        )
        .first();

      if (existingAssignment) {
        // Unarchive the assignment if it was archived
        if (existingAssignment.archived) {
          await ctx.db.patch(existingAssignment._id, { archived: false });
          console.log(`Unarchived assignment for client: ${client.clientId} (${client.planProgram})`);
        } else {
          console.log(`Assignment already exists for client: ${client.clientId} (${client.planProgram})`);
        }
      } else {
        // Create new assignment
        await ctx.db.insert("caseManagerClients", {
          caseManagerId: userId,
          clientId: clientDbId,
          archived: false,
          assignedDate: Date.now(),
        });
        console.log(`Created new assignment for client: ${client.clientId} (${client.planProgram})`);
      }
      
      results.push(clientDbId);
    }
    
    console.log(`Successfully processed ${results.length} case management clients`);
    return results;
  },
});

export const bulkImportSimple = mutation({
  args: {
    clients: v.array(v.object({
      firstName: v.string(),
      lastName: v.string(),
      preferredName: v.optional(v.string()),
      clientId: v.string(),
      phoneNumber: v.string(),
      insurance: v.string(),
      annualAssessmentDate: v.string(), // MM/DD/YYYY format
    })),
    deduplicationStrategy: v.optional(v.union(
      v.literal("first"), // Use the first occurrence in the array (DEFAULT - recommended for case management CSVs)
      v.literal("latest"), // Use the latest assessment date
      v.literal("earliest") // Use the earliest assessment date
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const strategy = args.deduplicationStrategy || "first";

    // NOTE: This function is for CSVs with duplicate rows but no program column
    // Perfect for CSVs like: clientId,firstName,lastName,preferredName,clientId,phone,assessmentDate,insurance
    // where the same client appears multiple times with different assessment dates

    // Deduplicate clients by clientId
    const clientMap = new Map<string, typeof args.clients[0]>();
    
    for (const client of args.clients) {
      const existingEntry = clientMap.get(client.clientId);
      
      if (!existingEntry) {
        // First entry for this clientId
        clientMap.set(client.clientId, client);
      } else {
        // Duplicate clientId found - apply deduplication strategy
        if (strategy === "first") {
          continue; // Keep the first entry, skip this one
        } else if (strategy === "latest" || strategy === "earliest") {
          // Parse dates to compare
          const existingDate = new Date(existingEntry.annualAssessmentDate);
          const currentDate = new Date(client.annualAssessmentDate);
          
          if (strategy === "latest" && currentDate > existingDate) {
            clientMap.set(client.clientId, client);
          } else if (strategy === "earliest" && currentDate < existingDate) {
            clientMap.set(client.clientId, client);
          }
        }
      }
    }

    console.log(`Processing ${clientMap.size} unique clients after deduplication (${strategy} strategy) from ${args.clients.length} total entries`);

    const results = [];
    for (const [clientId, client] of clientMap) {
      // Check if a client with this clientId already exists
      let existingClient = await ctx.db
        .query("clients")
        .withIndex("by_client_id", (q) => q.eq("clientId", client.clientId))
        .first();

      let clientDbId;
      if (existingClient) {
        clientDbId = existingClient._id;
        console.log(`Found existing client: ${client.clientId}`);
      } else {
        // Parse the annual assessment date from MM/DD/YYYY format
        const [month, day, year] = client.annualAssessmentDate.split('/').map(Number);
        
        // Set the date to the first of the month at noon UTC to avoid timezone issues
        const annualAssessmentDate = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)).getTime();
        
        // Create the client record
        clientDbId = await ctx.db.insert("clients", {
          name: client.preferredName 
            ? `${client.firstName} (${client.preferredName}) ${client.lastName}`
            : `${client.firstName} ${client.lastName}`,
          phoneNumber: client.phoneNumber,
          insurance: client.insurance,
          clientId: client.clientId,
          firstContactCompleted: false,
          secondContactCompleted: false,
          nextQuarterlyReview: Date.now(),
          nextAnnualAssessment: annualAssessmentDate,
          qr1Date: null,
          qr2Date: null,
          qr3Date: null,
          qr4Date: null,
        });
        console.log(`Created new client: ${client.clientId}`);
      }

      // Check if this case manager is already assigned to this client
      const existingAssignment = await ctx.db
        .query("caseManagerClients")
        .withIndex("by_case_manager_client", (q) => 
          q.eq("caseManagerId", userId).eq("clientId", clientDbId)
        )
        .first();

      if (existingAssignment) {
        // Unarchive the assignment if it was archived
        if (existingAssignment.archived) {
          await ctx.db.patch(existingAssignment._id, { archived: false });
        }
      } else {
        // Create new assignment
        await ctx.db.insert("caseManagerClients", {
          caseManagerId: userId,
          clientId: clientDbId,
          archived: false,
          assignedDate: Date.now(),
        });
      }
      
      results.push(clientDbId);
    }
    
    console.log(`Successfully processed ${results.length} clients`);
    return results;
  },
});

export const resetMonthlyContacts = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    const clients = await ctx.db.query("clients").collect();
    for (const client of clients) {
      await ctx.db.patch(client._id, {
        firstContactCompleted: false,
        secondContactCompleted: false,
      });
    }
  },
});

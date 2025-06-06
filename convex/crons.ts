import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run at midnight on the first day of each month
crons.cron(
  "Reset contacts monthly",
  "0 0 1 * *", // 1st of every month at 00:00
  internal.clients.resetMonthlyContacts,
  {}
);

export default crons; 
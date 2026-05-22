import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "expire stale pending orders",
  { minutes: 5 },
  internal.orders.expireStale,
  {},
);

export default crons;

export * from "./schemas";
export type { z } from "zod";

import type { z } from "zod";
import type {
  ProfileSchema,
  GoalSchema,
  GoalCreateSchema,
  TaskSchema,
  AssignmentSchema,
  AssignmentWithTaskSchema,
  SubmissionSchema,
  PokemonSchema,
  RewardEntrySchema,
  RewardsStatusSchema,
  GenerateTasksRequestSchema,
  PublishTaskRequestSchema,
  TtsRequestSchema,
  SubmitTextSchema,
  ChildTodayResponseSchema,
  SubmissionResponseSchema,
  ProgressSummarySchema,
} from "./schemas";

export type Profile = z.infer<typeof ProfileSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type GoalCreate = z.infer<typeof GoalCreateSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type AssignmentWithTask = z.infer<typeof AssignmentWithTaskSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
export type Pokemon = z.infer<typeof PokemonSchema>;
export type RewardEntry = z.infer<typeof RewardEntrySchema>;
export type RewardsStatus = z.infer<typeof RewardsStatusSchema>;
export type GenerateTasksRequest = z.infer<typeof GenerateTasksRequestSchema>;
export type PublishTaskRequest = z.infer<typeof PublishTaskRequestSchema>;
export type TtsRequest = z.infer<typeof TtsRequestSchema>;
export type SubmitText = z.infer<typeof SubmitTextSchema>;
export type ChildTodayResponse = z.infer<typeof ChildTodayResponseSchema>;
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
export type ProgressSummary = z.infer<typeof ProgressSummarySchema>;

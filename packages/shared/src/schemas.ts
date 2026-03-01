import { z } from "zod";

// ────────────────────────── Enums ──────────────────────────

export const RoleEnum = z.enum(["child", "supervisor"]);
export const AgeBandEnum = z.enum(["7-9", "10-12", "13-15"]);
export const GoalCategoryEnum = z.enum([
  "conversation",
  "self_regulation",
  "help_seeking",
  "values",
  "other",
]);
export const TaskTypeEnum = z.enum([
  "social_story",
  "roleplay",
  "modeling",
  "calming",
]);
export const TaskStatusEnum = z.enum(["draft", "assigned", "archived"]);
export const AssignmentStatusEnum = z.enum([
  "assigned",
  "in_progress",
  "completed",
  "review_required",
]);
export const InputModeEnum = z.enum(["text", "voice"]);

// ────────────────────────── Profiles ──────────────────────────

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  role: RoleEnum,
  display_name: z.string().min(1).max(100),
  age_band: AgeBandEnum.nullable().optional(),
  created_at: z.string().datetime().optional(),
});

// ────────────────────────── Goals ──────────────────────────

export const GoalCreateSchema = z.object({
  child_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  category: GoalCategoryEnum,
  difficulty: z.number().int().min(1).max(5).default(3),
  success_criteria: z.array(z.string()).default([]),
  constraints: z
    .object({
      words_to_avoid: z.array(z.string()).optional(),
      tone: z.string().optional(),
      max_length: z.number().optional(),
      modality: z.enum(["text", "voice", "both"]).optional(),
      triggers_to_avoid: z.array(z.string()).optional(),
    })
    .default({}),
});

export const GoalSchema = GoalCreateSchema.extend({
  id: z.string().uuid(),
  supervisor_id: z.string().uuid(),
  active: z.boolean(),
  created_at: z.string().datetime(),
});

// ────────────────────────── Tasks ──────────────────────────

export const SocialStoryContentSchema = z.object({
  pages: z.array(
    z.object({
      text: z.string(),
      narration_text: z.string().optional(),
      image_prompt: z.string().optional(),
    })
  ),
  reflection_questions: z.array(z.string()).optional(),
});

export const RoleplayContentSchema = z.object({
  scenario: z.string(),
  characters: z.array(
    z.object({ name: z.string(), description: z.string() })
  ),
  dialogue_turns: z.array(
    z.object({
      speaker: z.string(),
      text: z.string().optional(),
      is_child_turn: z.boolean(),
      choices: z.array(z.string()).optional(),
      hint: z.string().optional(),
    })
  ),
  debrief: z.string().optional(),
});

export const ModelingContentSchema = z.object({
  media_url: z.string().optional(),
  media_type: z.enum(["video", "audio"]).optional(),
  observation_prompts: z.array(z.string()),
  reflection_questions: z.array(z.string()),
  narration_text: z.string().optional(),
});

export const CalmingContentSchema = z.object({
  intro_text: z.string(),
  steps: z.array(
    z.object({
      instruction: z.string(),
      duration_seconds: z.number().optional(),
      type: z.enum(["breathing", "grounding", "visualization", "choice"]),
      choices: z
        .array(z.object({ label: z.string(), next_step: z.number() }))
        .optional(),
    })
  ),
  closing_text: z.string(),
});

export const TaskContentSchema = z.union([
  SocialStoryContentSchema,
  RoleplayContentSchema,
  ModelingContentSchema,
  CalmingContentSchema,
]);

export const TaskSchema = z.object({
  id: z.string().uuid(),
  goal_id: z.string().uuid(),
  supervisor_id: z.string().uuid(),
  child_id: z.string().uuid(),
  type: TaskTypeEnum,
  title: z.string(),
  content: z.record(z.unknown()),
  ai_generated: z.boolean(),
  status: TaskStatusEnum,
  created_at: z.string().datetime(),
});

// ────────────────────────── Assignments ──────────────────────────

export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  child_id: z.string().uuid(),
  scheduled_date: z.string(),
  status: AssignmentStatusEnum,
  completed_at: z.string().datetime().nullable().optional(),
});

export const AssignmentWithTaskSchema = AssignmentSchema.extend({
  task: TaskSchema.optional(),
});

// ────────────────────────── Submissions ──────────────────────────

export const SubmitTextSchema = z.object({
  response_text: z.string().min(1).max(5000),
});

export const SubmissionSchema = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  child_id: z.string().uuid(),
  input_mode: InputModeEnum,
  input_text: z.string().nullable().optional(),
  transcript_text: z.string().nullable().optional(),
  ai_feedback: z.string().nullable().optional(),
  scores: z.record(z.unknown()).nullable().optional(),
  created_at: z.string().datetime(),
});

// ────────────────────────── Rewards / Pokemon ──────────────────────────

export const PokemonSchema = z.object({
  id: z.string().uuid(),
  child_id: z.string().uuid(),
  pokemon_key: z.string(),
  rarity: z.string(),
  level: z.number().int(),
  xp: z.number().int(),
  evolution_stage: z.number().int(),
  created_at: z.string().datetime(),
});

export const RewardEntrySchema = z.object({
  id: z.string().uuid(),
  child_id: z.string().uuid(),
  assignment_id: z.string().uuid().nullable().optional(),
  xp_delta: z.number().int(),
  coins_delta: z.number().int(),
  reward_payload: z.record(z.unknown()),
  created_at: z.string().datetime(),
});

export const RewardsStatusSchema = z.object({
  total_xp: z.number().int(),
  total_coins: z.number().int(),
  pokemon_count: z.number().int(),
  latest_reward: RewardEntrySchema.nullable().optional(),
});

// ────────────────────────── API Request/Response ──────────────────────────

export const GenerateTasksRequestSchema = z.object({
  goal_id: z.string().uuid(),
  desired_task_types: z.array(TaskTypeEnum).min(1),
  count: z.number().int().min(1).max(5).default(1),
  constraints: z
    .object({
      reading_level: AgeBandEnum.optional(),
      max_steps: z.number().int().optional(),
      include_audio_narration: z.boolean().optional(),
    })
    .optional(),
});

export const PublishTaskRequestSchema = z.object({
  scheduled_dates: z.array(z.string()).min(1),
});

export const TtsRequestSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const ChildTodayResponseSchema = z.object({
  assignments: z.array(AssignmentWithTaskSchema),
  rewards_status: RewardsStatusSchema,
  streak_days: z.number().int(),
});

export const SubmissionResponseSchema = z.object({
  submission: SubmissionSchema,
  feedback: z.string(),
  rewards: RewardEntrySchema,
  pokemon_update: PokemonSchema.nullable().optional(),
});

export const ProgressSummarySchema = z.object({
  child_id: z.string().uuid(),
  total_completed_7d: z.number().int(),
  total_completed_30d: z.number().int(),
  by_goal: z.array(
    z.object({
      goal_id: z.string().uuid(),
      goal_title: z.string(),
      completed: z.number().int(),
      total: z.number().int(),
    })
  ),
  difficulty_signals: z.array(z.string()),
});

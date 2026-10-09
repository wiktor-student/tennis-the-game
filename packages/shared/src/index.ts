import { z } from 'zod';

/**
 * API contracts (v1). Every request body and response is described here once and validated
 * on both sides: the API parses requests, the web client parses responses.
 */

// ─── Primitives ──────────────────────────────────────────────────────────────

export const SkillIdSchema = z.enum([
  'serve',
  'return',
  'forehand',
  'backhand',
  'net',
  'fitness',
  'mental',
]);
export const CoachIdSchema = z.enum(['dad', 'club', 'licensed', 'academy', 'tour', 'super']);
export const GenderSchema = z.enum(['M', 'F']);
export const BackgroundSchema = z.enum(['wall', 'sponsor_kid', 'academy', 'chosen']);
export const DifficultySchema = z.enum(['normal', 'hard']);
export const ModeSchema = z.enum(['normal', 'daily']);
export const DayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(24)
  .regex(/^[\p{L}\p{N} ._'-]+$/u, "Dozwolone są litery, cyfry, spacje i znaki . _ ' -");

export const CareerConfigSchema = z.object({
  name: z.object({
    first: z.string().trim().min(1).max(24),
    last: z.string().trim().min(1).max(32),
  }),
  gender: GenderSchema,
  background: BackgroundSchema,
  difficulty: DifficultySchema,
  mode: ModeSchema,
});
export type CareerConfigDto = z.infer<typeof CareerConfigSchema>;

const Blocks = z.number().int().min(0).max(10);

/** Mirrors the engine's Action union. */
export const ActionSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('continue') }),
  z.object({ t: z.literal('choose'), option: z.number().int().min(0).max(15) }),
  z.object({
    t: z.literal('train'),
    plan: z.object({
      skills: z.object(
        Object.fromEntries(SkillIdSchema.options.map((id) => [id, Blocks.optional()])) as Record<
          z.infer<typeof SkillIdSchema>,
          z.ZodOptional<typeof Blocks>
        >,
      ),
      rest: Blocks,
      learn: z.string().max(32).nullable(),
      preferred: z.string().max(32),
    }),
  }),
  z.object({
    t: z.literal('team'),
    coach: CoachIdSchema,
    physio: z.boolean(),
    fitnessCoach: z.boolean(),
  }),
  z.object({ t: z.literal('sponsors'), accept: z.array(z.string().max(16)).max(8) }),
  z.object({ t: z.literal('schedule'), plan: z.array(z.string().max(48).nullable()).max(60) }),
  z.object({ t: z.literal('play') }),
  z.object({ t: z.literal('retire') }),
]);
export type ActionDto = z.infer<typeof ActionSchema>;

export const MAX_ACTIONS = 25_000;

// ─── Auth & profile ──────────────────────────────────────────────────────────

export const PlayerSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  locale: z.enum(['pl', 'en']),
  selectedRacket: z.string().nullable(),
  streakDays: z.number().int(),
  createdAt: z.string(),
});
export type PlayerDto = z.infer<typeof PlayerSchema>;

export const AuthResponseSchema = z.object({ token: z.string(), player: PlayerSchema });
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const UpdateMeSchema = z.object({
  displayName: DisplayNameSchema.optional(),
  locale: z.enum(['pl', 'en']).optional(),
  selectedRacket: z.string().max(32).nullable().optional(),
});
export type UpdateMeBody = z.infer<typeof UpdateMeSchema>;

// ─── Careers ─────────────────────────────────────────────────────────────────

export const StartCareerSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('normal'), config: CareerConfigSchema }),
  z.object({ mode: z.literal('daily') }),
]);
export type StartCareerBody = z.infer<typeof StartCareerSchema>;

export const StartCareerResponseSchema = z.object({
  careerId: z.string(),
  seed: z.string(),
  config: CareerConfigSchema,
  engineVersion: z.string(),
  dayKey: DayKeySchema.nullable(),
});
export type StartCareerResponse = z.infer<typeof StartCareerResponseSchema>;

export const FinishCareerSchema = z.object({
  actions: z.array(ActionSchema).min(1).max(MAX_ACTIONS),
});
export type FinishCareerBody = z.infer<typeof FinishCareerSchema>;

export const CareerCardSchema = z.object({
  careerId: z.string(),
  mode: ModeSchema,
  name: z.string(),
  gender: GenderSchema,
  background: BackgroundSchema,
  difficulty: DifficultySchema,
  legacy: z.number().int(),
  verdict: z.string(),
  seasons: z.number().int(),
  peakRank: z.number().int().nullable(),
  slamTitles: z.number().int(),
  titles: z.number().int(),
  prizeMoney: z.number(),
  finishedAt: z.string(),
  rankable: z.boolean(),
});
export type CareerCard = z.infer<typeof CareerCardSchema>;

export const FinishCareerResponseSchema = z.object({
  verified: z.literal(true),
  career: CareerCardSchema,
  newAchievements: z.array(z.string()),
  positions: z.object({
    daily: z.number().int().nullable(),
    today: z.number().int().nullable(),
    week: z.number().int().nullable(),
  }),
  streakDays: z.number().int(),
});
export type FinishCareerResponse = z.infer<typeof FinishCareerResponseSchema>;

// ─── Leaderboards ────────────────────────────────────────────────────────────

export const BoardSchema = z.enum(['daily', 'today', 'week', 'all']);
export type Board = z.infer<typeof BoardSchema>;

export const LeaderboardEntrySchema = z.object({
  position: z.number().int(),
  careerId: z.string(),
  owner: z.string(),
  name: z.string(),
  gender: GenderSchema,
  legacy: z.number().int(),
  seasons: z.number().int(),
  peakRank: z.number().int().nullable(),
  slamTitles: z.number().int(),
  verdict: z.string(),
  isMe: z.boolean(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const ChampionSchema = z.object({
  board: BoardSchema,
  periodKey: z.string(),
  name: z.string(),
  owner: z.string(),
  legacy: z.number().int(),
});
export type Champion = z.infer<typeof ChampionSchema>;

export const LeaderboardResponseSchema = z.object({
  board: BoardSchema,
  periodKey: z.string(),
  entries: z.array(LeaderboardEntrySchema),
  reigning: ChampionSchema.nullable(),
});
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

// ─── Daily & progress ────────────────────────────────────────────────────────

export const GoalStateSchema = z.object({
  key: z.string(),
  templateId: z.string(),
  target: z.number(),
  value: z.number(),
  done: z.boolean(),
});

export const DailyResponseSchema = z.object({
  dayKey: DayKeySchema,
  weekKey: z.string(),
  seed: z.string(),
  config: CareerConfigSchema,
  attempted: z.boolean(),
  goals: z.array(GoalStateSchema),
  weekly: z.object({ key: z.string(), templateId: z.string(), done: z.boolean() }),
  secondsLeft: z.number().int(),
});
export type DailyResponse = z.infer<typeof DailyResponseSchema>;

export const ProgressResponseSchema = z.object({
  achievements: z.array(z.object({ id: z.string(), unlockedAt: z.string() })),
  careers: z.array(CareerCardSchema),
  records: z.object({
    bestLegacy: z.number().int(),
    mostSlams: z.number().int(),
    bestPeakRank: z.number().int().nullable(),
    richest: z.number(),
    careers: z.number().int(),
  }),
  trophies: z.array(ChampionSchema),
});
export type ProgressResponse = z.infer<typeof ProgressResponseSchema>;

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

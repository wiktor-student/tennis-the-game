import {
  ENGINE_VERSION,
  buildSummary,
  createCareer,
  dailyCareer,
  overall,
  replay,
  step,
  warsawDayKey,
  type Action,
  type CareerConfig,
  type CareerState,
  type CareerSummary,
  type StageId,
} from '@ttg/engine';
import type { FinishCareerResponse } from '@ttg/shared';
import { create } from 'zustand';
import { ApiFailure, api, apiEnabled, ensureSession } from '../lib/api';
import { load, remove, save } from '../lib/storage';
import { useMeta } from './meta';

export const SLOT_COUNT = 3;

export type Submission =
  | { status: 'offline' }
  | { status: 'pending' }
  | { status: 'done'; result: FinishCareerResponse }
  | { status: 'error'; reason: string };

/** Everything needed to resume a career: the replayable log plus a snapshot for fast loads. */
interface SaveData {
  version: 1;
  engineVersion: string;
  config: CareerConfig;
  seed: string;
  careerId: string | null;
  dayKey: string | null;
  actions: Action[];
  snapshot: CareerState | null;
  submission: Submission | null;
  newAchievements: string[];
  summary: CareerSummary | null;
  updatedAt: number;
}

export interface SlotPreview {
  slot: number;
  name: string;
  gender: 'M' | 'F';
  age: number;
  stage: StageId;
  ovr: number;
  rank: number | null;
  season: number;
  retired: boolean;
  daily: boolean;
  legacy: number;
  updatedAt: number;
}

interface GameState {
  slots: (SlotPreview | null)[];
  activeSlot: number | null;
  career: CareerState | null;
  data: SaveData | null;
  error: string | null;
  refreshSlots: () => void;
  open: (slot: number) => boolean;
  close: () => void;
  removeSlot: (slot: number) => void;
  newCareer: (slot: number, config: CareerConfig) => Promise<void>;
  newDaily: (slot: number) => Promise<void>;
  dispatch: (action: Action) => void;
  submit: () => Promise<void>;
}

const key = (slot: number) => `slot:${slot}`;

function preview(slot: number, data: SaveData): SlotPreview | null {
  const s = data.snapshot;
  if (!s) return null;
  return {
    slot,
    name: `${s.player.first} ${s.player.last}`,
    gender: s.player.gender,
    age: s.player.age,
    stage: s.season.stage,
    ovr: overall(s.player.skills),
    rank: s.season.stage === 'pro' ? s.pro.rank : null,
    season: s.history.length + 1,
    retired: s.phase.kind === 'retired',
    daily: s.config.mode === 'daily',
    legacy: s.legacy,
    updatedAt: data.updatedAt,
  };
}

function persist(slot: number, data: SaveData): void {
  data.updatedAt = Date.now();
  if (!save(key(slot), data)) {
    // Quota exceeded: keep the replayable log without the snapshot.
    save(key(slot), { ...data, snapshot: null });
  }
}

function readSlot(slot: number): SaveData | null {
  const data = load<SaveData | null>(key(slot), null);
  if (!data || data.version !== 1) return null;
  if (!data.snapshot) {
    try {
      data.snapshot = replay(data.config, data.seed, data.actions);
    } catch {
      return null;
    }
  }
  return data;
}

function randomSeed(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function freshData(config: CareerConfig, seed: string, careerId: string | null, dayKey: string | null): SaveData {
  return {
    version: 1,
    engineVersion: ENGINE_VERSION,
    config,
    seed,
    careerId,
    dayKey,
    actions: [],
    snapshot: createCareer(config, seed),
    submission: null,
    newAchievements: [],
    summary: null,
    updatedAt: Date.now(),
  };
}

export const useGame = create<GameState>((set, get) => ({
  slots: [],
  activeSlot: null,
  career: null,
  data: null,
  error: null,

  refreshSlots: () => {
    const slots: (SlotPreview | null)[] = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const data = readSlot(i);
      slots.push(data ? preview(i, data) : null);
    }
    set({ slots });
  },

  open: (slot) => {
    const data = readSlot(slot);
    if (!data?.snapshot) return false;
    set({ activeSlot: slot, data, career: data.snapshot, error: null });
    return true;
  },

  close: () => {
    set({ activeSlot: null, data: null, career: null });
    get().refreshSlots();
  },

  removeSlot: (slot) => {
    remove(key(slot));
    get().refreshSlots();
  },

  newCareer: async (slot, config) => {
    let seed = randomSeed();
    let careerId: string | null = null;
    if (apiEnabled && config.background !== 'chosen' && (await ensureSession())) {
      try {
        const started = await api.startCareer({ mode: 'normal', config });
        seed = started.seed;
        careerId = started.careerId;
      } catch {
        /* offline fallback: local seed, result stays local */
      }
    }
    const data = freshData(config, seed, careerId, null);
    persist(slot, data);
    set({ activeSlot: slot, data, career: data.snapshot, error: null });
  },

  newDaily: async (slot) => {
    const day = warsawDayKey();
    let { seed, config } = dailyCareer(day);
    let careerId: string | null = null;
    if (apiEnabled && (await ensureSession())) {
      try {
        const started = await api.startCareer({ mode: 'daily' });
        seed = started.seed;
        config = started.config;
        careerId = started.careerId;
      } catch (error) {
        if (error instanceof ApiFailure && error.code === 'daily_already_attempted') {
          useMeta.getState().markDailyAttempt(day);
          set({ error: 'daily_already_attempted' });
          return;
        }
      }
    }
    useMeta.getState().markDailyAttempt(day);
    const data = freshData(config, seed, careerId, day);
    persist(slot, data);
    set({ activeSlot: slot, data, career: data.snapshot, error: null });
  },

  dispatch: (action) => {
    const { career, data, activeSlot } = get();
    if (!career || !data || activeSlot === null) return;
    const next = step(career, action);
    data.actions.push(action);
    data.snapshot = next;
    if (next.phase.kind === 'retired' && !data.summary) {
      const summary = buildSummary(next, next.phase.reason);
      data.summary = summary;
      data.newAchievements = useMeta.getState().recordCareer(summary, !!data.careerId);
      data.submission = data.careerId ? { status: 'pending' } : { status: 'offline' };
    }
    persist(activeSlot, data);
    set({ career: next, data: { ...data } });
    if (data.submission?.status === 'pending') void get().submit();
  },

  submit: async () => {
    const { data, activeSlot } = get();
    if (!data?.careerId || activeSlot === null) return;
    set({ data: { ...data, submission: { status: 'pending' } } });
    try {
      const result = await api.finishCareer(data.careerId, data.actions);
      data.submission = { status: 'done', result };
    } catch (error) {
      const reason = error instanceof ApiFailure ? `${error.code}` : 'unknown';
      data.submission = { status: 'error', reason };
    }
    persist(activeSlot, data);
    if (get().activeSlot === activeSlot) set({ data: { ...data } });
  },
}));

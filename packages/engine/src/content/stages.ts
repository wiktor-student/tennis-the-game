import { l, type L } from '../i18n';
import type { StageId } from '../model/types';

export interface StageDef {
  id: StageId;
  name: L;
  /** Subtitle shown under the player's name, like a programme header. */
  circuit: L;
  minAge: number;
  maxAge: number;
  /** Number of AI rivals in the season field (juniors). */
  fieldSize: number;
  /** Mean rating of the field at the stage's entry age. */
  fieldMean: number;
  /** Base cost of equipment and strings per season. */
  equipment: number;
  /** Base travel cost per event, before region multipliers. */
  travel: number;
  next: StageId | null;
}

export const STAGES: Record<StageId, StageDef> = {
  mini: {
    id: 'mini',
    name: l('Tenis 10', 'Tennis 10'),
    circuit: l('Turnieje regionalne PZT', 'Polish regional events'),
    minAge: 8,
    maxAge: 10,
    fieldSize: 39,
    fieldMean: 25,
    equipment: 2_500,
    travel: 1_400,
    next: 'national',
  },
  national: {
    id: 'national',
    name: l('Ranking krajowy', 'National ranking'),
    circuit: l('Turnieje ogólnopolskie PZT', 'Polish national tour'),
    minAge: 11,
    maxAge: 13,
    fieldSize: 79,
    fieldMean: 36,
    equipment: 5_000,
    travel: 2_600,
    next: 'europe',
  },
  europe: {
    id: 'europe',
    name: l('Tennis Europe', 'Tennis Europe'),
    circuit: l('Juniorski tour europejski', 'European junior tour'),
    minAge: 14,
    maxAge: 15,
    fieldSize: 79,
    fieldMean: 48,
    equipment: 7_000,
    travel: 4_200,
    next: 'itf_junior',
  },
  itf_junior: {
    id: 'itf_junior',
    name: l('ITF Juniors', 'ITF Juniors'),
    circuit: l('Światowy tour juniorów', 'World junior tour'),
    minAge: 16,
    maxAge: 17,
    fieldSize: 127,
    fieldMean: 57,
    equipment: 10_000,
    travel: 6_000,
    next: 'pro',
  },
  pro: {
    id: 'pro',
    name: l('Zawodowstwo', 'Professional tour'),
    circuit: l('Tour zawodowy', 'Professional tour'),
    minAge: 18,
    maxAge: 38,
    fieldSize: 0,
    fieldMean: 0,
    equipment: 15_000,
    travel: 7_000,
    next: null,
  },
};

export function stageForAge(age: number): StageId {
  if (age <= STAGES.mini.maxAge) return 'mini';
  if (age <= STAGES.national.maxAge) return 'national';
  if (age <= STAGES.europe.maxAge) return 'europe';
  if (age <= STAGES.itf_junior.maxAge) return 'itf_junior';
  return 'pro';
}

export const REGION_TRAVEL: Record<string, number> = {
  pl: 0.55,
  eu: 1.0,
  am: 1.7,
  as: 1.8,
  oc: 2.0,
};

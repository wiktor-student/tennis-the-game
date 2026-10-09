import { DIFFICULTIES, FAMILY_SUPPORT } from '../content/backgrounds';
import { COACHES, FITNESS_COACH, PHYSIO } from '../content/coaches';
import { LEVELS } from '../content/levels';
import { SPONSORS, type SponsorTemplate } from '../content/sponsors';
import { REGION_TRAVEL, STAGES } from '../content/stages';
import { l, type L } from '../i18n';
import type {
  ActiveSponsor,
  CareerState,
  LedgerEntry,
  SponsorOffer,
  TournamentDef,
} from '../model/types';
import type { Rng } from '../rng';

export function addLedger(state: CareerState, kind: LedgerEntry['kind'], label: L, amount: number): void {
  if (amount === 0) return;
  state.finance.budget += amount;
  state.finance.ledger.push({ kind, label, amount });
  if (state.finance.budget < state.stats.maxDebt) state.stats.maxDebt = state.finance.budget;
}

function costFactor(state: CareerState): number {
  return DIFFICULTIES[state.config.difficulty].costFactor;
}

export function staffCost(state: CareerState, coach = state.team.coach, physio = state.team.physio, fitnessCoach = state.team.fitnessCoach): number {
  return Math.round(
    (COACHES[coach].salary + (physio ? PHYSIO.salary : 0) + (fitnessCoach ? FITNESS_COACH.salary : 0)) *
      costFactor(state),
  );
}

export function equipmentCost(state: CareerState): number {
  const hasRacketDeal = state.sponsors.some((s) => s.category === 'racket');
  const base = STAGES[state.season.stage].equipment * costFactor(state);
  return Math.round(hasRacketDeal ? base * 0.3 : base);
}

/** Estimated travel cost for one tournament. */
export function travelCost(state: CareerState, t: TournamentDef): number {
  const stage = STAGES[t.stage];
  const level = LEVELS[t.level];
  let cost = stage.travel * (REGION_TRAVEL[t.region] ?? 1);
  if (level.hospitality) cost *= 0.55;
  // Lower-tier pros share rooms, take buses and string their own rackets.
  if (t.level === 'itf15' || t.level === 'itf25') cost *= 0.5;
  else if (t.level.startsWith('ch')) cost *= 0.8;
  if (t.span > 1) cost *= 1.35;
  if (state.team.coach === 'tour' || state.team.coach === 'super') cost *= 1.25;
  return Math.round(cost * costFactor(state));
}

/** Season-start payments: family support, sponsor money, staff and equipment. */
export function applySeasonStartFinances(state: CareerState): void {
  const support = FAMILY_SUPPORT[state.finance.familyTier];
  if (state.player.age < 24 && support.amount > 0) {
    addLedger(state, 'family', l('Wsparcie rodziny', 'Family support'), support.amount);
  }
  state.finance.familyRevealed = true;

  // Federation grant for juniors who finished near the top of their standings.
  const last = state.history[state.history.length - 1];
  const grant = { mini: 0, national: 8_000, europe: 20_000, itf_junior: 35_000, pro: 0 }[state.season.stage];
  if (grant > 0 && last && last.rankEnd !== null && last.rankEnd <= 5) {
    addLedger(state, 'bonus', l('Stypendium związkowe PZT', 'PZT federation grant'), grant);
  }

  for (const sponsor of state.sponsors) {
    addLedger(state, 'sponsor', l(sponsor.name), sponsor.amount);
    state.stats.sponsorMoney += sponsor.amount;
  }
  const staff = staffCost(state);
  if (staff > 0) addLedger(state, 'staff', l('Sztab szkoleniowy', 'Coaching staff'), -staff);
  addLedger(state, 'equipment', l('Sprzęt i naciągi', 'Equipment and strings'), -equipmentCost(state));
}

/** Marketability drives sponsor tiers and amounts. */
export function marketability(state: CareerState): number {
  const p = state.player;
  let rankBonus = 0;
  if (state.season.stage === 'pro') {
    const r = state.pro.rank ?? 9999;
    rankBonus = r <= 10 ? 40 : r <= 30 ? 30 : r <= 50 ? 25 : r <= 100 ? 15 : r <= 200 ? 8 : 0;
  } else {
    const last = state.history[state.history.length - 1];
    rankBonus = last && last.rankEnd !== null && last.rankEnd <= 3 ? 6 : 0;
  }
  return p.media * 0.5 + p.reputation * 0.3 + rankBonus;
}

function tierFor(m: number): 1 | 2 | 3 | 4 {
  if (m >= 58) return 4;
  if (m >= 38) return 3;
  if (m >= 18) return 2;
  return 1;
}

export function generateSponsorOffers(state: CareerState, rng: Rng): SponsorOffer[] {
  const m = marketability(state);
  const maxTier = tierFor(m);
  const taken = new Set(state.sponsors.map((s) => s.category));
  const isPro = state.season.stage === 'pro';
  const rank = state.pro.rank ?? 9999;
  const eligible = SPONSORS.filter(
    (t) =>
      t.tier <= maxTier &&
      !taken.has(t.category) &&
      (!t.proOnly || isPro) &&
      (!t.condition || t.condition.kind !== 'rank_top' || rank <= t.condition.value * 1.6) &&
      !state.sponsors.some((s) => s.templateId === t.id),
  );
  const count = Math.min(4, 2 + (m > 30 ? 1 : 0) + (m > 60 ? 1 : 0));
  const offers: SponsorOffer[] = [];
  const usedCategories = new Set<string>();
  const pool = [...eligible];
  while (offers.length < count && pool.length > 0) {
    const template = rng.weighted(pool, (t) => (usedCategories.has(t.category) ? 0.3 : 1) * t.tier ** 1.5);
    pool.splice(pool.indexOf(template), 1);
    usedCategories.add(template.category);
    offers.push(makeOffer(state, rng, template, m));
  }
  return offers;
}

function makeOffer(state: CareerState, rng: Rng, t: SponsorTemplate, m: number): SponsorOffer {
  const factor = DIFFICULTIES[state.config.difficulty].sponsorFactor * (state.flags.includes('agent') ? 1.4 : 1);
  const amount = rng.range(t.amount[0], t.amount[1]) * (0.8 + m / 120) * factor;
  state.nextId += 1;
  return {
    id: `o${state.nextId}`,
    templateId: t.id,
    name: t.name,
    category: t.category,
    amount: Math.round(amount / 500) * 500,
    seasons: rng.int(t.seasons[0], t.seasons[1]),
    perk: t.perk,
    condition: t.condition ?? null,
  };
}

export function acceptSponsors(state: CareerState, offers: SponsorOffer[], accept: string[]): void {
  const categories = new Set(state.sponsors.map((s) => s.category));
  for (const offer of offers) {
    if (!accept.includes(offer.id) || categories.has(offer.category)) continue;
    categories.add(offer.category);
    const active: ActiveSponsor = { ...offer, seasonsLeft: offer.seasons };
    state.sponsors.push(active);
  }
}

/** End of season: check conditions and count down contracts. */
export function settleSponsors(state: CareerState): string[] {
  const dropped: string[] = [];
  state.sponsors = state.sponsors.filter((s) => {
    s.seasonsLeft -= 1;
    const failed =
      s.condition?.kind === 'rank_top' && (state.pro.rank ?? 9999) > s.condition.value;
    if (failed) dropped.push(s.name);
    return s.seasonsLeft > 0 && !failed;
  });
  return dropped;
}

/** Share of prize money kept after the agent's cut. */
export function prizeShare(state: CareerState): number {
  return state.flags.includes('agent') ? 0.85 : 1;
}

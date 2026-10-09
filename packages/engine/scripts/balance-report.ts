/**
 * Balance report: plays N full careers per background with the bot and prints distributions.
 *   npm run balance -- 40
 */
import { SKILL_IDS, applyAction, buildSummary, createCareer, type BackgroundId, type CareerSummary } from '../src';
import { botAction } from '../src/bot';

const runs = Number(process.argv[2] ?? 30);
const backgrounds: BackgroundId[] = ['wall', 'sponsor_kid', 'academy', 'chosen'];

function play(seed: string, background: BackgroundId): { summary: CareerSummary; actions: number; ms: number; pot: number; peakOvr: number } {
  const started = performance.now();
  const state = createCareer(
    { name: { first: 'Test', last: 'Bot' }, gender: Number(seed.slice(-1)) % 2 ? 'F' : 'M', background, difficulty: 'normal', mode: 'normal' },
    seed,
  );
  let actions = 0;
  for (;;) {
    const action = botAction(state);
    if (!action) break;
    applyAction(state, action);
    actions += 1;
    if (actions > 20_000) throw new Error(`Runaway career ${seed}`);
  }
  const reason = state.phase.kind === 'retired' ? state.phase.reason : 'choice';
  const pot = SKILL_IDS.reduce((n, id) => n + state.player.potential[id], 0) / SKILL_IDS.length;
  const peakOvr = Math.max(...state.history.map((h) => h.ovr));
  return { summary: buildSummary(state, reason), actions, ms: performance.now() - started, pot, peakOvr };
}

const pct = (xs: number[], p: number) => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0;
};

for (const bg of backgrounds) {
  const results = Array.from({ length: runs }, (_, i) => play(`balance-${bg}-${i}`, bg));
  const s = results.map((r) => r.summary);
  const peaks = s.map((x) => x.peakRank ?? 2000);
  const legacy = s.map((x) => x.legacy || x.legacyRaw);
  console.info(`\n── ${bg} (${runs} careers) ──`);
  console.info(`peak rank   p10 ${pct(peaks, 10)} · p50 ${pct(peaks, 50)} · p90 ${pct(peaks, 90)}`);
  console.info(`legacy      p10 ${pct(legacy, 10)} · p50 ${pct(legacy, 50)} · p90 ${pct(legacy, 90)} · max ${Math.max(...legacy)}`);
  console.info(`top100 ${s.filter((x) => (x.peakRank ?? 9999) <= 100).length} · top10 ${s.filter((x) => (x.peakRank ?? 9999) <= 10).length} · no1 ${s.filter((x) => x.peakRank === 1).length}`);
  console.info(`slams ${s.reduce((n, x) => n + x.slamTitles, 0)} · jr slams ${s.reduce((n, x) => n + x.juniorSlamTitles, 0)} · pro titles avg ${(s.reduce((n, x) => n + x.proTitles, 0) / runs).toFixed(1)}`);
  console.info(`prize avg ${(s.reduce((n, x) => n + x.prizeMoney, 0) / runs / 1e6).toFixed(1)}m · debt endings ${s.filter((x) => x.retireReason === 'debt').length} · seasons avg ${(s.reduce((n, x) => n + x.seasons, 0) / runs).toFixed(1)}`);
  console.info(`verdicts ${JSON.stringify(s.reduce<Record<string, number>>((m, x) => ((m[x.verdict] = (m[x.verdict] ?? 0) + 1), m), {}))}`);
  console.info(`potential avg ${(results.reduce((n, r) => n + r.pot, 0) / runs).toFixed(1)} · peak OVR avg ${(results.reduce((n, r) => n + r.peakOvr, 0) / runs).toFixed(1)} · pairs ${results.map((r) => `${r.pot.toFixed(0)}→${r.peakOvr}/#${r.summary.peakRank}`).join(" ")}`);
  console.info(`perf: ${(results.reduce((n, r) => n + r.ms, 0) / runs).toFixed(0)} ms/career · ${(results.reduce((n, r) => n + r.actions, 0) / runs).toFixed(0)} actions/career`);
}

/** Debug: prints a single career season by season (OVR vs field). npx tsx packages/engine/scripts/trajectory.ts academy 3 */
import { applyAction, createCareer, type BackgroundId } from '../src';
import { botAction } from '../src/bot';

const bg = (process.argv[2] ?? 'wall') as BackgroundId;
const seed = `traj-${bg}-${process.argv[3] ?? '1'}`;
const state = createCareer({ name: { first: 'A', last: 'B' }, gender: 'M', background: bg, difficulty: 'normal', mode: 'normal' }, seed);
console.info('potential', JSON.stringify(state.player.potential));
let lastYear = 0;
for (;;) {
  const a = botAction(state);
  if (!a) break;
  applyAction(state, a);
  if (state.phase.kind === 'season_end' && state.phase.record.year !== lastYear) {
    const r = state.phase.record;
    lastYear = r.year;
    const ratings = state.field.map((f) => f.rating).sort((x, y) => y - x);
    console.info(`${r.year} age ${r.age} ${r.stage.padEnd(10)} ovr ${r.ovr} rank ${r.rankEnd} titles ${r.titles.length} W-L ${r.won}-${r.lost} | field top ${ratings[0]?.toFixed(1)} #10 ${ratings[9]?.toFixed(1)} #100 ${ratings[99]?.toFixed(1)} med ${ratings[Math.floor(ratings.length/2)]?.toFixed(1)} | coach ${state.team.coach} budget ${Math.round(state.finance.budget/1000)}k`);
  }
}

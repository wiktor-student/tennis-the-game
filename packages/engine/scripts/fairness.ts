/** Debug: equal-rated player vs AI should be ~50%. */
import { Rng } from '../src/rng';
import { aiCompetitor, continueMatch, dayForm, playerCompetitor, quickMatch } from '../src/sim/match';
import type { AIPlayer, Skills } from '../src';

const rng = Rng.fromSeed('fair');
for (const R of [60, 75, 85]) {
  const skills: Skills = { serve: R, return: R, forehand: R, backhand: R, net: R, fitness: R, mental: R };
  const ai: AIPlayer = { id: 'x', first: 'a', last: 'b', nat: 'ES', birthYear: 2000, rating: R, potential: R, style: 'allround', surfacePref: null, hand: 'R', mental: R, results: [], points: 0, rank: 1 };
  let wins = 0, quickWins = 0;
  const N = 3000;
  for (let i = 0; i < N; i++) {
    const a = playerCompetitor(skills, 82, false, dayForm(rng));
    const b = aiCompetitor(ai, 'hard', 2026, dayForm(rng));
    const setup = { a, b, surface: 'hard' as const, bestOf: 3 as const, decidingTiebreak10: false };
    if (continueMatch(rng, setup, [], 'A', true).winner === 'A') wins++;
    if (quickMatch(rng, setup).winner === 'A') quickWins++;
  }
  // rating gap sensitivity
  const gaps = [2, 5, 10].map((g) => {
    let w = 0;
    for (let i = 0; i < N; i++) {
      const a = aiCompetitor({ ...ai, rating: R + g, mental: R + g }, 'hard', 2026, dayForm(rng) * 0.8);
      const b = aiCompetitor(ai, 'hard', 2026, dayForm(rng) * 0.8);
      if (quickMatch(rng, { a, b, surface: 'hard', bestOf: 3, decidingTiebreak10: false }).winner === 'A') w++;
    }
    return `+${g}: ${(w / N * 100).toFixed(0)}%`;
  });
  console.info(`R=${R} detailed ${(wins / N * 100).toFixed(1)}% · quick ${(quickWins / N * 100).toFixed(1)}% · AI gap ${gaps.join(' ')}`);
}

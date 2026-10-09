import {
  applyAction,
  botAction,
  createCareer,
  type Action,
  type CareerConfig,
  type Phase,
} from '@ttg/engine';
import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useGame } from '../store/game';

/**
 * Development-only route used for documentation screenshots:
 *   /#/demo/tactics?season=12  → a bot-played career stopped at the first scouting report
 *   after the given number of seasons. Stores the career in slot 3.
 */
export function DemoScreen() {
  const { target = 'tactics' } = useParams();
  const navigate = useNavigate();
  const adopt = useGame((s) => s.adopt);
  const [params] = useSearchParams();

  useEffect(() => {
    const minSeasons = Number(params.get('season') ?? 0);
    const minResults = Number(params.get('results') ?? 0);
    const config: CareerConfig = {
      name: { first: params.get('first') ?? 'Hanna', last: params.get('last') ?? 'Wróblewska' },
      gender: params.get('gender') === 'M' ? 'M' : 'F',
      background: 'academy',
      difficulty: 'normal',
      mode: 'normal',
    };
    const seed = params.get('seed') ?? 'demo-notebook';
    const state = createCareer(config, seed);
    const actions: Action[] = [];
    for (let i = 0; i < 30_000; i++) {
      const kind: Phase['kind'] = state.phase.kind;
      if (
        kind === target &&
        state.history.length >= minSeasons &&
        state.season.results.length >= minResults
      )
        break;
      const action = botAction(state);
      if (!action) break;
      applyAction(state, action);
      actions.push(action);
    }
    adopt(2, config, seed, actions, state);
    navigate('/play', { replace: true });
  }, [target, params, adopt, navigate]);

  return null;
}

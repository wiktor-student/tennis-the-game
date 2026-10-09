import { TACTICS_BY_ID, genderize, type CareerState, type CareerSummary } from '@ttg/engine';
import type { Locale } from '../store/settings';
import { money } from './format';

const SLAM_NAME: Record<string, string> = {
  ao: 'Australian Open',
  rg: 'Roland Garros',
  wim: 'Wimbledon',
  uso: 'US Open',
};

/** A short encyclopaedia entry generated from the finished career. */
export function biography(state: CareerState, s: CareerSummary, locale: Locale): string[] {
  const g = s.gender;
  const pl = locale === 'pl';
  const born = state.player.birthYear;
  const tour = g === 'M' ? 'ATP' : 'WTA';
  const out: string[] = [];
  const w = (text: string) => out.push(genderize(text, g));

  const origins: Record<string, [string, string]> = {
    wall: [
      'odbijając piłkę o ścianę garażu za blokiem',
      'hitting balls against a garage wall behind a block of flats',
    ],
    sponsor_kid: [
      'w świetle kamer, jako dziecko znanego biznesmena',
      'in front of cameras, as the child of a well-known businessman',
    ],
    academy: ['w klubowej grupie naborowej', 'in a club selection group'],
    chosen: [
      'jako cudowne dziecko, o którym mówił cały kraj',
      'as a prodigy the whole country talked about',
    ],
  };
  const origin = origins[s.background] ?? origins.wall!;

  w(
    pl
      ? `${s.name} (ur. ${born}) — [[polski tenisista|polska tenisistka]]. Zaczynał[[|a]] ${origin[0]}.`
      : `${s.name} (born ${born}) — Polish tennis player. Started ${origin[1]}.`,
  );

  if (s.juniorSlamTitles > 0 || s.juniorYearEndNo1) {
    const parts: string[] = [];
    if (s.juniorSlamTitles > 0)
      parts.push(
        pl
          ? `wygrał[[|a]] ${s.juniorSlamTitles} juniorski${s.juniorSlamTitles > 1 ? 'e' : ''} turniej${s.juniorSlamTitles > 1 ? 'e' : ''} wielkoszlemow${s.juniorSlamTitles > 1 ? 'e' : 'y'}`
          : `won ${s.juniorSlamTitles} junior Grand Slam${s.juniorSlamTitles > 1 ? 's' : ''}`,
      );
    if (s.juniorYearEndNo1)
      parts.push(
        pl
          ? 'kończył[[|a]] sezon jako [[najlepszy junior|najlepsza juniorka]] świata'
          : 'finished a season as world junior No. 1',
      );
    w(pl ? `W juniorach ${parts.join(' i ')}.` : `As a junior, ${parts.join(' and ')}.`);
  } else if (s.polishChampionships > 0) {
    w(
      pl
        ? `W juniorach ${s.polishChampionships}× [[zdobywał|zdobywała]] mistrzostwo Polski.`
        : `Won the Polish junior championship ${s.polishChampionships}×.`,
    );
  } else {
    w(
      pl
        ? 'W juniorach nie [[wyróżniał|wyróżniała]] się wynikami.'
        : 'Did not stand out as a junior.',
    );
  }

  if (s.turnedProAge !== null) {
    const peak =
      s.peakRank !== null
        ? pl
          ? ` Najwyżej w rankingu ${tour} — ${s.peakRank}. miejsce (${s.peakRankYear}).`
          : ` Career-high ${tour} ranking: No. ${s.peakRank} (${s.peakRankYear}).`
        : '';
    w(
      pl
        ? `Na zawodowstwo [[przeszedł|przeszła]] w wieku ${s.turnedProAge} lat.${peak}`
        : `Turned pro at ${s.turnedProAge}.${peak}`,
    );
  }
  if (s.weeksAtNo1 > 0) {
    w(
      pl
        ? `Przez ${s.weeksAtNo1} tygodni [[był liderem|była liderką]] światowego rankingu.`
        : `Spent ${s.weeksAtNo1} weeks as world No. 1.`,
    );
  }
  if (s.proTitles > 0) {
    const slams = Object.entries(s.slams)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => (n > 1 ? `${SLAM_NAME[id]} ×${n}` : SLAM_NAME[id]))
      .join(', ');
    w(
      pl
        ? `[[Zdobył|Zdobyła]] ${s.proTitles} tytułów zawodowych${s.slamTitles > 0 ? `, w tym ${s.slamTitles} wielkoszlemow${s.slamTitles === 1 ? 'y' : 'e'} (${slams})` : ''}.`
        : `Won ${s.proTitles} professional titles${s.slamTitles > 0 ? `, including ${s.slamTitles} Grand Slam${s.slamTitles === 1 ? '' : 's'} (${slams})` : ''}.`,
    );
  }
  const medals = s.olympic.gold + s.olympic.silver + s.olympic.bronze;
  if (medals > 0) {
    const parts = (
      [
        ['gold', pl ? 'złoto' : 'gold'],
        ['silver', pl ? 'srebro' : 'silver'],
        ['bronze', pl ? 'brąz' : 'bronze'],
      ] as const
    )
      .filter(([k]) => s.olympic[k] > 0)
      .map(([k, name]) => (s.olympic[k] > 1 ? `${s.olympic[k]}× ${name}` : name));
    w(
      pl
        ? `[[Medalista|Medalistka]] olimpijsk[[i|a]]: ${parts.join(', ')}.`
        : `Olympic medals: ${parts.join(', ')}.`,
    );
  }
  if (s.davisCup > 0) {
    w(
      pl
        ? `Z reprezentacją Polski ${s.davisCup}× [[sięgnął|sięgnęła]] po trofeum drużynowe.`
        : `Won the team competition with Poland ${s.davisCup}×.`,
    );
  }
  if (s.prizeMoney > 0) {
    w(
      pl
        ? `Na kortach [[zarobił|zarobiła]] ${money(s.prizeMoney, locale)}.`
        : `Career prize money: ${money(s.prizeMoney, locale)}.`,
    );
  }
  const fav = s.favouriteTactic ? TACTICS_BY_ID[s.favouriteTactic] : null;
  if (fav) {
    w(pl ? `Znak rozpoznawczy: „${fav.name.pl}”.` : `Trademark: “${fav.name.en}”.`);
  }
  return out;
}

import { l, type L } from '../i18n';
import type { EffectTarget, SkillId, StageId, Surface } from '../model/types';

/**
 * Match situations — the in-match decisions. The simulation pauses at a set boundary and
 * shows one of these, filtered by score state, surface and career stage. Text may use
 * {opp} (opponent's name) and {score} (score so far).
 */
export interface SituationOption {
  label: L;
  desc: L;
  risky: boolean;
  /** Skill weights (sum ≈ 1) compared against the opponent's rating. */
  skills: Partial<Record<SkillId, number>>;
  /** Chance when the weighted skill equals the opponent's rating. */
  base: number;
  result: { super: L; success: L; fail: L };
  side?: Partial<Record<'super' | 'success' | 'fail', EffectTarget[]>>;
}

export interface Situation {
  id: string;
  text: L;
  when: {
    /** 'first' = after set one; 'deciding' = before the deciding set. */
    moment: 'first' | 'deciding' | 'any';
    trailing?: boolean;
    leading?: boolean;
    /** The previous set was decided in a tie-break. */
    afterTiebreak?: boolean;
    surfaces?: Surface[];
    minStage?: StageId;
    maxStage?: StageId;
  };
  weight: number;
  options: SituationOption[];
}

export const SITUATIONS: Situation[] = [
  {
    id: 'break_point_down',
    text: l(
      'Wynik {score}. Break point przeciwko tobie przy 4:5. {opp} czeka na drugi serwis jak na prezent.',
      'Score {score}. Break point down at 4–5. {opp} is waiting for your second serve like a gift.',
    ),
    when: { moment: 'deciding' },
    weight: 10,
    options: [
      {
        label: l('Serwis i wolej', 'Serve and volley'),
        desc: l('wszystko albo nic przy siatce', 'all or nothing at the net'),
        risky: true,
        skills: { serve: 0.5, net: 0.5 },
        base: 0.42,
        result: {
          super: l('As, potem wolej-stop. Publiczność wstaje z miejsc.', 'An ace, then a drop volley. The crowd is on its feet.'),
          success: l('Wolej w pusty kort. Gem obroniony, [[rywal|rywalka]] kręci głową.', 'Volley into the open court. Game saved, your rival shakes [[his|her]] head.'),
          fail: l('Mijający po linii. Przełamanie — i to boli.', 'A passing shot down the line. Broken — and it hurts.'),
        },
      },
      {
        label: l('Kick w bekhend i cierpliwość', 'Kick to the backhand, stay patient'),
        desc: l('wysoka piłka, długa wymiana', 'high ball, long rally'),
        risky: false,
        skills: { serve: 0.3, mental: 0.4, backhand: 0.3 },
        base: 0.64,
        result: {
          super: l('[[Rywal|Rywalka]] pęka w dwudziestej wymianie. Od tej chwili gra spięty.', 'Your rival cracks on the twentieth shot. From now on [[he|she]] plays tight.'),
          success: l('Wymiana, wymiana, błąd [[rywala|rywalkę]]. Wychodzisz z opresji.', 'Rally, rally, unforced error. You escape.'),
          fail: l('Za krótko. [[Rywal|Rywalka]] wchodzi w kort i zamyka punkt.', 'Too short. Your rival steps in and finishes the point.'),
        },
      },
    ],
  },
  {
    id: 'tiebreak',
    text: l(
      'Tie-break w pierwszym secie przegrany na przewagi. {opp} czuje krew. Jak wchodzisz w drugiego seta?',
      'First-set tie-break lost on deuce. {opp} smells blood. How do you start the second set?',
    ),
    when: { moment: 'first', trailing: true, afterTiebreak: true },
    weight: 14,
    options: [
      {
        label: l('Agresja od pierwszej piłki', 'Aggression from ball one'),
        desc: l('wchodzisz w return, skracasz wymiany', 'step into the return, shorten rallies'),
        risky: true,
        skills: { forehand: 0.5, return: 0.5 },
        base: 0.45,
        result: {
          super: l('Przełamanie do zera w pierwszym gemie. Mecz się odwraca.', 'Love break in the first game. The match turns.'),
          success: l('Narzucasz tempo. [[Rywal|Rywalka]] zaczyna się cofać.', 'You set the pace. Your rival starts backing off.'),
          fail: l('Trzy błędy z rzędu. [[Rywal|Rywalka]] tylko przebija i wygrywa.', 'Three errors in a row. Your rival just puts it back and wins.'),
        },
      },
      {
        label: l('Ręcznik na głowę i reset', 'Towel over the head, reset'),
        desc: l('oddech, rutyna, punkt po punkcie', 'breathe, routine, point by point'),
        risky: false,
        skills: { mental: 0.7, fitness: 0.3 },
        base: 0.66,
        result: {
          super: l('Zupełnie inna osoba wychodzi na kort. Spokój i precyzja.', 'A different person walks back on court. Calm and precise.'),
          success: l('Wracasz do swojego rytmu. Seta zaczynasz pewnie.', 'You find your rhythm again and start the set solidly.'),
          fail: l('W głowie wciąż ten tie-break. Wszystko dzieje się za szybko.', 'That tie-break is still in your head. Everything happens too fast.'),
        },
      },
    ],
  },
  {
    id: 'medical_timeout',
    text: l(
      '{opp} prosi o przerwę medyczną po przegranym secie. Siedem minut ciszy. Wiesz, co to znaczy.',
      '{opp} calls a medical time-out after losing the set. Seven minutes of silence. You know what it means.',
    ),
    when: { moment: 'first', leading: true },
    weight: 7,
    options: [
      {
        label: l('Rozgrzewka i skupienie', 'Warm up and focus'),
        desc: l('ignorujesz teatr, pilnujesz siebie', 'ignore the theatre, mind yourself'),
        risky: false,
        skills: { mental: 0.6, fitness: 0.4 },
        base: 0.68,
        result: {
          super: l('[[Rywal|Rywalka]] wraca, a ty wygrywasz pierwsze dwanaście punktów.', 'Your rival returns and you win the first twelve points.'),
          success: l('Nie dajesz się wybić z rytmu. Przewaga zostaje.', "You don't lose your rhythm. The lead holds."),
          fail: l('Po przerwie [[rywal|rywalka]] biega jak [[nowo narodzony|nowo narodzona]]. Ty — [[zimny|zimna]] jak lód.', 'After the break your rival runs like new. You — stone cold.'),
        },
      },
      {
        label: l('Protest u sędziego', 'Protest to the umpire'),
        desc: l('może wybić [[rywala|rywalkę]] z rytmu… albo ciebie', 'might unsettle [[him|her]]… or you'),
        risky: true,
        skills: { mental: 0.5, return: 0.5 },
        base: 0.4,
        result: {
          super: l('Sędzia skraca przerwę, [[rywal|rywalka]] jest wściekły i oddaje gema serwisowego.', 'The umpire cuts the break short; your rival is furious and drops serve.'),
          success: l('Sędzia upomina [[rywala|rywalkę]]. Mała psychologiczna wygrana.', 'The umpire warns your rival. A small psychological win.'),
          fail: l('Ostrzeżenie dla ciebie i gwizdy trybun. Tracisz koncentrację.', 'A warning for you and whistles from the stands. Focus gone.'),
        },
        side: { fail: [{ kind: 'media', delta: -2 }], super: [{ kind: 'media', delta: 1 }] },
      },
    ],
  },
  {
    id: 'crowd_against',
    text: l(
      'Cały stadion jest za {opp}. Każdy twój błąd wita owacja. Wynik {score}.',
      'The whole stadium is behind {opp}. Every error of yours gets a cheer. Score {score}.',
    ),
    when: { moment: 'any', minStage: 'europe' },
    weight: 6,
    options: [
      {
        label: l('Uciszasz trybuny', 'Silence the crowd'),
        desc: l('palec na ustach po wygranym punkcie', 'finger to the lips after a winner'),
        risky: true,
        skills: { mental: 0.5, forehand: 0.5 },
        base: 0.43,
        result: {
          super: l('Trybuny milkną, a potem… zaczynają bić ci brawo.', 'The stands go quiet, then… start applauding you.'),
          success: l('Grasz przeciwko wszystkim i to cię niesie.', 'You play against everyone and it carries you.'),
          fail: l('Trybuny ryczą jeszcze głośniej. Ręka zaczyna drżeć.', 'The crowd roars even louder. Your arm starts to shake.'),
        },
        side: { super: [{ kind: 'media', delta: 3 }] },
      },
      {
        label: l('Słuchawki w głowie', 'Headphones in your head'),
        desc: l('koncentrujesz się tylko na piłce', 'focus only on the ball'),
        risky: false,
        skills: { mental: 0.8, serve: 0.2 },
        base: 0.62,
        result: {
          super: l('Wchodzisz w strefę. Nie słyszysz nawet sędziego.', "You're in the zone. You can't even hear the umpire."),
          success: l('Hałas zostaje za siatką. Grasz swoje.', 'The noise stays behind the fence. You play your game.'),
          fail: l('Hałas wygrywa. Dwa podwójne błędy w kluczowym gemie.', 'The noise wins. Two double faults in a key game.'),
        },
      },
    ],
  },
  {
    id: 'rain_delay',
    text: l(
      'Deszcz przerywa mecz przy stanie {score}. Szatnia, ręcznik, telefon od trenera.',
      'Rain stops play at {score}. Locker room, towel, a call from your coach.',
    ),
    when: { moment: 'any', surfaces: ['clay', 'grass', 'hard'] },
    weight: 5,
    options: [
      {
        label: l('Analiza wideo z trenerem', 'Video analysis with your coach'),
        desc: l('szukacie słabego punktu [[rywala|rywalkę]]', 'look for a weakness'),
        risky: false,
        skills: { mental: 0.4, return: 0.3, forehand: 0.3 },
        base: 0.6,
        result: {
          super: l('Znaleźliście to: [[rywal|rywalka]] zawsze serwuje na T przy 30:30. Czytasz go jak książkę.', 'Found it: [[he|she]] always serves down the T at 30–30. You read [[him|her]] like a book.'),
          success: l('Wracasz z planem i trzymasz się go.', 'You come back with a plan and stick to it.'),
          fail: l('Za dużo informacji. Na korcie myślisz zamiast grać.', 'Too much information. On court you think instead of play.'),
        },
      },
      {
        label: l('Drzemka na ławce', 'Nap on the bench'),
        desc: l('świeże nogi po przerwie', 'fresh legs after the break'),
        risky: false,
        skills: { fitness: 0.7, mental: 0.3 },
        base: 0.6,
        result: {
          super: l('Budzisz się jak po urlopie. [[Rywal|Rywalka]] wygląda na zmęczonego.', 'You wake up like after a holiday. Your rival looks tired.'),
          success: l('Nogi niosą. Pierwszy gem po przerwie twój.', 'Legs feel light. First game after the break is yours.'),
          fail: l('[[Zaspany|Zaspana]] wychodzisz na kort i tracisz serwis.', 'You walk out groggy and get broken.'),
        },
      },
    ],
  },
  {
    id: 'cramps',
    text: l(
      'Trzecia godzina meczu. Łydka zaczyna się napinać. Przed decydującym setem {score}.',
      'Third hour of the match. Your calf starts to tighten. Before the deciding set: {score}.',
    ),
    when: { moment: 'deciding' },
    weight: 6,
    options: [
      {
        label: l('Skracasz wymiany', 'Shorten the points'),
        desc: l('dropszoty, ataki, wszystko szybko', 'drop shots, attacks, everything fast'),
        risky: true,
        skills: { net: 0.4, forehand: 0.4, serve: 0.2 },
        base: 0.44,
        result: {
          super: l('Pięć dropszotów, pięć punktów. [[Rywal|Rywalka]] biega, ty stoisz.', 'Five drop shots, five points. Your rival runs, you stand still.'),
          success: l('Kończysz akcje w trzech uderzeniach. Wystarcza.', 'You finish points in three shots. It is enough.'),
          fail: l('Dropszot w siatkę, drugi w aut. Skurcz i tak przychodzi.', 'Drop shot into the net, another one long. The cramp comes anyway.'),
        },
        side: { fail: [{ kind: 'fatigue', delta: 6 }] },
      },
      {
        label: l('Banan, sól i zaciśnięte zęby', 'Banana, salt and gritted teeth'),
        desc: l('wytrzymujesz fizycznie', 'outlast physically'),
        risky: false,
        skills: { fitness: 0.7, mental: 0.3 },
        base: 0.6,
        result: {
          super: l('Mięsień puszcza, a ty przyspieszasz. [[Rywal|Rywalka]] nie wierzy.', 'The muscle relaxes and you speed up. Your rival cannot believe it.'),
          success: l('Ból jest, ale nogi pracują. Trzymasz się.', 'It hurts, but the legs work. You hang on.'),
          fail: l('Kulejesz do końca meczu. Każdy sprint to loteria.', 'You limp through the rest. Every sprint is a lottery.'),
        },
        side: { fail: [{ kind: 'fatigue', delta: 10 }] },
      },
    ],
  },
  {
    id: 'return_pressure',
    text: l(
      '{opp} returnuje wszystko. Twój serwis, zwykle broń, nagle wraca pod nogi. Wynik {score}.',
      '{opp} returns everything. Your serve, usually a weapon, keeps coming back at your feet. Score {score}.',
    ),
    when: { moment: 'first', trailing: true },
    weight: 7,
    options: [
      {
        label: l('Zmieniasz kierunki serwisu', 'Mix up serve directions'),
        desc: l('szeroko, na ciało, na T', 'wide, body, T'),
        risky: false,
        skills: { serve: 0.6, mental: 0.4 },
        base: 0.6,
        result: {
          super: l('[[Rywal|Rywalka]] stoi w złym miejscu trzy razy z rzędu. Asy jak z automatu.', 'Your rival is in the wrong spot three times in a row. Aces on demand.'),
          success: l('Return przestaje boleć. Gemy serwisowe znów idą gładko.', 'The return stops hurting. Service games flow again.'),
          fail: l('[[Rywal|Rywalka]] czyta wszystko. Zmiany tylko cię rozpraszają.', 'Your rival reads everything. The changes only distract you.'),
        },
      },
      {
        label: l('Pierwszy serwis na 100%', 'First serve flat out'),
        desc: l('ryzykujesz prędkość, nie precyzję', 'risk pace, not placement'),
        risky: true,
        skills: { serve: 0.8, fitness: 0.2 },
        base: 0.4,
        result: {
          super: l('218 km/h na tablicy. Trybuny gwiżdżą z wrażenia.', '218 km/h on the board. The crowd whistles in awe.'),
          success: l('Mocniej znaczy skuteczniej. [[Rywal|Rywalka]] przestaje sięgać.', "Harder means better. Your rival can't reach it."),
          fail: l('Procent pierwszego serwisu spada poniżej 40. Drugi serwis jest rzeźnią.', 'First-serve percentage drops below 40. Second serves get punished.'),
        },
      },
    ],
  },
  {
    id: 'clay_grind',
    text: l(
      'Mączka, upał, wymiany po 25 uderzeń. {opp} nie chybia. Wynik {score}.',
      'Clay, heat, 25-shot rallies. {opp} never misses. Score {score}.',
    ),
    when: { moment: 'any', surfaces: ['clay'] },
    weight: 8,
    options: [
      {
        label: l('Topspin w bekhend, w nieskończoność', 'Heavy topspin to the backhand, forever'),
        desc: l('wygrywasz cierpliwością', 'win with patience'),
        risky: false,
        skills: { backhand: 0.35, forehand: 0.25, fitness: 0.4 },
        base: 0.6,
        result: {
          super: l('[[Rywal|Rywalka]] pierwszy sięga po skrót i myli się. Raz, drugi, piąty.', 'Your rival goes for the shortcut first and misses. Once, twice, five times.'),
          success: l('Wymiany są długie, ale kończą się po twojej myśli.', 'Rallies are long, but they end your way.'),
          fail: l('Po godzinie to ty pierwszy mrugasz. Mączka nie wybacza.', 'After an hour you blink first. Clay forgives nothing.'),
        },
      },
      {
        label: l('Dropszot za dropszotem', 'Drop shot after drop shot'),
        desc: l('wyciągasz [[rywala|rywalkę]] do siatki', 'drag your rival to the net'),
        risky: true,
        skills: { net: 0.5, forehand: 0.3, mental: 0.2 },
        base: 0.42,
        result: {
          super: l('[[Rywal|Rywalka]] stoi metr za linią i nie dobiega do żadnego skrótu.', "Your rival is a metre behind the baseline and can't reach a single drop."),
          success: l('Rytm [[rywala|rywalkę]] rozbity. Zaczyna grać nerwowo.', "Your rival's rhythm is broken. [[He|She]] starts to rush."),
          fail: l('Skróty za długie. [[Rywal|Rywalka]] dobiega i mija cię po linii.', 'The drops sit up. Your rival runs them down and passes you.'),
        },
      },
    ],
  },
  {
    id: 'grass_net',
    text: l(
      'Trawa, piłka nisko, [[rywal|rywalka]] slajsuje wszystko. Wynik {score}.',
      'Grass, low bounce, your rival slices everything. Score {score}.',
    ),
    when: { moment: 'any', surfaces: ['grass'] },
    weight: 8,
    options: [
      {
        label: l('Do siatki po każdym slajsie', 'Rush the net after every slice'),
        desc: l('trawa nagradza odważnych', 'grass rewards the brave'),
        risky: true,
        skills: { net: 0.6, serve: 0.2, backhand: 0.2 },
        base: 0.44,
        result: {
          super: l('Wolej, wolej, smecz. Wyglądasz jak z kaset VHS z lat 90.', 'Volley, volley, smash. You look like a 90s VHS tape.'),
          success: l('Siatka jest twoja. [[Rywal|Rywalka]] musi ryzykować mijające.', 'The net is yours. Your rival has to risk passing shots.'),
          fail: l('Piłka pada ci pod nogi. Półwolej w siatkę, raz za razem.', 'The ball dies at your feet. Half-volleys into the net, again and again.'),
        },
      },
      {
        label: l('Niskie kolana, płaskie uderzenia', 'Bend the knees, hit flat'),
        desc: l('grasz z linii, bez fajerwerków', 'stay at the baseline, no fireworks'),
        risky: false,
        skills: { forehand: 0.35, backhand: 0.35, fitness: 0.3 },
        base: 0.6,
        result: {
          super: l('Płaskie piłki ślizgają się po trawie. [[Rywal|Rywalka]] nie nadąża.', "Flat balls skid through the grass. Your rival can't keep up."),
          success: l('Bez fajerwerków, ale skutecznie.', 'No fireworks, but it works.'),
          fail: l('Piłka podskakuje na nierówności i lecisz w aut.', 'A bad bounce off a patchy lawn and you miss.'),
        },
      },
    ],
  },
  {
    id: 'serving_for_match',
    text: l(
      'Serwujesz na mecz w decydującym secie. {opp} po drugiej stronie podskakuje na returnie.',
      'Serving for the match in the deciding set. {opp} is bouncing on the return.',
    ),
    when: { moment: 'deciding', leading: true },
    weight: 7,
    options: [
      {
        label: l('Grasz jak gdyby nigdy nic', 'Play as if nothing is at stake'),
        desc: l('tak samo jak cały mecz', 'same as the whole match'),
        risky: false,
        skills: { mental: 0.6, serve: 0.4 },
        base: 0.63,
        result: {
          super: l('Cztery pierwsze serwisy w kort. Gem do zera.', 'Four first serves in. Love hold.'),
          success: l('Ręka nie drży. Domykasz.', "The arm doesn't shake. You close it out."),
          fail: l('Ręka drży. Podwójny błąd przy 30:30. [[Rywal|Rywalka]] wraca do gry.', 'The arm shakes. Double fault at 30–30. Your rival is back.'),
        },
      },
      {
        label: l('Atak na każdym punkcie', 'Attack every point'),
        desc: l('nie dajesz [[rywalowi|rywalce]] oddychać', "don't let your rival breathe"),
        risky: true,
        skills: { forehand: 0.5, serve: 0.3, net: 0.2 },
        base: 0.45,
        result: {
          super: l('Trzy winnery z forhendu. Rakieta leci w górę.', 'Three forehand winners. The racket goes up in the air.'),
          success: l('Agresja się opłaca. [[Rywal|Rywalka]] tylko patrzy.', 'Aggression pays off. Your rival just watches.'),
          fail: l('Dwa forhendy w aut. Przełamanie powrotne.', 'Two forehands long. Broken back.'),
        },
      },
    ],
  },
  {
    id: 'hawkeye',
    text: l(
      'Kluczowy punkt, piłka na linii. Sędzia mówi „out”, ty jesteś [[pewien|pewna]], że była dobra. Wynik {score}.',
      'Key point, ball on the line. The umpire says “out”, you are sure it was in. Score {score}.',
    ),
    when: { moment: 'any', minStage: 'itf_junior' },
    weight: 5,
    options: [
      {
        label: l('Kłótnia z sędzią', 'Argue with the umpire'),
        desc: l('trzy minuty dyskusji', 'three minutes of debate'),
        risky: true,
        skills: { mental: 0.7, return: 0.3 },
        base: 0.36,
        result: {
          super: l('Sędzia schodzi z krzesła, ogląda ślad i przyznaje ci punkt. Trybuny szaleją.', 'The umpire climbs down, checks the mark and gives you the point. The crowd goes wild.'),
          success: l('Punktu nie dostajesz, ale złość daje ci energię.', "You don't get the point, but the anger fuels you."),
          fail: l('Ostrzeżenie za niesportowe zachowanie i nagłówki w mediach.', 'Code violation and headlines in the media.'),
        },
        side: { fail: [{ kind: 'media', delta: -3 }, { kind: 'budget', delta: -5000 }], super: [{ kind: 'media', delta: 2 }] },
      },
      {
        label: l('Odpuszczasz i grasz dalej', 'Let it go and play on'),
        desc: l('następny punkt jest ważniejszy', 'the next point matters more'),
        risky: false,
        skills: { mental: 0.8, serve: 0.2 },
        base: 0.6,
        result: {
          super: l('Następne cztery punkty twoje. [[Rywal|Rywalka]] nie wie, co się stało.', "The next four points are yours. Your rival doesn't know what happened."),
          success: l('Zostawiasz to za sobą. Profesjonalnie.', 'You leave it behind. Professional.'),
          fail: l('Ta piłka siedzi ci w głowie do końca seta.', 'That ball stays in your head for the rest of the set.'),
        },
      },
    ],
  },
  {
    id: 'lefty_angles',
    text: l(
      '[[Leworęczny|Leworęczna]] {opp} rozrywa cię szerokim serwisem na stronę przewag. Wynik {score}.',
      'Left-handed {opp} keeps pulling you wide on the ad side. Score {score}.',
    ),
    when: { moment: 'first' },
    weight: 3,
    options: [
      {
        label: l('Stajesz szerzej na returnie', 'Stand wider on the return'),
        desc: l('oddajesz mu środek kortu', 'concede the T'),
        risky: false,
        skills: { return: 0.6, backhand: 0.4 },
        base: 0.58,
        result: {
          super: l('[[Rywal|Rywalka]] serwuje na T prosto w twój forhend. Dwa breaki z rzędu.', '[[He|She]] serves down the T right into your forehand. Two breaks in a row.'),
          success: l('Szeroki serwis przestaje działać.', 'The wide serve stops working.'),
          fail: l('Teraz asy idą środkiem. [[Rywal|Rywalka]] się uśmiecha.', 'Now the aces go down the middle. [[He|She]] smiles.'),
        },
      },
      {
        label: l('Chip-and-charge', 'Chip and charge'),
        desc: l('krótki return i do siatki', 'short return and rush in'),
        risky: true,
        skills: { net: 0.5, return: 0.5 },
        base: 0.4,
        result: {
          super: l('[[Rywal|Rywalka]] po raz pierwszy w życiu widzi taki return. Gubi się kompletnie.', 'Your rival has never seen this return in [[his|her]] life. Completely lost.'),
          success: l('Zaskoczenie działa. Kilka tanich punktów.', 'The surprise works. A few cheap points.'),
          fail: l('Mijający bekhend, raz po raz. [[Rywal|Rywalka]] się bawi.', 'Backhand passing shots, again and again. [[He|She]] is enjoying it.'),
        },
      },
    ],
  },
  {
    id: 'big_lead_relax',
    text: l(
      'Prowadzisz {score} i wszystko wychodzi. W głowie pojawia się myśl o konferencji prasowej.',
      'You lead {score} and everything works. A thought of the press conference sneaks in.',
    ),
    when: { moment: 'first', leading: true },
    weight: 6,
    options: [
      {
        label: l('Dociskasz gaz', 'Keep your foot down'),
        desc: l('nie dajesz [[rywalowi|rywalce]] wrócić', "don't let [[him|her]] back in"),
        risky: false,
        skills: { mental: 0.5, fitness: 0.5 },
        base: 0.66,
        result: {
          super: l('[[Rywal|Rywalka]] się poddaje psychicznie. Drugi set to formalność.', 'Your rival gives up mentally. The second set is a formality.'),
          success: l('Koncentracja do końca. Bez przestojów.', 'Focus till the end. No lapses.'),
          fail: l('Myśli odpływają. [[Rywal|Rywalka]] wygrywa trzy gemy z rzędu.', 'Your mind drifts. [[He|She]] wins three games in a row.'),
        },
      },
      {
        label: l('Bawisz się grą', 'Play with flair'),
        desc: l('tweener dla kamer?', 'a tweener for the cameras?'),
        risky: true,
        skills: { net: 0.4, forehand: 0.4, mental: 0.2 },
        base: 0.42,
        result: {
          super: l('Tweener-winner. Klip ma milion wyświetleń przed końcem meczu.', 'Tweener winner. The clip has a million views before the match ends.'),
          success: l('Publiczność kupiona, wynik pod kontrolą.', 'The crowd is yours, the score under control.'),
          fail: l('Popis nie wyszedł, a [[rywal|rywalka]] [[złapał|złapała]] wiatr w żagle.', 'The show fails and your rival gets [[his|her]] second wind.'),
        },
        side: { super: [{ kind: 'media', delta: 5 }], success: [{ kind: 'media', delta: 1 }] },
      },
    ],
  },
  {
    id: 'parent_in_stands',
    text: l(
      'Tata na trybunach krzyczy wskazówki po każdym punkcie. Sędzia już dwa razy spojrzał w jego stronę. Wynik {score}.',
      'Dad in the stands shouts advice after every point. The umpire has already glanced at [[him|her]] twice. Score {score}.',
    ),
    when: { moment: 'any', maxStage: 'europe' },
    weight: 7,
    options: [
      {
        label: l('Prosisz go gestem o spokój', 'Signal [[him|her]] to calm down'),
        desc: l('ryzyko rodzinnej awantury', 'risk of a family row'),
        risky: false,
        skills: { mental: 0.8, fitness: 0.2 },
        base: 0.6,
        result: {
          super: l('Tata siada, kiwa głową i zaczyna klaskać. Grasz jak z nut.', 'Dad sits down, nods and starts clapping. You play like clockwork.'),
          success: l('Robi się ciszej. Możesz się skupić.', 'It gets quieter. You can focus.'),
          fail: l('Tata obraża się na cały turniej. Ty grasz z poczuciem winy.', 'Dad sulks for the whole tournament. You play feeling guilty.'),
        },
      },
      {
        label: l('Robisz, co mówi', 'Do what [[he|she]] says'),
        desc: l('może jednak wie lepiej?', 'maybe [[he|she]] knows better?'),
        risky: true,
        skills: { forehand: 0.5, return: 0.5 },
        base: 0.4,
        result: {
          super: l('„Graj na bekhend!” — i to działa. Tata jest geniuszem przez jeden dzień.', '“Hit to the backhand!” — and it works. Dad is a genius for a day.'),
          success: l('Kilka rad trafia w punkt.', 'A couple of tips hit the mark.'),
          fail: l('Grasz cudzy tenis. [[Rywal|Rywalka]] to widzi i wykorzystuje.', "You play someone else's tennis. Your rival sees it and pounces."),
        },
      },
    ],
  },
  {
    id: 'equipment_break',
    text: l(
      'Pękają naciągi w ostatniej rakiecie z torby, a kolejna jest naciągnięta o 3 kg za mocno. Wynik {score}.',
      'The strings break in the last racket in your bag, and the next one is strung 3 kg too tight. Score {score}.',
    ),
    when: { moment: 'any', maxStage: 'pro' },
    weight: 4,
    options: [
      {
        label: l('Gram tym, co jest', 'Play with what you have'),
        desc: l('dostosowujesz uderzenia', 'adjust your strokes'),
        risky: false,
        skills: { mental: 0.4, forehand: 0.3, backhand: 0.3 },
        base: 0.55,
        result: {
          super: l('Twarde naciągi dają ci kontrolę, jakiej nigdy nie [[miałeś|miałaś]].', 'The tight strings give you control you never had.'),
          success: l('Kilka gemów adaptacji i jest dobrze.', 'A few games to adapt and you are fine.'),
          fail: l('Piłki lecą w siatkę jak z armaty. Nic nie pasuje.', 'Balls fly into the net. Nothing feels right.'),
        },
      },
      {
        label: l('Pożyczasz rakietę od [[rywala|rywalkę]]', "Borrow your opponent's racket"),
        desc: l('gest fair play, ale obcy sprzęt', 'fair play gesture, unknown gear'),
        risky: true,
        skills: { mental: 0.5, serve: 0.5 },
        base: 0.4,
        result: {
          super: l('Grasz jego rakietą lepiej niż on. Zdjęcie obiega internet.', 'You play better with [[his|her]] racket than [[he|she]] does. The photo goes viral.'),
          success: l('Gest docenia publiczność, a ty łapiesz rytm.', 'The crowd appreciates the gesture and you find your rhythm.'),
          fail: l('Rączka za gruba, balans zły. Przegrywasz własny gem.', 'Grip too thick, balance off. You drop serve.'),
        },
        side: { super: [{ kind: 'media', delta: 4 }, { kind: 'reputation', delta: 2 }], success: [{ kind: 'reputation', delta: 1 }] },
      },
    ],
  },
  {
    id: 'night_session',
    text: l(
      'Sesja nocna, 23:40, zimno i wilgotno. Piłki stają się ciężkie. Wynik {score}.',
      'Night session, 11:40 pm, cold and damp. The balls get heavy. Score {score}.',
    ),
    when: { moment: 'deciding', minStage: 'pro' },
    weight: 5,
    options: [
      {
        label: l('Więcej rotacji, wyższa siatka', 'More spin, higher over the net'),
        desc: l('bezpieczny margines', 'safe margins'),
        risky: false,
        skills: { forehand: 0.4, backhand: 0.3, fitness: 0.3 },
        base: 0.6,
        result: {
          super: l('[[Rywal|Rywalka]] nie ma pomysłu na wysokie piłki. Każda wymiana twoja.', 'Your rival has no answer to the high balls. Every rally is yours.'),
          success: l('Margines bezpieczeństwa wystarcza.', 'The safety margin is enough.'),
          fail: l('Piłki nie dochodzą. [[Rywal|Rywalka]] atakuje każdą krótką.', 'Balls fall short. Your rival attacks every one.'),
        },
      },
      {
        label: l('Płasko i mocno', 'Flat and hard'),
        desc: l('przebijasz ciężkie powietrze', 'punch through heavy air'),
        risky: true,
        skills: { forehand: 0.5, serve: 0.5 },
        base: 0.42,
        result: {
          super: l('Każda piłka jak pocisk. O 0:30 jesteś w następnej rundzie.', 'Every ball like a bullet. By 12:30 am you are through.'),
          success: l('Siła wygrywa z wilgocią.', 'Power beats the damp.'),
          fail: l('Siatka, aut, siatka. Noc należy do [[rywala|rywalkę]].', 'Net, long, net. The night belongs to your rival.'),
        },
      },
    ],
  },
  {
    id: 'idol_opponent',
    text: l(
      'Po drugiej stronie {opp} — [[gracz, którego|zawodniczka, której]] plakat wisiał nad twoim łóżkiem. Wynik {score}.',
      'On the other side: {opp} — the player whose poster hung above your bed. Score {score}.',
    ),
    when: { moment: 'first', minStage: 'pro' },
    weight: 3,
    options: [
      {
        label: l('Grasz bez kompleksów', 'Play without fear'),
        desc: l('to tylko kolejny mecz', 'just another match'),
        risky: false,
        skills: { mental: 0.7, serve: 0.3 },
        base: 0.58,
        result: {
          super: l('Plakat zdejmiesz po meczu. Teraz to ty jesteś na okładce.', "You'll take the poster down tonight. Now you're on the cover."),
          success: l('Respekt zostaje w szatni.', 'The respect stays in the locker room.'),
          fail: l('Ręka sztywnieje przy każdym jego serwisie.', 'Your arm stiffens at every one of [[his|her]] serves.'),
        },
      },
      {
        label: l('Kopiujesz jego styl', 'Copy [[his|her]] style'),
        desc: l('znasz każde jego zagranie z YouTube', 'you know every shot of [[his|her]] from YouTube'),
        risky: true,
        skills: { forehand: 0.4, net: 0.3, return: 0.3 },
        base: 0.4,
        result: {
          super: l('Lustro, tylko szybsze. [[Mistrz jest zaskoczony|Mistrzyni jest zaskoczona]].', 'A mirror, only faster. The master is stunned.'),
          success: l('Grasz [[jego|jej]] tenis lepiej, niż się [[spodziewał|spodziewała]].', 'You play [[his|her]] tennis better than [[he|she]] expected.'),
          fail: l('Oryginał jest lepszy od kopii.', 'The original beats the copy.'),
        },
      },
    ],
  },
  {
    id: 'wind',
    text: l(
      'Porywisty wiatr, piłka tańczy przy podrzucie. {score}.',
      'Gusty wind, the toss dances in the air. {score}.',
    ),
    when: { moment: 'any', surfaces: ['clay', 'hard', 'grass'] },
    weight: 4,
    options: [
      {
        label: l('Niższy podrzut, mniej siły', 'Lower toss, less power'),
        desc: l('serwis jako rozpoczęcie, nie broń', 'serve to start the point, not to win it'),
        risky: false,
        skills: { serve: 0.4, mental: 0.3, backhand: 0.3 },
        base: 0.6,
        result: {
          super: l('[[Rywal|Rywalka]] walczy z wiatrem, ty z nim tańczysz.', 'Your rival fights the wind, you dance with it.'),
          success: l('Mało asów, ale i mało błędów.', 'Few aces, but few errors.'),
          fail: l('Wiatr i tak wygrywa. Dwa podwójne w kluczowym gemie.', 'The wind still wins. Two double faults in a key game.'),
        },
      },
      {
        label: l('Grasz z wiatrem na lob', 'Play the lob with the wind'),
        desc: l('wysokie piłki nad głową [[rywala|rywalkę]]', 'high balls over [[his|her]] head'),
        risky: true,
        skills: { forehand: 0.4, net: 0.3, mental: 0.3 },
        base: 0.4,
        result: {
          super: l('Trzy loby, trzy punkty. [[Rywal|Rywalka]] przestaje podchodzić do siatki.', 'Three lobs, three points. Your rival stops coming in.'),
          success: l('Wiatr jest twoim sojusznikiem.', 'The wind is your ally.'),
          fail: l('Podmuch wynosi lob w aut. I kolejny.', 'A gust carries the lob long. And the next.'),
        },
      },
    ],
  },
  {
    id: 'nemesis',
    text: l(
      'Znowu {opp}. Znacie się od czasów Orlików i oboje wiecie, kto zwykle wygrywa. Wynik {score}.',
      '{opp} again. You have known each other since mini tennis and you both know who usually wins. Score {score}.',
    ),
    when: { moment: 'any' },
    weight: 0, // only selected explicitly for nemesis matches
    options: [
      {
        label: l('Plan na lata: atak na bekhend', 'The long-term plan: attack the backhand'),
        desc: l('to, co ćwiczysz od dziecka', "what you've drilled since childhood"),
        risky: false,
        skills: { forehand: 0.4, return: 0.3, mental: 0.3 },
        base: 0.55,
        result: {
          super: l('Lata analiz w końcu procentują. {opp} nie wie, co robić.', 'Years of analysis finally pay off. {opp} has no idea what to do.'),
          success: l('Tym razem to ty dyktujesz warunki.', 'This time you set the terms.'),
          fail: l('{opp} zna cię zbyt dobrze. Każdy twój ruch jest przewidziany.', '{opp} knows you too well. Every move is anticipated.'),
        },
      },
      {
        label: l('Coś, czego nigdy nie [[pokazałeś|pokazałaś]]', "Something you've never shown"),
        desc: l('serve-and-volley przez cały set', 'serve-and-volley for a whole set'),
        risky: true,
        skills: { net: 0.6, serve: 0.4 },
        base: 0.38,
        result: {
          super: l('Totalne zaskoczenie. {opp} patrzy na boks trenera z niedowierzaniem.', 'Total surprise. {opp} stares at the coaching box in disbelief.'),
          success: l('Nowy plan działa wystarczająco długo.', 'The new plan works long enough.'),
          fail: l('Eksperyment w złym meczu. {opp} się uśmiecha.', 'Wrong match for an experiment. {opp} smiles.'),
        },
      },
    ],
  },
];

export const SITUATIONS_BY_ID: Readonly<Record<string, Situation>> = Object.fromEntries(
  SITUATIONS.map((s) => [s.id, s]),
);

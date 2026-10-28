# Forge – AI Fitness Coach 💪

> 🚧 **Under utvikling** – dette prosjektet er ikke ferdig ennå, og flere endringer kommer.

Mørk premium treningsapp bygget med **Expo + React Native + TypeScript**. Ikke bare tracking – en AI-coach som lærer av
**Workout → Nutrition → Recovery → Progress** og gir deg konkrete anbefalinger hver dag.

---

## 1. Kom i gang (første gang)

Krav: Node 20+ på Macen, og **Expo Go** installert på iPhonen fra App Store.

```bash
cd forge-fitness
sh setup.sh          # installerer Expo SDK 57 (samme som MedExam)
npx expo start       # viser en QR-kode
```

Skann QR-koden med kameraet på iPhonen → appen åpnes i Expo Go.
Er mobilen og Macen på forskjellige nett: `npx expo start --tunnel`.

> **Tips:** Gå til *Profile → Load demo data* for å fylle appen med 12 uker med treningsøkter, måltider og vekt –
> da ser du grafene, PR-ene og AI-coachen i full aksjon.

## 2. Hva som er med

| Fane | Innhold |
|---|---|
| **Onboarding** | Mål (Build Muscle / Lose Fat / Maintain), kjønn, alder, høyde, vekt, målvekt, erfaring, dager/uke, øktlengde, utstyr, aktivitetsnivå, kosthold → AI bygger program + kalorimål |
| **Home** | Hilsen, ukestripe, *"You're X% toward your weekly goal"*, Today's Focus (økt, kcal, protein, vann), AI Recommendation, Daily Goals (kalorier, protein, vann m/ +250/+500, steg fra iPhone), Recovery-score per muskel, søvn og dagsform, Quick Actions |
| **Workout** | For You (dagens/neste økt), This Week, My Workouts, Create Workout, Programs (AI-genererte), Exercise Library (søk + muskelfilter), History, Personal Records |
| **Active Workout** | Øvelse → sett → kg → reps, hvile-timer, AI-mål per øvelse (progressive overload), live 🏆 PR-varsel, bytt/legg til øvelse, oppsummering med "Recovery fuel" |
| **Nutrition** | Kalorier + makro-ringer, måltider per dag, matdatabase, AI Food Scanner, måltidsdetaljer (redigerbare ingredienser og porsjoner), oppskrifter, AI-måltidsplan, handleliste |
| **Progress** | Vekt, fett %, muskelmasse, styrke, mål (midje/bryst/arm/lår), progresjonsbilder (før/etter), PR-er, grafer, ukentlige/månedlige rapporter med AI-oppsummering |
| **Profile** | Mål, kroppsdata, aktivitetsnivå, treningspreferanser, utstyr, kosthold, enheter (metric/imperial), varsler, AI-innstillinger |
| **AI Coach** | Alle dagens anbefalinger + chat ("Hva bør jeg spise nå?", "Hvordan er restitusjonen min?") |

### Hvordan AI-coachen lærer
- **Protein-/kalori-tempo** gjennom dagen → foreslår konkrete måltider som passer det du har igjen og kostholdet ditt.
- **Progressive overload:** traff du toppen av rep-området på alle sett → +2,5 kg neste gang.
- **Recovery:** søvn, dagsform og hvilke muskler du har trent siste 72 t → sier fra når du bør ta det lettere.
- **Adaptive kalorier:** leser vekttrenden over 3 uker og foreslår ±100–150 kcal (med ett trykk på *Apply*).
- **Ukesrapporter** som oppsummerer trening, protein, søvn og vekt.

Alt dette kjører **lokalt på telefonen** – ingen server nødvendig.

## 3. Ekte AI (matskanner + chat) – valgfritt

Uten server kjører skanneren i **demo-modus** (eksempelresultat). For ekte bildegjenkjenning:

```bash
cd server
cp .env.example .env                  # fyll inn API-nøkkel, modell og API-adresse
node --env-file=.env index.mjs        # starter på port 8787
```

Finn Mac-ens IP (Systeminnstillinger → Nettverk), og legg inn `http://192.168.x.x:8787` i
**Profile → AI server** (eller i `.env` som `EXPO_PUBLIC_AI_URL`). Trykk *Test connection*.

API-nøkkelen ligger **kun på serveren** – aldri i appen. Før App Store-lansering deployer du `server/index.mjs`
til f.eks. Railway, Render, Fly.io eller en Cloudflare Worker og setter URL-en i `.env`.

## 4. Lansere i App Store

1. Apple Developer-konto (99 USD/år).
2. `npm i -g eas-cli` og `eas login`
3. `eas build:configure` (bruker `eas.json` som allerede ligger her)
4. `eas build --platform ios --profile production`
5. `eas submit --platform ios`
6. Fyll ut App Store Connect: skjermbilder, beskrivelse, personvern ("Data Not Collected" så lenge alt ligger lokalt).

Bundle ID er `com.nimamaleki.forge` – endre i `app.json` om du vil. Ikon og splash ligger i `assets/`.

> Apple krever at helse-/kostholdsråd ikke presenteres som medisinsk rådgivning – appen har en ansvarsfraskrivelse
> nederst i Profile.

## 5. Struktur

```
app/                 skjermer (expo-router, filbasert)
  (tabs)/            Home, Workout, Nutrition, Progress, Profile
  onboarding/        velkomst + oppsett
  workout/           active, summary, create
  nutrition/         log, scan, meal
  progress/          stats, log-body
  exercise/[id].tsx  øvelsesdetaljer
  coach.tsx          AI Coach
src/
  logic/coach.ts     AI-coach-motoren (anbefalinger, recovery, adaptive kalorier, rapporter, chat)
  logic/program.ts   programgenerator (splits, øvelsesvalg etter utstyr, sett/reps)
  logic/strength.ts  1RM, PR-er, progressive overload
  logic/nutrition.ts BMR/TDEE, makroer
  store/             Zustand-state lagret lokalt (AsyncStorage) + demodata
  data/              øvelser, matdatabase, oppskrifter
  ai/client.ts       kobling mot AI-serveren
server/index.mjs     liten AI-server (ingen avhengigheter)
```

## 6. Neste steg (ideer)
- Apple Health / HealthKit-synk (krever development build, ikke Expo Go)
- Push-varsler med `expo-notifications`
- Konto + skylagring (Supabase/Firebase) så data følger brukeren mellom enheter
- Abonnement med RevenueCat for "Pro"-funksjoner
- Strekkode-skanner for matvarer (Open Food Facts)

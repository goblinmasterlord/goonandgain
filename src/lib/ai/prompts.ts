// Coach Bebi prompt templates

export const COACH_BEBI_SYSTEM_PROMPT = `Te vagy Coach Bebi, egy szakértő erő- és hipertrófia edző, aki elemzi a felhasználó edzésadatait.
FONTOS: Minden válaszodat magyar nyelven add!

Személyiséged:
- Lelkesítő és barátságos, de őszinte és direkt
- Használj adatokat a visszajelzéseid alátámasztásához
- Adj konkrét, megvalósítható tanácsokat
- Szólítsd a felhasználót tegezve, barátilag
- Használhatsz emotikonokat mértékkel (💪, ✅, ⚠️, 📊, 🎯)

Stílus:
- Rövid, tömör mondatok
- Számokra és adatokra hivatkozz
- Mindig adj meg konkrét következő lépéseket
- Motiváló, de realisztikus hangnem`

export interface UserProfile {
  weightKg: number
  gender: 'male' | 'female'
  age?: number
}

export interface StrengthData {
  squat?: { weight: number; ratio: number; level: string }
  bench?: { weight: number; ratio: number; level: string }
  deadlift?: { weight: number; ratio: number; level: string }
  ohp?: { weight: number; ratio: number; level: string }
}

export interface VolumeData {
  muscleGroup: string
  sets: number
  avgRir: number
}

export interface SessionSummary {
  templateName: string
  totalSets: number
  exercises: {
    name: string
    sets: number
    topSet: { weight: number; reps: number; rir: number }
    avgRir: number
  }[]
  duration: number
  date: Date
}

export function buildUserProfileContext(profile: UserProfile): string {
  return `FELHASZNÁLÓ PROFIL:
- Testsúly: ${profile.weightKg} kg
- Nem: ${profile.gender === 'male' ? 'Férfi' : 'Nő'}
${profile.age ? `- Életkor: ${profile.age} év` : ''}
- Szint: Középhaladó
- Split: Bro split (5-6 nap)
- Célok: Izomépítés + erőnövelés`
}

export function buildStrengthContext(strength: StrengthData): string {
  const lines: string[] = ['ERŐSZINTEK (testsúlyhoz viszonyítva):']

  if (strength.squat) {
    lines.push(`- Guggolás: ${strength.squat.weight}kg (${strength.squat.ratio}x BW) - ${strength.squat.level}`)
  }
  if (strength.bench) {
    lines.push(`- Fekvenyomás: ${strength.bench.weight}kg (${strength.bench.ratio}x BW) - ${strength.bench.level}`)
  }
  if (strength.deadlift) {
    lines.push(`- Felhúzás: ${strength.deadlift.weight}kg (${strength.deadlift.ratio}x BW) - ${strength.deadlift.level}`)
  }
  if (strength.ohp) {
    lines.push(`- Vállból nyomás: ${strength.ohp.weight}kg (${strength.ohp.ratio}x BW) - ${strength.ohp.level}`)
  }

  return lines.join('\n')
}

export function buildVolumeContext(volumes: VolumeData[]): string {
  const lines: string[] = ['HETI VOLUMEN IZOMCSOPORTONKÉNT:']

  volumes.forEach((v) => {
    const status = v.sets < 10 ? '(alacsony)' : v.sets > 20 ? '(magas)' : '(optimális)'
    lines.push(`- ${v.muscleGroup}: ${v.sets} sorozat, átlag RIR ${v.avgRir.toFixed(1)} ${status}`)
  })

  return lines.join('\n')
}

export function buildSessionContext(session: SessionSummary): string {
  const lines: string[] = [
    `MAI EDZÉS: ${session.templateName}`,
    `Időtartam: ${session.duration} perc`,
    `Összes sorozat: ${session.totalSets}`,
    '',
    'GYAKORLATOK:',
  ]

  session.exercises.forEach((ex) => {
    lines.push(`- ${ex.name}: ${ex.sets} sorozat`)
    lines.push(`  Legjobb: ${ex.topSet.weight}kg × ${ex.topSet.reps} @ RIR ${ex.topSet.rir}`)
    lines.push(`  Átlag RIR: ${ex.avgRir.toFixed(1)}`)
  })

  return lines.join('\n')
}

// Post-workout prompt
export function buildPostWorkoutPrompt(
  profile: UserProfile,
  session: SessionSummary
): string {
  return `${buildUserProfileContext(profile)}

${buildSessionContext(session)}

FELADAT: Adj egy rövid (2-3 mondatos) összefoglalót az edzésről. Emeld ki:
- Ha volt új rekord vagy kiemelkedő teljesítmény
- Ha valamelyik gyakorlatnál túl könnyű volt (RIR 3+), javasolj súlynövelést
- Egy konkrét tipp a regenerációhoz

Válaszolj magyarul, Coach Bebi stílusában!`
}

// Weekly review prompt
export function buildWeeklyReviewPrompt(
  profile: UserProfile,
  strength: StrengthData,
  volumes: VolumeData[],
  avgRirTrend: number[]
): string {
  const rirTrendText = avgRirTrend.length >= 2
    ? `RIR trend: ${avgRirTrend.map((r) => r.toFixed(1)).join(' → ')}`
    : ''

  return `${buildUserProfileContext(profile)}

${buildStrengthContext(strength)}

${buildVolumeContext(volumes)}

${rirTrendText}

FELADAT: Készíts heti áttekintést a következő struktúrában:
✅ **Pozitívumok:** (2-3 pont)
⚠️ **Figyelj:** (volumen hiányosságok, kiegyensúlyozatlanságok)
📉 **Aggályos:** (ha RIR trend csökken, vagy súlyok stagnálnak)
📊 **Erőszinted:** (ha van kiegyensúlyozatlanság a fő emelések között)
🎯 **Jövő heti fókusz:** (konkrét súly/ismétlés célok)

Válaszolj magyarul, Coach Bebi stílusában!`
}

// On-demand question prompt
export function buildAskCoachPrompt(
  profile: UserProfile,
  strength: StrengthData,
  volumes: VolumeData[],
  question: string
): string {
  return `${buildUserProfileContext(profile)}

${buildStrengthContext(strength)}

${buildVolumeContext(volumes)}

FELHASZNÁLÓ KÉRDÉSE: "${question}"

FELADAT: Válaszolj a kérdésre mint Coach Bebi. Legyél konkrét és gyakorlatias. Ha releváns, hivatkozz az adatokra.

Válaszolj magyarul!`
}

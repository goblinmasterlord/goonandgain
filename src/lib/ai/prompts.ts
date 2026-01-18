// Coach Bebi prompt templates

export const COACH_BEBI_SYSTEM_PROMPT = `Te vagy Coach Bebi, a LEGKEMÉNYEBB edzőedző a galaxisban! Elemzed a felhasználó edzésadatait és NINCS KEGYELEM.
FONTOS: Minden válaszodat magyar nyelven add!

SZEMÉLYISÉGED:
- Szigorú, de vicces - úgy roastolsz, hogy közben motiválsz
- NÉHA KIABÁLSZ CAPS LOCKBAN, mert az ember csak így érti meg
- Szarkasztikus, de szerethetően - mint egy őrült nagybácsi a kondiból
- Ha valaki gyengélkedik, beszólsz neki, de utána felépíted
- Használj gym bro szlenget keverten: "Na TESÓ", "GYERÜNK MÁR", "ez WEAK", "BEAST MODE"
- Dicséretnél is maradj edző: "Na VÉGRE, ezt már régen kellett volna!"

ROASTING STÍLUS (de mindig építő jellegű):
- "Ez a súly? A nagymamám is többet emel, és ő 87 éves"
- "RIR 4? Akkor minek jöttél be, pihenni?"
- "Na VÉGRE valami értékelhető teljesítmény!"
- "Gyenge vagy? NEM. Csak még nem vagy elég erős. VAN KÜLÖNBSÉG."

FONTOS SZABÁLYOK:
- Tegezz, mint egy haver (de egy haver aki edző)
- Beszólások után MINDIG adj konkrét tanácsot
- Ha jó a teljesítmény, ismerd el - de ne nyalizz
- Számokra és adatokra hivatkozz, mert AZ ADATOK NEM HAZUDNAK
- Rövid, ütős mondatok - nincs idő mesélni, EDZENI KELL

Használhatsz emotikonokat: 💪 🔥 ⚠️ 😤 🦍 👊 📊`

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

// Enhanced data types for comprehensive weekly review
export interface WeeklyReviewData {
  // Basic stats
  totalSessions: number
  totalSets: number
  totalReps: number
  totalWeightLifted: number // kg
  avgWorkoutDuration: number // minutes

  // Consistency
  plannedWorkouts: number
  completedWorkouts: number
  completionRate: number
  missedWorkoutTypes: string[]

  // Volume per muscle
  volumeByMuscle: {
    muscle: string
    sets: number
    avgRir: number
    status: 'low' | 'optimal' | 'high'
    minRecommended: number
    maxRecommended: number
    lastWeekSets: number
    changePercent: number
  }[]

  // Intensity analysis
  avgRir: number
  rirDistribution: { rir: number; count: number; percent: number }[]
  lastWeekAvgRir: number
  rirTrend: 'increasing' | 'stable' | 'decreasing' // increasing RIR = getting easier, decreasing = fatigue

  // Progression tracking
  progressions: { exercise: string; oldWeight: number; newWeight: number; increase: number }[]
  regressions: { exercise: string; oldWeight: number; newWeight: number; decrease: number }[]
  stalls: { exercise: string; weight: number; weeksStalled: number }[]
  readyForProgression: { exercise: string; currentWeight: number; suggestedWeight: number; reason: string }[]

  // PRs and top performances
  prsThisWeek: { exercise: string; weight: number; reps: number }[]
  topSets: { exercise: string; weight: number; reps: number; estimated1RM: number }[]

  // Skipped work
  skippedSets: number
  completionRateByExercise: { exercise: string; completed: number; expected: number; rate: number }[]

  // Strength benchmarks
  strengthLevels: {
    lift: string
    estimated1RM: number
    bwRatio: number
    level: string
    nextLevelTarget: number
  }[]

  // Comparison to last week
  lastWeekTotalSets: number
  lastWeekTotalWeight: number
  volumeChange: number // percent

  // Recommendations
  undertrainedMuscles: string[]
  overtrainedMuscles: string[]
  needsDeload: boolean
  deloadReason?: string
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

FELADAT: Adj egy rövid (2-4 mondatos) összefoglalót az edzésről Coach Bebi stílusában!

STÍLUS KÖVETELMÉNYEK:
- ROASTOLD egy kicsit a teljesítményt, de utána építsd fel
- Ha RIR 3+ volt → "Mi ez, pihenőnap? PAKOLJ FEL SÚLYT!"
- Ha jó volt → "Na VÉGRE! De azért ne szállj el, még van mit tanulni!"
- Használj CAPS LOCKOT a fontos dolgoknál
- Legyél vicces de adj KONKRÉT tanácsot is

Emeld ki:
- Ha volt rekord: "BEAST MODE AKTIVÁLVA!" de ne hízelegj túl sokat
- Ha túl könnyű volt: szólj be és adj konkrét súlyt amit próbáljon
- Egy regenerációs tipp - de úgy add elő mintha parancs lenne

Magyarul válaszolj, NINCS KEGYELEM (de szeretettel)!`
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

FELADAT: Készíts heti áttekintést Coach Bebi stílusában - ROASTOLJ, de építs!

FORMÁTUM (használd ezeket):
💪 **MI MENT JÓL:** (2-3 pont - de ne hízelegj, csak tényeket!)
😤 **MI EZ, TESÓ?:** (ahol lusta voltál / hiányzik volumen / gyenge pontok)
📉 **VÉSZJELZÉS:** (ha RIR trend csökken, vagy súlyok stagnálnak - KIABÁLJ)
🦍 **ERŐSZINTED:** (roastold ha van kiegyensúlyozatlanság - "A lábad erősebb mint a felsőtested, mi vagy te, strucc?")
🔥 **JÖVŐ HETI PARANCSOK:** (konkrét súly/ismétlés célok - nem kérés, PARANCS)

STÍLUS:
- CAPS LOCK a fontos dolgoknál
- Vicces beszólások, de mindig adj megoldást
- Legyél kemény, de az a fajta kemény aki ki akar hozni belőle mindent
- Ha valami nagyon jó volt: "Na VÉGRE, ezt már régen várom!"
- Ha valami szar: "Ez ELFOGADHATATLAN. De megoldjuk."

Magyarul válaszolj, NINCS KEGYELEM!`
}

// Comprehensive weekly review prompt
export function buildComprehensiveWeeklyReviewPrompt(
  profile: UserProfile,
  data: WeeklyReviewData
): string {
  // Build volume section
  const volumeLines = data.volumeByMuscle.map((v) => {
    const statusEmoji = v.status === 'low' ? '⚠️' : v.status === 'high' ? '🔴' : '✅'
    const changeStr = v.changePercent > 0 ? `+${v.changePercent.toFixed(0)}%` : `${v.changePercent.toFixed(0)}%`
    return `- ${v.muscle}: ${v.sets} sorozat ${statusEmoji} (cél: ${v.minRecommended}-${v.maxRecommended}) | múlt hét: ${v.lastWeekSets} (${changeStr}) | átlag RIR: ${v.avgRir.toFixed(1)}`
  })

  // Build RIR distribution
  const rirDistLines = data.rirDistribution
    .filter((r) => r.count > 0)
    .map((r) => `RIR ${r.rir}: ${r.count} sorozat (${r.percent.toFixed(0)}%)`)

  // Build progressions section
  const progressionLines = data.progressions.length > 0
    ? data.progressions.map((p) => `✅ ${p.exercise}: ${p.oldWeight}kg → ${p.newWeight}kg (+${p.increase}kg)`)
    : ['Nincs súlynövekedés ezen a héten']

  // Build regressions section
  const regressionLines = data.regressions.length > 0
    ? data.regressions.map((r) => `❌ ${r.exercise}: ${r.oldWeight}kg → ${r.newWeight}kg (${r.decrease}kg)`)
    : []

  // Build stalls section
  const stallLines = data.stalls.length > 0
    ? data.stalls.map((s) => `⏸️ ${s.exercise}: ${s.weight}kg (${s.weeksStalled} hete stagnál)`)
    : []

  // Build ready for progression
  const readyLines = data.readyForProgression.length > 0
    ? data.readyForProgression.map((r) => `🎯 ${r.exercise}: ${r.currentWeight}kg → próbálj ${r.suggestedWeight}kg (${r.reason})`)
    : []

  // Build PRs section
  const prLines = data.prsThisWeek.length > 0
    ? data.prsThisWeek.map((pr) => `🏆 ${pr.exercise}: ${pr.weight}kg × ${pr.reps}`)
    : ['Nincs új rekord ezen a héten']

  // Build top sets section
  const topSetLines = data.topSets.slice(0, 5).map(
    (t) => `${t.exercise}: ${t.weight}kg × ${t.reps} (becsült 1RM: ${t.estimated1RM.toFixed(0)}kg)`
  )

  // Build strength levels section
  const strengthLines = data.strengthLevels.map(
    (s) => `- ${s.lift}: ${s.estimated1RM.toFixed(0)}kg (${s.bwRatio.toFixed(2)}x BW) - ${s.level} | következő szint: ${s.nextLevelTarget.toFixed(0)}kg`
  )

  // RIR trend text
  const rirTrendText = data.rirTrend === 'decreasing'
    ? '📉 CSÖKKENŐ (fáradtság halmozódik!)'
    : data.rirTrend === 'increasing'
    ? '📈 NÖVEKVŐ (könnyebb lesz - talán túl könnyű?)'
    : '➡️ STABIL'

  return `${buildUserProfileContext(profile)}

═══════════════════════════════════════════════════════════════
                    HETI ÖSSZESÍTÉS
═══════════════════════════════════════════════════════════════

📊 ALAPSTATISZTIKÁK:
- Edzések: ${data.totalSessions} db (terv: ${data.plannedWorkouts})
- Összes sorozat: ${data.totalSets} (múlt hét: ${data.lastWeekTotalSets}, változás: ${data.volumeChange > 0 ? '+' : ''}${data.volumeChange.toFixed(0)}%)
- Összes ismétlés: ${data.totalReps}
- Összes megemelt súly: ${(data.totalWeightLifted / 1000).toFixed(1)} tonna (múlt hét: ${(data.lastWeekTotalWeight / 1000).toFixed(1)} tonna)
- Átlagos edzésidő: ${data.avgWorkoutDuration} perc
${data.missedWorkoutTypes.length > 0 ? `- Kihagyott edzéstípusok: ${data.missedWorkoutTypes.join(', ')}` : ''}

═══════════════════════════════════════════════════════════════
                    VOLUMEN IZOMCSOPORTONKÉNT
═══════════════════════════════════════════════════════════════

${volumeLines.join('\n')}

${data.undertrainedMuscles.length > 0 ? `⚠️ ALULEDZETT: ${data.undertrainedMuscles.join(', ')}` : ''}
${data.overtrainedMuscles.length > 0 ? `🔴 TÚLEDZETT: ${data.overtrainedMuscles.join(', ')}` : ''}

═══════════════════════════════════════════════════════════════
                    INTENZITÁS ELEMZÉS
═══════════════════════════════════════════════════════════════

Átlagos RIR: ${data.avgRir.toFixed(1)} (múlt hét: ${data.lastWeekAvgRir.toFixed(1)})
RIR trend: ${rirTrendText}

RIR eloszlás:
${rirDistLines.join('\n')}

${data.needsDeload ? `🚨 DELOAD AJÁNLOTT! Ok: ${data.deloadReason}` : ''}

═══════════════════════════════════════════════════════════════
                    PROGRESSZIÓ
═══════════════════════════════════════════════════════════════

SÚLYNÖVEKEDÉSEK:
${progressionLines.join('\n')}

${regressionLines.length > 0 ? `CSÖKKENÉSEK:\n${regressionLines.join('\n')}` : ''}

${stallLines.length > 0 ? `STAGNÁLÁSOK:\n${stallLines.join('\n')}` : ''}

${readyLines.length > 0 ? `KÉSZEN ÁLL EMELÉSRE:\n${readyLines.join('\n')}` : ''}

═══════════════════════════════════════════════════════════════
                    REKORDOK ÉS TOP TELJESÍTMÉNYEK
═══════════════════════════════════════════════════════════════

ÚJ REKORDOK:
${prLines.join('\n')}

TOP 5 SOROZAT (becsült 1RM alapján):
${topSetLines.join('\n')}

═══════════════════════════════════════════════════════════════
                    ERŐSZINTEK
═══════════════════════════════════════════════════════════════

${strengthLines.join('\n')}

═══════════════════════════════════════════════════════════════

FELADAT: Írj egy MAXIMUM 1 oldalas heti értékelést Coach Bebi stílusában!

KÖTELEZŐ STRUKTÚRA (ezeket a címeket használd):

💪 **HÉTVÉGI ROAST** (2-3 mondat összefoglaló - szólj be de építs!)

📊 **A SZÁMOK NEM HAZUDNAK** (volumen és intenzitás elemzés - konkrétan mit csinált jól/rosszul)

🔥 **PROGRESSZIÓ CHECK** (súlynövekedések értékelése, stagnálások kezelése)

⚠️ **FIGYELJ TESÓ!** (problémák: aluledzett izmok, túl magas/alacsony RIR, fáradtság jelek)

🎯 **JÖVŐ HETI PARANCSOK** (3-5 KONKRÉT utasítás: milyen súlyokat próbáljon, melyik izomra figyeljen)

STÍLUS SZABÁLYOK:
- CAPS LOCK a fontos dolgoknál
- Roastolj de adj megoldást
- Számokra hivatkozz
- Maximum 400-500 szó összesen
- Ha valami nagyon szar: "Ez ELFOGADHATATLAN, de megoldjuk."
- Ha valami jó: "Na VÉGRE!" de ne hízelegj túl sokat
- Ha deload kell: ÜVÖLTS
- Legyél vicces de informatív

Magyarul válaszolj, NINCS KEGYELEM!`
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

FELADAT: Válaszolj a kérdésre mint Coach Bebi - a LEGKEMÉNYEBB edző!

STÍLUS:
- Ha buta kérdés: "Na TESÓ, komolyan ezt kérdezed?" - de utána azért válaszolj
- Ha jó kérdés: "O, végre valaki aki GONDOLKODIK!"
- Használj CAPS LOCKOT ha fontos dolgot mondasz
- Legyél vicces és szarkasztikus, de adj HASZNOS választ
- Ha releváns, hivatkozz az adatokra: "Nézd, a számok nem hazudnak..."
- Rövid, ütős mondatok - nem vagyunk irodalomórán

Ha a kérdés edzésről szól: adj konkrét tanácsot
Ha a kérdés táplálkozásról szól: legyél praktikus, ne bonyolítsd túl
Ha a kérdés motivációról szól: ÜVÖLTS BELE egy kis tüzet

Válaszolj magyarul, NINCS KEGYELEM!`
}

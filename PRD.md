# GoonAndGain - Personal Gym Planner App
## Lean Product Requirements Document (PRD)

**Version:** 1.1  
**Last Updated:** January 2025  
**Author:** Marci + Claude

---

## 1. Product Overview

### 1.1 Vision
GoonAndGain is a science-backed personal gym planner that helps intermediate lifters maximize muscle growth and strength through intelligent workout tracking, progressive overload calculations, and AI-powered coaching feedback.

### 1.2 Language & Localization
- **App UI Language:** Hungarian (Magyar)
- **PRD Language:** English (for development reference)
- All user-facing text, labels, buttons, notifications, and AI Coach responses must be in Hungarian.

### 1.3 Target User
- **Experience level:** Intermediate (1-3 years of consistent training)
- **Training style:** Bro split (dedicated muscle group days)
- **Goals:** Hypertrophy + Strength (hybrid approach)
- **Session duration:** 60-75 minutes
- **Frequency:** 5-6 days per week
- **Equipment access:** Full commercial gym

### 1.4 Core Problem
Intermediate lifters often plateau because they:
- Don't track workouts consistently enough to apply progressive overload
- Can't objectively assess if they're training hard enough (or too hard)
- Lack personalized feedback on their training patterns
- Don't know proper form for all exercises

### 1.5 Solution
An app that provides:
- Pre-built, science-backed workout templates with exercise alternatives
- Real-time set logging during workouts (minimal friction)
- Automatic progressive overload calculations
- AI coach that analyzes patterns and gives actionable feedback
- Visual exercise guides generated for every movement

---

## 2. Scientific Foundation

The app's recommendations are grounded in peer-reviewed research and expert consensus:

### 2.1 Progressive Overload
- Both load progression (adding weight) and rep progression produce similar hypertrophy outcomes
- Target: Add 2.5kg (compounds) or increase reps weekly when RIR allows

### 2.2 Volume Guidelines
- **Optimal range:** 10-20 hard sets per muscle group per week
- **Per session cap:** 6-8 sets per muscle before diminishing returns
- **Intermediate starting point:** 12-16 sets per muscle per week

### 2.3 Proximity to Failure (RIR)
- Most sets: 1-3 RIR (reps in reserve)
- Final set of exercise: Can go to 0-1 RIR
- Training to failure on every set = counterproductive (excessive fatigue)

### 2.4 Rep Ranges
- **Strength focus:** 5-8 reps (compound lifts)
- **Hypertrophy focus:** 8-15 reps (accessories/isolation)
- Both ranges effective when sets taken close to failure

### 2.5 Deload Protocol
- Every 4-8 weeks based on fatigue accumulation
- Reduce load to ~60% and volume by 50% for one week

---

## 3. User Flow

### 3.1 Onboarding (First Launch)
```
1. Üdvözlünk! (Welcome)
   → App introduction, value proposition
   
2. Személyes adatok (Personal Data)
   → Testsúly (Body weight): [____] kg
   → Nem (Gender): [Férfi / Nő] (Male / Female)
   → Életkor (Age): [____] év (optional)
   
3. Edzés beállítások (Training Settings)
   → Split: Bro split (pre-selected)
   → Napok kiválasztása (Assign muscle groups to weekdays)
   
4. Kész! (Ready)
   → "Az első edzéseden rögzítjük a súlyokat, és onnan építkezünk."
   → (We'll record your weights on your first workout and build from there.)
```

**Data Usage:**
- **Body weight:** Required for relative strength calculations (e.g., 1.5x BW squat)
- **Gender:** Used for strength standard benchmarks
- **Age:** Optional, used for recovery recommendations and age-adjusted standards

### 3.2 Daily Workout Flow
```
1. Open app → See today's workout (e.g., "Chest Day")
2. View exercise list with targets based on last session
3. Tap exercise → See form guide (image + instructions)
4. Perform set → Log weight, reps, RIR
5. Rest timer auto-starts (2-3 min compounds, 60-90s isolation)
6. Repeat until workout complete
7. AI Coach summary appears post-workout
```

### 3.3 Weekly Review Flow
```
1. End of week notification → "Your weekly review is ready"
2. Volume dashboard → Sets per muscle group
3. Progression highlights → PRs, stalls, regressions
4. AI Coach insights → Actionable recommendations
5. Next week preview → Adjusted targets
```

---

## 4. Core Features

### 4.1 Exercise Library

**Purpose:** Teach users proper form and provide alternatives

**Per Exercise Contains:**
| Element | Description |
|---------|-------------|
| **Form Image** | AI-generated visual (Gemini Nano Banana Pro) showing key positions |
| **How To** | 3-5 concise bullet points on execution |
| **Avoid** | 2-3 common mistakes |
| **Target Muscles** | Primary + secondary muscles worked |
| **Rep Range** | Recommended range for this exercise type |
| **Alternatives** | 2-3 substitute exercises (same muscle, different equipment/angle) |

**Exercise Categories:**
- Compound (multi-joint)
- Isolation (single-joint)
- Machine
- Free weight
- Cable
- Bodyweight

---

### 4.2 Workout Templates

**Structure:** 5 primary days + 1 flex day

#### CHEST DAY (~18 working sets)
| # | Exercise | Sets × Reps | Type | Focus |
|---|----------|-------------|------|-------|
| 1 | Flat Barbell Bench Press | 4 × 5-8 | Compound | Strength |
| 2 | Incline Dumbbell Press | 3 × 8-12 | Compound | Upper chest |
| 3 | Cable Fly (mid-height) | 3 × 10-15 | Isolation | Stretch/squeeze |
| 4 | Dips (chest focus) | 3 × 8-12 | Compound | Lower chest |
| 5 | Machine Chest Press | 3 × 10-15 | Machine | Safe burnout |

**Alternatives available for each exercise**

#### BACK DAY (~20 working sets)
| # | Exercise | Sets × Reps | Type | Focus |
|---|----------|-------------|------|-------|
| 1 | Barbell Row OR Deadlift | 4 × 5-8 | Compound | Strength/thickness |
| 2 | Lat Pulldown (wide grip) | 3 × 8-12 | Compound | Lat width |
| 3 | Seated Cable Row | 3 × 8-12 | Compound | Mid-back thickness |
| 4 | Single-arm Dumbbell Row | 3 × 10-12 | Compound | Unilateral strength |
| 5 | Face Pulls | 3 × 12-15 | Isolation | Rear delt/posture |
| 6 | Straight-arm Pulldown | 2 × 12-15 | Isolation | Lat isolation |

#### SHOULDERS DAY (~16 working sets)
| # | Exercise | Sets × Reps | Type | Focus |
|---|----------|-------------|------|-------|
| 1 | Overhead Press (BB or DB) | 4 × 5-8 | Compound | Strength |
| 2 | Lateral Raise | 4 × 10-15 | Isolation | Side delt width |
| 3 | Rear Delt Fly | 3 × 12-15 | Isolation | Rear delt balance |
| 4 | Cable Front Raise | 3 × 10-12 | Isolation | Front delt |
| 5 | Barbell/DB Shrugs | 2 × 10-12 | Isolation | Trap development |

#### ARMS DAY (~18 working sets)
| # | Exercise | Sets × Reps | Type | Focus |
|---|----------|-------------|------|-------|
| 1 | Barbell Curl | 3 × 8-10 | Compound | Bicep mass |
| 2 | Close-grip Bench Press | 3 × 6-10 | Compound | Tricep strength |
| 3 | Incline Dumbbell Curl | 3 × 10-12 | Isolation | Long head stretch |
| 4 | Overhead Tricep Extension | 3 × 10-12 | Isolation | Tricep long head |
| 5 | Hammer Curl | 3 × 10-12 | Isolation | Brachialis |
| 6 | Tricep Pushdown | 3 × 12-15 | Isolation | Lateral head |

#### LEGS DAY (~18 working sets)
| # | Exercise | Sets × Reps | Type | Focus |
|---|----------|-------------|------|-------|
| 1 | Barbell Back Squat | 4 × 5-8 | Compound | Quad/glute strength |
| 2 | Romanian Deadlift | 3 × 8-10 | Compound | Hamstring/glute |
| 3 | Leg Press | 3 × 10-15 | Compound | Quad volume |
| 4 | Lying Leg Curl | 3 × 10-12 | Isolation | Hamstring |
| 5 | Leg Extension | 3 × 12-15 | Isolation | Quad isolation |
| 6 | Standing Calf Raise | 3 × 12-15 | Isolation | Gastrocnemius |

#### FLEX DAY (Adaptive)
**Two modes:**

**A) User Choice**
- Select from: Chest, Back, Shoulders, Arms, Legs, Full Body Pump
- App loads corresponding template (lighter version)

**B) Smart Suggestion**
- App analyzes weekly volume gaps
- Suggests muscle group(s) that need more work
- Example: "Your rear delts only got 3 sets this week. Want to hit shoulders again?"

---

### 4.3 Real-time Set Logger

**UI/UX Requirements:**

```
┌─────────────────────────────────────┐
│  CHEST DAY                    2/5   │
├─────────────────────────────────────┤
│  Flat Barbell Bench Press           │
│  Set 2 of 4                         │
│                                     │
│  Last session: 80kg × 8 @ RIR 2     │
│  ─────────────────────────────────  │
│  TARGET: 82.5kg × 6-8 @ RIR 2       │
│                                     │
│  Weight (kg)  ┌─────────────────┐   │
│               │      82.5       │   │
│               └─────────────────┘   │
│                                     │
│  Reps         ┌─────────────────┐   │
│               │        7        │   │
│               └─────────────────┘   │
│                                     │
│  RIR          [1] [2] [3] [4+]      │
│                    ▲                │
│                 selected            │
│                                     │
│         ┌─────────────────┐         │
│         │    LOG SET ✓    │         │
│         └─────────────────┘         │
│                                     │
│  [Swap Exercise]    [Skip Set]      │
└─────────────────────────────────────┘
```

**After logging:**
- Auto-advance to next set
- Rest timer starts (configurable: 2:00 default for compounds)
- Vibrate/sound when rest complete

**Data Captured Per Set:**
- Exercise ID
- Set number
- Weight (kg)
- Reps completed
- RIR (1, 2, 3, or 4+)
- Timestamp
- Session ID

---

### 4.4 Progressive Overload Engine

**Algorithm Logic:**

```
FOR each exercise in workout:
  
  GET last_session_data (weight, reps, RIR for all sets)
  
  # Analyze final set performance
  final_set_rir = last_session.final_set.RIR
  final_set_reps = last_session.final_set.reps
  target_rep_range = exercise.rep_range  # e.g., [8, 12]
  
  IF final_set_rir <= 1:
    # At limit, maintain
    new_weight = last_weight
    message = "Hold weight, you're near your max"
    
  ELSE IF final_set_rir == 2 AND final_set_reps >= target_rep_range.max:
    # Ready to progress weight
    IF exercise.type == "compound":
      new_weight = last_weight + 2.5
    ELSE:
      new_weight = last_weight + 1.25  # or next DB increment
    message = "Progress! Add weight this session"
    
  ELSE IF final_set_rir >= 3:
    # Too easy
    new_weight = last_weight + 2.5 to 5.0
    message = "Weight was light, increase load"
    
  ELSE IF final_set_reps < target_rep_range.min:
    # Failed to hit minimum reps
    new_weight = last_weight * 0.9  # 10% reduction
    message = "Reduce weight to hit rep target"
  
  RETURN suggested_weight, target_reps, message
```

**Display Format:**
> 📊 **Last session:** 80kg × 8 reps @ RIR 2  
> 🎯 **This session:** 82.5kg × 6-8 reps @ RIR 2  
> 💡 *You hit top of rep range with room to spare. Time to add weight!*

---

### 4.5 Weekly Volume Dashboard

**Tracked Muscle Groups:**
- Chest
- Back (Lats + Upper Back)
- Shoulders (Front / Side / Rear delts)
- Biceps
- Triceps
- Quadriceps
- Hamstrings
- Glutes
- Calves

**Visual Display:**

```
┌─────────────────────────────────────────┐
│  WEEKLY VOLUME          Week of Jan 6  │
├─────────────────────────────────────────┤
│                                         │
│  Chest      ████████████████░░  16 sets │
│  Back       ████████████████████ 20 sets│
│  Shoulders  ██████████████░░░░  14 sets │
│  Biceps     ████████████░░░░░░  12 sets │
│  Triceps    ████████████░░░░░░  12 sets │
│  Quads      ██████████████░░░░  14 sets │
│  Hamstrings ████████████░░░░░░  12 sets │
│  Calves     ██████░░░░░░░░░░░░   6 sets │
│                                         │
│  Legend:                                │
│  🟢 10-20 sets (optimal)                │
│  🟡 <10 sets (room to add)              │
│  🔴 >20 sets (watch fatigue)            │
│                                         │
│  ↗️ vs last week: +8% total volume      │
└─────────────────────────────────────────┘
```

**Additional Metrics:**
- Week-over-week volume trend (↑↓→)
- Total weekly sets
- Average RIR across all sets
- PRs hit this week

---

### 4.6 AI Coach Feedback (Gemini 3 Flash)

**Integration:** Gemini 3 Flash (`gemini-3-flash-preview`) via user's API key

> **Why Gemini 3 Flash?** Google's most balanced model - optimized for speed, scale, and frontier intelligence. Perfect for real-time coaching feedback.

**Trigger Points:**

| Trigger | Analysis Type | Output |
|---------|---------------|--------|
| Post-workout | Quick summary | 2-3 sentences on session quality |
| Weekly (Sunday) | Deep analysis | Volume, progression, fatigue, recommendations |
| On-demand | User question | Conversational response to "Ask Coach" |
| Alert | Anomaly detected | Push notification with concern |

**Data Sent to AI:**
- Last 12 weeks of workout logs
- Current week's volume by muscle
- RIR trends (average per week)
- Progression history (weight increases/stalls)
- User's goals (hypertrophy + strength)
- User's body weight and strength levels (relative to BW)
- User's gender and age (if provided)

**AI Coach Prompt Template:**

```
You are an expert strength and hypertrophy coach analyzing a user's training data.
IMPORTANT: All your responses must be in Hungarian language.

USER PROFILE:
- Level: Intermediate
- Split: Bro split (6 days)
- Goals: Muscle growth + strength
- Session duration: 60-75 min
- Body weight: {current_weight_kg} kg
- Gender: {gender}
- Age: {age} (if provided)

STRENGTH LEVELS (relative to bodyweight):
- Squat: {squat_1rm} kg ({squat_ratio}x BW) - {squat_level}
- Bench: {bench_1rm} kg ({bench_ratio}x BW) - {bench_level}
- Deadlift: {deadlift_1rm} kg ({deadlift_ratio}x BW) - {deadlift_level}
- OHP: {ohp_1rm} kg ({ohp_ratio}x BW) - {ohp_level}

RECENT DATA:
{workout_logs_last_12_weeks}

CURRENT WEEK SUMMARY:
{volume_by_muscle_group}
{average_rir}
{progressions_and_stalls}

TASK: Provide actionable coaching feedback IN HUNGARIAN. Be specific, reference actual numbers, and prioritize:
1. Progression opportunities (exercises ready for weight increase)
2. Volume imbalances (lagging muscle groups)
3. Fatigue signals (if RIR trending down or weights regressing)
4. Deload recommendation (if needed)
5. Strength imbalances (if one lift is lagging behind others relative to BW)

Keep tone motivating but direct. Use data to back up recommendations.
Respond in Hungarian language only.
```

**Example AI Outputs (in Hungarian):**

**Post-workout (Edzés utáni összefoglaló):**
> "Erős melledzés volt! Új egyéni rekordot értél el fekvenyomásban (85kg × 7) — ez 2.5kg-mal több, mint múlt héten. A kábeles keresztbehúzásnál viszont RIR 3+ volt minden sorozatnál, szóval legközelebb növeld a súlyt. Összvolumen: 18 sorozat. Ma este prioritás: alvás és fehérje!"

**Weekly review (Heti áttekintés):**
> "A jelenlegi mezociklus 3. hete:
> 
> ✅ **Pozitívumok:** A hátvolumen rendben van (20 sorozat), a fekvenyomás már 3 hete folyamatosan fejlődik, a lábak kiegyensúlyozottak.
> 
> ⚠️ **Figyelj:** A hátsó vállad csak 3 sorozatot kapott ezen a héten (face pull a hátnapon). Fontold meg a reverse pec deck hozzáadását a vállnaphoz, vagy csapd le a rugalmas napodon.
> 
> 📉 **Aggályos:** Az átlagos RIR 2.3-ról 1.7-re csökkent az elmúlt két hétben. Fáradtság halmozódik fel. Ha a jövő hét nehéznek érződik, fontold meg a deload hetet.
> 
> 📊 **Erőszinted:** A fekvenyomásod (1.13x testsúly) elmarad a guggolásodtól (1.5x) és felhúzásodtól (1.88x). Érdemes lehet több mellvolument beiktatni.
> 
> 🎯 **Jövő heti fókusz:** Növeld a vállból nyomást (60kg × 8 @ RIR 2 volt — próbálj 62.5kg-ot), tartsd a fekvenyomást, adj hozzá hátsó váll volument."

**Fatigue alert (Fáradtság figyelmeztetés - push notification):**
> "🔴 A guggolásod 4 hete 100kg-on áll, és a lábnapi RIR átlag 1.2-re csökkent. Ez általában felhalmozódott fáradtságot jelez. Javaslom a deload hetet: csökkentsd a súlyokat 60kg-ra, a sorozatszámot felére. Utána erősebben térsz vissza!"

---

### 4.7 Strength Level Benchmarking

**Purpose:** Help users understand where they stand and set meaningful strength goals.

**Strength Standards (Relative to Bodyweight):**

| Level | Squat | Bench Press | Deadlift | OHP |
|-------|-------|-------------|----------|-----|
| Beginner | 1.0x BW | 0.75x BW | 1.25x BW | 0.5x BW |
| Intermediate | 1.5x BW | 1.2x BW | 2.0x BW | 0.8x BW |
| Advanced | 2.0x BW | 1.5x BW | 2.5x BW | 1.0x BW |
| Elite | 2.5x BW | 1.8x BW | 3.0x BW | 1.2x BW |

**Display in App:**

```
┌─────────────────────────────────────────┐
│  ERŐSZINTED (Strength Level)            │
│  Testsúly: 80 kg                        │
├─────────────────────────────────────────┤
│                                         │
│  Guggolás (Squat)                       │
│  Aktuális 1RM: 120 kg (1.5x BW)         │
│  [████████████░░░░] Haladó felé         │
│  Szint: KÖZÉPHALADÓ ✓                   │
│                                         │
│  Fekvenyomás (Bench Press)              │
│  Aktuális 1RM: 90 kg (1.13x BW)         │
│  [██████████░░░░░░] Középhaladó felé    │
│  Szint: KEZDŐ → KÖZÉPHALADÓ             │
│                                         │
│  Felhúzás (Deadlift)                    │
│  Aktuális 1RM: 150 kg (1.88x BW)        │
│  [██████████████░░] Haladó felé         │
│  Szint: KÖZÉPHALADÓ ✓                   │
│                                         │
│  Vállból nyomás (OHP)                   │
│  Aktuális 1RM: 60 kg (0.75x BW)         │
│  [████████████░░░░] Középhaladó felé    │
│  Szint: KEZDŐ → KÖZÉPHALADÓ             │
│                                         │
└─────────────────────────────────────────┘
```

**1RM Calculation:**
- Estimated from logged sets using Brzycki formula: `1RM = weight × (36 / (37 - reps))`
- Updates automatically as user logs heavier sets
- Only calculated for main compound lifts

**Integration with AI Coach:**
- AI references strength levels in feedback
- Example: "Your bench is lagging behind your other lifts (1.13x BW vs 1.5x squat). Consider prioritizing chest volume."

---

### 4.8 Periodic Weight Check-in

**Purpose:** Keep bodyweight data current for accurate relative strength tracking.

**Trigger:** Every 2 weeks (configurable)

**UI Flow:**

```
┌─────────────────────────────────────────┐
│  ⚖️ TESTSÚLY FRISSÍTÉS                  │
│                                         │
│  Utolsó mérés: 80.0 kg (14 napja)       │
│                                         │
│  Aktuális testsúly:                     │
│  ┌─────────────────────────────┐        │
│  │         81.5              │ kg      │
│  └─────────────────────────────┘        │
│                                         │
│  [MENTÉS]        [KÉSŐBB]               │
│                                         │
└─────────────────────────────────────────┘
```

**Data Tracked:**
- Weight history over time (for trend analysis)
- Used in relative strength calculations
- AI Coach can reference weight changes in feedback

**Optional Enhancement (V2):**
- Weight trend chart
- Correlation with strength progress

---

### 4.9 Bodyweight Exercise Handling

**Purpose:** Properly track exercises where body weight is part of the load.

**Affected Exercises:**
- Pull-ups / Chin-ups
- Dips
- Push-ups (if included)

**Logging UI:**

```
┌─────────────────────────────────────────┐
│  Húzódzkodás (Pull-ups)                 │
│  Set 2 of 3                             │
│                                         │
│  Testsúly: 80 kg                        │
│  + Hozzáadott súly: [____] kg           │
│                                         │
│  Összesen: 80 + 10 = 90 kg              │
│                                         │
│  Ismétlések: [____]                     │
│  RIR: [1] [2] [3] [4+]                  │
│                                         │
│  [RÖGZÍTÉS]                             │
└─────────────────────────────────────────┘
```

**Tracking Logic:**
- Total load = Current bodyweight + Added weight
- Progressive overload calculated on total load
- If bodyweight changes, app adjusts targets accordingly

**Example Scenario:**
- Week 1: 80kg BW + 10kg added = 90kg total × 8 reps
- Week 2: 81kg BW + 10kg added = 91kg total (automatic progression!)
- Week 3: App suggests adding 2.5kg plate since effective load already increased

---

## 5. Data Model

### 5.1 Core Entities

**User**
```
- id
- created_at
- unit_preference (kg)
- training_days (array of weekday assignments)
- gemini_api_key (encrypted)
- gender (male/female)
- birth_year (optional, for age calculation)
- current_weight_kg
- weight_updated_at
```

**Weight_History**
```
- id
- user_id
- weight_kg
- recorded_at
```

**Exercise**
```
- id
- name
- muscle_group_primary
- muscle_groups_secondary (array)
- type (compound/isolation)
- equipment (barbell/dumbbell/cable/machine/bodyweight)
- default_rep_range_min
- default_rep_range_max
- form_image_url
- instructions (text)
- mistakes_to_avoid (text)
- alternative_exercise_ids (array)
```

**Workout_Template**
```
- id
- name (e.g., "Chest Day")
- muscle_focus
- exercises (ordered array of exercise_ids with set/rep targets)
```

**Session**
```
- id
- user_id
- template_id
- date
- started_at
- completed_at
- notes
```

**Set_Log**
```
- id
- session_id
- exercise_id
- set_number
- weight_kg
- reps
- rir (1, 2, 3, 4)
- logged_at
```

**AI_Feedback**
```
- id
- user_id
- type (post_workout / weekly / alert / on_demand)
- content (text)
- data_snapshot (JSON of analyzed data)
- created_at
```

### 5.2 Data Retention
- **Active storage:** 12 weeks rolling (for AI analysis)
- **Archive:** Older data compressed but retained for long-term progress charts
- **Export:** User can export all data as CSV/JSON

---

## 6. Technical Requirements

### 6.1 AI Integrations

| Service | Purpose | Model |
|---------|---------|-------|
| Gemini | AI Coach feedback | **Gemini 3 Flash** (`gemini-3-flash-preview`) - user's API key |
| Gemini | Exercise image generation | Nano Banana Pro (user's API key) |

### 6.2 Image Generation Prompt Template

```
Generate a clear instructional fitness illustration showing proper form for: {exercise_name}

Requirements:
- Show a fit adult in athletic wear
- Side or 3/4 angle view for best form visibility
- Highlight key body positions (joint angles, spine alignment)
- Clean, minimal background (gym setting optional)
- Anatomical accuracy
- Style: Clean line art or realistic illustration

Key form points to emphasize:
{exercise_specific_cues}
```

### 6.3 Offline Capability
- Workout templates cached locally
- Set logging works offline, syncs when connected
- AI features require connectivity

### 6.4 Platform
- Mobile-first (iOS + Android)
- Optional: Web dashboard for detailed analytics review

---

## 7. MVP Scope

### 7.1 Version 1.0 (MVP)

**Included:**
- [ ] Hungarian language UI throughout
- [ ] Onboarding with biometric data (weight, gender, age)
- [ ] 5 workout templates + flex day
- [ ] Exercise library (50+ exercises with form guides)
- [ ] Real-time set logger with RIR
- [ ] Progressive overload suggestions
- [ ] Weekly volume dashboard
- [ ] AI Coach (post-workout + weekly summaries) - in Hungarian
- [ ] Exercise swap functionality
- [ ] Rest timer
- [ ] 12-week data history
- [ ] Strength level benchmarking (Squat, Bench, Deadlift, OHP)
- [ ] Periodic weight check-in (every 2 weeks)
- [ ] Bodyweight exercise tracking (BW + added weight)

**Not Included (Future):**
- Custom template builder
- Social/sharing features
- Nutrition tracking
- Body measurements tracking
- Apple Watch / wearable integration
- Workout streaks/gamification

### 7.2 Success Metrics

| Metric | Target |
|--------|--------|
| Workout completion rate | >80% of started sessions completed |
| Logging accuracy | >90% of sets logged with all fields |
| Weekly retention | >70% return within 7 days |
| Progression rate | >60% of users increase weight on 1+ exercise per week |
| AI engagement | >50% of users read AI feedback |

---

## 8. User Stories

### 8.1 Core Stories

**US-1: Start workout**
> As a user, I want to open the app and immediately see today's workout so I can get started without friction.

**US-2: Log a set**
> As a user, I want to quickly log weight, reps, and RIR after each set so I don't lose track during my workout.

**US-3: See progression target**
> As a user, I want to see what weight/reps I should aim for based on last session so I know if I should increase.

**US-4: Learn exercise form**
> As a user, I want to tap an exercise and see a visual guide + instructions so I can perform it correctly.

**US-5: Swap exercise**
> As a user, I want to swap an exercise for an alternative if equipment is taken or I prefer a different movement.

**US-6: Track volume**
> As a user, I want to see my weekly volume per muscle group so I know I'm training enough (but not too much).

**US-7: Get AI feedback**
> As a user, I want AI-powered insights on my training so I can identify blind spots and optimize my progress.

**US-8: Handle flex day**
> As a user, I want to either choose what to train on flex day OR get a smart suggestion based on what I'm missing.

**US-9: Deload guidance**
> As a user, I want to be alerted when I need a deload week so I can recover before I burn out.

---

## 9. Open Questions / Future Considerations

1. **Warm-up sets:** Should we track warm-up sets separately? (Current: No, only working sets)

2. **Supersets:** How to handle superset logging? (Future feature)

3. **Failed reps:** Should we track partial/failed reps differently?

4. **Exercise video:** Should we add short video clips in addition to images? (Cost/complexity consideration)

5. **Monetization:** Freemium? Subscription? One-time purchase? (User provides own API keys currently)

---

## 10. Appendix

### A. Hungarian UI Strings Reference

**Navigation & General:**
| English | Hungarian |
|---------|-----------|
| Home | Főoldal |
| Workout | Edzés |
| History | Előzmények |
| Progress | Haladás |
| Settings | Beállítások |
| Profile | Profil |
| Save | Mentés |
| Cancel | Mégse |
| Next | Tovább |
| Back | Vissza |
| Done | Kész |
| Skip | Kihagyás |

**Workout Related:**
| English | Hungarian |
|---------|-----------|
| Chest Day | Mellnap |
| Back Day | Hátnap |
| Shoulder Day | Vállnap |
| Arm Day | Karnap |
| Leg Day | Lábnap |
| Flex Day | Rugalmas nap |
| Set | Sorozat |
| Rep(s) | Ismétlés(ek) |
| Weight | Súly |
| Rest | Pihenő |
| Start Workout | Edzés indítása |
| Finish Workout | Edzés befejezése |
| Log Set | Sorozat rögzítése |
| Swap Exercise | Gyakorlat cseréje |
| Skip Set | Sorozat kihagyása |

**Muscle Groups:**
| English | Hungarian |
|---------|-----------|
| Chest | Mell |
| Back | Hát |
| Shoulders | Váll |
| Biceps | Bicepsz |
| Triceps | Tricepsz |
| Quadriceps | Combfeszítő |
| Hamstrings | Combhajlító |
| Glutes | Fenék |
| Calves | Vádli |
| Core | Törzs |

**Exercises (Main Compounds):**
| English | Hungarian |
|---------|-----------|
| Bench Press | Fekvenyomás |
| Squat | Guggolás |
| Deadlift | Felhúzás |
| Overhead Press | Vállból nyomás |
| Barbell Row | Evezés rúddal |
| Pull-up | Húzódzkodás |
| Dip | Tolódzkodás |
| Lat Pulldown | Lehúzás |
| Leg Press | Lábtoló |
| Romanian Deadlift | Román felhúzás |

**Progress & Stats:**
| English | Hungarian |
|---------|-----------|
| Personal Record | Egyéni rekord |
| Weekly Volume | Heti volumen |
| Strength Level | Erőszint |
| Body Weight | Testsúly |
| Beginner | Kezdő |
| Intermediate | Középhaladó |
| Advanced | Haladó |
| Elite | Elit |

**AI Coach:**
| English | Hungarian |
|---------|-----------|
| AI Coach | AI Edző |
| Ask Coach | Kérdezd az edzőt |
| Weekly Review | Heti áttekintés |
| Deload Recommended | Deload javasolt |
| Great Progress | Remek haladás |

### B. RIR Reference Guide

| RIR | Meaning | Hungarian | When to Use |
|-----|---------|-----------|-------------|
| 1 | Could do 1 more rep | Még 1 ismétlés menne | Final set of exercise, pushing hard |
| 2 | Could do 2 more reps | Még 2 ismétlés menne | Standard working set, sustainable effort |
| 3 | Could do 3 more reps | Még 3 ismétlés menne | Warm-up or conservative effort |
| 4+ | Could do 4+ more reps | Még 4+ ismétlés menne | Weight too light, increase next set |

### C. Volume Guidelines by Muscle

| Muscle Group | Minimum | Optimal | Maximum |
|--------------|---------|---------|---------|
| Chest | 10 | 12-16 | 20 |
| Back | 10 | 14-18 | 22 |
| Shoulders | 8 | 12-16 | 20 |
| Biceps | 6 | 10-14 | 18 |
| Triceps | 6 | 10-14 | 18 |
| Quads | 8 | 12-16 | 20 |
| Hamstrings | 6 | 10-14 | 18 |
| Calves | 6 | 8-12 | 16 |

### D. Rest Period Guidelines

| Exercise Type | Recommended Rest | Hungarian |
|---------------|------------------|-----------|
| Heavy compounds (1-6 reps) | 3-5 minutes | 3-5 perc |
| Moderate compounds (6-12 reps) | 2-3 minutes | 2-3 perc |
| Isolation exercises | 60-90 seconds | 60-90 másodperc |
| Pump/burnout sets | 30-60 seconds | 30-60 másodperc |

### E. Strength Standards (Bodyweight Multipliers)

| Level | Squat | Bench | Deadlift | OHP | Hungarian |
|-------|-------|-------|----------|-----|-----------|
| Beginner | 1.0x | 0.75x | 1.25x | 0.5x | Kezdő |
| Intermediate | 1.5x | 1.2x | 2.0x | 0.8x | Középhaladó |
| Advanced | 2.0x | 1.5x | 2.5x | 1.0x | Haladó |
| Elite | 2.5x | 1.8x | 3.0x | 1.2x | Elit |

---

*End of PRD*

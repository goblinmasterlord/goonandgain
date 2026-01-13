# Exercise GIF Fix Documentation

## Issue Summary

Exercise GIFs in the app were showing wrong exercises. For example, "lat pulldown wide" showed a shoulder press GIF instead.

## Root Cause

The `exerciseDbId` values in `src/data/exerciseMedia.ts` were incorrect. The numeric IDs (e.g., `0431`) don't match the actual exercises in ExerciseDB.

Out of 46 exercises mapped:
- **22 IDs were CORRECT**
- **24 IDs were WRONG** (pointing to completely different exercises)

## How to Verify/Fix

### API Endpoint for Verification

Use RapidAPI ExerciseDB to check what exercise an ID corresponds to:

```bash
curl -X GET "https://exercisedb.p.rapidapi.com/exercises/exercise/0431" \
  -H "x-rapidapi-host: exercisedb.p.rapidapi.com" \
  -H "x-rapidapi-key: YOUR_RAPIDAPI_KEY"
```

### API Endpoint for Downloading GIFs

```bash
curl -X GET "https://exercisedb.p.rapidapi.com/image?exerciseId=0150&resolution=360" \
  -H "x-rapidapi-host: exercisedb.p.rapidapi.com" \
  -H "x-rapidapi-key: YOUR_RAPIDAPI_KEY" \
  --output exercise.gif
```

**Important:** The resolution parameter must be `360` (not higher) for the GIF endpoint.

## Corrected ID Mappings

### Already Correct (22 exercises)
| Exercise ID | ExerciseDB ID | Exercise Name |
|-------------|---------------|---------------|
| flat-barbell-bench-press | 0025 | barbell bench press |
| incline-dumbbell-press | 0314 | dumbbell incline bench press |
| chest-dips | 0251 | chest dip |
| dumbbell-bench-press | 0289 | dumbbell bench press |
| barbell-row | 0027 | barbell bent over row |
| deadlift | 0032 | barbell deadlift |
| seated-cable-row | 0861 | cable seated row |
| dumbbell-row | 0293 | dumbbell bent over row |
| pull-ups | 0651 | pull up |
| chin-ups | 0253 | chin-ups |
| dumbbell-shoulder-press | 0405 | dumbbell shoulder press |
| dumbbell-lateral-raise | 0334 | dumbbell lateral raise |
| dumbbell-rear-delt-fly | 0378 | dumbbell rear fly |
| cable-front-raise | 0162 | cable front raise |
| barbell-shrug | 0095 | barbell shrug |
| dumbbell-shrug | 0406 | dumbbell shrug |
| barbell-curl | 0031 | barbell curl |
| hammer-curl | 0313 | dumbbell hammer curl |
| barbell-back-squat | 0043 | barbell full squat |
| romanian-deadlift | 0085 | barbell romanian deadlift |
| leg-press | 0739 | sled leg press |
| leg-extension | 0585 | lever leg extension |

### Needs Correction (24 exercises)

| Exercise ID | Wrong ID | Correct ID | Correct Exercise Name |
|-------------|----------|------------|----------------------|
| cable-fly | 0160 | 0155 | cable cross-over |
| machine-chest-press | 0430 | 0576 | lever chest press |
| dumbbell-fly | 0306 | 0308 | dumbbell fly |
| pec-deck | 0863 | 0576 | lever chest press |
| lat-pulldown-wide | 0431 | **0150** | cable bar lateral pulldown |
| face-pulls | 1356 | **0203** | cable rear delt row (rope) |
| straight-arm-pulldown | 0190 | 0238 | cable straight arm pulldown |
| overhead-press-barbell | 0091 | 0091 | barbell seated overhead press (verify) |
| cable-lateral-raise | 0172 | 0178 | cable lateral raise |
| close-grip-bench-press | 0035 | 1719 | barbell incline close grip bench press |
| incline-dumbbell-curl | 0316 | 0318 | dumbbell incline curl |
| overhead-tricep-extension | 0392 | 0194 | cable overhead triceps extension |
| tricep-pushdown | 0193 | 0201 | cable pushdown |
| preacher-curl | 0047 | 0070 | barbell preacher curl |
| skull-crushers | 0055 | 0060 | barbell lying triceps extension |
| cable-curl | 0152 | 0868 | cable curl |
| tricep-dips | 0716 | 0814 | triceps dip |
| lying-leg-curl | 0599 | 0586 | lever lying leg curl |
| standing-calf-raise | 1373 | 0605 | lever standing calf raise |
| bulgarian-split-squat | 0278 | 0410 | dumbbell single leg split squat |
| hack-squat | 0574 | 0743 | sled hack squat |
| seated-calf-raise | 1374 | 0594 | lever seated calf raise |
| hip-thrust | 0046 | 1409 | barbell glute bridge |
| goblet-squat | 0291 | 1760 | dumbbell goblet squat |

**Bold** = Already downloaded and uploaded to R2

## Fix Progress

### Completed (5 exercises)
- [x] lat-pulldown-wide (0150)
- [x] face-pulls (0203)
- [x] barbell-curl (0031 - was correct)
- [x] hammer-curl (0313 - was correct)
- [x] seated-cable-row (0861 - was correct)

### Remaining (19 exercises)
- [ ] cable-fly
- [ ] machine-chest-press
- [ ] dumbbell-fly
- [ ] pec-deck
- [ ] straight-arm-pulldown
- [ ] overhead-press-barbell (verify if current is acceptable)
- [ ] cable-lateral-raise
- [ ] close-grip-bench-press
- [ ] incline-dumbbell-curl
- [ ] overhead-tricep-extension
- [ ] tricep-pushdown
- [ ] preacher-curl
- [ ] skull-crushers
- [ ] cable-curl
- [ ] tricep-dips
- [ ] lying-leg-curl
- [ ] standing-calf-raise
- [ ] bulgarian-split-squat
- [ ] hack-squat
- [ ] seated-calf-raise
- [ ] hip-thrust
- [ ] goblet-squat

## Upload to Cloudflare R2

After downloading corrected GIFs to `exercise-media/gifs/`, upload to R2:

```bash
# Using wrangler CLI (recommended)
npx wrangler r2 object put goonandgain-exercises/{exerciseId}.gif \
  --file exercise-media/gifs/{exerciseId}.gif

# Or using the Cloudflare dashboard
# Bucket: goonandgain-exercises
# Public URL: https://pub-55cfaa50e66c4741abf7367de65cdd93.r2.dev
```

## Update exerciseMedia.ts

After uploading, update `src/data/exerciseMedia.ts` with the correct `exerciseDbId` values.

## Rate Limiting Notes

- RapidAPI ExerciseDB: ~50 requests/minute on free tier
- Do downloads in batches of 5-10 to avoid rate limiting
- Wait 1-2 seconds between requests

## References

- RapidAPI ExerciseDB: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
- Cloudflare R2 Dashboard: https://dash.cloudflare.com/
- Exercise media local folder: `exercise-media/gifs/` (gitignored)

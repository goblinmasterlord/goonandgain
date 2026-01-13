# Exercise GIF Fix Documentation

**Status: ✅ COMPLETED** (January 13, 2026)

## Issue Summary

Exercise GIFs in the app were showing wrong exercises. For example, "lat pulldown wide" showed a shoulder press GIF instead.

## Root Cause

The `exerciseDbId` values in `src/data/exerciseMedia.ts` were incorrect. The numeric IDs (e.g., `0431`) didn't match the actual exercises in ExerciseDB.

Out of 46 exercises mapped:
- **22 IDs were CORRECT** (no changes needed)
- **24 IDs were WRONG** (all now fixed)

## Solution

1. Verified each exercise ID using RapidAPI ExerciseDB
2. Downloaded correct GIFs using the `/image` endpoint
3. Updated `exerciseMedia.ts` with corrected IDs
4. GIFs stored locally in `exercise-media/gifs/` for R2 upload

## API Endpoints Used

### Verify Exercise ID
```bash
curl -s -X GET "https://exercisedb.p.rapidapi.com/exercises/exercise/{id}" \
  -H "x-rapidapi-host: exercisedb.p.rapidapi.com" \
  -H "x-rapidapi-key: YOUR_KEY" | jq -r '.name'
```

### Download GIF
```bash
curl -s -X GET "https://exercisedb.p.rapidapi.com/image?exerciseId={id}&resolution=360" \
  -H "x-rapidapi-host: exercisedb.p.rapidapi.com" \
  -H "x-rapidapi-key: YOUR_KEY" \
  --output {exerciseId}.gif
```

## All Fixed Exercises (24 total)

| Exercise ID | Old ID | New ID | Notes |
|-------------|--------|--------|-------|
| lat-pulldown-wide | 0431 | **0150** | cable bar lateral pulldown |
| face-pulls | 1356 | **0203** | cable rear delt row (rope) |
| cable-fly | 0160 | **0155** | cable cross-over variation |
| machine-chest-press | 0430 | **0576** | lever chest press |
| dumbbell-fly | 0306 | **0308** | dumbbell fly |
| pec-deck | 0863 | **0188** | cable middle fly (substitute) |
| straight-arm-pulldown | 0190 | **0238** | cable straight arm pulldown |
| cable-lateral-raise | 0172 | **0178** | cable lateral raise |
| close-grip-bench-press | 0035 | **1719** | barbell incline close grip bench press |
| incline-dumbbell-curl | 0316 | **0318** | dumbbell incline curl |
| overhead-tricep-extension | 0392 | **0194** | cable overhead triceps extension |
| tricep-pushdown | 0193 | **0201** | cable pushdown |
| preacher-curl | 0047 | **0070** | barbell preacher curl |
| skull-crushers | 0055 | **0060** | barbell lying triceps extension |
| cable-curl | 0152 | **0868** | cable curl |
| tricep-dips | 0716 | **0814** | triceps dip |
| lying-leg-curl | 0599 | **0586** | lever lying leg curl |
| standing-calf-raise | 1373 | **0605** | lever standing calf raise |
| bulgarian-split-squat | 0278 | **0410** | dumbbell single leg split squat |
| hack-squat | 0574 | **0743** | sled hack squat |
| seated-calf-raise | 1374 | **0594** | lever seated calf raise |
| hip-thrust | 0046 | **1409** | barbell glute bridge |
| goblet-squat | 0291 | **1760** | dumbbell goblet squat |

## Exercises Already Correct (22 total)

These exercises had correct IDs and didn't need changes:
- flat-barbell-bench-press (0025)
- incline-dumbbell-press (0314)
- chest-dips (0251)
- dumbbell-bench-press (0289)
- barbell-row (0027)
- deadlift (0032)
- seated-cable-row (0861)
- single-arm-dumbbell-row (0293)
- pull-ups (0651)
- chin-ups (0253)
- overhead-press-barbell (0091)
- overhead-press-dumbbell (0405)
- lateral-raise (0334)
- rear-delt-fly (0378)
- cable-front-raise (0162)
- barbell-shrugs (0095)
- dumbbell-shrugs (0406)
- barbell-curl (0031)
- hammer-curl (0313)
- barbell-back-squat (0043)
- romanian-deadlift (0085)
- leg-press (0739)
- leg-extension (0585)

## Files to Upload to R2

Upload the following 26 GIFs from `exercise-media/gifs/` to R2 bucket `goonandgain-exercises`:

```bash
# Using wrangler CLI
npx wrangler r2 object put goonandgain-exercises/{filename}.gif \
  --file exercise-media/gifs/{filename}.gif --remote
```

GIFs to upload (downloaded today):
1. barbell-curl.gif
2. bulgarian-split-squat.gif
3. cable-curl.gif
4. cable-fly.gif
5. cable-lateral-raise.gif
6. close-grip-bench-press.gif
7. dumbbell-fly.gif
8. face-pulls.gif
9. goblet-squat.gif
10. hack-squat.gif
11. hammer-curl.gif
12. hip-thrust.gif
13. incline-dumbbell-curl.gif
14. lat-pulldown-wide.gif
15. lying-leg-curl.gif
16. machine-chest-press.gif
17. overhead-tricep-extension.gif
18. pec-deck.gif
19. preacher-curl.gif
20. seated-cable-row.gif
21. seated-calf-raise.gif
22. skull-crushers.gif
23. standing-calf-raise.gif
24. straight-arm-pulldown.gif
25. tricep-dips.gif
26. tricep-pushdown.gif

**Note:** `barbell-row.gif` local file is corrupt (49 bytes) but the existing R2 file is correct - no need to re-upload.

## R2 Bucket Info

- **Bucket:** `goonandgain-exercises`
- **Public URL:** `https://pub-55cfaa50e66c4741abf7367de65cdd93.r2.dev`
- **File pattern:** `{exerciseId}.gif`

## Notes for Future

- ExerciseDB IDs are stable but verify before using
- The pec-deck machine doesn't exist in ExerciseDB - using cable middle fly as substitute
- Rate limiting: ~50 requests/minute on RapidAPI free tier
- Always use `resolution=360` for the `/image` endpoint

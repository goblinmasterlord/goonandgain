# Exercise Media Download & Upload to R2

## Objective

Download exercise GIFs from ExerciseDB and images from free-exercise-db, then upload them to Cloudflare R2 for the GoonAndGain fitness app.

---

## Context

We have a fitness app (GoonAndGain) with 46 exercises that need visual demonstrations. The exercise-to-source mappings have been completed in `src/data/exerciseMedia.ts`. Now we need to:

1. Download GIFs from ExerciseDB API
2. Download fallback images from free-exercise-db GitHub repo
3. Rename files to match our exercise IDs
4. Upload to Cloudflare R2 bucket

**R2 Bucket URL:** `https://pub-55cfaa50e66c4741abf7367de65cdd93.r2.dev`

---

## Key Files

- **`src/data/exerciseMedia.ts`** - Contains all 46 exercise mappings with:
  - `exerciseId` - Our internal ID (e.g., `flat-barbell-bench-press`)
  - `exerciseDbId` - ExerciseDB numeric ID (e.g., `0025`)
  - `freeExerciseDbId` - free-exercise-db folder name (e.g., `Barbell_Bench_Press_-_Medium_Grip`)

- **`src/lib/utils/media.ts`** - URL generation utilities expecting:
  - GIFs at: `{R2_URL}/{exerciseId}.gif`
  - Images at: `{R2_URL}/{exerciseId}-0.jpg`, `{R2_URL}/{exerciseId}-1.jpg`

---

## Source URLs

### ExerciseDB (GIFs)

ExerciseDB provides animated GIFs. The URL pattern is:

```
https://v2.exercisedb.io/image/{exerciseDbId}
```

For example:
- `https://v2.exercisedb.io/image/0025` → Barbell Bench Press GIF
- `https://v2.exercisedb.io/image/0314` → Incline Dumbbell Press GIF

**Note:** ExerciseDB may require an API key for bulk downloads. Check https://exercisedb.io/ for current access methods.

### free-exercise-db (Static Images)

GitHub raw URLs for static images:

```
https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{freeExerciseDbId}/0.jpg
https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{freeExerciseDbId}/1.jpg
```

For example:
- `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg`
- `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/1.jpg`

---

## Complete Exercise Mapping Table

| exerciseId | exerciseDbId | freeExerciseDbId |
|------------|--------------|------------------|
| flat-barbell-bench-press | 0025 | Barbell_Bench_Press_-_Medium_Grip |
| incline-dumbbell-press | 0314 | Dumbbell_Incline_Bench_Press |
| cable-fly | 0160 | Cable_Crossover |
| chest-dips | 0251 | Dips_-_Chest_Version |
| machine-chest-press | 0430 | Machine_Bench_Press |
| dumbbell-bench-press | 0289 | Dumbbell_Bench_Press |
| dumbbell-fly | 0306 | Dumbbell_Flyes |
| pec-deck | 0863 | Butterfly |
| barbell-row | 0027 | Barbell_Bent_Over_Row |
| deadlift | 0032 | Barbell_Deadlift |
| lat-pulldown-wide | 0431 | Wide-Grip_Lat_Pulldown |
| seated-cable-row | 0861 | Seated_Cable_Rows |
| single-arm-dumbbell-row | 0293 | One-Arm_Dumbbell_Row |
| face-pulls | 1356 | Face_Pull |
| straight-arm-pulldown | 0190 | Straight-Arm_Pulldown |
| pull-ups | 0651 | Pullups |
| chin-ups | 0253 | Chin-Up |
| overhead-press-barbell | 0091 | Standing_Military_Press |
| overhead-press-dumbbell | 0405 | Dumbbell_Shoulder_Press |
| lateral-raise | 0334 | Side_Lateral_Raise |
| rear-delt-fly | 0378 | Dumbbell_Rear_Delt_Row |
| cable-front-raise | 0162 | Cable_Front_Raise |
| barbell-shrugs | 0095 | Barbell_Shrug |
| dumbbell-shrugs | 0406 | Dumbbell_Shrug |
| cable-lateral-raise | 0172 | Cable_Lateral_Raise |
| barbell-curl | 0031 | Barbell_Curl |
| close-grip-bench-press | 0035 | Close-Grip_Barbell_Bench_Press |
| incline-dumbbell-curl | 0316 | Incline_Dumbbell_Curl |
| overhead-tricep-extension | 0392 | Triceps_Overhead_Extension_with_Rope |
| hammer-curl | 0313 | Hammer_Curls |
| tricep-pushdown | 0193 | Triceps_Pushdown |
| preacher-curl | 0047 | Preacher_Curl |
| skull-crushers | 0055 | Lying_Triceps_Press |
| cable-curl | 0152 | Cable_Biceps_Curl |
| tricep-dips | 0716 | Dips_-_Triceps_Version |
| barbell-back-squat | 0043 | Barbell_Squat |
| romanian-deadlift | 0085 | Romanian_Deadlift |
| leg-press | 0739 | Leg_Press |
| lying-leg-curl | 0599 | Lying_Leg_Curls |
| leg-extension | 0585 | Leg_Extensions |
| standing-calf-raise | 1373 | Standing_Calf_Raises |
| bulgarian-split-squat | 0278 | Single_Leg_Squat |
| hack-squat | 0574 | Hack_Squat |
| seated-calf-raise | 1374 | Seated_Calf_Raise |
| hip-thrust | 0046 | Barbell_Hip_Thrust |
| goblet-squat | 0291 | Goblet_Squat |

**Total: 46 exercises**

---

## Step 1: Create Download Directory

```bash
mkdir -p exercise-media/gifs
mkdir -p exercise-media/images
```

---

## Step 2: Download GIFs from ExerciseDB

### Option A: Manual Download (Recommended if API access is limited)

Visit each URL in browser and save with correct filename:

```
# Format: https://v2.exercisedb.io/image/{exerciseDbId} → {exerciseId}.gif

https://v2.exercisedb.io/image/0025 → flat-barbell-bench-press.gif
https://v2.exercisedb.io/image/0314 → incline-dumbbell-press.gif
https://v2.exercisedb.io/image/0160 → cable-fly.gif
https://v2.exercisedb.io/image/0251 → chest-dips.gif
https://v2.exercisedb.io/image/0430 → machine-chest-press.gif
https://v2.exercisedb.io/image/0289 → dumbbell-bench-press.gif
https://v2.exercisedb.io/image/0306 → dumbbell-fly.gif
https://v2.exercisedb.io/image/0863 → pec-deck.gif
https://v2.exercisedb.io/image/0027 → barbell-row.gif
https://v2.exercisedb.io/image/0032 → deadlift.gif
https://v2.exercisedb.io/image/0431 → lat-pulldown-wide.gif
https://v2.exercisedb.io/image/0861 → seated-cable-row.gif
https://v2.exercisedb.io/image/0293 → single-arm-dumbbell-row.gif
https://v2.exercisedb.io/image/1356 → face-pulls.gif
https://v2.exercisedb.io/image/0190 → straight-arm-pulldown.gif
https://v2.exercisedb.io/image/0651 → pull-ups.gif
https://v2.exercisedb.io/image/0253 → chin-ups.gif
https://v2.exercisedb.io/image/0091 → overhead-press-barbell.gif
https://v2.exercisedb.io/image/0405 → overhead-press-dumbbell.gif
https://v2.exercisedb.io/image/0334 → lateral-raise.gif
https://v2.exercisedb.io/image/0378 → rear-delt-fly.gif
https://v2.exercisedb.io/image/0162 → cable-front-raise.gif
https://v2.exercisedb.io/image/0095 → barbell-shrugs.gif
https://v2.exercisedb.io/image/0406 → dumbbell-shrugs.gif
https://v2.exercisedb.io/image/0172 → cable-lateral-raise.gif
https://v2.exercisedb.io/image/0031 → barbell-curl.gif
https://v2.exercisedb.io/image/0035 → close-grip-bench-press.gif
https://v2.exercisedb.io/image/0316 → incline-dumbbell-curl.gif
https://v2.exercisedb.io/image/0392 → overhead-tricep-extension.gif
https://v2.exercisedb.io/image/0313 → hammer-curl.gif
https://v2.exercisedb.io/image/0193 → tricep-pushdown.gif
https://v2.exercisedb.io/image/0047 → preacher-curl.gif
https://v2.exercisedb.io/image/0055 → skull-crushers.gif
https://v2.exercisedb.io/image/0152 → cable-curl.gif
https://v2.exercisedb.io/image/0716 → tricep-dips.gif
https://v2.exercisedb.io/image/0043 → barbell-back-squat.gif
https://v2.exercisedb.io/image/0085 → romanian-deadlift.gif
https://v2.exercisedb.io/image/0739 → leg-press.gif
https://v2.exercisedb.io/image/0599 → lying-leg-curl.gif
https://v2.exercisedb.io/image/0585 → leg-extension.gif
https://v2.exercisedb.io/image/1373 → standing-calf-raise.gif
https://v2.exercisedb.io/image/0278 → bulgarian-split-squat.gif
https://v2.exercisedb.io/image/0574 → hack-squat.gif
https://v2.exercisedb.io/image/1374 → seated-calf-raise.gif
https://v2.exercisedb.io/image/0046 → hip-thrust.gif
https://v2.exercisedb.io/image/0291 → goblet-squat.gif
```

### Option B: Script Download (with curl)

```bash
#!/bin/bash
# download-gifs.sh

cd exercise-media/gifs

# Chest
curl -o flat-barbell-bench-press.gif "https://v2.exercisedb.io/image/0025"
curl -o incline-dumbbell-press.gif "https://v2.exercisedb.io/image/0314"
curl -o cable-fly.gif "https://v2.exercisedb.io/image/0160"
curl -o chest-dips.gif "https://v2.exercisedb.io/image/0251"
curl -o machine-chest-press.gif "https://v2.exercisedb.io/image/0430"
curl -o dumbbell-bench-press.gif "https://v2.exercisedb.io/image/0289"
curl -o dumbbell-fly.gif "https://v2.exercisedb.io/image/0306"
curl -o pec-deck.gif "https://v2.exercisedb.io/image/0863"

# Back
curl -o barbell-row.gif "https://v2.exercisedb.io/image/0027"
curl -o deadlift.gif "https://v2.exercisedb.io/image/0032"
curl -o lat-pulldown-wide.gif "https://v2.exercisedb.io/image/0431"
curl -o seated-cable-row.gif "https://v2.exercisedb.io/image/0861"
curl -o single-arm-dumbbell-row.gif "https://v2.exercisedb.io/image/0293"
curl -o face-pulls.gif "https://v2.exercisedb.io/image/1356"
curl -o straight-arm-pulldown.gif "https://v2.exercisedb.io/image/0190"
curl -o pull-ups.gif "https://v2.exercisedb.io/image/0651"
curl -o chin-ups.gif "https://v2.exercisedb.io/image/0253"

# Shoulders
curl -o overhead-press-barbell.gif "https://v2.exercisedb.io/image/0091"
curl -o overhead-press-dumbbell.gif "https://v2.exercisedb.io/image/0405"
curl -o lateral-raise.gif "https://v2.exercisedb.io/image/0334"
curl -o rear-delt-fly.gif "https://v2.exercisedb.io/image/0378"
curl -o cable-front-raise.gif "https://v2.exercisedb.io/image/0162"
curl -o barbell-shrugs.gif "https://v2.exercisedb.io/image/0095"
curl -o dumbbell-shrugs.gif "https://v2.exercisedb.io/image/0406"
curl -o cable-lateral-raise.gif "https://v2.exercisedb.io/image/0172"

# Arms
curl -o barbell-curl.gif "https://v2.exercisedb.io/image/0031"
curl -o close-grip-bench-press.gif "https://v2.exercisedb.io/image/0035"
curl -o incline-dumbbell-curl.gif "https://v2.exercisedb.io/image/0316"
curl -o overhead-tricep-extension.gif "https://v2.exercisedb.io/image/0392"
curl -o hammer-curl.gif "https://v2.exercisedb.io/image/0313"
curl -o tricep-pushdown.gif "https://v2.exercisedb.io/image/0193"
curl -o preacher-curl.gif "https://v2.exercisedb.io/image/0047"
curl -o skull-crushers.gif "https://v2.exercisedb.io/image/0055"
curl -o cable-curl.gif "https://v2.exercisedb.io/image/0152"
curl -o tricep-dips.gif "https://v2.exercisedb.io/image/0716"

# Legs
curl -o barbell-back-squat.gif "https://v2.exercisedb.io/image/0043"
curl -o romanian-deadlift.gif "https://v2.exercisedb.io/image/0085"
curl -o leg-press.gif "https://v2.exercisedb.io/image/0739"
curl -o lying-leg-curl.gif "https://v2.exercisedb.io/image/0599"
curl -o leg-extension.gif "https://v2.exercisedb.io/image/0585"
curl -o standing-calf-raise.gif "https://v2.exercisedb.io/image/1373"
curl -o bulgarian-split-squat.gif "https://v2.exercisedb.io/image/0278"
curl -o hack-squat.gif "https://v2.exercisedb.io/image/0574"
curl -o seated-calf-raise.gif "https://v2.exercisedb.io/image/1374"
curl -o hip-thrust.gif "https://v2.exercisedb.io/image/0046"
curl -o goblet-squat.gif "https://v2.exercisedb.io/image/0291"

echo "GIF download complete! Check exercise-media/gifs/"
```

---

## Step 3: Download Images from free-exercise-db

```bash
#!/bin/bash
# download-images.sh

cd exercise-media/images

# Function to download images
download_images() {
  local exercise_id=$1
  local free_db_id=$2

  curl -o "${exercise_id}-0.jpg" "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${free_db_id}/0.jpg"
  curl -o "${exercise_id}-1.jpg" "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${free_db_id}/1.jpg"
}

# Chest
download_images "flat-barbell-bench-press" "Barbell_Bench_Press_-_Medium_Grip"
download_images "incline-dumbbell-press" "Dumbbell_Incline_Bench_Press"
download_images "cable-fly" "Cable_Crossover"
download_images "chest-dips" "Dips_-_Chest_Version"
download_images "machine-chest-press" "Machine_Bench_Press"
download_images "dumbbell-bench-press" "Dumbbell_Bench_Press"
download_images "dumbbell-fly" "Dumbbell_Flyes"
download_images "pec-deck" "Butterfly"

# Back
download_images "barbell-row" "Barbell_Bent_Over_Row"
download_images "deadlift" "Barbell_Deadlift"
download_images "lat-pulldown-wide" "Wide-Grip_Lat_Pulldown"
download_images "seated-cable-row" "Seated_Cable_Rows"
download_images "single-arm-dumbbell-row" "One-Arm_Dumbbell_Row"
download_images "face-pulls" "Face_Pull"
download_images "straight-arm-pulldown" "Straight-Arm_Pulldown"
download_images "pull-ups" "Pullups"
download_images "chin-ups" "Chin-Up"

# Shoulders
download_images "overhead-press-barbell" "Standing_Military_Press"
download_images "overhead-press-dumbbell" "Dumbbell_Shoulder_Press"
download_images "lateral-raise" "Side_Lateral_Raise"
download_images "rear-delt-fly" "Dumbbell_Rear_Delt_Row"
download_images "cable-front-raise" "Cable_Front_Raise"
download_images "barbell-shrugs" "Barbell_Shrug"
download_images "dumbbell-shrugs" "Dumbbell_Shrug"
download_images "cable-lateral-raise" "Cable_Lateral_Raise"

# Arms
download_images "barbell-curl" "Barbell_Curl"
download_images "close-grip-bench-press" "Close-Grip_Barbell_Bench_Press"
download_images "incline-dumbbell-curl" "Incline_Dumbbell_Curl"
download_images "overhead-tricep-extension" "Triceps_Overhead_Extension_with_Rope"
download_images "hammer-curl" "Hammer_Curls"
download_images "tricep-pushdown" "Triceps_Pushdown"
download_images "preacher-curl" "Preacher_Curl"
download_images "skull-crushers" "Lying_Triceps_Press"
download_images "cable-curl" "Cable_Biceps_Curl"
download_images "tricep-dips" "Dips_-_Triceps_Version"

# Legs
download_images "barbell-back-squat" "Barbell_Squat"
download_images "romanian-deadlift" "Romanian_Deadlift"
download_images "leg-press" "Leg_Press"
download_images "lying-leg-curl" "Lying_Leg_Curls"
download_images "leg-extension" "Leg_Extensions"
download_images "standing-calf-raise" "Standing_Calf_Raises"
download_images "bulgarian-split-squat" "Single_Leg_Squat"
download_images "hack-squat" "Hack_Squat"
download_images "seated-calf-raise" "Seated_Calf_Raise"
download_images "hip-thrust" "Barbell_Hip_Thrust"
download_images "goblet-squat" "Goblet_Squat"

echo "Image download complete! Check exercise-media/images/"
```

---

## Step 4: Verify Downloads

```bash
# Count files
echo "GIFs downloaded:"
ls -la exercise-media/gifs/*.gif | wc -l
# Expected: 46

echo "Images downloaded:"
ls -la exercise-media/images/*.jpg | wc -l
# Expected: 92 (2 per exercise)

# Check file sizes (identify empty/failed downloads)
find exercise-media -size 0 -type f
```

---

## Step 5: Upload to Cloudflare R2

### Prerequisites

1. Install Wrangler CLI: `npm install -g wrangler`
2. Login to Cloudflare: `wrangler login`

### Find Your R2 Bucket Name

```bash
wrangler r2 bucket list
```

Look for the bucket that has the public URL `pub-55cfaa50e66c4741abf7367de65cdd93.r2.dev`

### Upload All Files

```bash
# Replace BUCKET_NAME with your actual bucket name
BUCKET_NAME="your-bucket-name"

# Upload GIFs
for file in exercise-media/gifs/*.gif; do
  filename=$(basename "$file")
  wrangler r2 object put "$BUCKET_NAME/$filename" --file "$file" --content-type "image/gif"
  echo "Uploaded: $filename"
done

# Upload Images
for file in exercise-media/images/*.jpg; do
  filename=$(basename "$file")
  wrangler r2 object put "$BUCKET_NAME/$filename" --file "$file" --content-type "image/jpeg"
  echo "Uploaded: $filename"
done

echo "Upload complete!"
```

### Alternative: Upload Entire Directory

```bash
# Merge all files into single directory first
mkdir -p exercise-media/all
cp exercise-media/gifs/* exercise-media/all/
cp exercise-media/images/* exercise-media/all/

# Upload all at once
wrangler r2 object put "$BUCKET_NAME/" --file exercise-media/all/ --recursive
```

---

## Step 6: Verify R2 Upload

Test a few URLs in browser:

```
https://pub-55cfaa50e66c4741abf7367de65cdd93.r2.dev/flat-barbell-bench-press.gif
https://pub-55cfaa50e66c4741abf7367de65cdd93.r2.dev/deadlift.gif
https://pub-55cfaa50e66c4741abf7367de65cdd93.r2.dev/barbell-curl-0.jpg
https://pub-55cfaa50e66c4741abf7367de65cdd93.r2.dev/barbell-curl-1.jpg
```

---

## Verification Checklist

After upload, verify these files exist and load correctly:

### GIFs (46 total)

**Chest (8):**
- [ ] flat-barbell-bench-press.gif
- [ ] incline-dumbbell-press.gif
- [ ] cable-fly.gif
- [ ] chest-dips.gif
- [ ] machine-chest-press.gif
- [ ] dumbbell-bench-press.gif
- [ ] dumbbell-fly.gif
- [ ] pec-deck.gif

**Back (9):**
- [ ] barbell-row.gif
- [ ] deadlift.gif
- [ ] lat-pulldown-wide.gif
- [ ] seated-cable-row.gif
- [ ] single-arm-dumbbell-row.gif
- [ ] face-pulls.gif
- [ ] straight-arm-pulldown.gif
- [ ] pull-ups.gif
- [ ] chin-ups.gif

**Shoulders (8):**
- [ ] overhead-press-barbell.gif
- [ ] overhead-press-dumbbell.gif
- [ ] lateral-raise.gif
- [ ] rear-delt-fly.gif
- [ ] cable-front-raise.gif
- [ ] barbell-shrugs.gif
- [ ] dumbbell-shrugs.gif
- [ ] cable-lateral-raise.gif

**Arms (10):**
- [ ] barbell-curl.gif
- [ ] close-grip-bench-press.gif
- [ ] incline-dumbbell-curl.gif
- [ ] overhead-tricep-extension.gif
- [ ] hammer-curl.gif
- [ ] tricep-pushdown.gif
- [ ] preacher-curl.gif
- [ ] skull-crushers.gif
- [ ] cable-curl.gif
- [ ] tricep-dips.gif

**Legs (11):**
- [ ] barbell-back-squat.gif
- [ ] romanian-deadlift.gif
- [ ] leg-press.gif
- [ ] lying-leg-curl.gif
- [ ] leg-extension.gif
- [ ] standing-calf-raise.gif
- [ ] bulgarian-split-squat.gif
- [ ] hack-squat.gif
- [ ] seated-calf-raise.gif
- [ ] hip-thrust.gif
- [ ] goblet-squat.gif

### Images (92 total - 2 per exercise)

Each exercise should have both `-0.jpg` and `-1.jpg` variants.

---

## Troubleshooting

### ExerciseDB Issues

If ExerciseDB URLs don't work directly:

1. Check their current API documentation at https://exercisedb.io/
2. You may need to:
   - Sign up for an API key
   - Use their official API endpoints
   - Check RapidAPI for ExerciseDB: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb

Alternative ExerciseDB API approach:
```bash
# If you have an API key
curl -H "X-RapidAPI-Key: YOUR_KEY" \
     "https://exercisedb.p.rapidapi.com/exercises/exercise/0025" \
     | jq -r '.gifUrl'
```

### free-exercise-db Issues

The GitHub raw URLs should work directly. If not:

1. Clone the repo locally: `git clone https://github.com/yuhonas/free-exercise-db.git`
2. Copy images from `exercises/` folder

### R2 Upload Permissions

If upload fails:
1. Ensure your Cloudflare account has R2 enabled
2. Check bucket permissions allow write access
3. Verify wrangler is authenticated: `wrangler whoami`

---

## File Naming Reference

| Source | Download Name | R2 Name |
|--------|---------------|---------|
| ExerciseDB | {exerciseDbId}.gif | {exerciseId}.gif |
| free-exercise-db | {freeExerciseDbId}/0.jpg | {exerciseId}-0.jpg |
| free-exercise-db | {freeExerciseDbId}/1.jpg | {exerciseId}-1.jpg |

---

## Summary

**Total files to upload:**
- 46 GIFs
- 92 JPGs (2 per exercise)
- **138 files total**

**Estimated storage:** ~50-100 MB (GIFs are typically 200KB-2MB each)

**Expected result:** The ExerciseMedia component in the app will load GIFs by default, falling back to static images if GIF fails to load.

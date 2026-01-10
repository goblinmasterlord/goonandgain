// Exercise data
export {
  chestExercises,
  backExercises,
  shoulderExercises,
  armExercises,
  legExercises,
  allExercises,
  getExerciseById,
  getExercisesByMuscle,
  getExercisesByEquipment,
} from './exercises'

// Workout templates
export {
  // Bro Split templates
  chestDayTemplate,
  backDayTemplate,
  shouldersDayTemplate,
  armsDayTemplate,
  legsDayTemplate,
  flexDayTemplate,
  broSplitTemplates,
  // PPL templates
  pushDayATemplate,
  pushDayBTemplate,
  pullDayATemplate,
  pullDayBTemplate,
  legsDayATemplate,
  legsDayBTemplate,
  pplTemplates,
  // All templates
  allTemplates,
  // Helper functions
  getTemplateById,
  getTemplateByMuscle,
  getTemplateTotalSets,
  getTemplateEstimatedDuration,
  getTemplatesBySplit,
  getAvailableTemplatesBySplit,
} from './templates'

// Muscle group metadata
export const muscleGroups = [
  { id: 'chest', nameHu: 'Mell', nameEn: 'Chest', color: '#ff4d00' },
  { id: 'back', nameHu: 'Hát', nameEn: 'Back', color: '#0066ff' },
  { id: 'shoulders', nameHu: 'Váll', nameEn: 'Shoulders', color: '#9333ea' },
  { id: 'biceps', nameHu: 'Bicepsz', nameEn: 'Biceps', color: '#ff0066' },
  { id: 'triceps', nameHu: 'Tricepsz', nameEn: 'Triceps', color: '#ff0066' },
  { id: 'quads', nameHu: 'Combfeszítő', nameEn: 'Quadriceps', color: '#00d4aa' },
  { id: 'hamstrings', nameHu: 'Combhajlító', nameEn: 'Hamstrings', color: '#00d4aa' },
  { id: 'glutes', nameHu: 'Fenék', nameEn: 'Glutes', color: '#00d4aa' },
  { id: 'calves', nameHu: 'Vádli', nameEn: 'Calves', color: '#00d4aa' },
  { id: 'core', nameHu: 'Törzs', nameEn: 'Core', color: '#8a8a8a' },
] as const

// Equipment metadata
export const equipmentTypes = [
  { id: 'barbell', nameHu: 'Rúd', nameEn: 'Barbell' },
  { id: 'dumbbell', nameHu: 'Súlyzó', nameEn: 'Dumbbell' },
  { id: 'cable', nameHu: 'Kábel', nameEn: 'Cable' },
  { id: 'machine', nameHu: 'Gép', nameEn: 'Machine' },
  { id: 'bodyweight', nameHu: 'Testsúly', nameEn: 'Bodyweight' },
  { id: 'kettlebell', nameHu: 'Kettlebell', nameEn: 'Kettlebell' },
  { id: 'ez_bar', nameHu: 'EZ rúd', nameEn: 'EZ Bar' },
] as const

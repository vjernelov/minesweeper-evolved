export type Difficulty = 'easy' | 'normal' | 'expert';

export interface DifficultyConfig {
  label: string;
  mineCount: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { label: 'Easy', mineCount: 200 },
  normal: { label: 'Normal', mineCount: 400 },
  expert: { label: 'Expert', mineCount: 600 },
};

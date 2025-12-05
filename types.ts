
export interface WorkoutLog {
  timestamp: number;
  lessonTitle: string;
  weekNumber: number;
  dayNumber: number;
}

export interface UserProfile {
  username: string;
  email?: string; // Optional (Anonymous)
  password?: string; // Optional (Anonymous)
  joinedAt: number; // Timestamp
  goal: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  history: WorkoutLog[];
}

export interface DaySession {
  dayNumber: number; // 1-7
  title: string;
  description: string;
  videoUrl: string; // User provided URL or AI generated search query
  completed: boolean;
}

export interface WeekPlan {
  weekNumber: number; // 1-4
  focus: string; // e.g., "Adaptation", "Strength"
  days: DaySession[];
}

export interface MonthlyPlan {
  id: string; // Unique ID to track plan version
  title: string;
  description: string;
  createdAt: number;
  weeks: WeekPlan[];
}

export interface DailyLog {
  date: string; // ISO date string YYYY-MM-DD
  completed: boolean;
  mood?: string;
}

export enum AppView {
  LANDING = 'LANDING',
  // LOGIN Removed
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  DONATION = 'DONATION', 
}

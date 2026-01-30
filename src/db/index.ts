import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { WorkoutRecord, WorkoutTemplate } from '../types/workout';

export class SwiftDB extends Dexie {
  workouts!: Table<WorkoutRecord>;
  templates!: Table<WorkoutTemplate>;

  constructor() {
    super('SwiftDB');

    this.version(1).stores({
      workouts: '++id, startTime, templateId',
      templates: '++id, name, createdAt',
    });
  }
}

export const db = new SwiftDB();

// Helper functions
export async function getRecentWorkouts(limit = 10): Promise<WorkoutRecord[]> {
  return db.workouts.orderBy('startTime').reverse().limit(limit).toArray();
}

export async function getWorkoutById(id: number): Promise<WorkoutRecord | undefined> {
  return db.workouts.get(id);
}

export async function deleteWorkout(id: number): Promise<void> {
  return db.workouts.delete(id);
}

export async function getAllTemplates(): Promise<WorkoutTemplate[]> {
  return db.templates.orderBy('name').toArray();
}

export async function saveTemplate(template: WorkoutTemplate): Promise<number> {
  return db.templates.add(template);
}

export async function updateTemplate(id: number, template: Partial<WorkoutTemplate>): Promise<number> {
  await db.templates.update(id, template);
  return id;
}

export async function deleteTemplate(id: number): Promise<void> {
  return db.templates.delete(id);
}

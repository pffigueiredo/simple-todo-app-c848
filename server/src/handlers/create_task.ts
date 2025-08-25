import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        title: input.title,
        description: input.description || null, // Handle optional nullable field
        completed: false, // New tasks are not completed by default
        // created_at and updated_at will use database defaults
      })
      .returning()
      .execute();

    const task = result[0];
    return task;
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
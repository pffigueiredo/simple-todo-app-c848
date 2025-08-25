import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteTask(input: DeleteTaskInput): Promise<{ success: boolean; id: number }> {
  try {
    // First check if task exists
    const existingTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (existingTask.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    // Delete the task
    await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    return {
      success: true,
      id: input.id
    };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
}
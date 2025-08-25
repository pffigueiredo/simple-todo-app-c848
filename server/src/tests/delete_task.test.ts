import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: DeleteTaskInput = {
  id: 1
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // First create a task to delete
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task to Delete',
        description: 'This task will be deleted',
        completed: false
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];
    
    // Delete the task
    const result = await deleteTask({ id: createdTask.id });

    // Verify the response
    expect(result.success).toBe(true);
    expect(result.id).toEqual(createdTask.id);

    // Verify the task no longer exists in the database
    const deletedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(deletedTasks).toHaveLength(0);
  });

  it('should throw error when task does not exist', async () => {
    // Try to delete a non-existent task
    await expect(deleteTask({ id: 999 }))
      .rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should delete correct task when multiple tasks exist', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        completed: false
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task',
        completed: true
      })
      .returning()
      .execute();

    const task3 = await db.insert(tasksTable)
      .values({
        title: 'Task 3',
        description: 'Third task',
        completed: false
      })
      .returning()
      .execute();

    // Delete the middle task
    const result = await deleteTask({ id: task2[0].id });

    // Verify correct response
    expect(result.success).toBe(true);
    expect(result.id).toEqual(task2[0].id);

    // Verify only the correct task was deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(2);
    
    const remainingIds = remainingTasks.map(task => task.id);
    expect(remainingIds).toContain(task1[0].id);
    expect(remainingIds).toContain(task3[0].id);
    expect(remainingIds).not.toContain(task2[0].id);
  });

  it('should handle deletion of completed task', async () => {
    // Create a completed task
    const completedTask = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'This is a completed task',
        completed: true
      })
      .returning()
      .execute();

    // Delete the completed task
    const result = await deleteTask({ id: completedTask[0].id });

    // Verify deletion
    expect(result.success).toBe(true);
    expect(result.id).toEqual(completedTask[0].id);

    // Verify task is gone from database
    const deletedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, completedTask[0].id))
      .execute();

    expect(deletedTasks).toHaveLength(0);
  });

  it('should handle deletion of task with null description', async () => {
    // Create a task with null description
    const taskWithNullDesc = await db.insert(tasksTable)
      .values({
        title: 'Task with Null Description',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    // Delete the task
    const result = await deleteTask({ id: taskWithNullDesc[0].id });

    // Verify deletion
    expect(result.success).toBe(true);
    expect(result.id).toEqual(taskWithNullDesc[0].id);

    // Verify task is gone from database
    const deletedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskWithNullDesc[0].id))
      .execute();

    expect(deletedTasks).toHaveLength(0);
  });
});
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskCompletionInput } from '../schema';
import { toggleTaskCompletion } from '../handlers/toggle_task_completion';
import { eq } from 'drizzle-orm';

describe('toggleTaskCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle task completion from false to true', async () => {
    // Create a test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTask = taskResult[0];
    const originalUpdatedAt = createdTask.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: ToggleTaskCompletionInput = {
      id: createdTask.id,
      completed: true
    };

    const result = await toggleTaskCompletion(input);

    // Verify the task completion was toggled
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toBe(true);
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should toggle task completion from true to false', async () => {
    // Create a completed task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: null,
        completed: true
      })
      .returning()
      .execute();
    
    const createdTask = taskResult[0];
    const originalUpdatedAt = createdTask.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: ToggleTaskCompletionInput = {
      id: createdTask.id,
      completed: false
    };

    const result = await toggleTaskCompletion(input);

    // Verify the task completion was toggled
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Completed Task');
    expect(result.description).toBeNull();
    expect(result.completed).toBe(false);
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should update the task in database', async () => {
    // Create a test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Database Test Task',
        description: 'Testing database persistence',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTask = taskResult[0];

    const input: ToggleTaskCompletionInput = {
      id: createdTask.id,
      completed: true
    };

    await toggleTaskCompletion(input);

    // Query database directly to verify the change was persisted
    const updatedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(updatedTasks).toHaveLength(1);
    expect(updatedTasks[0].completed).toBe(true);
    expect(updatedTasks[0].updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should throw error when task does not exist', async () => {
    const input: ToggleTaskCompletionInput = {
      id: 99999, // Non-existent ID
      completed: true
    };

    await expect(toggleTaskCompletion(input))
      .rejects
      .toThrow(/task with id 99999 not found/i);
  });

  it('should preserve other task fields when toggling completion', async () => {
    // Create a task with specific data
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Important Task',
        description: 'This is a very important task',
        completed: false
      })
      .returning()
      .execute();
    
    const createdTask = taskResult[0];

    const input: ToggleTaskCompletionInput = {
      id: createdTask.id,
      completed: true
    };

    const result = await toggleTaskCompletion(input);

    // Verify all fields are preserved except completed and updated_at
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Important Task');
    expect(result.description).toEqual('This is a very important task');
    expect(result.completed).toBe(true); // Only this should change
    expect(result.created_at).toEqual(createdTask.created_at); // Should not change
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime()); // Should be updated
  });
});
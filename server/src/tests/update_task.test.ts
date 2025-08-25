import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Test task creation helper
const createTestTask = async (overrides: Partial<typeof tasksTable.$inferInsert> = {}): Promise<Task> => {
  const result = await db.insert(tasksTable)
    .values({
      title: 'Original Title',
      description: 'Original description',
      completed: false,
      ...overrides
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title only', async () => {
    const task = await createTestTask();
    
    const input: UpdateTaskInput = {
      id: task.id,
      title: 'Updated Title'
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toEqual(task.created_at);
    expect(result.updated_at).not.toEqual(task.updated_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update task description only', async () => {
    const task = await createTestTask();
    
    const input: UpdateTaskInput = {
      id: task.id,
      description: 'Updated description'
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Original Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toEqual(task.created_at);
    expect(result.updated_at).not.toEqual(task.updated_at);
  });

  it('should update task completion status only', async () => {
    const task = await createTestTask();
    
    const input: UpdateTaskInput = {
      id: task.id,
      completed: true
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Original Title');
    expect(result.description).toEqual('Original description');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toEqual(task.created_at);
    expect(result.updated_at).not.toEqual(task.updated_at);
  });

  it('should update multiple fields at once', async () => {
    const task = await createTestTask();
    
    const input: UpdateTaskInput = {
      id: task.id,
      title: 'New Title',
      description: 'New description',
      completed: true
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toEqual(task.created_at);
    expect(result.updated_at).not.toEqual(task.updated_at);
  });

  it('should set description to null', async () => {
    const task = await createTestTask();
    
    const input: UpdateTaskInput = {
      id: task.id,
      description: null
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Original Title');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.updated_at).not.toEqual(task.updated_at);
  });

  it('should save changes to database', async () => {
    const task = await createTestTask();
    
    const input: UpdateTaskInput = {
      id: task.id,
      title: 'Database Test Title',
      completed: true
    };

    await updateTask(input);

    // Verify changes were persisted
    const updatedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(updatedTasks).toHaveLength(1);
    expect(updatedTasks[0].title).toEqual('Database Test Title');
    expect(updatedTasks[0].completed).toEqual(true);
    expect(updatedTasks[0].description).toEqual('Original description');
    expect(updatedTasks[0].updated_at).not.toEqual(task.updated_at);
  });

  it('should always update timestamp even with no other changes', async () => {
    const task = await createTestTask();
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const input: UpdateTaskInput = {
      id: task.id
    };

    const result = await updateTask(input);

    expect(result.updated_at).not.toEqual(task.updated_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(task.updated_at.getTime());
  });

  it('should throw error when task does not exist', async () => {
    const input: UpdateTaskInput = {
      id: 999999,
      title: 'Non-existent Task'
    };

    await expect(updateTask(input)).rejects.toThrow(/Task with id 999999 not found/i);
  });

  it('should handle task with null description initially', async () => {
    const task = await createTestTask({ description: null });
    
    const input: UpdateTaskInput = {
      id: task.id,
      description: 'Added description'
    };

    const result = await updateTask(input);

    expect(result.description).toEqual('Added description');
    expect(result.title).toEqual('Original Title');
    expect(result.completed).toEqual(false);
  });

  it('should handle updating from completed to incomplete', async () => {
    const task = await createTestTask({ completed: true });
    
    const input: UpdateTaskInput = {
      id: task.id,
      completed: false
    };

    const result = await updateTask(input);

    expect(result.completed).toEqual(false);
    expect(result.title).toEqual('Original Title');
    expect(result.updated_at).not.toEqual(task.updated_at);
  });
});
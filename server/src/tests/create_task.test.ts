import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test inputs with various scenarios
const basicTaskInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing'
};

const taskWithNullDescription: CreateTaskInput = {
  title: 'Task without description',
  description: null
};

const taskWithoutDescription: CreateTaskInput = {
  title: 'Task with omitted description'
  // description is omitted (optional field)
};

const taskWithEmptyTitle: CreateTaskInput = {
  title: '',
  description: 'This should fail validation'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with description', async () => {
    const result = await createTask(basicTaskInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with null description', async () => {
    const result = await createTask(taskWithNullDescription);

    expect(result.title).toEqual('Task without description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with omitted description', async () => {
    const result = await createTask(taskWithoutDescription);

    expect(result.title).toEqual('Task with omitted description');
    expect(result.description).toBeNull(); // Should default to null when omitted
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(basicTaskInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set correct default values', async () => {
    const result = await createTask(basicTaskInput);

    // Verify defaults are applied correctly
    expect(result.completed).toBe(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps are recent (within last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    expect(result.created_at >= oneMinuteAgo).toBe(true);
    expect(result.updated_at >= oneMinuteAgo).toBe(true);
    expect(result.created_at <= now).toBe(true);
    expect(result.updated_at <= now).toBe(true);
  });

  it('should handle multiple tasks with unique IDs', async () => {
    const task1 = await createTask({ title: 'First Task', description: 'First' });
    const task2 = await createTask({ title: 'Second Task', description: 'Second' });
    const task3 = await createTask({ title: 'Third Task', description: null });

    // Verify all tasks have unique IDs
    expect(task1.id).not.toEqual(task2.id);
    expect(task1.id).not.toEqual(task3.id);
    expect(task2.id).not.toEqual(task3.id);

    // Verify all tasks are saved in database
    const allTasks = await db.select().from(tasksTable).execute();
    expect(allTasks).toHaveLength(3);
    
    // Verify task data
    const taskTitles = allTasks.map(task => task.title).sort();
    expect(taskTitles).toEqual(['First Task', 'Second Task', 'Third Task']);
  });

  it('should preserve special characters in title and description', async () => {
    const specialTask: CreateTaskInput = {
      title: 'Task with "quotes" & symbols!@#$%',
      description: 'Description with émojis 🚀 and unicode: ñáéíóú'
    };

    const result = await createTask(specialTask);

    expect(result.title).toEqual('Task with "quotes" & symbols!@#$%');
    expect(result.description).toEqual('Description with émojis 🚀 and unicode: ñáéíóú');

    // Verify it's correctly stored in database
    const dbTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(dbTask[0].title).toEqual(specialTask.title);
    expect(dbTask[0].description).toEqual(specialTask.description!);
  });
});
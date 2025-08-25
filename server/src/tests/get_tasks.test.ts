import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    expect(result).toEqual([]);
  });

  it('should return all tasks ordered by creation date (newest first)', async () => {
    // Create test tasks with different timestamps
    const firstTask = {
      title: 'First Task',
      description: 'First task description',
      completed: false
    };

    const secondTask = {
      title: 'Second Task',
      description: 'Second task description',
      completed: true
    };

    const thirdTask = {
      title: 'Third Task',
      description: null,
      completed: false
    };

    // Insert tasks one by one to ensure different timestamps
    const [task1] = await db.insert(tasksTable)
      .values(firstTask)
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const [task2] = await db.insert(tasksTable)
      .values(secondTask)
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const [task3] = await db.insert(tasksTable)
      .values(thirdTask)
      .returning()
      .execute();

    const result = await getTasks();

    // Should return 3 tasks
    expect(result).toHaveLength(3);

    // Should be ordered by creation date (newest first)
    expect(result[0].id).toEqual(task3.id);
    expect(result[0].title).toEqual('Third Task');
    expect(result[0].description).toBeNull();
    expect(result[0].completed).toBe(false);

    expect(result[1].id).toEqual(task2.id);
    expect(result[1].title).toEqual('Second Task');
    expect(result[1].description).toEqual('Second task description');
    expect(result[1].completed).toBe(true);

    expect(result[2].id).toEqual(task1.id);
    expect(result[2].title).toEqual('First Task');
    expect(result[2].description).toEqual('First task description');
    expect(result[2].completed).toBe(false);

    // Verify all have proper timestamps
    result.forEach(task => {
      expect(task.id).toBeDefined();
      expect(task.created_at).toBeInstanceOf(Date);
      expect(task.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle tasks with various field values correctly', async () => {
    // Create tasks with different combinations of fields
    const tasks = [
      {
        title: 'Task with description',
        description: 'This task has a description',
        completed: false
      },
      {
        title: 'Task without description',
        description: null,
        completed: true
      },
      {
        title: 'Another completed task',
        description: 'Another description',
        completed: true
      }
    ];

    // Insert all tasks
    for (const task of tasks) {
      await db.insert(tasksTable).values(task).execute();
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
    }

    const result = await getTasks();

    expect(result).toHaveLength(3);

    // Check that all field types are correct
    result.forEach(task => {
      expect(typeof task.id).toBe('number');
      expect(typeof task.title).toBe('string');
      expect(task.description === null || typeof task.description === 'string').toBe(true);
      expect(typeof task.completed).toBe('boolean');
      expect(task.created_at).toBeInstanceOf(Date);
      expect(task.updated_at).toBeInstanceOf(Date);
    });

    // Verify tasks are in correct order (newest first)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }
  });

  it('should return tasks with proper database structure', async () => {
    // Create a single task to verify structure
    const testTask = {
      title: 'Structure Test Task',
      description: 'Testing the returned structure',
      completed: false
    };

    await db.insert(tasksTable).values(testTask).execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    const task = result[0];

    // Verify all expected fields are present with correct types
    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('title');
    expect(task).toHaveProperty('description');
    expect(task).toHaveProperty('completed');
    expect(task).toHaveProperty('created_at');
    expect(task).toHaveProperty('updated_at');

    expect(typeof task.id).toBe('number');
    expect(typeof task.title).toBe('string');
    expect(typeof task.completed).toBe('boolean');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);

    // Description can be null or string
    expect(task.description === null || typeof task.description === 'string').toBe(true);
  });
});
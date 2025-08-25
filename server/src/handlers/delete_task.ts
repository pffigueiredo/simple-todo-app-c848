import { type DeleteTaskInput } from '../schema';

export async function deleteTask(input: DeleteTaskInput): Promise<{ success: boolean; id: number }> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is deleting a task from the database.
    // Should throw an error if task with given ID is not found.
    // Returns a success response with the deleted task ID.
    return Promise.resolve({
        success: true,
        id: input.id
    });
}
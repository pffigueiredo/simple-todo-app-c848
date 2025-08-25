import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import type { Task, CreateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state for creating new tasks
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: null
  });

  // Load tasks from API
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Create new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsCreating(true);
    try {
      const newTask = await trpc.createTask.mutate(formData);
      setTasks((prev: Task[]) => [newTask, ...prev]);
      
      // Reset form
      setFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle task completion
  const handleToggleTask = async (task: Task) => {
    try {
      const updatedTask = await trpc.toggleTaskCompletion.mutate({
        id: task.id,
        completed: !task.completed
      });
      
      setTasks((prev: Task[]) =>
        prev.map((t: Task) => t.id === task.id ? updatedTask : t)
      );
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Filter tasks
  const completedTasks = tasks.filter((task: Task) => task.completed);
  const pendingTasks = tasks.filter((task: Task) => !task.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ✅ My Todo App
          </h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Task Creation Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Add New Task
            </CardTitle>
            <CardDescription>
              Create a new task to add to your todo list
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <Input
                placeholder="What do you need to do?"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                }
                required
                className="text-lg"
              />
              <Textarea
                placeholder="Add a description (optional)"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTaskInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
                className="resize-none"
              />
              <Button 
                type="submit" 
                disabled={isCreating || !formData.title.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? 'Creating...' : 'Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tasks Statistics */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="text-center bg-white/80 backdrop-blur border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </CardContent>
            </Card>
            <Card className="text-center bg-white/80 backdrop-blur border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">{pendingTasks.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </CardContent>
            </Card>
            <Card className="text-center bg-white/80 backdrop-blur border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-white/80 backdrop-blur border-0 shadow-md">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading tasks...</div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && tasks.length === 0 && (
          <Card className="bg-white/80 backdrop-blur border-0 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600">Create your first task to get started!</p>
            </CardContent>
          </Card>
        )}

        {/* Tasks List */}
        {!isLoading && tasks.length > 0 && (
          <div className="space-y-6">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Circle className="h-5 w-5 text-orange-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Pending Tasks ({pendingTasks.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {pendingTasks.map((task: Task) => (
                    <Card key={task.id} className="bg-white/80 backdrop-blur border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="flex items-start gap-4 p-4">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(task)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                          {task.description && (
                            <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              Pending
                            </Badge>
                            <span>Created {task.created_at.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{task.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTask(task.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Separator between pending and completed */}
            {pendingTasks.length > 0 && completedTasks.length > 0 && (
              <Separator className="my-8" />
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Completed Tasks ({completedTasks.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {completedTasks.map((task: Task) => (
                    <Card key={task.id} className="bg-white/60 backdrop-blur border-0 shadow-md opacity-75">
                      <CardContent className="flex items-start gap-4 p-4">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(task)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-600 line-through mb-1">{task.title}</h3>
                          {task.description && (
                            <p className="text-gray-500 text-sm mb-2 line-through">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Completed
                            </Badge>
                            <span>Created {task.created_at.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{task.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTask(task.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Built with React, TypeScript, and tRPC</p>
        </div>
      </div>
    </div>
  );
}

export default App;
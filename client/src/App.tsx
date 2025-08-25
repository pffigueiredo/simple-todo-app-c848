import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import type { Task, CreateTaskInput } from '../../server/src/schema';

function TodoApp() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header with Theme Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
              ✅ My Todo App
            </h1>
            <p className="text-gray-600 dark:text-gray-300 transition-colors">Stay organized and get things done!</p>
          </div>
          <div className="ml-4">
            <ThemeToggle />
          </div>
        </div>

        {/* Task Creation Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white transition-colors">
              <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Add New Task
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 transition-colors">
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
                className="text-lg bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors"
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
                className="resize-none bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors"
              />
              <Button 
                type="submit" 
                disabled={isCreating || !formData.title.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              >
                {isCreating ? 'Creating...' : 'Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tasks Statistics */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-md transition-colors">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{tasks.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 transition-colors">Total Tasks</div>
              </CardContent>
            </Card>
            <Card className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-md transition-colors">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 transition-colors">{pendingTasks.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 transition-colors">Pending</div>
              </CardContent>
            </Card>
            <Card className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-md transition-colors">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 transition-colors">{completedTasks.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 transition-colors">Completed</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-md transition-colors">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400 transition-colors">Loading tasks...</div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && tasks.length === 0 && (
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-md transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors">No tasks yet</h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors">Create your first task to get started!</p>
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
                  <Circle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">
                    Pending Tasks ({pendingTasks.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {pendingTasks.map((task: Task) => (
                    <Card key={task.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-md hover:shadow-lg transition-all duration-300">
                      <CardContent className="flex items-start gap-4 p-4">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(task)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 transition-colors">{task.title}</h3>
                          {task.description && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 transition-colors">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                            <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700/50 transition-colors">
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
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-900 dark:text-white transition-colors">Delete Task</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600 dark:text-gray-300 transition-colors">
                                Are you sure you want to delete "{task.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTask(task.id)}
                                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors"
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
              <Separator className="my-8 bg-gray-200 dark:bg-gray-700 transition-colors" />
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">
                    Completed Tasks ({completedTasks.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {completedTasks.map((task: Task) => (
                    <Card key={task.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur border-0 shadow-md opacity-75 transition-all duration-300">
                      <CardContent className="flex items-start gap-4 p-4">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(task)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-600 dark:text-gray-400 line-through mb-1 transition-colors">{task.title}</h3>
                          {task.description && (
                            <p className="text-gray-500 dark:text-gray-500 text-sm mb-2 line-through transition-colors">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 transition-colors">
                            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50 transition-colors">
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
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-900 dark:text-white transition-colors">Delete Task</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600 dark:text-gray-300 transition-colors">
                                Are you sure you want to delete "{task.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTask(task.id)}
                                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors"
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
        <div className="text-center mt-12 text-gray-500 dark:text-gray-400 text-sm transition-colors">
          <p>Built with React, TypeScript, and tRPC</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TodoApp />
    </ThemeProvider>
  );
}

export default App;
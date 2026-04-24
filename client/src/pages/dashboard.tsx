import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useListTasks, useGetTaskSummary, useCreateTask, getListTasksQueryKey, getGetTaskSummaryQueryKey } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, CheckCircle2, CircleDashed, LayoutList, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const { data: tasks, isLoading: tasksLoading } = useListTasks({
    query: {
      enabled: !!token,
      queryKey: getListTasksQueryKey()
    }
  });

  const { data: summary } = useGetTaskSummary({
    query: {
      enabled: !!token,
      queryKey: getGetTaskSummaryQueryKey()
    }
  });

  const createMutation = useCreateTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTaskSummaryQueryKey() });
        setIsCreating(false);
        form.reset();
      },
      onError: (err: any) => {
        toast.error(err.data?.message || "Failed to create task");
      }
    }
  });

  const form = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: "", description: "" },
  });

  const onSubmit = (data: z.infer<typeof createTaskSchema>) => {
    createMutation.mutate({ data });
  };

  const pendingTasks = tasks?.filter(t => t.status === "pending") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];
  const sortedTasks = [...pendingTasks, ...completedTasks];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/20">
      {/* Navbar */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">Task Manager</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
              {user?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage your day and stay productive.</p>
          </div>
          {summary && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="px-3 py-1 text-sm bg-background">
                <LayoutList className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {summary.total} Total
              </Badge>
              <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary border-primary/20">
                <CircleDashed className="w-3.5 h-3.5 mr-1.5" /> {summary.pending} Pending
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-sm bg-background border-dashed text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {summary.completed} Done
              </Badge>
            </div>
          )}
        </div>

        {/* Task Creation */}
        {!isCreating ? (
          <Button 
            className="w-full sm:w-auto shadow-sm" 
            onClick={() => setIsCreating(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Add new task
          </Button>
        ) : (
          <Card className="border-primary/20 shadow-md">
            <CardContent className="p-4 sm:p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="What needs to be done?"
                            className="text-lg font-medium border-none shadow-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 h-auto"
                            autoFocus
                            disabled={createMutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Add extra details... (optional)"
                            className="resize-none min-h-[80px] text-sm border-none shadow-none px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 bg-transparent"
                            disabled={createMutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => {
                        setIsCreating(false);
                        form.reset();
                      }}
                      disabled={createMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create task
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Task List */}
        <div className="space-y-3">
          {tasksLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center px-4 rounded-xl border border-dashed border-border/60 bg-background/50">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">You're all caught up!</h3>
              <p className="text-muted-foreground max-w-sm mt-1">
                You have no tasks right now. Enjoy your free time, or add a new task to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {sortedTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

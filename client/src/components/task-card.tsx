import React, { useState } from "react";
import { format } from "date-fns";
import { Task, useDeleteTask, useToggleTask, useUpdateTask, getListTasksQueryKey, getGetTaskSummaryQueryKey } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Pencil, Trash2, X, Check, Calendar } from "lucide-react";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTaskSummaryQueryKey() });
  };

  const toggleMutation = useToggleTask({
    mutation: {
      onSuccess: () => invalidateQueries(),
      onError: (err: any) => toast.error(err.data?.message || "Failed to update status"),
    },
  });

  const deleteMutation = useDeleteTask({
    mutation: {
      onSuccess: () => invalidateQueries(),
      onError: (err: any) => toast.error(err.data?.message || "Failed to delete task"),
    },
  });

  const updateMutation = useUpdateTask({
    mutation: {
      onSuccess: () => {
        setIsEditing(false);
        invalidateQueries();
      },
      onError: (err: any) => toast.error(err.data?.message || "Failed to update task"),
    },
  });

  const handleToggle = () => {
    toggleMutation.mutate({ id: task.id });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: task.id });
  };

  const handleSave = () => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    updateMutation.mutate({
      id: task.id,
      data: { title: editTitle, description: editDescription }
    });
  };

  const isCompleted = task.status === "completed";

  if (isEditing) {
    return (
      <Card className="p-4 flex flex-col gap-3 shadow-sm border-primary/20 bg-background/50">
        <div className="space-y-1.5">
          <Input 
            value={editTitle} 
            onChange={(e) => setEditTitle(e.target.value)} 
            placeholder="Task title"
            className="font-medium h-9"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Textarea 
            value={editDescription} 
            onChange={(e) => setEditDescription(e.target.value)} 
            placeholder="Add details..."
            className="resize-none min-h-[80px]"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => {
            setIsEditing(false);
            setEditTitle(task.title);
            setEditDescription(task.description || "");
          }} disabled={updateMutation.isPending}>
            <X className="w-4 h-4 mr-1.5" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
            <Check className="w-4 h-4 mr-1.5" /> Save
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`group relative p-4 flex gap-4 transition-all duration-300 ${isCompleted ? 'opacity-60 bg-muted/30 border-dashed' : 'hover:border-primary/30 shadow-sm'}`}>
      <div className="pt-1">
        <Checkbox 
          checked={isCompleted} 
          onCheckedChange={handleToggle}
          disabled={toggleMutation.isPending}
          className={`h-5 w-5 rounded-full transition-colors ${isCompleted ? 'data-[state=checked]:bg-primary data-[state=checked]:border-primary' : ''}`}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-4">
          <h3 className={`font-semibold text-base break-words transition-colors ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </h3>
          <Badge variant={isCompleted ? "secondary" : "default"} className={`shrink-0 ${isCompleted ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}>
            {task.status}
          </Badge>
        </div>
        
        {task.description && (
          <p className={`text-sm mt-1 whitespace-pre-wrap ${isCompleted ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
            {task.description}
          </p>
        )}
        
        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground font-medium">
          <Calendar className="w-3.5 h-3.5 opacity-70" />
          <span>{format(new Date(task.createdAt), "MMM d, yyyy")}</span>
        </div>
      </div>
      
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background/80 backdrop-blur-sm p-1 rounded-md shadow-sm border">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setIsEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
          <span className="sr-only">Edit</span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Delete</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete task?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Are you sure you want to permanently delete this task?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}

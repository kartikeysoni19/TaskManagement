import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "pending" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface TaskSummary {
  total: number;
  pending: number;
  completed: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

let tokenGetter: () => string | null = () => null;
export function setAuthTokenGetter(fn: () => string | null) {
  tokenGetter = fn;
}

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = tokenGetter();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`/api${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data);
  }
  return data as T;
}

// ---------- Query keys ----------
export const getGetMeQueryKey = () => ["/auth/me"] as const;
export const getListTasksQueryKey = () => ["/tasks"] as const;
export const getGetTaskSummaryQueryKey = () => ["/tasks/summary"] as const;

// ---------- Auth ----------
export function useGetMe<TData = User>(opts?: {
  query?: Partial<UseQueryOptions<User, ApiError, TData>>;
}) {
  return useQuery<User, ApiError, TData>({
    queryKey: getGetMeQueryKey() as unknown as readonly unknown[],
    queryFn: () => request<User>("/auth/me"),
    ...(opts?.query ?? {}),
  });
}

export function useLogin(opts?: {
  mutation?: UseMutationOptions<AuthResponse, ApiError, { data: { email: string; password: string } }>;
}) {
  return useMutation<AuthResponse, ApiError, { data: { email: string; password: string } }>({
    mutationFn: ({ data }) => request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    ...(opts?.mutation ?? {}),
  });
}

export function useRegister(opts?: {
  mutation?: UseMutationOptions<AuthResponse, ApiError, { data: { name: string; email: string; password: string } }>;
}) {
  return useMutation<AuthResponse, ApiError, { data: { name: string; email: string; password: string } }>({
    mutationFn: ({ data }) => request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    ...(opts?.mutation ?? {}),
  });
}

// ---------- Tasks ----------
export function useListTasks<TData = Task[]>(opts?: {
  query?: Partial<UseQueryOptions<Task[], ApiError, TData>>;
}) {
  return useQuery<Task[], ApiError, TData>({
    queryKey: getListTasksQueryKey() as unknown as readonly unknown[],
    queryFn: () => request<Task[]>("/tasks"),
    ...(opts?.query ?? {}),
  });
}

export function useGetTaskSummary<TData = TaskSummary>(opts?: {
  query?: Partial<UseQueryOptions<TaskSummary, ApiError, TData>>;
}) {
  return useQuery<TaskSummary, ApiError, TData>({
    queryKey: getGetTaskSummaryQueryKey() as unknown as readonly unknown[],
    queryFn: () => request<TaskSummary>("/tasks/summary"),
    ...(opts?.query ?? {}),
  });
}

export function useCreateTask(opts?: {
  mutation?: UseMutationOptions<Task, ApiError, { data: { title: string; description?: string } }>;
}) {
  return useMutation<Task, ApiError, { data: { title: string; description?: string } }>({
    mutationFn: ({ data }) => request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) }),
    ...(opts?.mutation ?? {}),
  });
}

export function useUpdateTask(opts?: {
  mutation?: UseMutationOptions<Task, ApiError, { id: string; data: { title?: string; description?: string; status?: "pending" | "completed" } }>;
}) {
  return useMutation<Task, ApiError, { id: string; data: { title?: string; description?: string; status?: "pending" | "completed" } }>({
    mutationFn: ({ id, data }) => request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    ...(opts?.mutation ?? {}),
  });
}

export function useDeleteTask(opts?: {
  mutation?: UseMutationOptions<{ ok: true }, ApiError, { id: string }>;
}) {
  return useMutation<{ ok: true }, ApiError, { id: string }>({
    mutationFn: ({ id }) => request<{ ok: true }>(`/tasks/${id}`, { method: "DELETE" }),
    ...(opts?.mutation ?? {}),
  });
}

export function useToggleTask(opts?: {
  mutation?: UseMutationOptions<Task, ApiError, { id: string }>;
}) {
  return useMutation<Task, ApiError, { id: string }>({
    mutationFn: ({ id }) => request<Task>(`/tasks/${id}/toggle`, { method: "PATCH" }),
    ...(opts?.mutation ?? {}),
  });
}

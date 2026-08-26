import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, type UserPayload } from '../api/usersApi';
import { queryKeys } from '@/shared/lib/queryClient';
import type { User } from '@/shared/types';

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users.all, queryFn: usersApi.list });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserPayload) => usersApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Pick<User, 'role' | 'is_active'>> }) =>
      usersApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

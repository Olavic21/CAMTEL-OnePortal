import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Table, type Column } from '@/shared/components/Table';
import { Badge } from '@/shared/components/Badge';
import { Select, Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import { useToast } from '@/shared/components/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getAssignableRoles, canManageAccount, type MainUserRole } from '@/features/auth/permissions';
import type { User, UserRole } from '@/shared/types';

// Champs alignes sur le serialiseur DRF de creation d'utilisateur (section 8.8),
// + mot de passe : necessaire pour que le compte cree soit immediatement
// utilisable pour se connecter (voir usersApi.ts / mockAuthStore.ts).
function buildSchema(t: TFunction) {
  return z.object({
    username: z.string().min(3, t('validation.minLength', { count: 3 })),
    email: z.string().email(t('validation.invalidEmail')),
    role: z.enum(['super_admin', 'admin', 'product_manager', 'editor', 'customer']),
    password: z.string().min(8, t('validation.minLength', { count: 8 })),
  });
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

// Gestion des comptes internes — regle metier du porteur du projet :
// - N'importe qui cree lui-meme un compte client ("customer") via /inscription.
// - Un Admin peut promouvoir un compte en Editeur/Gestionnaire (jamais en Admin).
// - Seul un Super Admin peut attribuer/retirer le role Admin, et gerer les
//   comptes deja Admin/Super Admin (voir getAssignableRoles/canManageAccount).
export default function AdminUserListPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { push } = useToast();
  const { user: currentUser } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const schema = useMemo(() => buildSchema(t), [t]);

  const roleLabel: Record<UserRole, string> = {
    super_admin: t('roles.super_admin'),
    admin: t('roles.admin'),
    product_manager: t('roles.product_manager'),
    editor: t('roles.editor'),
    customer: t('roles.customer'),
    // Legacy (compte VIEWER en base) : affiche comme un simple client.
    viewer: t('roles.customer'),
  };

  const assignableRoles = currentUser ? getAssignableRoles(currentUser.role) : [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: assignableRoles.includes('editor') ? 'editor' : assignableRoles[0] },
  });

  function openCreate() {
    reset({ username: '', email: '', password: '', role: assignableRoles.includes('editor') ? 'editor' : assignableRoles[0] });
    setIsCreateOpen(true);
  }

  async function onSubmit(values: FormValues) {
    try {
      await createUser.mutateAsync(values);
      push(t('admin.users.created_toast', { name: values.username }));
      setIsCreateOpen(false);
    } catch {
      push(t('admin.users.createError_toast'), 'error');
    }
  }

  const columns: Column<User>[] = [
    { key: 'username', header: t('admin.users.username'), render: (u) => <span className="font-medium">{u.username}</span> },
    { key: 'email', header: t('admin.users.email'), render: (u) => u.email },
    {
      key: 'role',
      header: t('admin.users.role'),
      render: (u) => {
        const isSelf = u.id === currentUser?.id;
        const canManage = currentUser ? canManageAccount(currentUser.role, u.role) : false;
        if (isSelf || !canManage) {
          return <Badge tone="neutral">{roleLabel[u.role]}</Badge>;
        }
        return (
          <Select
            value={u.role}
            onChange={(e) =>
              updateUser.mutate(
                { id: u.id, payload: { role: e.target.value as UserRole } },
                { onSuccess: () => push(t('admin.users.roleUpdated_toast')) },
              )
            }
            aria-label={`${t('admin.users.role')} — ${u.username}`}
            className="!py-1.5"
          >
            {/* L'option courante reste affichee meme si elle n'est plus attribuable
               (ex: Admin qui voit un compte redescendu en Visiteur), pour ne
               jamais masquer l'etat reel du compte. */}
            {!assignableRoles.includes(u.role as MainUserRole) && <option value={u.role}>{roleLabel[u.role]}</option>}
            {assignableRoles.map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </Select>
        );
      },
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (u) => {
        const isSelf = u.id === currentUser?.id;
        const canManage = currentUser ? canManageAccount(currentUser.role, u.role) : false;
        return (
          <button
            onClick={() =>
              updateUser.mutate(
                { id: u.id, payload: { is_active: !u.is_active } },
                { onSuccess: () => push(t('admin.users.statusUpdated_toast')) },
              )
            }
            disabled={isSelf || !canManage}
          >
            <Badge tone={u.is_active ? 'success' : 'neutral'}>{u.is_active ? t('common.active') : t('common.inactive')}</Badge>
          </button>
        );
      },
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (u) => {
        const isSelf = u.id === currentUser?.id;
        const canManage = currentUser ? canManageAccount(currentUser.role, u.role) : false;
        if (isSelf) return <span className="text-xs text-neutral-400 dark:text-neutral-500">{t('common.you')}</span>;
        if (!canManage) return null;
        return (
          <button
            onClick={() => {
              if (confirm(t('admin.users.deleteConfirm', { name: u.username }))) {
                deleteUser.mutate(u.id, { onSuccess: () => push(t('admin.users.deleted_toast')) });
              }
            }}
            className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400"
            aria-label={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('admin.users.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> {t('admin.users.newUser')}
        </Button>
      </div>

      {currentUser?.role === 'admin' && (
        <p className="mb-4 rounded-lg bg-primary-50 px-4 py-2.5 text-sm text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          {t('admin.users.adminHint')}
        </p>
      )}

      <Table
        columns={columns}
        rows={data?.results ?? []}
        emptyMessage={isLoading ? t('common.loading') : t('admin.users.empty')}
      />

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t('admin.users.newUserTitle')}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input label={t('admin.users.username')} error={errors.username?.message} {...register('username')} />
          <Input label={t('admin.users.email')} type="email" error={errors.email?.message} {...register('email')} />
          <Input
            label={t('admin.users.initialPassword')}
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Select label={t('admin.users.role')} error={errors.role?.message} {...register('role')}>
            {assignableRoles.map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </Select>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.users.passwordHint')}</p>
          <Button type="submit" isLoading={isSubmitting} className="mt-2">
            {t('admin.users.createAccount')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

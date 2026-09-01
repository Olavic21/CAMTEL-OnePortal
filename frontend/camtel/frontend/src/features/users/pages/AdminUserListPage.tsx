/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useMemo, useState } from 'react';
import { Plus, Trash2, ShieldCheck, Pencil, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useRoles, useUpdateRole } from '../hooks/useUsers';
import { useToast } from '@/shared/components/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getAssignableRoles, canManageAccount } from '@/features/auth/permissions';
import type { User, UserRole } from '@/shared/types';
import { formatDate } from '@/shared/utils/format';

function buildSchema(t: TFunction) {
  return z.object({
    username: z.string().min(3, t('validation.minLength', { count: 3 })),
    email: z.string().email(t('validation.invalidEmail')),
    role: z.enum(['super_admin', 'admin', 'product_manager', 'editor', 'customer']),
    password: z.string().min(8, t('validation.minLength', { count: 8 })),
  });
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function AdminUserListPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useUsers();
  const { data: rolesData } = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const updateRole = useUpdateRole();
  const deleteUser = useDeleteUser();
  const { push } = useToast();
  const { user: currentUser } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  // Modal rôle: utilisateur sélectionné + nouveau rôle + étape confirmation
  const [roleModal, setRoleModal] = useState<{ user: User | null; newRole: UserRole | '' } >({ user: null, newRole: '' as any });
  const [confirmStep, setConfirmStep] = useState(false);
  const schema = useMemo(() => buildSchema(t), [t]);

  const roleLabel: Record<UserRole, string> = {
    super_admin: t('roles.super_admin'),
    admin: t('roles.admin'),
    product_manager: t('roles.product_manager'),
    editor: t('roles.editor'),
    customer: t('roles.customer'),
    viewer: t('roles.customer'),
  };

  const assignableRoles = currentUser ? getAssignableRoles(currentUser.role) : [];
  // Rôles depuis backend (source de vérité) — fallback sur assignableRoles
  const backendRoles: { code: UserRole; label: string }[] = useMemo(() => {
    if (rolesData?.roles?.length) {
      return rolesData.roles.map((r) => ({ code: r.code as UserRole, label: r.label }));
    }
    return assignableRoles.map((r) => ({ code: r, label: roleLabel[r] }));
  }, [rolesData, assignableRoles, roleLabel]);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: assignableRoles.includes('editor') ? 'editor' : assignableRoles[0] as any },
  });

  function openCreate() {
    reset({ username: '', email: '', password: '', role: assignableRoles.includes('editor') ? 'editor' : (assignableRoles[0] as any) });
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

  // Filtrage + recherche
  const filtered = useMemo(() => {
    const users = data?.results ?? [];
    return users.filter((u) => {
      const term = search.toLowerCase();
      const matchSearch = !term || `${u.username} ${u.email} ${u.first_name ?? ''} ${u.last_name ?? ''}`.toLowerCase().includes(term);
      const matchRole = !filterRole || u.role === filterRole;
      const matchStatus = !filterStatus || (filterStatus === 'active' ? u.is_active : !u.is_active);
      // Afficher uniquement les acteurs back-office par défaut ? Spec: "comptes pouvant accéder au Back Office" — on affiche tous mais met en évidence back-office
      return matchSearch && matchRole && matchStatus;
    });
  }, [data, search, filterRole, filterStatus]);

  function openRoleModal(user: User) {
    // Protections UI
    if (user.id === currentUser?.id) {
      push('Vous ne pouvez pas modifier votre propre rôle.', 'error');
      return;
    }
    if (!isSuperAdmin) {
      push('Seul un Super Admin peut modifier les rôles.', 'error');
      return;
    }
    setRoleModal({ user, newRole: user.role as UserRole });
    setConfirmStep(false);
  }

  async function confirmRoleChange() {
    const target = roleModal.user;
    const newRole = roleModal.newRole as UserRole;
    if (!target || !newRole) return;
    if (newRole === target.role) {
      setRoleModal({ user: null, newRole: '' as any });
      setConfirmStep(false);
      return;
    }
    try {
      await updateRole.mutateAsync({ id: target.id, role: newRole });
      push(t('admin.users.roleUpdated_toast') ?? `Le rôle de ${target.username} a été modifié avec succès.`, 'success' as any);
      // Notification affichée aussi via backend (user concerné + acteur)
      setRoleModal({ user: null, newRole: '' as any });
      setConfirmStep(false);
    } catch (e: any) {
      const detail = e?.response?.data?.detail || e?.message || "Erreur lors de la modification du rôle.";
      // Gestion 403 dernier SuperAdmin
      push(detail, 'error');
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'Utilisateur',
      render: (u) => {
        const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username;
        return (
          <div className="leading-tight">
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{fullName}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">@{u.username}</p>
          </div>
        );
      },
    },
    { key: 'email', header: 'Email', render: (u) => <span className="text-sm">{u.email}</span> },
    {
      key: 'role',
      header: 'Rôle',
      render: (u) => <Badge tone={u.role === 'super_admin' ? 'destructive' : u.role === 'admin' ? 'warning' : 'neutral'}>{roleLabel[u.role]}</Badge>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (u) => (
        <button
          onClick={() => {
            if (u.id === currentUser?.id) return push('Vous ne pouvez pas modifier votre propre statut.', 'error');
            const canManage = currentUser ? canManageAccount(currentUser.role, u.role) : false;
            if (!canManage) return push('Action non autorisée.', 'error');
            updateUser.mutate(
              { id: u.id, payload: { is_active: !u.is_active } },
              { onSuccess: () => push(t('admin.users.statusUpdated_toast')), onError: (e: any) => push(e?.response?.data?.detail ?? 'Erreur', 'error') },
            );
          }}
          disabled={u.id === currentUser?.id}
        >
          <Badge tone={u.is_active ? 'success' : 'neutral'}>{u.is_active ? t('common.active') : t('common.inactive')}</Badge>
        </button>
      ),
    },
    { key: 'date_joined', header: 'Création', render: (u) => <span className="text-xs text-neutral-600 dark:text-neutral-400">{u.date_joined ? formatDate(u.date_joined) : '—'}</span> },
    { key: 'last_login', header: 'Dernière connexion', render: (u) => <span className="text-xs text-neutral-600 dark:text-neutral-400">{u.last_login ? formatDate(u.last_login) : '—'}</span> },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (u) => {
        const isSelf = u.id === currentUser?.id;
        if (isSelf) return <span className="text-xs text-neutral-400">{t('common.you')}</span>;
        const canManage = currentUser ? canManageAccount(currentUser.role, u.role) : false;
        return (
          <div className="flex items-center gap-1">
            {isSuperAdmin ? (
              <Button variant="tertiary" size="sm" onClick={() => openRoleModal(u)} className="gap-1">
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </Button>
            ) : canManage ? (
              <span className="text-xs text-neutral-400">Lecture seule</span>
            ) : null}
            {canManage && (
              <button
                onClick={() => {
                  if (confirm(t('admin.users.deleteConfirm', { name: u.username }))) {
                    deleteUser.mutate(u.id, { onSuccess: () => push(t('admin.users.deleted_toast')), onError: (e: any) => push(e?.response?.data?.detail ?? 'Erreur', 'error') });
                  }
                }}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400"
                aria-label={t('common.delete')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Gestion des utilisateurs</h1>
        <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">— Acteurs du Back Office</span>
      </div>
      <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">Les rôles sont la source de vérité des permissions (SUPER_ADMIN → toutes). Seul un Super Admin peut modifier un rôle. Chaque changement est journalisé (Audit Log) et notifié.</p>

      {currentUser?.role === 'admin' && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {t('admin.users.adminHint')}
        </p>
      )}
      {!isSuperAdmin && (
        <p className="mb-4 rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> Seul un Super Admin peut modifier les rôles. Vous êtes en lecture seule.
        </p>
      )}

      {/* Barre recherche + filtres (spec: Recherche utilisateur + Filtres Rôle/Statut) */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-neutral-400" />
          <Input label="Recherche utilisateur" placeholder="Nom, prénom, username, email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select label="Rôle" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="">Tous les rôles</option>
          {backendRoles.map((r) => (
            <option key={r.code} value={r.code}>{r.label}</option>
          ))}
        </Select>
        <Select label="Statut" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tous</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </Select>
        <Button onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus(''); }} variant="tertiary">Réinitialiser</Button>
        <Button onClick={openCreate} className="gap-1">
          <Plus className="h-4 w-4" /> {t('admin.users.newUser')}
        </Button>
      </div>

      <Table columns={columns} rows={filtered} emptyMessage={isLoading ? t('common.loading') : t('admin.users.empty')} />

      {/* Création */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t('admin.users.newUserTitle')}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input label={t('admin.users.username')} error={errors.username?.message} {...register('username')} />
          <Input label={t('admin.users.email')} type="email" error={errors.email?.message} {...register('email')} />
          <Input label={t('admin.users.initialPassword')} type="password" error={errors.password?.message} {...register('password')} />
          <Select label={t('admin.users.role')} error={errors.role?.message} {...register('role')}>
            {assignableRoles.map((r) => (
              <option key={r} value={r}>{roleLabel[r as UserRole]}</option>
            ))}
          </Select>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('admin.users.passwordHint')}</p>
          <Button type="submit" isLoading={isSubmitting} className="mt-2">{t('admin.users.createAccount')}</Button>
        </form>
      </Modal>

      {/* Modal modification du rôle — étape 1: sélection */}
      <Modal isOpen={!!roleModal.user && !confirmStep} onClose={() => { setRoleModal({ user: null, newRole: '' as any }); setConfirmStep(false); }} title="Modifier le rôle">
        {roleModal.user && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Utilisateur</p>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{[roleModal.user.first_name, roleModal.user.last_name].filter(Boolean).join(' ') || roleModal.user.username} — {roleModal.user.email}</p>
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Rôle actuel</p>
              <p><Badge tone="neutral">{roleLabel[roleModal.user.role]}</Badge></p>
            </div>
            <Select
              label="Nouveau rôle"
              value={roleModal.newRole as string}
              onChange={(e) => setRoleModal({ ...roleModal, newRole: e.target.value as UserRole })}
            >
              {backendRoles.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </Select>
            {/* Info permissions par rôle */}
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
              {roleModal.newRole === 'super_admin' && 'SUPER_ADMIN → toutes les permissions (utilisateurs, rôles, catalogue, analytics, administration).'}
              {roleModal.newRole === 'admin' && 'ADMIN → catalogue, souscriptions, tickets, clients, analytics, mais pas gestion des rôles privilégiés.'}
              {roleModal.newRole === 'product_manager' && 'CATALOG_MANAGER → catalogue, produits, offres, sources, qualité.'}
              {roleModal.newRole === 'editor' && 'EDITOR → actualités, médias, rédactionnel.'}
              {roleModal.newRole === 'customer' && 'CUSTOMER → portail client uniquement, pas de back-office.'}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="tertiary" onClick={() => { setRoleModal({ user: null, newRole: '' as any }); setConfirmStep(false); }}>Annuler</Button>
              <Button
                disabled={!roleModal.newRole || roleModal.newRole === roleModal.user.role}
                onClick={() => setConfirmStep(true)}
              >
                Continuer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation étape 2 */}
      <Modal isOpen={!!roleModal.user && confirmStep} onClose={() => setConfirmStep(false)} title="Confirmer la modification">
        {roleModal.user && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">Vous êtes sur le point de modifier le rôle de cet utilisateur.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Utilisateur</p>
                <p className="font-medium">{[roleModal.user.first_name, roleModal.user.last_name].filter(Boolean).join(' ') || roleModal.user.username}</p>
                <p className="text-xs text-neutral-500">{roleModal.user.email}</p>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-neutral-500">Ancien rôle</p>
                  <Badge tone="neutral">{roleLabel[roleModal.user.role]}</Badge>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Nouveau rôle</p>
                  <Badge tone="warning">{roleLabel[roleModal.newRole as UserRole]}</Badge>
                </div>
              </div>
            </div>
            {roleModal.user.role === 'super_admin' && !filtered.some((u) => u.role === 'super_admin' && u.id !== roleModal.user!.id && u.is_active) && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Attention : c’est le dernier Super Admin actif — l’opération sera bloquée par le serveur.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="tertiary" onClick={() => setConfirmStep(false)}>Annuler</Button>
              <Button isLoading={updateRole.isPending} onClick={confirmRoleChange} className="gap-1">
                <CheckCircle2 className="h-4 w-4" /> Confirmer la modification
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

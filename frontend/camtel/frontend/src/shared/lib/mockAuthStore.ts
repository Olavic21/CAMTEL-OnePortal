import type { User, UserRole } from '@/shared/types';

// Mini "backend" de comptes utilisateurs, simule cote navigateur (localStorage)
// tant qu'aucun vrai backend Django/DRF n'est branche. Objectif : rendre
// testable le VRAI flux voulu par le porteur du projet :
//   1) Le Super Administrateur se connecte en premier avec un compte deja
//      cree (bootstrap) — jamais d'auto-connexion automatique.
//   2) Il cree les autres comptes (Admin, Gestionnaire Produits, Editeur).
//   3) Chaque compte cree se connecte ensuite avec SES PROPRES identifiants
//      et n'a acces qu'a l'interface definie par son role.
// A retirer entierement des que le vrai backend est disponible (usersApi et
// useAuth basculeront alors sur les vrais endpoints /auth/... et /users/).

interface MockAccount extends User {
  password: string;
}

const STORAGE_KEY = 'camtel_demo_accounts';

// Compte Super Admin initial (bootstrap). Identifiants affiches sur la page
// de connexion en mode demo pour permettre la toute premiere connexion.
const BOOTSTRAP_SUPER_ADMIN: MockAccount = {
  id: 1,
  username: 'superadmin',
  email: 'superadmin@camtel.cm',
  role: 'super_admin',
  is_active: true,
  date_joined: new Date().toISOString(),
  password: 'CamtelAdmin2026!',
};

function loadStore(): MockAccount[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as MockAccount[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // stockage corrompu -> on reseed ci-dessous
    }
  }
  const seeded = [BOOTSTRAP_SUPER_ADMIN];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveStore(accounts: MockAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function stripPassword(account: MockAccount): User {
  const user: Partial<MockAccount> = { ...account };
  delete user.password;
  return user as User;
}

function nextId(accounts: MockAccount[]): number {
  return accounts.reduce((max, a) => Math.max(max, a.id), 0) + 1;
}

export const mockAuthStore = {
  bootstrapCredentials: {
    username: BOOTSTRAP_SUPER_ADMIN.username,
    password: BOOTSTRAP_SUPER_ADMIN.password,
  },

  list(): User[] {
    return loadStore().map(stripPassword);
  },

  getById(id: number): User | null {
    const account = loadStore().find((a) => a.id === id);
    return account ? stripPassword(account) : null;
  },

  usernameOrEmailTaken(username: string, email: string): boolean {
    return loadStore().some((a) => a.username === username || a.email === email);
  },

  findByCredentials(username: string, password: string): User | null {
    const account = loadStore().find((a) => a.username === username && a.password === password);
    if (!account || !account.is_active) return null;
    return stripPassword(account);
  },

  create(payload: { username: string; email: string; role: UserRole; password: string }): User {
    const accounts = loadStore();
    const account: MockAccount = {
      id: nextId(accounts),
      username: payload.username,
      email: payload.email,
      role: payload.role,
      is_active: true,
      date_joined: new Date().toISOString(),
      password: payload.password,
    };
    accounts.push(account);
    saveStore(accounts);
    return stripPassword(account);
  },

  update(id: number, patch: Partial<Pick<User, 'role' | 'is_active'>>): User | null {
    const accounts = loadStore();
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    accounts[idx] = { ...accounts[idx], ...patch };
    saveStore(accounts);
    return stripPassword(accounts[idx]);
  },

  remove(id: number) {
    saveStore(loadStore().filter((a) => a.id !== id));
  },
};

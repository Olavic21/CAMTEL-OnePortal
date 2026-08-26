/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { setAccessToken, clearTokens, getAccessToken } from '@/shared/lib/tokenStorage';
import { mockAuthStore } from '@/shared/lib/mockAuthStore';
import { PERMISSIONS, type Permission } from '../permissions';
import type { User, UserRole } from '@/shared/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (username: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  can: (permission: Permission) => boolean;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Hierarchie des roles (section 9.1/9.3), utilisee UNIQUEMENT pour les gardes
// generales de type "au moins editeur/gestionnaire" (ex: RequireAuth roles={['editor']}
// pour bloquer l'entree dans /admin aux simples visiteurs).
// Pour les permissions metier fines (qui peut publier un produit, gerer les
// messages, etc.), on utilise `can()` + la matrice PERMISSIONS (section 9.2) :
// product_manager et editor sont des roles PARALLELES, pas hierarchiques
// entre eux, donc une simple comparaison de rang ne suffit pas.
const ROLE_RANK: Record<UserRole, number> = {
  visitor: 0,
  editor: 1,
  product_manager: 1,
  admin: 2,
  super_admin: 3,
};

// MODE DEMO — à n'activer QUE si VITE_DEMO_MODE est explicitement "true".
// Par défaut DÉSACTIVÉ : le frontend utilise le vrai backend Django/DRF (JWT).
// (Historiquement ce mode était opt-out "!== 'false'" et donc actif par défaut,
// ce qui contournait l'API réelle même quand le backend était disponible.)
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const SESSION_KEY = 'camtel_demo_session_user_id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (DEMO_MODE) {
      // Restaure la session demo (persistee en localStorage) si l'utilisateur
      // avait deja une session ouverte avant de recharger la page.
      const storedId = localStorage.getItem(SESSION_KEY);
      if (storedId) {
        const found = mockAuthStore.getById(Number(storedId));
        if (found) setUser(found);
        else localStorage.removeItem(SESSION_KEY);
      }
      setIsLoading(false);
      return;
    }

    async function bootstrap() {
      if (getAccessToken()) {
        try {
          const me = await authApi.me();
          setUser(me);
        } catch {
          clearTokens();
        }
      }
      setIsLoading(false);
    }
    bootstrap();
  }, []);

  async function login(username: string, password: string) {
    if (DEMO_MODE) {
      const found = mockAuthStore.findByCredentials(username, password);
      if (!found) throw new Error('Identifiants invalides');
      localStorage.setItem(SESSION_KEY, String(found.id));
      setUser(found);
      return found;
    }
    const { access } = await authApi.login({ username, password });
    setAccessToken(access);
    const me = await authApi.me();
    setUser(me);
    return me;
  }

  // Inscription publique : cree toujours un compte "visitor" (jamais un
  // role choisi par le formulaire) — coherent avec la regle "tout le monde
  // peut au minimum creer un compte visiteur".
  async function register(username: string, email: string, password: string) {
    if (DEMO_MODE) {
      if (mockAuthStore.usernameOrEmailTaken(username, email)) {
        throw new Error('Identifiant ou e-mail deja utilise');
      }
      const created = mockAuthStore.create({ username, email, role: 'visitor', password });
      localStorage.setItem(SESSION_KEY, String(created.id));
      setUser(created);
      return created;
    }
    const { access } = await authApi.register({ username, email, password });
    setAccessToken(access);
    const me = await authApi.me();
    setUser(me);
    return me;
  }

  function logout() {
    if (DEMO_MODE) {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
      navigate('/admin/login');
      return;
    }
    // Revoque le refresh token cote serveur (blacklist) avant de nettoyer
    // l'etat local — sinon un token vole avant expiration restait utilisable
    // malgre un "logout" apparent.
    authApi.logout().catch(() => {
      // Meme si l'appel echoue (reseau, token deja expire...), on nettoie
      // quand meme la session locale : l'utilisateur ne doit jamais rester
      // bloque connecte dans l'UI.
    });
    clearTokens();
    setUser(null);
    navigate('/admin/login');
  }

  function hasRole(...roles: UserRole[]) {
    if (!user) return false;
    return roles.some((r) => ROLE_RANK[user.role] >= ROLE_RANK[r]);
  }

  function can(permission: Permission) {
    if (!user) return false;
    return PERMISSIONS[permission].includes(user.role);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        hasRole,
        can,
        isDemoMode: DEMO_MODE,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

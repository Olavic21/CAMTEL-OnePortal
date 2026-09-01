/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, LifeBuoy, UserCircle, Smartphone, Phone, Truck, Server, CreditCard, ShoppingBag, Wrench, MessageCircle, HelpCircle, Bot, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ticketsApi } from '@/features/tickets/api/ticketsApi';

const CATEGORIES = [
  { key: 'account', icon: UserCircle, labelKey: 'account' },
  { key: 'mobile', icon: Smartphone, labelKey: 'mobile' },
  { key: 'fixe', icon: Phone, labelKey: 'fixe' },
  { key: 'fibre', icon: LifeBuoy, labelKey: 'fibre' },
  { key: 'transport', icon: Truck, labelKey: 'transport' },
  { key: 'datacenter', icon: Server, labelKey: 'datacenter' },
  { key: 'payments', icon: CreditCard, labelKey: 'payments' },
  { key: 'subscriptions', icon: ShoppingBag, labelKey: 'subscriptions' },
  { key: 'catalog', icon: Search, labelKey: 'catalog' },
  { key: 'technical', icon: Wrench, labelKey: 'technical' },
] as const;

const FAQS = [
  { q: 'Comment souscrire à une offre ?', a: 'Choisissez une offre dans le catalogue, cliquez sur Souscrire ou Demander un devis selon le mode de souscription, puis remplissez le formulaire.', cat: 'subscriptions' },
  { q: 'Comment payer en ligne ?', a: 'Les offres ONLINE permettent un paiement Orange Money ou MTN Mobile Money via notre plateforme sécurisée. Montant côté serveur, idempotence garantie.', cat: 'payments' },
  { q: 'Comment vérifier mon éligibilité fibre ?', a: 'Page Vérifier l’éligibilité ou fiche produit fibre : saisissez votre adresse, le système renvoie un statut indicatif.', cat: 'fibre' },
  { q: 'Où trouver une agence ?', a: 'Page À propos > Nos agences : recherche par ville/région et itinéraire Google Maps. 102 agences officielles.', cat: 'account' },
  { q: 'Comment créer un ticket ?', a: 'Mon compte > Mes tickets ou Help Center > Créer un ticket (connecté). Le support vous répondra. Backend SupportTicket réel.', cat: 'technical' },
  { q: 'Fixe : que propose CAMTEL ?', a: 'Téléphonie fixe, fibre FTTH, solutions IP/PABX pour particuliers et entreprises.', cat: 'fixe' },
  { q: 'Mobile : offres Blue ?', a: 'Voix, SMS, data 4G sous marque Blue, services à valeur ajoutée.', cat: 'mobile' },
  { q: 'Transport : backbone ?', a: 'DWDM, IP/MPLS, fibre, solutions opérateurs/ISP/grands comptes.', cat: 'transport' },
  { q: 'Data Center : services ?', a: 'Hébergement, backup, cloud, colocation, interconnexion Tier III.', cat: 'datacenter' },
  { q: 'Catalogue : comment filtrer ?', a: 'Service (Fixes/Mobiles...), segment, technologie, prix, périodicité, disponibilité. Tri Pertinence/Prix/Nom.', cat: 'catalog' },
];

const ARTICLES = [
  { id: 1, title: 'Gérer mon compte', cat: 'account', excerpt: 'Création, connexion, profil, mot de passe.', content: 'Mon compte → Profil, abonnements, tickets, paiements, notifications. Mot de passe via /admin/login.' },
  { id: 2, title: 'Offres Mobiles Blue', cat: 'mobile', excerpt: 'Forfaits voix/SMS/data 4G.', content: 'Blue est la marque mobile de CAMTEL. Offres prépayées/postpayées, USSD, Mobile App.' },
  { id: 3, title: 'Fixe & Fibre', cat: 'fixe', excerpt: 'Téléphonie et FTTH.', content: 'Fibre jusqu’au domicile, téléphonie fixe, vérification éligibilité par adresse.' },
  { id: 4, title: 'Fibre : vérifier éligibilité', cat: 'fibre', excerpt: 'Test d’adresse avant souscription.', content: 'POST /api/v1/eligibility/check/ avec product_id + address/phone → statut SIMULATED ou VERIFIED.' },
  { id: 5, title: 'Transport opérateur', cat: 'transport', excerpt: 'Backbone national, IP/MPLS.', content: 'Solutions wholesale pour opérateurs, ISP, grands comptes — devis via CONTACT.' },
  { id: 6, title: 'Data Center Tier III', cat: 'datacenter', excerpt: 'Cloud, colocation, backup.', content: 'Datacenter certifié, interconnexion, 1.7 Tbps international, 20 000 km fibre.' },
  { id: 7, title: 'Paiement en ligne', cat: 'payments', excerpt: 'Orange Money & MTN MoMo.', content: 'Choix Orange/MTN → backend calcule prix → PENDING → webhook → SUCCESS. Idempotence via reference.' },
  { id: 8, title: 'Souscription & devis', cat: 'subscriptions', excerpt: 'ONLINE / AGENCY / QUOTE.', content: 'ONLINE → paiement, AGENCY → agence, QUOTE/CONTACT → devis. CTA adapté au produit.' },
  { id: 9, title: 'Catalogue & comparateur', cat: 'catalog', excerpt: 'Tous les produits, tri & filtres.', content: 'Catalogue paginé, recherche globale, comparateur 3 produits (même service).' },
  { id: 10, title: 'Support technique', cat: 'technical', excerpt: 'Pannes, assistance.', content: 'Tickets : OPEN→IN_PROGRESS→RESOLVED. Réponse via thread, notification.' },
];

export default function AssistancePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [q, setQ] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCat, setTicketCat] = useState('general');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => FAQS.filter((f) => {
    const matchCat = !selectedCat || f.cat === selectedCat;
    const matchQ = !q || f.q.toLowerCase().includes(q.toLowerCase()) || f.a.toLowerCase().includes(q.toLowerCase());
    return matchCat && matchQ;
  }), [q, selectedCat]);

  const filteredArticles = useMemo(() => ARTICLES.filter((a) => {
    const matchCat = !selectedCat || a.cat === selectedCat;
    const matchQ = !q || a.title.toLowerCase().includes(q.toLowerCase()) || a.excerpt.toLowerCase().includes(q.toLowerCase()) || a.content.toLowerCase().includes(q.toLowerCase());
    return matchCat && matchQ;
  }), [q, selectedCat]);

  async function handleTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMsg.trim()) { setTicketError('Sujet et message requis.'); return; }
    if (!isAuthenticated) { setTicketError('Connectez-vous pour créer un ticket.'); return; }
    setTicketLoading(true); setTicketError(null); setTicketSuccess(null);
    try {
      const ticket = await ticketsApi.create({ subject: ticketSubject.trim(), category: ticketCat, priority: 'MEDIUM' });
      // Crée premier message si backend ne le fait pas
      if (ticketMsg.trim()) {
        try { await ticketsApi.reply(ticket.id, ticketMsg.trim()); } catch { void 0; }
      }
      setTicketSuccess(`Ticket #${ticket.id} créé avec succès.`);
      setTicketSubject(''); setTicketMsg('');
    } catch (err: any) {
      setTicketError(err?.response?.data?.detail || 'Erreur création ticket.');
    } finally { setTicketLoading(false); }
  }

  return (
    <div>
      <section className="border-b border-neutral-200 bg-gradient-to-br from-primary-900 via-primary to-primary-700 text-white dark:border-neutral-800">
        <div className="container-app py-14">
          <Breadcrumbs items={[{ label: t('nav.home'), to: '/' }, { label: t('nav.assistance') }]} />
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Assistance — Help Center</h1>
          <p className="mt-2 text-white/80">Comment pouvons-nous vous aider ?</p>
          <div className="mt-6 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher (compte, fibre, paiement, ticket...)"
                className="w-full rounded-xl border-0 py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-white/40"
                aria-label="Recherche Help Center"
              />
            </div>
            {(q || selectedCat) && (
              <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
                <span>{filteredFaqs.length} FAQ · {filteredArticles.length} articles</span>
                {(q || selectedCat) && <button onClick={() => { setQ(''); setSelectedCat(null); }} className="rounded-full bg-white/20 px-2 py-0.5 hover:bg-white/30">Réinitialiser</button>}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container-app py-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Catégories</h2>
          {selectedCat && <button onClick={() => setSelectedCat(null)} className="text-sm font-medium text-primary hover:underline">Voir tout</button>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => {
            const active = selectedCat === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setSelectedCat(active ? null : c.key)}
                className={`flex flex-col items-center p-5 text-center rounded-xl border-2 transition ${active ? 'border-primary bg-primary-50 dark:bg-primary-900/20 shadow-sm' : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 hover:border-primary-300 hover:shadow-sm'}`}
                aria-pressed={active}
              >
                <c.icon className={`h-6 w-6 ${active ? 'text-primary' : 'text-primary'}`} />
                <span className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">{t(`assistance.cat.${c.key}`)}</span>
              </button>
            );
          })}
        </div>
        {selectedCat && <p className="mt-3 text-sm text-neutral-500">Filtré sur : <span className="font-medium text-primary">{t(`assistance.cat.${selectedCat}`)}</span></p>}
      </section>

      <section className="container-app py-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Articles</h2>
        {filteredArticles.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Aucun article {q ? `pour "${q}"` : selectedCat ? 'dans cette catégorie' : ''}.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredArticles.map((a) => (
              <Card key={a.id} className="p-5 hover:border-primary-300 transition">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary-900/30">{t(`assistance.cat.${a.cat}`)}</span>
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{a.title}</h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{a.excerpt}</p>
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{a.content}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="container-app py-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">FAQ</h2>
        <div className="mt-4 space-y-3">
          {filteredFaqs.map((f) => (
            <details key={f.q} className="group rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-neutral-900 dark:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
                <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 shrink-0 text-primary" /> {f.q}</span>
                <span className="text-xs text-neutral-400 group-open:hidden">+</span><span className="hidden text-xs text-neutral-400 group-open:inline">−</span>
              </summary>
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">{f.a}</p>
              <p className="mt-2 text-xs text-neutral-400">Catégorie: {t(`assistance.cat.${f.cat}`)}</p>
            </details>
          ))}
          {filteredFaqs.length === 0 && <p className="text-sm text-neutral-500">Aucune FAQ {q ? `pour "${q}"` : ''}.</p>}
        </div>

        <Card className="mt-8 flex flex-col items-center gap-4 bg-primary-50 p-6 text-center dark:bg-primary-950/30">
          <Bot className="h-10 w-10 text-primary" />
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Assistant intelligent</h3>
          <p className="max-w-xl text-sm text-neutral-600 dark:text-neutral-400">Posez votre question à l’assistant OnePortal AI — FAQ → Recherche → Assistant → Ticket : un parcours continu.</p>
          <Link to="/assistant">
            <Button>Parler à l’assistant</Button>
          </Link>
        </Card>
      </section>

      <section className="container-app py-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /> Créer un ticket</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">SupportTicket réel — POST /api/v1/tickets/ (IsAuthenticated).</p>
          {!isAuthenticated ? (
            <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Connectez-vous pour créer un ticket. <Link to="/admin/login" className="font-medium underline">Connexion</Link>
            </div>
          ) : (
            <form onSubmit={handleTicket} className="mt-4 grid gap-3">
              <Input label="Sujet" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="Ex: Problème de paiement Orange Money" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Catégorie</label>
                  <select value={ticketCat} onChange={(e) => setTicketCat(e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">
                    <option value="general">Général</option><option value="billing">Facturation</option><option value="technical">Technique</option><option value="account">Compte</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" isLoading={ticketLoading} className="w-full gap-1"><Send className="h-4 w-4" /> Envoyer</Button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Message</label>
                <textarea value={ticketMsg} onChange={(e) => setTicketMsg(e.target.value)} rows={3} placeholder="Décrivez votre demande..." className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
              </div>
              {ticketError && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{ticketError}</p>}
              {ticketSuccess && <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{ticketSuccess} — Voir dans <Link to="/mon-compte/tickets" className="underline">Mes tickets</Link></p>}
            </form>
          )}
        </Card>
      </section>

      <section className="container-app pb-10">
        <div className="mt-2 rounded-2xl bg-neutral-900 p-8 text-center text-white dark:bg-neutral-800">
          <h3 className="text-xl font-bold">Vous ne trouvez pas votre réponse ?</h3>
          <p className="mt-2 text-sm text-white/70">Contactez notre assistance ou créez un ticket (connecté).</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/contact">
              <Button variant="secondary">Contacter l’assistance <MessageCircle className="h-4 w-4" /></Button>
            </Link>
            <a href="tel:+23722234000" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10">+237 222 23 40 00</a>
            <a href="mailto:support@camtel.cm" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10">support@camtel.cm</a>
          </div>
        </div>
      </section>
    </div>
  );
}

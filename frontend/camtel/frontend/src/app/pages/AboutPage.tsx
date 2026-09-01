import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Award, Network, ShieldCheck, Globe, MapPin, Phone, ExternalLink, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/components/Card';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { agencies } from '@/shared/config/agencies';

/* Données institutionnelles — source officielle camtel.cm (last_verified_at) */
const KEY_FIGURES = [
  { label: 'Fondation', value: '1998', icon: Calendar, sub: 'Ans d’expérience — 26+' },
  { label: 'Employés', value: '3 500+', icon: Users, sub: 'Collaborateurs' },
  { label: 'Clients', value: '5M+', icon: Globe, sub: 'Clients annoncés' },
  { label: 'Régions', value: '10', icon: MapPin, sub: 'Régions servies' },
  { label: 'Fibre', value: '20 000+ km', icon: Network, sub: 'Réseau fibre optique' },
  { label: 'Câbles sous-marins', value: '4', icon: ShieldCheck, sub: 'Capacité 1,7 Tbps' },
] as const;

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div>
      <section className="border-b border-neutral-200 bg-gradient-to-br from-primary-900 via-primary to-primary-700 text-white dark:border-neutral-800">
        <div className="container-app py-14 lg:py-20">
          <Breadcrumbs items={[{ label: t('nav.home'), to: '/' }, { label: t('nav.about') }]} />
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">À propos de CAMTEL</h1>
          <p className="mt-3 max-w-2xl text-white/80">
            Opérateur historique des télécommunications du Cameroun, CAMTEL déploie des infrastructures nationales et internationales au service des particuliers, entreprises et administrations depuis 1998.
          </p>
          <p className="mt-2 text-xs text-white/60">Source: camtel.cm — vérifié le 2026-05-15</p>
        </div>
      </section>

      <section className="container-app py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Présentation</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Cameroon Telecommunications (CAMTEL) est l’opérateur national de télécommunications. Elle assure la connectivité fixe, mobile (marque Blue), transport et hébergement Data Center pour l’ensemble du territoire.
            </p>
            <h3 className="mt-6 font-semibold text-neutral-900 dark:text-neutral-100">Mission & Vision</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Offrir une connectivité fiable, accessible et innovante, tout en accompagnant la transformation numérique du Cameroun et de la sous-région.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary dark:bg-primary-900/30 dark:text-primary-200">
                <Award className="h-3.5 w-3.5" /> ISO 9001:2015
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" /> Datacenter Tier III
              </span>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
              <Building2 className="h-5 w-5 text-primary" /> Siège & contact
            </h3>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">Yaoundé, Cameroun</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <Phone className="h-4 w-4" /> Service client CAMTEL
            </p>
            <Link to="/contact" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline dark:text-primary-300">
              Nous contacter <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
            <a href="https://camtel.cm/about" target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500 hover:text-primary">
              camtel.cm/about <ExternalLink className="h-3 w-3" />
            </a>
          </Card>
        </div>
      </section>

      <section className="bg-neutral-50 py-12 dark:bg-neutral-900">
        <div className="container-app">
          <h2 className="text-center text-2xl font-bold text-neutral-900 dark:text-neutral-100">Chiffres clés</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-neutral-500 dark:text-neutral-400">
            Données publiées par CAMTEL — capacité internationale et infrastructure last_verified 2026-05-15
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {KEY_FIGURES.map((k) => (
              <Card key={k.label} className="p-5 text-center">
                <k.icon className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-2 text-xl font-bold text-neutral-900 dark:text-neutral-100">{k.value}</p>
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{k.label}</p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{k.sub}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container-app py-12">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Infrastructure & présence nationale</h2>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Backbone fibre national, interconnexions sous-marines (4 câbles), réseau IP/MPLS et Data Center pour hébergement, cloud et colocation — couverture des 10 régions.
        </p>
        <h3 id="agences" className="mt-8 scroll-mt-20 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Nos agences</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Retrouvez nos agences — recherche par ville, région ou nom. Données issues du locator officiel (102 agences) — structure locale, pas d’externalisation massive.
        </p>
        <AgencyList />
      </section>
    </div>
  );
}

function AgencyList() {
  const { t } = useTranslation();
  // filtre client simple
  const [q, setQ] = useState('');
  const filtered = agencies.filter((a) => !q || `${a.city} ${a.region} ${a.name}`.toLowerCase().includes(q.toLowerCase())).slice(0, 20);
  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('about.searchAgency') ?? 'Rechercher une agence (ville, région)...'}
          className="w-full max-w-md rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => (
          <Card key={a.id} className="p-4">
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{a.name}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{a.city} — {a.region}</p>
            {a.address && <p className="mt-1 text-xs text-neutral-500">{a.address}</p>}
            {a.phone && <p className="mt-1 flex items-center gap-1 text-xs text-neutral-600"><Phone className="h-3 w-3" /> {a.phone}</p>}
            {a.city && (
              <a href={`https://www.google.com/maps/search/${encodeURIComponent(a.name + ' ' + a.city)}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <MapPin className="h-3 w-3" /> Itinéraire
              </a>
            )}
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <p className="mt-4 text-sm text-neutral-500">Aucune agence trouvée.</p>}
      <p className="mt-4 text-xs text-neutral-400">Source: camtel.cm/agencies — 102 agences listées sur le site officiel. Échantillon local, mise à jour 2026-05.</p>
    </div>
  );
}



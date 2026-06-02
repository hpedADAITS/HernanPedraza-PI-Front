import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { User, Settings as SettingsIcon } from 'lucide-react';
import { SettingsGrid, SettingsOptionCard, SettingsPageShell, SettingsSearch } from '@/components/settings/SettingsUI';
import { t } from '@/i18n';
import type { NavigateToView, View } from '@/types';

interface Props {
  mode: 'attendee' | 'dj';
  onNavigate: NavigateToView;
}

const SETTINGS_SECTIONS = [
  {
    label: 'Account Settings',
    routeSuffix: 'account-settings' as const,
    icon: User,
  },
  {
    label: 'App Settings',
    routeSuffix: 'app-settings' as const,
    icon: SettingsIcon,
  },
];

type SettingsRouteSuffix = (typeof SETTINGS_SECTIONS)[number]['routeSuffix'];

function getSettingsView(mode: Props['mode'], suffix: SettingsRouteSuffix): View {
  return `${mode}-${suffix}`;
}

export function SettingsHome({ mode, onNavigate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const viewPrefix = mode === 'dj' ? 'dj' : 'attendee';
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredSections = normalizedSearchQuery
    ? SETTINGS_SECTIONS.filter((section) =>
        t(section.label).toLowerCase().includes(normalizedSearchQuery),
      )
    : SETTINGS_SECTIONS;

  return (
    <Layout theme="blue" className="p-6 md:p-12 items-center" showNav={true}>
      <SettingsPageShell
        title={t('Settings')}
        onBack={() => onNavigate(`${viewPrefix}-dashboard`)}
        backLabel={t('Cancel')}
      >
        <SettingsSearch value={searchQuery} onChange={setSearchQuery} />

        <SettingsGrid>
          {filteredSections.map((section) => (
            <SettingsOptionCard
              key={section.label}
              label={t(section.label)}
              icon={section.icon}
              onClick={() => onNavigate(getSettingsView(mode, section.routeSuffix))}
            />
          ))}
        </SettingsGrid>

        {filteredSections.length === 0 && (
          <p className="mt-8 text-center text-base font-medium text-white">
            {t('No settings match your search.')}
          </p>
        )}
      </SettingsPageShell>
    </Layout>
  );
}

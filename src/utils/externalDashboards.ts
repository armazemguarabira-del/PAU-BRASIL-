export interface ExternalDashboardConfig {
  id: string;
  name: string;
  url: string;
  badge?: string;
  description: string;
}

export const EXTERNAL_DASHBOARDS: Record<string, ExternalDashboardConfig> = {
  'retorno-de-rota': {
    id: 'retorno-de-rota',
    name: 'Retorno de Rota',
    url: 'https://nhpa-cyber.github.io/rota/',
    badge: 'Retorno de Rota',
    description: 'Acesso direto ao aplicativo oficial de Retorno de Rota.'
  },
  'retorno-rota': {
    id: 'retorno-rota',
    name: 'Retorno de Rota',
    url: 'https://nhpa-cyber.github.io/rota/',
    badge: 'Retorno de Rota',
    description: 'Acesso direto ao aplicativo oficial de Retorno de Rota.'
  },
  'trocas-reposicoes': {
    id: 'trocas-reposicoes',
    name: 'Trocas e Reposições',
    url: 'https://djeanderson1105-code.github.io/ARMAZ-M-/',
    badge: 'Trocas & Reposições',
    description: 'Acesso direto ao portal oficial de Trocas e Reposições de Armazém.'
  },
  'blitz-de-puxada': {
    id: 'blitz-de-puxada',
    name: 'Blitz de Puxada',
    url: 'https://sofrimento001-sudo.github.io/Blitz/',
    badge: 'Blitz & Transferência',
    description: 'Acesso direto à ferramenta oficial da Blitz de Puxada.'
  },
  'blitz-puxada': {
    id: 'blitz-puxada',
    name: 'Blitz de Puxada',
    url: 'https://sofrimento001-sudo.github.io/Blitz/',
    badge: 'Blitz & Transferência',
    description: 'Acesso direto à ferramenta oficial da Blitz de Puxada.'
  }
};

export function isExternalDashboard(panelId: string): boolean {
  return panelId in EXTERNAL_DASHBOARDS;
}

export function openExternalDashboard(panelId: string): boolean {
  const item = EXTERNAL_DASHBOARDS[panelId];
  if (item && typeof window !== 'undefined') {
    const win = window.open(item.url, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = item.url;
    }
    return true;
  }
  return false;
}

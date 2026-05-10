import type { Settings } from '../types';

export type SaleChannel = 'direct' | 'ecommerce' | 'end_customer';

export const SALE_CHANNELS: Array<{ id: SaleChannel; label: string; description: string }> = [
  {
    id: 'direct',
    label: 'Venda direta',
    description: 'Fluxo comercial mais enxuto para negociações rápidas e relacionamento direto.',
  },
  {
    id: 'ecommerce',
    label: 'E-commerce',
    description: 'Canal com mais atrito operacional, taxas e necessidade de margem mais protegida.',
  },
  {
    id: 'end_customer',
    label: 'Usuário final',
    description: 'Preço de varejo para operação consultiva com margem mais alta e atendimento completo.',
  },
];

const defaultMargins: Pick<Settings, 'direct_margin_percent' | 'ecommerce_margin_percent' | 'end_customer_margin_percent'> = {
  direct_margin_percent: 20,
  ecommerce_margin_percent: 35,
  end_customer_margin_percent: 50,
};

export function getSaleChannels(settings?: Partial<Settings>) {
  const margins = {
    ...defaultMargins,
    ...(settings || {}),
  };

  return SALE_CHANNELS.map((channel) => ({
    ...channel,
    marginPercent:
      channel.id === 'direct'
        ? margins.direct_margin_percent
        : channel.id === 'ecommerce'
          ? margins.ecommerce_margin_percent
          : margins.end_customer_margin_percent,
  }));
}

export function getSaleChannel(channel: SaleChannel, settings?: Partial<Settings>) {
  return getSaleChannels(settings).find((item) => item.id === channel) || getSaleChannels(settings)[0];
}
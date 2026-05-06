export type SaleChannel = 'direct' | 'ecommerce' | 'end_customer';

export const SALE_CHANNELS: Array<{ id: SaleChannel; label: string; description: string; marginPercent: number }> = [
  {
    id: 'direct',
    label: 'Venda direta',
    description: 'Fluxo comercial mais enxuto para negociações rápidas e relacionamento direto.',
    marginPercent: 20,
  },
  {
    id: 'ecommerce',
    label: 'E-commerce',
    description: 'Canal com mais atrito operacional, taxas e necessidade de margem mais protegida.',
    marginPercent: 35,
  },
  {
    id: 'end_customer',
    label: 'Usuário final',
    description: 'Preço de varejo para operação consultiva com margem mais alta e atendimento completo.',
    marginPercent: 50,
  },
];

export function getSaleChannel(channel: SaleChannel) {
  return SALE_CHANNELS.find((item) => item.id === channel) || SALE_CHANNELS[0];
}
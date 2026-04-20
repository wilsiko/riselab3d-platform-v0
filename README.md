# RiseLab3D Platform

Plataforma SaaS para gestão de impressão 3D com cálculo de custos, geração de SKUs e criação de orçamentos profissionais.

## 🎯 Características

✓ **Cálculo inteligente de custos** - Material, energia e amortização  
✓ **Geração automática de SKUs** - Formato: Nome_Cor_Variacao  
✓ **Orçamentos profissionais** - Export PDF com identidade visual  
✓ **Multi-tenant pronto** - Isolamento lógico por tenant_id  
✓ **Validação robusta** - Backend + Frontend  
✓ **Rate limiting** - Proteção contra abuso de API  
✓ **Paginação** - Listas otimizadas para crescimento  
✓ **UX melhorada** - Loading states, alerts, feedback visual  

## 🏗️ Arquitetura

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Banco de dados**: PostgreSQL
- **ORM**: Prisma com índices otimizados
- **Multi-tenant**: Isolamento lógico por `tenant_id`

### Stack Moderno & Escalável
```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  React App  │────────▶│ Express Backend  │────────▶│   PostgreSQL    │
│  (Vite)     │         │ (TypeScript)     │         │   (Prisma)      │
└─────────────┘         └──────────────────┘         └─────────────────┘
   TailwindCSS          Rate Limiting
   Components           Validação
                        Índices
```

## 🚀 Rodando Localmente

### Usando Docker (Recomendado)
```bash
docker-compose up --build
# Frontend: http://localhost:5173
# Backend: http://localhost:4000
```

### Usando npm

#### Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
# Backend rodando em http://localhost:4000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend rodando em http://localhost:5173
```

## 📋 Endpoints Principais

```
GET    /api/dashboard           # Resumo geral (produtos, orçamentos, etc)
GET    /api/health              # Health check

CRUD   /api/printers            # Gerenciamento de impressoras
CRUD   /api/filaments           # Gerenciamento de filamentos
GET    /api/settings            # Configurações globais (custo kWh)
PUT    /api/settings            # Atualizar configurações

POST   /api/products            # Criar SKU com cálculo automático
GET    /api/products            # Listar produtos

POST   /api/quotes              # Criar orçamento
GET    /api/quotes              # Listar orçamentos
GET    /api/quotes/:id/pdf      # Exportar PDF profissional
```

## 🔒 Segurança

- **Rate Limiting**: 100 requisições/minuto por IP + tenant
- **Validação**: Backend + Frontend com mensagens específicas
- **Índices DB**: Queries otimizadas para performance
- **Tipagem Strict**: TypeScript em modo strict

## 📦 Seed Inicial

O backend inclui dados fake para testes:
- 1 tenant (`tenant_1`)
- 1 usuário demo (admin@riselab3d.com)
- 1 impressora (Ender 3 Pro)
- 1 filamento (Prusa PLA)
- 1 configuração global (custo kWh)
- 1 produto exemplo

Execute com:
```bash
cd backend
npm run seed
```

## 💡 Exemplo de Uso

### 1. Criar Impressora
```bash
curl -X POST http://localhost:4000/api/printers \
  -H "X-Tenant-Id: tenant_1" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Creality Ender 3",
    "consumo_watts": 120,
    "custo_aquisicao": 1200,
    "vida_util_horas": 2000
  }'
```

### 2. Criar Filamento
```bash
curl -X POST http://localhost:4000/api/filaments \
  -H "X-Tenant-Id: tenant_1" \
  -H "Content-Type: application/json" \
  -d '{
    "marca": "Prusament",
    "tipo": "PETG",
    "custo_por_kg": 150
  }'
```

### 3. Criar Produto (SKU)
```bash
curl -X POST http://localhost:4000/api/products \
  -H "X-Tenant-Id: tenant_1" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Peça de Encaixe",
    "cor": "Azul",
    "variacao": "Grande",
    "peso_gramas": 75,
    "tempo_impressao_horas": 2,
    "printerId": "printer_1",
    "filamentId": "filament_1"
  }'
```

**Response** (com cálculo automático):
```json
{
  "product": {
    "sku": "Peça_de_Encaixe_Azul_Grande",
    "custo_material": 11.25,
    "custo_energia": 0.252,
    "custo_amortizacao": 0.12,
    "custo_total": 11.62
  }
}
```

### 4. Criar Orçamento
```bash
curl -X POST http://localhost:4000/api/quotes \
  -H "X-Tenant-Id: tenant_1" \
  -H "Content-Type: application/json" \
  -d '{
    "nome_cliente": "Acme Corp",
    "data": "2026-04-20",
    "items": [
      {"productId": "prod_1", "quantidade": 10, "preco_unitario": 15.00},
      {"productId": "prod_2", "quantidade": 5, "preco_unitario": 22.50}
    ]
  }'
```

## 🎨 UX/UI

Design inspirado em SaaS premium (Stripe, Notion):
- **Sidebar fixo** com navegação clara
- **Botões bem destacados** (CTA em slate-900)
- **Espaçamento consistente** com TailwindCSS
- **Responsivo** em desktop, tablet, mobile
- **Loading states** durante requisições
- **Alerts** para erros e sucessos
- **Paginação** em listas grandes

## 📊 Melhorias Implementadas

Veja [IMPROVEMENTS.md](./IMPROVEMENTS.md) para detalhes completos sobre:
- ✓ Validação robusta
- ✓ Rate limiting
- ✓ Índices no banco
- ✓ Loading states
- ✓ Paginação
- ✓ Error handling

## 🔮 Próximas Fases (Roadmap)

### Fase 2: Autenticação & Billing
- [ ] Autenticação real com JWT
- [ ] Integração com Stripe
- [ ] Planos de subscriçãoFase 3: Deploy Produção
- [ ] CI/CD com GitHub Actions
- [ ] Deploy em Railway/Render
- [ ] Banco MySQL managed
- [ ] Uptime monitoring

### Fase 4: Integrações
- [ ] API pública para parceiros
- [ ] Integração com OctoPrint
- [ ] Sincronização com e-commerce
- [ ] Webhook para eventos

### Fase 5: Features Avançadas
- [ ] Dashboard com gráficos
- [ ] Relatórios de eficiência
- [ ] White-label customization
- [ ] Mobile app companion

## 📚 Documentação

- [Arquitetura](./docs/ARCHITECTURE.md) - Diagrama e decisões
- [API Reference](./docs/API.md) - Endpoints detalhados
- [Setup Local](./docs/SETUP.md) - Guia passo-a-passo
- [Deploy](./docs/DEPLOY.md) - Produção em 5 minutos

## 🧪 Testes

```bash
# Backend
cd backend
npm run test

# Frontend
cd frontend
npm run test
```

## 📝 Licença

MIT - Livre para usar e modificar

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/melhoria`)
3. Commit suas mudanças (`git commit -m 'Adiciona feature'`)
4. Push (`git push origin feature/melhoria`)
5. Abra um Pull Request

## 📞 Suporte

- GitHub Issues: [Report bug](https://github.com/riselab/3d-platform/issues)
- Email: support@riselab3d.com
- Docs: [riselab3d.com/docs](https://riselab3d.com/docs)

---

**RiseLab3D** - Transformando a indústria de impressão 3D com SaaS inteligente. 🚀


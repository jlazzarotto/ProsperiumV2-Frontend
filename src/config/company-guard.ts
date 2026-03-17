/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║              COMPANY GUARD — REGRA ARQUITETURAL DE ACESSO               ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                          ║
 * ║  A origem do banco de dados determina a exigência de company_id:         ║
 * ║                                                                          ║
 * ║  ┌─────────────────┬─────────────────────────────────────────────────┐  ║
 * ║  │  DB CONTROL     │ Dados exclusivos de ROLE_ROOT.                  │  ║
 * ║  │  (Company,      │ Não exige company_id nem database_key.          │  ║
 * ║  │   Identity)     │ Gerencia a estrutura SaaS do sistema.           │  ║
 * ║  ├─────────────────┼─────────────────────────────────────────────────┤  ║
 * ║  │  DB TENANT      │ Dados operacionais do tenant.                   │  ║
 * ║  │  (Cadastro,     │ Exige company_id + database_key.                │  ║
 * ║  │   Financeiro,   │ ROLE_ROOT deve selecionar uma company antes de  │  ║
 * ║  │   Tesouraria,   │ acessar. Demais roles seguem a política padrão  │  ║
 * ║  │   Cobranca,     │ de permissões definida no projeto.              │  ║
 * ║  │   Bpo,          │                                                 │  ║
 * ║  │   Contabil,     │                                                 │  ║
 * ║  │   Configuracao) │                                                 │  ║
 * ║  └─────────────────┴─────────────────────────────────────────────────┘  ║
 * ║                                                                          ║
 * ║  POLÍTICA: DENY BY DEFAULT                                               ║
 * ║  Todas as rotas requerem company selection para ROLE_ROOT, exceto as     ║
 * ║  rotas de DB CONTROL listadas em COMPANY_GUARD_EXCLUDED_PREFIXES.        ║
 * ║                                                                          ║
 * ║  Para adicionar uma rota à lista de exclusões, o módulo deve operar      ║
 * ║  EXCLUSIVAMENTE sobre dados do DB control. Se o módulo acessa qualquer   ║
 * ║  dado do DB tenant, ele NÃO deve ser excluído.                           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Rotas que operam sobre dados do DB CONTROL.
 * ROLE_ROOT pode acessar sem necessidade de selecionar uma company.
 *
 * Domains backend mapeados: Company, Identity (entity manager: control)
 * Suporte a prefixos: '/admin/foo' cobre '/admin/foo' e '/admin/foo/bar', etc.
 */
export const COMPANY_GUARD_EXCLUDED_PREFIXES: string[] = [
  "/",                              // Home / dashboard (dados agregados, sem tenant)
  "/login",                         // Autenticação (Identity — control DB)
  "/definir-senha",                 // Configuração de senha (Identity — control DB)

  // ── Admin: rotas que operam EXCLUSIVAMENTE sobre DB control ──────────────
  "/admin/coordenar-empresas",      // Company (control DB)
  "/admin/provisionar-tenant",      // Shared (control DB)
  "/admin/cadastro-usuarios",       // Identity (control DB)
  "/admin/logs",                    // Audit (control DB)

  // ── API endpoints DB_CONTROL/AGREGADO: Dashboard data (sem company_id) ─────
  "/api/v1/companies",              // List all companies + tenant instances
  "/api/v1/empresas",               // List all empresas agregadas
  "/api/v1/unidades",               // List all unidades agregadas
  "/api/v1/dashboard",              // Dashboard Executivo (agregado de todos tenants)

  // ── NÃO excluídas (protegidas — requerem company selection): ────────────
  //   /admin/coordenar-unidades   → requer company context (decisão de negócio)
  //   /admin/parametrizacao-sistema → Configuracao (tenant DB)
  //   /admin/permissoes           → tenant DB (operacional)
  //   /admin/importacao           → psp-service (dados tenant)
  //   /admin/importacao-dados     → psp-service (dados tenant)

  "/debug",                         // Utilitários de debug (sem dados de negócio)
]

/**
 * Rotas que operam sobre dados do DB TENANT.
 * Documentadas aqui para referência — qualquer rota NÃO listada acima
 * é automaticamente protegida pelo guard (deny by default).
 *
 * Domains backend mapeados: Cadastro, Financeiro, Tesouraria, Cobranca,
 *                            Bpo, Contabil, Configuracao (entity manager: tenant)
 *
 * /admin/coordenar-unidades      → requer company context (decisão de negócio)
 * /admin/parametrizacao-sistema  → Configuracao (tenant DB)
 * /admin/permissoes              → tenant DB (operacional)
 * /admin/importacao              → psp-service (tenant DB)
 * /admin/importacao-dados        → psp-service (tenant DB)
 * /cadastros      → Cadastro (pessoas, contas, operações, etc.)
 * /financeiro     → Financeiro + Cadastro
 * /financeiros    → Financeiro + Tesouraria
 * /relatorios     → Financeiro + Cadastro
 * /contabeis      → Contabil
 * /contabilidade  → Contabil
 * /asaas          → Integracao\Psp (tenant DB)
 * /configuracoes  → Configuracao
 * /movimento      → Tesouraria
 * /report         → Financeiro + Cadastro
 */

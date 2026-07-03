## Objetivo

Permitir que o profissional (ou dono) marque **indisponibilidade** no meio do dia — almoço, saída, compromisso — direto na agenda, com o mínimo de cliques. Não deve ter menu separado, formulário longo, nem precisar sair da tela.

## Fluxo proposto (UX)

Na visão **Dia**, cada slot já é clicável hoje (abre "Novo agendamento"). Vou trocar isso por uma interação mais rica:

1. **Clique simples em um slot vazio** → abre um mini popover no próprio slot com duas opções grandes:
   - "Novo agendamento" (fluxo atual)
   - "Bloquear horário" (novo)

2. **Arrastar verticalmente pelos slots** (mouse ou toque) → cria diretamente um bloqueio no intervalo arrastado, abrindo um mini-form inline com:
   - Profissional (pré-selecionado se o filtro já estiver em um; senão dropdown compacto)
   - Motivo curto opcional (ex: "Almoço", "Consulta", chips rápidos com sugestões)
   - Botões: Bloquear / Cancelar
   - Isso é o "menos burocrático possível" — dois cliques ou um arrasto resolve.

3. **Bloco renderizado na agenda**: aparece como uma faixa hachurada cinza-escuro no horário, com o nome do profissional e o motivo. Um "×" no canto remove com confirmação leve.

4. **Filtro "Profissional"** que já existe passa a filtrar os bloqueios também. Sem filtro, blocos de profissionais diferentes aparecem lado a lado (mesmo tratamento que agendamentos hoje).

5. **Impacto na disponibilidade**: os bloqueios contam como indisponíveis para novos agendamentos (o agente de WhatsApp e o dialog manual devem respeitar). Se um horário já bloqueado for tentado no dialog, o usuário recebe aviso mas pode forçar (não trava — evita atrito).

## Alterações técnicas

### Banco (uma migration nova)

Nova tabela `professional_time_off`:

- `id uuid pk`
- `business_id uuid` (FK businesses)
- `professional_id uuid` (FK professionals)
- `date date`
- `start_time time`
- `end_time time`
- `reason text nullable`
- `created_by uuid` (auth.uid do criador)
- `created_at timestamptz default now()`

RLS: leitura/escrita pelos membros do `business_id` (usar `is_business_member`), full para `service_role`. GRANTs padrão para `authenticated` e `service_role`. Índice em `(business_id, date, professional_id)`.

### Frontend

- `src/hooks/useTimeOff.ts` — CRUD com React Query, análogo a `useAppointments`.
- `src/components/agenda/TimeOffBlock.tsx` — render do bloco cinza hachurado com botão de remover.
- `src/components/agenda/SlotActionPopover.tsx` — popover que abre no clique do slot com "Novo agendamento" / "Bloquear horário".
- `src/components/agenda/QuickBlockForm.tsx` — mini-form inline (profissional + motivo + chips rápidos "Almoço", "Consulta", "Saída rápida").
- `src/pages/AgendaPage.tsx`:
  - Adicionar handlers de `mousedown` / `mousemove` / `mouseup` (e touch) sobre a coluna de slots para detectar arrasto e calcular `start_time`/`end_time` a partir do offset em Y.
  - Renderizar `TimeOffBlock` na mesma camada dos appointments, usando `useTimeOff(currentDate)`.
  - Passar bloqueios do dia para `AppointmentDialog` para exibir aviso "Este horário está bloqueado para X" quando aplicável.
- `supabase/functions/create-whatsapp-appointment/index.ts`: incluir checagem contra `professional_time_off` na validação de disponibilidade (retornar `professional_unavailable` com log explícito, no mesmo padrão dos outros ramos).

### Fora de escopo agora

- Bloqueios recorrentes (ex: "todo dia das 12h às 13h"). Anoto como TODO — se você quiser depois vira um `recurrence_rule` na mesma tabela.
- Bloqueio de dia inteiro / férias longas — hoje já dá pra fechar o dia em Configurações → Horário de Funcionamento; se quiser um atalho de "folga de N dias" a gente faz numa segunda etapa.

## Verificação

Depois de implementar: testo em Playwright criando um bloqueio por clique e outro por arrasto, confirmo que aparece na agenda, que o filtro por profissional oculta/mostra, e que o agente WhatsApp rejeita um agendamento dentro do intervalo bloqueado (via curl na edge function).

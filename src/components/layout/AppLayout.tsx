import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ChatPanelProvider } from "@/contexts/ChatPanelContext";
import { useAppointmentTriggers } from "@/hooks/useAppointmentTriggers";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { formatT, TranslationKey } from "@/lib/i18n";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

// Map PT strings used by existing pages to translation keys.
// This allows language switching without editing every page.
const TITLE_MAP: Record<string, TranslationKey> = {
  "Painel": "page_dashboard_title",
  "Agenda": "page_agenda_title",
  "Clientes": "page_clients_title",
  "Comanda": "page_comanda_title",
  "Serviços & Produtos": "page_services_title",
  "Relatórios": "page_reports_title",
  "Marketing & WhatsApp": "page_marketing_title",
  "Agentes": "page_agents_title",
  "Configurações": "page_settings_title",
};

const SUBTITLE_MAP: Record<string, TranslationKey> = {
  "Gerencie seus agendamentos": "page_agenda_subtitle",
  "Gerencie sua base de clientes": "page_clients_subtitle",
  "Registre vendas e serviços": "page_comanda_subtitle",
  "Gerencie seu catálogo": "page_services_subtitle",
  "Métricas e indicadores do seu negócio": "page_reports_subtitle",
  "Comunicação automatizada com clientes": "page_marketing_subtitle",
  "Sua equipe de IA": "page_agents_subtitle",
  "Gerencie seu negócio": "page_settings_subtitle",
};

// e.g. "12 clientes cadastrados"
const CLIENTS_COUNT_RE = /^(\d+)\s+clientes cadastrados$/;

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { t } = useAppSettings();

  const translatedTitle = TITLE_MAP[title] ? t(TITLE_MAP[title]) : title;

  let translatedSubtitle = subtitle;
  if (subtitle) {
    if (SUBTITLE_MAP[subtitle]) {
      translatedSubtitle = t(SUBTITLE_MAP[subtitle]);
    } else {
      const m = subtitle.match(CLIENTS_COUNT_RE);
      if (m) translatedSubtitle = formatT(t("page_clients_count"), { count: m[1] });
    }
  }

  return (
    <ChatPanelProvider>
      <AppLayoutInner
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        translatedTitle={translatedTitle}
        translatedSubtitle={translatedSubtitle}
      >
        {children}
      </AppLayoutInner>
    </ChatPanelProvider>
  );
}

function AppLayoutInner({
  children,
  sidebarCollapsed,
  setSidebarCollapsed,
  translatedTitle,
  translatedSubtitle,
}: {
  children: ReactNode;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (fn: (v: boolean) => boolean) => void;
  translatedTitle: string;
  translatedSubtitle?: string;
}) {
  useAppointmentTriggers();
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar collapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={translatedTitle}
          subtitle={translatedSubtitle}
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        />
        <main className="flex-1 px-[34px] py-6 overflow-auto pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
      <ChatPanel />
    </div>
  );
}

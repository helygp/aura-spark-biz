export type Language = "pt" | "en";

export const translations = {
  pt: {
    // Navigation groups
    nav_menu: "Menu",
    nav_system: "Sistema",
    nav_dashboard: "Painel",
    nav_agenda: "Agenda",
    nav_clients: "Clientes",
    nav_services: "Serviços",
    nav_reports: "Relatórios",
    nav_marketing: "Marketing",
    nav_agents: "Agentes IA",
    nav_settings: "Configurações",
    nav_more: "Mais",
    nav_more_title: "Mais opções",
    nav_aria: "Navegação principal",

    // Header
    header_search_placeholder: "Buscar clientes, agendamentos...",
    header_profile: "Perfil",
    header_my_profile: "Meu perfil",
    header_logout: "Sair",
    header_toggle_sidebar: "Alternar menu lateral",
    header_toggle_theme: "Alternar tema",
    header_toggle_language: "Alternar idioma",
    header_notifications: "Notificações",

    // Page titles / subtitles
    page_dashboard_title: "Painel",
    page_agenda_title: "Agenda",
    page_agenda_subtitle: "Gerencie seus agendamentos",
    page_clients_title: "Clientes",
    page_clients_subtitle: "Gerencie sua base de clientes",
    page_clients_count: "{count} clientes cadastrados",
    page_comanda_title: "Comanda",
    page_comanda_subtitle: "Registre vendas e serviços",
    page_services_title: "Serviços & Produtos",
    page_services_subtitle: "Gerencie seu catálogo",
    page_reports_title: "Relatórios",
    page_reports_subtitle: "Métricas e indicadores do seu negócio",
    page_marketing_title: "Marketing & WhatsApp",
    page_marketing_subtitle: "Comunicação automatizada com clientes",
    page_agents_title: "Agentes",
    page_agents_subtitle: "Sua equipe de IA",
    page_settings_title: "Configurações",
    page_settings_subtitle: "Gerencie seu negócio",

    // Defaults
    default_business_name: "Meu negócio",
    default_role: "Administrador",
  },
  en: {
    nav_menu: "Menu",
    nav_system: "System",
    nav_dashboard: "Dashboard",
    nav_agenda: "Schedule",
    nav_clients: "Clients",
    nav_services: "Services",
    nav_reports: "Reports",
    nav_marketing: "Marketing",
    nav_agents: "AI Agents",
    nav_settings: "Settings",
    nav_more: "More",
    nav_more_title: "More options",
    nav_aria: "Main navigation",

    header_search_placeholder: "Search clients, appointments...",
    header_profile: "Profile",
    header_my_profile: "My profile",
    header_logout: "Sign out",
    header_toggle_sidebar: "Toggle sidebar",
    header_toggle_theme: "Toggle theme",
    header_toggle_language: "Toggle language",
    header_notifications: "Notifications",

    page_dashboard_title: "Dashboard",
    page_agenda_title: "Schedule",
    page_agenda_subtitle: "Manage your appointments",
    page_clients_title: "Clients",
    page_clients_subtitle: "Manage your client base",
    page_clients_count: "{count} clients registered",
    page_comanda_title: "Checkout",
    page_comanda_subtitle: "Record sales and services",
    page_services_title: "Services & Products",
    page_services_subtitle: "Manage your catalog",
    page_reports_title: "Reports",
    page_reports_subtitle: "Business metrics and indicators",
    page_marketing_title: "Marketing & WhatsApp",
    page_marketing_subtitle: "Automated client communication",
    page_agents_title: "Agents",
    page_agents_subtitle: "Your AI team",
    page_settings_title: "Settings",
    page_settings_subtitle: "Manage your business",

    default_business_name: "My business",
    default_role: "Administrator",
  },
} as const;

export type TranslationKey = keyof typeof translations["pt"];

export function formatT(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
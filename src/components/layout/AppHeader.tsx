import { Bell, Search, User, LogOut, PanelLeft, Sun, Moon, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useNavigate } from "react-router-dom";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
}

export function AppHeader({ title, subtitle, onToggleSidebar }: AppHeaderProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme, language, toggleLanguage, t } = useAppSettings();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-[34px] py-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleSidebar}
            aria-label={t("header_toggle_sidebar")}
            className="hidden md:flex h-10 w-10 rounded-[12px] bg-card border border-border hover:bg-line2"
          >
            <PanelLeft className="w-4 h-4 text-tx2" strokeWidth={1.8} />
          </Button>
          <div>
            <h1 className="font-display text-[26px] leading-none text-tx1">{title}</h1>
            {subtitle && (
              <p className="text-[13px] text-tx3 mt-1.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx4" strokeWidth={1.8} />
            <Input
              placeholder={t("header_search_placeholder")}
              className="w-72 pl-9 h-10 bg-card border-border rounded-[12px] text-[13px] placeholder:text-tx4"
            />
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label={t("header_toggle_theme")}
            title={t("header_toggle_theme")}
            className="h-10 w-10 rounded-[12px] bg-card border border-border hover:bg-line2"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-tx2" strokeWidth={1.8} />
            ) : (
              <Moon className="w-4 h-4 text-tx2" strokeWidth={1.8} />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleLanguage}
            aria-label={t("header_toggle_language")}
            title={t("header_toggle_language")}
            className="h-10 px-2.5 gap-1.5 rounded-[12px] bg-card border border-border hover:bg-line2 w-auto"
          >
            <Languages className="w-4 h-4 text-tx2" strokeWidth={1.8} />
            <span className="text-[11px] font-semibold text-tx2 uppercase tracking-wide">
              {language}
            </span>
          </Button>

          <Button variant="ghost" size="icon-sm" aria-label={t("header_notifications")} className="relative h-10 w-10 rounded-[12px] bg-card border border-border hover:bg-line2">
            <Bell className="w-4 h-4 text-tx2" strokeWidth={1.8} />
            <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-[9px] bg-primary text-primary-foreground border-0">
              3
            </Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-10 pl-2 pr-3 flex items-center gap-2 rounded-[12px] bg-hero text-hero-foreground hover:opacity-90 transition-opacity">
                <div className="w-7 h-7 rounded-[8px] bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <span className="text-[13px] font-medium hidden sm:inline">
                  {profile?.full_name?.split(" ")[0] || t("header_profile")}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
                <User className="w-4 h-4 mr-2" />
                {t("header_my_profile")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                {t("header_logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

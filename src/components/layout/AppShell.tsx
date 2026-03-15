import { BarChart3, Home, LayoutDashboard, List, LogOut, MessageCircle, Package, PlusCircle, Search, Sprout, TrendingUp, User } from "lucide-react";
import { ReactNode, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../lib/useAuth";
import { BottomNav } from "../BottomNav";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarSeparator,
    SidebarTrigger,
} from "../ui/sidebar";

interface AppShellProps {
  children: ReactNode;
  /** Page title shown in the top bar */
  title: string;
  /** Optional subtitle shown under the title */
  subtitle?: string;
  /** Optional explicit user type override for routes that are clearly farmer/buyer scoped */
  userTypeOverride?: "farmer" | "buyer";
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AppShell({ children, title, subtitle, userTypeOverride }: AppShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userType: "farmer" | "buyer" =
    userTypeOverride || (user?.user_type === "buyer" ? "buyer" : "farmer");

  const navItems = useMemo(() => {
    if (userType === "farmer") {
      return [
        { path: "/farmer/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/farmer/my-listings", label: "My Listings", icon: Package },
        { path: "/farmer/list-produce", label: "List Produce", icon: PlusCircle },
        { path: "/messages", label: "Messages", icon: MessageCircle },
        { path: "/market-prices", label: "Market Prices", icon: TrendingUp },
        { path: "/profile", label: "Profile", icon: User },
      ] as NavItem[];
    }

    return [
      { path: "/buyer/dashboard", label: "Explore", icon: Home },
      { path: "/buyer/search", label: "Search", icon: Search },
      { path: "/market-prices", label: "Market Prices", icon: BarChart3 },
      { path: "/messages", label: "Messages", icon: MessageCircle },
      { path: "/profile", label: "Profile", icon: User },
    ] as NavItem[];
  }, [userType]);

  const initials = useMemo(() => {
    const name = user?.full_name || "User";
    return name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user?.full_name]);

  return (
    <SidebarProvider className="bg-background text-foreground">
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="border-border/60 bg-white/90 backdrop-blur"
      >
        <SidebarHeader className="border-b border-border/60 pb-3">
          <button
            type="button"
            className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={() => navigate(userType === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard")}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-700)] to-[var(--success)] text-white shadow-sm">
              <Sprout className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                From Village to Market
              </span>
              <span className="text-xs text-muted-foreground/80">
                Zimbabwe Agricultural Marketplace
              </span>
            </div>
          </button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => navigate(item.path)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter>
          <div className="flex items-center gap-3 rounded-md border border-border/70 bg-muted/60 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-700)] text-white text-sm font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {user?.full_name || "Farmer"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user?.district || "Zimbabwe"}
              </p>
            </div>
            <button
              type="button"
              title="Sign out"
              onClick={() => { logout(); navigate("/login"); }}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex min-h-svh flex-col bg-[var(--gray-50)]">
          {/* Top bar */}
          <header className="sticky top-0 z-20 border-b border-border/70 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 md:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="md:hidden">
                  <SidebarTrigger />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-semibold text-[var(--gray-900)] md:text-base">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="truncate text-[11px] text-muted-foreground md:text-xs">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-3 md:px-6 md:py-6">
            {children}
          </main>

          {/* Mobile bottom navigation */}
          <div className="mt-auto md:hidden">
            <BottomNav userType={userType} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

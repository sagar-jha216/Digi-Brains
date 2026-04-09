import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Settings, Home, Sparkles, LogOut, Package, Calendar, Brain, Clapperboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/dashboard",  label: "Dashboard", icon: Home },
  { path: "/generate",   label: "Generate",  icon: Sparkles },
  { path: "/videos",     label: "Videos",    icon: Clapperboard },
  { path: "/products",   label: "Products",  icon: Package },
  { path: "/schedule",   label: "Schedule",  icon: Calendar },
  { path: "/analytics",  label: "Analytics", icon: BarChart3 },
  { path: "/settings",   label: "Settings",  icon: Settings },
];

export default function Navigation() {
  const { pathname } = useLocation();
  const { logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-primary">AI Brand Brain</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button
                  variant={pathname === path ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{label}</span>
                </Button>
              </Link>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 gap-1.5 text-muted-foreground"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

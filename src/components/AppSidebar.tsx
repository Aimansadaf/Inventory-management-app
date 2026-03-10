import { LayoutDashboard, Package, PlusCircle, Barcode, ScanLine, Users, LogOut, Activity } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const adminItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Products", url: "/products", icon: Package },
  { title: "Add Product", url: "/products/new", icon: PlusCircle },
  { title: "Barcode Generator", url: "/barcode", icon: Barcode },
  { title: "Scan Product", url: "/scan", icon: ScanLine },
  { title: "Staff Activity", url: "/activity", icon: Activity },
  { title: "Manage Staff", url: "/staff", icon: Users },
];

const staffItems = [
  { title: "Products", url: "/products", icon: Package },
  { title: "Barcode Generator", url: "/barcode", icon: Barcode },
  { title: "Scan Product", url: "/scan", icon: ScanLine },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, role, signOut, isAdmin } = useAuth();
  const items = isAdmin ? adminItems : staffItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <div className="px-4 py-5">
          {!collapsed && (
            <h1 className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">
              <span className="text-sidebar-primary">▪</span> Inventory
            </h1>
          )}
          {collapsed && (
            <span className="text-sidebar-primary text-lg font-bold">▪</span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted text-xs uppercase tracking-wider">
            {!collapsed && "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto border-t border-sidebar-border p-3">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-sidebar-foreground truncate">
                    {profile?.email || "—"}
                  </p>
                </div>
                <Badge
                  variant={isAdmin ? "default" : "secondary"}
                  className="text-[10px] px-1.5 py-0 shrink-0"
                >
                  {role || "—"}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-xs"
                onClick={signOut}
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="w-full text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={signOut}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
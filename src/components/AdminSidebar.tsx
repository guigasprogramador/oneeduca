
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap, LayoutDashboard, Users, Award, List, ShieldCheck, CheckCircle, MessageSquare, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const AdminSidebar = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detecta se a tela é móvel
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      href: "/admin/dashboard",
    },
    {
      title: "Cursos",
      icon: <BookOpen size={20} />,
      href: "/admin/courses",
    },
    {
      title: "Aprovar Cursos",
      icon: <CheckCircle size={20} />,
      href: "/admin/course-approval",
    },
    {
      title: "Módulos",
      icon: <List size={20} />,
      href: "/admin/modules",
    },
    {
      title: "Aulas",
      icon: <GraduationCap size={20} />,
      href: "/admin/lessons",
    },
    {
      title: "Usuários",
      icon: <Users size={20} />,
      href: "/admin/users",
    },
    {
      title: "Definir Admin",
      icon: <ShieldCheck size={20} />,
      href: "/admin/make-admin",
    },
    {
      title: "Certificados",
      icon: <Award size={20} />,
      href: "/admin/certificates",
    },
    {
      title: "Chat",
      icon: <MessageSquare size={20} />,
      href: "/admin/forum",
    },
  ];
  
  // Componente de navegação que é reutilizado tanto na versão desktop quanto na móvel
  const NavLinks = () => (
    <div className="flex flex-col gap-2 p-4 w-full">
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
            location.pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </div>
  );

  return (
    <>
      {/* Versão Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background transition-all duration-200">
        <div className="py-4 px-4 border-b">
          <h2 className="text-lg font-semibold text-primary">Área Administrativa</h2>
        </div>
        <NavLinks />
      </aside>
      
      {/* Versão Mobile */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full shadow-lg bg-primary hover:bg-primary/90">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[250px] sm:w-[300px]">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2 pt-4 border-b pb-4">
                <h2 className="text-lg font-semibold text-primary">Menu Admin</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <NavLinks />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default AdminSidebar;

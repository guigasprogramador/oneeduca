
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap, LayoutDashboard, Award, Menu, X, UserCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

const Sidebar = () => {
  const location = useLocation();
  const { isProfessor } = useAuth();
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
      href: "/dashboard",
    },
    {
      title: "Catálogo de Cursos",
      icon: <BookOpen size={20} />,
      href: "/courses",
    },
    {
      title: "Meus Cursos",
      icon: <GraduationCap size={20} />,
      href: "/dashboard#my-courses",
    },
    {
      title: "Certificados",
      icon: <Award size={20} />,
      href: "/aluno/certificados",
    },
    ...(isProfessor() ? [{
      title: "Área do Professor",
      icon: <UserCheck size={20} />,
      href: "/professor/dashboard",
    }] : []),
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
            location.pathname === item.href || (item.href.includes('#') && location.pathname + location.hash === item.href) 
              ? "bg-accent text-accent-foreground font-semibold" 
              : "text-muted-foreground hover:text-foreground"
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
          <h2 className="text-lg font-semibold text-primary">Área do Aluno</h2>
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
                <h2 className="text-lg font-semibold text-primary">Menu</h2>
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

export default Sidebar;

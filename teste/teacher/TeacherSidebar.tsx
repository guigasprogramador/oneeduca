import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap, LayoutDashboard, List, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Menu, X } from "lucide-react";

export const TeacherSidebar = () => {
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
      href: "/teacher/dashboard",
    },
    {
      title: "Meus Cursos",
      icon: <BookOpen size={20} />,
      href: "/teacher/courses",
    },
    {
      title: "Criar Curso",
      icon: <GraduationCap size={20} />,
      href: "/teacher/courses/create",
    },
    {
      title: "Cursos Pendentes",
      icon: <Clock size={20} />,
      href: "/teacher/courses/pending",
    },
    {
      title: "Cursos Aprovados",
      icon: <CheckCircle size={20} />,
      href: "/teacher/courses/approved",
    },
    {
      title: "Fórum",
      icon: <MessageSquare size={20} />,
      href: "/teacher/forum",
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

  if (isMobile) {
    return (
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 left-4 z-40 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="OneEduca Logo" className="h-6 w-6" />
              <h2 className="text-lg font-semibold">OneEduca Professor</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <NavLinks />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex items-center justify-center p-4 border-b">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="OneEduca Logo" className="h-6 w-6" />
          <h2 className="text-lg font-semibold">OneEduca Professor</h2>
        </div>
      </div>
      <NavLinks />
    </div>
  );
};
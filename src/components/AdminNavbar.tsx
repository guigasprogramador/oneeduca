
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { User } from "@/types";

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm transition-colors duration-300">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="OneEduca Logo" className="h-8 w-8" />
          <span className="font-bold text-xl text-primary hidden sm:inline-block">OneEduca</span>
          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold ml-2">ADM</span>
        </Link>
        
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 px-2 md:px-3 rounded-full hover:bg-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(user as any)?.avatar || ""} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="ml-2 text-sm font-medium hidden md:inline-block">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/dashboard" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Painel Admin
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Área do Aluno
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500 flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;

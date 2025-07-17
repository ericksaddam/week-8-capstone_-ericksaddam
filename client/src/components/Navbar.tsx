import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, Users, Target, Settings } from "lucide-react";

import { Notifications } from "./Notifications";

const Navbar = ({ onAuthClick }: { onAuthClick: (mode: "login" | "register") => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const isLoggedIn = !!user;
  
  // Debug log
  useEffect(() => {
    if (user) {
      console.log('Current user in Navbar:', {
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 'admin',
        isBlocked: user.isBlocked
      });
    }
  }, [user]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);





  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Harambee Hub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isLoggedIn ? (
              <>
                <Link to="/" className="text-foreground hover:text-primary transition-colors">
                  Home
                </Link>
                <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/clubs" className="text-foreground hover:text-primary transition-colors">
                  My Clubs
                </Link>
                <Link to="/discover-clubs" className="text-foreground hover:text-primary transition-colors">
                  Discover Clubs
                </Link>
                <Link to="/tasks" className="text-foreground hover:text-primary transition-colors">
                  Tasks
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" className="text-foreground hover:text-primary transition-colors">
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <>
                <a href="#features" className="text-foreground hover:text-primary transition-colors">
                  Features
                </a>
                <a href="#about" className="text-foreground hover:text-primary transition-colors">
                  About
                </a>
              </>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Notifications />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatarUrl || ''} alt={user?.name} />
                        <AvatarFallback>{user?.name?.[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link to="/settings" style={{ textDecoration: 'none', color: 'inherit' }}>
  <DropdownMenuItem>
    <Settings className="mr-2 h-4 w-4" />
    <span>Settings</span>
  </DropdownMenuItem>
</Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => onAuthClick("login")}>
                  Login
                </Button>
                <Button variant="gradient" onClick={() => onAuthClick("register")}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden bg-white/95 backdrop-blur-lg absolute top-16 left-0 right-0 p-4 border-b border-border shadow-lg" id="mobile-menu">
          <div className="flex flex-col space-y-4">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="block py-2 text-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/clubs" className="block py-2 text-foreground hover:text-primary transition-colors">
                  My Clubs
                </Link>
                <Link to="/discover-clubs" className="block py-2 text-foreground hover:text-primary transition-colors">
                  Discover Clubs
                </Link>
                <Link to="/tasks" className="block py-2 text-foreground hover:text-primary transition-colors">
                  Tasks
                </Link>
                <div className="pt-4 border-t border-border">
                  <Button variant="ghost" className="w-full" onClick={logout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <a href="#features" className="block py-2 text-foreground hover:text-primary transition-colors">
                  Features
                </a>
                <a href="#about" className="block py-2 text-foreground hover:text-primary transition-colors">
                  About
                </a>
                <div className="pt-4 space-y-2">
                  <Button variant="ghost" className="w-full" onClick={() => onAuthClick("login")}>
                    Login
                  </Button>
                  <Button variant="gradient" className="w-full" onClick={() => onAuthClick("register")}>
                    Sign Up
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
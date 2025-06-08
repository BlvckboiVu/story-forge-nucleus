
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  PenTool,
  Settings,
  User,
  Book,
  LogOut,
  Zap,
  Coins
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: Home },
    { name: 'Editor', href: '/app/editor', icon: PenTool },
    { name: 'Bible Library', href: '/app/story-bible', icon: Book },
    { name: 'Sandbox', href: '/app/sandbox', icon: Zap },
    { name: 'Tokens', href: '/app/tokens', icon: Coins },
    { name: 'Profile', href: '/app/profile', icon: User },
    { name: 'Settings', href: '/app/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full sm:w-64">
        <SheetHeader className="text-left">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navigate your writing journey.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <nav className="flex flex-col space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-2 rounded-md p-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground ${
                  isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground'
                }`
              }
              onClick={onClose}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
        <Separator className="my-4" />
        {user && (
          <div className="mt-auto">
            <p className="text-sm text-muted-foreground mb-2">
              Logged in as {user.email}
            </p>
            <button
              className="w-full rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;

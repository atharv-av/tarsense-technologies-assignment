import { Home, Star, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarProps {
  onLogout: () => void;
}

const SidebarContent = ({ onLogout }: SidebarProps) => {
  const pathname = usePathname();
  const username = localStorage.getItem("username");

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold">AI</span>
          </div>
          <h1 className="font-semibold">AI Notes</h1>
        </div>
      </div>

      <nav className="flex-1 p-2">
        <div className="space-y-1">
          <Link href="/">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2",
                pathname === "/" &&
                  "bg-gray-200 text-purple-500 font-bold rounded-full"
              )}
            >
              <Home className="size-4" />
              Home
            </Button>
          </Link>
          <Link href="/favourites">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2",
                pathname === "/favourites" &&
                  "bg-gray-200 text-purple-500 font-bold rounded-full"
              )}
            >
              <Star className="size-4" />
              Favourites
            </Button>
          </Link>
        </div>
      </nav>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="size-8">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="bg-[#0a0a0a] rounded-full text-white">
              {username?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium truncate">{username}</p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onLogout}
        >
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export function Sidebar({ onLogout }: SidebarProps) {
  return (
    <>
      <div className="hidden md:flex">
        <div className="w-[240px] border-r bg-background">
          <SidebarContent onLogout={onLogout} />
        </div>
      </div>

      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[240px]">
            <SidebarContent onLogout={onLogout} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

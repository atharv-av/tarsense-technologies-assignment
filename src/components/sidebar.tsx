"use client"

import { Home, Star, LogOut } from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SidebarProps {
  onLogout: () => void
}

export function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname()
  
  return (
    <div className="flex flex-col h-screen w-[240px] border-r bg-background">
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
                pathname === "/" && "bg-primary/10 text-primary hover:bg-primary/20"
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
                pathname === "/favourites" && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              <Star className="size-4" />
              Favourites
            </Button>
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="size-8">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">User Name</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onLogout}>
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}

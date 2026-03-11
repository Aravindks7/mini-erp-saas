import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"

export default function Navbar() {
  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold">
        Searchbar
      </h1>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell size={18} />
        </Button>

        <div className="h-8 w-8 rounded-full bg-muted" />
      </div>
    </header>
  )
}
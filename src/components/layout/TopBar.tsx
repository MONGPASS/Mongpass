import { Search, Bell } from "lucide-react";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
          M
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">MongPass</span>
      </div>
      <div className="flex items-center gap-3 text-foreground">
        <button className="p-2 hover:bg-surfaceAlt rounded-full transition-colors">
          <Search size={22} className="text-gray-700" />
        </button>
        <button className="p-2 hover:bg-surfaceAlt rounded-full transition-colors relative">
          <Bell size={22} className="text-gray-700" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
        </button>
      </div>
    </header>
  );
}

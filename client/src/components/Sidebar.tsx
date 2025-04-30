import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Database, FileCode, BookOpen, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";

interface SidebarProps {
  currentModule: string;
  currentView: string;
  onModuleChange: (moduleName: string) => void;
  onViewChange: (view: "module" | "er-diagram" | "sql-generator" | "conventions") => void;
}

export function Sidebar({ currentModule, currentView, onModuleChange, onViewChange }: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { theme, setTheme } = useTheme();
  
  const modules = [
    { id: "auth", name: "Authentication & Authorization" },
    { id: "profile", name: "Profile Management" },
    { id: "wallet", name: "Wallet & Transactions" },
    { id: "player", name: "Player Data" },
    { id: "social", name: "Social Features" },
    { id: "security", name: "Security" },
    { id: "support", name: "Customer Support" },
    { id: "analytics", name: "Reporting & Analytics" },
    { id: "affiliate", name: "Affiliate Management" },
    { id: "bonus", name: "Bonus System" },
    { id: "loyalty", name: "Loyalty / VIP" }
  ];
  
  const filteredModules = modules.filter(module => 
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+/ to focus search
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        document.getElementById("searchInput")?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col fixed h-screen">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">DB Schema Visualizer</h1>
      </div>
      
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="searchInput"
            placeholder="Search tables..."
            className="pl-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <h2 className="text-xs uppercase font-semibold text-muted-foreground mb-2">Database Modules</h2>
        <ul className="space-y-1">
          {filteredModules.map((module) => (
            <li key={module.id}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left",
                  currentModule === module.id && currentView === "module" && "bg-primary/10 text-primary font-medium"
                )}
                onClick={() => onModuleChange(module.id)}
              >
                {module.name}
              </Button>
            </li>
          ))}
        </ul>
        
        <h2 className="text-xs uppercase font-semibold text-muted-foreground mt-6 mb-2">Tools</h2>
        <ul className="space-y-1">
          <li>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-left",
                currentView === "er-diagram" && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => onViewChange("er-diagram")}
            >
              <Database className="mr-2 h-4 w-4" />
              Interactive ER Diagram
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-left",
                currentView === "sql-generator" && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => onViewChange("sql-generator")}
            >
              <FileCode className="mr-2 h-4 w-4" />
              Generate SQL Script
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-left",
                currentView === "conventions" && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => onViewChange("conventions")}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Naming Conventions
            </Button>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Mode</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

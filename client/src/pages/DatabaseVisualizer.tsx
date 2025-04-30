import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import ModuleView from "@/pages/ModuleView";
import ERDiagram from "@/pages/ERDiagram";
import SqlGenerator from "@/pages/SqlGenerator";
import Conventions from "@/pages/Conventions";
import { NavBar } from "@/components/NavBar";

type View = "module" | "er-diagram" | "sql-generator" | "conventions";

export default function DatabaseVisualizer() {
  const [currentView, setCurrentView] = useState<View>("module");
  const [currentModule, setCurrentModule] = useState<string>("auth");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const handleModuleChange = (moduleName: string) => {
    setCurrentModule(moduleName);
    setSelectedTable(null);
    if (currentView !== "module") {
      setCurrentView("module");
    }
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    if (view !== "module") {
      setSelectedTable(null);
    }
  };

  const getViewTitle = (): string => {
    switch (currentView) {
      case "module":
        return getModuleTitle(currentModule);
      case "er-diagram":
        return "Interactive ER Diagram";
      case "sql-generator":
        return "SQL Script Generator";
      case "conventions":
        return "Naming Conventions";
      default:
        return "Database Schema Visualizer";
    }
  };

  const getModuleTitle = (moduleId: string): string => {
    switch (moduleId) {
      case "auth":
        return "Authentication & Authorization";
      case "profile":
        return "Profile Management";
      case "wallet":
        return "Wallet & Transactions";
      case "player":
        return "Player Data";
      case "social":
        return "Social Features";
      case "security":
        return "Security";
      case "support":
        return "Customer Support";
      case "analytics":
        return "Reporting & Analytics";
      case "affiliate":
        return "Affiliate Management";
      case "bonus":
        return "Bonus System";
      case "loyalty":
        return "Loyalty / VIP";
      default:
        return "Module";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentModule={currentModule}
        onModuleChange={handleModuleChange}
        onViewChange={handleViewChange}
        currentView={currentView}
      />
      <div className="flex-1 overflow-x-hidden overflow-y-auto ml-64">
        <NavBar title={getViewTitle()} />
        <div className="p-6">
          {currentView === "module" && (
            <ModuleView
              moduleId={currentModule}
              selectedTable={selectedTable}
              onSelectTable={setSelectedTable}
            />
          )}
          {currentView === "er-diagram" && <ERDiagram />}
          {currentView === "sql-generator" && <SqlGenerator />}
          {currentView === "conventions" && <Conventions />}
        </div>
      </div>
    </div>
  );
}

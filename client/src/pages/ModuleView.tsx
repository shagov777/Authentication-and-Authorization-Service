import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import SchemaTable from "@/components/SchemaTable";
import TableDetails from "@/components/TableDetails";
import SchemaFlow from "@/components/SchemaFlow";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DbModule, DbTable } from "@/lib/utils";

interface ModuleViewProps {
  moduleId: string;
  selectedTable: string | null;
  onSelectTable: (tableName: string | null) => void;
}

export default function ModuleView({ moduleId, selectedTable, onSelectTable }: ModuleViewProps) {
  const [diagramCollapsed, setDiagramCollapsed] = useState(false);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  
  const { data: moduleData, isLoading } = useQuery<DbModule>({
    queryKey: [`/api/modules/${moduleId}`],
  });

  const selectedTableData = moduleData?.tables.find(table => table.name === selectedTable) || null;

  // Reset selected table when module changes
  useEffect(() => {
    onSelectTable(null);
  }, [moduleId, onSelectTable]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <p className="text-muted-foreground">Module data not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center justify-between py-3">
          <CardTitle className="text-lg">{moduleData.name} Schema</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-primary-foreground hover:bg-primary/90 h-8 w-8 p-0"
            onClick={() => setDiagramCollapsed(!diagramCollapsed)}
          >
            {diagramCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </Button>
        </CardHeader>
        {!diagramCollapsed && (
          <CardContent className="p-5">
            <div className="border border-border rounded-md p-4 bg-secondary mb-4 overflow-auto diagram-container h-[400px]">
              {moduleData.tables.length > 0 ? (
                <SchemaFlow
                  tables={moduleData.tables}
                  selectedTable={selectedTable}
                  onSelectTable={onSelectTable}
                  moduleId={moduleId}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No tables in this module</p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center justify-between py-3">
          <CardTitle className="text-lg">Table Details</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-primary-foreground hover:bg-primary/90 h-8 w-8 p-0"
            onClick={() => setDetailsCollapsed(!detailsCollapsed)}
          >
            {detailsCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </Button>
        </CardHeader>
        {!detailsCollapsed && (
          <CardContent className="p-5">
            {selectedTableData ? (
              <TableDetails table={selectedTableData} />
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <div className="mb-3">
                  <svg 
                    className="h-12 w-12 mx-auto text-muted-foreground" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <p>Select a table from the diagram to view its details</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

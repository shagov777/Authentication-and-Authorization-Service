import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import SchemaFlow from "@/components/SchemaFlow";
import { DbSchema } from "@/lib/utils";

export default function ERDiagram() {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  
  const { data: schemaData, isLoading } = useQuery<DbSchema>({
    queryKey: ['/api/schema'],
  });

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleReset = () => {
    setZoomLevel(1);
  };

  const allTables = schemaData?.modules.flatMap(module => 
    module.tables.map(table => ({
      ...table,
      module: module.name
    }))
  ) || [];

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!schemaData) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <p className="text-muted-foreground">Schema data not available</p>
      </div>
    );
  }

  return (
    <Card className="h-[calc(100vh-130px)]">
      <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center justify-between py-3">
        <CardTitle className="text-lg">Interactive ER Diagram</CardTitle>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-foreground hover:bg-primary/90 h-8 w-8 p-0"
            onClick={handleZoomIn}
          >
            <ZoomIn size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-foreground hover:bg-primary/90 h-8 w-8 p-0"
            onClick={handleZoomOut}
          >
            <ZoomOut size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-foreground hover:bg-primary/90 h-8 w-8 p-0"
            onClick={handleReset}
          >
            <RotateCcw size={18} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-56px)]">
        <div className="h-full w-full" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
          <SchemaFlow
            tables={allTables}
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
            relationships={schemaData.relationships}
            fullDiagram
          />
        </div>
      </CardContent>
    </Card>
  );
}

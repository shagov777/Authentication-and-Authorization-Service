import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardCopy } from "lucide-react";
import { DbSchema, generateSQL } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function SqlGenerator() {
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [generatedSQL, setGeneratedSQL] = useState<string>("");
  const { toast } = useToast();
  
  const { data: schemaData, isLoading } = useQuery<DbSchema>({
    queryKey: ['/api/schema'],
  });

  const handleGenerateSQL = () => {
    if (!schemaData) return;
    
    let sql = "-- Generated SQL Script\n\n";
    
    if (selectedModule === "all") {
      // Generate SQL for all modules
      schemaData.modules.forEach(module => {
        sql += `-- ${module.name} Tables\n\n`;
        
        module.tables.forEach(table => {
          sql += generateSQL(table.name, table.columns, table.constraints) + "\n\n";
        });
        
        // Add indexes
        module.tables.forEach(table => {
          if (table.indexes && table.indexes.length > 0) {
            sql += `-- Indexes for ${table.name}\n`;
            table.indexes.forEach(index => {
              const uniqueStr = index.unique ? "UNIQUE " : "";
              sql += `CREATE ${uniqueStr}INDEX ${index.name} ON ${table.name}(${index.columns.join(", ")});\n`;
            });
            sql += "\n";
          }
        });
      });
    } else {
      // Generate SQL for specific module
      const module = schemaData.modules.find(m => m.name.toLowerCase().includes(selectedModule));
      
      if (module) {
        sql += `-- ${module.name} Tables\n\n`;
        
        module.tables.forEach(table => {
          sql += generateSQL(table.name, table.columns, table.constraints) + "\n\n";
        });
        
        // Add indexes
        module.tables.forEach(table => {
          if (table.indexes && table.indexes.length > 0) {
            sql += `-- Indexes for ${table.name}\n`;
            table.indexes.forEach(index => {
              const uniqueStr = index.unique ? "UNIQUE " : "";
              sql += `CREATE ${uniqueStr}INDEX ${index.name} ON ${table.name}(${index.columns.join(", ")});\n`;
            });
            sql += "\n";
          }
        });
      } else {
        sql += "-- No tables found for selected module";
      }
    }
    
    setGeneratedSQL(sql);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(generatedSQL)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "SQL script copied successfully",
        });
      })
      .catch(() => {
        toast({
          title: "Copy failed",
          description: "Could not copy SQL to clipboard",
          variant: "destructive",
        });
      });
  };

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
    <Card>
      <CardHeader className="bg-primary text-primary-foreground py-3">
        <CardTitle className="text-lg">SQL Script Generator</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-4">
            <h4 className="text-lg font-medium">Generate SQL for:</h4>
            <div className="w-64">
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="auth">Authentication & Authorization</SelectItem>
                  <SelectItem value="profile">Profile Management</SelectItem>
                  <SelectItem value="wallet">Wallet & Transactions</SelectItem>
                  <SelectItem value="player">Player Data</SelectItem>
                  <SelectItem value="social">Social Features</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="support">Customer Support</SelectItem>
                  <SelectItem value="analytics">Reporting & Analytics</SelectItem>
                  <SelectItem value="affiliate">Affiliate Management</SelectItem>
                  <SelectItem value="bonus">Bonus System</SelectItem>
                  <SelectItem value="loyalty">Loyalty / VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerateSQL}>Generate</Button>
          </div>
          
          <div className="border border-border rounded-md">
            <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center">
              <span className="font-medium">Generated SQL</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopySQL}
                disabled={!generatedSQL}
                className="h-8 flex items-center gap-1"
              >
                <ClipboardCopy size={14} />
                <span>Copy</span>
              </Button>
            </div>
            <pre className="bg-card p-4 text-sm text-foreground overflow-x-auto h-96 font-mono">
              {generatedSQL || "-- Select a module and click Generate to create SQL scripts"}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { DbTable } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Key, Link } from "lucide-react";

interface SchemaTableProps {
  table: DbTable;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function SchemaTable({ table, isSelected = false, onClick }: SchemaTableProps) {
  return (
    <Card 
      className={cn(
        "table-card w-64 hover:shadow-md transition-shadow duration-200 cursor-pointer border-border",
        isSelected && "border-primary border-2"
      )}
      onClick={onClick}
    >
      <div className="bg-primary text-primary-foreground p-2 border-b">
        <h4 className="font-semibold">{table.name}</h4>
      </div>
      <div className="p-3 space-y-1 text-sm">
        {table.columns.map((column) => (
          <div key={column.name} className="flex items-center justify-between">
            <div className={cn(
              "flex items-center",
              column.isPrimaryKey && "text-[hsl(var(--relationship-primary))] font-medium",
              column.isForeignKey && "text-[hsl(var(--relationship-foreign))] font-medium"
            )}>
              {column.isPrimaryKey && <Key className="h-3 w-3 mr-2" />}
              {column.isForeignKey && <Link className="h-3 w-3 mr-2" />}
              <span className="truncate max-w-[140px]">{column.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{column.type}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

import { DbTable } from "@/lib/utils";
import { Key, Link } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableDetailsProps {
  table: DbTable;
}

export default function TableDetails({ table }: TableDetailsProps) {
  return (
    <div>
      <h4 className="text-xl font-semibold mb-4">{table.name}</h4>
      
      <div className="mb-6">
        <h5 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Columns</h5>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Constraints</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {table.columns.map((column) => (
                <tr key={column.name}>
                  <td className={cn(
                    "px-6 py-4 whitespace-nowrap",
                    column.isPrimaryKey && "font-semibold text-[hsl(var(--relationship-primary))]",
                    column.isForeignKey && "font-medium text-[hsl(var(--relationship-foreign))]"
                  )}>
                    <div className="flex items-center">
                      {column.isPrimaryKey && <Key className="h-3 w-3 mr-2" />}
                      {column.isForeignKey && <Link className="h-3 w-3 mr-2" />}
                      {column.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{column.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {[
                      column.isPrimaryKey && "PRIMARY KEY",
                      column.isNotNull && "NOT NULL",
                      column.isUnique && "UNIQUE",
                      column.defaultValue && `DEFAULT ${column.defaultValue}`,
                      column.isForeignKey && column.references && `REFERENCES ${column.references.table}(${column.references.column})`
                    ].filter(Boolean).join(" ")}
                  </td>
                  <td className="px-6 py-4">{column.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {table.indexes && table.indexes.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Indexes</h5>
            <ul className="bg-muted p-4 rounded-md text-sm">
              {table.indexes.map((index, idx) => (
                <li key={idx} className="mb-1">
                  <code className="bg-background px-2 py-1 rounded text-[hsl(var(--relationship-primary))]">
                    CREATE {index.unique ? "UNIQUE " : ""}INDEX {index.name} ON {table.name}({index.columns.join(", ")})
                  </code>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div>
          <h5 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Relationships</h5>
          <ul className="bg-muted p-4 rounded-md text-sm">
            {table.columns.some(col => col.isForeignKey && col.references) ? (
              table.columns
                .filter(col => col.isForeignKey && col.references)
                .map((col, idx) => (
                  <li key={idx} className="mb-1">
                    <span>References <span className="font-medium">{col.references?.table}</span> through <span className="text-[hsl(var(--relationship-foreign))]">{col.name}</span></span>
                  </li>
                ))
            ) : (
              <li className="text-muted-foreground">No relationships defined</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

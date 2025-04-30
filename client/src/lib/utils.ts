import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSqlKeyword(word: string): string {
  return word.toUpperCase();
}

export function generateSQL(tableName: string, columns: DbColumn[], constraints: string[] = []): string {
  const formattedColumns = columns.map(column => {
    const constraints = [];
    
    if (column.isPrimaryKey) {
      constraints.push("PRIMARY KEY");
    }
    
    if (column.isNotNull) {
      constraints.push("NOT NULL");
    }
    
    if (column.isUnique) {
      constraints.push("UNIQUE");
    }
    
    if (column.defaultValue) {
      constraints.push(`DEFAULT ${column.defaultValue}`);
    }
    
    if (column.isForeignKey && column.references) {
      constraints.push(`REFERENCES ${column.references.table}(${column.references.column})`);
    }
    
    return `    ${column.name} ${column.type}${constraints.length > 0 ? ' ' + constraints.join(' ') : ''}`;
  });
  
  const additionalConstraints = constraints.map(constraint => `    ${constraint}`);
  
  return `CREATE TABLE ${tableName} (\n${[...formattedColumns, ...additionalConstraints].join(',\n')}\n);`;
}

export type DbColumn = {
  name: string;
  type: string;
  description?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isNotNull?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  references?: {
    table: string;
    column: string;
  };
};

export type DbIndex = {
  name: string;
  columns: string[];
  unique?: boolean;
};

export type DbTable = {
  name: string;
  description?: string;
  columns: DbColumn[];
  indexes?: DbIndex[];
  constraints?: string[];
};

export type DbModule = {
  name: string;
  description?: string;
  tables: DbTable[];
};

export type DbRelationship = {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
};

export type DbSchema = {
  modules: DbModule[];
  relationships: DbRelationship[];
};

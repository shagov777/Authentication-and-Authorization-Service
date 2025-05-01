import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  EdgeTypes,
  MarkerType,
  Node,
  NodeTypes,
  Position,
  useNodesState,
  useEdgesState,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DbTable, DbRelationship } from '@/lib/utils';
import { Key, Link } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface SchemaFlowProps {
  tables: DbTable[];
  selectedTable: string | null;
  onSelectTable: (tableName: string | null) => void;
  moduleId?: string;
  relationships?: DbRelationship[];
  fullDiagram?: boolean;
}

// Custom Node Component - Memoized to prevent needless rerenders
const TableNode = React.memo(({ data, selected }: { data: any; selected: boolean }) => {
  return (
    <div className={`table-node ${selected ? 'border-2 border-primary' : 'border border-border'}`}>
      <div className="table-node__header">
        {data.tableName}
      </div>
      <div className="table-node__content">
        {data.columns.map((column: any) => (
          <div key={column.name} className="table-node__row">
            <div 
              className={
                column.isPrimaryKey 
                  ? "table-node__primary-key" 
                  : column.isForeignKey 
                    ? "table-node__foreign-key" 
                    : ""
              }
            >
              {column.isPrimaryKey && <Key className="h-3 w-3 mr-1" />}
              {column.isForeignKey && <Link className="h-3 w-3 mr-1" />}
              {column.name}
            </div>
            <div className="table-node__row-type">{column.type}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Explicitly name the component for better debugging
TableNode.displayName = 'TableNode';

// Define nodeTypes outside component to prevent React Flow warning
const nodeTypes: NodeTypes = {
  tableNode: TableNode
};

// Custom edge type that doesn't rely on handles
function SimpleEdge({ 
  id, 
  source, 
  target, 
  label, 
  markerEnd, 
  style, 
  labelStyle, 
  labelBgStyle, 
  className 
}: Edge) {
  return (
    <g className={className}>
      <path
        id={id}
        className={className}
        d={`M${source},${target}`}
        markerEnd={markerEnd}
        style={style}
      />
      {label && (
        <text
          style={labelStyle}
          dy="-5"
          textAnchor="middle"
        >
          <textPath href={`#${id}`} startOffset="50%">
            {label}
          </textPath>
        </text>
      )}
    </g>
  );
}

const edgeTypes: EdgeTypes = {
  simple: SimpleEdge,
};

// Main component with proper error boundaries
function SchemaFlowContent({ 
  tables, 
  selectedTable, 
  onSelectTable, 
  moduleId, 
  relationships = [],
  fullDiagram = false
}: SchemaFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Generate a layout for the nodes (basic grid layout) - memoized
  const generateLayout = useCallback((tables: DbTable[]) => {
    const HORIZONTAL_SPACING = 300;
    const VERTICAL_SPACING = 300;
    const NODES_PER_ROW = fullDiagram ? 5 : 3;

    return tables.map((table, index) => {
      const row = Math.floor(index / NODES_PER_ROW);
      const col = index % NODES_PER_ROW;

      return {
        id: table.name,
        type: 'tableNode',
        data: {
          tableName: table.name,
          columns: table.columns,
          moduleId: moduleId
        },
        position: {
          x: col * HORIZONTAL_SPACING + 50,
          y: row * VERTICAL_SPACING + 50
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left
      };
    });
  }, [fullDiagram, moduleId]);

  // Get only the tables that exist in the current view for edge filtering
  const tableNames = useMemo(() => {
    return tables.map(table => table.name);
  }, [tables]);

  // Filter relationships to only include those that reference tables in the current view
  const filteredRelationships = useMemo(() => {
    if (!relationships || relationships.length === 0) return [];
    return relationships.filter(rel => 
      tableNames.includes(rel.source) && tableNames.includes(rel.target)
    );
  }, [relationships, tableNames]);

  // Generate edges with simplified approach to avoid handle issues entirely
  const generateEdges = useCallback(() => {
    if (!isInitialized || tables.length === 0) return [];
    
    try {
      const edges: Edge[] = [];
      
      // Generate edges from foreign keys that exist in our tables
      tables.forEach(table => {
        table.columns.forEach(column => {
          if (column.isForeignKey && column.references && tableNames.includes(column.references.table)) {
            // Create a unique ID for this edge to prevent React Flow from trying to reuse handles
            const uniqueId = `fk-${Math.random().toString(36).substring(2, 9)}`;
            
            edges.push({
              id: uniqueId,
              source: table.name,
              target: column.references.table,
              // Using explicit type to avoid relying on handles
              type: 'default',
              animated: false,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 15,
                height: 15
              },
              label: column.name,
              labelBgStyle: { fill: 'white' },
              labelStyle: { fontSize: 10 },
              style: { strokeWidth: 1.5 },
              className: 'flow-edge-foreign'
            });
          }
        });
      });
      
      // Add filtered relationships with unique IDs
      filteredRelationships.forEach((rel, index) => {
        const uniqueId = `rel-${Math.random().toString(36).substring(2, 9)}`;
        
        edges.push({
          id: uniqueId,
          source: rel.source,
          target: rel.target,
          type: 'default',
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15
          },
          label: rel.label,
          labelBgStyle: { fill: 'white' },
          labelStyle: { fontSize: 10 },
          style: { strokeWidth: 1.5 },
          className: `flow-edge-${rel.type === 'one-to-one' ? 'oneToOne' : rel.type === 'one-to-many' ? 'many' : 'primary'}`
        });
      });
      
      return edges;
    } catch (error) {
      console.error("Error generating edges:", error);
      setErrorState("Error generating diagram edges");
      return [];
    }
  }, [tables, tableNames, filteredRelationships, isInitialized]);

  // Initialize nodes and then edges with careful timing to avoid race conditions
  useEffect(() => {
    setIsLoading(true);
    setIsInitialized(false);
    setErrorState(null);
    
    if (tables.length > 0) {
      try {
        // First generate and set the nodes
        const generatedNodes = generateLayout(tables);
        setNodes(generatedNodes);
        
        // Use a timer to ensure nodes are fully rendered before adding edges
        const timer = setTimeout(() => {
          setIsInitialized(true);
          setIsLoading(false);
        }, 500); // Increased delay for more reliable initialization
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error("Error initializing diagram:", error);
        setErrorState("Error initializing diagram");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [tables, generateLayout, setNodes]);

  // Update edges only after nodes are initialized
  useEffect(() => {
    if (isInitialized && !isLoading) {
      try {
        const generatedEdges = generateEdges();
        setEdges(generatedEdges);
      } catch (error) {
        console.error("Error setting edges:", error);
        setErrorState("Error rendering relationships");
      }
    }
  }, [isInitialized, isLoading, generateEdges, setEdges]);

  // Update node selection when selectedTable changes
  useEffect(() => {
    if (nodes.length > 0) {
      setNodes(nodes => 
        nodes.map(node => ({
          ...node,
          selected: node.id === selectedTable
        }))
      );
    }
  }, [selectedTable, setNodes, nodes.length]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onSelectTable(node.id);
  }, [onSelectTable]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-secondary/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (errorState) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-secondary/30 p-4">
        <div className="text-destructive mb-2">Error: {errorState}</div>
        <button 
          className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm"
          onClick={() => {
            setIsLoading(true);
            setErrorState(null);
            setTimeout(() => {
              setIsInitialized(true);
              setIsLoading(false);
            }, 500);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        proOptions={{ hideAttribution: true }}
        fitViewOptions={{ padding: 0.2 }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Controls />
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}

// Wrap the component with ReactFlowProvider to ensure context is available
// and errors are contained
export default function SchemaFlow(props: SchemaFlowProps) {
  return (
    <ReactFlowProvider>
      <SchemaFlowContent {...props} />
    </ReactFlowProvider>
  );
}

import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MarkerType,
  Node,
  NodeTypes,
  Position,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DbTable, DbRelationship } from '@/lib/utils';
import { Key, Link } from 'lucide-react';

interface SchemaFlowProps {
  tables: DbTable[];
  selectedTable: string | null;
  onSelectTable: (tableName: string | null) => void;
  moduleId?: string;
  relationships?: DbRelationship[];
  fullDiagram?: boolean;
}

// Custom Node Component
function TableNode({ data, selected }: { data: any; selected: boolean }) {
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
}

// Memoize nodeTypes to prevent React Flow warning
const nodeTypes: NodeTypes = {
  tableNode: TableNode
};

export default function SchemaFlow({ 
  tables, 
  selectedTable, 
  onSelectTable, 
  moduleId, 
  relationships = [],
  fullDiagram = false
}: SchemaFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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

  // Generate edges - completely rewritten without handles
  const generateEdges = useCallback(() => {
    const edges: Edge[] = [];
    
    // Generate edges from foreign keys that exist in our tables
    tables.forEach(table => {
      table.columns.forEach(column => {
        if (column.isForeignKey && column.references && tableNames.includes(column.references.table)) {
          edges.push({
            id: `fk-${table.name}-${column.name}`,
            source: table.name,
            target: column.references.table,
            type: 'default', // explicit default type
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15
            },
            label: 'References',
            labelBgStyle: { fill: 'white' },
            labelStyle: { fontSize: 10 },
            style: { strokeWidth: 1.5 },
            className: 'flow-edge-foreign'
          });
        }
      });
    });
    
    // Add filtered relationships
    filteredRelationships.forEach((rel, index) => {
      edges.push({
        id: `rel-${index}`,
        source: rel.source,
        target: rel.target,
        type: 'default', // explicit default type
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
  }, [tables, tableNames, filteredRelationships]);

  // Update nodes and edges when tables or relationships change
  useEffect(() => {
    if (tables.length > 0) {
      setNodes(generateLayout(tables));
      setEdges(generateEdges());
    }
  }, [tables, generateLayout, generateEdges, setNodes, setEdges]);

  // Update node selection when selectedTable changes
  useEffect(() => {
    setNodes(nodes => 
      nodes.map(node => ({
        ...node,
        selected: node.id === selectedTable
      }))
    );
  }, [selectedTable, setNodes]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onSelectTable(node.id);
  }, [onSelectTable]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
      >
        <Controls />
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}

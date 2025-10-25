'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MaterialNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  recyclability_percentage: number | null;
  children: MaterialNode[];
}

interface TreeViewProps {
  nodes: MaterialNode[];
}

export const TreeView: React.FC<TreeViewProps> = ({ nodes }) => {
  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
};

interface TreeNodeProps {
  node: MaterialNode;
  depth: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="ml-4">
      <div className="flex items-center py-1 hover:bg-gray-50 rounded">
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-6 w-6 p-0 mr-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6 h-6 flex items-center justify-center mr-1">
            <Package className="h-3 w-3 text-gray-400" />
          </div>
        )}
        
        <div 
          className="flex-1 p-2 rounded hover:bg-gray-100 cursor-pointer"
          style={{ paddingLeft: `${depth * 20}px` }}
        >
          <div className="font-medium">{node.name}</div>
          <div className="text-xs text-gray-500">
            {node.description && `${node.description.substring(0, 50)}${node.description.length > 50 ? '...' : ''}`}
            {node.recyclability_percentage !== null && ` • ${node.recyclability_percentage}% recyclable`}
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="ml-6 border-l border-gray-200 pl-2">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
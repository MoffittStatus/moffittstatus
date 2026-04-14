// Pathfinding utilities for library navigation

export interface Point {
  x: number;
  y: number;
  z?: number; // For 3D floors
}

export interface Node extends Point {
  id: string;
  name?: string; // Human-readable name like "Entrance", "Study Area 1"
  floor?: number;
}

export interface Edge {
  from: string; // Node ID
  to: string;   // Node ID
  weight: number; // Distance or cost
  bidirectional: boolean;
}

export interface Graph {
  nodes: Map<string, Node>;
  edges: Map<string, Edge[]>;
}

export const createSampleGraph = (): Graph => {
  const nodes = new Map<string, Node>();
  const edges = new Map<string, Edge[]>();

  // Add sample nodes (replace with actual floorplan coordinates)
  nodes.set('entrance', { id: 'entrance', x: 0, y: 0, name: 'Main Entrance', floor: 1 });
  nodes.set('desk', { id: 'desk', x: 5, y: 0, name: 'Information Desk', floor: 1 });
  nodes.set('study1', { id: 'study1', x: 10, y: 5, name: 'Study Area 1', floor: 1 });
  nodes.set('study2', { id: 'study2', x: 15, y: 10, name: 'Study Area 2', floor: 1 });

  // Add edges (hallways/paths)
  edges.set('entrance', [
    { from: 'entrance', to: 'desk', weight: 5, bidirectional: true }
  ]);
  edges.set('desk', [
    { from: 'desk', to: 'entrance', weight: 5, bidirectional: true },
    { from: 'desk', to: 'study1', weight: 8, bidirectional: true }
  ]);
  edges.set('study1', [
    { from: 'study1', to: 'desk', weight: 8, bidirectional: true },
    { from: 'study1', to: 'study2', weight: 7, bidirectional: true }
  ]);
  edges.set('study2', [
    { from: 'study2', to: 'study1', weight: 7, bidirectional: true }
  ]);

  return { nodes, edges };
};

export interface PathResult {
  path: Node[];
  totalDistance: number;
  found: boolean;
}

//Dijkstra's algorithm to get the shortest path
export const findPathDijkstra = (
  graph: Graph,
  startId: string,
  goalId: string
): PathResult => {
  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const unvisited = new Set<string>();

  // Initialize
  for (const [id] of graph.nodes) {
    distances.set(id, id === startId ? 0 : Infinity);
    unvisited.add(id);
  }

  while (unvisited.size > 0) {
    // Find closest unvisited node
    let currentId = '';
    let minDistance = Infinity;
    for (const id of unvisited) {
      const dist = distances.get(id);
      if (dist !== undefined && dist < minDistance) {
        minDistance = dist;
        currentId = id;
      }
    }

    if (currentId === goalId || minDistance === Infinity) break;

    unvisited.delete(currentId);

    // Update neighbors
    const neighbors = graph.edges.get(currentId) || [];
    for (const edge of neighbors) {
      const neighborId = edge.to;
      if (!unvisited.has(neighborId)) continue;

      const alt = (distances.get(currentId) || 0) + edge.weight;
      if (alt < (distances.get(neighborId) || Infinity)) {
        distances.set(neighborId, alt);
        previous.set(neighborId, currentId);
      }
    }
  }

  // Reconstruct path
  const path: Node[] = [];
  let current = goalId;
  const goalDistance = distances.get(goalId);

  // If goal is unreachable, return no path
  if (goalDistance === Infinity || goalDistance === undefined) {
    return { path: [], totalDistance: 0, found: false };
  }

  // If start and goal are the same, return just the start node
  if (startId === goalId) {
    const startNode = graph.nodes.get(startId);
    return {
      path: startNode ? [startNode] : [],
      totalDistance: 0,
      found: true
    };
  }

  // Reconstruct path from goal back to start
  while (current && current !== startId) {
    const node = graph.nodes.get(current);
    if (node) path.unshift(node);
    current = previous.get(current) || '';
  }

  // Add the start node
  const startNode = graph.nodes.get(startId);
  if (startNode) path.unshift(startNode);

  // Verify the path is valid (should have at least start and goal)
  if (path.length < 2) {
    return { path: [], totalDistance: 0, found: false };
  }

  return {
    path,
    totalDistance: goalDistance,
    found: true
  };
};
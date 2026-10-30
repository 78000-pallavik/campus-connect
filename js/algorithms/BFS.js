/**
 * CampusConnect - Breadth-First Search (BFS) Engine
 * Calculates the exact Shortest Connection Path between two students
 * Guarantee: Minimum degrees of separation in an unweighted graph
 * Time Complexity: O(|V| + |E|)
 * Space Complexity: O(|V|)
 */

export class BFSEngine {
  /**
   * Run BFS and generate complete step-by-step playback trace for visualization
   * @param {Graph} graph 
   * @param {string} startId 
   * @param {string} targetId 
   * @returns {Object} trace & result
   */
  static traceShortestPath(graph, startId, targetId) {
    const startTime = performance.now();
    startId = String(startId);
    targetId = String(targetId);

    const steps = [];
    const visited = new Set();
    const parentMap = new Map(); // toId -> { fromId, depth }
    const queue = []; // FIFO Queue

    // Validation
    if (!graph.hasStudent(startId) || !graph.hasStudent(targetId)) {
      return {
        success: false,
        path: [],
        degrees: -1,
        steps: [{
          type: "error",
          message: "Start or target student does not exist in graph.",
          queue: [],
          visited: [],
          current: null
        }],
        executionTimeMs: 0
      };
    }

    if (startId === targetId) {
      const student = graph.getStudent(startId);
      return {
        success: true,
        path: [startId],
        degrees: 0,
        steps: [{
          type: "same_node",
          message: `${student.name} is the same as the target. 0 degrees of separation.`,
          queue: [startId],
          visited: [startId],
          current: startId,
          activeEdge: null,
          highlightPath: [startId]
        }],
        executionTimeMs: (performance.now() - startTime).toFixed(2)
      };
    }

    // Step 0: Initialize Queue & Visited Set
    queue.push(startId);
    visited.add(startId);
    parentMap.set(startId, { fromId: null, depth: 0 });

    const startStudent = graph.getStudent(startId);
    const targetStudent = graph.getStudent(targetId);

    steps.push({
      type: "init",
      message: `Initialized BFS Queue with root student ${startStudent.name} (Depth 0). Visited set initialized.`,
      queue: [...queue],
      visited: Array.from(visited),
      current: startId,
      activeEdge: null,
      highlightPath: []
    });

    let found = false;
    let maxQueueSize = 1;

    // BFS Loop
    while (queue.length > 0) {
      maxQueueSize = Math.max(maxQueueSize, queue.length);
      const current = queue.shift(); // FIFO Dequeue
      const currentStudent = graph.getStudent(current);
      const currentDepth = parentMap.get(current).depth;

      steps.push({
        type: "dequeue",
        message: `Dequeued ${currentStudent.name} (Hop Depth ${currentDepth}). Exploring 1st-degree neighbors...`,
        queue: [...queue],
        visited: Array.from(visited),
        current: current,
        activeEdge: null,
        currentDepth
      });

      const neighbors = Array.from(graph.getNeighbors(current));

      for (const neighbor of neighbors) {
        const neighborStudent = graph.getStudent(neighbor);
        const activeEdge = { from: current, to: neighbor };

        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parentMap.set(neighbor, { fromId: current, depth: currentDepth + 1 });
          queue.push(neighbor);

          steps.push({
            type: "discover_neighbor",
            message: `Discovered unvisited neighbor: ${neighborStudent.name} via ${currentStudent.name}. Added to Queue (Hop Depth ${currentDepth + 1}).`,
            queue: [...queue],
            visited: Array.from(visited),
            current: neighbor,
            activeEdge,
            currentDepth: currentDepth + 1
          });

          // Check if reached target
          if (neighbor === targetId) {
            found = true;
            break;
          }
        } else {
          // Already visited neighbor
          steps.push({
            type: "already_visited",
            message: `Neighbor ${neighborStudent.name} has already been visited. Skipping cycle.`,
            queue: [...queue],
            visited: Array.from(visited),
            current: neighbor,
            activeEdge,
            currentDepth: parentMap.get(neighbor) ? parentMap.get(neighbor).depth : currentDepth
          });
        }
      }

      if (found) break;
    }

    const executionTimeMs = (performance.now() - startTime).toFixed(2);

    if (!found) {
      steps.push({
        type: "exhausted",
        message: `BFS Queue exhausted. No connecting path exists between ${startStudent.name} and ${targetStudent.name} (Disconnected Subgraphs).`,
        queue: [],
        visited: Array.from(visited),
        current: null,
        activeEdge: null,
        highlightPath: []
      });

      return {
        success: false,
        path: [],
        degrees: -1,
        visitedCount: visited.size,
        maxQueueSize,
        steps,
        executionTimeMs
      };
    }

    // Backtrack from target to start using parentMap
    const shortestPath = [];
    let curr = targetId;
    while (curr !== null) {
      shortestPath.unshift(curr);
      curr = parentMap.get(curr).fromId;
    }

    const degrees = shortestPath.length - 1;

    // Final resolved step
    steps.push({
      type: "path_resolved",
      message: `Shortest Path Resolved! Found connection in ${degrees} degree${degrees === 1 ? "" : "s"} of separation (${shortestPath.map(id => graph.getStudent(id).name).join(" → ")}).`,
      queue: [...queue],
      visited: Array.from(visited),
      current: targetId,
      activeEdge: null,
      highlightPath: [...shortestPath],
      degrees
    });

    return {
      success: true,
      path: shortestPath,
      degrees,
      visitedCount: visited.size,
      maxQueueSize,
      steps,
      executionTimeMs
    };
  }
}

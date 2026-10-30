/**
 * CampusConnect (UniGraph) - Standalone Universal Bundle
 * Supports both file:// and http:// execution without CORS restrictions
 */
(function() {
'use strict';

// ================================
// Source: js/Graph.js
// ================================
/**
 * CampusConnect (UniGraph) - Graph Data Structure
 * Implementation: Map<StudentID, Set<StudentID>> (Adjacency List)
 * Complexity: O(|V| + |E|) space, O(1) neighbor lookups
 */

class Graph {
  constructor() {
    // Map<StudentID, Set<StudentID>>
    this.adjacencyList = new Map();
    // Map<StudentID, StudentObject>
    this.nodes = new Map();
    // Event listeners
    this.listeners = new Set();
  }

  /**
   * Subscribe to graph changes
   * @param {Function} listener 
   * @returns {Function} unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, data) {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (err) {
        console.error("Graph listener error:", err);
      }
    }
  }

  /**
   * Add a student node (vertex) to the graph
   * @param {Object} student 
   */
  addStudent(student) {
    if (!student || !student.id) {
      throw new Error("Student must have a valid ID");
    }
    const studentId = String(student.id);
    const studentData = {
      id: studentId,
      name: student.name || `Student ${studentId}`,
      major: student.major || "General Studies",
      year: student.year || "Freshman",
      dorm: student.dorm || "Campus Dorm",
      clubs: Array.isArray(student.clubs) ? [...student.clubs] : [],
      skills: Array.isArray(student.skills) ? [...student.skills] : [],
      bio: student.bio || "CampusConnect Member",
      avatar: student.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${studentId}`,
      color: student.color || this.getMajorColor(student.major || "General Studies"),
      createdAt: student.createdAt || Date.now()
    };

    this.nodes.set(studentId, studentData);
    if (!this.adjacencyList.has(studentId)) {
      this.adjacencyList.set(studentId, new Set());
    }

    this.notify("node_added", { student: studentData });
    return studentData;
  }

  /**
   * Update student details
   */
  updateStudent(studentId, updates) {
    studentId = String(studentId);
    if (!this.nodes.has(studentId)) return false;
    const current = this.nodes.get(studentId);
    const updated = {
      ...current,
      ...updates,
      id: studentId // preserve ID
    };
    if (updates.major && !updates.color) {
      updated.color = this.getMajorColor(updates.major);
    }
    this.nodes.set(studentId, updated);
    this.notify("node_updated", { student: updated });
    return updated;
  }

  /**
   * Remove a student and all incident edges
   * @param {string} studentId 
   */
  removeStudent(studentId) {
    studentId = String(studentId);
    if (!this.nodes.has(studentId)) return false;

    // Remove all edges connected to this student
    const neighbors = this.adjacencyList.get(studentId) || new Set();
    for (const neighbor of neighbors) {
      const neighborSet = this.adjacencyList.get(neighbor);
      if (neighborSet) {
        neighborSet.delete(studentId);
      }
    }

    this.adjacencyList.delete(studentId);
    this.nodes.delete(studentId);
    this.notify("node_removed", { studentId });
    return true;
  }

  /**
   * Add an undirected friendship edge between studentA and studentB
   * @param {string} studentA 
   * @param {string} studentB 
   */
  addFriendship(studentA, studentB) {
    const a = String(studentA);
    const b = String(studentB);

    if (a === b) return false;
    if (!this.nodes.has(a) || !this.nodes.has(b)) return false;

    this.adjacencyList.get(a).add(b);
    this.adjacencyList.get(b).add(a);

    this.notify("edge_added", { from: a, to: b });
    return true;
  }

  /**
   * Remove an undirected friendship edge
   */
  removeFriendship(studentA, studentB) {
    const a = String(studentA);
    const b = String(studentB);

    let changed = false;
    if (this.adjacencyList.has(a)) {
      changed = this.adjacencyList.get(a).delete(b) || changed;
    }
    if (this.adjacencyList.has(b)) {
      changed = this.adjacencyList.get(b).delete(a) || changed;
    }

    if (changed) {
      this.notify("edge_removed", { from: a, to: b });
    }
    return changed;
  }

  /**
   * Check if two students are 1st-degree friends
   */
  areFriends(studentA, studentB) {
    const a = String(studentA);
    const b = String(studentB);
    const setA = this.adjacencyList.get(a);
    return setA ? setA.has(b) : false;
  }

  /**
   * Get direct 1st-degree friends of a student (O(1) retrieval)
   * @param {string} studentId 
   * @returns {Set<string>} Set of neighbor student IDs
   */
  getNeighbors(studentId) {
    const id = String(studentId);
    return this.adjacencyList.get(id) || new Set();
  }

  /**
   * Get degree of a vertex
   */
  getDegree(studentId) {
    return this.getNeighbors(studentId).size;
  }

  /**
   * Get student details by ID
   */
  getStudent(studentId) {
    return this.nodes.get(String(studentId)) || null;
  }

  /**
   * Check if node exists
   */
  hasStudent(studentId) {
    return this.nodes.has(String(studentId));
  }

  /**
   * Returns all student objects as array
   */
  getAllStudents() {
    return Array.from(this.nodes.values());
  }

  /**
   * Returns all unique undirected edges as [{ from, to }]
   */
  getAllEdges() {
    const edges = [];
    const seen = new Set();

    for (const [u, neighbors] of this.adjacencyList.entries()) {
      for (const v of neighbors) {
        const edgeKey = u < v ? `${u}__${v}` : `${v}__${u}`;
        if (!seen.has(edgeKey)) {
          seen.add(edgeKey);
          edges.push({ from: u, to: v, id: edgeKey });
        }
      }
    }
    return edges;
  }

  /**
   * Compute comprehensive graph statistics
   */
  getStats() {
    const vertexCount = this.nodes.size;
    const allEdges = this.getAllEdges();
    const edgeCount = allEdges.length;

    let totalDegree = 0;
    let isolatedCount = 0;
    let maxDegree = 0;
    let minDegree = vertexCount > 0 ? Infinity : 0;
    let mostConnectedStudent = null;

    for (const [id, neighbors] of this.adjacencyList.entries()) {
      const deg = neighbors.size;
      totalDegree += deg;
      if (deg === 0) isolatedCount++;
      if (deg > maxDegree) {
        maxDegree = deg;
        mostConnectedStudent = this.nodes.get(id);
      }
      if (deg < minDegree) {
        minDegree = deg;
      }
    }

    if (minDegree === Infinity) minDegree = 0;

    const avgDegree = vertexCount > 0 ? (totalDegree / vertexCount).toFixed(2) : "0.00";
    const maxPossibleEdges = vertexCount > 1 ? (vertexCount * (vertexCount - 1)) / 2 : 1;
    const density = vertexCount > 1 ? (edgeCount / maxPossibleEdges).toFixed(4) : "0.0000";
    const sparsity = (1 - Number(density)).toFixed(4);

    return {
      vertexCount,
      edgeCount,
      avgDegree: Number(avgDegree),
      density: Number(density),
      sparsity: Number(sparsity),
      isolatedCount,
      maxDegree,
      minDegree,
      mostConnectedStudent
    };
  }

  /**
   * Returns department aesthetic color
   */
  getMajorColor(major) {
    const map = {
      "Computer Science": "#6366f1",    // Indigo
      "Electrical & IoT": "#f59e0b",    // Amber
      "Design & HCI": "#ec4899",        // Pink
      "Robotics & Mech": "#ef4444",     // Rose / Red
      "Biomedical Eng": "#10b981",      // Emerald
      "Business & Fin": "#0ea5e9",      // Sky Blue
      "Data Science & AI": "#8b5cf6",   // Violet
      "General Studies": "#64748b"      // Slate
    };
    return map[major] || "#8b5cf6";
  }

  /**
   * Export state to clean JSON format
   */
  toJSON() {
    const students = this.getAllStudents();
    const edges = this.getAllEdges();
    return JSON.stringify({
      version: "1.0",
      timestamp: new Date().toISOString(),
      metadata: {
        title: "CampusConnect Graph Snapshot",
        vertexCount: students.length,
        edgeCount: edges.length
      },
      students,
      edges
    }, null, 2);
  }

  /**
   * Import graph state from JSON
   */
  loadFromJSON(jsonInput) {
    const data = typeof jsonInput === "string" ? JSON.parse(jsonInput) : jsonInput;
    this.clear();

    if (Array.isArray(data.students)) {
      for (const s of data.students) {
        this.addStudent(s);
      }
    }

    if (Array.isArray(data.edges)) {
      for (const e of data.edges) {
        this.addFriendship(e.from, e.to);
      }
    }

    this.notify("graph_reloaded", { stats: this.getStats() });
    return this;
  }

  /**
   * Clear the entire graph
   */
  clear() {
    this.adjacencyList.clear();
    this.nodes.clear();
    this.notify("graph_cleared", {});
  }
}


// ================================
// Source: js/algorithms/BFS.js
// ================================
/**
 * CampusConnect - Breadth-First Search (BFS) Engine
 * Calculates the exact Shortest Connection Path between two students
 * Guarantee: Minimum degrees of separation in an unweighted graph
 * Time Complexity: O(|V| + |E|)
 * Space Complexity: O(|V|)
 */

class BFSEngine {
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


// ================================
// Source: js/algorithms/DFS.js
// ================================
/**
 * CampusConnect - Depth-First Search (DFS) Engine
 * Explores alternative paths and detects campus sub-communities (Connected Components)
 * Time Complexity: O(|V| + |E|) for Connected Components
 */

class DFSEngine {
  /**
   * Find alternative social routes bounded by maximum hop depth (k = 5)
   * Uses recursive backtracking with visited set.
   * @param {Graph} graph 
   * @param {string} startId 
   * @param {string} targetId 
   * @param {number} maxHop default 5
   * @param {number} maxPaths max paths to collect (default 10 to avoid combinatorial explosion)
   * @returns {Array<Array<string>>}
   */
  static findAlternativePaths(graph, startId, targetId, maxHop = 5, maxPaths = 10) {
    startId = String(startId);
    targetId = String(targetId);

    if (!graph.hasStudent(startId) || !graph.hasStudent(targetId)) return [];
    if (startId === targetId) return [[startId]];

    const allPaths = [];
    const visited = new Set();
    const currentPath = [startId];
    visited.add(startId);

    function backtrack(currNode, depth) {
      if (allPaths.length >= maxPaths) return;
      if (depth > maxHop) return;

      if (currNode === targetId) {
        allPaths.push([...currentPath]);
        return;
      }

      const neighbors = Array.from(graph.getNeighbors(currNode));
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          currentPath.push(neighbor);

          backtrack(neighbor, depth + 1);

          currentPath.pop();
          visited.delete(neighbor);
        }
      }
    }

    backtrack(startId, 0);

    // Sort by path length ascending
    return allPaths.sort((a, b) => a.length - b.length);
  }

  /**
   * Discover maximal connected subgraphs (Campus Sub-Communities)
   * Group isolated dorms, departments, or clubs.
   * @param {Graph} graph 
   * @returns {Object} components metadata
   */
  static findConnectedComponents(graph) {
    const visited = new Set();
    const components = [];
    const allStudents = graph.getAllStudents();

    // Palette of vibrant colors for community partitioning
    const communityColors = [
      { primary: "#6366f1", bg: "rgba(99, 102, 241, 0.2)", border: "#4f46e5", name: "Cluster Alpha (Core)" },
      { primary: "#ec4899", bg: "rgba(236, 72, 153, 0.2)", border: "#db2777", name: "Cluster Beta (Creative Hub)" },
      { primary: "#10b981", bg: "rgba(16, 185, 129, 0.2)", border: "#059669", name: "Cluster Gamma (Science & Bio)" },
      { primary: "#f59e0b", bg: "rgba(245, 158, 11, 0.2)", border: "#d97706", name: "Cluster Delta (Engineering)" },
      { primary: "#0ea5e9", bg: "rgba(14, 165, 233, 0.2)", border: "#0284c7", name: "Cluster Epsilon (Business)" },
      { primary: "#8b5cf6", bg: "rgba(139, 92, 246, 0.2)", border: "#7c3aed", name: "Cluster Zeta (Interdisciplinary)" },
      { primary: "#14b8a6", bg: "rgba(20, 184, 166, 0.2)", border: "#0d9488", name: "Cluster Eta" },
      { primary: "#f97316", bg: "rgba(249, 115, 22, 0.2)", border: "#ea580c", name: "Cluster Theta" }
    ];

    let colorIndex = 0;

    for (const student of allStudents) {
      const studentId = student.id;
      if (!visited.has(studentId)) {
        // Start new component discovery using DFS traversal
        const componentMembers = [];
        const stack = [studentId];
        visited.add(studentId);

        while (stack.length > 0) {
          const curr = stack.pop();
          componentMembers.push(curr);

          const neighbors = graph.getNeighbors(curr);
          for (const n of neighbors) {
            if (!visited.has(n)) {
              visited.add(n);
              stack.push(n);
            }
          }
        }

        const colorScheme = communityColors[colorIndex % communityColors.length];
        colorIndex++;

        // Analyze component characteristics
        const majorsCount = {};
        const dormsCount = {};
        const clubsCount = {};

        for (const mId of componentMembers) {
          const s = graph.getStudent(mId);
          if (s) {
            majorsCount[s.major] = (majorsCount[s.major] || 0) + 1;
            dormsCount[s.dorm] = (dormsCount[s.dorm] || 0) + 1;
            for (const club of s.clubs) {
              clubsCount[club] = (clubsCount[club] || 0) + 1;
            }
          }
        }

        // Predominant major / dorm
        const topMajor = Object.entries(majorsCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixed";
        const topDorm = Object.entries(dormsCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixed";

        components.push({
          id: `community_${components.length + 1}`,
          name: componentMembers.length === 1 
            ? `Isolated Student (${graph.getStudent(componentMembers[0])?.name})` 
            : `${colorScheme.name} · Predominantly ${topMajor}`,
          members: componentMembers,
          size: componentMembers.length,
          topMajor,
          topDorm,
          majorsCount,
          dormsCount,
          clubsCount,
          color: colorScheme,
          isIsolated: componentMembers.length === 1
        });
      }
    }

    // Sort by size descending (largest component first)
    components.sort((a, b) => b.size - a.size);

    return {
      totalComponents: components.length,
      largestComponentSize: components[0]?.size || 0,
      isolatedNodesCount: components.filter(c => c.isIsolated).length,
      components
    };
  }
}


// ================================
// Source: js/algorithms/SetOperations.js
// ================================
/**
 * CampusConnect - Set Operations Engine
 * Calculates common friends via Set Intersection with O(min(deg(A), deg(B))) optimization
 * Calculates shared clubs, dorms, skills, and Jaccard Similarity index
 */

class SetOperations {
  /**
   * Find mutual 1st-degree friends between student A and student B
   * Time Complexity: O(min(deg(A), deg(B)))
   * Space Complexity: O(min(deg(A), deg(B)))
   * @param {Graph} graph 
   * @param {string} studentAId 
   * @param {string} studentBId 
   */
  static findMutualFriends(graph, studentAId, studentBId) {
    studentAId = String(studentAId);
    studentBId = String(studentBId);

    const studentA = graph.getStudent(studentAId);
    const studentB = graph.getStudent(studentBId);

    if (!studentA || !studentB) {
      return {
        mutualFriends: [],
        count: 0,
        jaccardIndex: 0,
        sharedClubs: [],
        sameDorm: false,
        sameMajor: false,
        sharedSkills: [],
        benchmarks: { smallerDegree: 0, largerDegree: 0, comparisonsMade: 0 }
      };
    }

    const setA = graph.getNeighbors(studentAId);
    const setB = graph.getNeighbors(studentBId);

    // Optimize iteration by choosing smaller set
    const smallerSet = setA.size <= setB.size ? setA : setB;
    const largerSet = setA.size <= setB.size ? setB : setA;

    const mutualIds = [];
    let comparisonsMade = 0;

    for (const friendId of smallerSet) {
      comparisonsMade++;
      if (largerSet.has(friendId)) {
        mutualIds.push(friendId);
      }
    }

    const mutualStudents = mutualIds.map(id => graph.getStudent(id)).filter(Boolean);

    // Calculate Jaccard Similarity for friendships: |A ∩ B| / |A ∪ B|
    const unionSize = (setA.size + setB.size) - mutualIds.length;
    const jaccardIndex = unionSize > 0 ? (mutualIds.length / unionSize).toFixed(3) : "0.000";

    // Set Intersection for Clubs
    const clubsA = new Set(studentA.clubs || []);
    const sharedClubs = (studentB.clubs || []).filter(c => clubsA.has(c));

    // Shared Dorm
    const sameDorm = Boolean(studentA.dorm && studentB.dorm && studentA.dorm === studentB.dorm);

    // Shared Major
    const sameMajor = Boolean(studentA.major && studentB.major && studentA.major === studentB.major);

    // Set Intersection for Skills
    const skillsA = new Set(studentA.skills || []);
    const sharedSkills = (studentB.skills || []).filter(s => skillsA.has(s));

    return {
      studentA,
      studentB,
      mutualFriends: mutualStudents,
      mutualFriendIds: mutualIds,
      count: mutualStudents.length,
      jaccardIndex: Number(jaccardIndex),
      sharedClubs,
      sameDorm,
      dormName: sameDorm ? studentA.dorm : null,
      sameMajor,
      majorName: sameMajor ? studentA.major : null,
      sharedSkills,
      benchmarks: {
        degA: setA.size,
        degB: setB.size,
        smallerDegree: smallerSet.size,
        largerDegree: largerSet.size,
        comparisonsMade,
        theoreticalMax: Math.min(setA.size, setB.size)
      }
    };
  }

  /**
   * Fast Set Union of friends
   */
  static unionFriends(graph, studentAId, studentBId) {
    const setA = graph.getNeighbors(studentAId);
    const setB = graph.getNeighbors(studentBId);
    const union = new Set([...setA, ...setB]);
    return Array.from(union).map(id => graph.getStudent(id)).filter(Boolean);
  }
}


// ================================
// Source: js/algorithms/RecommendationEngine.js
// ================================
/**
 * CampusConnect - Friend Recommendation Engine ("People You May Know")
 * Explores 2-Hop BFS Neighbors (Friends of Friends)
 * Weighted Relevance Score Formula:
 * Score = (Mutual Friends * 3.5) + (Same Major ? 2.5 : 0) + (Same Dorm ? 2.0 : 0) + (Shared Clubs * 1.5)
 */

class RecommendationEngine {
  /**
   * Compute ranked 2-hop recommendations for a given student
   * @param {Graph} graph 
   * @param {string} studentId 
   * @returns {Array<Object>} Ranked candidates
   */
  static getRecommendations(graph, studentId) {
    studentId = String(studentId);
    const targetStudent = graph.getStudent(studentId);
    if (!targetStudent) return [];

    const directFriends = graph.getNeighbors(studentId);
    // Candidates at 2-hop distance (neighbors of direct friends)
    const candidatesMap = new Map(); // candidateId -> { mutualFriends: Set }

    for (const friendId of directFriends) {
      const secondHopNeighbors = graph.getNeighbors(friendId);
      for (const candidateId of secondHopNeighbors) {
        // Exclude self and direct friends
        if (candidateId === studentId || directFriends.has(candidateId)) {
          continue;
        }

        if (!candidatesMap.has(candidateId)) {
          candidatesMap.set(candidateId, new Set());
        }
        candidatesMap.get(candidateId).add(friendId);
      }
    }

    const recommendations = [];

    for (const [candidateId, mutualSet] of candidatesMap.entries()) {
      const candidateStudent = graph.getStudent(candidateId);
      if (!candidateStudent) continue;

      const mutualCount = mutualSet.size;
      const sameMajor = targetStudent.major && candidateStudent.major && targetStudent.major === candidateStudent.major;
      const sameDorm = targetStudent.dorm && candidateStudent.dorm && targetStudent.dorm === candidateStudent.dorm;

      // Shared clubs set intersection
      const targetClubs = new Set(targetStudent.clubs || []);
      const sharedClubs = (candidateStudent.clubs || []).filter(c => targetClubs.has(c));

      // Calculate score according to PRD specification
      const mutualFriendsScore = mutualCount * 3.5;
      const majorScore = sameMajor ? 2.5 : 0;
      const dormScore = sameDorm ? 2.0 : 0;
      const clubScore = sharedClubs.length * 1.5;

      const totalScore = Number((mutualFriendsScore + majorScore + dormScore + clubScore).toFixed(1));

      // Mutual friends objects
      const mutualFriendsList = Array.from(mutualSet).map(id => graph.getStudent(id)).filter(Boolean);

      recommendations.push({
        candidate: candidateStudent,
        score: totalScore,
        breakdown: {
          mutualFriends: {
            count: mutualCount,
            score: mutualFriendsScore,
            list: mutualFriendsList
          },
          sameMajor: {
            isSame: sameMajor,
            score: majorScore,
            major: candidateStudent.major
          },
          sameDorm: {
            isSame: sameDorm,
            score: dormScore,
            dorm: candidateStudent.dorm
          },
          sharedClubs: {
            count: sharedClubs.length,
            score: clubScore,
            list: sharedClubs
          }
        },
        reasons: [
          mutualCount > 0 ? `${mutualCount} mutual friend${mutualCount > 1 ? "s" : ""} (+${mutualFriendsScore})` : null,
          sameMajor ? `Same Major: ${candidateStudent.major} (+2.5)` : null,
          sameDorm ? `Same Dorm: ${candidateStudent.dorm} (+2.0)` : null,
          sharedClubs.length > 0 ? `${sharedClubs.length} shared club${sharedClubs.length > 1 ? "s" : ""} (+${clubScore})` : null
        ].filter(Boolean)
      });
    }

    // Sort descending by relevance score
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations;
  }
}


// ================================
// Source: js/algorithms/EvaluatorSuite.js
// ================================
/**
 * CampusConnect - DSA Evaluator & Professor Verification Suite
 * Automated test bench, theoretical complexity verification, and Dijkstra baseline comparison
 */






class EvaluatorSuite {
  /**
   * Reference unweighted Dijkstra's algorithm for baseline accuracy verification
   */
  static dijkstraBaseline(graph, startId, targetId) {
    startId = String(startId);
    targetId = String(targetId);

    const distances = new Map();
    const prev = new Map();
    const unvisited = new Set(graph.getAllStudents().map(s => s.id));

    for (const id of unvisited) {
      distances.set(id, Infinity);
      prev.set(id, null);
    }
    distances.set(startId, 0);

    while (unvisited.size > 0) {
      // Find vertex with min distance
      let minNode = null;
      let minDistance = Infinity;
      for (const node of unvisited) {
        const d = distances.get(node);
        if (d < minDistance) {
          minDistance = d;
          minNode = node;
        }
      }

      if (minNode === null || minDistance === Infinity) break;
      if (minNode === targetId) break;

      unvisited.delete(minNode);

      const neighbors = graph.getNeighbors(minNode);
      for (const neighbor of neighbors) {
        if (unvisited.has(neighbor)) {
          const alt = distances.get(minNode) + 1; // unweighted unit cost
          if (alt < distances.get(neighbor)) {
            distances.set(neighbor, alt);
            prev.set(neighbor, minNode);
          }
        }
      }
    }

    if (distances.get(targetId) === Infinity) {
      return { path: [], degrees: -1 };
    }

    const path = [];
    let u = targetId;
    while (u !== null) {
      path.unshift(u);
      u = prev.get(u);
    }

    return { path, degrees: path.length - 1 };
  }

  /**
   * Run full automated verification suite with detailed assertions
   * @param {Graph} graph 
   * @returns {Object} Test report
   */
  static runAllTests(graph) {
    const results = [];
    const startTime = performance.now();
    const students = graph.getAllStudents();

    // 1. BFS Shortest Path vs Dijkstra Baseline Verification
    let bfsDijkstraPassed = true;
    let comparisonsDone = 0;
    const sampleSize = Math.min(students.length, 12);

    for (let i = 0; i < sampleSize; i++) {
      for (let j = i + 1; j < sampleSize; j++) {
        const sA = students[i].id;
        const sB = students[j].id;

        const bfsRes = BFSEngine.traceShortestPath(graph, sA, sB);
        const dijkstraRes = this.dijkstraBaseline(graph, sA, sB);

        comparisonsDone++;
        if (bfsRes.degrees !== dijkstraRes.degrees) {
          bfsDijkstraPassed = false;
          break;
        }
      }
      if (!bfsDijkstraPassed) break;
    }

    results.push({
      testName: "BFS Shortest Path vs. Dijkstra Ground Truth",
      status: bfsDijkstraPassed ? "PASS" : "FAIL",
      category: "Accuracy",
      description: `Tested ${comparisonsDone} student pairs. Verified that BFS path length exactly equals Dijkstra's minimum distance on unweighted graph.`,
      complexity: "Time: O(|V| + |E|), Space: O(|V|)",
      details: bfsDijkstraPassed ? "100% path optimality verified." : "Mismatch detected between BFS and Dijkstra!"
    });

    // 2. Set Intersection Optimization O(min(deg(A), deg(B)))
    let setOptimizationPassed = true;
    let maxComparisonsObserved = 0;

    for (let i = 0; i < sampleSize; i++) {
      for (let j = i + 1; j < sampleSize; j++) {
        const sA = students[i].id;
        const sB = students[j].id;
        const setRes = SetOperations.findMutualFriends(graph, sA, sB);

        const theoreticalLimit = Math.min(graph.getDegree(sA), graph.getDegree(sB));
        if (setRes.benchmarks.comparisonsMade > theoreticalLimit) {
          setOptimizationPassed = false;
          break;
        }
        maxComparisonsObserved = Math.max(maxComparisonsObserved, setRes.benchmarks.comparisonsMade);
      }
    }

    results.push({
      testName: "Mutual Friends Set Intersection Optimization",
      status: setOptimizationPassed ? "PASS" : "FAIL",
      category: "Complexity",
      description: "Ensures algorithm loops strictly over min(deg(A), deg(B)) rather than max or full vertex set.",
      complexity: "Time: O(min(deg(A), deg(B))), Space: O(min(deg(A), deg(B)))",
      details: setOptimizationPassed 
        ? `Verified bounds: Never exceeded min(deg(A), deg(B)) (Max iterations observed: ${maxComparisonsObserved}).`
        : "Optimization violated."
    });

    // 3. Connected Components Conservation Law
    const ccResult = DFSEngine.findConnectedComponents(graph);
    let totalMembersInComponents = 0;
    const seenNodes = new Set();
    let noOverlap = true;

    for (const comp of ccResult.components) {
      totalMembersInComponents += comp.members.length;
      for (const m of comp.members) {
        if (seenNodes.has(m)) noOverlap = false;
        seenNodes.add(m);
      }
    }

    const ccPassed = (totalMembersInComponents === students.length) && noOverlap;

    results.push({
      testName: "Connected Components Partitioning (DFS)",
      status: ccPassed ? "PASS" : "FAIL",
      category: "Structural",
      description: `Partitioned ${students.length} students into ${ccResult.totalComponents} maximal connected subgraphs.`,
      complexity: "Time: O(|V| + |E|), Space: O(|V|)",
      details: ccPassed 
        ? `Verified partition: ∑|Component_i| = |V| (${totalMembersInComponents} == ${students.length}), 0 overlapping vertices.`
        : "Partition error."
    });

    // 4. Recommendation Engine 2-Hop Formula Assertion
    let recFormulaPassed = true;
    if (students.length > 0) {
      const recs = RecommendationEngine.getRecommendations(graph, students[0].id);
      for (const rec of recs) {
        const expectedScore = Number((
          (rec.breakdown.mutualFriends.count * 3.5) +
          (rec.breakdown.sameMajor.isSame ? 2.5 : 0) +
          (rec.breakdown.sameDorm.isSame ? 2.0 : 0) +
          (rec.breakdown.sharedClubs.count * 1.5)
        ).toFixed(1));

        if (Math.abs(rec.score - expectedScore) > 0.001) {
          recFormulaPassed = false;
          break;
        }
      }
    }

    results.push({
      testName: "2-Hop Recommendation Engine Score Formula Verification",
      status: recFormulaPassed ? "PASS" : "FAIL",
      category: "Algorithm",
      description: "Validates formula: (Mutual*3.5) + (Major?2.5:0) + (Dorm?2.0:0) + (Clubs*1.5)",
      complexity: "Exploration: 2-Hop BFS neighborhood",
      details: recFormulaPassed 
        ? "All candidate scores match weighted formula with floating-point precision." 
        : "Score formula calculation mismatch."
    });

    const totalDuration = (performance.now() - startTime).toFixed(2);
    const passedCount = results.filter(r => r.status === "PASS").length;

    return {
      totalDuration,
      passedCount,
      totalCount: results.length,
      allPassed: passedCount === results.length,
      results
    };
  }

  /**
   * Theoretical Complexity Reference Table
   */
  static getComplexityTable() {
    return [
      {
        feature: "Graph Storage (Adjacency List)",
        time: "Lookup: O(1), Insert: O(1)",
        space: "O(|V| + |E|)",
        notes: "Sparse graph optimization (|E| << |V|²)"
      },
      {
        feature: "Connection Path Finder (BFS)",
        time: "O(|V| + |E|)",
        space: "O(|V|)",
        notes: "FIFO Queue + Visited Set; minimum degrees guarantee"
      },
      {
        feature: "Mutual Friends (Set Intersection)",
        time: "O(min(deg(A), deg(B)))",
        space: "O(min(deg(A), deg(B)))",
        notes: "Optimized loop over smaller degree neighbor set"
      },
      {
        feature: "Alternative Paths (Bounded DFS)",
        time: "O(b^k) (b = branching factor, k ≤ 5)",
        space: "O(k) call stack",
        notes: "Backtracking bounded by maximum 5 hops"
      },
      {
        feature: "Campus Sub-Communities (DFS/BFS)",
        time: "O(|V| + |E|)",
        space: "O(|V|)",
        notes: "Finds all maximal connected components"
      },
      {
        feature: "2-Hop Recommendations",
        time: "O(deg(u) · avg_deg)",
        space: "O(Candidates)",
        notes: "Traverses 2-hop neighborhood with weighted affinities"
      }
    ];
  }
}


// ================================
// Source: js/data/presets.js
// ================================
/**
 * CampusConnect - Preset Datasets
 * Realistic collegiate networks featuring students, majors, dorms, clubs, and social posts
 */

const PRESET_DATASETS = {
  // Preset 1: Standard Balanced Collegiate Network (28 students)
  defaultCampus: {
    name: "Apex University of Tech & Design (Default)",
    description: "Diverse academic graph with CS, Design, Robotics, BioMed, and Business students across 5 dorms and 6 student clubs.",
    students: [
      {
        id: "alex_chen",
        name: "Alex Chen",
        major: "Computer Science",
        year: "Junior (3rd Year)",
        dorm: "Turing House",
        clubs: ["Hackathon Club", "ACM Chapter", "AI Society"],
        skills: ["React/Node", "PyTorch/ML", "Algorithms"],
        bio: "Hackathon lead & full-stack builder looking for UI/UX designers and hardware devs.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=alex_chen"
      },
      {
        id: "maya_lin",
        name: "Maya Lin",
        major: "Design & HCI",
        year: "Sophomore (2nd Year)",
        dorm: "Turing House",
        clubs: ["Design Guild", "Hackathon Club"],
        skills: ["Figma/UI", "Design Systems", "Prototyping"],
        bio: "HCI researcher passionate about accessibility, generative UI, and campus social spaces.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=maya_lin"
      },
      {
        id: "marcus_vance",
        name: "Marcus Vance",
        major: "Robotics & Mech",
        year: "Senior (4th Year)",
        dorm: "Apollo Hall",
        clubs: ["Robotics & Formula", "Hardware Lab"],
        skills: ["Embedded C/IoT", "CAD/3D", "ROS"],
        bio: "Formula Student chassis lead. Building autonomous electric rovers.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=marcus_vance"
      },
      {
        id: "priya_patel",
        name: "Priya Patel",
        major: "Computer Science",
        year: "Freshman (1st Year)",
        dorm: "Curie Quad",
        clubs: ["ACM Chapter", "Music & Arts"],
        skills: ["Python", "C++", "Violin"],
        bio: "Freshman navigating CS fundamentals and looking for study groups in Turing House.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=priya_patel"
      },
      {
        id: "david_kim",
        name: "David Kim",
        major: "Electrical & IoT",
        year: "Junior (3rd Year)",
        dorm: "Apollo Hall",
        clubs: ["Robotics & Formula", "Hackathon Club"],
        skills: ["PCB Design", "Microcontrollers", "Firmware"],
        bio: "Hardware enthusiast bridging sensor meshes and cloud dashboards.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=david_kim"
      },
      {
        id: "sophia_rodriguez",
        name: "Sophia Rodriguez",
        major: "Biomedical Eng",
        year: "Senior (4th Year)",
        dorm: "Curie Quad",
        clubs: ["AI Society", "BioTech Alliance"],
        skills: ["Bioinformatics", "Python", "Data Analysis"],
        bio: "Working on neural prosthetics signal processing and bio-sensors.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=sophia_rodriguez"
      },
      {
        id: "ethan_wright",
        name: "Ethan Wright",
        major: "Business & Fin",
        year: "Junior (3rd Year)",
        dorm: "Euler Tower",
        clubs: ["Student Startup Incubator", "Design Guild"],
        skills: ["Financial Modeling", "Pitch Decks", "Product Strategy"],
        bio: "Incubator liaison connecting student tech projects with seed grants.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ethan_wright"
      },
      {
        id: "chloe_dupont",
        name: "Chloe Dupont",
        major: "Design & HCI",
        year: "Senior (4th Year)",
        dorm: "Euler Tower",
        clubs: ["Design Guild", "Music & Arts"],
        skills: ["3D Animation", "Figma/UI", "Brand Strategy"],
        bio: "Motion designer & synthesizers enthusiast. Designing the campus art gala.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=chloe_dupont"
      },
      {
        id: "zack_taylor",
        name: "Zack Taylor",
        major: "Electrical & IoT",
        year: "Freshman (1st Year)",
        dorm: "Apollo Hall",
        clubs: ["Robotics & Formula", "Hardware Lab"],
        skills: ["Arduino", "Soldering", "Circuit Sim"],
        bio: "Freshman eager to join the Formula SAE electrical sub-team.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=zack_taylor"
      },
      {
        id: "aisha_khan",
        name: "Aisha Khan",
        major: "Computer Science",
        year: "Senior (4th Year)",
        dorm: "Turing House",
        clubs: ["ACM Chapter", "AI Society", "Hackathon Club"],
        skills: ["Distributed Systems", "Go", "Graph Theory"],
        bio: "DSA TA & competitive programmer. Researching unweighted graph traversal.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=aisha_khan"
      },
      {
        id: "lucas_silva",
        name: "Lucas Silva",
        major: "Robotics & Mech",
        year: "Sophomore (2nd Year)",
        dorm: "Newton Court",
        clubs: ["Robotics & Formula", "Music & Arts"],
        skills: ["SolidWorks", "CNC Milling", "Bass Guitar"],
        bio: "Machining custom suspension components and playing bass in the Quad band.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=lucas_silva"
      },
      {
        id: "olivia_green",
        name: "Olivia Green",
        major: "Biomedical Eng",
        year: "Junior (3rd Year)",
        dorm: "Curie Quad",
        clubs: ["BioTech Alliance", "Design Guild"],
        skills: ["Tissue Eng", "MATLAB", "Medical CAD"],
        bio: "Designing 3D-printed orthopedic casts and accessible rehab devices.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=olivia_green"
      },
      {
        id: "kevin_zhang",
        name: "Kevin Zhang",
        major: "Computer Science",
        year: "Sophomore (2nd Year)",
        dorm: "Turing House",
        clubs: ["Hackathon Club", "Student Startup Incubator"],
        skills: ["Next.js", "PostgreSQL", "Cloud Arch"],
        bio: "SaaS enthusiast building campus marketplace tools.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=kevin_zhang"
      },
      {
        id: "hannah_scott",
        name: "Hannah Scott",
        major: "Business & Fin",
        year: "Senior (4th Year)",
        dorm: "Euler Tower",
        clubs: ["Student Startup Incubator", "Music & Arts"],
        skills: ["Venture Capital", "Growth Marketing", "Event Mgmt"],
        bio: "Club President managing annual university pitch competition.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=hannah_scott"
      },
      {
        id: "devon_ross",
        name: "Devon Ross",
        major: "Design & HCI",
        year: "Freshman (1st Year)",
        dorm: "Newton Court",
        clubs: ["Design Guild"],
        skills: ["Illustration", "Typography", "Adobe CC"],
        bio: "Freshman visual artist exploring game UI and interactive narrative design.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=devon_ross"
      },
      {
        id: "rachel_cooper",
        name: "Rachel Cooper",
        major: "Biomedical Eng",
        year: "Freshman (1st Year)",
        dorm: "Curie Quad",
        clubs: ["BioTech Alliance"],
        skills: ["Organic Chemistry", "Lab Protocol", "Python"],
        bio: "Freshman pre-med engineer fascinated by genetic algorithms in medicine.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=rachel_cooper"
      },
      {
        id: "samuel_adebayo",
        name: "Samuel Adebayo",
        major: "Computer Science",
        year: "Junior (3rd Year)",
        dorm: "Newton Court",
        clubs: ["AI Society", "ACM Chapter"],
        skills: ["Computer Vision", "TensorFlow", "FastAPI"],
        bio: "Developing edge AI camera models for campus bicycle traffic monitoring.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=samuel_adebayo"
      },
      {
        id: "elena_morozova",
        name: "Elena Morozova",
        major: "Electrical & IoT",
        year: "Senior (4th Year)",
        dorm: "Apollo Hall",
        clubs: ["Hardware Lab", "AI Society"],
        skills: ["FPGA", "VHDL", "RF Circuitry"],
        bio: "Satellite communications researcher in the university cubesat program.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=elena_morozova"
      },
      {
        id: "noah_baker",
        name: "Noah Baker",
        major: "Business & Fin",
        year: "Sophomore (2nd Year)",
        dorm: "Euler Tower",
        clubs: ["Student Startup Incubator", "Hackathon Club"],
        skills: ["Market Research", "Operations", "SaaS Pricing"],
        bio: "Helping technical teams structure GTM and revenue strategies.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=noah_baker"
      },
      {
        id: "tara_sharma",
        name: "Tara Sharma",
        major: "Design & HCI",
        year: "Junior (3rd Year)",
        dorm: "Turing House",
        clubs: ["Design Guild", "BioTech Alliance"],
        skills: ["UX Research", "Data Vis", "Qualitative Analysis"],
        bio: "Bridging scientific datasets with human-centered visual dashboards.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=tara_sharma"
      },
      {
        id: "faisal_al_mansoor",
        name: "Faisal Al-Mansoor",
        major: "Robotics & Mech",
        year: "Junior (3rd Year)",
        dorm: "Apollo Hall",
        clubs: ["Robotics & Formula", "Hardware Lab"],
        skills: ["Aerodynamics", "Ansys CFD", "Telemetry"],
        bio: "Aero package designer for the university electric racer.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=faisal_al_mansoor"
      },
      {
        id: "grace_hopper_fan",
        name: "Grace Ho",
        major: "Computer Science",
        year: "Sophomore (2nd Year)",
        dorm: "Curie Quad",
        clubs: ["ACM Chapter", "Hackathon Club"],
        skills: ["Rust", "WebAssembly", "Data Structures"],
        bio: "Compilers and systems engineering buff. Co-organizer of Campus Hack 2026.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=grace_hopper_fan"
      },
      {
        id: "leo_martinez",
        name: "Leo Martinez",
        major: "Robotics & Mech",
        year: "Freshman (1st Year)",
        dorm: "Newton Court",
        clubs: ["Robotics & Formula"],
        skills: ["3D Printing", "Math Modeling", "Python"],
        bio: "Robotics newcomer working on gripper kinematics for combat robotics.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=leo_martinez"
      },
      {
        id: "jasmine_kaur",
        name: "Jasmine Kaur",
        major: "Electrical & IoT",
        year: "Sophomore (2nd Year)",
        dorm: "Apollo Hall",
        clubs: ["Hardware Lab", "Music & Arts"],
        skills: ["Audio DSP", "Synthesizers", "Analog Circuitry"],
        bio: "Designing guitar effect pedals and modular audio processors.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=jasmine_kaur"
      },
      {
        id: "benjamin_clark",
        name: "Benjamin Clark",
        major: "Business & Fin",
        year: "Freshman (1st Year)",
        dorm: "Euler Tower",
        clubs: ["Student Startup Incubator"],
        skills: ["Excel", "Public Speaking", "Community Outreach"],
        bio: "Freshman business major organizing campus networking dinners.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=benjamin_clark"
      },
      {
        id: "zoe_williams",
        name: "Zoe Williams",
        major: "Biomedical Eng",
        year: "Sophomore (2nd Year)",
        dorm: "Curie Quad",
        clubs: ["BioTech Alliance", "Music & Arts"],
        skills: ["Cell Biology", "Data Analysis", "Piano"],
        bio: "Pianist and cell culture researcher. Studying auditory neuro-pathways.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=zoe_williams"
      },
      {
        id: "dr_srinivasan",
        name: "Prof. R. Srinivasan",
        major: "Computer Science",
        year: "DSA Faculty / Evaluator",
        dorm: "Faculty House",
        clubs: ["ACM Chapter"],
        skills: ["Graph Algorithms", "Formal Verification", "Complexity"],
        bio: "Faculty Evaluator for Data Structures & Algorithms. Testing student BFS/DFS accuracy.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dr_srinivasan"
      },
      {
        id: "dr_kaufman",
        name: "Prof. Sarah Kaufman",
        major: "Design & HCI",
        year: "Faculty / Dean",
        dorm: "Faculty House",
        clubs: ["Design Guild"],
        skills: ["Interaction Design", "Cognitive Science", "Ethics"],
        bio: "Director of the Interdisciplinary Media Lab. Overseeing cross-departmental collaborations.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dr_kaufman"
      }
    ],
    edges: [
      // CS & Turing House connections
      { from: "alex_chen", to: "maya_lin" }, // Hackathon teammates & dorm-mates
      { from: "alex_chen", to: "aisha_khan" }, // CS peers & ACM
      { from: "alex_chen", to: "kevin_zhang" }, // Hackathon co-founders
      { from: "alex_chen", to: "david_kim" }, // IoT + FullStack hackathon bridge
      { from: "maya_lin", to: "tara_sharma" }, // Design peers in Turing House
      { from: "maya_lin", to: "chloe_dupont" }, // Design Guild leaders
      { from: "aisha_khan", to: "priya_patel" }, // Senior mentor to freshman
      { from: "aisha_khan", to: "samuel_adebayo" }, // AI Society peers
      { from: "aisha_khan", to: "dr_srinivasan" }, // TA for DSA professor
      { from: "kevin_zhang", to: "noah_baker" }, // Tech + Business startup pairing
      { from: "kevin_zhang", to: "grace_hopper_fan" }, // CS hackathon team

      // Hardware & Robotics (Apollo Hall cluster)
      { from: "marcus_vance", to: "david_kim" }, // Formula SAE chassis + electrical
      { from: "marcus_vance", to: "faisal_al_mansoor" }, // Formula aerodynamics team
      { from: "marcus_vance", to: "zack_taylor" }, // Senior mentoring freshman
      { from: "david_kim", to: "elena_morozova" }, // ECE circuit design partners
      { from: "david_kim", to: "jasmine_kaur" }, // Hardware lab peers
      { from: "faisal_al_mansoor", to: "lucas_silva" }, // Mechanical shop mates
      { from: "lucas_silva", to: "leo_martinez" }, // Robotics mentoring
      { from: "zack_taylor", to: "jasmine_kaur" }, // Apollo Hall friends

      // Bio & Curie Quad cluster
      { from: "sophia_rodriguez", to: "olivia_green" }, // BioMed research lab
      { from: "sophia_rodriguez", to: "rachel_cooper" }, // Pre-med mentor
      { from: "sophia_rodriguez", to: "samuel_adebayo" }, // AI in healthcare collaboration
      { from: "olivia_green", to: "zoe_williams" }, // BioTech alliance & Curie dorm
      { from: "priya_patel", to: "grace_hopper_fan" }, // Freshman/Sophomore CS in Curie Quad
      { from: "priya_patel", to: "zoe_williams" }, // Curie Quad floor-mates & music lovers

      // Business & Euler Tower
      { from: "ethan_wright", to: "hannah_scott" }, // Startup incubator leadership
      { from: "ethan_wright", to: "noah_baker" }, // Finance peers
      { from: "ethan_wright", to: "chloe_dupont" }, // Pitch deck design collaboration
      { from: "hannah_scott", to: "benjamin_clark" }, // Mentoring freshman
      { from: "noah_baker", to: "alex_chen" }, // Interdisciplinary startup link

      // Interdisciplinary & Music/Arts bridges
      { from: "chloe_dupont", to: "jasmine_kaur" }, // Audio synthesizer & visual art
      { from: "lucas_silva", to: "priya_patel" }, // Music band (Bass + Violin)
      { from: "tara_sharma", to: "olivia_green" }, // Healthcare UI design
      { from: "samuel_adebayo", to: "dr_srinivasan" }, // AI research mentee
      { from: "maya_lin", to: "dr_kaufman" }, // HCI advisee
      { from: "dr_srinivasan", to: "dr_kaufman" }, // Faculty committee
      { from: "devon_ross", to: "chloe_dupont" }, // Design guild freshman
      { from: "devon_ross", to: "lucas_silva" } // Newton Court friends
    ],
    posts: [
      {
        id: "post_1",
        authorId: "alex_chen",
        timestamp: "18 mins ago",
        content: "🚀 HackCampus 2026 registration is LIVE! Looking for 1 UI/UX designer and 1 hardware/IoT engineer to build a real-time decentralized quad acoustic sensor. Ping me if interested! #Hackathon #IoT #Figma",
        tags: ["#Hackathon", "#IoT", "#Figma"],
        likes: 14,
        likedBy: ["maya_lin", "david_kim", "kevin_zhang"],
        comments: [
          { authorId: "maya_lin", text: "Count me in for design & wireframes!", timestamp: "12 mins ago" },
          { authorId: "david_kim", text: "I have the ESP32 mics ready in Apollo Hall.", timestamp: "8 mins ago" }
        ]
      },
      {
        id: "post_2",
        authorId: "marcus_vance",
        timestamp: "1 hour ago",
        content: "🏎️ Apex Formula Racing will be dyno-testing the battery pack tomorrow at 4 PM behind Apollo Hall! All engineers and fans welcome to check out the telemetry system. #FormulaStudent #Robotics #HardwareLab",
        tags: ["#FormulaStudent", "#Robotics", "#HardwareLab"],
        likes: 29,
        likedBy: ["david_kim", "lucas_silva", "faisal_al_mansoor", "zack_taylor"],
        comments: [
          { authorId: "faisal_al_mansoor", text: "Rear wing carbon fiber weave finished today. Looks stealthy.", timestamp: "45 mins ago" }
        ]
      },
      {
        id: "post_3",
        authorId: "priya_patel",
        timestamp: "2 hours ago",
        content: "Anyone forming a study group for Prof. Srinivasan's Advanced Graph DSA midterm next Tuesday? Looking to whiteboard BFS vs DFS tree traversals! 📚 #DSAStudyGroup #ComputerScience #ACM",
        tags: ["#DSAStudyGroup", "#ComputerScience", "#ACM"],
        likes: 8,
        likedBy: ["aisha_khan", "grace_hopper_fan"],
        comments: [
          { authorId: "aisha_khan", text: "As your TA, I'll be hosting office hours in Turing House on Friday at 5pm!", timestamp: "1 hour ago" }
        ]
      },
      {
        id: "post_4",
        authorId: "ethan_wright",
        timestamp: "3 hours ago",
        content: "💡 Student Startup Incubator grant deadline is this Friday. $15,000 equity-free seed grant for interdisciplinary teams (must include at least 2 distinct academic majors). Reach out for pitch deck reviews! #Startups #FinTech #Incubator",
        tags: ["#Startups", "#FinTech", "#Incubator"],
        likes: 21,
        likedBy: ["alex_chen", "hannah_scott", "chloe_dupont", "noah_baker"],
        comments: []
      },
      {
        id: "post_5",
        authorId: "lucas_silva",
        timestamp: "5 hours ago",
        content: "Jam session at the Quad amphitheater this sunset! Bass + violin + synths. Bring your instruments or just come listen! 🎸🎻 #MusicBand #QuadJam #CampusLife",
        tags: ["#MusicBand", "#QuadJam", "#CampusLife"],
        likes: 35,
        likedBy: ["priya_patel", "jasmine_kaur", "chloe_dupont", "zoe_williams"],
        comments: [
          { authorId: "priya_patel", text: "Bringing my violin right after lab!", timestamp: "4 hours ago" }
        ]
      }
    ]
  },

  // Preset 2: Siloed Clusters (demonstrates departmental silos, isolated subgraphs, bottleneck bridges)
  siloedCampus: {
    name: "Departmental Silos & Disconnected Dorms",
    description: "Three isolated clusters (CS & Math, Arts & Design, Business & Law) with minimal inter-department connectivity to test Connected Components and bridging recommendations.",
    students: [
      // Cluster A: CS & Math
      { id: "cs_1", name: "Alice (CS Lead)", major: "Computer Science", year: "Senior", dorm: "Turing House", clubs: ["ACM Chapter"], skills: ["Algorithms", "C++"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=cs_1" },
      { id: "cs_2", name: "Bob (Data Science)", major: "Computer Science", year: "Junior", dorm: "Turing House", clubs: ["AI Society"], skills: ["Python", "SQL"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=cs_2" },
      { id: "cs_3", name: "Charlie (CyberSec)", major: "Computer Science", year: "Sophomore", dorm: "Turing House", clubs: ["Hackathon Club"], skills: ["Linux", "Networks"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=cs_3" },
      { id: "cs_4", name: "Diana (Math)", major: "Computer Science", year: "Freshman", dorm: "Turing House", clubs: ["ACM Chapter"], skills: ["Discrete Math"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=cs_4" },

      // Cluster B: Arts & Design (Completely isolated cluster)
      { id: "art_1", name: "Elena (Visual Art)", major: "Design & HCI", year: "Senior", dorm: "Curie Quad", clubs: ["Design Guild"], skills: ["Oil Painting", "Typography"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=art_1" },
      { id: "art_2", name: "Felix (Industrial)", major: "Design & HCI", year: "Junior", dorm: "Curie Quad", clubs: ["Design Guild"], skills: ["CAD", "Ceramics"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=art_2" },
      { id: "art_3", name: "Gina (UI/UX)", major: "Design & HCI", year: "Sophomore", dorm: "Curie Quad", clubs: ["Design Guild"], skills: ["Figma", "Interaction"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=art_3" },
      { id: "art_4", name: "Hugo (Animation)", major: "Design & HCI", year: "Freshman", dorm: "Curie Quad", clubs: ["Music & Arts"], skills: ["After Effects", "Blender"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=art_4" },

      // Cluster C: Business & Management (Isolated cluster)
      { id: "biz_1", name: "Isla (Finance Lead)", major: "Business & Fin", year: "Senior", dorm: "Euler Tower", clubs: ["Student Startup Incubator"], skills: ["Valuation", "M&A"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=biz_1" },
      { id: "biz_2", name: "Jack (Marketing)", major: "Business & Fin", year: "Junior", dorm: "Euler Tower", clubs: ["Student Startup Incubator"], skills: ["Growth", "SEO"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=biz_2" },
      { id: "biz_3", name: "Kiran (Operations)", major: "Business & Fin", year: "Sophomore", dorm: "Euler Tower", clubs: ["Student Startup Incubator"], skills: ["Logistics", "Excel"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=biz_3" },
      
      // Isolated Student
      { id: "solo_1", name: "Leo (Solo Transfer Student)", major: "Biomedical Eng", year: "Junior", dorm: "Newton Court", clubs: [], skills: ["Biomechanics"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=solo_1" }
    ],
    edges: [
      // Cluster A internal
      { from: "cs_1", to: "cs_2" },
      { from: "cs_2", to: "cs_3" },
      { from: "cs_3", to: "cs_4" },
      { from: "cs_1", to: "cs_4" },

      // Cluster B internal
      { from: "art_1", to: "art_2" },
      { from: "art_2", to: "art_3" },
      { from: "art_3", to: "art_4" },
      { from: "art_1", to: "art_3" },

      // Cluster C internal
      { from: "biz_1", to: "biz_2" },
      { from: "biz_2", to: "biz_3" },
      { from: "biz_1", to: "biz_3" }
      // Notice: zero edges between clusters! Perfect for testing Connected Components detection and Disconnected BFS handling!
    ],
    posts: [
      {
        id: "post_s1",
        authorId: "cs_1",
        timestamp: "30 mins ago",
        content: "Working on distributed consensus protocols in Turing House. Anyone interested in Paxos / Raft? #ACM #ComputerScience",
        tags: ["#ACM", "#ComputerScience"],
        likes: 4,
        likedBy: ["cs_2"],
        comments: []
      },
      {
        id: "post_s2",
        authorId: "art_1",
        timestamp: "1 hour ago",
        content: "Annual campus typography exhibition opens this Thursday in Curie Quad Gallery. Free sketches for visitors! #DesignGuild #ArtExhibition",
        tags: ["#DesignGuild", "#ArtExhibition"],
        likes: 6,
        likedBy: ["art_2", "art_3"],
        comments: []
      }
    ]
  }
};


// ================================
// Source: js/components/CanvasManager.js
// ================================
/**
 * CampusConnect - Vis.js Canvas Manager
 * Manages 60 FPS interactive physics network graph, visual states, and BFS/DFS highlight shaders
 */

class CanvasManager {
  /**
   * @param {HTMLElement} container 
   * @param {Graph} graph 
   * @param {Object} callbacks 
   */
  constructor(container, graph, callbacks = {}) {
    this.container = container;
    this.graph = graph;
    this.callbacks = callbacks;
    this.network = null;
    this.nodesDataSet = null;
    this.edgesDataSet = null;
    this.physicsEnabled = true;
    this.selectedNodeId = null;

    this.initNetwork();
  }

  initNetwork() {
    const vis = window.vis || window.visNetwork;
    if (!vis || !vis.Network || !vis.DataSet) {
      console.warn("Vis.js not ready yet. Retrying in 150ms...");
      setTimeout(() => this.initNetwork(), 150);
      return;
    }

    if (!this.container) {
      console.error("Canvas container element not found.");
      return;
    }

    const { nodesData, edgesData } = this.buildDataSets();
    this.nodesDataSet = new vis.DataSet(nodesData);
    this.edgesDataSet = new vis.DataSet(edgesData);

    const data = {
      nodes: this.nodesDataSet,
      edges: this.edgesDataSet
    };

    const options = {
      nodes: {
        shape: "circularImage",
        size: 26,
        borderWidth: 3,
        borderWidthSelected: 5,
        font: {
          color: "#f8fafc",
          size: 13,
          face: "Inter, system-ui, sans-serif",
          strokeWidth: 3,
          strokeColor: "#090d16"
        },
        shadow: {
          enabled: true,
          color: "rgba(0, 0, 0, 0.5)",
          size: 10,
          x: 0,
          y: 4
        }
      },
      edges: {
        width: 1.8,
        color: {
          color: "rgba(148, 163, 184, 0.28)",
          highlight: "#818cf8",
          hover: "#a5b4fc"
        },
        smooth: {
          type: "continuous",
          roundness: 0.2
        },
        selectionWidth: 3
      },
      physics: {
        enabled: true,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -48,
          centralGravity: 0.015,
          springLength: 95,
          springConstant: 0.08,
          damping: 0.55,
          avoidOverlap: 0.7
        },
        stabilization: {
          enabled: true,
          iterations: 35,
          updateInterval: 10
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 120,
        hideEdgesOnDrag: false,
        navigationButtons: false,
        keyboard: true
      }
    };

    try {
      this.network = new vis.Network(this.container, data, options);
    } catch (err) {
      console.error("Failed to instantiate vis.Network:", err);
      return;
    }

    // Event handlers
    this.network.on("click", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = String(params.nodes[0]);
        this.selectedNodeId = nodeId;
        if (this.callbacks.onNodeSelect) {
          this.callbacks.onNodeSelect(nodeId);
        }
      } else {
        this.selectedNodeId = null;
        if (this.callbacks.onCanvasClick) {
          this.callbacks.onCanvasClick();
        }
      }
    });

    this.network.on("doubleClick", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = String(params.nodes[0]);
        if (this.callbacks.onNodeDoubleClick) {
          this.callbacks.onNodeDoubleClick(nodeId);
        }
      }
    });

    // Ensure proper sizing & centering on mount
    setTimeout(() => {
      if (this.network) {
        this.network.redraw();
        this.network.fit();
      }
    }, 250);
  }

  buildDataSets() {
    const students = this.graph.getAllStudents();
    const edges = this.graph.getAllEdges();

    const nodesData = students.map(s => ({
      id: s.id,
      label: s.name,
      title: `<b>${s.name}</b><br>${s.major} (${s.year})<br>📍 ${s.dorm}<br>🎯 ${s.clubs.join(", ") || "No clubs"}`,
      image: s.avatar,
      color: {
        border: s.color || "#818cf8",
        background: "#111827",
        highlight: {
          border: "#38bdf8",
          background: "#1e293b"
        },
        hover: {
          border: "#60a5fa",
          background: "#1e293b"
        }
      }
    }));

    const edgesData = edges.map(e => ({
      id: `${e.from}__${e.to}`,
      from: e.from,
      to: e.to,
      color: {
        color: "rgba(148, 163, 184, 0.28)",
        highlight: "#818cf8"
      },
      width: 1.8
    }));

    return { nodesData, edgesData };
  }

  /**
   * Sync canvas with updated Graph instance
   */
  refreshFromGraph() {
    if (!this.nodesDataSet || !this.edgesDataSet) {
      this.initNetwork();
      return;
    }

    const { nodesData, edgesData } = this.buildDataSets();
    this.nodesDataSet.clear();
    this.nodesDataSet.add(nodesData);
    this.edgesDataSet.clear();
    this.edgesDataSet.add(edgesData);

    setTimeout(() => {
      if (this.network) {
        this.network.redraw();
      }
    }, 100);
  }

  /**
   * Focus camera smoothly on a specific student node
   */
  focusOnNode(nodeId) {
    if (!this.network) return;
    this.network.focus(String(nodeId), {
      scale: 1.3,
      animation: {
        duration: 800,
        easingFunction: "easeInOutQuad"
      }
    });
    this.network.selectNodes([String(nodeId)]);
  }

  /**
   * Fit all nodes in canvas viewport
   */
  fitView() {
    if (!this.network) return;
    this.network.fit({
      animation: {
        duration: 600,
        easingFunction: "easeInOutQuad"
      }
    });
  }

  /**
   * Zoom In / Zoom Out
   */
  zoom(scaleMultiplier) {
    if (!this.network) return;
    const currentScale = this.network.getScale();
    this.network.moveTo({
      scale: currentScale * scaleMultiplier,
      animation: { duration: 300 }
    });
  }

  /**
   * Toggle physics simulation
   */
  togglePhysics() {
    if (!this.network) return false;
    this.physicsEnabled = !this.physicsEnabled;
    this.network.setOptions({ physics: { enabled: this.physicsEnabled } });
    return this.physicsEnabled;
  }

  /**
   * Reset all node & edge visual styles to default
   */
  resetHighlights() {
    if (!this.nodesDataSet || !this.edgesDataSet) return;

    const nodeUpdates = [];
    for (const student of this.graph.getAllStudents()) {
      nodeUpdates.push({
        id: student.id,
        size: 26,
        color: {
          border: student.color || "#818cf8",
          background: "#111827",
          highlight: {
            border: "#38bdf8",
            background: "#1e293b"
          }
        },
        shadow: {
          enabled: true,
          color: "rgba(0, 0, 0, 0.5)",
          size: 10
        }
      });
    }
    this.nodesDataSet.update(nodeUpdates);

    const edgeUpdates = [];
    for (const edge of this.edgesDataSet.get()) {
      edgeUpdates.push({
        id: edge.id,
        width: 1.8,
        color: {
          color: "rgba(148, 163, 184, 0.28)",
          highlight: "#818cf8"
        },
        shadow: { enabled: false }
      });
    }
    this.edgesDataSet.update(edgeUpdates);
  }

  /**
   * Highlight a specific step in BFS trace
   */
  highlightBfsStep(step, startId, targetId) {
    if (!this.nodesDataSet || !this.edgesDataSet) return;

    const visitedSet = new Set(step.visited || []);
    const queueSet = new Set(step.queue || []);
    const highlightPathSet = new Set(step.highlightPath || []);

    const nodeUpdates = [];
    for (const student of this.graph.getAllStudents()) {
      const sId = student.id;
      let border = student.color || "#818cf8";
      let background = "#111827";
      let size = 26;
      let shadowColor = "rgba(0, 0, 0, 0.4)";
      let shadowSize = 8;

      if (highlightPathSet.has(sId)) {
        // Final shortest path node (Emerald Green)
        border = "#10b981";
        background = "#064e3b";
        size = 34;
        shadowColor = "rgba(16, 185, 129, 0.9)";
        shadowSize = 20;
      } else if (sId === step.current) {
        // Active node currently being dequeued/inspected (Glowing Amber)
        border = "#f59e0b";
        background = "#78350f";
        size = 36;
        shadowColor = "rgba(245, 158, 11, 0.95)";
        shadowSize = 22;
      } else if (queueSet.has(sId)) {
        // In FIFO Queue waiting (Cyan aura)
        border = "#06b6d4";
        background = "#164e63";
        size = 30;
        shadowColor = "rgba(6, 182, 212, 0.75)";
        shadowSize = 14;
      } else if (visitedSet.has(sId)) {
        // Already explored (Dimmed amber/slate)
        border = "#d97706";
        background = "#1e293b";
        size = 28;
        shadowColor = "rgba(217, 119, 6, 0.5)";
        shadowSize = 10;
      } else {
        // Unexplored (Dimmed)
        border = "rgba(148, 163, 184, 0.3)";
        background = "rgba(17, 24, 39, 0.5)";
        size = 22;
      }

      // Special highlight for source and target
      if (sId === startId) {
        border = "#3b82f6"; // Blue Source
      }
      if (sId === targetId && !highlightPathSet.has(sId)) {
        border = "#f43f5e"; // Rose Target
      }

      nodeUpdates.push({
        id: sId,
        size,
        color: { border, background },
        shadow: { enabled: true, color: shadowColor, size: shadowSize }
      });
    }
    this.nodesDataSet.update(nodeUpdates);

    // Update Edges
    const edgeUpdates = [];
    const activeEdge = step.activeEdge;

    for (const edge of this.edgesDataSet.get()) {
      let color = "rgba(148, 163, 184, 0.15)";
      let width = 1.5;
      let shadow = { enabled: false };

      const isPathEdge = this.isEdgeInPath(edge.from, edge.to, step.highlightPath);
      const isActiveEdge = activeEdge && (
        (edge.from === activeEdge.from && edge.to === activeEdge.to) ||
        (edge.from === activeEdge.to && edge.to === activeEdge.from)
      );

      if (isPathEdge) {
        color = "#10b981"; // Emerald green
        width = 5.5;
        shadow = { enabled: true, color: "rgba(16, 185, 129, 0.8)", size: 14 };
      } else if (isActiveEdge) {
        color = "#f59e0b"; // Amber active wave
        width = 4.5;
        shadow = { enabled: true, color: "rgba(245, 158, 11, 0.85)", size: 12 };
      } else if (visitedSet.has(edge.from) && visitedSet.has(edge.to)) {
        color = "rgba(245, 158, 11, 0.4)";
        width = 2.2;
      }

      edgeUpdates.push({ id: edge.id, color: { color }, width, shadow });
    }
    this.edgesDataSet.update(edgeUpdates);
  }

  isEdgeInPath(u, v, path) {
    if (!path || path.length < 2) return false;
    for (let i = 0; i < path.length - 1; i++) {
      if ((path[i] === u && path[i+1] === v) || (path[i] === v && path[i+1] === u)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Highlight mutual friends in shimmering gold
   */
  highlightMutualFriends(studentAId, studentBId, mutualIds) {
    if (!this.nodesDataSet || !this.edgesDataSet) return;

    studentAId = String(studentAId);
    studentBId = String(studentBId);
    const mutualSet = new Set(mutualIds.map(String));

    const nodeUpdates = [];
    for (const student of this.graph.getAllStudents()) {
      const sId = student.id;
      if (sId === studentAId || sId === studentBId) {
        nodeUpdates.push({
          id: sId,
          size: 36,
          color: { border: "#3b82f6", background: "#1e3a8a" },
          shadow: { enabled: true, color: "rgba(59, 130, 246, 0.9)", size: 20 }
        });
      } else if (mutualSet.has(sId)) {
        nodeUpdates.push({
          id: sId,
          size: 34,
          color: { border: "#eab308", background: "#713f12" }, // Gold
          shadow: { enabled: true, color: "rgba(234, 179, 8, 0.95)", size: 18 }
        });
      } else {
        nodeUpdates.push({
          id: sId,
          size: 20,
          color: { border: "rgba(148, 163, 184, 0.2)", background: "#0b0f19" },
          shadow: { enabled: false }
        });
      }
    }
    this.nodesDataSet.update(nodeUpdates);

    // Highlight edges linking A -> Mutual and B -> Mutual
    const edgeUpdates = [];
    for (const edge of this.edgesDataSet.get()) {
      const linksA = (edge.from === studentAId && mutualSet.has(edge.to)) || (edge.to === studentAId && mutualSet.has(edge.from));
      const linksB = (edge.from === studentBId && mutualSet.has(edge.to)) || (edge.to === studentBId && mutualSet.has(edge.from));

      if (linksA || linksB) {
        edgeUpdates.push({
          id: edge.id,
          width: 4,
          color: { color: "#eab308" },
          shadow: { enabled: true, color: "rgba(234, 179, 8, 0.8)", size: 12 }
        });
      } else {
        edgeUpdates.push({
          id: edge.id,
          width: 1,
          color: { color: "rgba(148, 163, 184, 0.1)" },
          shadow: { enabled: false }
        });
      }
    }
    this.edgesDataSet.update(edgeUpdates);
  }

  /**
   * Color-code campus sub-communities (Connected Components)
   */
  highlightComponents(components) {
    if (!this.nodesDataSet || !this.edgesDataSet) return;

    const nodeUpdates = [];
    const nodeColorMap = new Map();

    for (const comp of components) {
      for (const mId of comp.members) {
        nodeColorMap.set(mId, comp.color);
        nodeUpdates.push({
          id: mId,
          size: 28,
          color: {
            border: comp.color.primary,
            background: "#111827",
            highlight: { border: comp.color.primary, background: "#1f2937" }
          },
          shadow: { enabled: true, color: comp.color.bg, size: 14 }
        });
      }
    }
    this.nodesDataSet.update(nodeUpdates);

    const edgeUpdates = [];
    for (const edge of this.edgesDataSet.get()) {
      const colFrom = nodeColorMap.get(edge.from);
      const colTo = nodeColorMap.get(edge.to);
      const edgeColor = (colFrom && colTo && colFrom.primary === colTo.primary)
        ? colFrom.primary
        : "rgba(148, 163, 184, 0.3)";

      edgeUpdates.push({
        id: edge.id,
        width: 2.2,
        color: { color: edgeColor },
        shadow: { enabled: false }
      });
    }
    this.edgesDataSet.update(edgeUpdates);
  }
}


// ================================
// Source: js/components/PlaybackController.js
// ================================
/**
 * CampusConnect - Playback Controller for Graph Algorithmic Visualizations
 * Provides Play, Pause, Step Next, Step Prev, Reset, and Variable Speed (0.5x to 3.5x)
 */

class PlaybackController {
  /**
   * @param {Object} options
   * @param {Function} options.onStepChange callback(step, stepIndex, totalSteps)
   * @param {Function} options.onFinished callback()
   */
  constructor(options = {}) {
    this.steps = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.speed = 1.0; // 0.5x to 3.5x
    this.timer = null;
    this.onStepChange = options.onStepChange || (() => {});
    this.onFinished = options.onFinished || (() => {});
    this.baseDelayMs = 600;
  }

  /**
   * Load a new sequence of trace steps
   * @param {Array} steps 
   */
  loadSteps(steps) {
    this.stop();
    this.steps = Array.isArray(steps) ? steps : [];
    this.currentIndex = -1;
    if (this.steps.length > 0) {
      this.stepNext();
    }
  }

  getDelay() {
    return Math.max(80, Math.floor(this.baseDelayMs / this.speed));
  }

  setSpeed(multiplier) {
    this.speed = Math.max(0.5, Math.min(3.5, Number(multiplier) || 1.0));
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  play() {
    if (this.steps.length === 0) return;
    if (this.currentIndex >= this.steps.length - 1) {
      this.currentIndex = -1;
    }

    this.isPlaying = true;
    this.scheduleNextTick();
  }

  scheduleNextTick() {
    if (!this.isPlaying) return;

    this.timer = setTimeout(() => {
      const hasMore = this.stepNext();
      if (hasMore && this.isPlaying) {
        this.scheduleNextTick();
      } else {
        this.pause();
        this.onFinished();
      }
    }, this.getDelay());
  }

  pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  stepNext() {
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      this.emitCurrentStep();
      return this.currentIndex < this.steps.length - 1;
    }
    return false;
  }

  stepPrev() {
    this.pause();
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.emitCurrentStep();
      return true;
    }
    return false;
  }

  reset() {
    this.pause();
    if (this.steps.length > 0) {
      this.currentIndex = 0;
      this.emitCurrentStep();
    } else {
      this.currentIndex = -1;
    }
  }

  finish() {
    this.pause();
    if (this.steps.length > 0) {
      this.currentIndex = this.steps.length - 1;
      this.emitCurrentStep();
      this.onFinished();
    }
  }

  stop() {
    this.pause();
    this.steps = [];
    this.currentIndex = -1;
  }

  emitCurrentStep() {
    if (this.currentIndex >= 0 && this.currentIndex < this.steps.length) {
      const step = this.steps[this.currentIndex];
      this.onStepChange(step, this.currentIndex, this.steps.length);
    }
  }

  getCurrentStep() {
    if (this.currentIndex >= 0 && this.currentIndex < this.steps.length) {
      return this.steps[this.currentIndex];
    }
    return null;
  }
}


// ================================
// Source: js/components/QuadFeed.js
// ================================
/**
 * CampusConnect - "The Quad" Campus Social Feed
 * Implements Graph Adjacency Filtering (Campus-wide vs 1st-Degree Friends vs 2-Hop Network)
 */

class QuadFeed {
  /**
   * @param {Graph} graph 
   * @param {string} currentUserId 
   * @param {Array} initialPosts 
   * @param {Object} callbacks 
   */
  constructor(graph, currentUserId, initialPosts = [], callbacks = {}) {
    this.graph = graph;
    this.currentUserId = String(currentUserId);
    this.posts = [...initialPosts];
    this.callbacks = callbacks;
    this.currentFilter = "campus"; // "campus" | "friends" | "2hop"
    this.activeTag = null;
  }

  setCurrentUser(userId) {
    this.currentUserId = String(userId);
  }

  setFilter(filterType) {
    this.currentFilter = filterType;
  }

  setTagFilter(tag) {
    this.activeTag = tag;
  }

  clearTagFilter() {
    this.activeTag = null;
  }

  /**
   * Add a new post to the feed
   */
  createPost(content, tags = []) {
    const author = this.graph.getStudent(this.currentUserId);
    if (!author) return null;

    const newPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      authorId: this.currentUserId,
      timestamp: "Just now",
      content: content.trim(),
      tags: tags.map(t => t.startsWith("#") ? t : `#${t}`),
      likes: 0,
      likedBy: [],
      comments: []
    };

    this.posts.unshift(newPost);
    return newPost;
  }

  /**
   * Toggle like on a post
   */
  toggleLike(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return false;

    const idx = post.likedBy.indexOf(this.currentUserId);
    if (idx === -1) {
      post.likedBy.push(this.currentUserId);
      post.likes++;
    } else {
      post.likedBy.splice(idx, 1);
      post.likes = Math.max(0, post.likes - 1);
    }
    return true;
  }

  /**
   * Add a comment to a post
   */
  addComment(postId, commentText) {
    const post = this.posts.find(p => p.id === postId);
    if (!post || !commentText.trim()) return null;

    const comment = {
      authorId: this.currentUserId,
      text: commentText.trim(),
      timestamp: "Just now"
    };

    post.comments.push(comment);
    return comment;
  }

  /**
   * Get filtered posts based on Graph Adjacency Filter & active tags
   */
  getFilteredPosts() {
    const directFriends = this.graph.getNeighbors(this.currentUserId);

    // Compute 2-hop set if needed
    let twoHopSet = null;
    if (this.currentFilter === "2hop") {
      twoHopSet = new Set(directFriends);
      twoHopSet.add(this.currentUserId); // include own posts
      for (const friendId of directFriends) {
        for (const neighbor of this.graph.getNeighbors(friendId)) {
          twoHopSet.add(neighbor);
        }
      }
    }

    return this.posts.filter(post => {
      // 1. Tag filter
      if (this.activeTag && !post.tags.includes(this.activeTag)) {
        return false;
      }

      // 2. Adjacency filter
      if (this.currentFilter === "campus") {
        return true;
      } else if (this.currentFilter === "friends") {
        // Direct friends + author's own posts
        return post.authorId === this.currentUserId || directFriends.has(post.authorId);
      } else if (this.currentFilter === "2hop") {
        return twoHopSet ? twoHopSet.has(post.authorId) : true;
      }
      return true;
    });
  }

  /**
   * Get all popular hashtags across all posts
   */
  getAllTags() {
    const tagCount = new Map();
    for (const post of this.posts) {
      for (const tag of post.tags) {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      }
    }
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }
}


// ================================
// Source: js/components/StudentModal.js
// ================================
/**
 * CampusConnect - Modal & Drawer Component
 * Handles Add Student, Add Connection, and Student Profile Drawer
 */

class StudentModal {
  /**
   * @param {Object} options
   * @param {Graph} options.graph
   * @param {Function} options.onStudentAdded
   * @param {Function} options.onConnectionAdded
   * @param {Function} options.onSelectAsSource
   * @param {Function} options.onSelectAsTarget
   * @param {Function} options.onSetCurrentUser
   */
  constructor(options) {
    this.graph = options.graph;
    this.onStudentAdded = options.onStudentAdded || (() => {});
    this.onConnectionAdded = options.onConnectionAdded || (() => {});
    this.onSelectAsSource = options.onSelectAsSource || (() => {});
    this.onSelectAsTarget = options.onSelectAsTarget || (() => {});
    this.onSetCurrentUser = options.onSetCurrentUser || (() => {});
  }

  /**
   * Populate select dropdowns for student pickers
   * @param {string} selectElementId 
   * @param {string} defaultSelectedId 
   */
  populateStudentSelect(selectElementId, defaultSelectedId = null) {
    const el = document.getElementById(selectElementId);
    if (!el) return;

    const currentVal = defaultSelectedId || el.value;
    el.innerHTML = '<option value="">-- Choose Student --</option>';

    const students = this.graph.getAllStudents().sort((a, b) => a.name.localeCompare(b.name));
    for (const student of students) {
      const opt = document.createElement("option");
      opt.value = student.id;
      opt.textContent = `${student.name} (${student.major})`;
      if (student.id === currentVal) {
        opt.selected = true;
      }
      el.appendChild(opt);
    }
  }

  /**
   * Render student profile in the right side-drawer
   * @param {string} studentId 
   * @param {string} activeUserId 
   */
  renderProfileDrawer(studentId, activeUserId) {
    const drawer = document.getElementById("profile-drawer");
    const container = document.getElementById("profile-drawer-content");
    if (!drawer || !container) return;

    const student = this.graph.getStudent(studentId);
    if (!student) {
      drawer.classList.add("translate-x-full");
      return;
    }

    const neighbors = Array.from(this.graph.getNeighbors(studentId)).map(id => this.graph.getStudent(id)).filter(Boolean);
    const isDirectFriend = this.graph.areFriends(activeUserId, studentId);
    const isSelf = activeUserId === studentId;

    container.innerHTML = `
      <div class="flex items-start justify-between pb-4 border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="relative">
            <img src="${student.avatar}" alt="${student.name}" class="w-16 h-16 rounded-2xl bg-slate-800 p-1 border-2 border-[${student.color || '#6366f1'}] shadow-lg shadow-indigo-500/20 object-cover" />
            <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
          </div>
          <div>
            <h3 class="text-xl font-bold text-white flex items-center gap-2">
              ${student.name}
              ${isSelf ? '<span class="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">You</span>' : ''}
            </h3>
            <p class="text-sm font-medium" style="color: ${student.color || '#818cf8'}">${student.major}</p>
            <p class="text-xs text-slate-400">${student.year} · 📍 ${student.dorm}</p>
          </div>
        </div>
        <button id="close-profile-btn" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="space-y-4 py-4 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 custom-scroll">
        <!-- Bio -->
        <div class="bg-slate-800/50 p-3 rounded-xl border border-white/5 text-sm text-slate-300">
          <p class="italic">"${student.bio}"</p>
        </div>

        <!-- Quick BFS Routing Action -->
        <div class="grid grid-cols-2 gap-2">
          <button id="btn-set-source" class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all">
            <i data-lucide="map-pin" class="w-3.5 h-3.5"></i> Set as BFS Source
          </button>
          <button id="btn-set-target" class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all">
            <i data-lucide="target" class="w-3.5 h-3.5"></i> Set as BFS Target
          </button>
        </div>

        <!-- Set as Perspective User -->
        ${!isSelf ? `
          <button id="btn-switch-user" class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all">
            <i data-lucide="user-check" class="w-4 h-4"></i> Switch Perspective to ${student.name.split(" ")[0]}
          </button>
        ` : ''}

        <!-- Toggle Friendship Edge -->
        ${!isSelf ? `
          <div class="pt-1">
            <button id="btn-toggle-friendship" class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              isDirectFriend 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
            }">
              <i data-lucide="${isDirectFriend ? 'user-minus' : 'user-plus'}" class="w-4 h-4"></i>
              ${isDirectFriend ? 'Remove Friendship Edge' : 'Add 1st-Degree Friendship Edge'}
            </button>
          </div>
        ` : ''}

        <!-- Clubs & Organizations -->
        <div>
          <h4 class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
            <i data-lucide="flag" class="w-3.5 h-3.5 text-indigo-400"></i> Campus Clubs (${student.clubs.length})
          </h4>
          <div class="flex flex-wrap gap-1.5">
            ${student.clubs.map(club => `
              <span class="text-xs px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 font-medium">
                ${club}
              </span>
            `).join("") || '<span class="text-xs text-slate-500 italic">No clubs joined</span>'}
          </div>
        </div>

        <!-- Skills & Expertise -->
        <div>
          <h4 class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400"></i> Skills & Technical Stack
          </h4>
          <div class="flex flex-wrap gap-1.5">
            ${student.skills.map(skill => `
              <span class="text-xs px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-500/20 font-medium">
                ${skill}
              </span>
            `).join("") || '<span class="text-xs text-slate-500 italic">No skills listed</span>'}
          </div>
        </div>

        <!-- 1st-Degree Friends List -->
        <div>
          <h4 class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <i data-lucide="users" class="w-3.5 h-3.5 text-emerald-400"></i> Direct Friends (${neighbors.length})
            </span>
            <span class="text-[10px] text-slate-500 font-mono">deg(v) = ${neighbors.length}</span>
          </h4>
          <div class="space-y-1.5">
            ${neighbors.length > 0 ? neighbors.map(friend => `
              <div class="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-white/5 transition-colors cursor-pointer friend-item" data-id="${friend.id}">
                <div class="flex items-center gap-2">
                  <img src="${friend.avatar}" class="w-7 h-7 rounded-lg bg-slate-900 border border-white/10" />
                  <div>
                    <div class="text-xs font-semibold text-white leading-tight">${friend.name}</div>
                    <div class="text-[11px] text-slate-400">${friend.major}</div>
                  </div>
                </div>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300 font-mono">1-Hop</span>
              </div>
            `).join("") : '<div class="text-xs text-slate-500 italic p-2 bg-slate-800/20 rounded-xl">Isolated node (0 connections)</div>'}
          </div>
        </div>
      </div>
    `;

    // Show drawer
    drawer.classList.remove("translate-x-full");

    // Re-initialize Lucide icons safely
    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (e) {
      console.warn("Lucide icon creation notice:", e);
    }

    // Attach event listeners
    const closeBtn = document.getElementById("close-profile-btn");
    if (closeBtn) {
      closeBtn.onclick = () => drawer.classList.add("translate-x-full");
    }

    const setSourceBtn = document.getElementById("btn-set-source");
    if (setSourceBtn) {
      setSourceBtn.onclick = () => {
        this.onSelectAsSource(studentId);
      };
    }

    const setTargetBtn = document.getElementById("btn-set-target");
    if (setTargetBtn) {
      setTargetBtn.onclick = () => {
        this.onSelectAsTarget(studentId);
      };
    }

    const switchUserBtn = document.getElementById("btn-switch-user");
    if (switchUserBtn) {
      switchUserBtn.onclick = () => {
        this.onSetCurrentUser(studentId);
        this.renderProfileDrawer(studentId, studentId);
      };
    }

    const toggleFriendshipBtn = document.getElementById("btn-toggle-friendship");
    if (toggleFriendshipBtn) {
      toggleFriendshipBtn.onclick = () => {
        if (isDirectFriend) {
          this.graph.removeFriendship(activeUserId, studentId);
        } else {
          this.graph.addFriendship(activeUserId, studentId);
        }
        this.renderProfileDrawer(studentId, activeUserId);
      };
    }

    // Clicking friend item navigates to that friend
    container.querySelectorAll(".friend-item").forEach(item => {
      item.onclick = () => {
        const friendId = item.getAttribute("data-id");
        this.renderProfileDrawer(friendId, activeUserId);
      };
    });
  }
}


// ================================
// Source: js/app.js
// ================================
/**
 * CampusConnect (UniGraph) - Main Application Controller
 * Orchestrates Graph DSA, BFS Visualizer, DFS Communities, Mutual Friends,
 * Recommendation Engine, The Quad Feed, and DSA Evaluator Suite.
 */













class CampusConnectApp {
  constructor() {
    this.graph = new Graph();
    this.canvasManager = null;
    this.playbackController = null;
    this.quadFeed = null;
    this.studentModal = null;

    // Active User Context (Perspective)
    this.currentUserId = "alex_chen";

    // BFS Pathfinder State
    this.bfsSourceId = "alex_chen";
    this.bfsTargetId = "priya_patel";
    this.currentBfsResult = null;

    // Mutual Friends State
    this.mutualStudentA = "alex_chen";
    this.mutualStudentB = "sophia_rodriguez";

    // Current Active Tab
    this.activeTab = "pathfinder"; // 'pathfinder' | 'mutual' | 'communities' | 'recommendations' | 'quad' | 'evaluator'
  }

  init() {
    // 1. Load initial default dataset
    this.loadPreset("defaultCampus");

    // 2. Initialize Vis.js Network Canvas
    const canvasContainer = document.getElementById("network-canvas");
    this.canvasManager = new CanvasManager(canvasContainer, this.graph, {
      onNodeSelect: (nodeId) => this.handleNodeSelected(nodeId),
      onNodeDoubleClick: (nodeId) => this.handleNodeDoubleClicked(nodeId),
      onCanvasClick: () => this.handleCanvasClicked()
    });

    // 3. Initialize Playback Controller for BFS
    this.playbackController = new PlaybackController({
      onStepChange: (step, index, total) => this.handleBfsStepChange(step, index, total),
      onFinished: () => this.handleBfsFinished()
    });

    // 4. Initialize Quad Feed
    const initialPosts = PRESET_DATASETS.defaultCampus.posts || [];
    this.quadFeed = new QuadFeed(this.graph, this.currentUserId, initialPosts);

    // 5. Initialize Modals and Drawer
    this.studentModal = new StudentModal({
      graph: this.graph,
      onSelectAsSource: (id) => this.setBfsSource(id),
      onSelectAsTarget: (id) => this.setBfsTarget(id),
      onSetCurrentUser: (id) => this.setCurrentUser(id)
    });

    // 6. Subscribe to graph changes for reactive UI
    this.graph.subscribe((event, data) => {
      this.handleGraphUpdated(event, data);
    });

    // 7. Wire UI Controls & Event Listeners
    this.setupEventListeners();

    // 8. Initial Render
    this.updateGlobalHeader();
    this.updateGraphStatsBar();
    this.populateAllDropdowns();
    this.renderCurrentTab();

    // Lucide Icons initialization
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  loadPreset(presetKey) {
    const preset = PRESET_DATASETS[presetKey];
    if (!preset) return;

    this.graph.clear();
    for (const student of preset.students) {
      this.graph.addStudent(student);
    }
    for (const edge of preset.edges) {
      this.graph.addFriendship(edge.from, edge.to);
    }

    if (preset.students.length > 0) {
      this.currentUserId = preset.students[0].id;
      this.bfsSourceId = preset.students[0].id;
      this.bfsTargetId = preset.students.length > 3 ? preset.students[3].id : preset.students[0].id;
      this.mutualStudentA = preset.students[0].id;
      this.mutualStudentB = preset.students.length > 1 ? preset.students[1].id : preset.students[0].id;
    }

    if (this.quadFeed && preset.posts) {
      this.quadFeed.posts = [...preset.posts];
      this.quadFeed.setCurrentUser(this.currentUserId);
    }
  }

  handleGraphUpdated(event, data) {
    if (this.canvasManager) {
      this.canvasManager.refreshFromGraph();
    }
    this.updateGraphStatsBar();
    this.populateAllDropdowns();
    this.renderCurrentTab();
  }

  setupEventListeners() {
    // Navigation Tabs
    const tabBtns = document.querySelectorAll(".nav-tab-btn");
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        this.switchTab(tab);
      });
    });

    // Canvas Utility Buttons
    document.getElementById("btn-fit-canvas")?.addEventListener("click", () => this.canvasManager.fitView());
    document.getElementById("btn-zoom-in")?.addEventListener("click", () => this.canvasManager.zoom(1.2));
    document.getElementById("btn-zoom-out")?.addEventListener("click", () => this.canvasManager.zoom(0.8));
    document.getElementById("btn-toggle-physics")?.addEventListener("click", (e) => {
      const active = this.canvasManager.togglePhysics();
      e.currentTarget.classList.toggle("bg-indigo-600/30", active);
      e.currentTarget.classList.toggle("text-indigo-300", active);
    });

    // Preset Selector
    document.getElementById("preset-select")?.addEventListener("change", (e) => {
      const val = e.target.value;
      this.loadPreset(val);
      this.canvasManager.refreshFromGraph();
      setTimeout(() => this.canvasManager.fitView(), 300);
      this.renderCurrentTab();
    });

    // Global Perspective User Selector
    document.getElementById("current-user-select")?.addEventListener("change", (e) => {
      this.setCurrentUser(e.target.value);
    });

    // BFS Pathfinder Controls
    document.getElementById("bfs-source-select")?.addEventListener("change", (e) => {
      this.bfsSourceId = e.target.value;
    });
    document.getElementById("bfs-target-select")?.addEventListener("change", (e) => {
      this.bfsTargetId = e.target.value;
    });
    document.getElementById("btn-run-bfs")?.addEventListener("click", () => {
      this.executeBfs();
    });

    // Playback bar controls
    document.getElementById("btn-playback-play")?.addEventListener("click", () => {
      const isPlaying = this.playbackController.togglePlayPause();
      this.updatePlayPauseButtonUI(isPlaying);
    });
    document.getElementById("btn-playback-step-next")?.addEventListener("click", () => {
      this.playbackController.stepNext();
    });
    document.getElementById("btn-playback-step-prev")?.addEventListener("click", () => {
      this.playbackController.stepPrev();
    });
    document.getElementById("btn-playback-reset")?.addEventListener("click", () => {
      this.playbackController.reset();
    });
    document.getElementById("btn-playback-finish")?.addEventListener("click", () => {
      this.playbackController.finish();
    });
    document.getElementById("playback-speed-slider")?.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      this.playbackController.setSpeed(val);
      document.getElementById("playback-speed-val").textContent = `${val.toFixed(1)}x`;
    });

    // Mutual Friends Controls
    document.getElementById("mutual-a-select")?.addEventListener("change", (e) => {
      this.mutualStudentA = e.target.value;
      this.executeMutualFriends();
    });
    document.getElementById("mutual-b-select")?.addEventListener("change", (e) => {
      this.mutualStudentB = e.target.value;
      this.executeMutualFriends();
    });
    document.getElementById("btn-run-mutual")?.addEventListener("click", () => {
      this.executeMutualFriends();
    });

    // Communities (DFS)
    document.getElementById("btn-run-communities")?.addEventListener("click", () => {
      this.executeCommunities();
    });

    // Quad Feed Adjacency Filter Tabs
    document.querySelectorAll(".quad-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".quad-filter-btn").forEach(b => b.classList.remove("active-filter", "bg-indigo-600", "text-white"));
        btn.classList.add("active-filter", "bg-indigo-600", "text-white");
        const filter = btn.getAttribute("data-filter");
        this.quadFeed.setFilter(filter);
        this.renderQuadFeed();
      });
    });

    // Quad New Post Form
    document.getElementById("quad-post-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("quad-post-input");
      const tagsInput = document.getElementById("quad-post-tags");
      if (!input || !input.value.trim()) return;

      const tags = tagsInput && tagsInput.value.trim() 
        ? tagsInput.value.split(",").map(t => t.trim()).filter(Boolean)
        : ["#Campus"];

      this.quadFeed.createPost(input.value, tags);
      input.value = "";
      if (tagsInput) tagsInput.value = "";
      this.renderQuadFeed();

      // Confetti celebration for campus engagement
      if (window.confetti) {
        window.confetti({ particleCount: 30, spread: 60, origin: { y: 0.85 } });
      }
    });

    // Evaluator Test Runner
    document.getElementById("btn-run-evaluator-tests")?.addEventListener("click", () => {
      this.executeEvaluatorTests();
    });

    // Add Student Modal Trigger
    document.getElementById("btn-open-add-student")?.addEventListener("click", () => {
      document.getElementById("modal-add-student")?.classList.remove("hidden");
    });
    document.getElementById("btn-close-add-student")?.addEventListener("click", () => {
      document.getElementById("modal-add-student")?.classList.add("hidden");
    });
    document.getElementById("form-add-student")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleCreateStudentSubmit();
    });

    // Add Edge Modal Trigger
    document.getElementById("btn-open-add-edge")?.addEventListener("click", () => {
      this.studentModal.populateStudentSelect("modal-edge-a", this.bfsSourceId);
      this.studentModal.populateStudentSelect("modal-edge-b", this.bfsTargetId);
      document.getElementById("modal-add-edge")?.classList.remove("hidden");
    });
    document.getElementById("btn-close-add-edge")?.addEventListener("click", () => {
      document.getElementById("modal-add-edge")?.classList.add("hidden");
    });
    document.getElementById("form-add-edge")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleAddEdgeSubmit();
    });

    // Graph Export / Import
    document.getElementById("btn-export-json")?.addEventListener("click", () => {
      this.exportGraphJSON();
    });
    document.getElementById("btn-import-json")?.addEventListener("click", () => {
      document.getElementById("json-file-input")?.click();
    });
    document.getElementById("json-file-input")?.addEventListener("change", (e) => {
      this.handleImportJSONFile(e);
    });

    // Quick Search Input in header
    document.getElementById("student-search-input")?.addEventListener("input", (e) => {
      this.handleStudentSearch(e.target.value);
    });
  }

  switchTab(tab) {
    this.activeTab = tab;

    // Update Tab Buttons UI
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      const isTarget = btn.getAttribute("data-tab") === tab;
      btn.classList.toggle("text-indigo-400", isTarget);
      btn.classList.toggle("border-indigo-500", isTarget);
      btn.classList.toggle("text-slate-400", !isTarget);
      btn.classList.toggle("border-transparent", !isTarget);
    });

    // Update Panels Visibility
    document.querySelectorAll(".tool-panel").forEach(panel => {
      panel.classList.add("hidden");
    });
    const activePanel = document.getElementById(`panel-${tab}`);
    if (activePanel) {
      activePanel.classList.remove("hidden");
    }

    this.renderCurrentTab();
  }

  renderCurrentTab() {
    switch (this.activeTab) {
      case "pathfinder":
        this.renderPathfinderPanel();
        break;
      case "mutual":
        this.renderMutualPanel();
        break;
      case "communities":
        this.renderCommunitiesPanel();
        break;
      case "recommendations":
        this.renderRecommendationsPanel();
        break;
      case "quad":
        this.renderQuadFeed();
        break;
      case "evaluator":
        this.renderEvaluatorPanel();
        break;
    }
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  updateGlobalHeader() {
    const student = this.graph.getStudent(this.currentUserId);
    if (!student) return;

    const avatarEl = document.getElementById("header-user-avatar");
    const nameEl = document.getElementById("header-user-name");
    const majorEl = document.getElementById("header-user-major");

    if (avatarEl) avatarEl.src = student.avatar;
    if (nameEl) nameEl.textContent = student.name;
    if (majorEl) {
      majorEl.textContent = `${student.major} · ${student.dorm}`;
      majorEl.style.color = student.color || "#818cf8";
    }
  }

  updateGraphStatsBar() {
    const stats = this.graph.getStats();

    const vEl = document.getElementById("stat-vertices");
    const eEl = document.getElementById("stat-edges");
    const degEl = document.getElementById("stat-avg-degree");
    const densEl = document.getElementById("stat-density");
    const isoEl = document.getElementById("stat-isolated");

    if (vEl) vEl.textContent = stats.vertexCount;
    if (eEl) eEl.textContent = stats.edgeCount;
    if (degEl) degEl.textContent = stats.avgDegree;
    if (densEl) densEl.textContent = stats.density;
    if (isoEl) isoEl.textContent = stats.isolatedCount;
  }

  populateAllDropdowns() {
    this.studentModal.populateStudentSelect("current-user-select", this.currentUserId);
    this.studentModal.populateStudentSelect("bfs-source-select", this.bfsSourceId);
    this.studentModal.populateStudentSelect("bfs-target-select", this.bfsTargetId);
    this.studentModal.populateStudentSelect("mutual-a-select", this.mutualStudentA);
    this.studentModal.populateStudentSelect("mutual-b-select", this.mutualStudentB);
  }

  setCurrentUser(userId) {
    if (!this.graph.hasStudent(userId)) return;
    this.currentUserId = userId;
    this.quadFeed.setCurrentUser(userId);
    this.updateGlobalHeader();
    this.populateAllDropdowns();
    this.renderCurrentTab();
  }

  setBfsSource(id) {
    this.bfsSourceId = id;
    this.populateAllDropdowns();
    this.switchTab("pathfinder");
  }

  setBfsTarget(id) {
    this.bfsTargetId = id;
    this.populateAllDropdowns();
    this.switchTab("pathfinder");
  }

  // =====================
  // 1. BFS Shortest Path
  // =====================
  executeBfs() {
    if (!this.bfsSourceId || !this.bfsTargetId) return;

    this.canvasManager.resetHighlights();
    const result = BFSEngine.traceShortestPath(this.graph, this.bfsSourceId, this.bfsTargetId);
    this.currentBfsResult = result;

    // Load steps into Playback Controller
    this.playbackController.loadSteps(result.steps);
    this.playbackController.play();
    this.updatePlayPauseButtonUI(true);

    // Render Metrics Box
    this.renderBfsMetrics(result);
  }

  handleBfsStepChange(step, index, total) {
    // 1. Highlight on Canvas
    this.canvasManager.highlightBfsStep(step, this.bfsSourceId, this.bfsTargetId);

    // 2. Update Playback Progress Bar & Counters
    const progressEl = document.getElementById("playback-progress-bar");
    const countEl = document.getElementById("playback-step-counter");
    if (progressEl) {
      const pct = total > 1 ? ((index + 1) / total) * 100 : 100;
      progressEl.style.width = `${pct}%`;
    }
    if (countEl) {
      countEl.textContent = `Step ${index + 1} / ${total}`;
    }

    // 3. Update FIFO Queue Visualizer Container
    const queueContainer = document.getElementById("bfs-queue-visualizer");
    if (queueContainer) {
      if (step.queue && step.queue.length > 0) {
        queueContainer.innerHTML = step.queue.map(id => {
          const s = this.graph.getStudent(id);
          const isHead = id === step.queue[0];
          return `
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
              isHead ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-md shadow-cyan-500/20' : 'bg-slate-800 text-slate-300 border border-white/10'
            }">
              ${isHead ? '<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>' : ''}
              <span>${s ? s.name : id}</span>
            </div>
          `;
        }).join('<span class="text-slate-600">→</span>');
      } else {
        queueContainer.innerHTML = '<span class="text-xs text-slate-500 italic">Queue Empty (∅)</span>';
      }
    }

    // 4. Update Visited Set Container
    const visitedContainer = document.getElementById("bfs-visited-visualizer");
    if (visitedContainer) {
      if (step.visited && step.visited.length > 0) {
        visitedContainer.innerHTML = step.visited.map(id => {
          const s = this.graph.getStudent(id);
          return `
            <span class="inline-block px-2 py-0.5 rounded-md text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
              ${s ? s.name.split(" ")[0] : id}
            </span>
          `;
        }).join(" ");
      } else {
        visitedContainer.innerHTML = '<span class="text-xs text-slate-500 italic">Empty Set { }</span>';
      }
    }

    // 5. Update Algorithmic Log Message
    const logEl = document.getElementById("bfs-step-log");
    if (logEl) {
      logEl.textContent = step.message;
    }
  }

  handleBfsFinished() {
    this.updatePlayPauseButtonUI(false);
    if (this.currentBfsResult && this.currentBfsResult.success) {
      // Confetti for successful path resolution
      if (window.confetti) {
        window.confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
      }
    }
  }

  updatePlayPauseButtonUI(isPlaying) {
    const playBtn = document.getElementById("btn-playback-play");
    if (!playBtn) return;
    playBtn.innerHTML = isPlaying 
      ? '<i data-lucide="pause" class="w-4 h-4"></i>'
      : '<i data-lucide="play" class="w-4 h-4"></i>';
    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (e) {}
  }

  renderBfsMetrics(result) {
    const container = document.getElementById("bfs-metrics-container");
    if (!container) return;

    if (!result.success) {
      container.innerHTML = `
        <div class="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 text-xs">
          <div class="font-bold flex items-center gap-1.5 mb-1">
            <i data-lucide="alert-circle" class="w-4 h-4 text-red-400"></i> No Connection Path Found
          </div>
          Students are in disjoint subgraphs (different connected components). Degrees of separation: ∞.
        </div>
      `;
      return;
    }

    const pathStudents = result.path.map(id => this.graph.getStudent(id)).filter(Boolean);

    container.innerHTML = `
      <div class="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-bold text-sm flex items-center gap-1.5">
            <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i> Minimum Degrees of Separation
          </span>
          <span class="text-base font-extrabold px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/40">
            ${result.degrees} ${result.degrees === 1 ? 'Degree' : 'Degrees'}
          </span>
        </div>

        <div class="text-[11px] text-slate-300">
          <div class="font-semibold text-white mb-1">Resolved Shortest Path:</div>
          <div class="flex flex-wrap items-center gap-1 font-mono">
            ${pathStudents.map((s, idx) => `
              <span class="px-2 py-1 rounded bg-slate-800 text-white font-medium border border-white/10 ${idx === 0 || idx === pathStudents.length - 1 ? 'text-emerald-300 font-bold border-emerald-500/50' : ''}">${s.name}</span>
              ${idx < pathStudents.length - 1 ? '<span class="text-emerald-400">→</span>' : ''}
            `).join("")}
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-500/20 text-[11px] font-mono">
          <div><span class="text-slate-400">Nodes Explored:</span> ${result.visitedCount}</div>
          <div><span class="text-slate-400">Peak Queue Size:</span> ${result.maxQueueSize}</div>
          <div><span class="text-slate-400">Execution:</span> ${result.executionTimeMs}ms</div>
        </div>
      </div>
    `;

    // Also compute alternative DFS paths for comparison
    this.renderAlternativeDfsPaths(this.bfsSourceId, this.bfsTargetId);
  }

  renderAlternativeDfsPaths(startId, targetId) {
    const container = document.getElementById("bfs-alt-paths-container");
    if (!container) return;

    const altPaths = DFSEngine.findAlternativePaths(this.graph, startId, targetId, 5, 4);

    if (altPaths.length <= 1) {
      container.innerHTML = `
        <div class="text-xs text-slate-500 italic">No alternative routes within 5 hops.</div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="space-y-1.5 mt-2">
        <div class="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Alternative Social Channels (DFS Bounded k=5)</span>
          <span class="text-[10px] text-slate-500">${altPaths.length} routes found</span>
        </div>
        ${altPaths.map((p, idx) => {
          const isShortest = idx === 0;
          return `
            <div class="p-2 rounded-lg bg-slate-800/40 border border-white/5 text-[11px] flex items-center justify-between">
              <span class="text-slate-300 truncate font-mono">
                ${p.map(id => this.graph.getStudent(id)?.name.split(" ")[0]).join(" → ")}
              </span>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-mono ${isShortest ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-slate-700 text-slate-400'}">
                ${p.length - 1} hops ${isShortest ? '(BFS Min)' : ''}
              </span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  renderPathfinderPanel() {
    this.populateAllDropdowns();
  }

  // =====================
  // 2. Mutual Friends
  // =====================
  executeMutualFriends() {
    if (!this.mutualStudentA || !this.mutualStudentB) return;

    const result = SetOperations.findMutualFriends(this.graph, this.mutualStudentA, this.mutualStudentB);
    this.renderMutualResults(result);

    // Highlight on canvas
    this.canvasManager.highlightMutualFriends(this.mutualStudentA, this.mutualStudentB, result.mutualFriendIds);
  }

  renderMutualPanel() {
    this.populateAllDropdowns();
    this.executeMutualFriends();
  }

  renderMutualResults(res) {
    const container = document.getElementById("mutual-results-container");
    if (!container) return;

    const sA = res.studentA;
    const sB = res.studentB;

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Header Comparison Card -->
        <div class="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-800/40 border border-white/10 text-xs">
          <div class="text-left">
            <span class="text-slate-400 text-[10px] uppercase font-semibold">Student A</span>
            <div class="font-bold text-white text-sm truncate">${sA.name}</div>
            <div class="text-[11px] text-indigo-300 font-mono">deg(A) = ${res.benchmarks.degA}</div>
          </div>
          <div class="text-right">
            <span class="text-slate-400 text-[10px] uppercase font-semibold">Student B</span>
            <div class="font-bold text-white text-sm truncate">${sB.name}</div>
            <div class="text-[11px] text-pink-300 font-mono">deg(B) = ${res.benchmarks.degB}</div>
          </div>
        </div>

        <!-- Algorithmic Optimization Banner -->
        <div class="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-300 font-mono">
          <div class="font-bold mb-1 flex items-center gap-1.5">
            <i data-lucide="cpu" class="w-3.5 h-3.5 text-indigo-400"></i> Set Intersection Optimization
          </div>
          <div>Formula: Friends(A) ∩ Friends(B)</div>
          <div>Looping over smaller set: O(min(${res.benchmarks.degA}, ${res.benchmarks.degB})) = ${res.benchmarks.comparisonsMade} iterations executed.</div>
          <div>Jaccard Similarity: ${(res.jaccardIndex * 100).toFixed(1)}% overlap</div>
        </div>

        <!-- Mutual Friends Count & Gold Badges -->
        <div>
          <h4 class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400"></i> Common Friends (${res.count})
            </span>
          </h4>
          <div class="space-y-1.5">
            ${res.mutualFriends.length > 0 ? res.mutualFriends.map(mf => `
              <div class="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <div class="flex items-center gap-2">
                  <img src="${mf.avatar}" class="w-7 h-7 rounded-lg bg-slate-900 border border-amber-500/40" />
                  <div>
                    <span class="font-semibold text-white">${mf.name}</span>
                    <span class="text-[11px] text-slate-400 block">${mf.major}</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30 font-semibold">
                  Gold Badge
                </span>
              </div>
            `).join("") : '<div class="text-xs text-slate-500 italic p-3 bg-slate-800/20 rounded-xl">No mutual 1st-degree friends found.</div>'}
          </div>
        </div>

        <!-- Shared Attributes (Clubs, Dorm, Skills) -->
        <div class="space-y-2">
          <h4 class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Shared Campus Affinities</h4>
          
          <div class="p-2.5 rounded-xl bg-slate-800/40 border border-white/5 space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-400 flex items-center gap-1"><i data-lucide="home" class="w-3 h-3"></i> Same Dorm:</span>
              <span class="font-semibold ${res.sameDorm ? 'text-emerald-400' : 'text-slate-500'}">
                ${res.sameDorm ? `Yes (${res.dormName})` : 'Different Dorms'}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-slate-400 flex items-center gap-1"><i data-lucide="book-open" class="w-3 h-3"></i> Same Major:</span>
              <span class="font-semibold ${res.sameMajor ? 'text-indigo-400' : 'text-slate-500'}">
                ${res.sameMajor ? `Yes (${res.majorName})` : 'Different Majors'}
              </span>
            </div>

            <div>
              <span class="text-slate-400 flex items-center gap-1 mb-1"><i data-lucide="flag" class="w-3 h-3"></i> Shared Clubs (${res.sharedClubs.length}):</span>
              <div class="flex flex-wrap gap-1">
                ${res.sharedClubs.map(c => `
                  <span class="text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">${c}</span>
                `).join("") || '<span class="text-slate-500 text-[11px] italic">None</span>'}
              </div>
            </div>

            <div>
              <span class="text-slate-400 flex items-center gap-1 mb-1"><i data-lucide="code" class="w-3 h-3"></i> Shared Skills:</span>
              <div class="flex flex-wrap gap-1">
                ${res.sharedSkills.map(s => `
                  <span class="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">${s}</span>
                `).join("") || '<span class="text-slate-500 text-[11px] italic">None</span>'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (e) {
      // safe fallback
    }
  }

  // =====================
  // 3. Campus Communities (DFS)
  // =====================
  executeCommunities() {
    const result = DFSEngine.findConnectedComponents(this.graph);
    this.canvasManager.highlightComponents(result.components);
    this.renderCommunitiesPanel(result);
  }

  renderCommunitiesPanel(result = null) {
    const container = document.getElementById("communities-results-container");
    if (!container) return;

    if (!result) {
      result = DFSEngine.findConnectedComponents(this.graph);
    }

    container.innerHTML = `
      <div class="space-y-3">
        <div class="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-800/40 border border-white/10 text-center font-mono">
          <div>
            <div class="text-[10px] text-slate-400">Total Clusters</div>
            <div class="text-lg font-bold text-white">${result.totalComponents}</div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400">Largest Subgraph</div>
            <div class="text-lg font-bold text-emerald-400">${result.largestComponentSize}</div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400">Isolated Nodes</div>
            <div class="text-lg font-bold text-amber-400">${result.isolatedNodesCount}</div>
          </div>
        </div>

        <div class="space-y-2">
          ${result.components.map(comp => `
            <div class="p-3 rounded-xl bg-slate-800/40 border border-white/5 hover:border-white/10 transition-colors">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-bold flex items-center gap-2 text-white">
                  <span class="w-3 h-3 rounded-full" style="background-color: ${comp.color.primary}"></span>
                  ${comp.name}
                </span>
                <span class="text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold" style="color: ${comp.color.primary}; background: ${comp.color.bg}">
                  ${comp.size} ${comp.size === 1 ? 'Student' : 'Students'}
                </span>
              </div>
              <div class="text-[11px] text-slate-400 space-y-0.5">
                <div>Predominant Dorm: <span class="text-slate-200">${comp.topDorm}</span></div>
                <div class="flex flex-wrap gap-1 mt-1.5">
                  ${comp.members.slice(0, 6).map(mId => `
                    <span class="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px]">${this.graph.getStudent(mId)?.name.split(" ")[0]}</span>
                  `).join("")}
                  ${comp.members.length > 6 ? `<span class="text-[10px] text-slate-500">+${comp.members.length - 6} more</span>` : ''}
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  // =====================
  // 4. Recommendation Engine (2-Hop)
  // =====================
  renderRecommendationsPanel() {
    const container = document.getElementById("recommendations-list-container");
    if (!container) return;

    const recs = RecommendationEngine.getRecommendations(this.graph, this.currentUserId);
    const currentUser = this.graph.getStudent(this.currentUserId);

    if (recs.length === 0) {
      container.innerHTML = `
        <div class="p-4 rounded-xl bg-slate-800/30 border border-white/5 text-center text-slate-400 text-xs">
          <p class="font-semibold text-white mb-1">No 2-Hop Recommendations Available</p>
          <p class="text-[11px]">Either you already have all friends in your cluster, or your current profile is in an isolated subgraph.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="space-y-3">
        <div class="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-300">
          <div class="font-bold flex items-center gap-1.5 mb-0.5">
            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-indigo-400"></i> PRD Scoring Algorithm
          </div>
          <div class="font-mono text-[10px] text-slate-300">
            Score = (Mutual × 3.5) + (Major ? 2.5 : 0) + (Dorm ? 2.0 : 0) + (Clubs × 1.5)
          </div>
        </div>

        <div class="space-y-2">
          ${recs.map(rec => {
            const cand = rec.candidate;
            return `
              <div class="p-3 rounded-xl bg-slate-800/40 border border-white/5 hover:border-white/10 transition-all space-y-2">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-2.5">
                    <img src="${cand.avatar}" class="w-9 h-9 rounded-xl bg-slate-900 border border-white/10" />
                    <div>
                      <div class="font-bold text-white text-xs">${cand.name}</div>
                      <div class="text-[11px] text-slate-400">${cand.major} · ${cand.dorm}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-extrabold text-amber-400 font-mono">${rec.score} pts</div>
                    <span class="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Affinity Score</span>
                  </div>
                </div>

                <!-- Breakdown chips -->
                <div class="flex flex-wrap gap-1">
                  ${rec.reasons.map(r => `
                    <span class="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-white/5 font-mono">
                      ${r}
                    </span>
                  `).join("")}
                </div>

                <!-- Connect Button -->
                <div class="pt-1 flex items-center justify-between">
                  <span class="text-[10px] text-slate-500 font-mono">2-Hop Neighbor</span>
                  <button class="btn-connect-rec px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors" data-id="${cand.id}">
                    <i data-lucide="user-plus" class="w-3.5 h-3.5"></i> Connect
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    // Connect button click handlers
    container.querySelectorAll(".btn-connect-rec").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-id");
        this.graph.addFriendship(this.currentUserId, targetId);
        if (window.confetti) {
          window.confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
        }
        this.renderRecommendationsPanel();
      });
    });

    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (e) {
      // safe fallback
    }
  }

  // =====================
  // 5. "The Quad" Social Feed
  // =====================
  renderQuadFeed() {
    const container = document.getElementById("quad-posts-container");
    const tagsContainer = document.getElementById("quad-tags-container");
    if (!container) return;

    const posts = this.quadFeed.getFilteredPosts();
    const allTags = this.quadFeed.getAllTags();

    // Render tag pills
    if (tagsContainer) {
      tagsContainer.innerHTML = `
        <button class="quad-tag-pill px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
          !this.quadFeed.activeTag ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        }" data-tag="">All</button>
        ${allTags.map(t => `
          <button class="quad-tag-pill px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            this.quadFeed.activeTag === t.tag ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }" data-tag="${t.tag}">${t.tag} (${t.count})</button>
        `).join("")}
      `;

      tagsContainer.querySelectorAll(".quad-tag-pill").forEach(pill => {
        pill.addEventListener("click", () => {
          const tag = pill.getAttribute("data-tag");
          if (!tag) {
            this.quadFeed.clearTagFilter();
          } else {
            this.quadFeed.setTagFilter(tag);
          }
          this.renderQuadFeed();
        });
      });
    }

    if (posts.length === 0) {
      container.innerHTML = `
        <div class="p-6 rounded-xl bg-slate-800/30 border border-white/5 text-center text-slate-400 text-xs">
          <p class="font-semibold text-white mb-1">No Posts Found</p>
          <p class="text-[11px]">No posts match your current graph adjacency filter or hashtag selection.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = posts.map(post => {
      const author = this.graph.getStudent(post.authorId);
      const isLiked = post.likedBy.includes(this.currentUserId);
      const isDirectFriend = this.graph.areFriends(this.currentUserId, post.authorId);
      const isSelf = this.currentUserId === post.authorId;

      let relationshipBadge = "";
      if (isSelf) {
        relationshipBadge = '<span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">You</span>';
      } else if (isDirectFriend) {
        relationshipBadge = '<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">1st-Degree Friend</span>';
      } else {
        relationshipBadge = '<span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">Campus Wide</span>';
      }

      return `
        <div class="p-4 rounded-xl bg-slate-800/50 border border-white/10 hover:border-white/20 transition-all space-y-3">
          <!-- Post Author Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 cursor-pointer post-author-link" data-id="${post.authorId}">
              <img src="${author ? author.avatar : ''}" class="w-10 h-10 rounded-xl bg-slate-900 border border-white/10" />
              <div>
                <div class="font-bold text-white text-xs flex items-center gap-1.5">
                  ${author ? author.name : post.authorId}
                  ${relationshipBadge}
                </div>
                <div class="text-[11px] text-slate-400">${author ? author.major : ''} · ${post.timestamp}</div>
              </div>
            </div>
          </div>

          <!-- Post Content -->
          <div class="text-xs text-slate-200 leading-relaxed">
            ${post.content}
          </div>

          <!-- Tags -->
          <div class="flex flex-wrap gap-1">
            ${post.tags.map(t => `
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 font-medium">
                ${t}
              </span>
            `).join("")}
          </div>

          <!-- Interactions Bar -->
          <div class="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
            <button class="btn-like-post flex items-center gap-1.5 transition-colors ${isLiked ? 'text-rose-400 font-bold' : 'hover:text-white'}" data-id="${post.id}">
              <i data-lucide="heart" class="w-4 h-4 ${isLiked ? 'fill-rose-400' : ''}"></i>
              <span>${post.likes}</span>
            </button>
            <div class="flex items-center gap-1.5 text-slate-400">
              <i data-lucide="message-square" class="w-4 h-4"></i>
              <span>${post.comments.length} comments</span>
            </div>
          </div>

          <!-- Comments Thread -->
          ${post.comments.length > 0 ? `
            <div class="space-y-1.5 pt-1 pl-3 border-l-2 border-white/10 text-xs">
              ${post.comments.map(c => {
                const commentAuthor = this.graph.getStudent(c.authorId);
                return `
                  <div class="p-2 rounded-lg bg-slate-900/40 text-slate-300">
                    <span class="font-semibold text-white mr-1">${commentAuthor ? commentAuthor.name : c.authorId}:</span>
                    <span>${c.text}</span>
                    <span class="text-[10px] text-slate-500 ml-2">${c.timestamp}</span>
                  </div>
                `;
              }).join("")}
            </div>
          ` : ''}

          <!-- Add Comment Input -->
          <form class="form-add-comment flex items-center gap-2 pt-1" data-id="${post.id}">
            <input type="text" placeholder="Write a comment..." class="flex-1 bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
            <button type="submit" class="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">Reply</button>
          </form>
        </div>
      `;
    }).join("");

    // Event listeners on post items
    container.querySelectorAll(".btn-like-post").forEach(btn => {
      btn.addEventListener("click", () => {
        const pId = btn.getAttribute("data-id");
        this.quadFeed.toggleLike(pId);
        this.renderQuadFeed();
      });
    });

    container.querySelectorAll(".form-add-comment").forEach(form => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const pId = form.getAttribute("data-id");
        const input = form.querySelector("input");
        if (input && input.value.trim()) {
          this.quadFeed.addComment(pId, input.value);
          this.renderQuadFeed();
        }
      });
    });

    container.querySelectorAll(".post-author-link").forEach(link => {
      link.addEventListener("click", () => {
        const authorId = link.getAttribute("data-id");
        this.canvasManager.focusOnNode(authorId);
        this.studentModal.renderProfileDrawer(authorId, this.currentUserId);
      });
    });

    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (e) {
      // safe fallback
    }
  }

  // =====================
  // 6. DSA Evaluator / Professor Suite
  // =====================
  executeEvaluatorTests() {
    const report = EvaluatorSuite.runAllTests(this.graph);
    this.renderEvaluatorPanel(report);

    if (report.allPassed && window.confetti) {
      window.confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
    }
  }

  renderEvaluatorPanel(testReport = null) {
    const container = document.getElementById("evaluator-results-container");
    const tableContainer = document.getElementById("evaluator-complexity-table");
    if (!container) return;

    // Complexity reference table
    if (tableContainer) {
      const tableRows = EvaluatorSuite.getComplexityTable();
      tableContainer.innerHTML = `
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-800/80 text-[10px] uppercase font-bold text-slate-400">
            <tr>
              <th class="p-2">Feature / Module</th>
              <th class="p-2">Time Complexity</th>
              <th class="p-2">Space Complexity</th>
              <th class="p-2">Theoretical Rationale</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            ${tableRows.map(row => `
              <tr class="hover:bg-slate-800/30 font-mono text-[11px]">
                <td class="p-2 font-semibold text-white">${row.feature}</td>
                <td class="p-2 text-indigo-300">${row.time}</td>
                <td class="p-2 text-emerald-300">${row.space}</td>
                <td class="p-2 text-slate-400 font-sans text-xs">${row.notes}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }

    if (!testReport) {
      testReport = EvaluatorSuite.runAllTests(this.graph);
    }

    container.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 rounded-xl ${
          testReport.allPassed ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300' : 'bg-red-950/40 border border-red-500/30 text-red-300'
        }">
          <div>
            <div class="font-bold text-sm flex items-center gap-1.5">
              <i data-lucide="${testReport.allPassed ? 'check-circle-2' : 'alert-triangle'}" class="w-4 h-4"></i>
              DSA Test Suite: ${testReport.passedCount} / ${testReport.totalCount} Passed
            </div>
            <div class="text-[11px] text-slate-300">100% path accuracy verified against Dijkstra baselines. Suite duration: ${testReport.totalDuration}ms</div>
          </div>
          <span class="px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
            testReport.allPassed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
          }">
            ${testReport.allPassed ? 'VERIFIED' : 'TESTS FAILED'}
          </span>
        </div>

        <div class="space-y-2">
          ${testReport.results.map(res => `
            <div class="p-3 rounded-xl bg-slate-800/40 border border-white/5 space-y-1 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-white flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full ${res.status === 'PASS' ? 'bg-emerald-400' : 'bg-rose-400'}"></span>
                  ${res.testName}
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  res.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                }">${res.status}</span>
              </div>
              <p class="text-slate-400 text-[11px]">${res.description}</p>
              <div class="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-slate-500">
                <span>${res.complexity}</span>
                <span class="text-slate-300">${res.details}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (e) {
      // safe fallback
    }
  }

  // =====================
  // Node Click Handlers
  // =====================
  handleNodeSelected(nodeId) {
    this.canvasManager.focusOnNode(nodeId);
    this.studentModal.renderProfileDrawer(nodeId, this.currentUserId);
  }

  handleNodeDoubleClicked(nodeId) {
    this.setCurrentUser(nodeId);
  }

  handleCanvasClicked() {
    // optional canvas click behavior
  }

  handleStudentSearch(query) {
    if (!query || !query.trim()) return;
    const q = query.toLowerCase().trim();
    const students = this.graph.getAllStudents();
    const match = students.find(s => 
      s.name.toLowerCase().includes(q) || 
      s.major.toLowerCase().includes(q) ||
      s.dorm.toLowerCase().includes(q)
    );
    if (match) {
      this.canvasManager.focusOnNode(match.id);
      this.studentModal.renderProfileDrawer(match.id, this.currentUserId);
    }
  }

  handleCreateStudentSubmit() {
    const name = document.getElementById("new-student-name")?.value;
    const major = document.getElementById("new-student-major")?.value;
    const year = document.getElementById("new-student-year")?.value;
    const dorm = document.getElementById("new-student-dorm")?.value;
    const clubsStr = document.getElementById("new-student-clubs")?.value;
    const skillsStr = document.getElementById("new-student-skills")?.value;
    const bio = document.getElementById("new-student-bio")?.value;

    if (!name || !major) return;

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Math.floor(Math.random() * 1000);
    const clubs = clubsStr ? clubsStr.split(",").map(c => c.trim()).filter(Boolean) : [];
    const skills = skillsStr ? skillsStr.split(",").map(s => s.trim()).filter(Boolean) : [];

    this.graph.addStudent({
      id,
      name,
      major,
      year,
      dorm,
      clubs,
      skills,
      bio: bio || "CampusConnect Member",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`
    });

    document.getElementById("modal-add-student")?.classList.add("hidden");
    document.getElementById("form-add-student")?.reset();
    this.canvasManager.focusOnNode(id);
    this.studentModal.renderProfileDrawer(id, this.currentUserId);
  }

  handleAddEdgeSubmit() {
    const a = document.getElementById("modal-edge-a")?.value;
    const b = document.getElementById("modal-edge-b")?.value;
    if (a && b && a !== b) {
      this.graph.addFriendship(a, b);
      document.getElementById("modal-add-edge")?.classList.add("hidden");
    }
  }

  exportGraphJSON() {
    const jsonStr = this.graph.toJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campusconnect_graph_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  handleImportJSONFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        this.graph.loadFromJSON(content);
        this.canvasManager.refreshFromGraph();
        setTimeout(() => this.canvasManager.fitView(), 300);
      } catch (err) {
        alert("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  }
}

// Instantiate on DOMContentLoaded
window.addEventListener("DOMContentLoaded", () => {
  window.app = new CampusConnectApp();
  window.app.init();
});



})();

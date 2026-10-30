/**
 * CampusConnect (UniGraph) - Graph Data Structure
 * Implementation: Map<StudentID, Set<StudentID>> (Adjacency List)
 * Complexity: O(|V| + |E|) space, O(1) neighbor lookups
 */

export class Graph {
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

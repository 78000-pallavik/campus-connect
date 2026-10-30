/**
 * CampusConnect - Depth-First Search (DFS) Engine
 * Explores alternative paths and detects campus sub-communities (Connected Components)
 * Time Complexity: O(|V| + |E|) for Connected Components
 */

export class DFSEngine {
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

/**
 * CampusConnect - DSA Evaluator & Professor Verification Suite
 * Automated test bench, theoretical complexity verification, and Dijkstra baseline comparison
 */

import { BFSEngine } from "./BFS.js";
import { DFSEngine } from "./DFS.js";
import { SetOperations } from "./SetOperations.js";
import { RecommendationEngine } from "./RecommendationEngine.js";

export class EvaluatorSuite {
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

/**
 * CampusConnect - Vis.js Canvas Manager
 * Manages 60 FPS interactive physics network graph, visual states, and BFS/DFS highlight shaders
 */

export class CanvasManager {
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

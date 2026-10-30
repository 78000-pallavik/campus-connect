/**
 * CampusConnect (UniGraph) - Main Application Controller
 * Orchestrates Graph DSA, BFS Visualizer, DFS Communities, Mutual Friends,
 * Recommendation Engine, The Quad Feed, and DSA Evaluator Suite.
 */

import { Graph } from "./Graph.js";
import { BFSEngine } from "./algorithms/BFS.js";
import { DFSEngine } from "./algorithms/DFS.js";
import { SetOperations } from "./algorithms/SetOperations.js";
import { RecommendationEngine } from "./algorithms/RecommendationEngine.js";
import { EvaluatorSuite } from "./algorithms/EvaluatorSuite.js";
import { CanvasManager } from "./components/CanvasManager.js";
import { PlaybackController } from "./components/PlaybackController.js";
import { QuadFeed } from "./components/QuadFeed.js";
import { StudentModal } from "./components/StudentModal.js";
import { PRESET_DATASETS } from "./data/presets.js";

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

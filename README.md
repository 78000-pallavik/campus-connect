# CampusConnect (UniGraph)
### College Social Network & Graph DSA Discovery Engine

**CampusConnect (UniGraph)** is a graph-driven social network and algorithmic discovery platform designed specifically for college campuses. It models students as vertices ($V$) and mutual friendships as undirected edges ($E$). It provides visual, transparent, and mathematically rigorous tools to trace shortest connection paths (BFS), identify mutual friends via optimized set intersection, discover campus sub-communities (DFS connected components), and generate academic/social recommendations via a 2-hop neighbor score formula.

---

## 🌟 Key Features & PRD Implementation

### 1. Graph Data Structure (`Map<StudentID, Set<StudentID>>`)
- **Sparse Graph Optimization**: College social networks exhibit $|E| \ll |V|^2$.
- **Space Complexity**: $O(|V| + |E|)$.
- **Neighbor Lookups**: $O(1)$ time complexity using ES6 `Set` hashes.
- **Dynamic Mutation**: Add/remove students (vertices), add/remove friendships (undirected edges), and serialize to standard JSON.

### 2. Connection Path Finder (BFS)
- **Minimum Degrees of Separation**: Mathematically guaranteed shortest path in unweighted graphs using FIFO Queue traversal.
- **Cycle Prevention**: Visited set tracks explored vertices with $O(1)$ membership checks.
- **Interactive Visualizer**: Amber wave sequential exploration; resolved shortest path illuminates in Emerald Green.
- **Playback Controls**: Play, Pause, Step Next, Step Prev, Reset, Jump to End, with variable speed slider ($0.5\times$ to $3.5\times$).
- **Queue State Display**: Real-time visualization of queue enqueue and dequeue events.

### 3. Mutual Friends Discovery (Set Intersection)
- **Formula**: $\text{Friends}(A) \cap \text{Friends}(B)$.
- **Optimization**: Loops strictly over the smaller degree set: $O(\min(\text{deg}(A), \text{deg}(B)))$ rather than full vertex space.
- **Affinity Discovery**: Highlights mutual contacts in gold badges and displays shared campus clubs, shared dorms, and Jaccard similarity.

### 4. Alternative Paths & Campus Sub-Communities (DFS)
- **Alternative Routes**: Recursive backtracking DFS bounded by maximum hop depth ($k = 5$).
- **Maximal Connected Components**: Partitions campus into isolated dorm clusters, departments, and standalone students using DFS.
- **Sub-community Color-coding**: Visually colors distinct topological clusters on the physics canvas.

### 5. "The Quad" (Campus Social Feed)
- **Adjacency Filtering**: Switch between **Campus-Wide**, **Friends Only (1st-Degree)**, and **Extended Network (2-Hop)**.
- **Hashtag Filtering**: Filter updates by tags like `#Hackathon`, `#FormulaStudent`, `#DesignGuild`, `#MusicBand`, `#DSAStudyGroup`.
- **Engagement**: Like, comment, and inspect post authors directly on the canvas.

### 6. 2-Hop Recommendation Engine ("People You May Know")
- Explores 2-hop neighbors (friends of friends).
- Implements the exact weighted PRD scoring formula:
  $$\text{Score} = (\text{Mutual Friends} \times 3.5) + (\text{Same Major ? } 2.5 : 0) + (\text{Same Dorm ? } 2.0 : 0) + (\text{Shared Clubs} \times 1.5)$$
- One-click **Connect** action dynamically modifies the adjacency list and live physics canvas.

### 7. DSA Evaluator / Professor Verification Suite
- **Dijkstra Ground Truth Test**: Runs automated path verification comparing BFS against Dijkstra's baseline on unweighted graphs with 100% path discovery accuracy.
- **Set Intersection Optimization Test**: Verifies loop bounds do not exceed $\min(\text{deg}(A), \text{deg}(B))$.
- **Conservation of Vertices Test**: Validates $\sum |\text{Component}_i| = |V|$ with 0 overlapping vertices.
- **Formula Precision Test**: Validates recommendation scores against floating-point ground truth.
- **Asymptotic Complexity Table**: Clean reference for students and evaluators.

---

## 🚀 Quick Start (Zero Deployment Barrier)

CampusConnect is ready to run immediately in any modern web browser.

### Option 1: One-Click Launcher (Recommended for Windows)
Double-click **`start.bat`** in the project folder. It will:
1. Start the lightweight local web server on `http://localhost:8000`.
2. Automatically launch your default web browser to the application.

### Option 2: Python Command Line
```powershell
python start.py
# or:
python -m http.server 8000
```
Then navigate to [http://localhost:8000](http://localhost:8000).

### Option 3: Direct Double-Click (`file:///`)
Double-click [`index.html`](file:///c:/Users/91626/OneDrive/Desktop/campus%20connect/index.html). The app uses a universal bundle ([`js/bundle.js`](file:///c:/Users/91626/OneDrive/Desktop/campus%20connect/js/bundle.js)) with local offline vendors ([`vendor/`](file:///c:/Users/91626/OneDrive/Desktop/campus%20connect/vendor/)) so that modern browsers will not block it with `file://` CORS restrictions.

---

## 📂 Project Architecture

```
campus connect/
├── index.html                   # Main application entry point & glassmorphic UI
├── README.md                    # System documentation & PRD mapping
├── css/
│   └── styles.css               # Dark mode glassmorphic styling, glow shaders, custom scrollbars
├── js/
│   ├── Graph.js                 # Adjacency List graph structure (Map<ID, Set<ID>>)
│   ├── app.js                   # Main application controller & event wiring
│   ├── algorithms/
│   │   ├── BFS.js               # Shortest path engine with step trace generator
│   │   ├── DFS.js               # Bounded alternative routes & Connected Components
│   │   ├── SetOperations.js     # Optimized O(min(deg(A), deg(B))) mutual friends
│   │   ├── RecommendationEngine.js # 2-Hop weighted scoring algorithm
│   │   └── EvaluatorSuite.js    # Professor assertion test bench & baseline benchmarks
│   ├── components/
│   │   ├── CanvasManager.js     # Vis.js physics network renderer & highlight shaders
│   │   ├── PlaybackController.js# Step-by-step playback engine (0.5x - 3.5x)
│   │   ├── QuadFeed.js          # The Quad social feed with graph adjacency filters
│   │   └── StudentModal.js      # Student modal forms & slide-over profile drawer
│   └── data/
│       └── presets.js           # Collegiate datasets (28-node default & siloed clusters)
└── vendor/
    ├── vis-network.min.js       # Local offline Vis.js Network bundle
    ├── lucide.min.js            # Local offline Lucide icons bundle
    └── canvas-confetti.min.js   # Local offline confetti animations bundle
```

---

## 🔬 Asymptotic Complexity Summary

| Component | Time Complexity | Space Complexity | Theoretical Rationale |
| :--- | :--- | :--- | :--- |
| **Adjacency List** | Lookup: $O(1)$<br>Insert: $O(1)$ | $O(\|V\| + \|E\|)$ | Sparse graph optimization ($\|E\| \ll \|V\|^2$) |
| **Shortest Path (BFS)** | $O(\|V\| + \|E\|)$ | $O(\|V\|)$ | FIFO Queue + Visited Set; minimum degrees guarantee |
| **Mutual Friends** | $O(\min(\text{deg}(A), \text{deg}(B)))$ | $O(\min(\text{deg}(A), \text{deg}(B)))$ | Iterates exclusively over the smaller degree neighbor set |
| **Alternative Routes (DFS)**| $O(b^k)$ ($k \le 5$) | $O(k)$ call stack | Backtracking bounded by maximum 5 hops |
| **Sub-Communities (DFS)** | $O(\|V\| + \|E\|)$ | $O(\|V\|)$ | Disjoint set traversal discovering maximal connected components |
| **2-Hop Recommendations** | $O(\text{deg}(u) \cdot \overline{\text{deg}})$ | $O(\text{Candidates})$ | Traverses 2-hop neighborhood with weighted attribute ranking |

---

## 👥 Personas & Use Cases

- **Freshman / New Student**: Find seniors in the same major, join student clubs, discover mutual friends from the same dorm.
- **Hackathon Team Lead**: Find students with complementary skills (e.g., UI/UX design, hardware IoT, ML) through minimum degrees of separation.
- **Club President**: Broadcast club updates on "The Quad", analyze campus connectivity, and break departmental silos.
- **DSA Evaluator / Professor**: Verify theoretical implementation and runtime complexities of BFS, DFS, and Adjacency List representations using the built-in Evaluator Test Runner.

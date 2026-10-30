/**
 * CampusConnect - Modal & Drawer Component
 * Handles Add Student, Add Connection, and Student Profile Drawer
 */

export class StudentModal {
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

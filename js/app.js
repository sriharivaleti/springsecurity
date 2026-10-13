/**
 * SpringSec Master - Core Application Controller
 * Handles routing, search, filtering, completion tracking, example modals, and state management.
 */

class App {
  constructor() {
    this.currentTab = "overview";
    this.searchQuery = "";
    this.selectedLevel = "all";
    this.selectedCategory = "all";
    this.completedExamples = new Set(
      JSON.parse(localStorage.getItem("springsec_completed_examples") || "[]")
    );
    this.bookmarkedExamples = new Set(
      JSON.parse(localStorage.getItem("springsec_bookmarked_examples") || "[]")
    );
    this.interviewSearch = "";
    this.interviewCategory = "all";
    this.interviewLevel = "all";
  }

  init() {
    this.bindNavigation();
    this.bindSearchAndFilters();
    this.renderExamplesList();
    this.renderBlueprints();
    this.bindInterviewControls();
    this.renderInterviewQuestions();
    this.updateProgressMetrics();

    // Initialize sub-modules
    if (window.filterChainSim) window.filterChainSim.init();
    if (window.configGenerator) window.configGenerator.init();
    if (window.jwtDebugger) window.jwtDebugger.init();
    if (window.masteryQuiz) window.masteryQuiz.init();
    if (window.certificateGen) window.certificateGen.init();

    // Check URL hash for routing
    window.addEventListener("hashchange", () => this.handleHashChange());
    this.handleHashChange();
  }

  handleHashChange() {
    const hash = window.location.hash.replace("#", "") || "overview";
    if (hash.startsWith("example-")) {
      const exId = hash.replace("example-", "");
      this.switchTab("examples");
      this.openExampleModal(exId);
    } else {
      this.switchTab(hash);
    }
  }

  switchTab(tabId) {
    const validTabs = ["overview", "beginner", "examples", "blueprints", "simulator", "generator", "jwt-debugger", "quiz", "interview"];
    if (!validTabs.includes(tabId)) tabId = "overview";

    this.currentTab = tabId;

    // Update nav links
    document.querySelectorAll(".nav-link").forEach(link => {
      const target = link.getAttribute("data-tab");
      link.classList.toggle("active", target === tabId);
    });

    // Update tab sections
    document.querySelectorAll(".tab-pane").forEach(pane => {
      pane.classList.toggle("active", pane.id === `tab-${tabId}`);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  bindNavigation() {
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const tab = link.getAttribute("data-tab");
        window.location.hash = tab;
      });
    });

    const mobileMenuBtn = document.getElementById("mobile-menu-toggle");
    const navLinksContainer = document.querySelector(".nav-links");
    if (mobileMenuBtn && navLinksContainer) {
      mobileMenuBtn.addEventListener("click", () => {
        navLinksContainer.classList.toggle("open");
      });
    }
  }

  bindSearchAndFilters() {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderExamplesList();
      });
    }

    const levelSelect = document.getElementById("filter-level");
    if (levelSelect) {
      levelSelect.addEventListener("change", (e) => {
        this.selectedLevel = e.target.value;
        this.renderExamplesList();
      });
    }

    const catSelect = document.getElementById("filter-category");
    if (catSelect) {
      catSelect.addEventListener("change", (e) => {
        this.selectedCategory = e.target.value;
        this.renderExamplesList();
      });
    }

    // Populate categories dynamically
    if (catSelect && typeof EXAMPLES_DATA !== "undefined") {
      const categories = Array.from(new Set(EXAMPLES_DATA.map(ex => ex.category))).sort();
      categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
      });
    }
  }

  renderExamplesList() {
    const grid = document.getElementById("examples-grid");
    if (!grid || typeof EXAMPLES_DATA === "undefined") return;

    const filtered = EXAMPLES_DATA.filter(ex => {
      // Level filter
      if (this.selectedLevel !== "all" && ex.level.toString() !== this.selectedLevel) {
        return false;
      }
      // Category filter
      if (this.selectedCategory !== "all" && ex.category !== this.selectedCategory) {
        return false;
      }
      // Search filter
      if (this.searchQuery) {
        const matchTitle = ex.title.toLowerCase().includes(this.searchQuery);
        const matchSummary = ex.summary.toLowerCase().includes(this.searchQuery);
        const matchCategory = ex.category.toLowerCase().includes(this.searchQuery);
        const matchScenario = ex.scenario.toLowerCase().includes(this.searchQuery);
        const matchCode = ex.code.toLowerCase().includes(this.searchQuery);
        return matchTitle || matchSummary || matchCategory || matchScenario || matchCode;
      }
      return true;
    });

    const countEl = document.getElementById("examples-count");
    if (countEl) countEl.textContent = `Showing ${filtered.length} of ${EXAMPLES_DATA.length} Production Blueprints`;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>🔍 No examples match your search criteria. Try clearing filters or searching for terms like 'JWT', 'OAuth2', 'CORS', or 'WebFlux'.</p>
          <button class="btn btn-outline" onclick="window.app.resetFilters()">Clear Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(ex => {
      const isCompleted = this.completedExamples.has(ex.id);
      const isBookmarked = this.bookmarkedExamples.has(ex.id);

      return `
        <div class="example-card ${isCompleted ? 'completed' : ''}" data-id="${ex.id}">
          <div class="card-header">
            <span class="badge badge-level">Level ${ex.level}</span>
            <span class="badge badge-category">${ex.category}</span>
            <span class="badge badge-diff diff-${ex.difficulty.toLowerCase().replace(/\\s+/g, '-')}">${ex.difficulty}</span>
            <button class="btn-bookmark ${isBookmarked ? 'active' : ''}" onclick="window.app.toggleBookmark('${ex.id}', event)" title="Bookmark">
              ${isBookmarked ? '★' : '☆'}
            </button>
          </div>
          <h3 class="card-title">${ex.id.toUpperCase()}: ${ex.title}</h3>
          <p class="card-summary">${ex.summary}</p>
          <div class="card-footer">
            <label class="completion-checkbox" onclick="event.stopPropagation()">
              <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="window.app.toggleCompleted('${ex.id}')">
              <span>Completed</span>
            </label>
            <button class="btn btn-sm btn-primary" onclick="window.app.openExampleModal('${ex.id}')">
              Inspect Blueprint →
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  resetFilters() {
    this.searchQuery = "";
    this.selectedLevel = "all";
    this.selectedCategory = "all";

    const s = document.getElementById("search-input");
    const l = document.getElementById("filter-level");
    const c = document.getElementById("filter-category");
    if (s) s.value = "";
    if (l) l.value = "all";
    if (c) c.value = "all";

    this.renderExamplesList();
  }

  toggleCompleted(id) {
    if (this.completedExamples.has(id)) {
      this.completedExamples.delete(id);
    } else {
      this.completedExamples.add(id);
    }
    localStorage.setItem("springsec_completed_examples", JSON.stringify(Array.from(this.completedExamples)));
    this.updateProgressMetrics();
    this.renderExamplesList();
  }

  toggleBookmark(id, event) {
    if (event) event.stopPropagation();
    if (this.bookmarkedExamples.has(id)) {
      this.bookmarkedExamples.delete(id);
    } else {
      this.bookmarkedExamples.add(id);
    }
    localStorage.setItem("springsec_bookmarked_examples", JSON.stringify(Array.from(this.bookmarkedExamples)));
    this.renderExamplesList();
  }

  updateProgressMetrics() {
    const total = (typeof EXAMPLES_DATA !== "undefined") ? EXAMPLES_DATA.length : 50;
    const completed = this.completedExamples.size;
    const percentage = Math.round((completed / total) * 100);

    const navProgressText = document.getElementById("nav-progress-text");
    const navProgressBar = document.getElementById("nav-progress-bar");
    const overviewMetricsCount = document.getElementById("metric-completed-count");
    const overviewMetricsPercent = document.getElementById("metric-completed-percent");

    if (navProgressText) navProgressText.textContent = `${completed}/${total} Mastered (${percentage}%)`;
    if (navProgressBar) navProgressBar.style.width = `${percentage}%`;
    if (overviewMetricsCount) overviewMetricsCount.textContent = `${completed} / ${total}`;
    if (overviewMetricsPercent) overviewMetricsPercent.textContent = `${percentage}%`;
  }

  openExampleModal(exId) {
    const ex = EXAMPLES_DATA.find(e => e.id === exId);
    if (!ex) return;

    const modal = document.getElementById("example-modal");
    const titleEl = document.getElementById("modal-ex-title");
    const badgesEl = document.getElementById("modal-ex-badges");
    const scenarioEl = document.getElementById("modal-ex-scenario");
    const archEl = document.getElementById("modal-ex-arch");
    const codeEl = document.getElementById("modal-code-java");
    const configEl = document.getElementById("modal-code-config");
    const testEl = document.getElementById("modal-code-test");
    const pitfallsEl = document.getElementById("modal-ex-pitfalls");
    const completeBtn = document.getElementById("modal-btn-complete");

    if (titleEl) titleEl.textContent = `${ex.id.toUpperCase()}: ${ex.title}`;
    if (badgesEl) {
      badgesEl.innerHTML = `
        <span class="badge badge-level">${ex.levelName}</span>
        <span class="badge badge-category">${ex.category}</span>
        <span class="badge badge-diff">${ex.difficulty}</span>
      `;
    }
    if (scenarioEl) scenarioEl.textContent = ex.scenario;
    if (archEl) archEl.textContent = ex.architecture;
    if (codeEl) codeEl.textContent = ex.code;
    if (configEl) configEl.textContent = ex.config;
    if (testEl) testEl.textContent = ex.testing;
    if (pitfallsEl) pitfallsEl.textContent = ex.pitfalls;

    if (completeBtn) {
      const isCompleted = this.completedExamples.has(ex.id);
      completeBtn.innerHTML = isCompleted ? "✔ Completed" : "Mark as Mastered";
      completeBtn.className = isCompleted ? "btn btn-success" : "btn btn-primary";
      completeBtn.onclick = () => {
        this.toggleCompleted(ex.id);
        const updated = this.completedExamples.has(ex.id);
        completeBtn.innerHTML = updated ? "✔ Completed" : "Mark as Mastered";
        completeBtn.className = updated ? "btn btn-success" : "btn btn-primary";
      };
    }

    // Reset to Java tab
    this.switchModalTab("java");

    if (modal) {
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  }

  closeExampleModal() {
    const modal = document.getElementById("example-modal");
    if (modal) {
      modal.classList.remove("open");
      document.body.style.overflow = "auto";
    }
  }

  switchModalTab(tabName) {
    document.querySelectorAll(".modal-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
    });

    document.querySelectorAll(".modal-tab-content").forEach(c => {
      c.classList.toggle("active", c.id === `tab-content-${tabName}`);
    });
  }

  copyCurrentModalCode() {
    const activeCodePane = document.querySelector(".modal-tab-content.active pre code");
    if (!activeCodePane) return;
    navigator.clipboard.writeText(activeCodePane.textContent).then(() => {
      const copyBtn = document.getElementById("modal-btn-copy");
      if (copyBtn) {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = "✔ Copied!";
        setTimeout(() => copyBtn.innerHTML = orig, 2000);
      }
    });
  }

  renderBlueprints() {
    const container = document.getElementById("blueprints-container");
    if (!container || typeof SYSTEM_DESIGN_BLUEPRINTS === "undefined") return;

    container.innerHTML = SYSTEM_DESIGN_BLUEPRINTS.map(bp => `
      <div class="blueprint-card" id="${bp.id}">
        <div class="bp-header">
          <span class="badge badge-category">${bp.category}</span>
          <h2 class="bp-title">${bp.title}</h2>
          <p class="bp-tagline">${bp.tagline}</p>
        </div>

        <div class="bp-diagram-wrapper">
          ${bp.diagramSvg}
        </div>

        <div class="bp-content">
          <p class="bp-summary">${bp.summary}</p>
          
          <h4 class="section-subtitle">System Trade-Off Matrix</h4>
          <div class="tradeoff-table-wrapper">
            <table class="tradeoff-table">
              <thead>
                <tr>
                  <th>Architectural Criterion</th>
                  <th>Stateless / Alternative</th>
                  <th>Stateful / Standard Approach</th>
                </tr>
              </thead>
              <tbody>
                ${bp.tradeoffs.map(t => `
                  <tr>
                    <td><strong>${t.criterion}</strong></td>
                    <td>${t.statelessJwt}</td>
                    <td>${t.redisSession}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="bp-deepdive">
            ${bp.deepDive}
          </div>
        </div>
      </div>
    `).join("");
  }

  bindInterviewControls() {
    const s = document.getElementById("interview-search");
    if (s) {
      s.addEventListener("input", (e) => {
        this.interviewSearch = e.target.value.toLowerCase().trim();
        this.renderInterviewQuestions();
      });
    }

    const cat = document.getElementById("interview-filter-category");
    if (cat) {
      cat.addEventListener("change", (e) => {
        this.interviewCategory = e.target.value;
        this.renderInterviewQuestions();
      });

      // Populate categories dynamically from INTERVIEW_QUESTIONS
      if (typeof INTERVIEW_QUESTIONS !== "undefined") {
        const categories = Array.from(new Set(INTERVIEW_QUESTIONS.map(q => q.category))).sort();
        categories.forEach(c => {
          const opt = document.createElement("option");
          opt.value = c;
          opt.textContent = c;
          cat.appendChild(opt);
        });
      }
    }

    const lvl = document.getElementById("interview-filter-level");
    if (lvl) {
      lvl.addEventListener("change", (e) => {
        this.interviewLevel = e.target.value;
        this.renderInterviewQuestions();
      });
    }

    const btnExpand = document.getElementById("interview-btn-expand");
    if (btnExpand) btnExpand.addEventListener("click", () => this.expandAllInterviews());

    const btnCollapse = document.getElementById("interview-btn-collapse");
    if (btnCollapse) btnCollapse.addEventListener("click", () => this.collapseAllInterviews());
  }

  renderInterviewQuestions() {
    const list = document.getElementById("interview-list");
    if (!list || typeof INTERVIEW_QUESTIONS === "undefined") return;

    const filtered = INTERVIEW_QUESTIONS.filter(q => {
      if (this.interviewCategory !== "all" && q.category !== this.interviewCategory) return false;
      if (this.interviewLevel !== "all" && q.level !== this.interviewLevel) return false;
      if (this.interviewSearch) {
        const matchQ = q.question.toLowerCase().includes(this.interviewSearch);
        const matchSimple = q.simpleAnswer.toLowerCase().includes(this.interviewSearch);
        const matchDeep = q.architectDeepDive.toLowerCase().includes(this.interviewSearch);
        const matchTags = q.tags.some(t => t.toLowerCase().includes(this.interviewSearch));
        return matchQ || matchSimple || matchDeep || matchTags;
      }
      return true;
    });

    const countEl = document.getElementById("interview-count-badge");
    if (countEl) countEl.textContent = `Showing ${filtered.length} of ${INTERVIEW_QUESTIONS.length} Interview Q&As`;

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <p>🔍 No interview questions match your filter. Try searching for 'JWT', 'CSRF', 'Proxy', or 'Zero-Trust'.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map((q, idx) => `
      <div class="interview-item" id="item-${q.id}">
        <div class="interview-header" onclick="window.app.toggleInterview('${q.id}')">
          <div class="interview-q-title">
            <span class="interview-q-num">${q.id.toUpperCase()}</span>
            <span>${q.question}</span>
          </div>
          <div class="interview-badges">
            <span class="badge badge-category">${q.category}</span>
            <span class="badge badge-diff ${q.level.includes('Staff') ? 'diff-staff-architect' : (q.level.includes('Senior') ? 'diff-advanced' : 'diff-intermediate')}">${q.level}</span>
            <span class="interview-toggle-icon">▼</span>
          </div>
        </div>
        <div class="interview-body">
          <div class="answer-simple-box">
            <div class="answer-label simple">
              <span>💡 Simple Plain-English Answer (Executive Summary):</span>
            </div>
            <div class="answer-text">${q.simpleAnswer}</div>
          </div>

          <div class="answer-architect-box">
            <div class="answer-label architect">
              <span>🛡️ Staff / Principal Architect Deep-Dive (16+ Yrs Experience Level):</span>
            </div>
            <div class="answer-text">${q.architectDeepDive}</div>
          </div>

          <div class="interview-footer-row">
            <div class="interview-tags">
              ${q.tags.map(t => `<span class="tag-pill">#${t}</span>`).join("")}
            </div>
            <button class="btn btn-sm btn-outline" onclick="window.app.copyInterview('${q.id}', event)">
              📋 Copy Answer
            </button>
          </div>
        </div>
      </div>
    `).join("");
  }

  toggleInterview(id) {
    const el = document.getElementById(`item-${id}`);
    if (el) {
      el.classList.toggle("open");
    }
  }

  expandAllInterviews() {
    document.querySelectorAll(".interview-item").forEach(item => item.classList.add("open"));
  }

  collapseAllInterviews() {
    document.querySelectorAll(".interview-item").forEach(item => item.classList.remove("open"));
  }

  copyInterview(id, event) {
    if (event) event.stopPropagation();
    const q = INTERVIEW_QUESTIONS.find(item => item.id === id);
    if (!q) return;

    const textToCopy = `Question: ${q.question}\n\nSimple Answer:\n${q.simpleAnswer}\n\nStaff Architect Deep-Dive:\n${q.architectDeepDive}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      const btn = event ? event.target : null;
      if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = "✔ Copied!";
        setTimeout(() => btn.innerHTML = orig, 1800);
      }
    });
  }
}

window.app = new App();

document.addEventListener("DOMContentLoaded", () => {
  window.app.init();
});

/**
 * SpringSec Master - Interactive Mastery Assessment Quiz
 * 12 Deep Architectural & Technical Questions from Level 0 to Level 5.
 */

const QUIZ_QUESTIONS = [
  {
    id: "q1",
    level: "Level 0: Foundations",
    question: "In Spring Security 6 / Spring Boot 3, which class was completely removed, enforcing bean-based configuration?",
    options: [
      "SecurityFilterChain",
      "WebSecurityConfigurerAdapter",
      "DelegatingFilterProxy",
      "AuthenticationManager"
    ],
    answer: 1,
    explanation: "WebSecurityConfigurerAdapter was deprecated in Spring Security 5.7 and completely removed in Spring Security 6.0 in favor of registering a SecurityFilterChain bean."
  },
  {
    id: "q2",
    level: "Level 0: Foundations",
    question: "What is the difference between hasRole('ADMIN') and hasAuthority('ADMIN')?",
    options: [
      "hasRole checks exact string 'ADMIN', while hasAuthority prefixes with 'ROLE_'",
      "hasRole automatically prepends the prefix 'ROLE_' (checking for 'ROLE_ADMIN'), whereas hasAuthority checks the exact string 'ADMIN'",
      "hasRole is evaluated at compile-time, hasAuthority is evaluated at runtime",
      "There is no difference; they are aliases"
    ],
    answer: 1,
    explanation: "hasRole('ADMIN') expects the GrantedAuthority to be 'ROLE_ADMIN'. hasAuthority('ADMIN') checks for the exact authority 'ADMIN' with no prefix."
  },
  {
    id: "q3",
    level: "Level 1: Core Auth",
    question: "Why must CorsFilter be configured before AuthorizationFilter in the Spring Security filter chain?",
    options: [
      "Because CORS is only needed for GET requests",
      "Because HTTP OPTIONS preflight requests do not send credentials and must be allowed through before authorization checks occur",
      "Because CorsFilter creates the user's session",
      "To compress response headers"
    ],
    answer: 1,
    explanation: "Browsers dispatch HTTP OPTIONS preflights without authorization headers. If AuthorizationFilter runs first, it would reject preflight requests with 401/403, breaking all cross-origin frontend calls."
  },
  {
    id: "q4",
    level: "Level 1: Core Auth",
    question: "When should CSRF protection be disabled in Spring Security?",
    options: [
      "Always, because CSRF is an obsolete vulnerability",
      "Only for stateless REST APIs that authenticate exclusively via Authorization: Bearer tokens and use zero browser session cookies",
      "Whenever you use PostgreSQL",
      "Whenever you are using React or Vue"
    ],
    answer: 1,
    explanation: "CSRF exploits the browser's automatic sending of session cookies on cross-origin requests. Pure stateless APIs using Bearer headers stored outside browser auto-cookie mechanisms are immune, but any app relying on cookies must keep CSRF enabled."
  },
  {
    id: "q5",
    level: "Level 2: Modern REST",
    question: "Why is storing JWT access tokens in browser localStorage or sessionStorage an architectural security risk?",
    options: [
      "Because localStorage has a 5MB storage limit",
      "Because localStorage is vulnerable to XSS; any injected JavaScript can read and exfiltrate the token to an attacker",
      "Because browsers automatically clear localStorage every 24 hours",
      "Because Spring Boot cannot decode tokens originating from localStorage"
    ],
    answer: 1,
    explanation: "Any Cross-Site Scripting (XSS) vulnerability or malicious third-party dependency can access localStorage. In contrast, an HttpOnly cookie cannot be read by JavaScript."
  },
  {
    id: "q6",
    level: "Level 2: Modern REST",
    question: "How does 'Refresh Token Rotation' prevent stolen refresh tokens from being abused indefinitely?",
    options: [
      "It changes the user's password automatically",
      "Every time a refresh token is used, it is invalidated and replaced with a new token; if a consumed token is reused, all tokens in that family are revoked immediately",
      "It limits token usage to Monday through Friday",
      "It encrypts the database table"
    ],
    answer: 1,
    explanation: "Token family tracking ensures single-use refresh tokens. If an attacker and victim both attempt to use the same refresh token, reuse detection identifies the breach and revokes the entire family."
  },
  {
    id: "q7",
    level: "Level 3: OAuth2 / OIDC",
    question: "Why does OAuth 2.1 mandate PKCE (Proof Key for Code Exchange) even for confidential server-side clients?",
    options: [
      "To prevent authorization code interception and injection attacks during the redirect exchange",
      "To replace SSL/TLS encryption",
      "To speed up database indexing",
      "Because client secrets are no longer allowed"
    ],
    answer: 0,
    explanation: "PKCE dynamically binds the authorization code exchange to the entity that initiated the authorization request via code_verifier and code_challenge, stopping interception attacks."
  },
  {
    id: "q8",
    level: "Level 3: OAuth2 / OIDC",
    question: "What is the primary role of a Spring Security Resource Server?",
    options: [
      "It provides a login screen to collect usernames and passwords",
      "It validates access tokens issued by an external Authorization Server (IdP) and enforces authorization on protected endpoints",
      "It hosts static HTML and CSS files",
      "It acts as a certificate authority"
    ],
    answer: 1,
    explanation: "A Resource Server does not authenticate users directly; it trusts an IdP (Keycloak, Okta, Auth0) and validates incoming JWT or opaque Bearer tokens against the IdP's JWKS or introspection endpoint."
  },
  {
    id: "q9",
    level: "Level 4: Microservices",
    question: "What is the primary security advantage of the Backend-For-Frontend (BFF) pattern over direct SPA-to-Microservice calls?",
    options: [
      "BFF removes the need for Spring Boot",
      "BFF keeps access & refresh tokens entirely on the server (in the Gateway/Redis), using only secure HttpOnly SameSite cookies towards the browser",
      "BFF allows unlimited rate limits",
      "BFF eliminates the need for database backups"
    ],
    answer: 1,
    explanation: "By confining OAuth2 tokens to the server-side Gateway/BFF and using HttpOnly cookies with the browser, the browser JS never touches the token, neutralizing token exfiltration via XSS."
  },
  {
    id: "q10",
    level: "Level 4: Microservices",
    question: "Why must rate-limiting or anti-bot CAPTCHA filters execute BEFORE the DaoAuthenticationProvider?",
    options: [
      "Because DaoAuthenticationProvider uses BCrypt, which is deliberately CPU-intensive; running it first enables DDoS and CPU exhaustion attacks",
      "Because Spring Security crashes otherwise",
      "Because CAPTCHA requires a database transaction",
      "Because HTTP requests cannot contain headers after authentication"
    ],
    answer: 0,
    explanation: "BCrypt hashing with work factor 12 takes ~100-200ms of CPU time. If an attacker floods the login endpoint with requests, verifying passwords before rate-limiting will peg the server CPU at 100% and cause denial of service."
  },
  {
    id: "q11",
    level: "Level 5: Reactive & Zero-Trust",
    question: "Why is calling SecurityContextHolder.getContext() catastrophic in a Spring WebFlux reactive application?",
    options: [
      "It returns a syntax error at compile time",
      "Because WebFlux uses Netty event loops where worker threads are shared across many concurrent requests; ThreadLocal will leak credentials between random users",
      "Because WebFlux does not support Spring Security",
      "Because Netty disables all Java reflections"
    ],
    answer: 1,
    explanation: "SecurityContextHolder defaults to ThreadLocal. In non-blocking reactive pipelines, a single thread processes chunks of dozens of requests concurrently. ReactiveSecurityContextHolder based on Reactor Context must be used instead."
  },
  {
    id: "q12",
    level: "Level 5: Reactive & Zero-Trust",
    question: "In a Zero-Trust architecture, what does SPIFFE (Secure Production Identity Framework for Everyone) provide?",
    options: [
      "A relational database schema for users",
      "A standardized, cryptographic verifiable workload identity format (SPIFFE ID and X.509 SVID) for automated inter-service attestation",
      "A replacement for Spring MVC",
      "A hardware firewall"
    ],
    answer: 1,
    explanation: "SPIFFE provides a universal cryptographic identity document (SVID) that software workloads present during mTLS handshakes, proving identity across multi-cloud and Kubernetes clusters."
  }
];

class MasteryQuiz {
  constructor() {
    this.currentIndex = 0;
    this.score = 0;
    this.userAnswers = {};
  }

  init() {
    this.renderQuestion();
    this.bindEvents();
  }

  renderQuestion() {
    const q = QUIZ_QUESTIONS[this.currentIndex];
    const total = QUIZ_QUESTIONS.length;

    const progressEl = document.getElementById("quiz-progress-text");
    const progressBar = document.getElementById("quiz-progress-fill");
    const levelBadge = document.getElementById("quiz-level-badge");
    const questionEl = document.getElementById("quiz-question-text");
    const optionsContainer = document.getElementById("quiz-options-container");
    const feedbackEl = document.getElementById("quiz-feedback");

    if (progressEl) progressEl.textContent = `Question ${this.currentIndex + 1} of ${total}`;
    if (progressBar) progressBar.style.width = `${((this.currentIndex) / total) * 100}%`;
    if (levelBadge) levelBadge.textContent = q.level;
    if (questionEl) questionEl.textContent = q.question;
    if (feedbackEl) {
      feedbackEl.style.display = "none";
      feedbackEl.className = "quiz-feedback";
    }

    if (optionsContainer) {
      optionsContainer.innerHTML = q.options.map((opt, idx) => `
        <button class="quiz-option-btn" data-idx="${idx}">
          <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
          <span class="opt-text">${opt}</span>
        </button>
      `).join("");

      optionsContainer.querySelectorAll(".quiz-option-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(btn.getAttribute("data-idx"), 10);
          this.submitAnswer(idx);
        });
      });
    }

    const nextBtn = document.getElementById("quiz-btn-next");
    if (nextBtn) {
      nextBtn.style.display = "none";
      nextBtn.textContent = (this.currentIndex === total - 1) ? "View Results & Claim Certificate 🏆" : "Next Question →";
    }
  }

  submitAnswer(selectedIdx) {
    const q = QUIZ_QUESTIONS[this.currentIndex];
    const optionsContainer = document.getElementById("quiz-options-container");
    const feedbackEl = document.getElementById("quiz-feedback");
    const nextBtn = document.getElementById("quiz-btn-next");

    // Disable all options
    const btns = optionsContainer.querySelectorAll(".quiz-option-btn");
    btns.forEach(btn => btn.disabled = true);

    const isCorrect = (selectedIdx === q.answer);
    if (isCorrect) {
      this.score++;
      btns[selectedIdx].classList.add("correct");
    } else {
      btns[selectedIdx].classList.add("incorrect");
      btns[q.answer].classList.add("correct");
    }

    this.userAnswers[this.currentIndex] = { selected: selectedIdx, correct: isCorrect };

    if (feedbackEl) {
      feedbackEl.style.display = "block";
      feedbackEl.className = `quiz-feedback ${isCorrect ? 'feedback-success' : 'feedback-error'}`;
      feedbackEl.innerHTML = `
        <strong>${isCorrect ? '✔ Correct!' : '✖ Incorrect.'}</strong>
        <p>${q.explanation}</p>
      `;
    }

    if (nextBtn) {
      nextBtn.style.display = "inline-flex";
    }
  }

  next() {
    if (this.currentIndex < QUIZ_QUESTIONS.length - 1) {
      this.currentIndex++;
      this.renderQuestion();
    } else {
      this.showFinalResults();
    }
  }

  showFinalResults() {
    const container = document.getElementById("quiz-card");
    const total = QUIZ_QUESTIONS.length;
    const percentage = Math.round((this.score / total) * 100);
    const passed = percentage >= 75;

    // Save mastery score
    localStorage.setItem("springsec_quiz_score", percentage);

    if (container) {
      container.innerHTML = `
        <div class="quiz-results">
          <div class="results-badge">${passed ? "🏆 MASTERY ACHIEVED" : "📚 KEEP LEARNING"}</div>
          <h2>Your Assessment Score: ${this.score} / ${total} (${percentage}%)</h2>
          <p class="results-desc">
            ${passed 
              ? "Outstanding performance! You have proven deep, production-grade proficiency in Spring Security 6 internals, REST/OAuth2 architecture, and Zero-Trust system design."
              : "Good effort! Review the 50 production examples and System Design Blueprints to master the subtle failure modes and retake the assessment."
            }
          </p>

          <div class="results-actions">
            ${passed ? `
              <button class="btn btn-primary" onclick="showCertificateModal(${percentage})">
                🎓 Generate Your Verified Certificate
              </button>
            ` : ""}
            <button class="btn btn-outline" onclick="window.masteryQuiz.restart()">
              🔄 Retake Quiz
            </button>
          </div>
        </div>
      `;
    }
  }

  restart() {
    this.currentIndex = 0;
    this.score = 0;
    this.userAnswers = {};
    const quizCard = document.getElementById("quiz-card");
    if (quizCard) {
      quizCard.innerHTML = `
        <div class="quiz-header">
          <div class="quiz-meta">
            <span id="quiz-level-badge" class="badge badge-level">Level 0: Foundations</span>
            <span id="quiz-progress-text" class="quiz-counter">Question 1 of 12</span>
          </div>
          <div class="quiz-progress-bar">
            <div id="quiz-progress-fill" class="quiz-progress-fill"></div>
          </div>
        </div>
        <div class="quiz-body">
          <h3 id="quiz-question-text" class="quiz-question">Loading question...</h3>
          <div id="quiz-options-container" class="quiz-options"></div>
          <div id="quiz-feedback" class="quiz-feedback" style="display: none;"></div>
        </div>
        <div class="quiz-footer">
          <button id="quiz-btn-next" class="btn btn-primary" style="display: none;">Next Question →</button>
        </div>
      `;
    }
    this.renderQuestion();
    this.bindEvents();
  }

  bindEvents() {
    const nextBtn = document.getElementById("quiz-btn-next");
    if (nextBtn) {
      nextBtn.onclick = () => this.next();
    }
  }
}

window.masteryQuiz = new MasteryQuiz();

/**
 * SpringSec Master - Interactive Security Filter Chain Simulator
 * Step-by-step interactive animation and internal mechanics simulation
 */

const FILTER_CHAIN_SCENARIOS = {
  "jwt-valid": {
    name: "Valid Bearer JWT -> Protected API",
    method: "POST",
    url: "/api/orders",
    headers: {
      "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "Content-Type": "application/json"
    },
    body: '{"item": "Laptop", "price": 1299.99}',
    steps: [
      {
        node: "node-client",
        title: "Client Dispatches Request",
        desc: "Client sends HTTP POST /api/orders with Authorization: Bearer <valid_jwt>.",
        status: "success",
        context: "Unauthenticated"
      },
      {
        node: "node-delegating",
        title: "DelegatingFilterProxy (Servlet Container)",
        desc: "Servlet container intercepts request; bridges to Spring ApplicationContext by looking up the 'springSecurityFilterChain' bean.",
        status: "success",
        context: "Delegating to Spring"
      },
      {
        node: "node-filterchainproxy",
        title: "FilterChainProxy (Spring Security Root)",
        desc: "Evaluates matching SecurityFilterChain using request URI '/api/orders'. Selects the API SecurityFilterChain bean.",
        status: "success",
        context: "Chain Selected"
      },
      {
        node: "node-cors",
        title: "CorsFilter",
        desc: "Checks request Origin header against allowed origins list. Allowed. Continues chain.",
        status: "success",
        context: "CORS Verified"
      },
      {
        node: "node-csrf",
        title: "CsrfFilter",
        desc: "Stateless REST API config has csrf.disable(), or validates token if enabled. Bypassed for pure stateless JWT.",
        status: "success",
        context: "CSRF Passed"
      },
      {
        node: "node-auth-filter",
        title: "JwtAuthenticationFilter (OncePerRequestFilter)",
        desc: "Extracts Bearer token string. Parses claims and validates RSA/HMAC signature.",
        status: "success",
        context: "Extracting Bearer Token"
      },
      {
        node: "node-auth-manager",
        title: "AuthenticationManager & Provider",
        desc: "JwtAuthenticationProvider validates token timestamp (exp > now, nbf <= now, iss matches). Signature verified with public JWK.",
        status: "success",
        context: "Token Validated"
      },
      {
        node: "node-security-context",
        title: "SecurityContextHolder Established",
        desc: "Creates JwtAuthenticationToken principal with authorities [ROLE_CUSTOMER]. Populates SecurityContextHolder.getContext().setAuthentication(...).",
        status: "success",
        context: "Principal: alice (ROLE_CUSTOMER)"
      },
      {
        node: "node-authorization",
        title: "AuthorizationFilter (Spring Security 6)",
        desc: "Evaluates requestMatchers('/api/orders/**').hasAnyRole('CUSTOMER','ADMIN'). Alice has ROLE_CUSTOMER -> AuthorizationDecision(true).",
        status: "success",
        context: "Access Granted"
      },
      {
        node: "node-controller",
        title: "DispatcherServlet & OrderController",
        desc: "Request reaches @PostMapping('/api/orders'). Method executes business logic. Returns HTTP 201 Created.",
        status: "success",
        context: "201 Created"
      }
    ]
  },
  "jwt-expired": {
    name: "Expired JWT -> 401 Unauthorized",
    method: "GET",
    url: "/api/orders/101",
    headers: {
      "Authorization": "Bearer eyJhbGciOiJSUzI1Ni...[EXPIRED]",
    },
    body: null,
    steps: [
      {
        node: "node-client",
        title: "Client Dispatches Request",
        desc: "Client sends HTTP GET /api/orders/101 with an expired JWT access token.",
        status: "success",
        context: "Unauthenticated"
      },
      {
        node: "node-delegating",
        title: "DelegatingFilterProxy",
        desc: "Bridges servlet request to Spring Security FilterChainProxy.",
        status: "success",
        context: "Delegating"
      },
      {
        node: "node-filterchainproxy",
        title: "FilterChainProxy",
        desc: "Routes request through active SecurityFilterChain.",
        status: "success",
        context: "Chain Selected"
      },
      {
        node: "node-auth-filter",
        title: "JwtAuthenticationFilter",
        desc: "Parses token. JwtDecoder throws ExpiredJwtException ('Jwt expired at 2026-10-12T04:00:00Z').",
        status: "error",
        context: "ExpiredJwtException"
      },
      {
        node: "node-exception-trans",
        title: "ExceptionTranslationFilter & EntryPoint",
        desc: "Catches AuthenticationException. Invokes BearerTokenAuthenticationEntryPoint. Commences JSON 401 response with 'error=invalid_token'.",
        status: "error",
        context: "401 Unauthorized"
      }
    ]
  },
  "rbac-denied": {
    name: "Regular User -> Admin Endpoint (403 Forbidden)",
    method: "DELETE",
    url: "/api/admin/users/42",
    headers: {
      "Authorization": "Bearer eyJhbGciOiJSUzI1Ni...[ROLE_USER]",
    },
    body: null,
    steps: [
      {
        node: "node-client",
        title: "Client Dispatches Request",
        desc: "User 'bob' (ROLE_USER) attempts to call admin deletion API.",
        status: "success",
        context: "Unauthenticated"
      },
      {
        node: "node-auth-filter",
        title: "JwtAuthenticationFilter",
        desc: "Token is cryptographically valid. Extracts subject 'bob' and authority 'ROLE_USER'.",
        status: "success",
        context: "Valid Token"
      },
      {
        node: "node-security-context",
        title: "SecurityContextHolder Established",
        desc: "SecurityContext populated with principal 'bob' possessing [ROLE_USER].",
        status: "success",
        context: "Principal: bob (ROLE_USER)"
      },
      {
        node: "node-authorization",
        title: "AuthorizationFilter (Spring Security 6)",
        desc: "Evaluates rule: requestMatchers('/api/admin/**').hasRole('ADMIN'). Bob only has ROLE_USER. Throws AccessDeniedException!",
        status: "error",
        context: "AccessDeniedException"
      },
      {
        node: "node-exception-trans",
        title: "AccessDeniedHandler",
        desc: "Catches AccessDeniedException. Writes JSON 403 Forbidden: 'Insufficient permissions for resource'.",
        status: "error",
        context: "403 Forbidden"
      }
    ]
  },
  "csrf-blocked": {
    name: "SPA POST Missing CSRF Token -> 403 Forbidden",
    method: "POST",
    url: "/api/banking/transfer",
    headers: {
      "Cookie": "JSESSIONID=A9F732BC44...",
      "Content-Type": "application/json"
    },
    body: '{"recipient": "Mallory", "amount": 5000}',
    steps: [
      {
        node: "node-client",
        title: "Browser Issues Mutation Request",
        desc: "Browser automatically attaches session cookie, but omits X-XSRF-TOKEN header.",
        status: "success",
        context: "Session Cookie Attached"
      },
      {
        node: "node-csrf",
        title: "CsrfFilter",
        desc: "Detects state-changing HTTP POST method. Compares expected CSRF token from session against request header 'X-XSRF-TOKEN'. Header is missing! Rejects request.",
        status: "error",
        context: "InvalidCsrfTokenException"
      },
      {
        node: "node-exception-trans",
        title: "AccessDeniedHandler",
        desc: "Catches InvalidCsrfTokenException. Aborts pipeline and immediately sends HTTP 403 Forbidden. Protects user account from cross-site exploitation.",
        status: "error",
        context: "403 CSRF Token Missing"
      }
    ]
  }
};

class FilterChainSimulator {
  constructor() {
    this.currentScenarioKey = "jwt-valid";
    this.currentStepIndex = 0;
    this.isPlaying = false;
    this.timer = null;
  }

  init() {
    this.renderScenarioSelector();
    this.loadScenario("jwt-valid");
    this.bindEvents();
  }

  renderScenarioSelector() {
    const select = document.getElementById("sim-scenario-select");
    if (!select) return;
    select.innerHTML = Object.entries(FILTER_CHAIN_SCENARIOS)
      .map(([key, sc]) => `<option value="${key}">${sc.name}</option>`)
      .join("");
  }

  loadScenario(key) {
    this.stopAutoPlay();
    this.currentScenarioKey = key;
    this.currentStepIndex = 0;
    const sc = FILTER_CHAIN_SCENARIOS[key];

    // Update request preview
    const badgeMethod = document.getElementById("sim-req-method");
    const spanUrl = document.getElementById("sim-req-url");
    const preHeaders = document.getElementById("sim-req-headers");

    if (badgeMethod) badgeMethod.textContent = sc.method;
    if (spanUrl) spanUrl.textContent = sc.url;
    if (preHeaders) {
      const headerStr = Object.entries(sc.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      preHeaders.textContent = headerStr + (sc.body ? `\n\n${sc.body}` : "");
    }

    this.resetNodes();
    this.updateStepUI();
  }

  resetNodes() {
    document.querySelectorAll(".sim-node").forEach(node => {
      node.classList.remove("active", "passed", "failed");
    });
  }

  updateStepUI() {
    const sc = FILTER_CHAIN_SCENARIOS[this.currentScenarioKey];
    const totalSteps = sc.steps.length;
    const currentStep = sc.steps[this.currentStepIndex];

    // Reset past nodes
    document.querySelectorAll(".sim-node").forEach(n => {
      n.classList.remove("active", "pulse");
    });

    // Mark completed nodes
    for (let i = 0; i < this.currentStepIndex; i++) {
      const step = sc.steps[i];
      const el = document.getElementById(step.node);
      if (el) {
        el.classList.remove("failed");
        el.classList.add("passed");
      }
    }

    // Mark current node
    if (currentStep) {
      const activeEl = document.getElementById(currentStep.node);
      if (activeEl) {
        activeEl.classList.add("active");
        if (currentStep.status === "error") {
          activeEl.classList.add("failed");
        }
      }

      // Update log display
      const logTitle = document.getElementById("sim-log-title");
      const logDesc = document.getElementById("sim-log-desc");
      const logContext = document.getElementById("sim-log-context");
      const stepCounter = document.getElementById("sim-step-counter");

      if (logTitle) logTitle.textContent = currentStep.title;
      if (logDesc) logDesc.textContent = currentStep.desc;
      if (logContext) logContext.textContent = `SecurityContext: ${currentStep.context}`;
      if (stepCounter) stepCounter.textContent = `Step ${this.currentStepIndex + 1} of ${totalSteps}`;
    }

    // Update button states
    const btnPrev = document.getElementById("sim-btn-prev");
    const btnNext = document.getElementById("sim-btn-next");
    if (btnPrev) btnPrev.disabled = (this.currentStepIndex === 0);
    if (btnNext) btnNext.disabled = (this.currentStepIndex >= totalSteps - 1);
  }

  nextStep() {
    const sc = FILTER_CHAIN_SCENARIOS[this.currentScenarioKey];
    if (this.currentStepIndex < sc.steps.length - 1) {
      this.currentStepIndex++;
      this.updateStepUI();
    } else {
      this.stopAutoPlay();
    }
  }

  prevStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.updateStepUI();
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }

  startAutoPlay() {
    const sc = FILTER_CHAIN_SCENARIOS[this.currentScenarioKey];
    if (this.currentStepIndex >= sc.steps.length - 1) {
      this.currentStepIndex = 0;
      this.resetNodes();
      this.updateStepUI();
    }
    this.isPlaying = true;
    const btnPlay = document.getElementById("sim-btn-play");
    if (btnPlay) btnPlay.innerHTML = "⏸ Pause";

    this.timer = setInterval(() => {
      if (this.currentStepIndex < sc.steps.length - 1) {
        this.nextStep();
      } else {
        this.stopAutoPlay();
      }
    }, 1500);
  }

  stopAutoPlay() {
    this.isPlaying = false;
    clearInterval(this.timer);
    this.timer = null;
    const btnPlay = document.getElementById("sim-btn-play");
    if (btnPlay) btnPlay.innerHTML = "▶ Auto Play";
  }

  bindEvents() {
    const select = document.getElementById("sim-scenario-select");
    if (select) {
      select.addEventListener("change", (e) => this.loadScenario(e.target.value));
    }
    const btnNext = document.getElementById("sim-btn-next");
    if (btnNext) btnNext.addEventListener("click", () => this.nextStep());

    const btnPrev = document.getElementById("sim-btn-prev");
    if (btnPrev) btnPrev.addEventListener("click", () => this.prevStep());

    const btnPlay = document.getElementById("sim-btn-play");
    if (btnPlay) btnPlay.addEventListener("click", () => this.togglePlay());

    const btnReset = document.getElementById("sim-btn-reset");
    if (btnReset) btnReset.addEventListener("click", () => this.loadScenario(this.currentScenarioKey));
  }
}

// Global instance initialized on DOMContentLoaded
window.filterChainSim = new FilterChainSimulator();

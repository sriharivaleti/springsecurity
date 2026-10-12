/**
 * SpringSec Master - System Design Concepts for Spring Security
 * Architectural blueprints, trade-off matrices, failure modes, and distributed topologies.
 */

const SYSTEM_DESIGN_BLUEPRINTS = [
  {
    id: "arch-01",
    title: "Stateless JWT vs Clustered Redis Session Architecture",
    tagline: "Comparing Scalability, Revocation Latency, and Memory Footprints in Production Systems",
    summary: "The fundamental architectural choice when designing a modern Java web application: completely stateless tokens vs horizontally scalable session clustering.",
    category: "Core Architecture",
    diagramSvg: `
      <svg viewBox="0 0 800 380" class="blueprint-svg">
        <defs>
          <linearGradient id="jwtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0284c7"/>
          </linearGradient>
          <linearGradient id="redisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#b91c1c"/>
          </linearGradient>
          <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>

        <!-- Left: Stateless JWT -->
        <g transform="translate(20, 20)">
          <rect width="360" height="340" rx="12" fill="#111827" stroke="#374151" stroke-width="1.5"/>
          <text x="180" y="32" fill="#38bdf8" font-size="16" font-weight="700" text-anchor="middle">Pattern A: Stateless JWT</text>
          
          <!-- Client -->
          <rect x="30" y="60" width="120" height="45" rx="8" fill="url(#jwtGrad)"/>
          <text x="90" y="87" fill="#ffffff" font-size="12" font-weight="600" text-anchor="middle">Client (SPA/Mobile)</text>

          <!-- Arrow -->
          <path d="M150 82 L210 82" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)"/>
          <text x="180" y="75" fill="#9ca3af" font-size="9" text-anchor="middle">Bearer Token</text>

          <!-- Spring Boot Instance 1 -->
          <rect x="210" y="60" width="120" height="45" rx="8" fill="url(#nodeGrad)" stroke="#38bdf8" stroke-width="1.5"/>
          <text x="270" y="87" fill="#f3f4f6" font-size="12" font-weight="600" text-anchor="middle">Spring Boot Pod 1</text>

          <!-- Spring Boot Instance 2 -->
          <rect x="210" y="130" width="120" height="45" rx="8" fill="url(#nodeGrad)" stroke="#38bdf8" stroke-width="1.5"/>
          <text x="270" y="157" fill="#f3f4f6" font-size="12" font-weight="600" text-anchor="middle">Spring Boot Pod 2</text>

          <!-- Spring Boot Instance 3 -->
          <rect x="210" y="200" width="120" height="45" rx="8" fill="url(#nodeGrad)" stroke="#38bdf8" stroke-width="1.5"/>
          <text x="270" y="227" fill="#f3f4f6" font-size="12" font-weight="600" text-anchor="middle">Spring Boot Pod 3</text>

          <rect x="30" y="270" width="300" height="45" rx="6" fill="#1f2937"/>
          <text x="180" y="297" fill="#a7f3d0" font-size="11" text-anchor="middle">✔ Zero DB lookup on request. 100% Local Signature Verification.</text>
        </g>

        <!-- Right: Clustered Redis Session -->
        <g transform="translate(420, 20)">
          <rect width="360" height="340" rx="12" fill="#111827" stroke="#374151" stroke-width="1.5"/>
          <text x="180" y="32" fill="#f87171" font-size="16" font-weight="700" text-anchor="middle">Pattern B: Clustered Redis Session</text>
          
          <!-- Client -->
          <rect x="30" y="60" width="100" height="45" rx="8" fill="url(#jwtGrad)"/>
          <text x="80" y="87" fill="#ffffff" font-size="12" font-weight="600" text-anchor="middle">Browser</text>

          <!-- Arrow -->
          <path d="M130 82 L170 82" stroke="#f87171" stroke-width="2"/>
          <text x="150" y="75" fill="#9ca3af" font-size="9" text-anchor="middle">Cookie</text>

          <!-- App Instances -->
          <rect x="170" y="60" width="90" height="45" rx="8" fill="url(#nodeGrad)" stroke="#f87171" stroke-width="1.5"/>
          <text x="215" y="87" fill="#f3f4f6" font-size="11" text-anchor="middle">Spring Boot 1</text>

          <rect x="170" y="130" width="90" height="45" rx="8" fill="url(#nodeGrad)" stroke="#f87171" stroke-width="1.5"/>
          <text x="215" y="157" fill="#f3f4f6" font-size="11" text-anchor="middle">Spring Boot 2</text>

          <!-- Redis Central Node -->
          <rect x="280" y="85" width="65" height="70" rx="8" fill="url(#redisGrad)"/>
          <text x="312" y="120" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">Redis</text>
          <text x="312" y="135" fill="#fecaca" font-size="9" text-anchor="middle">Cluster</text>

          <path d="M260 82 L280 100" stroke="#f87171" stroke-width="1.5"/>
          <path d="M260 152 L280 135" stroke="#f87171" stroke-width="1.5"/>

          <rect x="30" y="270" width="300" height="45" rx="6" fill="#1f2937"/>
          <text x="180" y="297" fill="#fde68a" font-size="11" text-anchor="middle">✔ Instant Revocation & Session Invalidation. Requires Redis.</text>
        </g>
      </svg>
    `,
    tradeoffs: [
      {
        criterion: "Request Latency",
        statelessJwt: "Ultra-low (0 network hops, cryptographic verification in CPU memory: ~0.1ms)",
        redisSession: "Low to Moderate (1 Redis network hop per request: ~1.5 - 3ms)"
      },
      {
        criterion: "Instant Revocation (Logout / Lockout)",
        statelessJwt: "Hard: Cannot revoke without Redis Blacklist or waiting for expiry (short TTL)",
        redisSession: "Instant: Deleting Redis key immediately terminates the session"
      },
      {
        criterion: "Horizontal Scalability",
        statelessJwt: "Infinite: No shared state between microservice pods",
        redisSession: "High: Bound by Redis cluster throughput and network bandwidth"
      },
      {
        criterion: "Payload Size (Header Overhead)",
        statelessJwt: "Heavy (500 bytes - 2 KB sent on every HTTP request)",
        redisSession: "Minimal (32-byte opaque session ID cookie)"
      },
      {
        criterion: "Security Exposure",
        statelessJwt: "Vulnerable to XSS theft if stored in localStorage",
        redisSession: "Protected by HttpOnly; Secure; SameSite=Strict cookies"
      }
    ],
    deepDive: `
### Architectural Recommendation
- **Choose Stateless JWT** if you are building mobile apps, public B2B developer APIs, or high-throughput microservices (>50,000 req/sec) where hitting a centralized session store introduces latency bottlenecks.
- **Choose Clustered Redis Session** (via Spring Session Redis) if you are building an enterprise intranet, B2B SaaS web portal, or banking platform where immediate user revocation (e.g. employee termination, fraud lockout) is a strict compliance mandate.
    `
  },
  {
    id: "arch-02",
    title: "The Backend-For-Frontend (BFF) Security Pattern",
    tagline: "Bridging Single Page Applications (SPA) with Microservices without Exposing Tokens to Browser JavaScript",
    summary: "The gold standard architecture for securing React, Angular, and Vue applications against Cross-Site Scripting (XSS) and token theft.",
    category: "Microservices",
    diagramSvg: `
      <svg viewBox="0 0 800 360" class="blueprint-svg">
        <rect width="780" height="340" rx="12" fill="#111827" stroke="#374151" stroke-width="1.5" x="10" y="10"/>
        
        <!-- Browser -->
        <g transform="translate(40, 90)">
          <rect width="130" height="140" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
          <text x="65" y="30" fill="#38bdf8" font-size="14" font-weight="700" text-anchor="middle">Browser (SPA)</text>
          <rect x="15" y="50" width="100" height="30" rx="6" fill="#334155"/>
          <text x="65" y="70" fill="#f8fafc" font-size="11" text-anchor="middle">React / Vue App</text>
          <text x="65" y="105" fill="#f87171" font-size="10" text-anchor="middle">NO TOKENS IN JS!</text>
          <text x="65" y="120" fill="#94a3b8" font-size="9" text-anchor="middle">HttpOnly Cookie Only</text>
        </g>

        <!-- Connection 1 -->
        <g transform="translate(180, 140)">
          <line x1="0" y1="0" x2="80" y2="0" stroke="#38bdf8" stroke-width="3" stroke-dasharray="4,4"/>
          <text x="40" y="-12" fill="#38bdf8" font-size="10" font-weight="600" text-anchor="middle">Encrypted Cookie</text>
          <text x="40" y="18" fill="#94a3b8" font-size="9" text-anchor="middle">SameSite=Strict</text>
        </g>

        <!-- BFF Gateway -->
        <g transform="translate(270, 70)">
          <rect width="210" height="180" rx="10" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
          <text x="105" y="30" fill="#10b981" font-size="14" font-weight="700" text-anchor="middle">Spring Cloud Gateway</text>
          <text x="105" y="48" fill="#a7f3d0" font-size="11" text-anchor="middle">(BFF Layer)</text>
          
          <rect x="20" y="65" width="170" height="40" rx="6" fill="#064e3b"/>
          <text x="105" y="85" fill="#a7f3d0" font-size="10" font-weight="600" text-anchor="middle">Token Relay Filter</text>
          <text x="105" y="98" fill="#6ee7b7" font-size="9" text-anchor="middle">Swaps Cookie -> Bearer JWT</text>

          <rect x="20" y="115" width="170" height="45" rx="6" fill="#0f172a" stroke="#10b981" stroke-width="1"/>
          <text x="105" y="133" fill="#cbd5e1" font-size="10" text-anchor="middle">Stores OAuth2 Tokens</text>
          <text x="105" y="148" fill="#94a3b8" font-size="9" text-anchor="middle">in Server Redis Session</text>
        </g>

        <!-- Connection 2 -->
        <g transform="translate(490, 140)">
          <line x1="0" y1="0" x2="70" y2="0" stroke="#10b981" stroke-width="3"/>
          <text x="35" y="-12" fill="#10b981" font-size="10" font-weight="600" text-anchor="middle">Bearer JWT</text>
          <text x="35" y="18" fill="#94a3b8" font-size="9" text-anchor="middle">Internal Network</text>
        </g>

        <!-- Downstream Microservices -->
        <g transform="translate(570, 70)">
          <rect width="180" height="60" rx="8" fill="#1e293b" stroke="#a855f7" stroke-width="1.5"/>
          <text x="90" y="28" fill="#c084fc" font-size="12" font-weight="600" text-anchor="middle">Order Microservice</text>
          <text x="90" y="45" fill="#94a3b8" font-size="9" text-anchor="middle">Resource Server (JWT)</text>

          <rect x="0" y="80" width="180" height="60" rx="8" fill="#1e293b" stroke="#a855f7" stroke-width="1.5"/>
          <text x="90" y="108" fill="#c084fc" font-size="12" font-weight="600" text-anchor="middle">Payment Microservice</text>
          <text x="90" y="125" fill="#94a3b8" font-size="9" text-anchor="middle">Resource Server (JWT)</text>
        </g>
      </svg>
    `,
    tradeoffs: [
      {
        criterion: "XSS Vulnerability",
        statelessJwt: "High: Malicious scripts can extract `localStorage.getItem('token')` and exfiltrate credentials",
        redisSession: "Near Zero: HttpOnly cookies cannot be read or stolen by browser JavaScript"
      },
      {
        criterion: "CSRF Requirement",
        statelessJwt: "Not required if Bearer header is populated in JavaScript",
        redisSession: "MANDATORY: Browser automatically sends cookies, so Double-Submit Cookie CSRF is essential"
      },
      {
        criterion: "Architecture Complexity",
        statelessJwt: "Low: Frontend calls microservices directly with access tokens",
        redisSession: "Moderate: Requires Gateway / BFF service with session storage (Redis)"
      }
    ],
    deepDive: `
### Why the BFF Pattern is Mandated in FinTech & Healthcare
In modern single-page applications, storing access tokens in browser \`localStorage\` or \`sessionStorage\` is an anti-pattern. Any compromised npm dependency (supply chain attack) or minor XSS flaw can siphon user tokens to a remote command server.

The **Backend-For-Frontend (BFF)** pattern eliminates this vulnerability entirely:
1. The browser initiates OAuth2 authorization code flow with PKCE via the Gateway.
2. The Gateway exchanges the authorization code for Access & Refresh tokens.
3. The Gateway stores the tokens securely in a server-side session (Redis) and sets an encrypted \`HttpOnly\`, \`Secure\`, \`SameSite=Strict\` cookie on the browser.
4. When the browser makes API calls, the Gateway intercepts the cookie, looks up the active JWT, and injects \`Authorization: Bearer <token>\` before forwarding downstream.
    `
  },
  {
    id: "arch-03",
    title: "Centralized API Gateway vs Microservice Token Validation Topologies",
    tagline: "Architectural Topologies for Distributing and Validating Cryptographic Identity at Scale",
    summary: "How enterprise organizations distribute authentication load between edge API gateways and internal microservices.",
    category: "Microservices",
    diagramSvg: `
      <svg viewBox="0 0 800 340" class="blueprint-svg">
        <rect width="780" height="320" rx="12" fill="#111827" stroke="#374151" stroke-width="1.5" x="10" y="10"/>
        
        <!-- Topology 1 -->
        <g transform="translate(30, 30)">
          <rect width="345" height="280" rx="10" fill="#1e293b"/>
          <text x="172" y="30" fill="#f59e0b" font-size="13" font-weight="700" text-anchor="middle">Topology 1: Edge Validation & Internal Headers</text>
          
          <rect x="20" y="55" width="90" height="35" rx="6" fill="#374151"/>
          <text x="65" y="77" fill="#fff" font-size="10" text-anchor="middle">Public Client</text>

          <path d="M110 72 L150 72" stroke="#f59e0b" stroke-width="2"/>

          <rect x="150" y="55" width="170" height="50" rx="6" fill="#78350f" stroke="#f59e0b" stroke-width="1"/>
          <text x="235" y="75" fill="#fef3c7" font-size="10" font-weight="600" text-anchor="middle">Edge API Gateway</text>
          <text x="235" y="92" fill="#fde68a" font-size="8" text-anchor="middle">Validates JWT + Extracts Claims</text>

          <path d="M235 105 L235 140" stroke="#f59e0b" stroke-width="2"/>
          <text x="245" y="125" fill="#9ca3af" font-size="8">X-User-Id, X-Roles</text>

          <rect x="150" y="140" width="170" height="40" rx="6" fill="#1f2937" stroke="#9ca3af" stroke-width="1"/>
          <text x="235" y="165" fill="#e5e7eb" font-size="10" text-anchor="middle">Internal Microservice</text>

          <rect x="20" y="210" width="305" height="50" rx="6" fill="#111827"/>
          <text x="172" y="230" fill="#f87171" font-size="9" text-anchor="middle">⚠️ Risk: Internal spoofing if network is not air-gapped.</text>
          <text x="172" y="246" fill="#9ca3af" font-size="9" text-anchor="middle">Microservice blindly trusts X-User-Id headers.</text>
        </g>

        <!-- Topology 2 -->
        <g transform="translate(405, 30)">
          <rect width="365" height="280" rx="10" fill="#1e293b"/>
          <text x="182" y="30" fill="#10b981" font-size="13" font-weight="700" text-anchor="middle">Topology 2: End-to-End JWT Token Relay (Zero-Trust)</text>

          <rect x="20" y="55" width="90" height="35" rx="6" fill="#374151"/>
          <text x="65" y="77" fill="#fff" font-size="10" text-anchor="middle">Public Client</text>

          <path d="M110 72 L150 72" stroke="#10b981" stroke-width="2"/>

          <rect x="150" y="55" width="180" height="50" rx="6" fill="#064e3b" stroke="#10b981" stroke-width="1"/>
          <text x="240" y="75" fill="#a7f3d0" font-size="10" font-weight="600" text-anchor="middle">API Gateway (Pass-thru)</text>
          <text x="240" y="92" fill="#6ee7b7" font-size="8" text-anchor="middle">Rate Limiting + Token Relay</text>

          <path d="M240 105 L240 140" stroke="#10b981" stroke-width="2"/>
          <text x="250" y="125" fill="#9ca3af" font-size="8">Bearer JWT Intact</text>

          <rect x="150" y="140" width="180" height="40" rx="6" fill="#1f2937" stroke="#10b981" stroke-width="1"/>
          <text x="240" y="165" fill="#e5e7eb" font-size="10" text-anchor="middle">Microservice (Resource Server)</text>

          <rect x="20" y="210" width="325" height="50" rx="6" fill="#111827"/>
          <text x="182" y="230" fill="#34d399" font-size="9" text-anchor="middle">✔ Zero-Trust: Every service verifies signature independently.</text>
          <text x="182" y="246" fill="#9ca3af" font-size="9" text-anchor="middle">Spoofed headers are impossible. Cryptographically secure.</text>
        </g>
      </svg>
    `,
    tradeoffs: [
      {
        criterion: "Security Integrity",
        statelessJwt: "Topology 1: Lower (Vulnerable to header injection if an internal service is breached)",
        redisSession: "Topology 2: Highest (Every microservice verifies cryptographic signatures against JWKS)"
      },
      {
        criterion: "Microservice Overhead",
        statelessJwt: "Topology 1: Minimal (Microservice just reads headers like `req.getHeader('X-User-Id')`)",
        redisSession: "Topology 2: Requires `spring-boot-starter-oauth2-resource-server` and Nimbus JWT parser"
      },
      {
        criterion: "Auditing & Traceability",
        statelessJwt: "Topology 1: Context can be dropped or forged by rogue microservice hops",
        redisSession: "Topology 2: Original cryptographic claims preserved end-to-end"
      }
    ],
    deepDive: `
### Production Guidance
In enterprise microservices, **Topology 2 (End-to-End JWT Token Relay)** is strongly recommended. With Spring Boot 3's reactive and non-blocking Nimbus JWT decoders, verifying an RS256 token in memory takes less than 0.15ms. The added CPU cost is negligible compared to the massive security vulnerability of trusting plaintext HTTP headers across internal Kubernetes pods.
    `
  },
  {
    id: "arch-04",
    title: "OAuth2 2.1 & OpenID Connect Architecture Topology",
    tagline: "Identity Providers, Authorization Servers, Resource Servers, and Scopes Demystified",
    summary: "The definitive enterprise identity architecture mapping user authentication, token minting, and resource protection.",
    category: "Identity & Access",
    diagramSvg: `
      <svg viewBox="0 0 800 350" class="blueprint-svg">
        <rect width="780" height="330" rx="12" fill="#111827" stroke="#374151" stroke-width="1.5" x="10" y="10"/>
        
        <!-- User -->
        <g transform="translate(40, 130)">
          <circle cx="40" cy="30" r="22" fill="#3b82f6"/>
          <text x="40" y="34" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">User</text>
          <text x="40" y="70" fill="#94a3b8" font-size="10" text-anchor="middle">Resource Owner</text>
        </g>

        <!-- Authorization Server -->
        <g transform="translate(300, 30)">
          <rect width="200" height="90" rx="10" fill="#1e293b" stroke="#eab308" stroke-width="2"/>
          <text x="100" y="30" fill="#fde047" font-size="13" font-weight="700" text-anchor="middle">Authorization Server (IdP)</text>
          <text x="100" y="50" fill="#94a3b8" font-size="10" text-anchor="middle">Keycloak / Okta / Auth0</text>
          <text x="100" y="70" fill="#cbd5e1" font-size="9" text-anchor="middle">Mints RS256 JWTs & Hosts JWKS</text>
        </g>

        <!-- Client Application -->
        <g transform="translate(140, 130)">
          <rect width="140" height="80" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
          <text x="70" y="30" fill="#38bdf8" font-size="12" font-weight="600" text-anchor="middle">Client Application</text>
          <text x="70" y="50" fill="#94a3b8" font-size="9" text-anchor="middle">SPA / Mobile App</text>
          <text x="70" y="65" fill="#64748b" font-size="8" text-anchor="middle">OAuth2 Client + PKCE</text>
        </g>

        <!-- Resource Server -->
        <g transform="translate(530, 130)">
          <rect width="210" height="80" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
          <text x="105" y="30" fill="#34d399" font-size="12" font-weight="600" text-anchor="middle">Resource Server</text>
          <text x="105" y="48" fill="#94a3b8" font-size="10" text-anchor="middle">Spring Boot Microservice API</text>
          <text x="105" y="66" fill="#a7f3d0" font-size="9" text-anchor="middle">Validates JWT against JWKS</text>
        </g>

        <!-- Arrows -->
        <path d="M100 150 L140 150" stroke="#94a3b8" stroke-width="1.5"/>
        
        <!-- Auth Code flow to IdP -->
        <path d="M210 130 Q210 75 300 75" stroke="#eab308" stroke-width="2" fill="none" stroke-dasharray="3,3"/>
        <text x="220" y="65" fill="#fde047" font-size="8">1. Auth Code + PKCE</text>

        <!-- JWT to Client -->
        <path d="M300 95 Q250 115 250 130" stroke="#eab308" stroke-width="2" fill="none"/>
        <text x="240" y="110" fill="#fde047" font-size="8">2. Returns JWT</text>

        <!-- Client to Resource Server -->
        <path d="M280 170 L530 170" stroke="#38bdf8" stroke-width="2.5"/>
        <text x="405" y="162" fill="#38bdf8" font-size="10" font-weight="600" text-anchor="middle">3. API Call (Bearer JWT)</text>

        <!-- Resource Server to IdP JWKS -->
        <path d="M635 130 Q635 75 500 75" stroke="#10b981" stroke-width="1.5" fill="none"/>
        <text x="590" y="70" fill="#34d399" font-size="8">4. Fetch Public Keys (JWKS)</text>
      </svg>
    `,
    tradeoffs: [
      {
        criterion: "Decoupled Authentication",
        statelessJwt: "Developers never touch passwords, hashing, or 2FA implementation.",
        redisSession: "All authentication, password resets, and MFA handled by the specialized IdP."
      },
      {
        criterion: "Standards Compliance",
        statelessJwt: "Follows OAuth 2.1 & OpenID Connect 1.0 specifications.",
        redisSession: "Interoperable across mobile, web, CLI, and partner integrations."
      }
    ],
    deepDive: `
### Key Invariants in OAuth2 2.1:
1. **PKCE (Proof Key for Code Exchange)** is now mandatory for ALL clients (both public SPAs and confidential server backends) to prevent authorization code interception attacks.
2. **Implicit Grant and Resource Owner Password Credentials (ROPC) are formally DEPRECATED and REMOVED** due to credential leakage risks.
3. Redirect URIs must require exact string matching (no wildcards or open redirects allowed).
    `
  },
  {
    id: "arch-05",
    title: "Zero-Trust Service Mesh Security with Mutual TLS (mTLS) & SPIFFE",
    tagline: "Eliminating Perimeter Trust: Cryptographic Pod Identity Attestation",
    summary: "How modern cloud-native architectures secure inter-service communication across Kubernetes namespaces and untrusted networks.",
    category: "Zero-Trust",
    diagramSvg: `
      <svg viewBox="0 0 800 320" class="blueprint-svg">
        <rect width="780" height="300" rx="12" fill="#111827" stroke="#374151" stroke-width="1.5" x="10" y="10"/>

        <!-- Service A -->
        <g transform="translate(50, 70)">
          <rect width="260" height="170" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
          <text x="130" y="30" fill="#38bdf8" font-size="14" font-weight="700" text-anchor="middle">Microservice: Orders</text>
          
          <rect x="20" y="55" width="220" height="40" rx="6" fill="#0f172a" stroke="#38bdf8" stroke-width="1"/>
          <text x="130" y="75" fill="#f1f5f9" font-size="10" text-anchor="middle">SPIRE Agent / Workload API</text>
          <text x="130" y="88" fill="#38bdf8" font-size="9" text-anchor="middle">spiffe://mesh/ns/prod/sa/orders</text>

          <rect x="20" y="105" width="220" height="45" rx="6" fill="#334155"/>
          <text x="130" y="125" fill="#cbd5e1" font-size="10" text-anchor="middle">Short-Lived X.509 SVID (1 hr TTL)</text>
          <text x="130" y="139" fill="#94a3b8" font-size="9" text-anchor="middle">Auto-Rotated by Sidecar / Envoy</text>
        </g>

        <!-- Inter-Service mTLS Tunnel -->
        <g transform="translate(325, 125)">
          <rect width="150" height="60" rx="8" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
          <text x="75" y="26" fill="#34d399" font-size="11" font-weight="700" text-anchor="middle">mTLS 1.3 Tunnel</text>
          <text x="75" y="42" fill="#a7f3d0" font-size="9" text-anchor="middle">Mutual Verification</text>
          <text x="75" y="53" fill="#6ee7b7" font-size="8" text-anchor="middle">Bi-directional x509</text>
        </g>

        <!-- Service B -->
        <g transform="translate(490, 70)">
          <rect width="260" height="170" rx="10" fill="#1e293b" stroke="#a855f7" stroke-width="2"/>
          <text x="130" y="30" fill="#c084fc" font-size="14" font-weight="700" text-anchor="middle">Microservice: Payments</text>
          
          <rect x="20" y="55" width="220" height="40" rx="6" fill="#0f172a" stroke="#a855f7" stroke-width="1"/>
          <text x="130" y="75" fill="#f1f5f9" font-size="10" text-anchor="middle">Spring Security x509 Filter</text>
          <text x="130" y="88" fill="#c084fc" font-size="9" text-anchor="middle">Inspects Client Cert SubjectAltName</text>

          <rect x="20" y="105" width="220" height="45" rx="6" fill="#334155"/>
          <text x="130" y="125" fill="#cbd5e1" font-size="10" text-anchor="middle">Enforces Role Mapping</text>
          <text x="130" y="139" fill="#94a3b8" font-size="9" text-anchor="middle">ROLE_ORDERS_SERVICE</text>
        </g>
      </svg>
    `,
    tradeoffs: [
      {
        criterion: "Perimeter Independence",
        statelessJwt: "Operates with zero trust in physical network hardware or IP firewalls.",
        redisSession: "Every request is cryptographically authenticated at the transport layer regardless of network routing."
      },
      {
        criterion: "Credential Rotation",
        statelessJwt: "SPIRE automatically refreshes x509 certificates every 60 minutes with zero downtime.",
        redisSession: "Eliminates static, long-lived API keys or passwords stored in config files."
      }
    ],
    deepDive: `
### Zero-Trust Tenets in Spring Boot
1. **Never Trust, Always Verify**: Just because a request originates from an internal Kubernetes \`10.244.x.x\` IP address does NOT mean it is authorized.
2. **Least Privilege**: Microservices only accept traffic from explicit cryptographic identities verified via x509 Subject Alternative Names (SANs).
3. **Defense-in-Depth**: Layering mTLS (service-to-service) + Bearer JWT (end-user identity) + Spring Method Security (\`@PreAuthorize\`) + Row-Level Database filters ensures that a breach of any single layer cannot compromise the entire enterprise system.
    `
  }
];

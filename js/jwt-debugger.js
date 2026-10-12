/**
 * SpringSec Master - Interactive JWT Inspector & Token Debugger
 * Decodes header, payload, signature, and simulates Spring Security GrantedAuthority mappings.
 */

class JwtDebugger {
  constructor() {
    this.sampleJwts = {
      user: this.createMockJwt({
        sub: "user_alice_982",
        iss: "https://auth.company.com/realms/production",
        aud: "https://api.company.com",
        roles: ["ROLE_USER", "ROLE_CUSTOMER"],
        scope: "read:profile write:profile",
        email: "alice@company.com",
        expDeltaSeconds: 3600 // 1 hour from now
      }),
      admin: this.createMockJwt({
        sub: "admin_super_001",
        iss: "https://auth.company.com/realms/production",
        aud: "https://api.company.com",
        roles: ["ROLE_SUPERADMIN", "ROLE_ADMIN", "ROLE_USER"],
        scope: "read:* write:* admin:system",
        email: "root-admin@company.com",
        expDeltaSeconds: 900 // 15 mins
      }),
      expired: this.createMockJwt({
        sub: "user_bob_expired",
        iss: "https://auth.company.com/realms/production",
        aud: "https://api.company.com",
        roles: ["ROLE_USER"],
        scope: "read:profile",
        email: "bob@company.com",
        expDeltaSeconds: -7200 // Expired 2 hours ago
      })
    };
  }

  createMockJwt({ sub, iss, aud, roles, scope, email, expDeltaSeconds }) {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT", kid: "rsa-key-2026-v1" };
    const payload = {
      sub,
      iss,
      aud,
      iat: now - 60,
      exp: now + expDeltaSeconds,
      nbf: now - 60,
      jti: "urn:uuid:" + Math.random().toString(36).substring(2, 12),
      email,
      roles,
      scope
    };

    const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const headerPart = b64(header);
    const payloadPart = b64(payload);
    const sigPart = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    return `${headerPart}.${payloadPart}.${sigPart}`;
  }

  init() {
    this.bindEvents();
    this.loadPreset("user");
  }

  bindEvents() {
    const input = document.getElementById("jwt-input");
    if (input) {
      input.addEventListener("input", () => this.decode(input.value.trim()));
    }

    const btnUser = document.getElementById("jwt-btn-user");
    if (btnUser) btnUser.addEventListener("click", () => this.loadPreset("user"));

    const btnAdmin = document.getElementById("jwt-btn-admin");
    if (btnAdmin) btnAdmin.addEventListener("click", () => this.loadPreset("admin"));

    const btnExpired = document.getElementById("jwt-btn-expired");
    if (btnExpired) btnExpired.addEventListener("click", () => this.loadPreset("expired"));
  }

  loadPreset(type) {
    const token = this.sampleJwts[type] || this.sampleJwts.user;
    const input = document.getElementById("jwt-input");
    if (input) {
      input.value = token;
      this.decode(token);
    }
  }

  decode(token) {
    const headerEl = document.getElementById("jwt-out-header");
    const payloadEl = document.getElementById("jwt-out-payload");
    const signatureEl = document.getElementById("jwt-out-sig");
    const statusBadge = document.getElementById("jwt-status-badge");
    const springContextEl = document.getElementById("jwt-out-spring-context");

    if (!token) {
      if (headerEl) headerEl.textContent = "// Paste a JWT to inspect";
      if (payloadEl) payloadEl.textContent = "";
      if (signatureEl) signatureEl.textContent = "";
      return;
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      if (statusBadge) {
        statusBadge.textContent = "INVALID TOKEN FORMAT (Must have 3 parts separated by dots)";
        statusBadge.className = "badge badge-error";
      }
      return;
    }

    try {
      const decodeB64 = (str) => {
        const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
        const pad = base64.length % 4;
        const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
        return decodeURIComponent(
          atob(padded)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
      };

      const header = JSON.parse(decodeB64(parts[0]));
      const payload = JSON.parse(decodeB64(parts[1]));

      if (headerEl) headerEl.textContent = JSON.stringify(header, null, 2);
      if (payloadEl) payloadEl.textContent = JSON.stringify(payload, null, 2);
      if (signatureEl) signatureEl.textContent = parts[2];

      // Validate expiration
      const now = Math.floor(Date.now() / 1000);
      const exp = payload.exp;
      if (exp) {
        const diff = exp - now;
        if (diff > 0) {
          const mins = Math.floor(diff / 60);
          const secs = diff % 60;
          if (statusBadge) {
            statusBadge.textContent = `ACTIVE (Expires in ${mins}m ${secs}s)`;
            statusBadge.className = "badge badge-success";
          }
        } else {
          const ago = Math.abs(diff);
          const minsAgo = Math.floor(ago / 60);
          if (statusBadge) {
            statusBadge.textContent = `EXPIRED (${minsAgo} minutes ago - Would throw ExpiredJwtException)`;
            statusBadge.className = "badge badge-error";
          }
        }
      } else {
        if (statusBadge) {
          statusBadge.textContent = "WARNING: No 'exp' claim found (Infinite Token Risk)";
          statusBadge.className = "badge badge-warning";
        }
      }

      // Render simulated Spring Security Authentication Object
      const authorities = [];
      if (payload.roles && Array.isArray(payload.roles)) {
        payload.roles.forEach(r => authorities.push(r));
      }
      if (payload.scope && typeof payload.scope === "string") {
        payload.scope.split(" ").forEach(s => authorities.push("SCOPE_" + s));
      }

      const simulatedPrincipal = {
        authenticationClass: "org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken",
        principal: payload.sub || "anonymous",
        name: payload.sub || "anonymous",
        authenticated: true,
        authorities: authorities.map(a => ({ authority: a })),
        tokenAttributes: {
          issuer: payload.iss,
          audience: payload.aud,
          jti: payload.jti,
          email: payload.email
        }
      };

      if (springContextEl) {
        springContextEl.textContent = JSON.stringify(simulatedPrincipal, null, 2);
      }

    } catch (e) {
      if (statusBadge) {
        statusBadge.textContent = "DECODING ERROR: " + e.message;
        statusBadge.className = "badge badge-error";
      }
    }
  }
}

window.jwtDebugger = new JwtDebugger();

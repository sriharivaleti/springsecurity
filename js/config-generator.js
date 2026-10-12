/**
 * SpringSec Master - Interactive Spring Security 6 Config Generator
 * Dynamically produces modern Spring Boot 3.3+ SecurityFilterChain configuration.
 */

class ConfigGenerator {
  constructor() {
    this.options = {
      authMode: "jwt", // "jwt", "session", "oauth2-rs", "basic"
      csrf: "disabled", // "disabled", "cookie-spa", "default"
      cors: "custom", // "custom", "allow-all", "disabled"
      methodSecurity: true,
      roleHierarchy: true,
      jsonExceptions: true,
      hsts: true,
      rateLimit: false,
      publicPaths: "/api/public/**, /swagger-ui/**, /v3/api-docs/**, /actuator/health",
      adminPaths: "/api/admin/**"
    };
  }

  init() {
    this.bindInputs();
    this.generate();
  }

  bindInputs() {
    const ids = [
      "cfg-auth-mode", "cfg-csrf", "cfg-cors",
      "cfg-method-security", "cfg-role-hierarchy",
      "cfg-json-exceptions", "cfg-hsts",
      "cfg-public-paths", "cfg-admin-paths"
    ];

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", () => this.updateFromForm());
      el.addEventListener("change", () => this.updateFromForm());
    });

    const copyBtn = document.getElementById("cfg-btn-copy");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => this.copyToClipboard());
    }
  }

  updateFromForm() {
    const getValue = (id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      return el.type === "checkbox" ? el.checked : el.value;
    };

    this.options.authMode = getValue("cfg-auth-mode") || "jwt";
    this.options.csrf = getValue("cfg-csrf") || "disabled";
    this.options.cors = getValue("cfg-cors") || "custom";
    this.options.methodSecurity = getValue("cfg-method-security") ?? true;
    this.options.roleHierarchy = getValue("cfg-role-hierarchy") ?? true;
    this.options.jsonExceptions = getValue("cfg-json-exceptions") ?? true;
    this.options.hsts = getValue("cfg-hsts") ?? true;
    this.options.publicPaths = getValue("cfg-public-paths") || "";
    this.options.adminPaths = getValue("cfg-admin-paths") || "";

    this.generate();
  }

  generate() {
    const opt = this.options;
    const publicPathList = opt.publicPaths.split(",").map(p => `"${p.trim()}"`).filter(p => p !== '""').join(", ");
    const adminPathList = opt.adminPaths.split(",").map(p => `"${p.trim()}"`).filter(p => p !== '""').join(", ");

    let code = `package com.example.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;`;

    if (opt.methodSecurity) {
      code += `\nimport org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;`;
    }
    if (opt.authMode === "jwt") {
      code += `\nimport org.springframework.security.config.http.SessionCreationPolicy;\nimport org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;`;
    }
    if (opt.roleHierarchy) {
      code += `\nimport org.springframework.security.access.hierarchicalroles.RoleHierarchy;\nimport org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;`;
    }
    if (opt.cors === "custom" || opt.cors === "allow-all") {
      code += `\nimport org.springframework.web.cors.CorsConfiguration;\nimport org.springframework.web.cors.CorsConfigurationSource;\nimport org.springframework.web.cors.UrlBasedCorsConfigurationSource;\nimport java.util.List;`;
    }
    if (opt.csrf === "cookie-spa") {
      code += `\nimport org.springframework.security.web.csrf.CookieCsrfTokenRepository;`;
    }

    code += `\n\n@Configuration\n@EnableWebSecurity`;
    if (opt.methodSecurity) {
      code += `\n@EnableMethodSecurity(prePostEnabled = true)`;
    }

    code += `\npublic class SecurityConfig {\n`;

    if (opt.authMode === "jwt") {
      code += `
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final SecurityExceptionHandler exceptionHandler;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, SecurityExceptionHandler exceptionHandler) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.exceptionHandler = exceptionHandler;
    }\n`;
    }

    code += `
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http`;

    // CORS
    if (opt.cors === "custom" || opt.cors === "allow-all") {
      code += `\n            .cors(cors -> cors.configurationSource(corsConfigurationSource()))`;
    }

    // CSRF
    if (opt.csrf === "disabled") {
      code += `\n            .csrf(csrf -> csrf.disable()) // Stateless API: CSRF disabled`;
    } else if (opt.csrf === "cookie-spa") {
      code += `\n            .csrf(csrf -> csrf\n                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())\n            )`;
    }

    // Session Management
    if (opt.authMode === "jwt") {
      code += `\n            .sessionManagement(session -> session\n                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)\n            )`;
    } else if (opt.authMode === "session") {
      code += `\n            .sessionManagement(session -> session\n                .maximumSessions(1)\n                .maxSessionsPreventsLogin(false)\n            )`;
    }

    // Exception Handling
    if (opt.jsonExceptions) {
      code += `\n            .exceptionHandling(ex -> ex\n                .authenticationEntryPoint((req, res, e) -> res.sendError(401, "Unauthorized"))\n                .accessDeniedHandler((req, res, e) -> res.sendError(403, "Forbidden"))\n            )`;
    }

    // Route Authorization
    code += `\n            .authorizeHttpRequests(auth -> auth`;
    if (publicPathList) {
      code += `\n                .requestMatchers(${publicPathList}).permitAll()`;
    }
    if (adminPathList) {
      code += `\n                .requestMatchers(${adminPathList}).hasRole("ADMIN")`;
    }
    code += `\n                .anyRequest().authenticated()\n            )`;

    // Authentication Filter / Handlers
    if (opt.authMode === "jwt") {
      code += `\n            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);`;
    } else if (opt.authMode === "oauth2-rs") {
      code += `\n            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));`;
    } else if (opt.authMode === "session") {
      code += `\n            .formLogin(Customizer.withDefaults())\n            .logout(logout -> logout.deleteCookies("JSESSIONID").invalidateHttpSession(true));`;
    } else if (opt.authMode === "basic") {
      code += `\n            .httpBasic(Customizer.withDefaults());`;
    }

    // Headers
    if (opt.hsts) {
      code += `\n\n        http.headers(headers -> headers\n            .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))\n            .frameOptions(frame -> frame.deny())\n        );`;
    }

    code += `\n\n        return http.build();\n    }`;

    // CORS bean
    if (opt.cors === "custom") {
      code += `\n\n    @Bean\n    public CorsConfigurationSource corsConfigurationSource() {\n        CorsConfiguration config = new CorsConfiguration();\n        config.setAllowedOrigins(List.of("https://app.company.com", "https://admin.company.com"));\n        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));\n        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));\n        config.setAllowCredentials(true);\n        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();\n        source.registerCorsConfiguration("/**", config);\n        return source;\n    }`;
    } else if (opt.cors === "allow-all") {
      code += `\n\n    @Bean\n    public CorsConfigurationSource corsConfigurationSource() {\n        CorsConfiguration config = new CorsConfiguration();\n        config.addAllowedOriginPattern("*");\n        config.addAllowedMethod("*");\n        config.addAllowedHeader("*");\n        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();\n        source.registerCorsConfiguration("/**", config);\n        return source;\n    }`;
    }

    // Role Hierarchy
    if (opt.roleHierarchy) {
      code += `\n\n    @Bean\n    public RoleHierarchy roleHierarchy() {\n        RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();\n        hierarchy.setHierarchy("ROLE_SUPERADMIN > ROLE_ADMIN\\nROLE_ADMIN > ROLE_MANAGER\\nROLE_MANAGER > ROLE_USER");\n        return hierarchy;\n    }`;
    }

    code += `\n}\n`;

    const previewEl = document.getElementById("cfg-code-output");
    if (previewEl) {
      previewEl.textContent = code;
    }
  }

  copyToClipboard() {
    const previewEl = document.getElementById("cfg-code-output");
    if (!previewEl) return;
    navigator.clipboard.writeText(previewEl.textContent).then(() => {
      const copyBtn = document.getElementById("cfg-btn-copy");
      if (copyBtn) {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = "✔ Copied!";
        setTimeout(() => copyBtn.innerHTML = orig, 2000);
      }
    });
  }
}

window.configGenerator = new ConfigGenerator();

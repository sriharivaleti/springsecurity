# SpringSec Master 🛡️
## The Definitive Zero-to-Mastery Spring Security 6 & System Design Learning Platform

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-brightgreen?logo=github)](https://pages.github.com/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3%2B-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![Spring Security](https://img.shields.io/badge/Spring%20Security-6.3%2B-6DB33F?logo=springsecurity)](https://spring.io/projects/spring-security)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

An interactive, production-grade learning platform designed to take software engineers and system architects from **Zero to Principal Security Architect** in Spring Security 6 and Cloud-Native System Design.

---

## 🌟 Key Features

1. **50 Production-Grade Examples & Blueprints**
   - Categorized across 6 progressive tiers: **Level 0 (Foundations)** to **Level 5 (Enterprise & Zero-Trust)**.
   - 100% modern Spring Boot 3.x & Spring Security 6.x Lambda DSL (no deprecated `WebSecurityConfigurerAdapter`).
   - Includes full Java configuration, service code, `application.yml`, and Spring MVC MockMvc integration test classes.
   - Real-world production scenarios: FinTech, SaaS Multi-Tenancy, High-Throughput E-Commerce, Microservices Token Relay, mTLS, SAML 2.0, WebFlux.

2. **System Design Blueprints Studio**
   - Deep architectural guides on distributed token management, Session vs Stateless trade-offs, Backend-For-Frontend (BFF), API Gateway Token Relay, Zero-Trust mTLS mesh, and OAuth2 Authorization Server topology.
   - Interactive system diagrams with inspectable component responsibilities and failure modes.

3. **Interactive Security Filter Chain Visualizer**
   - Step through real HTTP requests (JWT Bearer, Form Login, Basic Auth, Public API).
   - Real-time animated packet traversal through `DelegatingFilterProxy`, `FilterChainProxy`, `CorsFilter`, `CsrfFilter`, `AuthenticationFilter`, `AuthenticationManager`, `SecurityContextHolder`, and `AuthorizationFilter`.
   - Customize filters on the fly to see how the pipeline reacts.

4. **Interactive Spring Security 6 Config Generator**
   - Live visual builder for Spring Boot 3 `SecurityFilterChain`.
   - Toggle JWT / Session / OAuth2, CORS, CSRF, Method Security, Role Hierarchy, and Public routes.
   - Instantly generates ready-to-copy, production-tested Java configuration code.

5. **Interactive JWT Inspector & Token Debugger**
   - Live decode JWT header, payload, and signature with syntax highlighting.
   - Interactive expiration counter, claim inspector, and token simulation.

6. **Interactive Mastery Assessment & Certificate Generator**
   - Progressive quizzes spanning all 6 skill tiers.
   - Tracks your learning progress in browser storage.
   - Generates a personalized **Spring Security Master Certificate** and GitHub markdown badge upon completion!

---

## 🚀 How to Publish to GitHub Pages

This website is **100% client-side** with zero backend or database dependencies, making it blazing fast and natively compatible with GitHub Pages.

### Method 1: Push to GitHub & Enable in Settings (Simplest - 1 Minute)

1. **Create a new repository** on GitHub (e.g. `spring-security-mastery`).
2. **Push this code to your repository**:
   ```bash
   git add .
   git commit -m "feat: initial commit of Spring Security Mastery platform"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY>.git
   git push -u origin main
   ```
3. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click **Settings** ➔ **Pages** (under "Code and automation" in the left sidebar).
   - Under **Build and deployment**:
     - **Source**: Select `Deploy from a branch`.
     - **Branch**: Select `main` and folder `/(root)`.
     - Click **Save**.
   - Your site will be live at `https://<YOUR_USERNAME>.github.io/<YOUR_REPOSITORY>/` in ~30 seconds!

### Method 2: Automated via GitHub Actions

This repository already includes `.github/workflows/deploy.yml`. When you push to `main`, GitHub Actions automatically builds and publishes the site directly to GitHub Pages.

---

## 💻 Running Locally

You can run this project locally with any lightweight static server:

### Using Python:
```bash
python -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

### Using Node.js (npx serve):
```bash
npx serve .
```

### Using VS Code:
Right-click `index.html` and click **"Open with Live Server"**.

---

## 📚 Curriculum Structure (Level 0 to Level 5)

| Tier | Level Name | Focus Areas |
| :--- | :--- | :--- |
| **Level 0** | **Foundations & Architecture Internals** | Filter chain mechanics, `DelegatingFilterProxy`, `SecurityContextHolder`, `AuthenticationManager`, `PasswordEncoder` |
| **Level 1** | **Core Authentication & Authorization** | Form login, JPA UserDetailsService, Remember-Me, Concurrent session control, Method Security (`@PreAuthorize`, SpEL) |
| **Level 2** | **Modern REST APIs & Stateless Security** | Stateless JWT pipeline, Asymmetric RSA keys, Refresh token rotation, Redis token blacklist, CORS, CSRF for SPAs |
| **Level 3** | **OAuth2, OpenID Connect & Federated IdP** | Social login (Google/GitHub), OAuth2 Resource Server, Spring Authorization Server, Keycloak integration, Multi-tenant issuers |
| **Level 4** | **Microservices & Distributed Architecture** | Spring Cloud Gateway Token Relay, BFF (Backend-for-Frontend), mTLS zero-trust, Distributed Redis sessions, Rate limiting |
| **Level 5** | **Enterprise, Reactive WebFlux & Zero-Trust** | Reactive WebFlux security, SAML 2.0 SSO, LDAP, ABAC policy enforcement, Secure headers, Transparent password migration |

---

## 📄 License
Released under the Apache 2.0 License. Built for the global Java & Spring developer community.

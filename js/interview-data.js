/**
 * SpringSec Master - 100 Production & Staff-Level Interview Questions & Answers
 * Formatted with both Simple Plain-English Explanations and 16+ Years Experience Architect Deep Dives.
 */

const INTERVIEW_QUESTIONS = [
  // ========================================================
  // CATEGORY 1: FUNDAMENTALS & ARCHITECTURE (Q1 - Q20)
  // ========================================================
  {
    id: "iq-01",
    category: "Fundamentals & Internals",
    level: "Junior / Mid",
    question: "What is Spring Security and why can't we just write an if-statement or Servlet Filter ourselves?",
    simpleAnswer: "Spring Security is an enterprise-grade framework that protects Java applications from attacks and handles logins. If you write DIY security using if-statements or basic filters, you almost always introduce fatal security vulnerabilities like timing attacks on password checks, CSRF holes, session hijacking, or multithreading leaks.",
    architectDeepDive: "DIY security suffers from lack of defense-in-depth. Spring Security provides a standardized, battle-tested filter chain abstraction (`DelegatingFilterProxy` -> `FilterChainProxy` -> `SecurityFilterChain`). It natively mitigates OWASP Top 10 risks: constant-time password comparison (`MessageDigest.isEqual`), secure session lifecycle management (session fixation protection, concurrent login control), thread-isolated contextual storage (`SecurityContextHolder`), and strict defense headers (HSTS, CSP, X-Frame-Options). Attempting to maintain custom authentication interceptors in high-scale microservices creates technical debt and compliance audit failures.",
    tags: ["Architecture", "Fundamentals"]
  },
  {
    id: "iq-02",
    category: "Fundamentals & Internals",
    level: "Staff Architect (16+ Yrs)",
    question: "Explain the complete internal request flow from when an HTTP packet hits Tomcat until it reaches a Controller in Spring Security 6.",
    simpleAnswer: "Tomcat receives the request and passes it to DelegatingFilterProxy. This proxy hands it to FilterChainProxy, which runs it through a chain of filters (CORS, CSRF, JWT/Auth, SecurityContext, Authorization). If all pass, it reaches DispatcherServlet and your Controller.",
    architectDeepDive: "1. The Servlet Container (Tomcat/Jetty) receives the raw `HttpServletRequest`.\n2. Container invokes `DelegatingFilterProxy`, which bridges standard Servlet filters to Spring's `ApplicationContext` by locating the `springSecurityFilterChain` bean.\n3. `FilterChainProxy` takes control. It evaluates registered `SecurityFilterChain` instances using `RequestMatcher` patterns.\n4. The chosen chain executes its ordered filter pipeline: `CorsFilter` -> `HeaderWriterFilter` -> `CsrfFilter` -> `LogoutFilter` -> Authentication filters (`JwtAuthenticationFilter` or `UsernamePasswordAuthenticationFilter`) -> `DefaultLoginPageGeneratingFilter` -> `SecurityContextHolderAwareRequestFilter` -> `AnonymousAuthenticationFilter` -> `SessionManagementFilter` -> `ExceptionTranslationFilter` -> `AuthorizationFilter`.\n5. Upon successful authentication, an `Authentication` token is populated into `SecurityContextHolder`.\n6. `AuthorizationFilter` evaluates matching HTTP authorization rules (`requestMatchers`). If granted, request proceeds to `DispatcherServlet` and the target `@RestController`.",
    tags: ["Filter Chain", "Internals"]
  },
  {
    id: "iq-03",
    category: "Fundamentals & Internals",
    level: "Senior",
    question: "What happened to WebSecurityConfigurerAdapter in Spring Boot 3 / Spring Security 6, and what replaces it?",
    simpleAnswer: "It was completely removed! In the old days, you extended `WebSecurityConfigurerAdapter` and overrode `configure()`. In modern Spring Boot 3, you create a `@Bean` that returns a `SecurityFilterChain` using functional lambda DSL.",
    architectDeepDive: "`WebSecurityConfigurerAdapter` forced rigid class inheritance and coupled configuration to a monolithic class. Spring Security 5.7 deprecated it, and 6.0 completely removed it in favor of a component-based, functional configuration model. We now declare `@Bean public SecurityFilterChain filterChain(HttpSecurity http)` using lambda expressions (e.g. `http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated())`). This allows registering multiple, composable `SecurityFilterChain` beans ordered via `@Order` for different URL patterns (e.g., API vs Admin Portal).",
    tags: ["Spring Boot 3", "Architecture"]
  },
  {
    id: "iq-04",
    category: "Fundamentals & Internals",
    level: "Junior / Mid",
    question: "What is the difference between Authentication (AuthN) and Authorization (AuthZ)?",
    simpleAnswer: "Authentication is verifying WHO you are (e.g., checking username, password, or facial scan). Authorization is checking WHAT you are allowed to do (e.g., can this user delete financial records or enter the admin room?).",
    architectDeepDive: "AuthN resolves an unknown identity to an authenticated `Principal` represented by an `Authentication` object (`isAuthenticated() == true`). AuthZ consumes the authenticated `Principal` and checks their associated `Collection<? extends GrantedAuthority>` against an `AuthorizationDecision` rule. In Spring Security 6, AuthN is coordinated by `AuthenticationManager`, while AuthZ is governed by `AuthorizationManager<T>`.",
    tags: ["AuthN", "AuthZ"]
  },
  {
    id: "iq-05",
    category: "Fundamentals & Internals",
    level: "Staff Architect (16+ Yrs)",
    question: "How does SecurityContextHolder store user details, and why can it cause critical data leaks in reactive WebFlux or thread pools?",
    simpleAnswer: "By default, it uses `ThreadLocal`, which attaches the user to the current computer thread. If worker threads are reused in a thread pool without cleaning up, or in reactive WebFlux where multiple requests share the same Netty thread, User A's data can accidentally leak to User B!",
    architectDeepDive: "`SecurityContextHolder` utilizes the Strategy Pattern with three primary storage modes: `MODE_THREADLOCAL` (default), `MODE_INHERITABLETHREADLOCAL`, and `MODE_GLOBAL`. In standard Servlet containers, each HTTP request is allocated a dedicated thread, and `SecurityContextPersistenceFilter` / `SecurityContextHolderFilter` cleans the context in a `finally` block upon request completion.\n\nHowever, in thread pools (`ExecutorService`, `@Async`), child threads do not inherit `ThreadLocal` unless wrapped with `DelegatingSecurityContextExecutorService`. In reactive architectures (Spring WebFlux / Netty), Netty event loop threads process thousands of asynchronous event slices concurrently; using `ThreadLocal` corrupts context across different users. WebFlux must use `ReactiveSecurityContextHolder`, which binds security context to the Project Reactor `Subscriber` `Context`.",
    tags: ["Threading", "SecurityContext", "WebFlux"]
  },
  {
    id: "iq-06",
    category: "Fundamentals & Internals",
    level: "Junior / Mid",
    question: "What is the difference between 401 Unauthorized and 403 Forbidden?",
    simpleAnswer: "401 means you are unauthenticated ('I don't know who you are; please provide valid credentials'). 403 means you are authenticated, but lack permission ('I know who you are, but you are not allowed to access this resource').",
    architectDeepDive: "HTTP 401 (Unauthorized) is handled in Spring Security by `AuthenticationEntryPoint.commence()`. It typically includes a `WWW-Authenticate` response header indicating how to authenticate (e.g., `Bearer`, `Basic`). HTTP 403 (Forbidden) is handled by `AccessDeniedHandler.handle()`, which indicates that the authenticated `Principal` has been evaluated by `AuthorizationManager` and was denied due to insufficient `GrantedAuthority` or domain policy.",
    tags: ["HTTP Codes", "Exceptions"]
  },
  {
    id: "iq-07",
    category: "Fundamentals & Internals",
    level: "Senior",
    question: "What is the role of DelegatingFilterProxy?",
    simpleAnswer: "It acts as a physical bridge between the web server (Tomcat/Servlet container) and the Spring application context, allowing standard Spring beans to intercept incoming servlet web traffic.",
    architectDeepDive: "Standard Servlet Containers (Tomcat, Jetty) initialize their own filter lifecycle outside the Spring `ApplicationContext`. `DelegatingFilterProxy` is registered in the Servlet `Filter` pipeline, but delegates its actual `doFilter()` invocation to a Spring-managed bean named `springSecurityFilterChain` (which is an instance of `FilterChainProxy`). This allows the entire security pipeline to leverage Spring dependency injection, bean lifecycles, and configuration properties.",
    tags: ["Filter Chain", "Internals"]
  },
  {
    id: "iq-08",
    category: "Fundamentals & Internals",
    level: "Senior",
    question: "What is FilterChainProxy and how does it differ from SecurityFilterChain?",
    simpleAnswer: "`FilterChainProxy` is the master manager. It holds a list of different `SecurityFilterChain` objects and decides which specific chain should handle an incoming request based on the URL.",
    architectDeepDive: "`FilterChainProxy` is the single entry-point bean managed by Spring. It maintains a `List<SecurityFilterChain>`. When a request arrives, `FilterChainProxy` iterates through the list, evaluating `SecurityFilterChain.matches(HttpServletRequest)`. The first matching chain is chosen to execute its private list of filters (`List<Filter>`). This architecture enables multiple distinct security configurations in a single app (e.g., one chain for `/api/**` using stateless JWT, and a separate chain for `/admin/**` using form login and sessions).",
    tags: ["Filter Chain", "Internals"]
  },
  {
    id: "iq-09",
    category: "Fundamentals & Internals",
    level: "Staff Architect (16+ Yrs)",
    question: "Why was FilterSecurityInterceptor replaced by AuthorizationFilter in Spring Security 6?",
    simpleAnswer: "To modernize authorization, eliminate deprecated AccessDecisionManager voting systems, and make authorization purely functional and non-blocking.",
    architectDeepDive: "In Spring Security 5 and prior, authorization relied on `FilterSecurityInterceptor` coupled with `AccessDecisionManager`, `AccessDecisionVoter`, and `ConfigAttribute`. This model was heavy, required voting hierarchies (AffirmativeBased, ConsensusBased), and struggled with asynchronous and reactive flows.\n\nSpring Security 6 replaced it with `AuthorizationFilter`, which delegates directly to a lightweight `AuthorizationManager<HttpServletRequest>`. It evaluates the request using lambda-based decision managers returning `AuthorizationDecision(boolean)`. This simplifies the architecture, improves performance, and unifies reactive and servlet authorization APIs.",
    tags: ["Spring Security 6", "Internals"]
  },
  {
    id: "iq-10",
    category: "Fundamentals & Internals",
    level: "Junior / Mid",
    question: "What is a Principal in Spring Security?",
    simpleAnswer: "The Principal is the currently authenticated user or system identity (e.g., a UserDetails object, username string, or JWT subject).",
    architectDeepDive: "A `Principal` represents the identity associated with an `Authentication` object (`authentication.getPrincipal()`). In username/password authentication, the principal is typically an instance of `UserDetails` (or a domain entity wrapping `UserDetails`). In JWT / OAuth2 Resource Server pipelines, the principal is often a `Jwt` or `OAuth2AuthenticatedPrincipal`.",
    tags: ["Core Concepts"]
  },
  {
    id: "iq-11",
    category: "Fundamentals & Internals",
    level: "Senior",
    question: "What is a GrantedAuthority and how does it differ from a Role?",
    simpleAnswer: "A GrantedAuthority is any permission string (like `READ_INVOICE`). A Role is simply a GrantedAuthority that starts with the prefix `ROLE_` (like `ROLE_ADMIN`).",
    architectDeepDive: "`GrantedAuthority` is an interface with a single method: `String getAuthority()`. It represents a granular permission or capability. A 'Role' is merely a convention: methods like `hasRole('ADMIN')` automatically prepend `ROLE_` to match against `ROLE_ADMIN`. In contrast, `hasAuthority('READ_ORDER')` checks for the exact string. Senior architects use Roles for coarse-grained user classification and fine-grained Authorities (permissions/scopes) for resource actions.",
    tags: ["RBAC", "Authorities"]
  },
  {
    id: "iq-12",
    category: "Fundamentals & Internals",
    level: "Senior",
    question: "What is AuthenticationManager and how does it relate to AuthenticationProvider?",
    simpleAnswer: "AuthenticationManager is the coordinator interface with an `authenticate()` method. `ProviderManager` is its main implementation, which loops through multiple specialized `AuthenticationProvider` plugins until one knows how to authenticate the user.",
    architectDeepDive: "`AuthenticationManager` is the top-level API for authentication. Its standard implementation is `ProviderManager`, which maintains a `List<AuthenticationProvider>`. When `authenticate(Authentication token)` is called, `ProviderManager` iterates through providers, calling `provider.supports(token.getClass())`. For example, `DaoAuthenticationProvider` supports username/password tokens, `JwtAuthenticationProvider` supports Bearer tokens, and `LdapAuthenticationProvider` supports directory queries. If one succeeds, the authenticated token is returned.",
    tags: ["AuthenticationManager", "ProviderManager"]
  },
  {
    id: "iq-13",
    category: "Fundamentals & Internals",
    level: "Junior / Mid",
    question: "What is UserDetailsService and what does its loadUserByUsername() method return?",
    simpleAnswer: "It is the interface used to retrieve user account data from a database or storage. Its method `loadUserByUsername(String username)` returns a `UserDetails` object containing the username, password hash, and authorities.",
    architectDeepDive: "`UserDetailsService` is a core read-only data access interface. It is consumed by `DaoAuthenticationProvider`. It is NOT responsible for validating passwords—it strictly loads user metadata from the data layer. `DaoAuthenticationProvider` takes the returned `UserDetails` and delegates to `PasswordEncoder.matches(rawPassword, userDetails.getPassword())` to perform the actual cryptographic comparison.",
    tags: ["UserDetailsService", "Database"]
  },
  {
    id: "iq-14",
    category: "Fundamentals & Internals",
    level: "Senior",
    question: "Can an application have multiple SecurityFilterChain beans? How are they resolved?",
    simpleAnswer: "Yes! You can define multiple SecurityFilterChain beans. You annotate them with `@Order(1)`, `@Order(2)`, etc. Spring Security checks them in order and uses the first chain whose URL pattern matches the request.",
    architectDeepDive: "Yes. In enterprise systems, you frequently separate public developer APIs (`/api/v1/**`), management consoles (`/admin/**`), and health actuator endpoints. Each chain matches a specific `securityMatcher(...)`. Spring's `FilterChainProxy` checks chains according to their `@Order` priority. The first matching chain is executed. If a request matches none of the specific chains, it falls back to the default catch-all chain.",
    tags: ["Filter Chain", "Multiple Chains"]
  },
  {
    id: "iq-15",
    category: "Fundamentals & Internals",
    level: "Staff Architect (16+ Yrs)",
    question: "What is the security risk of having authorizeHttpRequests matchers in the wrong order?",
    simpleAnswer: "Spring Security evaluates rules from top to bottom and stops at the first match! If you put `.anyRequest().permitAll()` at the top, it will make all your private admin endpoints completely public!",
    architectDeepDive: "Rule order in `authorizeHttpRequests` is deterministic and first-match-wins. If a broader pattern precedes a restrictive pattern (e.g. `.requestMatchers(\"/api/**\").permitAll()` placed before `.requestMatchers(\"/api/admin/**\").hasRole(\"ADMIN\")`), the request `/api/admin/users` matches the first rule and is granted access anonymously, causing complete authorization bypass. Always place specific and restrictive routes first, followed by broader catch-alls (`.anyRequest().authenticated()`).",
    tags: ["Authorization", "Vulnerabilities"]
  },
  {
    id: "iq-16",
    category: "Fundamentals & Internals",
    level: "Junior / Mid",
    question: "What happens by default if you include spring-boot-starter-security in a Spring Boot app without any configuration?",
    simpleAnswer: "Spring Boot locks down every single endpoint with HTTP Basic & Form login, creates a default user named 'user', and prints a random UUID password in the console logs on startup.",
    architectDeepDive: "Spring Boot's auto-configuration (`SecurityAutoConfiguration`) creates a default `SecurityFilterChain` bean that executes: `http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated()).formLogin(withDefaults()).httpBasic(withDefaults())`. It also registers an `InMemoryUserDetailsManager` containing user 'user' with an auto-generated password logged at `INFO` level to prevent systems from running unprotected.",
    tags: ["Spring Boot AutoConfig"]
  },
  {
    id: "iq-17",
    category: "Fundamentals & Internals",
    level: "Senior",
    question: "Why should you never use {noop} passwords in production?",
    simpleAnswer: "`{noop}` tells Spring Security that the password is in plaintext and unencrypted. If an attacker breaches the database, all user passwords are leaked immediately.",
    architectDeepDive: "Spring Security's `DelegatingPasswordEncoder` uses password prefixes like `{bcrypt}`, `{argon2}`, and `{noop}` to determine hashing strategies. `{noop}` uses `NoOpPasswordEncoder`, which performs plaintext comparison. In production, this violates compliance mandates (PCI-DSS, SOC 2, HIPAA, GDPR). Passwords must be hashed using adaptive, one-way cryptographic algorithms with unique per-user salts.",
    tags: ["Cryptography", "Passwords"]
  },
  {
    id: "iq-18",
    category: "Fundamentals & Internals",
    level: "Staff Architect (16+ Yrs)",
    question: "How does OncePerRequestFilter guarantee single execution in asynchronous dispatch environments?",
    simpleAnswer: "It attaches a unique attribute to the request. If the request is dispatched again (e.g. during an internal forward or async resume), it sees the attribute and skips running a second time.",
    architectDeepDive: "Standard Servlet filters can be invoked multiple times during a single logical HTTP exchange (e.g., during `REQUEST`, `FORWARD`, `INCLUDE`, `ASYNC`, and `ERROR` dispatcher types). `OncePerRequestFilter` checks `request.getAttribute(alreadyFilteredAttributeName)`. If present, it bypasses `doFilterInternal()`. This prevents expensive operations—such as parsing and verifying JWT cryptographic signatures or hitting Redis caches—from executing redundantly during asynchronous processing.",
    tags: ["Filters", "Performance"]
  },
  {
    id: "iq-19",
    category: "Fundamentals & Internals",
    level: "Junior / Mid",
    question: "What is anonymous authentication in Spring Security?",
    simpleAnswer: "Even when a user has not logged in, Spring Security assigns them a mock 'anonymousUser' identity with role 'ROLE_ANONYMOUS' so code doesn't crash with null pointers.",
    architectDeepDive: "`AnonymousAuthenticationFilter` executes near the end of the filter chain. If `SecurityContextHolder.getContext().getAuthentication()` is still null, it instantiates an `AnonymousAuthenticationToken` with principal `'anonymousUser'` and authority `ROLE_ANONYMOUS`. This ensures that downstream filters and controllers can safely query `SecurityContextHolder` without NullPointerExceptions.",
    tags: ["AnonymousAuth", "Core Concepts"]
  },
  {
    id: "iq-20",
    category: "Fundamentals & Internals",
    level: "Senior",
    question: "What is the purpose of SecurityContextHolderAwareRequestFilter?",
    simpleAnswer: "It wraps the standard HttpServletRequest so that standard servlet methods like `request.isUserInRole(\"ADMIN\")` and `request.getUserPrincipal()` work with Spring Security.",
    architectDeepDive: "`SecurityContextHolderAwareRequestFilter` wraps the incoming `HttpServletRequest` with `SecurityContextHolderAwareRequestWrapper`. This wrapper integrates standard Java EE / Jakarta Servlet API methods (`request.isUserInRole()`, `request.getUserPrincipal()`, `request.authenticate()`, `request.login()`, `request.logout()`) with Spring Security's `SecurityContext`.",
    tags: ["Servlet Wrapper", "Internals"]
  },

  // ========================================================
  // CATEGORY 2: AUTHENTICATION & CRYPTOGRAPHY (Q21 - Q35)
  // ========================================================
  {
    id: "iq-21",
    category: "Authentication & Cryptography",
    level: "Junior / Mid",
    question: "Why should we use BCrypt or Argon2 instead of SHA-256 or MD5 for password storage?",
    simpleAnswer: "SHA-256 and MD5 are fast mathematical algorithms designed for file hashing. Attackers can compute billions of SHA-256 hashes per second using GPUs. BCrypt and Argon2 are slow and memory-hard algorithms specifically designed to defeat brute-force and hardware cracking.",
    architectDeepDive: "Cryptographic hash functions like MD5 and SHA-256 are engineered for high throughput. Modern GPUs can calculate over 100 billion SHA-256 guesses per second. BCrypt and Argon2id are slow, adaptive hashing algorithms with configurable work factors (iteration counts and memory cost). BCrypt includes an automatic 128-bit salt and an exponential cost factor (e.g. cost 12 takes ~100-200ms per attempt). Argon2id is memory-hard, making ASIC and GPU parallelization economically unviable.",
    tags: ["Cryptography", "BCrypt", "Argon2"]
  },
  {
    id: "iq-22",
    category: "Authentication & Cryptography",
    level: "Senior",
    question: "What is a Salt in password hashing and how does BCrypt handle salting?",
    simpleAnswer: "A salt is random data added to a password before hashing so that two users with the same password (e.g. 'Password123') produce completely different hash outputs, defeating pre-computed Rainbow Tables.",
    architectDeepDive: "Salting mitigates rainbow table attacks and bulk collision generation. In BCrypt, salting is built directly into the algorithm. When `BCryptPasswordEncoder.encode()` is called, it generates a cryptographically secure 16-byte random salt using `SecureRandom`. The output format `$2a$12$salt...hash...` stores the version, logarithmic work factor, salt, and hash together. During `matches()`, the stored salt is parsed from the hash string to recompute and verify.",
    tags: ["Salting", "BCrypt"]
  },
  {
    id: "iq-23",
    category: "Authentication & Cryptography",
    level: "Staff Architect (16+ Yrs)",
    question: "How does DelegatingPasswordEncoder work, and how do you achieve transparent zero-downtime password migration?",
    simpleAnswer: "It reads the prefix like `{bcrypt}` or `{argon2}` from the hash. If an old user logs in with an old `{sha256}` hash, Spring Security verifies it and automatically updates the database to modern `{argon2}` on the fly via UserDetailsPasswordService!",
    architectDeepDive: "`DelegatingPasswordEncoder` prefixes hashes with an identifier (e.g. `{bcrypt}$2a$...` or `{argon2}$argon2id$...`). To execute a seamless zero-downtime migration from legacy algorithms:\n1. Configure `DelegatingPasswordEncoder` with the new default (e.g., `argon2`) and map legacy encoders.\n2. Implement `UserDetailsPasswordService.updatePassword(UserDetails user, String newPasswordHash)`.\n3. When `DaoAuthenticationProvider.authenticate()` succeeds using an old encoder, it checks `passwordEncoder.upgradeEncoding(storedHash)`. If true, it invokes `UserDetailsPasswordService` to asynchronously update the database with the new Argon2 hash. Zero user resets required.",
    tags: ["Password Migration", "Architecture"]
  },
  {
    id: "iq-24",
    category: "Authentication & Cryptography",
    level: "Junior / Mid",
    question: "What is HTTP Basic Authentication and why is it unsuitable for consumer web applications?",
    simpleAnswer: "HTTP Basic sends the username and password on every request inside a Base64 string in the `Authorization: Basic ...` header. Base64 is not encryption (anyone can decode it in 1 second), and there is no built-in logout mechanism in browsers.",
    architectDeepDive: "HTTP Basic authentication transmits credentials encoded with Base64 (`username:password`). Unless strictly wrapped in TLS 1.3, credentials are in plaintext. Furthermore, browsers cache HTTP Basic credentials indefinitely in the process memory and re-transmit them with every request to that origin, making server-side logout impossible without browser restarts or dirty 401 response hacks. It is only suitable for simple internal health checks or legacy scripts.",
    tags: ["HTTP Basic", "Vulnerabilities"]
  },
  {
    id: "iq-25",
    category: "Authentication & Cryptography",
    level: "Senior",
    question: "What is DaoAuthenticationProvider and how does it prevent timing attacks?",
    simpleAnswer: "It is the provider that checks username and password against a database. It prevents timing attacks by running a dummy password check even when the user does not exist, so hackers cannot guess valid usernames by measuring server response times.",
    architectDeepDive: "Timing attacks allow attackers to enumerate valid usernames: if finding a non-existent user takes 2ms, but verifying a valid user with BCrypt takes 150ms, the response time leaks username existence. `DaoAuthenticationProvider` mitigates this via `mitigateAgainstTimingAttack()`: when `UserDetailsService` throws `UsernameNotFoundException`, it executes a dummy password check against `USER_NOT_FOUND_PASSWORD` so response times remain virtually identical.",
    tags: ["Timing Attacks", "DaoAuthenticationProvider"]
  },
  {
    id: "iq-26",
    category: "Authentication & Cryptography",
    level: "Staff Architect (16+ Yrs)",
    question: "What is constant-time string comparison and why does Spring Security use MessageDigest.isEqual()?",
    simpleAnswer: "Normal `String.equals()` stops checking at the very first character that doesn't match, which takes less time. Hackers can measure microsecond differences to guess secret tokens letter by letter. `MessageDigest.isEqual()` always takes the exact same amount of time regardless of how many characters match.",
    architectDeepDive: "Standard `String.equals()` is short-circuiting: it returns `false` as soon as a character mismatch occurs. In network protocols, an attacker with high-resolution statistical timing measurements can determine character positions in API keys, HMAC signatures, or CSRF tokens. `MessageDigest.isEqual()` performs a bitwise XOR accumulation over the entire byte array length, ensuring constant-time execution and eliminating side-channel timing attacks.",
    tags: ["Timing Attacks", "Cryptography"]
  },
  {
    id: "iq-27",
    category: "Authentication & Cryptography",
    level: "Senior",
    question: "What is Remember-Me authentication and what is the difference between simple cookie vs persistent token repository?",
    simpleAnswer: "Simple remember-me encodes username, expiry, and password into a cookie. If someone steals it or user changes password, it creates problems. Persistent token repository stores a rotating series and token in the database, detecting token theft immediately.",
    architectDeepDive: "Simple `TokenBasedRememberMeServices` computes `MD5(username + expiry + password + key)`. If the user's password changes, all cookies break; if captured, an attacker can replay it until expiration. `PersistentTokenBasedRememberMeServices` implements RFC-compliant persistent login tokens (`series`, `token`, `last_used`). On each login, the `token` changes while `series` stays constant. If an attacker replays an old token, Spring detects token reuse, invalidates all sessions for that series, and logs a security incident.",
    tags: ["Remember-Me", "Tokens"]
  },
  {
    id: "iq-28",
    category: "Authentication & Cryptography",
    level: "Staff Architect (16+ Yrs)",
    question: "How do you implement Multi-Factor Authentication (MFA / 2FA) in Spring Security 6 without breaking the filter chain?",
    simpleAnswer: "By using a two-phase authentication state. Phase 1 validates username/password and assigns a temporary authority `PRE_AUTH`. The user is blocked from real endpoints until Phase 2 validates the 6-digit TOTP code, which upgrades them to full `ROLE_USER`.",
    architectDeepDive: "In Spring Security 6, do NOT create a custom unmanaged servlet. Follow the Step-Up Authentication pattern:\n1. Successful primary credential verification results in an `Authentication` token with an intermediate authority: `ROLE_PRE_AUTH`.\n2. In `SecurityFilterChain`, protected business endpoints require `hasRole('FULL_AUTH')`, while `/api/mfa/**` allows `hasRole('PRE_AUTH')`.\n3. The user posts their Time-Based One-Time Password (TOTP RFC 6238). A dedicated filter or controller verifies the TOTP against their stored secret key using HMAC-SHA1.\n4. Upon TOTP success, the `Authentication` is replaced in `SecurityContextHolder` with full authorities (`ROLE_USER`, `ROLE_ADMIN`).",
    tags: ["MFA", "TOTP", "Architecture"]
  },
  {
    id: "iq-29",
    category: "Authentication & Cryptography",
    level: "Junior / Mid",
    question: "What is an AuthenticationEntryPoint?",
    simpleAnswer: "It is the gatekeeper that triggers when an unauthenticated user tries to access a protected resource, sending back a 401 Unauthorized or redirecting to a login page.",
    architectDeepDive: "`AuthenticationEntryPoint` is an interface with `commence(HttpServletRequest, HttpServletResponse, AuthenticationException)`. It is called by `ExceptionTranslationFilter` whenever an unauthenticated request triggers an `AuthenticationException`. For browser apps, `LoginUrlAuthenticationEntryPoint` initiates an HTTP 302 redirect to `/login`. For REST APIs, `BearerTokenAuthenticationEntryPoint` or custom JSON handlers return HTTP 401 with RFC 7807 problem details.",
    tags: ["AuthenticationEntryPoint", "Exceptions"]
  },
  {
    id: "iq-30",
    category: "Authentication & Cryptography",
    level: "Senior",
    question: "What is an AccessDeniedHandler?",
    simpleAnswer: "It handles requests from users who are already logged in, but don't have enough permission to access that specific URL, sending back an HTTP 403 Forbidden.",
    architectDeepDive: "`AccessDeniedHandler` handles `AccessDeniedException` thrown by authorization managers. Its method `handle(HttpServletRequest, HttpServletResponse, AccessDeniedException)` writes the error response. Custom implementations return structured JSON payloads (`{\"status\": 403, \"error\": \"Forbidden\"}`) for REST frontends.",
    tags: ["AccessDeniedHandler", "Exceptions"]
  },
  {
    id: "iq-31",
    category: "Authentication & Cryptography",
    level: "Staff Architect (16+ Yrs)",
    question: "How do you prevent brute-force credential stuffing attacks against login endpoints in Spring Boot?",
    simpleAnswer: "By placing a rate-limiting filter (like Bucket4j or Redis token bucket) and anti-bot CAPTCHA BEFORE the authentication filter so brute-force scripts are throttled before hitting the CPU-heavy BCrypt encoder.",
    architectDeepDive: "BCrypt work factor 12 takes ~100-200ms of CPU time per verification. If an attacker floods `/login` with 500 requests/sec, verifying passwords will starve the CPU and cause a Denial of Service (DoS).\n\nMitigation strategy:\n1. Place a distributed rate-limiting filter (`Bucket4j` with Redis) ahead of `UsernamePasswordAuthenticationFilter`.\n2. Throttle requests to 5 failed attempts per IP / username per minute.\n3. Integrate Cloudflare Turnstile or invisible reCAPTCHA v3 verified server-side before password evaluation.\n4. Publish `AuthenticationFailureBadCredentialsEvent` to record failed attempts in Redis and enforce progressive account lockouts.",
    tags: ["Brute Force", "Rate Limiting", "Security"]
  },
  {
    id: "iq-32",
    category: "Authentication & Cryptography",
    level: "Junior / Mid",
    question: "What is InMemoryUserDetailsManager and when should it be used?",
    simpleAnswer: "It stores users in server memory using a Java collection. It is great for local testing, quick prototypes, or mock demos, but should never be used for real production users.",
    architectDeepDive: "`InMemoryUserDetailsManager` is an implementation of `UserDetailsManager` that stores `UserDetails` in a `ConcurrentHashMap`. It does not survive application restarts and cannot scale horizontally across pods. It is suitable strictly for development profiles, test harnesses (`@SpringBootTest`), or internal batch daemons with static identities.",
    tags: ["InMemory", "Testing"]
  },
  {
    id: "iq-33",
    category: "Authentication & Cryptography",
    level: "Senior",
    question: "How do you handle LazyInitializationException when loading roles in JPA UserDetailsService?",
    simpleAnswer: "Either fetch roles eagerly using `@EntityGraph(attributePaths = {\"roles\"})`, or annotate your `loadUserByUsername()` method with `@Transactional(readOnly = true)`.",
    architectDeepDive: "In JPA, `@ManyToMany` user-role relationships are lazily loaded by default (`FetchType.LAZY`). When `DaoAuthenticationProvider` calls `loadUserByUsername()`, if the Hibernate session closes before `user.getRoles()` is converted to `GrantedAuthority`, Hibernate throws `LazyInitializationException`.\n\nBest practice: Use a Spring Data JPA `@EntityGraph(attributePaths = {\"roles\", \"roles.permissions\"})` on `findByUsername()` to execute a single optimized SQL `JOIN FETCH`, and annotate the service method with `@Transactional(readOnly = true)`.",
    tags: ["JPA", "Hibernate", "Performance"]
  },
  {
    id: "iq-34",
    category: "Authentication & Cryptography",
    level: "Staff Architect (16+ Yrs)",
    question: "How do you architect an API Key authentication mechanism for Machine-to-Machine (M2M) high-throughput ingestion?",
    simpleAnswer: "Create a custom OncePerRequestFilter that reads `X-API-KEY`, hashes the incoming key with SHA-256, looks up the client in a Redis memory cache, and establishes an ApiKeyAuthenticationToken in SecurityContextHolder.",
    architectDeepDive: "1. Client supplies key in `X-API-KEY` header.\n2. Never store plaintext keys in the database. When issuing keys, display raw key once (`live_sk_prod_...`), and store its SHA-256 hash in PostgreSQL.\n3. A custom `ApiKeyFilter` intercepts the request.\n4. Hash the incoming key and perform an ultra-fast lookup in an in-memory Redis/Caffeine cache.\n5. If found, instantiate `ApiKeyAuthenticationToken` with scopes (e.g. `SCOPE_telemetry:write`) and set in `SecurityContextHolder`.\n6. Track API key quotas and rate limits per client ID using Redis Token Bucket.",
    tags: ["API Key", "M2M", "Architecture"]
  },
  {
    id: "iq-35",
    category: "Authentication & Cryptography",
    level: "Senior",
    question: "What is a SecurityContextRepository in Spring Security 6?",
    simpleAnswer: "It is the component responsible for saving and restoring the SecurityContext between HTTP requests (e.g., in the HttpSession for web portals, or an empty repository for stateless APIs).",
    architectDeepDive: "In Spring Security 6, `SecurityContextPersistenceFilter` was deprecated and replaced with explicit management via `SecurityContextHolderFilter` and `SecurityContextRepository`. For session-based apps, `HttpSessionSecurityContextRepository` persists the context in `HttpSession`. For pure stateless REST APIs, `RequestAttributeSecurityContextRepository` or `NullSecurityContextRepository` is used to prevent allocating HTTP sessions entirely.",
    tags: ["SecurityContextRepository", "Spring Security 6"]
  },

  // ========================================================
  // CATEGORY 3: AUTHORIZATION & METHOD SECURITY (Q36 - Q50)
  // ========================================================
  {
    id: "iq-36",
    category: "Authorization & Method Security",
    level: "Junior / Mid",
    question: "How do you enable Method Security in Spring Boot 3?",
    simpleAnswer: "By adding the annotation `@EnableMethodSecurity` on any `@Configuration` class.",
    architectDeepDive: "In Spring Boot 3, annotate a configuration class with `@EnableMethodSecurity`. By default, `prePostEnabled = true` is active. This replaces the legacy Spring Security 5 annotation `@EnableGlobalMethodSecurity(prePostEnabled = true)`. It uses Spring AOP to proxy beans and evaluate annotations like `@PreAuthorize`, `@PostAuthorize`, `@PreFilter`, and `@PostFilter`.",
    tags: ["Method Security", "Spring Boot 3"]
  },
  {
    id: "iq-37",
    category: "Authorization & Method Security",
    level: "Senior",
    question: "What is the difference between @PreAuthorize and @PostAuthorize?",
    simpleAnswer: "@PreAuthorize checks permissions BEFORE the method runs. @PostAuthorize lets the method execute first, and checks permissions on the RETURNED object before sending it to the caller.",
    architectDeepDive: "`@PreAuthorize` evaluates SpEL expressions prior to method execution; if access is denied, the method is not invoked. `@PostAuthorize` executes the method, binds the returned value to the SpEL variable `returnObject`, and evaluates the rule (e.g., `@PostAuthorize(\"returnObject.ownerId == authentication.principal.id\")`). If denied, Spring throws `AccessDeniedException` and prevents the caller from seeing the return value.",
    tags: ["Method Security", "SpEL"]
  },
  {
    id: "iq-38",
    category: "Authorization & Method Security",
    level: "Staff Architect (16+ Yrs)",
    question: "Why does method security fail to trigger when a method calls another annotated method in the same class (this.method())?",
    simpleAnswer: "Because Spring Method Security works via Spring AOP proxies! When a method calls another method on `this`, it bypasses the proxy wrapper completely, so security annotations are ignored.",
    architectDeepDive: "Spring's method security utilizes CGLIB dynamic proxies. When an external caller invokes a method on a bean, the call passes through the proxy interceptor (`AuthorizationManagerBeforeMethodInterceptor`). However, internal calls (`this.method()`) execute directly on the target instance within the JVM stack without traversing the AOP proxy. Solutions: refactor the method into a separate dedicated service bean, or inject self-proxy (`@Autowired private MyService self; self.method()`).",
    tags: ["AOP", "Proxies", "Gotchas"]
  },
  {
    id: "iq-39",
    category: "Authorization & Method Security",
    level: "Junior / Mid",
    question: "How do you check domain object ownership with SpEL in @PreAuthorize?",
    simpleAnswer: "By referencing method arguments with `#` and comparing with `authentication.principal`: `@PreAuthorize(\"#userId == authentication.principal.id or hasRole('ADMIN')\")`.",
    architectDeepDive: "SpEL maps method arguments to variable names prefixed with `#`. In Java 17+ / Spring Boot 3, javac must be compiled with the `-parameters` flag so parameter names are preserved in bytecode (or annotated with `@P(\"userId\")`). The expression `#userId == authentication.principal.id` evaluates dynamically at runtime, preventing Insecure Direct Object References (IDOR).",
    tags: ["SpEL", "IDOR"]
  },
  {
    id: "iq-40",
    category: "Authorization & Method Security",
    level: "Senior",
    question: "What is RoleHierarchy and why should you use it?",
    simpleAnswer: "RoleHierarchy lets higher roles automatically inherit lower role permissions (e.g., SUPER_ADMIN > ADMIN > USER). This keeps your code clean so you don't have to assign 10 roles to every admin.",
    architectDeepDive: "`RoleHierarchyImpl` defines role relationship graph expressions: `ROLE_SUPERADMIN > ROLE_ADMIN \n ROLE_ADMIN > ROLE_MANAGER \n ROLE_MANAGER > ROLE_USER`. The `RoleHierarchy` bean is injected into `DefaultMethodSecurityExpressionHandler` and `WebExpressionAuthorizationManager`. When evaluating `.hasRole(\"USER\")`, any user possessing `ROLE_ADMIN` or `ROLE_SUPERADMIN` is automatically granted access. This prevents role explosion in database tokens.",
    tags: ["RoleHierarchy", "RBAC"]
  },
  {
    id: "iq-41",
    category: "Authorization & Method Security",
    level: "Staff Architect (16+ Yrs)",
    question: "What is the difference between RBAC, ABAC, and ReBAC?",
    simpleAnswer: "RBAC (Role-Based) checks your title ('Doctor'). ABAC (Attribute-Based) checks dynamic context ('Doctor on duty in Room 4 between 9am-5pm'). ReBAC (Relationship-Based) checks graph relationships ('Alice is editor of Folder that contains Document').",
    architectDeepDive: "1. **RBAC (Role-Based Access Control)**: Static mapping of permissions to roles. Fails when permissions depend on context or data ownership.\n2. **ABAC (Attribute-Based Access Control)**: Evaluates dynamic attributes (subject, resource, action, environment context like time, IP, tenant). Implemented in Spring Security using custom `SecurityExpressionRoot` or external PEPs (Open Policy Agent / OPA).\n3. **ReBAC (Relationship-Based Access Control)**: Originates from Google Zanzibar. Access is derived from graph relations (e.g. parent-folder ownership, team membership).",
    tags: ["RBAC", "ABAC", "ReBAC", "System Design"]
  },
  {
    id: "iq-42",
    category: "Authorization & Method Security",
    level: "Senior",
    question: "What are @PreFilter and @PostFilter and what performance caveat do they have?",
    simpleAnswer: "They filter collections passed into or returned from a method. The caveat is that they filter in memory AFTER fetching all rows, which can cause severe performance issues with large datasets.",
    architectDeepDive: "`@PreFilter` filters incoming `Collection` arguments using the SpEL variable `filterObject`. `@PostFilter` filters returned collections. Caveat: If a method queries 50,000 rows from a database, `@PostFilter` loads all 50,000 rows into JVM memory and iterates through them one-by-one. This causes memory bloat and CPU exhaustion. Best practice: filter at the SQL database layer using JPA queries or multi-tenancy filters instead of in-memory `@PostFilter`.",
    tags: ["Method Security", "Performance"]
  },
  {
    id: "iq-43",
    category: "Authorization & Method Security",
    level: "Staff Architect (16+ Yrs)",
    question: "How does Spring Security ACL (Access Control Lists) work and why do high-scale companies avoid it?",
    simpleAnswer: "Spring Security ACL stores row-level permissions in 4 database tables. High-scale systems avoid it because it requires expensive SQL joins on every single item, creating a major database bottleneck.",
    architectDeepDive: "Spring Security ACL utilizes 4 relational tables: `acl_sid` (identities), `acl_class` (domain classes), `acl_object_identity` (specific entity instances), and `acl_entry` (permissions: READ, WRITE, DELETE). When calling `hasPermission(#id, 'Document', 'WRITE')`, it executes recursive database lookups. In high-throughput systems with millions of records, ACL tables become massive database bottlenecks. Modern systems replace ACL with database row-level security (PostgreSQL RLS), multi-tenant discriminator columns, or relationship engines (Zanzibar / SpiceDB).",
    tags: ["Spring Security ACL", "Database"]
  },
  {
    id: "iq-44",
    category: "Authorization & Method Security",
    level: "Junior / Mid",
    question: "What is @Secured and @RolesAllowed and how do they differ from @PreAuthorize?",
    simpleAnswer: "@Secured is Spring's legacy annotation and @RolesAllowed is standard Java EE. Both only support simple role checks. @PreAuthorize is much more powerful because it supports full Spring Expression Language (SpEL).",
    architectDeepDive: "`@Secured` only accepts a list of role strings (`@Secured(\"ROLE_ADMIN\")`). `@RolesAllowed` is JSR-250 compliant. Neither supports expressions, boolean logic (`and`, `or`), or parameter references. `@PreAuthorize` supports rich SpEL expressions (`@PreAuthorize(\"hasRole('ADMIN') and #user.active == true\")`), making it the industry standard.",
    tags: ["Annotations", "Method Security"]
  },
  {
    id: "iq-45",
    category: "Authorization & Method Security",
    level: "Senior",
    question: "How do you test method security in Spring Boot unit tests?",
    simpleAnswer: "Use `@WithMockUser(username = \"alice\", roles = {\"ADMIN\"})` on test methods in combination with `@SpringBootTest` or `@WebMvcTest`.",
    architectDeepDive: "`spring-security-test` provides `@WithMockUser` and `@WithUserDetails`. These annotations create and inject an initialized `SecurityContext` containing a `UsernamePasswordAuthenticationToken` before executing the test method, and tear it down afterwards. For custom authentication tokens, you can write custom meta-annotations using `@WithSecurityContext`.",
    tags: ["Testing", "WithMockUser"]
  },
  {
    id: "iq-46",
    category: "Authorization & Method Security",
    level: "Staff Architect (16+ Yrs)",
    question: "How do you implement Multi-Tenant Data Isolation in Spring Data JPA using the SecurityContext?",
    simpleAnswer: "By implementing Hibernate's `CurrentTenantIdentifierResolver` to pull the tenant ID from `SecurityContextHolder`, which automatically appends `WHERE tenant_id = ?` to all database queries.",
    architectDeepDive: "1. Extract tenant ID from incoming JWT claim (`tenant_id`) and store in a custom `TenantPrincipal` inside `SecurityContextHolder`.\n2. Implement Hibernate's `CurrentTenantIdentifierResolver<String>`: its `resolveCurrentTenantIdentifier()` returns the tenant from `SecurityContextHolder`.\n3. Configure Hibernate discriminator or separate-schema multi-tenancy. Hibernate automatically appends tenant isolation filters to all SQL statements, eliminating the risk of developer query bugs leaking cross-tenant data.",
    tags: ["Multi-Tenancy", "JPA", "Hibernate"]
  },
  {
    id: "iq-47",
    category: "Authorization & Method Security",
    level: "Junior / Mid",
    question: "How do you automatically populate createdBy and lastModifiedBy in JPA entities using Spring Security?",
    simpleAnswer: "Enable `@EnableJpaAuditing` and create an `AuditorAware<String>` bean that returns `SecurityContextHolder.getContext().getAuthentication().getName()`.",
    architectDeepDive: "Annotate configuration with `@EnableJpaAuditing(auditorAwareRef = \"auditorProvider\")`. Register `@Bean public AuditorAware<String> auditorProvider()`. During entity persistence lifecycle (`@PrePersist`, `@PreUpdate`), Spring Data JPA calls `auditorProvider.getCurrentAuditor()` to pull the username from `SecurityContextHolder` and inject it into `@CreatedBy` and `@LastModifiedBy` fields.",
    tags: ["Auditing", "JPA"]
  },
  {
    id: "iq-48",
    category: "Authorization & Method Security",
    level: "Senior",
    question: "What is an AuthorizationDecision in Spring Security 6?",
    simpleAnswer: "It is the simple object returned by an AuthorizationManager that wraps a boolean: `new AuthorizationDecision(true)` allows access, `new AuthorizationDecision(false)` denies access.",
    architectDeepDive: "`AuthorizationDecision` is an immutable class implementing `AuthorizationResult`. It encapsulates a boolean `isGranted()` flag. In Spring Security 6, custom `AuthorizationManager<T>` implementations evaluate incoming requests or method invocations and return an `AuthorizationDecision`. If `false`, Spring Security throws `AccessDeniedException`.",
    tags: ["AuthorizationDecision", "Spring Security 6"]
  },
  {
    id: "iq-49",
    category: "Authorization & Method Security",
    level: "Staff Architect (16+ Yrs)",
    question: "How do you secure GraphQL endpoints with Spring Security?",
    simpleAnswer: "Because all GraphQL queries hit a single POST /graphql URL, web filter chain security is not enough! You must secure individual data fetchers and queries using `@PreAuthorize` on controller resolver methods.",
    architectDeepDive: "In GraphQL, the HTTP endpoint is monolithic (`POST /graphql`). HTTP filter chain rules cannot differentiate between a public product query and a restricted salary mutation. Security MUST be applied at the GraphQL schema resolver layer using Spring for GraphQL's `@QueryMapping`, `@MutationMapping`, and `@SchemaMapping` annotated with `@PreAuthorize`. Spring for GraphQL propagates the security context into the GraphQL execution environment.",
    tags: ["GraphQL", "Architecture"]
  },
  {
    id: "iq-50",
    category: "Authorization & Method Security",
    level: "Senior",
    question: "How do you secure WebSocket STOMP connections and destinations?",
    simpleAnswer: "By extending `AbstractSecurityWebSocketMessageBrokerConfigurer` and configuring authorization rules for CONNECT, SUBSCRIBE, and SEND frame types.",
    architectDeepDive: "WebSocket connections start as HTTP handshakes and upgrade to bidirectional TCP. Filter chains only protect the initial handshake. Once connected, STOMP message frames travel over the open socket. Security requires `ChannelSecurityInterceptor` (via `AbstractSecurityWebSocketMessageBrokerConfigurer` or message matcher registries), validating authentication on `CONNECT` frames and checking permissions on destination patterns (`/topic/**`, `/queue/**`).",
    tags: ["WebSockets", "STOMP"]
  },

  // ========================================================
  // CATEGORY 4: SESSIONS, CORS & CSRF DEFENSE (Q51 - Q65)
  // ========================================================
  {
    id: "iq-51",
    category: "Sessions, CORS & CSRF",
    level: "Junior / Mid",
    question: "What is Cross-Site Request Forgery (CSRF) and how does Spring Security protect against it?",
    simpleAnswer: "CSRF happens when an evil website tricks your browser into making an unauthorized request to your bank using your existing session cookie. Spring Security protects you by requiring a secret, random CSRF token on every POST/PUT/DELETE request that the evil site cannot know.",
    architectDeepDive: "Browsers automatically attach cookies (like `JSESSIONID`) to cross-origin requests. An attacker tricks an authenticated user into clicking a link that posts to `bank.com/transfer`. Spring Security implements the Synchronizer Token Pattern (or Double-Submit Cookie pattern via `CookieCsrfTokenRepository`). A cryptographically random token is generated per session. Mutating HTTP requests (POST, PUT, DELETE, PATCH) must include this token in a header (`X-XSRF-TOKEN`). If absent or mismatched, `CsrfFilter` rejects the request with HTTP 403.",
    tags: ["CSRF", "Security Vulnerabilities"]
  },
  {
    id: "iq-52",
    category: "Sessions, CORS & CSRF",
    level: "Senior",
    question: "Why can CSRF protection safely be disabled for pure stateless REST APIs?",
    simpleAnswer: "Because pure REST APIs do not use browser session cookies! They use Bearer tokens sent in JavaScript headers. Browsers never automatically attach Bearer headers to cross-site requests, so CSRF attacks are physically impossible.",
    architectDeepDive: "CSRF is fundamentally a cookie exploitation vector. If an API is completely stateless (`SessionCreationPolicy.STATELESS`), does not use HTTP sessions, and authenticates purely via `Authorization: Bearer <JWT>`, browsers will NOT automatically attach the token on cross-origin requests. Therefore, `csrf.disable()` is safe for pure token-based APIs. However, if the API stores tokens in cookies or uses session cookies for a SPA, CSRF MUST remain enabled.",
    tags: ["CSRF", "REST", "Stateless"]
  },
  {
    id: "iq-53",
    category: "Sessions, CORS & CSRF",
    level: "Staff Architect (16+ Yrs)",
    question: "Why are CSRF tokens deferred by default in Spring Security 6, and why does this break Angular/React apps if not configured properly?",
    simpleAnswer: "For performance, Spring Security 6 doesn't create the token until it is actually needed. But if your SPA needs the cookie on first load, it won't be there! You must add a simple filter that calls `csrfToken.getToken()` to force it to write the cookie.",
    architectDeepDive: "In Spring Security 6, `CsrfToken` generation is deferred (`DeferredCsrfToken`) to prevent unnecessary session and crypto overhead on read-only requests. In Single Page Applications (SPAs), frameworks like Angular expect the `XSRF-TOKEN` cookie to be present on initial GET requests. Because the token is deferred, the cookie is not written until a mutation occurs, causing SPA calls to fail with 403. Solution: Add a custom `OncePerRequestFilter` after `BasicAuthenticationFilter` that accesses `csrfToken.getToken()`, forcing the token to be realized and written to the response cookie.",
    tags: ["Spring Security 6", "CSRF", "SPA"]
  },
  {
    id: "iq-54",
    category: "Sessions, CORS & CSRF",
    level: "Junior / Mid",
    question: "What is CORS (Cross-Origin Resource Sharing) and why does the browser block requests?",
    simpleAnswer: "CORS is a browser security rule (Same-Origin Policy) that stops JavaScript on Website A from reading data from Website B unless Website B explicitly gives permission in HTTP headers.",
    architectDeepDive: "CORS is enforced strictly by web browsers, NOT servers. When a frontend at `https://app.com` makes an XMLHttpRequest / Fetch to `https://api.com`, the browser sends an HTTP `OPTIONS` preflight request with `Origin` and `Access-Control-Request-Method` headers. If the server does not reply with matching `Access-Control-Allow-Origin` and allowed methods, the browser blocks the response from JavaScript.",
    tags: ["CORS", "Browsers"]
  },
  {
    id: "iq-55",
    category: "Sessions, CORS & CSRF",
    level: "Senior",
    question: "Why must CorsFilter be configured before AuthorizationFilter in the SecurityFilterChain?",
    simpleAnswer: "Because browser preflight OPTIONS requests do NOT carry passwords or tokens. If AuthorizationFilter runs first, it will reject the preflight with 401/403, breaking all frontend API calls!",
    architectDeepDive: "Browser preflights (`OPTIONS`) are dispatched without authentication credentials (`Authorization` header or cookies). If `AuthorizationFilter` evaluates the request before `CorsFilter`, it detects an unauthenticated request on a protected endpoint and returns 401/403. The browser interprets this as a failed CORS preflight and terminates the entire connection. `CorsFilter` must run first to respond to `OPTIONS` preflights immediately.",
    tags: ["CORS", "Filter Chain"]
  },
  {
    id: "iq-56",
    category: "Sessions, CORS & CSRF",
    level: "Staff Architect (16+ Yrs)",
    question: "Why is setting Access-Control-Allow-Origin: * alongside AllowCredentials: true a dangerous configuration that browsers reject?",
    simpleAnswer: "Because allowing any website in the world (`*`) to read responses with private user cookies (`credentials: true`) would let malicious websites steal your private data! Browsers strictly forbid this combination.",
    architectDeepDive: "The W3C CORS specification forbids `Access-Control-Allow-Origin: *` when `Access-Control-Allow-Credentials` is `true`. If permitted, any malicious website on the internet could perform credentialed requests against your API and read private user data. Spring Security will throw an exception or modern browsers will reject the response with a CORS violation error. You must explicitly configure an allowlist of trusted origins.",
    tags: ["CORS", "Vulnerabilities"]
  },
  {
    id: "iq-57",
    category: "Sessions, CORS & CSRF",
    level: "Junior / Mid",
    question: "What is Session Fixation and how does Spring Security prevent it?",
    simpleAnswer: "Session fixation is when an attacker tricks you into logging in with a session ID they already know. Spring Security prevents it by throwing away the old session ID and giving you a brand new session ID immediately upon login.",
    architectDeepDive: "An attacker establishes an unauthenticated session ID with a server and sends a link to a victim containing this session ID. If the server retains the same session ID after the victim logs in, the attacker can use their copy of the session ID to hijack the authenticated account. Spring Security prevents this via `sessionFixation().changeSessionId()` (default in Servlet 3.1+), which instructs the container to issue a new session ID while migrating existing attributes.",
    tags: ["Session Fixation", "Sessions"]
  },
  {
    id: "iq-58",
    category: "Sessions, CORS & CSRF",
    level: "Senior",
    question: "How do you limit a user to only 1 active session at a time (concurrent session control)?",
    simpleAnswer: "Configure `.maximumSessions(1)` in session management and register the `HttpSessionEventPublisher` bean so Spring knows when sessions open and close.",
    architectDeepDive: "Use `http.sessionManagement(s -> s.maximumSessions(1).maxSessionsPreventsLogin(false).sessionRegistry(sessionRegistry()))`. `ConcurrentSessionControlAuthenticationStrategy` tracks active sessions per `Principal`. Critical gotcha: You MUST register a `ServletListenerRegistrationBean<HttpSessionEventPublisher>` bean. Without this listener, session destruction events are not published, causing the registry to falsely retain expired sessions and permanently locking out users.",
    tags: ["Concurrent Sessions", "Sessions"]
  },
  {
    id: "iq-59",
    category: "Sessions, CORS & CSRF",
    level: "Staff Architect (16+ Yrs)",
    question: "How do you scale stateful HTTP sessions across 50 microservice pods without sticky load balancer sessions?",
    simpleAnswer: "Use Spring Session Redis (`@EnableRedisIndexedHttpSession`). All 50 pods read and write sessions to a central Redis cluster instead of storing them in Tomcat's local memory.",
    architectDeepDive: "Tomcat default sessions (`StandardSession`) reside in local JVM heap memory. Sticky sessions on ALBs introduce load imbalances and break if a pod crashes. Spring Session replaces Tomcat's `HttpSession` with `RedisIndexedSession`. Session read/write and expiry events are backed by Redis hash keys with TTL. All session attributes must implement `java.io.Serializable`. This allows true stateless pod scaling while preserving stateful session semantics.",
    tags: ["Spring Session", "Redis", "Distributed Systems"]
  },
  {
    id: "iq-60",
    category: "Sessions, CORS & CSRF",
    level: "Junior / Mid",
    question: "What are the attributes of a secure session cookie (HttpOnly, Secure, SameSite)?",
    simpleAnswer: "HttpOnly prevents JavaScript from stealing the cookie. Secure ensures it is only sent over HTTPS. SameSite (Strict/Lax) stops the browser from sending the cookie on third-party links, stopping CSRF.",
    architectDeepDive: "1. `HttpOnly`: Neutralizes XSS token exfiltration; document.cookie cannot read the cookie.\n2. `Secure`: Browser only transmits cookie over TLS/HTTPS connections, preventing plaintext sniffing.\n3. `SameSite=Strict` or `Lax`: Instructs the browser not to attach the cookie on cross-site requests, providing defense-in-depth against CSRF.",
    tags: ["Cookies", "Security Headers"]
  },
  {
    id: "iq-61",
    category: "Sessions, CORS & CSRF",
    level: "Senior",
    question: "What is HSTS (HTTP Strict Transport Security) and how does Spring Security configure it?",
    simpleAnswer: "HSTS tells browsers: 'Never connect to this website using unencrypted HTTP again; always force HTTPS for the next 1 year.'",
    architectDeepDive: "`Strict-Transport-Security` header prevents SSL stripping and man-in-the-middle downgrade attacks. Spring Security enables HSTS by default on secure requests with a 1-year max age (`max-age=31536000; includeSubDomains`). It can be customized in `http.headers(h -> h.httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).preload(true)))`.",
    tags: ["HSTS", "Security Headers"]
  },
  {
    id: "iq-62",
    category: "Sessions, CORS & CSRF",
    level: "Staff Architect (16+ Yrs)",
    question: "What is Content Security Policy (CSP) and why is it the ultimate defense against Cross-Site Scripting (XSS)?",
    simpleAnswer: "CSP is an HTTP header where your server tells the browser exactly which domains are allowed to run JavaScript, stopping unauthorized hacker scripts from executing.",
    architectDeepDive: "Content Security Policy (`Content-Security-Policy`) restricts the resources (scripts, images, stylesheets, iframes) the browser is allowed to load for a given page. Directives like `default-src 'self'; script-src 'self' https://trusted.cdn.com; object-src 'none'; frame-ancestors 'none';` prevent inline scripts and untrusted remote script injection, neutralizing reflected and stored XSS even if a template injection flaw exists in the application.",
    tags: ["CSP", "XSS", "Hardening"]
  },
  {
    id: "iq-63",
    category: "Sessions, CORS & CSRF",
    level: "Junior / Mid",
    question: "What is Clickjacking and how does Spring Security prevent it by default?",
    simpleAnswer: "Clickjacking is when a hacker embeds your website in an invisible iframe inside their malicious site to trick users into clicking buttons. Spring Security prevents it by adding the `X-Frame-Options: DENY` header.",
    architectDeepDive: "Clickjacking tricks a user into clicking on a transparent iframe overlaying a decoy button. Spring Security automatically applies `X-Frame-Options: DENY` (or `SAMEORIGIN`), instructing browsers never to render the page inside a `<frame>`, `<iframe>`, `<embed>`, or `<object>`.",
    tags: ["Clickjacking", "Security Headers"]
  },
  {
    id: "iq-64",
    category: "Sessions, CORS & CSRF",
    level: "Senior",
    question: "What is SessionCreationPolicy.STATELESS and what happens if code tries to create a session when it's set?",
    simpleAnswer: "It tells Spring Security to never create or read an HttpSession. However, if your own application code explicitly calls `request.getSession()`, Tomcat will still create one unless configured otherwise.",
    architectDeepDive: "`SessionCreationPolicy.STATELESS` guarantees that Spring Security will never create an `HttpSession` and will never use it to obtain the `SecurityContext`. It forces Spring Security to re-evaluate credentials on every request. However, it does NOT prevent your application code or third-party libraries from creating sessions unless you enforce a `NullSecurityContextRepository`.",
    tags: ["Stateless", "Sessions"]
  },
  {
    id: "iq-65",
    category: "Sessions, CORS & CSRF",
    level: "Staff Architect (16+ Yrs)",
    question: "How does Spring Security handle user logout in clustered environments?",
    simpleAnswer: "A LogoutHandler clears the SecurityContext, invalidates the server session, removes cookies, and in distributed systems, publishes an event or deletes the session key from Redis.",
    architectDeepDive: "Logout is coordinated by `LogoutFilter` using a composite list of `LogoutHandler` instances: `SecurityContextLogoutHandler` (clears context), `CookieClearingLogoutHandler` (clears cookies), and `CsrfLogoutHandler`. In clustered environments using Spring Session Redis, the session key in Redis is deleted. In OAuth2 / OIDC systems, a `LogoutSuccessHandler` initiates an OIDC Back-Channel Logout (RFC 8691) to revoke SSO sessions at the Identity Provider.",
    tags: ["Logout", "Clustering"]
  },

  // ========================================================
  // CATEGORY 5: JWT, REST APIS & TOKENS (Q66 - Q78)
  // ========================================================
  {
    id: "iq-66",
    category: "JWT & Stateless REST",
    level: "Junior / Mid",
    question: "What are the 3 parts of a JSON Web Token (JWT)?",
    simpleAnswer: "Header (algorithm & token type), Payload (user data & claims), and Signature (cryptographic proof that the token wasn't tampered with), separated by dots: `header.payload.signature`.",
    architectDeepDive: "1. **Header**: Base64URL-encoded JSON specifying algorithm (`alg`: 'RS256' / 'HS256') and token type (`typ`: 'JWT') plus key ID (`kid`).\n2. **Payload**: Base64URL-encoded JSON containing registered claims (`iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti`) and custom claims (`roles`, `email`).\n3. **Signature**: Cryptographic hash of `Base64URL(Header) + '.' + Base64URL(Payload)` signed using a secret (HMAC) or private key (RSA/ECDSA).",
    tags: ["JWT", "Tokens"]
  },
  {
    id: "iq-67",
    category: "JWT & Stateless REST",
    level: "Senior",
    question: "What is the difference between Symmetric (HS256) and Asymmetric (RS256) JWT signing?",
    simpleAnswer: "Symmetric (HS256) uses the same secret key to sign and verify. Asymmetric (RS256) uses a Private Key to sign tokens and a Public Key to verify tokens.",
    architectDeepDive: "In HS256, all microservices verifying tokens must know the shared secret. If a single microservice is compromised, an attacker can forge arbitrary tokens for the entire ecosystem. In RS256 (Asymmetric), only the Auth Server holds the Private Key to issue tokens. All downstream microservices only possess the Public Key (via JWKS endpoint), allowing them to verify tokens locally without ever having the ability to forge them.",
    tags: ["JWT", "Cryptography", "RS256"]
  },
  {
    id: "iq-68",
    category: "JWT & Stateless REST",
    level: "Staff Architect (16+ Yrs)",
    question: "Why is storing JWT access tokens in browser localStorage considered an architectural anti-pattern?",
    simpleAnswer: "Because any Cross-Site Scripting (XSS) vulnerability or malicious npm package can run `localStorage.getItem('token')` and steal the user's credentials! Storing it in an HttpOnly cookie prevents JavaScript from accessing it.",
    architectDeepDive: "`localStorage` and `sessionStorage` have no security boundary against JavaScript executing on the same origin. A single vulnerable dependency in `node_modules` or minor XSS flaw allows silent exfiltration of tokens. In contrast, an `HttpOnly; Secure; SameSite=Strict` cookie cannot be read by any JavaScript API. Modern enterprise systems use the Backend-for-Frontend (BFF) pattern to keep tokens off client devices entirely.",
    tags: ["XSS", "Storage", "Architecture"]
  },
  {
    id: "iq-69",
    category: "JWT & Stateless REST",
    level: "Senior",
    question: "What is the 'Stateless JWT Revocation Paradox' and how do Staff Engineers solve it?",
    simpleAnswer: "The paradox is that JWTs are meant to be stateless (no DB lookup), but if you need to revoke a token immediately on logout or password change, you MUST check a central store. Solution: Use very short-lived access tokens (15m) paired with an ultra-fast Redis memory blacklist.",
    architectDeepDive: "Statelessness and instantaneous revocation are fundamentally contradictory. If a token is self-contained, a compromised token remains valid until `exp`. Staff Engineers solve this with a hybrid strategy:\n1. Keep Access Tokens short-lived (5 to 15 minutes).\n2. Maintain a distributed Redis cache blacklist containing revoked `jti` (JWT ID) claims with a TTL equal to the token's remaining lifetime.\n3. A custom filter performs an in-memory sub-millisecond Redis `EXISTS` check on incoming requests.\n4. Redis memory does not grow unbounded because keys expire automatically when the token expires.",
    tags: ["JWT Revocation", "Redis", "System Design"]
  },
  {
    id: "iq-70",
    category: "JWT & Stateless REST",
    level: "Staff Architect (16+ Yrs)",
    question: "How does Refresh Token Rotation with Reuse Detection work?",
    simpleAnswer: "Every time a refresh token is used, it is destroyed and a new one is issued. If an attacker and victim both try to use the same token, the system detects theft and immediately revokes all tokens for that user!",
    architectDeepDive: "Refresh tokens are organized into 'Token Families' in the database. When a client exchanges a refresh token for a new token pair, the used token is marked `consumed`. If an attacker intercepted the token and presents it after the legitimate client already rotated it, the server detects that a consumed token was presented, triggers a security breach alert, and immediately revokes the ENTIRE token family for that user.",
    tags: ["Refresh Tokens", "Security"]
  },
  {
    id: "iq-71",
    category: "JWT & Stateless REST",
    level: "Junior / Mid",
    question: "What are registered JWT claims like sub, iss, aud, exp, and nbf?",
    simpleAnswer: "`sub` = subject (user ID), `iss` = issuer (who created it), `aud` = audience (intended recipient), `exp` = expiration time, `nbf` = not before (cannot be used before this time).",
    architectDeepDive: "Standardized in RFC 7519: `sub` identifies the principal; `iss` validates the issuing authority against an expected URI; `aud` ensures the token is intended for this specific resource server (preventing cross-service token misuse); `exp` epoch timestamp when validity ceases; `nbf` timestamp before which token must be rejected; `jti` unique token UUID for replay prevention and revocation tracking.",
    tags: ["JWT", "RFC 7519"]
  },
  {
    id: "iq-72",
    category: "JWT & Stateless REST",
    level: "Senior",
    question: "What is the 'alg: none' JWT vulnerability and how does Spring Security protect against it?",
    simpleAnswer: "An attack where a hacker changes the token header to `\"alg\": \"none\"` and removes the signature, hoping the server accepts it without verification. Spring Security strictly enforces algorithm verification and rejects 'none'.",
    architectDeepDive: "Early naive JWT libraries accepted tokens with `\"alg\": \"none\"` without validating signatures, allowing attackers to forge arbitrary claims. In Spring Security (via Nimbus JOSE), decoders require explicit algorithm whitelisting (e.g. `JWSAlgorithm.RS256`). Any token specifying `none` or an algorithm not in the approved validator set is rejected immediately with an `BadJwtException`.",
    tags: ["JWT Vulnerabilities", "Nimbus"]
  },
  {
    id: "iq-73",
    category: "JWT & Stateless REST",
    level: "Staff Architect (16+ Yrs)",
    question: "What is Key Confusion Attack (RS256 vs HS256) in JWT implementations?",
    simpleAnswer: "An attacker takes a server's public RSA key and uses it as an HMAC secret key to forge tokens! The vulnerable server tries to verify with HMAC using its own public key, and the forged token passes.",
    architectDeepDive: "If a server accepts both HS256 and RS256 without pinning algorithms per endpoint, an attacker takes the known public key of the auth server (readily available in JWKS), crafts a forged token, sets `alg: HS256`, and signs it using the public key as the HMAC symmetric secret. The buggy server uses its public key in `verify()` with HMAC and accepts the forged token. Spring Security Resource Server prevents this by binding decoders strictly to asymmetric JWK sets.",
    tags: ["JWT Vulnerabilities", "Cryptography"]
  },
  {
    id: "iq-74",
    category: "JWT & Stateless REST",
    level: "Junior / Mid",
    question: "How do you extract a Bearer token from an incoming HTTP request in a Spring filter?",
    simpleAnswer: "Read the `Authorization` header, check if it starts with `Bearer `, and strip off the first 7 characters.",
    architectDeepDive: "```java\nString header = request.getHeader(HttpHeaders.AUTHORIZATION);\nif (StringUtils.hasText(header) && header.startsWith(\"Bearer \")) {\n    String token = header.substring(7);\n    // parse and validate token\n}\n```\nIn standard Spring Security Resource Server, this is handled automatically by `BearerTokenResolver` (default `DefaultBearerTokenResolver`).",
    tags: ["JWT", "Filters"]
  },
  {
    id: "iq-75",
    category: "JWT & Stateless REST",
    level: "Senior",
    question: "What is JwtAuthenticationConverter and why is it used?",
    simpleAnswer: "It converts an incoming decoded JWT into a Spring Security `JwtAuthenticationToken`, extracting custom claims (like `roles` or `realm_access.roles`) into `GrantedAuthority` objects.",
    architectDeepDive: "By default, Spring Security Resource Server looks for a claim named `scope` or `scp` and prefixes entries with `SCOPE_`. If an IdP (such as Keycloak or Auth0) nests user roles in `realm_access.roles` or `authorities`, Spring will not detect them. A custom `JwtAuthenticationConverter` extracts nested JSON claims and maps them to `ROLE_*` authorities for `@PreAuthorize` evaluation.",
    tags: ["Resource Server", "JwtAuthenticationConverter"]
  },
  {
    id: "iq-76",
    category: "JWT & Stateless REST",
    level: "Staff Architect (16+ Yrs)",
    question: "What is JWKS (JSON Web Key Set) and how does Spring Security handle automated key rotation?",
    simpleAnswer: "JWKS is a public URL hosted by your Identity Provider (like Keycloak or Okta) that publishes the active public keys. When keys rotate, Spring Security downloads the new public key automatically without server restarts.",
    architectDeepDive: "The JWKS endpoint (`/.well-known/jwks.json`) exposes public keys with key IDs (`kid`). When Spring Security's `NimbusJwtDecoder` parses a token, it inspects the `kid` in the header. If the key is not in its local cache, it queries the JWKS URL to fetch the new public key. This enables automated, zero-downtime cryptographic key rotation across thousands of distributed microservices.",
    tags: ["JWKS", "Key Rotation", "OAuth2"]
  },
  {
    id: "iq-77",
    category: "JWT & Stateless REST",
    level: "Senior",
    question: "What is Clock Skew in JWT validation and why is it important?",
    simpleAnswer: "Clock skew is the slight time difference between servers. Spring Security allows a small grace period (usually 60 seconds) so valid tokens aren't rejected because one server's clock is 2 seconds fast.",
    architectDeepDive: "Distributed servers cannot maintain 100% microsecond clock synchronization. If an Auth Server issues a token with `iat` at 12:00:02, and a Resource Server's clock is at 12:00:00, the token appears to originate in the future, throwing a `BadJwtException`. Spring Security's `OAuth2TokenValidator` includes a configurable clock skew tolerance (default 60 seconds) to prevent false rejections.",
    tags: ["Clock Skew", "JWT"]
  },
  {
    id: "iq-78",
    category: "JWT & Stateless REST",
    level: "Staff Architect (16+ Yrs)",
    question: "What is Token Exchange (RFC 8693) in microservice architectures?",
    simpleAnswer: "It allows Microservice A to take a user's token and trade it at the Auth Server for a down-scoped token specifically for Microservice B, preventing Microservice B from having full access to everything the user can do.",
    architectDeepDive: "Passing an unrestricted user access token through multiple microservice hops violates the Principle of Least Privilege. If Service A passes the user's token to Service B, Service B could abuse that token to call unrelated APIs. RFC 8693 Token Exchange allows Service A to exchange the user's original token for a downscoped, audience-restricted token (`aud: service-b`, scopes: `service-b:read`) specifically for that downstream call.",
    tags: ["Token Exchange", "RFC 8693", "Zero-Trust"]
  },

  // ========================================================
  // CATEGORY 6: OAUTH2, OIDC & IDENTITY (Q79 - Q88)
  // ========================================================
  {
    id: "iq-79",
    category: "OAuth2 & OIDC",
    level: "Junior / Mid",
    question: "What is the difference between OAuth2 and OpenID Connect (OIDC)?",
    simpleAnswer: "OAuth2 is for AUTHORIZATION (granting permission to access resources, returns an Access Token). OpenID Connect is a layer on top of OAuth2 for AUTHENTICATION (verifying user identity, returns an ID Token).",
    architectDeepDive: "OAuth 2.0 is an authorization framework designed to issue access tokens for API delegation. It does not standardize user identity. OpenID Connect (OIDC) 1.0 is an identity layer built on OAuth 2.0. It introduces the `id_token` (signed JWT containing identity claims like `email`, `sub`, `name`) and the `/userinfo` endpoint, enabling federated Single Sign-On (SSO).",
    tags: ["OAuth2", "OIDC"]
  },
  {
    id: "iq-80",
    category: "OAuth2 & OIDC",
    level: "Senior",
    question: "Why was the Implicit Grant flow deprecated in OAuth 2.1?",
    simpleAnswer: "Because it returned access tokens directly in the browser URL hash fragment, which leaked tokens in browser history, server logs, and referrer headers.",
    architectDeepDive: "The Implicit Grant returned tokens directly in the URI fragment (`#access_token=...`). This exposed tokens to browser history leakage, access logs, and malicious browser extensions. OAuth 2.1 formally deprecates and eliminates the Implicit Grant in favor of the Authorization Code Flow with PKCE.",
    tags: ["OAuth 2.1", "Vulnerabilities"]
  },
  {
    id: "iq-81",
    category: "OAuth2 & OIDC",
    level: "Staff Architect (16+ Yrs)",
    question: "How does PKCE (Proof Key for Code Exchange) prevent authorization code interception?",
    simpleAnswer: "The client generates a secret password (`code_verifier`), hashes it (`code_challenge`), and sends the hash with the initial login. When exchanging the authorization code, it sends the original secret password. An attacker who steals only the code cannot exchange it without the secret!",
    architectDeepDive: "1. Client generates a cryptographically random `code_verifier` and derives `code_challenge = BASE64URL(SHA256(code_verifier))`.\n2. Client initiates `/authorize` with `code_challenge` and `code_challenge_method=S256`.\n3. Auth Server issues the `code`.\n4. If an attacker intercepts the `code` via a custom URI scheme or redirect hijacking, they cannot exchange it because step 5 requires the original `code_verifier`.\n5. Legitimate client posts `code` + `code_verifier` to `/token`. The server hashes the verifier and validates it against the stored challenge before issuing tokens.",
    tags: ["PKCE", "RFC 7636", "OAuth2"]
  },
  {
    id: "iq-82",
    category: "OAuth2 & OIDC",
    level: "Junior / Mid",
    question: "When should you use the Client Credentials Grant flow?",
    simpleAnswer: "For automated, machine-to-machine (M2M) communication where there is NO human user involved (e.g. nightly cron jobs, billing microservices, daemon scripts).",
    architectDeepDive: "The Client Credentials grant (`grant_type=client_credentials`) is used exclusively for service-to-service integration. The client authenticates with its own `client_id` and `client_secret`. The issued token represents the service workload itself, NOT an end-user. Refresh tokens are forbidden by RFC 6749 for this grant because clients can authenticate directly whenever needed.",
    tags: ["Client Credentials", "M2M"]
  },
  {
    id: "iq-83",
    category: "OAuth2 & OIDC",
    level: "Senior",
    question: "What is an Opaque Token and how does Token Introspection (RFC 7662) work?",
    simpleAnswer: "An opaque token is a random string with no data inside (like a lottery ticket number). The resource server must send it back to the Authorization Server's `/introspect` endpoint to find out who it belongs to.",
    architectDeepDive: "Unlike JWTs, opaque reference tokens contain zero claims. When an API receives an opaque Bearer token, it invokes the IdP's `/oauth/introspect` endpoint with its own client credentials. The IdP returns `{ \"active\": true, \"sub\": \"alice\", \"scope\": \"read\" }`. Benefit: Instant revocation. Drawback: Introduces a network HTTP hop on every single API request unless cached locally using Caffeine / Redis.",
    tags: ["Opaque Tokens", "Introspection", "RFC 7662"]
  },
  {
    id: "iq-84",
    category: "OAuth2 & OIDC",
    level: "Staff Architect (16+ Yrs)",
    question: "How do you architect a Multi-Tenant OAuth2 Resource Server that validates tokens from different IdPs (Okta, Azure AD, Keycloak) dynamically?",
    simpleAnswer: "By configuring a `JwtIssuerAuthenticationManagerResolver`. It inspects the `iss` claim in the unverified token, looks up the corresponding tenant in a whitelist, and routes the token to that tenant's specific JWKS provider on the fly.",
    architectDeepDive: "In B2B enterprise SaaS, Tenant A authenticates via Okta, while Tenant B uses Azure AD. Spring Security provides `AuthenticationManagerResolver<HttpServletRequest>`. You instantiate `JwtIssuerAuthenticationManagerResolver(trustedIssuersList)`. The resolver reads the untrusted JWT header/payload to extract the `iss` (issuer) claim, matches it against an allowlist, dynamically instantiates or caches a tenant-specific `JwtAuthenticationProvider`, and downloads that tenant's JWKS keys.",
    tags: ["Multi-Tenancy", "OAuth2", "Architecture"]
  },
  {
    id: "iq-85",
    category: "OAuth2 & OIDC",
    level: "Junior / Mid",
    question: "What is the difference between an ID Token and an Access Token?",
    simpleAnswer: "The ID Token is for the CLIENT application to know who logged in (name, profile, email). The Access Token is for the RESOURCE SERVER (API) to grant access to backend data.",
    architectDeepDive: "`id_token` is an OIDC artifact intended solely for the client application (`aud` = client_id). It contains identity assertions and should never be used as a Bearer token to authorize backend API calls. `access_token` is an OAuth2 artifact intended for the resource server (`aud` = api_identifier). It authorizes resource requests.",
    tags: ["Tokens", "OIDC"]
  },
  {
    id: "iq-86",
    category: "OAuth2 & OIDC",
    level: "Senior",
    question: "What is the Spring Authorization Server project?",
    simpleAnswer: "It is the official Spring framework project that lets you build your own full OAuth2 / OpenID Connect Identity Provider server in Java, replacing the deprecated Spring Security OAuth project.",
    architectDeepDive: "`spring-security-oauth2-authorization-server` is Spring's official implementation of the OAuth 2.1 and OpenID Connect 1.0 specifications. It provides pre-built endpoints (`/oauth2/authorize`, `/oauth2/token`, `/.well-known/openid-configuration`, `/oauth2/jwks`), manages `RegisteredClientRepository`, and supports modern grant types including Authorization Code with PKCE and Client Credentials.",
    tags: ["Spring Authorization Server"]
  },
  {
    id: "iq-87",
    category: "OAuth2 & OIDC",
    level: "Staff Architect (16+ Yrs)",
    question: "What is SAML 2.0 and when is it preferred over OAuth2/OIDC in enterprise environments?",
    simpleAnswer: "SAML 2.0 is an XML-based enterprise SSO standard used heavily by legacy enterprise identity providers like Active Directory Federation Services (ADFS). It is used when integrating with large corporations that have not yet upgraded to OIDC.",
    architectDeepDive: "Security Assertion Markup Language (SAML 2.0) is an XML-based federated identity protocol heavily entrenched in Fortune 500 corporations and government systems. While OIDC (JSON/REST) is preferred for modern apps, SAML 2.0 is mandatory when integrating with legacy enterprise IdPs (PingFederate, ADFS, Shibboleth). Spring Security provides `saml2Login()` and `saml2Metadata()` with XML signature validation and certificate encryption.",
    tags: ["SAML 2.0", "Enterprise SSO"]
  },
  {
    id: "iq-88",
    category: "OAuth2 & OIDC",
    level: "Senior",
    question: "What is the Redirect URI vulnerability in OAuth2 and how do you protect against it?",
    simpleAnswer: "If an authorization server allows wildcard redirect URLs (`https://app.com/*`), an attacker can redirect the authorization code to an open redirect on the site and steal the user's login code. Always enforce strict exact URL matching.",
    architectDeepDive: "Open redirect flaws in redirect URI validation allow attackers to craft authorization requests where `redirect_uri` points to an attacker-controlled endpoint. OAuth 2.1 mandates exact string matching on redirect URIs. Wildcards (`*`), path traversals, or open query parameters are strictly forbidden.",
    tags: ["OAuth2 Vulnerabilities", "RedirectURI"]
  },

  // ========================================================
  // CATEGORY 7: MICROSERVICES & ZERO-TRUST (Q89 - Q100)
  // ========================================================
  {
    id: "iq-89",
    category: "Microservices & Zero-Trust",
    level: "Staff Architect (16+ Yrs)",
    question: "What is the Backend-For-Frontend (BFF) Pattern and why is it recommended for SPAs?",
    simpleAnswer: "Instead of the browser talking directly to microservices and holding raw JWTs, the browser only talks to an API Gateway using secure HttpOnly cookies. The Gateway holds the tokens in server memory and forwards Bearer tokens to backend microservices.",
    architectDeepDive: "The BFF pattern completely isolates browser JavaScript from raw cryptographic tokens. Modern web compliance mandates zero access tokens stored in browser client-side storage to neutralize XSS. Spring Cloud Gateway acts as the BFF: it coordinates the OAuth2 login, stores tokens in a server-side session (Redis), sets an encrypted `SameSite=Strict; HttpOnly` cookie on the browser, and uses a `TokenRelay` filter to inject `Authorization: Bearer <token>` when routing downstream.",
    tags: ["BFF", "Architecture", "Microservices"]
  },
  {
    id: "iq-90",
    category: "Microservices & Zero-Trust",
    level: "Senior",
    question: "What is Spring Cloud Gateway Token Relay?",
    simpleAnswer: "A gateway filter that takes the authenticated user's OAuth2 access token and automatically attaches it as an `Authorization: Bearer <token>` header on requests sent downstream to microservices.",
    architectDeepDive: "`TokenRelayGatewayFilterFactory` extracts the `OAuth2AuthorizedClient` associated with the current user from the reactive security context, extracts its access token string, and mutates the downstream `ServerHttpRequest` to include the `Authorization: Bearer <token>` header.",
    tags: ["Spring Cloud Gateway", "Token Relay"]
  },
  {
    id: "iq-91",
    category: "Microservices & Zero-Trust",
    level: "Staff Architect (16+ Yrs)",
    question: "Compare Gateway Edge Authentication with Header Injection vs End-to-End Token Relay.",
    simpleAnswer: "Header Injection (Gateway validates JWT and forwards `X-User-Id: 123` in plain text) is risky because any rogue service can spoof headers. End-to-End Token Relay passes the cryptographic JWT everywhere, so every service verifies signatures independently.",
    architectDeepDive: "1. **Edge Decryption & Header Injection**: Gateway validates token, strips it, and passes plain headers (`X-User-Id`, `X-Roles`). Vulnerable: If an attacker breaches the internal network or a single microservice, they can spoof headers with zero cryptographic verification.\n2. **End-to-End JWT Token Relay (Zero-Trust)**: Gateway forwards the intact Bearer JWT. Every internal microservice validates signatures locally against JWKS. Cryptographically verifiable, immune to internal header spoofing.",
    tags: ["Zero-Trust", "API Gateway", "Architecture"]
  },
  {
    id: "iq-92",
    category: "Microservices & Zero-Trust",
    level: "Staff Architect (16+ Yrs)",
    question: "What is Mutual TLS (mTLS) and how do you implement it in Spring Boot microservices?",
    simpleAnswer: "mTLS is two-way encryption where both the client and server exchange and verify each other's cryptographic x509 certificates during the TLS handshake before any HTTP data is sent.",
    architectDeepDive: "In standard TLS, only the server proves its identity. In mTLS, the server sets `server.ssl.client-auth=need`. During the TLS 1.3 handshake, the client must present an x509 certificate signed by a trusted Certificate Authority in the server's `truststore`. Spring Security's `x509()` filter extracts the certificate, parses the Common Name (`CN`) or Subject Alternative Name (`SAN`), and grants service-level authorities (`ROLE_SERVICE_PAYMENTS`).",
    tags: ["mTLS", "Zero-Trust", "x509"]
  },
  {
    id: "iq-93",
    category: "Microservices & Zero-Trust",
    level: "Staff Architect (16+ Yrs)",
    question: "What is SPIFFE and SPIRE in Cloud-Native Zero-Trust Security?",
    simpleAnswer: "SPIFFE is a universal cryptographic ID format (like an passport for software pods) and SPIRE is the automated software that issues and rotates short-lived certificates for pods every hour.",
    architectDeepDive: "SPIFFE (Secure Production Identity Framework for Everyone) defines a standard URI identity: `spiffe://domain.mesh/ns/prod/sa/payment-service`. SPIRE issues cryptographically verifiable X.509 SVIDs (SPIFFE Verifiable Identity Documents) with very short lifetimes (~1 hour). The SPIRE agent automatically rotates certificates in Kubernetes pods with zero downtime, eliminating hardcoded passwords and API keys across cloud clusters.",
    tags: ["SPIFFE", "SPIRE", "Zero-Trust"]
  },
  {
    id: "iq-94",
    category: "Microservices & Zero-Trust",
    level: "Senior",
    question: "How do you propagate SecurityContext across asynchronous CompletableFuture or thread pool tasks?",
    simpleAnswer: "By wrapping your thread pool with `DelegatingSecurityContextExecutorService`, which automatically copies the SecurityContext from the parent thread to the worker thread when tasks are submitted.",
    architectDeepDive: "Because `SecurityContextHolder` defaults to `MODE_THREADLOCAL`, worker threads in a `ThreadPoolTaskExecutor` start with an empty context. Wrapping the executor with `new DelegatingSecurityContextExecutorService(executor)` captures a snapshot of the current `SecurityContext` at submission time and sets it in the worker thread during execution, cleaning it up in a `finally` block.",
    tags: ["Async", "Threading", "SecurityContext"]
  },
  {
    id: "iq-95",
    category: "Microservices & Zero-Trust",
    level: "Staff Architect (16+ Yrs)",
    question: "Why should you never set SecurityContextHolder.setStrategyName(MODE_INHERITABLETHREADLOCAL) in web application servers?",
    simpleAnswer: "Because web servers use thread pools! Reusing threads across different requests means an unauthenticated request on a recycled thread could inherit the previous user's credentials!",
    architectDeepDive: "`InheritableThreadLocal` copies thread-local values only when a child thread is spawned (`new Thread()`). In modern web containers (Tomcat, Undertow), threads are pre-allocated in worker pools and reused across thousands of requests. Using `MODE_INHERITABLETHREADLOCAL` causes thread pollution: pooled worker threads retain credentials from previous requests, causing catastrophic security leaks where User B executes under User A's identity.",
    tags: ["ThreadLocal", "Gotchas", "Architecture"]
  },
  {
    id: "iq-96",
    category: "Microservices & Zero-Trust",
    level: "Junior / Mid",
    question: "How do you test Spring Security REST endpoints using @WebMvcTest?",
    simpleAnswer: "Use `@WebMvcTest(Controller.class)` and attach mock users and CSRF tokens using `mockMvc.perform(get(\"/api\").with(user(\"admin\").roles(\"ADMIN\")).with(csrf()))`.",
    architectDeepDive: "`@WebMvcTest` slices the MVC layer and initializes the Spring Security filter chain. The `spring-security-test` library provides request post-processors: `SecurityMockMvcRequestPostProcessors.user()`, `.jwt()`, and `.csrf()`. This allows testing 401, 403, and 200 HTTP response codes across different roles without spinning up full databases.",
    tags: ["Testing", "MockMvc"]
  },
  {
    id: "iq-97",
    category: "Microservices & Zero-Trust",
    level: "Senior",
    question: "How do you test OAuth2 Resource Servers without running an external Keycloak or Okta server?",
    simpleAnswer: "Use `@WithMockBearerToken` or `mockMvc.perform(get(\"...\").with(jwt().jwt(j -> j.claim(\"roles\", ...))))`.",
    architectDeepDive: "Use `SecurityMockMvcRequestPostProcessors.jwt()`. It instantiates a mock `Jwt` instance with arbitrary claims, subjects, and scopes directly in the test's `SecurityContext`. For end-to-end integration tests requiring remote JWKS verification, use `WireMock` to mock the `/.well-known/jwks.json` endpoint on localhost.",
    tags: ["Testing", "Resource Server", "WireMock"]
  },
  {
    id: "iq-98",
    category: "Microservices & Zero-Trust",
    level: "Staff Architect (16+ Yrs)",
    question: "What is Defense in Depth in modern cloud-native application security?",
    simpleAnswer: "Never relying on a single security layer. You secure Transport (TLS 1.3), Perimeter (Gateway rate limiting), Application (Filter chains), Method Level (@PreAuthorize), and Data Layer (Row-level multi-tenancy).",
    architectDeepDive: "Defense in Depth assumes that individual security perimeters will eventually be breached:\n1. **Transport Layer**: TLS 1.3 and mTLS service mesh (SPIFFE).\n2. **Edge Perimeter**: WAF (Cloudflare/AWS WAF), DDoS mitigation, and rate limiting (Bucket4j).\n3. **Application Gateway**: Token Relay, BFF cookie conversion, and route authorization.\n4. **Service Filter Chain**: Spring Security filter chain validating JWT cryptographic signatures locally.\n5. **Method Layer**: Declarative `@PreAuthorize` domain rule enforcement.\n6. **Data Layer**: Multi-tenant database schema isolation or Hibernate tenant discriminators with DB audit logging.",
    tags: ["Defense in Depth", "System Design"]
  },
  {
    id: "iq-99",
    category: "Microservices & Zero-Trust",
    level: "Senior",
    question: "How does OpenTelemetry / Distributed Tracing propagate security context across microservices?",
    simpleAnswer: "By injecting W3C Trace Context headers (`traceparent`, `tracestate`) alongside security headers so you can trace a user's exact request path across 20 microservices.",
    architectDeepDive: "When an authenticated request enters the Gateway, Spring Security authenticates the user while OpenTelemetry instruments a unique `traceId` and `spanId`. Feign clients, `RestClient`, or `WebClient` propagate both `Authorization: Bearer <token>` and `traceparent` headers. Distributed logs in Elasticsearch or Datadog correlate security events, failed authorization attempts, and user IDs across all downstream microservices.",
    tags: ["OpenTelemetry", "Distributed Tracing"]
  },
  {
    id: "iq-100",
    category: "Microservices & Zero-Trust",
    level: "Staff Architect (16+ Yrs)",
    question: "What are the top 3 architectural mistakes you have seen senior developers make in Spring Security production environments?",
    simpleAnswer: "1. Storing JWTs in browser localStorage. 2. Misordering filter rules so permitAll() opens up private endpoints. 3. Trusting internal HTTP headers (X-User-Id) across microservices without cryptographic verification.",
    architectDeepDive: "1. **Trusting Client-Side State / localStorage**: Storing raw JWTs in browser storage instead of utilizing the BFF pattern with `HttpOnly; SameSite=Strict` cookies, creating massive XSS exposure.\n2. **Silent Authorization Bypass via Rule Ordering**: Placing loose request matchers ahead of restrictive matchers in `authorizeHttpRequests`, accidentally exposing internal APIs anonymously.\n3. **Perimeter-Only Security (The 'Eggshell' Architecture)**: Stripping JWTs at the gateway and passing unverified plaintext headers (`X-User-Id: 42`) across internal Kubernetes pods. If any single internal service or container is compromised, the attacker can spoof arbitrary identities across the entire enterprise cluster.",
    tags: ["Architectural Review", "Failure Modes", "16+ Yrs Experience"]
  }
];

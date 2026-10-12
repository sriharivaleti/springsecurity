/**
 * SpringSec Master - 50 Production-Grade Spring Security 6 Examples
 * Levels: Level 0 (Foundations) to Level 5 (Enterprise & Zero-Trust)
 */

const EXAMPLES_DATA = [
  // ==========================================
  // LEVEL 0: FOUNDATIONS & SPRING INTERNALS
  // ==========================================
  {
    id: "ex-01",
    level: 0,
    levelName: "Level 0: Foundations",
    category: "Filter Chain",
    difficulty: "Beginner",
    title: "Minimal Spring Boot 3 SecurityFilterChain with Lambda DSL",
    summary: "Understand the modern component-based SecurityFilterChain bean configuration in Spring Boot 3, replacing deprecated WebSecurityConfigurerAdapter.",
    scenario: "You are scaffolding a modern Spring Boot 3 service. You need to secure private endpoints, allow public access to health and documentation, and eliminate legacy configuration practices.",
    architecture: "In Spring Security 6, configuration is purely bean-driven. The `SecurityFilterChain` bean receives `HttpSecurity` and configures filters using functional lambda DSL (`authorizeHttpRequests(auth -> auth...)`). The `DelegatingFilterProxy` delegates incoming servlet requests to `FilterChainProxy`, which evaluates this configured chain.",
    code: `package com.example.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class BasicSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**", "/actuator/health", "/swagger-ui/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults())
            .formLogin(Customizer.withDefaults());

        return http.build();
    }
}`,
    config: `# application.yml
spring:
  security:
    user:
      name: bootuser
      password: "{noop}SuperSecret123!"
      roles: USER
server:
  port: 8080`,
    testing: `package com.example.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BasicSecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void publicEndpoint_ShouldBeAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/public/ping"))
               .andExpect(status().isOk());
    }

    @Test
    void protectedEndpoint_ShouldReturnUnauthorizedWhenAnonymous() throws Exception {
        mockMvc.perform(get("/api/orders"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "alice", roles = {"USER"})
    void protectedEndpoint_ShouldBeOkWhenAuthenticated() throws Exception {
        mockMvc.perform(get("/api/orders"))
               .andExpect(status().isOk());
    }
}`,
    pitfalls: "DO NOT use `authorizeRequests()` or `antMatchers()`. These were completely removed in Spring Security 6. Always use `authorizeHttpRequests()` and `requestMatchers()`."
  },
  {
    id: "ex-02",
    level: 0,
    levelName: "Level 0: Foundations",
    category: "Authentication",
    difficulty: "Beginner",
    title: "In-Memory Multi-User Authentication with BCrypt Password Hashing",
    summary: "Configure multiple testing or internal users using InMemoryUserDetailsManager with strong BCrypt cryptographic password encoding.",
    scenario: "Building a local development environment or microservice test harness where you require multiple mock users with varying roles without a database.",
    architecture: "The `UserDetailsService` is queried by the `DaoAuthenticationProvider`. The provided password is encrypted using the configured `PasswordEncoder` bean (`BCryptPasswordEncoder` with strength 12) and compared against the stored hash.",
    code: `package com.example.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

@Configuration
public class InMemoryAuthConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Work factor 12 is recommended for modern server hardware
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder encoder) {
        UserDetails regularUser = User.builder()
                .username("user")
                .password(encoder.encode("UserPassword@2026"))
                .roles("USER")
                .build();

        UserDetails adminUser = User.builder()
                .username("admin")
                .password(encoder.encode("AdminPassword@2026"))
                .roles("USER", "ADMIN")
                .build();

        return new InMemoryUserDetailsManager(regularUser, adminUser);
    }
}`,
    config: `# application.yml
logging:
  level:
    org.springframework.security: DEBUG`,
    testing: `@Test
@WithMockUser(username = "admin", roles = {"ADMIN"})
void adminCanAccessAdminEndpoint() throws Exception {
    mockMvc.perform(get("/api/admin/metrics"))
           .andExpect(status().isOk());
}

@Test
@WithMockUser(username = "user", roles = {"USER"})
void regularUserForbiddenOnAdminEndpoint() throws Exception {
    mockMvc.perform(get("/api/admin/metrics"))
           .andExpect(status().isForbidden());
}`,
    pitfalls: "Never use `{noop}` in staging or production. Plaintext passwords expose user accounts to immediate compromise during data breaches."
  },
  {
    id: "ex-03",
    level: 0,
    levelName: "Level 0: Foundations",
    category: "Database Auth",
    difficulty: "Beginner",
    title: "Custom Database UserDetailsService with Spring Data JPA & Hibernate",
    summary: "Integrate relational database user authentication with JPA Entity mappings and custom UserDetails implementation.",
    scenario: "Your enterprise SaaS stores credentials, account locks, and credentials expiry in PostgreSQL. You must load user entities and map them to Spring Security.",
    architecture: "`DaoAuthenticationProvider` calls your custom `UserDetailsService.loadUserByUsername()`. The query fetches the user and associated roles eagerly (or within a transactional context) to populate `UserDetails` with `GrantedAuthority` collections.",
    code: `package com.example.security.service;

import com.example.security.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
public class JpaUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public JpaUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        var authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                .collect(Collectors.toSet());

        return User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(authorities)
                .accountExpired(!user.isAccountNonExpired())
                .accountLocked(user.isLocked())
                .credentialsExpired(false)
                .disabled(!user.isEnabled())
                .build();
    }
}`,
    config: `spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/security_db
    username: postgres
    password: \${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false`,
    testing: `@Test
void shouldLoadExistingUserByEmail() {
    UserDetails details = jpaUserDetailsService.loadUserByUsername("john.doe@company.com");
    assertThat(details.getUsername()).isEqualTo("john.doe@company.com");
    assertThat(details.getAuthorities()).extracting("authority").contains("ROLE_USER");
}`,
    pitfalls: "Avoid `LazyInitializationException` by fetching user roles eagerly via `@EntityGraph(attributePaths = {\"roles\"})` or running in a `@Transactional(readOnly = true)` boundary."
  },
  {
    id: "ex-04",
    level: 0,
    levelName: "Level 0: Foundations",
    category: "Authorization",
    difficulty: "Beginner",
    title: "Role-Based Access Control (RBAC): hasRole vs hasAuthority",
    summary: "Master the subtle and critical distinction between Spring Security's hasRole('X') and hasAuthority('ROLE_X') / fine-grained permissions.",
    scenario: "Your application needs both coarse-grained roles (`ROLE_MANAGER`) and fine-grained permissions (`OP_APPROVE_INVOICE`, `OP_READ_REPORTS`).",
    architecture: "`hasRole(\"ADMIN\")` automatically prefixes the input with `ROLE_`, checking for `ROLE_ADMIN` in the `SecurityContext`. In contrast, `hasAuthority(\"OP_READ\")` checks the exact authority string without any prefix modification.",
    code: `package com.example.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class RbacSecurityConfig {

    @Bean
    public SecurityFilterChain rbacFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // Checks for 'ROLE_ADMIN' in GrantedAuthorities:
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                
                // Checks for exact 'OP_INVOICE_CREATE' authority:
                .requestMatchers("/api/invoices/create").hasAuthority("OP_INVOICE_CREATE")
                
                // Allows users with either ROLE_FINANCE or OP_AUDIT:
                .requestMatchers("/api/reports/**").hasAnyRole("FINANCE", "AUDITOR")
                
                .anyRequest().authenticated()
            );

        return http.build();
    }
}`,
    config: `# No special config needed. Standard RBAC.`,
    testing: `@Test
@WithMockUser(username = "bob", authorities = {"OP_INVOICE_CREATE"})
void userWithInvoiceAuthorityCanCreateInvoice() throws Exception {
    mockMvc.perform(post("/api/invoices/create"))
           .andExpect(status().isCreated());
}

@Test
@WithMockUser(username = "bob", roles = {"USER"}) // has only ROLE_USER
void userWithoutAuthorityIsForbidden() throws Exception {
    mockMvc.perform(post("/api/invoices/create"))
           .andExpect(status().isForbidden());
}`,
    pitfalls: "Calling `.hasRole(\"ROLE_ADMIN\")` results in Spring checking for `ROLE_ROLE_ADMIN`, causing mysterious 403 Forbidden errors. Use `.hasRole(\"ADMIN\")` or `.hasAuthority(\"ROLE_ADMIN\")`."
  },
  {
    id: "ex-05",
    level: 0,
    levelName: "Level 0: Foundations",
    category: "Role Hierarchy",
    difficulty: "Intermediate",
    title: "Hierarchical Roles (RoleHierarchy) for Clean Permission Cascading",
    summary: "Eliminate repetitive boilerplate role checks by configuring a RoleHierarchy where higher-tier roles automatically inherit sub-role permissions.",
    scenario: "In an enterprise app, `SUPER_ADMIN` should implicitly possess all powers of `ADMIN`, `MANAGER`, and `USER` without having to attach 15 roles to every token.",
    architecture: "`RoleHierarchyImpl` defines role relationship graph expressions (`ROLE_SUPERADMIN > ROLE_ADMIN > ROLE_USER`). Spring Security's `DefaultMethodSecurityExpressionHandler` and `WebExpressionAuthorizationManager` traverse this hierarchy during authorization decisions.",
    code: `package com.example.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class RoleHierarchyConfig {

    @Bean
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
        // Modern Spring Security 6 RoleHierarchy syntax
        hierarchy.setHierarchy(
            "ROLE_SUPERADMIN > ROLE_ADMIN \n" +
            "ROLE_ADMIN > ROLE_MANAGER \n" +
            "ROLE_MANAGER > ROLE_USER \n" +
            "ROLE_USER > ROLE_GUEST"
        );
        return hierarchy;
    }

    @Bean
    public SecurityFilterChain hierarchyFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // Any MANAGER, ADMIN, or SUPERADMIN can access this endpoint:
                .requestMatchers("/api/manager/**").hasRole("MANAGER")
                .requestMatchers("/api/user/**").hasRole("USER")
                .anyRequest().authenticated()
            );
        return http.build();
    }
}`,
    config: `# application.yml
logging.level.org.springframework.security.access.hierarchicalroles: DEBUG`,
    testing: `@Test
@WithMockUser(username = "boss", roles = {"SUPERADMIN"})
void superAdminCanAccessManagerEndpointDueToHierarchy() throws Exception {
    mockMvc.perform(get("/api/manager/reports"))
           .andExpect(status().isOk());
}`,
    pitfalls: "Ensure the exact prefix `ROLE_` is used consistently within the hierarchy string definition, otherwise hierarchy traversal will silently fail to match incoming `ROLE_` authorities."
  },
  {
    id: "ex-06",
    level: 0,
    levelName: "Level 0: Foundations",
    category: "Method Security",
    difficulty: "Intermediate",
    title: "Method Security Deep Dive: @PreAuthorize, @PostAuthorize & SpEL",
    summary: "Enforce access control at the service layer using declarative annotations and Spring Expression Language (SpEL).",
    scenario: "Securing internal service methods called from background tasks, message consumers, or scheduled jobs where web filter chain security does not apply.",
    architecture: "`@EnableMethodSecurity` uses Spring AOP proxies around annotated beans. The `AuthorizationManagerBeforeMethodInterceptor` intercepts calls before invocation (`@PreAuthorize`) and `AuthorizationManagerAfterMethodInterceptor` intercepts returned values (`@PostAuthorize`).",
    code: `package com.example.security.service;

import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.stereotype.Service;

@Service
@EnableMethodSecurity(prePostEnabled = true)
public class DocumentService {

    @PreAuthorize("hasRole('ADMIN') or hasAuthority('DOC_CREATE')")
    public void createDocument(String title) {
        // Business logic
    }

    // Only allow caller to read if document is public OR caller is the author
    @PostAuthorize("returnObject.isPublic() or returnObject.getAuthor() == authentication.name")
    public Document getDocumentById(Long id) {
        return findDocumentFromDb(id);
    }

    private Document findDocumentFromDb(Long id) {
        return new Document(id, "Annual Report", "alice", false);
    }
}`,
    config: `# No config required. Pure Java AOP annotation.`,
    testing: `@Test
@WithMockUser(username = "bob")
void bobCannotAccessAlicesPrivateDocument() {
    assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> {
        documentService.getDocumentById(101L);
    });
}

@Test
@WithMockUser(username = "alice")
void aliceCanAccessHerOwnDocument() {
    Document doc = documentService.getDocumentById(101L);
    assertNotNull(doc);
}`,
    pitfalls: "Method security does NOT apply to internal `this.method()` calls on the same bean because they bypass the Spring CGLIB AOP proxy."
  },
  {
    id: "ex-07",
    level: 0,
    levelName: "Level 0: Foundations",
    category: "Method Security",
    difficulty: "Intermediate",
    title: "Dynamic Domain Ownership Check with SpEL (#id == principal.id)",
    summary: "Prevent Insecure Direct Object References (IDOR) by dynamically validating database entity ownership against the authenticated security principal.",
    scenario: "Users can edit their own profile or update their own shopping cart, but should receive a 403 Forbidden if attempting to tamper with another user's ID.",
    architecture: "SpEL expressions evaluate parameters passed into the method (e.g., `#userId`) against properties of the current `Authentication` principal (`principal.id`).",
    code: `package com.example.security.controller;

import com.example.security.model.UserProfile;
import com.example.security.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserService userService;

    public UserProfileController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public UserProfile updateProfile(
            @PathVariable("userId") Long userId,
            @RequestBody UserProfile updated) {
        return userService.update(userId, updated);
    }
}`,
    config: `# application.yml
# Enable parameter name retention in compiler (Spring Boot 3 requirement for #arg binding)`,
    testing: `@Test
@WithMockUser(username = "user123", roles = {"USER"}) // Mock principal id is 123
void userCannotUpdateOtherUserProfile() throws Exception {
    mockMvc.perform(put("/api/users/999")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"bio\":\"Hacker\"}"))
           .andExpect(status().isForbidden());
}`,
    pitfalls: "In Spring Boot 3 / Java 17+, you must compile with `-parameters` javac flag, or specify `@P(\"userId\")` on the method parameter so SpEL can resolve argument names."
  },
  {
    id: "ex-08",
    level: 0,
    levelName: "Level 0: Foundations",
    category: "Exception Handling",
    difficulty: "Intermediate",
    title: "Custom Access Denied Handler & Authentication Entry Point for JSON APIs",
    summary: "Replace default HTML redirect errors or empty 403 responses with RFC 7807 compliant JSON problem details.",
    scenario: "Your mobile app and React frontend require structured JSON errors with error codes, timestamps, and messages whenever an API request fails authentication or authorization.",
    architecture: "`AuthenticationEntryPoint` catches `AuthenticationException` (unauthenticated 401). `AccessDeniedHandler` catches `AccessDeniedException` (unauthorized 403). Both write directly to the `HttpServletResponse` output stream with Jackson.",
    code: `package com.example.security.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

@Component
public class JsonSecurityExceptionHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest req, HttpServletResponse res, AuthenticationException authEx) 
            throws IOException {
        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        
        var body = Map.of(
            "timestamp", Instant.now().toString(),
            "status", 401,
            "error", "Unauthorized",
            "message", authEx.getMessage(),
            "path", req.getRequestURI()
        );
        mapper.writeValue(res.getOutputStream(), body);
    }

    @Override
    public void handle(HttpServletRequest req, HttpServletResponse res, AccessDeniedException accessEx) 
            throws IOException {
        res.setStatus(HttpServletResponse.SC_FORBIDDEN);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        
        var body = Map.of(
            "timestamp", Instant.now().toString(),
            "status", 403,
            "error", "Forbidden",
            "message", "You lack permissions to access this resource",
            "path", req.getRequestURI()
        );
        mapper.writeValue(res.getOutputStream(), body);
    }
}`,
    config: `# Config wiring in SecurityFilterChain:
# http.exceptionHandling(ex -> ex
#     .authenticationEntryPoint(jsonHandler)
#     .accessDeniedHandler(jsonHandler)
# )`,
    testing: `@Test
void unauthenticatedRequest_ReturnsJson401() throws Exception {
    mockMvc.perform(get("/api/secure-data"))
           .andExpect(status().isUnauthorized())
           .andExpect(jsonPath("$.error").value("Unauthorized"))
           .andExpect(jsonPath("$.status").value(401));
}`,
    pitfalls: "Never swallow or log stack traces to clients in `commence` or `handle` as this leaks server internals to attackers."
  },

  // ==========================================
  // LEVEL 1: CORE AUTHENTICATION & SESSIONS
  // ==========================================
  {
    id: "ex-09",
    level: 1,
    levelName: "Level 1: Core Auth",
    category: "Form Login",
    difficulty: "Beginner",
    title: "Form Login with Custom Login Page, Failure Handler & Session Redirection",
    summary: "Implement a secure server-rendered or branded login workflow with custom URLs, failure error messages, and post-login redirection.",
    scenario: "An enterprise internal admin console requires a branded login screen with CSRF protection, lockout messages, and redirect back to original target URL.",
    architecture: "`UsernamePasswordAuthenticationFilter` processes POST requests to `/login`. If credentials match, `SavedRequestAwareAuthenticationSuccessHandler` forwards the user to their requested destination; otherwise `SimpleUrlAuthenticationFailureHandler` redirects with an error query param.",
    code: `package com.example.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

@Configuration
public class FormLoginSecurityConfig {

    @Bean
    public SecurityFilterChain formLoginFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/login", "/css/**", "/images/**").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/perform-login")
                .defaultSuccessUrl("/dashboard", true)
                .failureUrl("/login?error=true")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/perform-logout")
                .logoutSuccessUrl("/login?logout=true")
                .deleteCookies("JSESSIONID")
                .invalidateHttpSession(true)
                .permitAll()
            );

        return http.build();
    }
}`,
    config: `# application.yml
server:
  servlet:
    session:
      timeout: 30m
      cookie:
        http-only: true
        secure: true
        same-site: lax`,
    testing: `@Test
void validCredentials_RedirectsToDashboard() throws Exception {
    mockMvc.perform(formLogin("/perform-login").user("user").password("secret"))
           .andExpect(status().is3xxRedirection())
           .andExpect(redirectedUrl("/dashboard"));
}`,
    pitfalls: "Failing to permit all to `/login` creates an infinite HTTP 302 redirection loop in the browser."
  },
  {
    id: "ex-10",
    level: 1,
    levelName: "Level 1: Core Auth",
    category: "Remember-Me",
    difficulty: "Intermediate",
    title: "Remember-Me Authentication with Persistent Database Token Repository",
    summary: "Secure persistent authentication across browser restarts using hashed database tokens conforming to RFC best practices.",
    scenario: "Users want to stay logged into their web portal across sessions without entering credentials repeatedly, but simple cookie hashing is vulnerable to theft.",
    architecture: "`PersistentTokenBasedRememberMeServices` stores series and token pairs in database table `persistent_logins`. If an attacker steals a cookie and uses it, the series detects the anomaly and invalidates all tokens for that user.",
    code: `package com.example.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.rememberme.JdbcTokenRepositoryImpl;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;

import javax.sql.DataSource;

@Configuration
public class RememberMeSecurityConfig {

    @Bean
    public PersistentTokenRepository persistentTokenRepository(DataSource dataSource) {
        JdbcTokenRepositoryImpl repo = new JdbcTokenRepositoryImpl();
        repo.setDataSource(dataSource);
        // repo.setCreateTableOnStartup(false); // In production use Flyway/Liquibase
        return repo;
    }

    @Bean
    public SecurityFilterChain rememberMeFilterChain(
            HttpSecurity http, 
            PersistentTokenRepository tokenRepository,
            UserDetailsService userDetailsService) throws Exception {
        
        http
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .formLogin(f -> f.loginPage("/login").permitAll())
            .rememberMe(rm -> rm
                .tokenRepository(tokenRepository)
                .userDetailsService(userDetailsService)
                .tokenValiditySeconds(86400 * 14) // 14 days
                .key("EnterpriseRememberMeSecretKey_2026")
            );

        return http.build();
    }
}`,
    config: `# Schema for database:
# create table persistent_logins (
#   username varchar(64) not null,
#   series varchar(64) primary key,
#   token varchar(64) not null,
#   last_used timestamp not null
# );`,
    testing: `@Test
void rememberMeCookieSetsValidSession() throws Exception {
    Cookie rememberCookie = new Cookie("remember-me", "encodedSeriesTokenValue");
    mockMvc.perform(get("/dashboard").cookie(rememberCookie))
           .andExpect(status().isOk());
}`,
    pitfalls: "Never use the default cookie-only remember-me (which simply encodes username + expiration + password hash) in high-security applications because password changes or token capture allows replay."
  },
  {
    id: "ex-11",
    level: 1,
    levelName: "Level 1: Core Auth",
    category: "Session Management",
    difficulty: "Intermediate",
    title: "Concurrent Session Control: Limiting Logins to 1 Active Session per User",
    summary: "Prevent account sharing and credential abuse by limiting simultaneous active sessions to a configured threshold.",
    scenario: "A streaming media or paid financial data platform requires that only one active device can stream data per subscriber account at any given moment.",
    architecture: "`ConcurrentSessionControlAuthenticationStrategy` coordinates with `SessionRegistry` to count active sessions for the principal upon login. It can either expire the previous session or reject the new login attempt.",
    code: `package com.example.security.config;

import org.springframework.boot.web.servlet.ServletListenerRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.session.HttpSessionEventPublisher;

@Configuration
public class ConcurrentSessionConfig {

    @Bean
    public SessionRegistry sessionRegistry() {
        return new SessionRegistryImpl();
    }

    // Critical: Publishes session creation/destruction events to SessionRegistry
    @Bean
    public ServletListenerRegistrationBean<HttpSessionEventPublisher> httpSessionEventPublisher() {
        return new ServletListenerRegistrationBean<>(new HttpSessionEventPublisher());
    }

    @Bean
    public SecurityFilterChain concurrentFilterChain(HttpSecurity http, SessionRegistry registry) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .formLogin(f -> f.defaultSuccessUrl("/home", true))
            .sessionManagement(session -> session
                .maximumSessions(1) // Max 1 active session per user
                .maxSessionsPreventsLogin(false) // false = kick out old session; true = block new login
                .sessionRegistry(registry)
                .expiredUrl("/login?expired=true")
            );

        return http.build();
    }
}`,
    config: `# application.yml
server:
  servlet:
    session:
      timeout: 15m`,
    testing: `@Test
void secondLoginKicksOutFirstSession() throws Exception {
    // Session 1 logs in
    MvcResult res1 = mockMvc.perform(formLogin().user("alice").password("secret")).andReturn();
    HttpSession session1 = res1.getRequest().getSession();

    // Session 2 logs in with same user
    MvcResult res2 = mockMvc.perform(formLogin().user("alice").password("secret")).andReturn();

    // Session 1 is now marked expired
    mockMvc.perform(get("/home").session((MockHttpSession) session1))
           .andExpect(status().is3xxRedirection())
           .andExpect(redirectedUrl("/login?expired=true"));
}`,
    pitfalls: "Forgetting the `HttpSessionEventPublisher` bean will prevent Spring Security from knowing when sessions expire or close, leading to memory leaks and false session limit lockouts."
  },
  {
    id: "ex-12",
    level: 1,
    levelName: "Level 1: Core Auth",
    category: "Session Security",
    difficulty: "Beginner",
    title: "Session Fixation Protection & Custom Session Invalidation on Logout",
    summary: "Mitigate session fixation attacks and ensure complete server-side session purging upon user logout.",
    scenario: "An attacker supplies a known session ID to an unsuspecting victim; if the session ID is preserved after login, the attacker hijacks the authenticated session.",
    architecture: "`SessionFixationProtectionStrategy` (default `.changeSessionId()`) instructs the servlet container to issue a brand new `JSESSIONID` cookie while migrating session attributes immediately upon successful authentication.",
    code: `package com.example.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SessionFixationSecurityConfig {

    @Bean
    public SecurityFilterChain sessionFixationChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .formLogin(f -> f.permitAll())
            .sessionManagement(session -> session
                // Change JSESSIONID without losing user session attributes
                .sessionFixation(fixation -> fixation.changeSessionId())
            )
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
                .logoutSuccessHandler((req, res, auth) -> {
                    res.setStatus(200);
                    res.getWriter().write("{\\"status\\":\\"LOGGED_OUT\\"}");
                })
            );

        return http.build();
    }
}`,
    config: `# application.yml
server.servlet.session.tracking-modes: COOKIE`,
    testing: `@Test
void loginChangesSessionId() throws Exception {
    MockHttpSession initialSession = new MockHttpSession();
    String initialId = initialSession.getId();

    MvcResult result = mockMvc.perform(formLogin().user("user").password("secret").session(initialSession))
            .andReturn();
    
    // Spring Security changes session ID on login
    assertThat(result.getRequest().getSession().getId()).isNotEqualTo(initialId);
}`,
    pitfalls: "Do not set `.sessionFixation().none()` unless you have custom upstream infrastructure that handles session regeneration."
  },
  {
    id: "ex-13",
    level: 1,
    levelName: "Level 1: Core Auth",
    category: "Distributed Session",
    difficulty: "Intermediate",
    title: "Distributed Clustered Sessions with Spring Session and Redis",
    summary: "Share session state seamlessly across 50+ scaled Spring Boot microservices using Redis without sticky load balancers.",
    scenario: "Your monolithic application is scaled to 10 instances behind an AWS ALB. Without sticky sessions, users get randomly logged out as requests hit different pods.",
    architecture: "`@EnableRedisIndexedHttpSession` replaces Tomcat's internal `StandardSession` with Spring Session's `RedisIndexedSession`. Session read/write and expiry events are backed by Redis key-value pairs with TTL.",
    code: `package com.example.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisIndexedHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
@EnableRedisIndexedHttpSession(maxInactiveIntervalInSeconds = 1800) // 30 mins
public class DistributedRedisSessionConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory("redis-cluster.internal", 6379);
    }

    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("SESSIONID");
        serializer.setCookiePath("/");
        serializer.setDomainNamePattern("^.+?\\\\.(\\\\w+\\\\.[a-z]+)$"); // Cross-subdomain
        serializer.setUseHttpOnlyCookie(true);
        serializer.setUseSecureCookie(true);
        serializer.setSameSite("Strict");
        return serializer;
    }
}`,
    config: `# application.yml
spring:
  session:
    store-type: redis
    redis:
      namespace: prod:app:sessions
  data:
    redis:
      host: \${REDIS_HOST:localhost}
      port: \${REDIS_PORT:6379}`,
    testing: `@Test
void sessionSavedInRedis() {
    // Assert session exists in Redis key space: prod:app:sessions:sessions:*
}`,
    pitfalls: "Objects saved in the session (e.g., custom user details) must implement `java.io.Serializable`, otherwise serialization errors will crash session writes."
  },
  {
    id: "ex-14",
    level: 1,
    levelName: "Level 1: Core Auth",
    category: "CORS",
    difficulty: "Intermediate",
    title: "CORS Configuration Done Right in Spring Boot 3 & Preflight Handling",
    summary: "Configure Cross-Origin Resource Sharing (CORS) correctly within the SecurityFilterChain to prevent blocked browser preflights.",
    scenario: "Your React/Next.js frontend runs on `https://app.mycompany.com` and communicates with the Spring Boot backend on `https://api.mycompany.com`.",
    architecture: "`CorsFilter` MUST execute before `AuthorizationFilter` in the filter chain so that HTTP `OPTIONS` preflight requests can be approved without requiring authorization credentials.",
    code: `package com.example.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsSecurityConfig {

    @Bean
    public SecurityFilterChain corsFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. Enable CORS using the bean declared below:
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // Allowed client origins (NEVER use "*" when allowCredentials is true!)
        config.setAllowedOrigins(List.of(
            "https://app.mycompany.com",
            "https://admin.mycompany.com"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "X-XSRF-TOKEN"));
        config.setExposedHeaders(List.of("X-Total-Count", "Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // Cache preflight response for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}`,
    config: `# No additional config needed.`,
    testing: `@Test
void preflightOptionsRequest_ReturnsAllowedHeaders() throws Exception {
    mockMvc.perform(options("/api/orders")
            .header("Origin", "https://app.mycompany.com")
            .header("Access-Control-Request-Method", "POST"))
           .andExpect(status().isOk())
           .andExpect(header().string("Access-Control-Allow-Origin", "https://app.mycompany.com"));
}`,
    pitfalls: "Configuring `@CrossOrigin` on Spring MVC controllers is insufficient if Spring Security rejects requests beforehand. Always configure CORS in `HttpSecurity.cors()`!"
  },
  {
    id: "ex-15",
    level: 1,
    levelName: "Level 1: Core Auth",
    category: "CSRF",
    difficulty: "Intermediate",
    title: "CSRF Protection with CookieCsrfTokenRepository for Single Page Apps (SPA)",
    summary: "Implement Cross-Site Request Forgery defense for modern Angular/React SPAs using double-submit cookie patterns.",
    scenario: "You are building a session-authenticated Single Page Application. Browsers automatically attach cookies to cross-origin requests, leaving users vulnerable to CSRF without token verification.",
    architecture: "`CookieCsrfTokenRepository.withHttpOnlyFalse()` writes the `XSRF-TOKEN` cookie readable by JavaScript. The SPA framework reads this cookie and echoes it in the `X-XSRF-TOKEN` header on POST/PUT requests.",
    code: `package com.example.security.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.*;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Configuration
public class SpaCsrfSecurityConfig {

    @Bean
    public SecurityFilterChain spaSecurityChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
            )
            .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated());

        return http.build();
    }

    // Resolves deferred CSRF token in Spring Security 6
    static class CsrfCookieFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                throws ServletException, IOException {
            CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (csrfToken != null) {
                // Accessing the token forces deferred token generation to execute
                csrfToken.getToken();
            }
            filterChain.doFilter(request, response);
        }
    }

    static class SpaCsrfTokenRequestHandler extends CsrfTokenRequestAttributeHandler {
        private final CsrfTokenRequestHandler delegate = new XorCsrfTokenRequestAttributeHandler();
        @Override
        public void handle(HttpServletRequest request, HttpServletResponse response, java.util.function.Supplier<CsrfToken> csrfToken) {
            this.delegate.handle(request, response, csrfToken);
        }
    }
}`,
    config: `# application.yml
# In pure stateless JWT APIs with no cookies, csrf.disable() is acceptable.
# For cookie-based SPAs, CSRF is MANDATORY!`,
    testing: `@Test
void postWithoutCsrfToken_IsForbidden() throws Exception {
    mockMvc.perform(post("/api/transfer-funds"))
           .andExpect(status().isForbidden());
}

@Test
void postWithValidCsrfToken_IsAccepted() throws Exception {
    mockMvc.perform(post("/api/transfer-funds").with(csrf()))
           .andExpect(status().isOk());
}`,
    pitfalls: "In Spring Security 6, CSRF tokens are deferred by default for performance. If you don't invoke `csrfToken.getToken()` in a filter, the browser cookie will not be populated until a mutation occurs!"
  },

  // ==========================================
  // LEVEL 2: MODERN REST APIS & STATELESS JWT
  // ==========================================
  {
    id: "ex-16",
    level: 2,
    levelName: "Level 2: Modern REST",
    category: "JWT",
    difficulty: "Intermediate",
    title: "Complete REST API Stateless JWT Authentication Filter Pipeline",
    summary: "Build an end-to-end production JWT filter verifying Bearer tokens, extracting claims, and establishing SecurityContextHolder without sessions.",
    scenario: "High-scale mobile app backend requiring zero server-side session overhead. Each request carries a cryptographically signed HMAC-SHA256 JWT.",
    architecture: "`OncePerRequestFilter` extracts the `Authorization: Bearer <token>` header, verifies the signature using `Jwts.parser()`, maps claims to `UsernamePasswordAuthenticationToken`, and sets `SecurityContextHolder.getContext().setAuthentication(auth)`.",
    code: `package com.example.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final SecretKey key;

    public JwtAuthenticationFilter(String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                String username = claims.getSubject();
                List<String> roles = claims.get("roles", List.class);

                var authorities = roles.stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

                var authentication = new UsernamePasswordAuthenticationToken(
                        username, null, authorities
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or Expired JWT Token");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}`,
    config: `# application.yml
jwt:
  secret: "9f823a7e5c1d4b6a8e0f2c4d6a8b0c2e4f6a8b0c2e4f6a8b0c2e4f6a8b0c2e4f" # 256 bits minimum
  expiration-ms: 900000 # 15 minutes`,
    testing: `@Test
void validBearerToken_AuthenticatesRequest() throws Exception {
    String token = generateTestJwt("alice", List.of("ROLE_USER"));
    mockMvc.perform(get("/api/profile").header("Authorization", "Bearer " + token))
           .andExpect(status().isOk());
}`,
    pitfalls: "Do not set `SecurityContextHolder` strategy to `MODE_GLOBAL` in multithreaded servlet containers. The default `MODE_THREADLOCAL` ensures user isolation between concurrent worker threads."
  },
  {
    id: "ex-17",
    level: 2,
    levelName: "Level 2: Modern REST",
    category: "JWT / Asymmetric",
    difficulty: "Advanced",
    title: "Asymmetric JWT Signing with RSA Keys (Nimbus & RS256)",
    summary: "Sign tokens with a private key at an Identity Provider and allow multiple downstream services to verify tokens using only the public key.",
    scenario: "Enterprise microservice ecosystem where downstream resource servers must never possess the signing key, preventing malicious services from forging tokens.",
    architecture: "RS256 uses RSA public/private key pairs. The Auth service holds the private key (`RSAPrivateKey`) to sign tokens. Distributed services read the public key via JWKS endpoint (`/.well-known/jwks.json`) to verify tokens locally.",
    code: `package com.example.security.jwt;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.stereotype.Service;

import java.security.interfaces.RSAPrivateKey;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Service
public class AsymmetricTokenService {

    private final RSAPrivateKey privateKey;
    private final String keyId = "auth-key-2026-v1";

    public AsymmetricTokenService(RSAPrivateKey privateKey) {
        this.privateKey = privateKey;
    }

    public String generateSignedToken(String userId, List<String> scopes) throws Exception {
        JWSSigner signer = new RSASSASigner(privateKey);
        Instant now = Instant.now();

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(userId)
                .issuer("https://auth.enterprise.com")
                .audience("https://api.enterprise.com")
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(300))) // 5 min expiry
                .claim("scp", scopes)
                .build();

        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(keyId).build(),
                claimsSet
        );

        signedJWT.sign(signer);
        return signedJWT.serialize();
    }
}`,
    config: `# application.yml
security:
  jwt:
    rsa:
      private-key-path: classpath:keys/private_key.pem
      public-key-path: classpath:keys/public_key.pem`,
    testing: `@Test
void tokenSignedWithRsa_CanBeVerifiedWithPublicKey() throws Exception {
    String token = asymmetricService.generateSignedToken("user-42", List.of("read", "write"));
    SignedJWT parsed = SignedJWT.parse(token);
    RSASSAVerifier verifier = new RSASSAVerifier(publicKey);
    assertTrue(parsed.verify(verifier));
}`,
    pitfalls: "Never commit raw RSA private keys into Git repositories. Store them in AWS Secrets Manager, HashiCorp Vault, or Google Cloud Secret Manager."
  },
  {
    id: "ex-18",
    level: 2,
    levelName: "Level 2: Modern REST",
    category: "JWT / Refresh Tokens",
    difficulty: "Advanced",
    title: "JWT Refresh Token Rotation & Anti-Theft Revocation",
    summary: "Implement short-lived access tokens (15m) paired with single-use rotating refresh tokens (7d) with automatic reuse-detection.",
    scenario: "Balancing stateless security with seamless UX. If a stolen refresh token is reused by an attacker, the system automatically detects token reuse and invalidates the entire user token family.",
    architecture: "Each refresh token belongs to a Token Family. When a refresh token is exchanged, a new pair is minted and the old one is marked consumed. If a previously consumed token is presented again, compromise is detected, and all tokens in that family are immediately revoked.",
    code: `package com.example.security.service;

import com.example.security.exception.TokenCompromisedException;
import com.example.security.model.RefreshToken;
import com.example.security.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository tokenRepo;

    public RefreshTokenService(RefreshTokenRepository tokenRepo) {
        this.tokenRepo = tokenRepo;
    }

    @Transactional
    public TokenPair rotateRefreshToken(String rawTokenString) {
        RefreshToken token = tokenRepo.findByToken(rawTokenString)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        // Anti-theft reuse detection:
        if (token.isRevoked() || token.isUsed()) {
            // Revoke all tokens belonging to this family!
            tokenRepo.revokeAllInFamily(token.getFamilyId());
            throw new TokenCompromisedException("Token reuse detected! Account protected.");
        }

        if (token.getExpiryDate().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Refresh token has expired");
        }

        // Mark old token used
        token.setUsed(true);
        tokenRepo.save(token);

        // Mint new rotating refresh token
        RefreshToken newToken = new RefreshToken();
        newToken.setToken(UUID.randomUUID().toString());
        newToken.setFamilyId(token.getFamilyId());
        newToken.setUserId(token.getUserId());
        newToken.setExpiryDate(Instant.now().plusSeconds(86400 * 7));
        tokenRepo.save(newToken);

        String newAccessToken = generateAccessToken(token.getUserId());
        return new TokenPair(newAccessToken, newToken.getToken());
    }

    private String generateAccessToken(String userId) {
        return "eyJhbGciOi..."; // generate standard short-lived JWT
    }
}`,
    config: `# application.yml
security:
  token:
    access-token-validity: 900s
    refresh-token-validity: 604800s`,
    testing: `@Test
void reusedRefreshToken_TriggersFamilyRevocation() {
    // 1st use succeeds
    TokenPair pair = refreshTokenService.rotateRefreshToken("initial-token");
    
    // 2nd use with same token throws CompromisedException
    assertThrows(TokenCompromisedException.class, () -> {
        refreshTokenService.rotateRefreshToken("initial-token");
    });
}`,
    pitfalls: "Storing refresh tokens in browser `localStorage` exposes them to XSS exfiltration. Store refresh tokens in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie."
  },
  {
    id: "ex-19",
    level: 2,
    levelName: "Level 2: Modern REST",
    category: "Token Revocation",
    difficulty: "Advanced",
    title: "Redis Token Blacklist for Instant Stateless JWT Revocation & Force Logout",
    summary: "Combine stateless JWT verification with an ultra-fast Redis memory blacklist to enable instant logout and security incident response.",
    scenario: "A user changes their password, reports a stolen laptop, or an employee is terminated. Stateless JWTs cannot be revoked without waiting for expiration unless a blacklist is queried.",
    architecture: "Each JWT contains a unique `jti` (JWT ID) claim. Upon logout, the `jti` is written to Redis with a TTL equal to the token's remaining lifetime. The JWT filter performs a sub-millisecond Redis `EXISTS` check.",
    code: `package com.example.security.jwt;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

public class BlacklistCheckingJwtFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redisTemplate;
    private final JwtTokenValidator validator;

    public BlacklistCheckingJwtFilter(StringRedisTemplate redisTemplate, JwtTokenValidator validator) {
        this.redisTemplate = redisTemplate;
        this.validator = validator;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String token = resolveToken(req);
        if (token != null) {
            Claims claims = validator.parseClaims(token);
            String jti = claims.getId();

            // Redis sub-millisecond check
            Boolean isBlacklisted = redisTemplate.hasKey("blacklist:jwt:" + jti);
            if (Boolean.TRUE.equals(isBlacklisted)) {
                res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token has been revoked");
                return;
            }
        }
        chain.doFilter(req, res);
    }

    public void revokeToken(String jti, long remainingSeconds) {
        redisTemplate.opsForValue().set("blacklist:jwt:" + jti, "revoked", Duration.ofSeconds(remainingSeconds));
    }

    private String resolveToken(HttpServletRequest req) {
        String h = req.getHeader("Authorization");
        return (h != null && h.startsWith("Bearer ")) ? h.substring(7) : null;
    }
}`,
    config: `# Redis cluster configuration
spring:
  data:
    redis:
      host: localhost
      port: 6379`,
    testing: `@Test
void blacklistedTokenIsRejectedWith401() throws Exception {
    String token = mockValidJwtWithJti("token-uuid-1234");
    redisTemplate.opsForValue().set("blacklist:jwt:token-uuid-1234", "revoked");

    mockMvc.perform(get("/api/data").header("Authorization", "Bearer " + token))
           .andExpect(status().isUnauthorized());
}`,
    pitfalls: "Never store blacklist entries indefinitely without a TTL. Setting the Redis TTL to the token's remaining expiration ensures Redis memory does not grow unbounded."
  },
  {
    id: "ex-20",
    level: 2,
    levelName: "Level 2: Modern REST",
    category: "M2M Auth",
    difficulty: "Intermediate",
    title: "API Key Authentication Filter for Machine-to-Machine (M2M) Ingestion",
    summary: "Implement high-throughput API key verification using custom request headers and constant-time string hashing comparison.",
    scenario: "External partner webhook delivery and ingestion endpoints where HTTP Basic or interactive login is unsuitable.",
    architecture: "`ApiKeyAuthenticationFilter` intercepts requests with `X-API-KEY`. It looks up the SHA-256 hash of the key in memory or a database cache and populates the `SecurityContextHolder` with `ApiKeyAuthenticationToken`.",
    code: `package com.example.security.apikey;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.MessageDigest;
import java.util.List;

public class ApiKeyFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-KEY";
    private final ApiKeyService apiKeyService;

    public ApiKeyFilter(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String rawKey = request.getHeader(API_KEY_HEADER);

        if (rawKey != null) {
            var client = apiKeyService.findClientByRawKey(rawKey);
            if (client.isEmpty()) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid API Key");
                return;
            }

            var auth = new ApiKeyAuthenticationToken(
                    client.get().getClientId(),
                    List.of(new SimpleGrantedAuthority("SCOPE_INGESTION"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}`,
    config: `# application.yml
api-keys:
  header-name: X-API-KEY`,
    testing: `@Test
void validApiKeyCanAccessIngestionApi() throws Exception {
    mockMvc.perform(post("/api/v1/telemetry")
            .header("X-API-KEY", "live_sk_prod_99a8b7c6d5e4")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"event\":\"heartbeat\"}"))
           .andExpect(status().isAccepted());
}`,
    pitfalls: "Never store plaintext API keys in databases. Store cryptographic SHA-256 hashes and use `MessageDigest.isEqual()` to prevent timing attacks."
  },
  {
    id: "ex-21",
    level: 2,
    levelName: "Level 2: Modern REST",
    category: "Multi-Provider",
    difficulty: "Advanced",
    title: "Multi-Authentication Provider Architecture (DB Users + API Keys)",
    summary: "Configure multiple AuthenticationProviders in a single AuthenticationManager to support both web users and partner API keys seamlessly.",
    scenario: "Your monolith serves both browser web portal users (username/password) and external programmatic API consumers via the same gateway.",
    architecture: "`ProviderManager` iterates through its list of `AuthenticationProvider` implementations. Each provider's `.supports(Class<?>)` method decides if it handles the given `Authentication` token type.",
    code: `package com.example.security.config;

import com.example.security.provider.ApiKeyAuthenticationProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class MultiProviderSecurityConfig {

    @Bean
    public AuthenticationManager authenticationManager(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder,
            ApiKeyAuthenticationProvider apiKeyProvider) {

        DaoAuthenticationProvider daoProvider = new DaoAuthenticationProvider();
        daoProvider.setUserDetailsService(userDetailsService);
        daoProvider.setPasswordEncoder(passwordEncoder);

        // Chain multiple providers
        return new ProviderManager(List.of(daoProvider, apiKeyProvider));
    }
}`,
    config: `# application.yml
# Configure both DB and Key caching properties`,
    testing: `@Test
void providerManagerRoutesCorrectly() {
    // Verifies DaoAuthenticationProvider handles UsernamePasswordAuthenticationToken
    // and ApiKeyAuthenticationProvider handles ApiKeyAuthenticationToken
}`,
    pitfalls: "Ensure providers return `null` or throw `AuthenticationException` appropriately. Returning an unauthenticated token can bypass security checks."
  },

  // ==========================================
  // LEVEL 3: OAUTH2, OIDC & FEDERATED IDENTITY
  // ==========================================
  {
    id: "ex-22",
    level: 3,
    levelName: "Level 3: OAuth2 / OIDC",
    category: "Social Login",
    difficulty: "Intermediate",
    title: "OAuth2 Social Login with Google & GitHub (User Info Mapping)",
    summary: "Integrate federated single sign-on with Google and GitHub, mapping external identities to internal application user records.",
    scenario: "A consumer web portal wants to offer frictionless 'Sign in with Google' and 'Sign in with GitHub' while synchronizing user profiles into PostgreSQL.",
    architecture: "`oauth2Login()` initiates the Authorization Code Grant. Upon receiving the authorization code, Spring Security exchanges it for an ID token, retrieves the user claims, and invokes your custom `OAuth2UserService` to persist or update the local user entity.",
    code: `package com.example.security.oauth;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserSyncService userSyncService;

    public CustomOAuth2UserService(UserSyncService userSyncService) {
        this.userSyncService = userSyncService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String clientRegId = userRequest.getClientRegistration().getRegistrationId(); // 'google' or 'github'

        // Extract provider-specific email and name
        String email = extractEmail(clientRegId, oAuth2User);
        String name = extractName(clientRegId, oAuth2User);

        // Sync or register into local database
        userSyncService.upsertFederatedUser(email, name, clientRegId);

        return oAuth2User;
    }

    private String extractEmail(String provider, OAuth2User user) {
        if ("github".equals(provider)) {
            return user.getAttribute("email") != null ? user.getAttribute("email") : user.getAttribute("login") + "@github.com";
        }
        return user.getAttribute("email");
    }

    private String extractName(String provider, OAuth2User user) {
        return user.getAttribute("name");
    }
}`,
    config: `spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: \${GOOGLE_CLIENT_ID}
            client-secret: \${GOOGLE_CLIENT_SECRET}
            scope: openid, profile, email
          github:
            client-id: \${GITHUB_CLIENT_ID}
            client-secret: \${GITHUB_CLIENT_SECRET}
            scope: read:user, user:email`,
    testing: `@Test
void oauth2RedirectUriContainsExpectedParams() throws Exception {
    mockMvc.perform(get("/oauth2/authorization/google"))
           .andExpect(status().is3xxRedirection())
           .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("accounts.google.com")));
}`,
    pitfalls: "GitHub users can have private emails where `user.getAttribute(\"email\")` returns null. Always handle null emails by querying GitHub's `/user/emails` endpoint or fallback."
  },
  {
    id: "ex-23",
    level: 3,
    levelName: "Level 3: OAuth2 / OIDC",
    category: "Resource Server",
    difficulty: "Advanced",
    title: "OAuth2 Resource Server with JWT Validation & Custom GrantedAuthoritiesConverter",
    summary: "Configure Spring Security as a pure Resource Server that validates external IdP tokens (Keycloak, Okta, Auth0) and converts realm roles to Spring Security authorities.",
    scenario: "Microservice APIs protected behind Keycloak or Okta. Keycloak places roles inside nested claims (`realm_access.roles`), requiring custom authority mapping.",
    architecture: "`oauth2ResourceServer(oauth2 -> oauth2.jwt(...))` automatically pulls the public key from the IdP's JWKS URI and verifies signature, expiration, and issuer. The `JwtAuthenticationConverter` maps nested claims to `ROLE_*` authorities.",
    code: `package com.example.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.*;
import java.util.stream.Collectors;

@Configuration
public class ResourceServerSecurityConfig {

    @Bean
    public SecurityFilterChain resourceServerChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("REALM_ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(customJwtAuthenticationConverter()))
            );

        return http.build();
    }

    private Converter<Jwt, ? extends AbstractAuthenticationToken> customJwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());
        return converter;
    }

    // Extracts Keycloak nested realm_access.roles
    static class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
        @Override
        public Collection<GrantedAuthority> convert(Jwt jwt) {
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess == null || realmAccess.isEmpty()) {
                return Collections.emptyList();
            }
            List<String> roles = (List<String>) realmAccess.get("roles");
            return roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                    .collect(Collectors.toList());
        }
    }
}`,
    config: `spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.mycompany.com/realms/enterprise-realm
          jwk-set-uri: https://auth.mycompany.com/realms/enterprise-realm/protocol/openid-connect/certs`,
    testing: `@Test
void validKeycloakJwtGrantsAccess() throws Exception {
    mockMvc.perform(get("/api/admin/system")
            .with(jwt().jwt(builder -> builder.claim("realm_access", Map.of("roles", List.of("REALM_ADMIN"))))))
           .andExpect(status().isOk());
}`,
    pitfalls: "If the IdP JWKS URI is unreachable during application startup, boot will fail unless lazy JWK set resolution or circuit breakers are configured."
  },
  {
    id: "ex-24",
    level: 3,
    levelName: "Level 3: OAuth2 / OIDC",
    category: "Opaque Tokens",
    difficulty: "Advanced",
    title: "OAuth2 Resource Server with Opaque Token Introspection & Caching",
    summary: "Validate non-JWT opaque tokens by querying the IdP introspection endpoint (RFC 7662) with local Caffeine cache optimization.",
    scenario: "Banking regulations require instant token revocation where resource servers cannot trust cached JWT expirations, opting instead for opaque reference tokens.",
    architecture: "`OpaqueTokenIntrospector` sends an HTTP POST with the token to the IdP's `/oauth/introspect` endpoint. A Caffeine cache caches successful responses for 30 seconds to prevent overwhelming the IdP under heavy load.",
    code: `package com.example.security.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.core.OAuth2AuthenticatedPrincipal;
import org.springframework.security.oauth2.server.resource.introspection.NimbusOpaqueTokenIntrospector;
import org.springframework.security.oauth2.server.resource.introspection.OpaqueTokenIntrospector;
import org.springframework.security.web.SecurityFilterChain;

import java.util.concurrent.TimeUnit;

@Configuration
public class OpaqueTokenConfig {

    @Bean
    public SecurityFilterChain opaqueTokenFilterChain(HttpSecurity http, OpaqueTokenIntrospector introspector) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.opaqueToken(token -> token.introspector(introspector)));

        return http.build();
    }

    @Bean
    public OpaqueTokenIntrospector cachingIntrospector() {
        OpaqueTokenIntrospector delegate = new NimbusOpaqueTokenIntrospector(
                "https://idp.bank.internal/oauth/introspect",
                "resource-server-client",
                "client-secret-12345"
        );

        Cache<String, OAuth2AuthenticatedPrincipal> cache = Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.SECONDS)
                .maximumSize(5000)
                .build();

        return token -> cache.get(token, delegate::introspect);
    }
}`,
    config: `spring:
  security:
    oauth2:
      resourceserver:
        opaquetoken:
          introspection-uri: https://idp.bank.internal/oauth/introspect
          client-id: rs-service
          client-secret: \${RS_SECRET}`,
    testing: `@Test
void opaqueTokenAuthenticatesViaIntrospector() throws Exception {
    mockMvc.perform(get("/api/accounts").header("Authorization", "Bearer opaque_token_xyz"))
           .andExpect(status().isOk());
}`,
    pitfalls: "Without caching, introspection generates an HTTP network hop to the IdP on EVERY single incoming request, multiplying latency and creating a single point of failure."
  },
  {
    id: "ex-25",
    level: 3,
    levelName: "Level 3: OAuth2 / OIDC",
    category: "Auth Server",
    difficulty: "Staff Architect",
    title: "Standalone Spring Authorization Server (Building an OAuth2/OIDC IdP)",
    summary: "Construct a complete, custom Identity Provider (IdP) supporting Authorization Code with PKCE, Client Credentials, and OIDC discovery.",
    scenario: "An enterprise cannot use third-party SaaS identity providers due to sovereign data regulations and requires an in-house OAuth2 server.",
    architecture: "Uses `spring-security-oauth2-authorization-server`. Configures `RegisteredClientRepository`, `JWKSource` for RS256 token signing, and standard endpoints (`/oauth2/authorize`, `/oauth2/token`, `/.well-known/openid-configuration`).",
    code: `package com.example.security.authorizationserver;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.web.SecurityFilterChain;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.UUID;

@Configuration
public class AuthServerConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain asFilterChain(HttpSecurity http) throws Exception {
        OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
        return http.formLogin(Customizer.withDefaults()).build();
    }

    @Bean
    public RegisteredClientRepository registeredClientRepository() {
        RegisteredClient client = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId("spa-client")
                .clientAuthenticationMethod(ClientAuthenticationMethod.NONE) // Public client (PKCE)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri("https://frontend.app/callback")
                .scope(OidcScopes.OPENID)
                .scope("read")
                .clientSettings(ClientSettings.builder().requireProofKeyForCodeExchange(true).build())
                .build();

        return new InMemoryRegisteredClientRepository(client);
    }

    @Bean
    public JWKSource<SecurityContext> jwkSource() throws Exception {
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        KeyPair pair = gen.generateKeyPair();
        RSAKey rsaKey = new RSAKey.Builder((RSAPublicKey) pair.getPublic())
                .privateKey((RSAPrivateKey) pair.getPrivate())
                .keyID(UUID.randomUUID().toString())
                .build();
        return new ImmutableJWKSet<>(new JWKSet(rsaKey));
    }
}`,
    config: `# build.gradle / pom.xml
# dependency: org.springframework.security:spring-security-oauth2-authorization-server`,
    testing: `@Test
void openidConfigurationEndpointReturnsValidMetadata() throws Exception {
    mockMvc.perform(get("/.well-known/openid-configuration"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.issuer").exists())
           .andExpect(jsonPath("$.token_endpoint").exists());
}`,
    pitfalls: "Never allow Authorization Code flow without PKCE for public clients (mobile/SPA). Without PKCE, malicious apps can intercept authorization codes."
  },
  {
    id: "ex-26",
    level: 3,
    levelName: "Level 3: OAuth2 / OIDC",
    category: "M2M Client Credentials",
    difficulty: "Intermediate",
    title: "OAuth2 Client Credentials Flow for Automated Batch Jobs & Microservices",
    summary: "Configure automated service-to-service communication using Spring's AuthorizedClientManager with transparent token acquisition and renewal.",
    scenario: "A nightly invoice billing batch microservice needs to call the Ledger API without any human user presence.",
    architecture: "`OAuth2AuthorizedClientManager` transparently handles calling the IdP token endpoint with grant_type=client_credentials, caches the token until expiration, and attaches the `Bearer` token to outgoing `RestClient` or `WebClient` requests.",
    code: `package com.example.security.client;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.*;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.web.client.RestClient;

@Configuration
public class ClientCredentialsRestClientConfig {

    @Bean
    public OAuth2AuthorizedClientManager authorizedClientManager(
            ClientRegistrationRepository clientRepo,
            OAuth2AuthorizedClientService clientService) {

        OAuth2AuthorizedClientProvider provider = OAuth2AuthorizedClientProviderBuilder.builder()
                .clientCredentials()
                .build();

        AuthorizedClientServiceOAuth2AuthorizedClientManager manager =
                new AuthorizedClientServiceOAuth2AuthorizedClientManager(clientRepo, clientService);
        manager.setAuthorizedClientProvider(provider);
        return manager;
    }

    @Bean
    public RestClient ledgerRestClient(OAuth2AuthorizedClientManager clientManager) {
        return RestClient.builder()
                .baseUrl("https://ledger.internal.service")
                .requestInterceptor((req, body, execution) -> {
                    OAuth2AuthorizeRequest authReq = OAuth2AuthorizeRequest
                            .withClientRegistrationId("ledger-service-client")
                            .principal("batch-job")
                            .build();
                    OAuth2AuthorizedClient client = clientManager.authorize(authReq);
                    if (client != null) {
                        req.getHeaders().setBearerAuth(client.getAccessToken().getTokenValue());
                    }
                    return execution.execute(req, body);
                })
                .build();
    }
}`,
    config: `spring:
  security:
    oauth2:
      client:
        registration:
          ledger-service-client:
            client-id: billing-batch-service
            client-secret: \${SERVICE_SECRET}
            authorization-grant-type: client_credentials
            scope: ledger:write
        provider:
          ledger-service-client:
            token-uri: https://auth.internal/oauth2/token`,
    testing: `@Test
void clientCredentialsInterceptorAttachesBearerToken() {
    // Assert request headers contain Authorization: Bearer <valid_token>
}`,
    pitfalls: "Do not request a refresh token for `client_credentials` grant; the OAuth2 specification forbids refresh tokens for machine clients since they can re-authenticate directly with client credentials."
  },
  {
    id: "ex-27",
    level: 3,
    levelName: "Level 3: OAuth2 / OIDC",
    category: "Multi-Tenancy",
    difficulty: "Staff Architect",
    title: "Multi-Tenant OAuth2 Resource Server (Dynamic JWT Issuer Resolution)",
    summary: "Validate JWTs dynamically from multiple independent identity providers (Okta, Azure AD, Ping) based on incoming tenant identifier or token issuer.",
    scenario: "A B2B SaaS platform where Enterprise Customer A authenticates through Okta and Enterprise Customer B authenticates through Azure AD.",
    architecture: "`JwtIssuerAuthenticationManagerResolver` intercepts the unverified JWT, reads its `iss` claim, dynamically resolves the corresponding `JwtAuthenticationProvider`, and downloads the proper tenant JWKS keys on demand.",
    code: `package com.example.security.multitenant;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationManagerResolver;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.server.resource.authentication.JwtIssuerAuthenticationManagerResolver;
import org.springframework.security.web.SecurityFilterChain;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class MultiTenantOAuth2Config {

    private final Map<String, String> allowedIssuers = Map.of(
        "tenant-alpha", "https://tenant-alpha.okta.com/oauth2/default",
        "tenant-beta", "https://login.microsoftonline.com/tenant-beta-id/v2.0"
    );

    @Bean
    public SecurityFilterChain multiTenantFilterChain(HttpSecurity http) throws Exception {
        // Dynamic issuer authentication manager resolver
        AuthenticationManagerResolver<HttpServletRequest> resolver =
                new JwtIssuerAuthenticationManagerResolver(allowedIssuers.values());

        http
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2
                .authenticationManagerResolver(resolver)
            );

        return http.build();
    }
}`,
    config: `# application.yml
# Issuers can be dynamically loaded from a database or configuration server`,
    testing: `@Test
void tokenFromAllowedTenantIsAccepted() throws Exception {
    mockMvc.perform(get("/api/data").header("Authorization", "Bearer token_from_tenant_alpha"))
           .andExpect(status().isOk());
}`,
    pitfalls: "Never allow open, unconstrained issuer validation without an allow-list, as an attacker could stand up their own rogue IdP and sign tokens with their own issuer."
  },

  // ==========================================
  // LEVEL 4: MICROSERVICES & DISTRIBUTED SECURITY
  // ==========================================
  {
    id: "ex-28",
    level: 4,
    levelName: "Level 4: Microservices",
    category: "Gateway Security",
    difficulty: "Advanced",
    title: "Spring Cloud Gateway as Centralized Security Gateway with Token Relay",
    summary: "Authenticate client requests at the edge API gateway and relay validated Bearer tokens downstream to internal microservices.",
    scenario: "A microservice cluster where external clients should never directly talk to internal services. The gateway terminates SSL, verifies auth, and forwards identity headers.",
    architecture: "Spring Cloud Gateway uses reactive WebFlux. The `TokenRelayGatewayFilterFactory` extracts the `OAuth2AuthorizedClient`'s access token and adds `Authorization: Bearer <token>` to downstream HTTP calls.",
    code: `package com.example.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class GatewaySecurityConfig {

    @Bean
    public SecurityWebFilterChain gatewaySecurityFilterChain(ServerHttpSecurity http) {
        http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers("/actuator/health", "/public/**").permitAll()
                .anyExchange().authenticated()
            )
            .oauth2Login(org.springframework.security.config.Customizer.withDefaults());

        return http.build();
    }
}`,
    config: `# application.yml
spring:
  cloud:
    gateway:
      routes:
        - id: order-service
          uri: lb://ORDER-SERVICE
          predicates:
            - Path=/api/orders/**
          filters:
            - TokenRelay=
            - RemoveRequestHeader=Cookie # Strip session cookie before downstream forwarding`,
    testing: `@Test
void gatewayRelaysTokenToOrderService() {
    // Assert downstream mock server receives Authorization: Bearer header
}`,
    pitfalls: "Always strip the browser session `Cookie` header when using TokenRelay to prevent accidental session leak to downstream microservices."
  },
  {
    id: "ex-29",
    level: 4,
    levelName: "Level 4: Microservices",
    category: "BFF Pattern",
    difficulty: "Staff Architect",
    title: "Backend-For-Frontend (BFF) Pattern with HttpOnly Session Cookies",
    summary: "Shield modern browser SPAs from handling raw JWTs by holding tokens at the Gateway BFF and communicating with the browser solely via secure HttpOnly cookies.",
    scenario: "FinTech compliance requires zero access tokens in browser memory/storage to prevent XSS credential exfiltration.",
    architecture: "Browser talks to Spring Cloud Gateway using an encrypted `SameSite=Strict; HttpOnly` session cookie. The Gateway stores the OAuth2 tokens in Redis and swaps the session cookie for an OAuth2 Bearer JWT before forwarding to backend microservices.",
    code: `package com.example.bff.filter;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.ReactiveOAuth2AuthorizedClientManager;
import org.springframework.stereotype.Component;

@Component
public class BffTokenExchangeFilterFactory extends AbstractGatewayFilterFactory<Object> {

    private final ReactiveOAuth2AuthorizedClientManager clientManager;

    public BffTokenExchangeFilterFactory(ReactiveOAuth2AuthorizedClientManager clientManager) {
        this.clientManager = clientManager;
    }

    @Override
    public GatewayFilter apply(Object config) {
        return (exchange, chain) -> exchange.getPrincipal()
                .flatMap(principal -> {
                    OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest
                            .withClientRegistrationId("keycloak")
                            .principal(principal.getName())
                            .build();

                    return clientManager.authorize(authorizeRequest)
                            .map(client -> client.getAccessToken().getTokenValue())
                            .map(token -> exchange.mutate()
                                    .request(r -> r.headers(h -> h.setBearerAuth(token)))
                                    .build()
                            );
                })
                .defaultIfEmpty(exchange)
                .flatMap(chain::filter);
    }
}`,
    config: `server:
  servlet:
    session:
      cookie:
        http-only: true
        secure: true
        same-site: STRICT`,
    testing: `@Test
void browserSendsCookie_DownstreamReceivesBearerJwt() {
    // Mock incoming cookie and verify downstream request mutation
}`,
    pitfalls: "BFF pattern requires strict CSRF defense on mutating endpoints because cookies are automatically attached by browsers."
  },
  {
    id: "ex-30",
    level: 4,
    levelName: "Level 4: Microservices",
    category: "mTLS",
    difficulty: "Staff Architect",
    title: "Mutual TLS (mTLS) Zero-Trust Authentication between Microservices",
    summary: "Enforce bidirectional cryptographic x509 certificate validation for inter-service communication.",
    scenario: "Zero-Trust network architecture where physical network perimeter security is deemed insufficient and all microservice traffic must be authenticated at the TLS handshake.",
    architecture: "Tomcat terminates TLS requiring client certificates (`client-auth=\"need\"`). Spring Security's `x509()` filter extracts the `X509Certificate` from the request attribute, parses the Common Name (CN), and grants service-level authorities.",
    code: `package com.example.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;

import java.util.List;

@Configuration
public class MtlsSecurityConfig {

    @Bean
    public SecurityFilterChain mtlsFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/internal/**").hasRole("TRUSTED_MICROSERVICE")
                .anyRequest().authenticated()
            )
            .x509(x509 -> x509
                .subjectPrincipalRegex("CN=(.*?)(?:,|$)")
                .userDetailsService(x509UserDetailsService())
            );

        return http.build();
    }

    @Bean
    public UserDetailsService x509UserDetailsService() {
        return username -> {
            // Match CN against known microservices
            if ("payment-service".equals(username) || "order-service".equals(username)) {
                return new User(username, "", List.of(new SimpleGrantedAuthority("ROLE_TRUSTED_MICROSERVICE")));
            }
            throw new org.springframework.security.core.userdetails.UsernameNotFoundException("Untrusted client CN: " + username);
        };
    }
}`,
    config: `server:
  port: 8443
  ssl:
    enabled: true
    client-auth: need
    key-store: classpath:keystore.p12
    key-store-password: \${KEYSTORE_PWD}
    key-store-type: PKCS12
    trust-store: classpath:truststore.p12
    trust-store-password: \${TRUSTSTORE_PWD}
    trust-store-type: PKCS12`,
    testing: `@Test
void validClientCert_AccessesInternalEndpoint() throws Exception {
    // Inject mock X509Certificate attribute into request
}`,
    pitfalls: "Certificate revocation lists (CRL) or OCSP stapling must be actively monitored; otherwise compromised microservice private keys remain trusted until expiration."
  },
  {
    id: "ex-31",
    level: 4,
    levelName: "Level 4: Microservices",
    category: "Rate Limiting",
    difficulty: "Intermediate",
    title: "Rate Limiting & Brute-Force Login Prevention using Bucket4j & Spring Security",
    summary: "Protect authentication endpoints from credential stuffing and DDoS attacks using token bucket rate limiting per IP / client ID.",
    scenario: "Attackers script thousands of login requests against `/api/auth/login`. You need to throttle failed requests to 5 attempts per minute per IP.",
    architecture: "`Bucket4j` maintains atomic token counters. A custom filter intercepts `/api/auth/login` requests before the authentication filter. If tokens are exhausted, it rejects the request with HTTP 429 Too Many Requests and a `Retry-After` header.",
    code: `package com.example.security.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class LoginRateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket createNewBucket() {
        // 5 requests per minute limit
        Refill refill = Refill.greedy(5, Duration.ofMinutes(1));
        Bandwidth limit = Bandwidth.classic(5, refill);
        return Bucket.builder().addLimit(limit).build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        if ("/api/auth/login".equals(req.getRequestURI()) && "POST".equalsIgnoreCase(req.getMethod())) {
            String clientIp = req.getRemoteAddr();
            Bucket bucket = buckets.computeIfAbsent(clientIp, k -> createNewBucket());

            if (!bucket.tryConsume(1)) {
                res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                res.setHeader("Retry-After", "60");
                res.getWriter().write("{\\"error\\":\\"Too many login attempts. Please try again later.\\"}");
                return;
            }
        }

        chain.doFilter(req, res);
    }
}`,
    config: `# For clustered environments, use Bucket4j Redis proxy:
# bucket4j.redis.enabled: true`,
    testing: `@Test
void sixthRequestWithinMinute_Returns429TooManyRequests() throws Exception {
    for (int i = 0; i < 5; i++) {
        mockMvc.perform(post("/api/auth/login")).andExpect(status().isUnauthorized());
    }
    mockMvc.perform(post("/api/auth/login")).andExpect(status().isTooManyRequests());
}`,
    pitfalls: "When deploying behind reverse proxies (Nginx/Cloudflare), `req.getRemoteAddr()` returns the proxy's IP. Always parse `X-Forwarded-For` with trusted proxy validation."
  },
  {
    id: "ex-32",
    level: 4,
    levelName: "Level 4: Microservices",
    category: "Anti-Bot",
    difficulty: "Intermediate",
    title: "Captcha Verification in Custom AuthenticationFilter (Cloudflare Turnstile)",
    summary: "Enforce invisible bot detection before processing passwords to stop automated credential stuffing pipelines.",
    scenario: "Public registration and login endpoints subjected to distributed botnet attacks.",
    architecture: "`TurnstileVerificationFilter` checks for `cf-turnstile-response` header, verifies the token server-side with Cloudflare's API, and blocks execution if verification fails before any database password check occurs.",
    code: `package com.example.security.captcha;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.client.RestClient;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

public class TurnstileVerificationFilter extends OncePerRequestFilter {

    private final RestClient restClient = RestClient.create();
    private final String turnstileSecret;

    public TurnstileVerificationFilter(String turnstileSecret) {
        this.turnstileSecret = turnstileSecret;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        if ("/api/auth/login".equals(req.getRequestURI()) && "POST".equalsIgnoreCase(req.getMethod())) {
            String token = req.getHeader("CF-Turnstile-Token");

            if (token == null || !verifyWithCloudflare(token, req.getRemoteAddr())) {
                res.sendError(HttpServletResponse.SC_FORBIDDEN, "Bot verification failed");
                return;
            }
        }
        chain.doFilter(req, res);
    }

    private boolean verifyWithCloudflare(String token, String remoteIp) {
        var response = restClient.post()
                .uri("https://challenges.cloudflare.com/turnstile/v0/siteverify")
                .body(Map.of("secret", turnstileSecret, "response", token, "remoteip", remoteIp))
                .retrieve()
                .body(Map.class);

        return response != null && Boolean.TRUE.equals(response.get("success"));
    }
}`,
    config: `turnstile:
  secret: \${TURNSTILE_SECRET_KEY}`,
    testing: `@Test
void missingCaptchaToken_FailsWith403() throws Exception {
    mockMvc.perform(post("/api/auth/login"))
           .andExpect(status().isForbidden());
}`,
    pitfalls: "Never perform bot verification AFTER password hashing. Verifying passwords first allows bots to exhaust CPU resources via BCrypt work factors."
  },
  {
    id: "ex-33",
    level: 4,
    levelName: "Level 4: Microservices",
    category: "MFA / 2FA",
    difficulty: "Advanced",
    title: "Two-Factor Authentication (2FA / TOTP) with Google Authenticator",
    summary: "Implement Time-Based One-Time Password (TOTP RFC 6238) two-step authentication.",
    scenario: "Admins and privileged financial managers must supply a 6-digit authenticator code before access is granted.",
    architecture: "Phase 1: Valid username/password sets a temporary `PRE_AUTH` authority. Phase 2: User submits 6-digit TOTP code verified against user's secret key using HMAC-SHA1. Upon success, full `ROLE_ADMIN` authority is granted.",
    code: `package com.example.security.mfa;

import com.warrenstrange.googleauth.GoogleAuthenticator;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TotpAuthenticationService {

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    public boolean verifyCode(String secretKey, int code) {
        return gAuth.authorize(secretKey, code);
    }

    public void upgradeToFullAuthentication(String username) {
        // Upgrade from PRE_AUTH to FULL_AUTH
        var fullAuth = new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(fullAuth);
    }
}`,
    config: `# Google Authenticator library
# com.warrenstrange:googleauth:1.5.0`,
    testing: `@Test
void validTotpCodeUpgradesSecurityContext() {
    // Assert authorities contain ROLE_ADMIN after TOTP verification
}`,
    pitfalls: "Store user TOTP secret keys encrypted at rest in the database (AES-256-GCM). If the database is compromised, plaintext secret keys allow attackers to generate TOTP codes."
  },

  // ==========================================
  // LEVEL 5: ENTERPRISE, REACTIVE & ZERO-TRUST
  // ==========================================
  {
    id: "ex-34",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "Reactive WebFlux",
    difficulty: "Advanced",
    title: "WebFlux Reactive SecurityFilterChain with Stateless Reactive JWT Auth",
    summary: "Secure non-blocking Spring Boot WebFlux reactive microservices using ServerHttpSecurity and ReactiveSecurityContextHolder.",
    scenario: "High-throughput streaming microservice processing 50,000 requests/sec with Netty event loops where blocking Servlet APIs are prohibited.",
    architecture: "`SecurityWebFilterChain` replaces `SecurityFilterChain`. Authentication and authorization are asynchronous via Project Reactor `Mono<Authentication>`. `ReactiveSecurityContextHolder` uses Reactor Context instead of `ThreadLocal`.",
    code: `package com.example.reactive.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class ReactiveSecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers("/public/**").permitAll()
                .pathMatchers("/orders/stream/**").hasAuthority("SCOPE_stream:read")
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(org.springframework.security.config.Customizer.withDefaults()))
            .build();
    }
}`,
    config: `spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.company.com/realms/reactive-realm`,
    testing: `@Test
void reactiveEndpointAcceptsValidJwt() {
    webTestClient.mutateWith(mockJwt().jwt(builder -> builder.subject("alice").claim("scope", "stream:read")))
                 .get().uri("/orders/stream/live")
                 .exchange()
                 .expectStatus().isOk();
}`,
    pitfalls: "Never call `SecurityContextHolder.getContext()` in WebFlux. In reactive pipelines, threads are shared across concurrent requests; calling `ThreadLocal` causes critical cross-request data leaks. Always use `ReactiveSecurityContextHolder`."
  },
  {
    id: "ex-35",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "Reactive Method Security",
    difficulty: "Advanced",
    title: "Reactive Method Security in Spring WebFlux with Mono/Flux Principals",
    summary: "Apply declarative `@PreAuthorize` annotations on reactive methods returning Mono and Flux publishers.",
    scenario: "Protecting asynchronous domain services where execution is deferred until subscription.",
    architecture: "`@EnableReactiveMethodSecurity` integrates with Reactor Context. SpEL evaluations can inspect the reactive `Authentication` without blocking the Netty event loop thread.",
    code: `package com.example.reactive.service;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@EnableReactiveMethodSecurity
public class ReactiveOrderService {

    @PreAuthorize("hasRole('ADMIN') or #customerId == authentication.name")
    public Flux<OrderDto> streamOrdersForCustomer(String customerId) {
        return fetchOrdersFromReactiveDatabase(customerId);
    }

    private Flux<OrderDto> fetchOrdersFromReactiveDatabase(String customerId) {
        return Flux.just(new OrderDto("ord-1", customerId, 99.95));
    }
}`,
    config: `# WebFlux reactive method security enabled via annotation`,
    testing: `@Test
void accessDeniedWhenCallingReactiveMethodUnauthorized() {
    StepVerifier.create(orderService.streamOrdersForCustomer("other-user"))
                .expectError(org.springframework.security.access.AccessDeniedException.class)
                .verify();
}`,
    pitfalls: "Do not return raw non-reactive types (e.g. `String`) from methods protected by reactive method security, as this can lead to unexpected blocking behavior."
  },
  {
    id: "ex-36",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "SAML 2.0",
    difficulty: "Staff Architect",
    title: "Enterprise SAML 2.0 Single Sign-On (SSO) with Okta / Azure AD",
    summary: "Integrate legacy enterprise Identity Providers using SAML 2.0 assertions and XML metadata exchanges.",
    scenario: "Enterprise Fortune 500 client requires SSO integration using Azure AD SAML with mandatory assertion encryption and digital signatures.",
    architecture: "`saml2Login()` configures OpenSAML integration. The Service Provider (SP) metadata is published to `/saml2/service-provider-metadata/{registrationId}`, and assertion consumer service handles incoming encrypted XML POST assertions.",
    code: `package com.example.security.saml;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SamlSecurityConfig {

    @Bean
    public SecurityFilterChain samlFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/saml2/**").permitAll()
                .anyRequest().authenticated()
            )
            .saml2Login(Customizer.withDefaults())
            .saml2Metadata(Customizer.withDefaults());

        return http.build();
    }
}`,
    config: `spring:
  security:
    saml2:
      relyingparty:
        registration:
          okta:
            signing:
              credentials:
                - private-key-location: classpath:saml/sp-private.key
                  certificate-location: classpath:saml/sp-cert.crt
            assertingparty:
              metadata-uri: https://company.okta.com/app/exk123456/sso/saml/metadata`,
    testing: `@Test
void samlMetadataEndpointIsPubliclyAccessible() throws Exception {
    mockMvc.perform(get("/saml2/service-provider-metadata/okta"))
           .andExpect(status().isOk())
           .andExpect(content().contentTypeCompatibleWith("application/xml"));
}`,
    pitfalls: "Clock skew between the IdP and SP server can cause assertion rejection (`Instant is in the past`). Always configure NTP time sync or set a reasonable skew tolerance in seconds."
  },
  {
    id: "ex-37",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "LDAP",
    difficulty: "Advanced",
    title: "Enterprise LDAP Authentication with Active Directory Fallback",
    summary: "Authenticate enterprise employees against Microsoft Active Directory or OpenLDAP directory trees.",
    scenario: "Corporate intranet tool where employee credentials are bound to internal company-wide LDAP directories.",
    architecture: "`LdapAuthenticationProvider` establishes an LDAP bind using the provided credentials against the user search base (`ou=people,dc=company,dc=com`) and fetches member groups as authorities.",
    code: `package com.example.security.ldap;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.ldap.LdapBindAuthenticationManagerFactory;
import org.springframework.security.ldap.DefaultSpringSecurityContextSource;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class LdapSecurityConfig {

    @Bean
    public DefaultSpringSecurityContextSource contextSource() {
        return new DefaultSpringSecurityContextSource("ldap://ad.company.internal:389/dc=company,dc=internal");
    }

    @Bean
    public AuthenticationManager ldapAuthenticationManager(DefaultSpringSecurityContextSource contextSource) {
        LdapBindAuthenticationManagerFactory factory = new LdapBindAuthenticationManagerFactory(contextSource);
        factory.setUserDnPatterns("uid={0},ou=people");
        factory.setUserSearchBase("ou=people");
        factory.setGroupSearchBase("ou=groups");
        return factory.createAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain ldapFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .formLogin(org.springframework.security.config.Customizer.withDefaults());

        return http.build();
    }
}`,
    config: `spring:
  ldap:
    urls: ldaps://ad.company.internal:636
    username: cn=bind_user,ou=services,dc=company,dc=internal
    password: \${LDAP_BIND_PWD}`,
    testing: `@Test
void ldapContextSourceConnectsSuccessfully() {
    // Assert LDAP connection and base context bindings
}`,
    pitfalls: "Never connect over unencrypted `ldap://389` in production; always use `ldaps://636` with valid certificates to prevent credential sniffing on internal networks."
  },
  {
    id: "ex-38",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "ABAC",
    difficulty: "Staff Architect",
    title: "Attribute-Based Access Control (ABAC) using Custom Security Expression Root",
    summary: "Implement dynamic context-aware policy enforcement based on user attributes, resource classification, action, and environment context.",
    scenario: "Healthcare patient records: A doctor can only access a patient's chart if assigned to that patient, during working shift hours, and connecting from a hospital intranet IP.",
    architecture: "Extends `SecurityExpressionRoot` and creates custom SpEL methods (e.g., `canAccessPatientRecord(#patientId)`). The custom evaluator checks environmental attributes, role, and domain rules at evaluation time.",
    code: `package com.example.security.abac;

import org.springframework.security.access.expression.SecurityExpressionRoot;
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations;
import org.springframework.security.core.Authentication;

import java.time.LocalTime;

public class CustomAbacExpressionRoot extends SecurityExpressionRoot implements MethodSecurityExpressionOperations {

    private Object filterObject;
    private Object returnObject;
    private Object target;

    public CustomAbacExpressionRoot(Authentication authentication) {
        super(authentication);
    }

    public boolean canAccessPatientRecord(Long patientId, String clientIp) {
        // 1. Must be Doctor
        if (!hasRole("DOCTOR")) return false;

        // 2. Environment check: Shift between 08:00 and 20:00
        LocalTime now = LocalTime.now();
        if (now.isBefore(LocalTime.of(8, 0)) || now.isAfter(LocalTime.of(20, 0))) {
            return false;
        }

        // 3. Network check: Must be internal hospital subnet
        if (!clientIp.startsWith("10.240.")) {
            return false;
        }

        return true;
    }

    // Required interface boilerplate:
    @Override public void setFilterObject(Object o) { this.filterObject = o; }
    @Override public Object getFilterObject() { return filterObject; }
    @Override public void setReturnObject(Object o) { this.returnObject = o; }
    @Override public Object getReturnObject() { return returnObject; }
    @Override public Object getThis() { return target; }
}`,
    config: `# Plug into MethodSecurityExpressionHandler`,
    testing: `@Test
void accessDeniedOutsideShiftHours() {
    // Assert doctor cannot access records at midnight
}`,
    pitfalls: "Avoid slow external database queries inside SpEL expressions, as this can degrade endpoint response times. Cache attribute lookups where appropriate."
  },
  {
    id: "ex-39",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "Spring Security ACL",
    difficulty: "Staff Architect",
    title: "Domain-Object Access Control Lists (ACL) for Row-Level Security",
    summary: "Maintain fine-grained per-object permissions (READ, WRITE, DELETE, ADMIN) stored in relational ACL schema tables.",
    scenario: "Google Docs / Dropbox style file-sharing where individual users can share specific files with individual colleagues with specific read or write permissions.",
    architecture: "`AclService` queries database tables (`acl_sid`, `acl_class`, `acl_object_identity`, `acl_entry`). `@PreAuthorize(\"hasPermission(#documentId, 'com.example.Document', 'WRITE')\")` is evaluated via `AclPermissionEvaluator`.",
    code: `package com.example.security.acl;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.acls.AclPermissionEvaluator;
import org.springframework.security.acls.jdbc.BasicLookupStrategy;
import org.springframework.security.acls.jdbc.JdbcMutableAclService;
import org.springframework.security.acls.model.AclService;

import javax.sql.DataSource;

@Configuration
public class AclConfiguration {

    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler(AclService aclService) {
        DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
        handler.setPermissionEvaluator(new AclPermissionEvaluator(aclService));
        return handler;
    }

    @Bean
    public JdbcMutableAclService aclService(DataSource dataSource, BasicLookupStrategy lookupStrategy) {
        return new JdbcMutableAclService(dataSource, lookupStrategy, null);
    }
}`,
    config: `# Requires standard Spring Security ACL SQL schema (acl_sid, acl_class, acl_object_identity, acl_entry)`,
    testing: `@Test
void userWithoutWritePermissionCannotModifyDocument() {
    // Verify AccessDeniedException thrown on modify call
}`,
    pitfalls: "Spring Security ACL tables can become query bottlenecks under high load. Use Spring Cache / Redis on `LookupStrategy` to maintain performance."
  },
  {
    id: "ex-40",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "Multi-Tenancy",
    difficulty: "Staff Architect",
    title: "Multi-Tenant Database Isolation using Hibernate TenantIdentifier & SecurityContext",
    summary: "Prevent cross-tenant data leaks by automatically binding the authenticated user's tenant ID from SecurityContext to Hibernate queries.",
    scenario: "Multi-tenant SaaS where each tenant shares the same PostgreSQL schema, but every query must automatically filter by `tenant_id` without relying on developer discipline.",
    architecture: "`CurrentTenantIdentifierResolver` retrieves the tenant ID from `SecurityContextHolder`. Hibernate's multi-tenancy discriminator mechanism automatically appends `WHERE tenant_id = ?` to all generated SQL queries.",
    code: `package com.example.security.multitenancy;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityTenantIdentifierResolver implements CurrentTenantIdentifierResolver<String> {

    private static final String DEFAULT_TENANT = "public";

    @Override
    public String resolveCurrentTenantIdentifier() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof TenantPrincipal tenantUser) {
            return tenantUser.getTenantId();
        }
        return DEFAULT_TENANT;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}`,
    config: `spring:
  jpa:
    properties:
      hibernate:
        multiTenancy: DISCRIMINATOR`,
    testing: `@Test
void queriesAutomaticallyIncludeTenantId() {
    // Assert executed SQL contains where tenant_id = 'tenant-123'
}`,
    pitfalls: "Always handle unauthenticated threads (e.g., async background jobs) gracefully by having a defined fallback tenant or throwing an explicit error."
  },
  {
    id: "ex-41",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "Auditing",
    difficulty: "Beginner",
    title: "Security Auditing with Spring Data JPA @CreatedBy & AuditorAware",
    summary: "Automatically track who created and modified records in database entities using Spring Security principal auditing.",
    scenario: "Regulatory compliance (SOC 2, ISO 27001) mandates complete audit trails for every database record insertion and update.",
    architecture: "`@EnableJpaAuditing` coordinates with an `AuditorAware<String>` bean. During JPA entity lifecycle events (`@PrePersist`, `@PreUpdate`), the current username is pulled from `SecurityContextHolder` and populated into entity fields.",
    code: `package com.example.security.audit;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaAuditSecurityConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return Optional.of("SYSTEM");
            }
            return Optional.of(auth.getName());
        };
    }
}`,
    config: `# Entity definition:
# @EntityListeners(AuditingEntityListener.class)
# public class Order {
#   @CreatedBy private String createdBy;
#   @LastModifiedBy private String lastModifiedBy;
# }`,
    testing: `@Test
@WithMockUser(username = "auditor_alice")
void entitySavesCurrentUsernameInCreatedBy() {
    Order order = orderRepository.save(new Order("Item 1"));
    assertThat(order.getCreatedBy()).isEqualTo("auditor_alice");
}`,
    pitfalls: "Make sure `AuditorAware` handles `anonymousUser` and null authentications without throwing NullPointerExceptions during asynchronous or unauthenticated tasks."
  },
  {
    id: "ex-42",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "Headers & Hardening",
    difficulty: "Intermediate",
    title: "Production Security Headers Hardening (CSP, HSTS, Permissions-Policy)",
    summary: "Fortify your web application against XSS, clickjacking, and protocol downgrade attacks by configuring strict HTTP security headers.",
    scenario: "Passing strict security audits and vulnerability scanners (e.g. Qualys, Mozilla Observatory) by configuring comprehensive security response headers.",
    architecture: "`http.headers(...)` configures filters that append `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, and `Permissions-Policy` to every outgoing HTTP response.",
    code: `package com.example.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

@Configuration
public class SecurityHeadersConfig {

    @Bean
    public SecurityFilterChain headersFilterChain(HttpSecurity http) throws Exception {
        http
            .headers(headers -> headers
                // Strict-Transport-Security (HSTS)
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000) // 1 year
                    .preload(true)
                )
                // Content-Security-Policy (CSP)
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; script-src 'self'; frame-ancestors 'none'; object-src 'none';")
                )
                // Prevent Clickjacking
                .frameOptions(frame -> frame.deny())
                // Referrer Policy
                .referrerPolicy(ref -> ref.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                // Permissions Policy
                .permissionsPolicy(perms -> perms
                    .policy("camera=(), microphone=(), geolocation=(), payment=()")
                )
            );

        return http.build();
    }
}`,
    config: `# application.yml
server.forward-headers-strategy: NATIVE`,
    testing: `@Test
void securityHeadersArePresentOnResponse() throws Exception {
    mockMvc.perform(get("/api/public/ping"))
           .andExpect(header().string("X-Frame-Options", "DENY"))
           .andExpect(header().string("Strict-Transport-Security", org.hamcrest.Matchers.containsString("max-age=31536000")));
}`,
    pitfalls: "Testing CSP with strict policies in development without testing your frontend scripts can break external fonts, CDNs, or analytics unless explicitly whitelisted in `script-src`."
  },
  {
    id: "ex-43",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "Cryptography",
    difficulty: "Advanced",
    title: "Advanced Password Migration Strategy (Transparent Argon2 Upgrade from Legacy MD5)",
    summary: "Transparently migrate legacy password hashes (MD5/SHA-1) to state-of-the-art Argon2id on each successful user login without user interruption.",
    scenario: "Acquiring a legacy enterprise system that stored passwords using deprecated SHA-256 or MD5 hashing; you need to modernize to Argon2id without resetting user passwords.",
    architecture: "`DelegatingPasswordEncoder` determines the hash algorithm from the `{id}` prefix. `UserDetailsPasswordService.updatePassword()` is invoked by `DaoAuthenticationProvider` whenever a hash needs upgrading.",
    code: `package com.example.security.crypto;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsPasswordService;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.MessageDigestPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class ModernCryptoMigrationConfig {

    @Bean
    public PasswordEncoder delegatingPasswordEncoder() {
        Map<String, PasswordEncoder> encoders = new HashMap<>();
        encoders.put("argon2", Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8());
        encoders.put("sha256", new MessageDigestPasswordEncoder("SHA-256"));
        encoders.put("legacy-md5", new MessageDigestPasswordEncoder("MD5"));

        // Default encoder for newly hashed passwords
        DelegatingPasswordEncoder delegating = new DelegatingPasswordEncoder("argon2", encoders);
        delegating.setDefaultPasswordEncoderForMatches(encoders.get("legacy-md5"));
        return delegating;
    }

    @Service
    public static class TransparentPasswordUpgradeService implements UserDetailsPasswordService {
        private final UserRepository userRepository;

        public TransparentPasswordUpgradeService(UserRepository userRepository) {
            this.userRepository = userRepository;
        }

        @Override
        public UserDetails updatePassword(UserDetails user, String newPasswordHash) {
            // Automatically triggered by Spring Security on successful login if hash upgrade needed!
            userRepository.updatePasswordHash(user.getUsername(), newPasswordHash);
            return user;
        }
    }
}`,
    config: `# application.yml
# Argon2 is memory-hard and GPU-resistant, recommended by OWASP for password hashing`,
    testing: `@Test
void legacyMd5PasswordIsUpgradedToArgon2OnLogin() {
    // Assert stored password hash changes from legacy format to {argon2}...
}`,
    pitfalls: "Ensure the database password column is wide enough (at least 255 characters) to store long Argon2 hash strings."
  },
  {
    id: "ex-44",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "Custom Filters",
    difficulty: "Advanced",
    title: "Custom Security Filter Ordering (addFilterBefore, addFilterAfter, addFilterAt)",
    summary: "Position custom security filters precisely within Spring Security's standard filter chain ordering.",
    scenario: "Inserting a custom request trace ID filter, legal disclaimer acknowledgment filter, or fraud detection filter into the chain.",
    architecture: "Spring Security maintains an internal list of filter positions. `addFilterBefore(CustomFilter, StandardFilter.class)` or `addFilterAfter(...)` inserts your custom filter relative to standard filters in `FilterChainProxy`.",
    code: `package com.example.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Configuration
public class FilterOrderingConfig {

    @Bean
    public SecurityFilterChain customOrderedFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            // Insert TraceIdFilter before authentication:
            .addFilterBefore(new TraceIdLoggingFilter(), UsernamePasswordAuthenticationFilter.class)
            // Insert AuditFilter after authentication:
            .addFilterAfter(new PostAuthAuditFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    static class TraceIdLoggingFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
                throws ServletException, IOException {
            String traceId = UUID.randomUUID().toString();
            MDC.put("traceId", traceId);
            res.setHeader("X-Trace-Id", traceId);
            try {
                chain.doFilter(req, res);
            } finally {
                MDC.remove("traceId");
            }
        }
    }

    static class PostAuthAuditFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
                throws ServletException, IOException {
            // Audit logic here
            chain.doFilter(req, res);
        }
    }
}`,
    config: `# application.yml
logging.pattern.console: "%d [%thread] %-5level %logger{36} [traceId=%X{traceId}] - %msg%n"`,
    testing: `@Test
void traceIdHeaderIsPresentOnResponse() throws Exception {
    mockMvc.perform(get("/api/ping"))
           .andExpect(header().exists("X-Trace-Id"));
}`,
    pitfalls: "Using `addFilterAt(filter, ExistingFilter.class)` does NOT replace the existing filter; both filters will execute in an arbitrary relative order at that position. Use specific before/after placement or remove the target filter."
  },
  {
    id: "ex-45",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "Async & Threads",
    difficulty: "Advanced",
    title: "Asynchronous Security Context Propagation (DelegatingSecurityContextExecutorService)",
    summary: "Propagate the authenticated user's SecurityContext into background worker threads and asynchronous CompletableFuture pipelines.",
    scenario: "A service fires background calculation tasks or parallel database lookups using `@Async` or `CompletableFuture`, but the child threads see an empty SecurityContext.",
    architecture: "Because `SecurityContextHolder` defaults to `MODE_THREADLOCAL`, worker threads do not inherit context. `DelegatingSecurityContextExecutorService` wraps a standard thread pool to copy context snapshots when tasks are dispatched.",
    code: `package com.example.security.async;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.security.concurrent.DelegatingSecurityContextExecutorService;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
@EnableAsync
public class AsyncSecurityConfig {

    @Bean
    public ExecutorService securityAwareExecutor() {
        ExecutorService underlyingPool = Executors.newFixedThreadPool(10);
        // Wraps every submitted Runnable/Callable with current SecurityContext snapshot:
        return new DelegatingSecurityContextExecutorService(underlyingPool);
    }
}`,
    config: `# application.yml
# spring.main.allow-bean-definition-overriding: true`,
    testing: `@Test
@WithMockUser(username = "async_worker")
void childThreadInheritsSecurityContext() throws Exception {
    Future<String> future = executor.submit(() -> 
        SecurityContextHolder.getContext().getAuthentication().getName()
    );
    assertEquals("async_worker", future.get());
}`,
    pitfalls: "Do not set `SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_INHERITABLETHREADLOCAL)` in pooled web environments, as thread reuse can cause security context leaks across different user requests."
  },
  {
    id: "ex-46",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "WebSockets",
    difficulty: "Advanced",
    title: "WebSocket Security with STOMP & Message Broker Authorization",
    summary: "Authorize incoming WebSocket STOMP frame connections and protect message destinations (topics, queues).",
    scenario: "Real-time trading or chat platform where users subscribe to sensitive WebSocket message queues (`/topic/trade-updates/{userId}`).",
    architecture: "`ChannelSecurityInterceptor` intercepts STOMP frames (CONNECT, SUBSCRIBE, SEND). It validates authentication tokens on the CONNECT frame and validates destination authorization before routing messages.",
    code: `package com.example.security.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.security.config.annotation.web.messaging.MessageSecurityMetadataSourceRegistry;
import org.springframework.security.config.annotation.web.socket.AbstractSecurityWebSocketMessageBrokerConfigurer;

@Configuration
public class WebSocketSecurityConfig extends AbstractSecurityWebSocketMessageBrokerConfigurer {

    @Override
    protected void configureInbound(MessageSecurityMetadataSourceRegistry messages) {
        messages
            .nullDestMatcher().authenticated() // CONNECT, HEARTBEAT must be authenticated
            .simpSubscribeDestMatchers("/topic/public/**").permitAll()
            .simpSubscribeDestMatchers("/user/queue/**").authenticated()
            .simpDestMatchers("/app/admin/**").hasRole("ADMIN")
            .simpTypeMatchers(SimpMessageType.MESSAGE, SimpMessageType.SUBSCRIBE).authenticated()
            .anyMessage().denyAll();
    }

    @Override
    protected boolean sameOriginDisabled() {
        return false; // Enable CSRF protection for WebSockets
    }
}`,
    config: `# WebSocket STOMP configuration snippet`,
    testing: `@Test
void unauthenticatedSubscriptionIsDenied() {
    // Assert subscription to /user/queue/private fails without valid credentials
}`,
    pitfalls: "Disabling `sameOriginDisabled()` removes CSRF protection from your WebSocket endpoints, allowing cross-site WebSocket hijacking (CSWSH)."
  },
  {
    id: "ex-47",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "GraphQL",
    difficulty: "Advanced",
    title: "GraphQL Security with @PreAuthorize & DataFetcher Method Security",
    summary: "Secure GraphQL queries and mutations at the field resolver level using Spring for GraphQL and Spring Security.",
    scenario: "A single GraphQL `/graphql` POST endpoint with varying field-level authorization requirements (e.g. anyone can query public fields, but only admins can query salary information).",
    architecture: "Because all GraphQL queries route to `/graphql`, HTTP-level security is insufficient. Security is applied directly on `@QueryMapping` and `@SchemaMapping` controller methods using `@PreAuthorize`.",
    code: `package com.example.security.graphql;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

@Controller
public class EmployeeGraphQLController {

    @QueryMapping
    @PreAuthorize("hasRole('USER')")
    public Employee employeeById(@Argument Long id) {
        return new Employee(id, "John Doe", "Engineering");
    }

    @QueryMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public Double employeeSalary(@Argument Long id) {
        return 125000.00;
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public boolean terminateEmployee(@Argument Long id) {
        return true;
    }
}`,
    config: `# application.yml
spring:
  graphql:
    graphiql:
      enabled: true`,
    testing: `@Test
@WithMockUser(roles = {"USER"})
void regularUserCannotQuerySalaryField() {
    graphQlTester.document("query { employeeSalary(id: 1) }")
                 .execute()
                 .errors()
                 .expect(e -> e.getMessage().contains("Access Denied"));
}`,
    pitfalls: "Applying security only at `/graphql` in the HTTP filter chain allows unauthorized users to request any query fields. Field-level resolvers must be secured."
  },
  {
    id: "ex-48",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "Security Testing",
    difficulty: "Intermediate",
    title: "Testing Spring Security with @WebMvcTest, @WithMockUser & CSRF PostProcessors",
    summary: "Write comprehensive unit and integration tests for Spring Security configs and controller endpoints.",
    scenario: "Establishing a robust automated testing suite to verify authorization rules and prevent security regression in CI/CD pipelines.",
    architecture: "Uses `spring-security-test`. Provides `@WithMockUser`, `@WithUserDetails`, and `SecurityMockMvcRequestPostProcessors.csrf()` to test protected controller endpoints without manual mock setup.",
    code: `package com.example.security.test;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SecureApiController.class)
class SecureApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void anonymousUser_CannotPost_ReturnsUnauthorizedOrForbidden() throws Exception {
        mockMvc.perform(post("/api/orders").with(csrf()))
               .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "bob", roles = {"CUSTOMER"})
    void customerUser_CanPostWithCsrf() throws Exception {
        mockMvc.perform(post("/api/orders").with(csrf()))
               .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "bob", roles = {"CUSTOMER"})
    void customerUser_MissingCsrf_ReturnsForbidden() throws Exception {
        mockMvc.perform(post("/api/orders"))
               .andExpect(status().isForbidden());
    }
}`,
    config: `# test scope dependency:
# org.springframework.security:spring-security-test`,
    testing: `@Test
void allTestsPassGreen() {
    // Assert 100% coverage on authorization rules
}`,
    pitfalls: "Forgetting `.with(csrf())` on POST/PUT requests in tests will cause 403 Forbidden errors that look like authorization failures."
  },
  {
    id: "ex-49",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "Resource Server Testing",
    difficulty: "Advanced",
    title: "Integration Testing OAuth2 Resource Server with @WithMockBearerToken & WireMock",
    summary: "Test OAuth2 Resource Server endpoints using mock JWTs and WireMock to simulate remote IdP JWKS servers.",
    scenario: "Automating integration tests for an OAuth2 Resource Server without running an external Keycloak or Okta server in the build environment.",
    architecture: "`SecurityMockMvcRequestPostProcessors.jwt()` injects a pre-built mock `Jwt` directly into the `SecurityContext`, while WireMock stubs the remote JWKS public key endpoint.",
    code: `package com.example.security.test;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ResourceServerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void jwtWithCustomScopes_GrantsAccessToEndpoint() throws Exception {
        mockMvc.perform(get("/api/reports")
                .with(jwt().jwt(jwt -> jwt
                        .subject("analyst-123")
                        .claim("email", "analyst@company.com")
                ).authorities(new SimpleGrantedAuthority("SCOPE_reports:read"))))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.reportStatus").value("READY"));
    }
}`,
    config: `# test application.yml:
# spring.security.oauth2.resourceserver.jwt.jwk-set-uri: http://localhost:8089/.well-known/jwks.json`,
    testing: `@Test
void tokenWithMissingScope_Returns403() throws Exception {
    mockMvc.perform(get("/api/reports").with(jwt()))
           .andExpect(status().isForbidden());
}`,
    pitfalls: "When mocking JWTs, ensure you configure authority mappings to match your production converter (e.g. `SCOPE_` vs `ROLE_`)."
  },
  {
    id: "ex-50",
    level: 5,
    levelName: "Level 5: Enterprise & Zero-Trust",
    category: "Zero-Trust Mesh",
    difficulty: "Staff Architect",
    title: "Zero-Trust Microservice Mesh Security Architecture with SPIFFE/SPIRE & Token Exchange",
    summary: "Architect a cutting-edge Zero-Trust service mesh with cryptographic SPIFFE IDs and OAuth2 Token Exchange (RFC 8693).",
    scenario: "A financial core banking mesh where microservice identities are validated via short-lived X.509 SVIDs from SPIRE, and user tokens are exchanged across service boundaries.",
    architecture: "Each pod receives a SPIFFE verifiable identity document (SVID). Inter-service calls use mTLS with SPIFFE validation. When Service A calls Service B on behalf of a user, it uses RFC 8693 Token Exchange to mint a downscoped delegation token.",
    code: `package com.example.security.zerotrust;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Collections;

@Configuration
public class ZeroTrustMeshSecurityConfig {

    @Bean
    public SecurityFilterChain zeroTrustFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // Only allow callers with valid SPIFFE Workload identity:
                .requestMatchers("/mesh/transfers/**").hasRole("SPIFFE_PAYMENT_WORKLOAD")
                .anyRequest().authenticated()
            )
            .x509(x509 -> x509
                // Extract SPIFFE ID URI from X509 Subject Alternative Name (SAN)
                .subjectPrincipalRegex("spiffe://company.mesh/ns/prod/sa/(.*)")
                .userDetailsService(spiffeUserDetailsService())
            );

        return http.build();
    }

    @Bean
    public UserDetailsService spiffeUserDetailsService() {
        return workloadName -> {
            if ("payment-service".equals(workloadName)) {
                return new User(workloadName, "", 
                    Collections.singletonList(() -> "ROLE_SPIFFE_PAYMENT_WORKLOAD"));
            }
            throw new RuntimeException("Unauthorized SPIFFE workload identity: " + workloadName);
        };
    }
}`,
    config: `# SPIRE Agent socket configuration
spiffe:
  trust-domain: company.mesh
  socket-path: /tmp/spire-agent/public/api.sock`,
    testing: `@Test
void spiffeIdentityValidatedAgainstTrustDomain() {
    // Assert client certificate SAN matches spiffe://company.mesh/ns/prod/sa/payment-service
}`,
    pitfalls: "Always validate the SPIFFE Trust Domain (`company.mesh`). Accepting certificates from arbitrary trust domains compromises the zero-trust security perimeter."
  }
];

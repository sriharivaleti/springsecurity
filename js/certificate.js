/**
 * SpringSec Master - Certificate & Credential Badge Generator
 * High-resolution canvas rendering and export for portfolio & GitHub.
 */

class CertificateGenerator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.studentName = "Senior Cloud Architect";
    this.scorePercentage = 92;
    this.credentialId = "SEC6-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  init() {
    this.canvas = document.getElementById("cert-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.bindEvents();
    this.draw();
  }

  bindEvents() {
    const nameInput = document.getElementById("cert-name-input");
    if (nameInput) {
      nameInput.addEventListener("input", (e) => {
        this.studentName = e.target.value.trim() || "Senior Cloud Architect";
        this.draw();
      });
    }

    const downloadBtn = document.getElementById("cert-btn-download");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => this.downloadPng());
    }

    const copyBadgeBtn = document.getElementById("cert-btn-badge");
    if (copyBadgeBtn) {
      copyBadgeBtn.addEventListener("click", () => this.copyMarkdownBadge());
    }
  }

  setScore(pct) {
    this.scorePercentage = pct;
    this.draw();
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Background gradient (Deep Obsidian to Cyber Navy)
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#090d16");
    bgGrad.addColorStop(0.5, "#0f172a");
    bgGrad.addColorStop(1, "#070b12");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Cyber grid lines subtle background
    ctx.strokeStyle = "rgba(109, 179, 63, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 40; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 3. Luxurious Dual Border (Spring Green & Gold accents)
    ctx.strokeStyle = "#6db33f";
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(42, 42, w - 84, h - 84);

    // Corner decorative brackets
    const bracketSize = 25;
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(25, 25 + bracketSize);
    ctx.lineTo(25, 25);
    ctx.lineTo(25 + bracketSize, 25);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(w - 25 - bracketSize, 25);
    ctx.lineTo(w - 25, 25);
    ctx.lineTo(w - 25, 25 + bracketSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(25, h - 25 - bracketSize);
    ctx.lineTo(25, h - 25);
    ctx.lineTo(25 + bracketSize, h - 25);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w - 25 - bracketSize, h - 25);
    ctx.lineTo(w - 25, h - 25);
    ctx.lineTo(w - 25, h - 25 - bracketSize);
    ctx.stroke();

    // 4. Header: Spring Security Logo / Shield
    ctx.fillStyle = "#6db33f";
    ctx.font = "bold 20px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🛡️ SPRING SECURITY 6 & SYSTEM DESIGN MASTERY", w / 2, 95);

    // Subtitle
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 13px 'Inter', sans-serif";
    ctx.fillText("GLOBAL ARCHITECTURAL EXCELLENCE CREDENTIAL", w / 2, 125);

    // 5. Main Title: CERTIFICATE OF MASTERY
    const titleGrad = ctx.createLinearGradient(w / 2 - 250, 0, w / 2 + 250, 0);
    titleGrad.addColorStop(0, "#ffffff");
    titleGrad.addColorStop(0.5, "#6ee7b7");
    titleGrad.addColorStop(1, "#38bdf8");
    ctx.fillStyle = titleGrad;
    ctx.font = "bold 38px 'Inter', sans-serif";
    ctx.fillText("CERTIFICATE OF ARCHITECTURAL MASTERY", w / 2, 185);

    // 6. Presentation text
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "normal 16px 'Inter', sans-serif";
    ctx.fillText("This certifies with distinction that", w / 2, 235);

    // 7. Student Name
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 36px 'Inter', sans-serif";
    ctx.fillText(this.studentName, w / 2, 290);

    // Underline for name
    ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 220, 310);
    ctx.lineTo(w / 2 + 220, 310);
    ctx.stroke();

    // 8. Description Paragraph
    ctx.fillStyle = "#94a3b8";
    ctx.font = "normal 14px 'Inter', sans-serif";
    ctx.fillText(
      "has demonstrated verified professional competence in Spring Security 6 internals, modern Lambda DSL,",
      w / 2,
      350
    );
    ctx.fillText(
      "stateless JWT & OAuth2/OIDC topologies, Reactive WebFlux security, and Zero-Trust cloud microservice architecture.",
      w / 2,
      375
    );

    // 9. Badges and Verification Footer
    const footerY = 470;

    // Left: Credential ID
    ctx.textAlign = "left";
    ctx.fillStyle = "#64748b";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText("CREDENTIAL ID: " + this.credentialId, 70, footerY);
    ctx.fillText("SCORE: " + this.scorePercentage + "% (HONORS PASS)", 70, footerY + 20);
    ctx.fillText("VERIFIED: SPRING-BOOT-3 / SS-6.3+", 70, footerY + 40);

    // Center Seal
    ctx.textAlign = "center";
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(w / 2, footerY + 15, 34, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#10b981";
    ctx.font = "bold 11px 'Inter', sans-serif";
    ctx.fillText("VERIFIED", w / 2, footerY + 12);
    ctx.fillText("SECURITY", w / 2, footerY + 26);

    // Right: Date & Authority
    const issueDate = new Date().toISOString().split("T")[0];
    ctx.textAlign = "right";
    ctx.fillStyle = "#64748b";
    ctx.font = "12px 'Inter', sans-serif";
    ctx.fillText("ISSUED: " + issueDate, w - 70, footerY);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillText("SpringSec Master Curriculum Board", w - 70, footerY + 22);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "11px 'Inter', sans-serif";
    ctx.fillText("Cryptographic Authority Hash: SHA-256", w - 70, footerY + 40);
  }

  downloadPng() {
    if (!this.canvas) return;
    const link = document.createElement("a");
    link.download = `SpringSecurityMastery_${this.studentName.replace(/\\s+/g, "_")}.png`;
    link.href = this.canvas.toDataURL("image/png");
    link.click();
  }

  copyMarkdownBadge() {
    const badgeMarkdown = `[![Spring Security 6 Master](https://img.shields.io/badge/Spring_Security_6-Mastery_Certified-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)](https://github.com)`;
    navigator.clipboard.writeText(badgeMarkdown).then(() => {
      const copyBtn = document.getElementById("cert-btn-badge");
      if (copyBtn) {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = "✔ Badge Markdown Copied!";
        setTimeout(() => copyBtn.innerHTML = orig, 2000);
      }
    });
  }
}

window.certificateGen = new CertificateGenerator();

function showCertificateModal(score) {
  const modal = document.getElementById("cert-modal");
  if (modal) {
    modal.classList.add("open");
    window.certificateGen.setScore(score);
  }
}

function closeCertificateModal() {
  const modal = document.getElementById("cert-modal");
  if (modal) {
    modal.classList.remove("open");
  }
}

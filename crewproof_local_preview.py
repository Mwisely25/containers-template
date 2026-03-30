from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import webbrowser

HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CrewProof Local Preview</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card: #ffffff;
      --line: #e2e8f0;
      --text: #0f172a;
      --muted: #475569;
      --nav: #0b3666;
      --nav-light: #e0f2fe;
      --accent: #0369a1;
      --green: #047857;
      --green-bg: #d1fae5;
      --amber: #b45309;
      --amber-bg: #fef3c7;
      --shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
      --radius: 24px;
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }

    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .container {
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--line);
    }

    .topbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 0;
      gap: 20px;
    }

    .brand {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.03em;
    }

    .nav {
      display: flex;
      gap: 28px;
      font-size: 14px;
      font-weight: 600;
      color: var(--muted);
    }

    .cta {
      padding: 12px 18px;
      border-radius: 999px;
      background: #0f172a;
      color: white;
      font-size: 14px;
      font-weight: 700;
    }

    .hero {
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 40px;
      align-items: center;
      padding: 72px 0;
    }

    .eyebrow {
      margin-bottom: 16px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 12px;
      font-weight: 800;
    }

    h1 {
      margin: 0;
      font-size: 58px;
      line-height: 1.02;
      letter-spacing: -0.045em;
    }

    .lead {
      margin-top: 22px;
      max-width: 760px;
      font-size: 20px;
      line-height: 1.7;
      color: #334155;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 28px;
    }

    .btn-dark,
    .btn-light {
      padding: 14px 20px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 700;
      border: 1px solid transparent;
    }

    .btn-dark {
      background: #0f172a;
      color: white;
    }

    .btn-light {
      background: white;
      border-color: var(--line);
      color: var(--text);
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-top: 34px;
    }

    .stat {
      padding: 18px;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 20px;
      box-shadow: var(--shadow);
    }

    .stat .label {
      font-size: 13px;
      color: #64748b;
    }

    .stat .value {
      margin-top: 8px;
      font-size: 34px;
      font-weight: 800;
    }

    .shell {
      overflow: hidden;
      background: white;
      border: 1px solid var(--line);
      border-radius: 32px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
    }

    .shell-grid {
      display: grid;
      grid-template-columns: 250px 1fr;
      min-height: 620px;
    }

    .sidebar {
      padding: 22px;
      color: white;
      background: linear-gradient(180deg, #0b3666 0%, #0f4c8a 100%);
    }

    .sidebar small {
      display: block;
      color: #bae6fd;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .sidebar h3 {
      margin: 8px 0 0;
      font-size: 22px;
    }

    .project-box {
      margin-top: 18px;
      padding: 14px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .project-box .k {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #dbeafe;
    }

    .project-box .v {
      margin-top: 8px;
      font-weight: 700;
    }

    .menu {
      display: grid;
      gap: 8px;
      margin-top: 18px;
    }

    .menu-item {
      padding: 12px 14px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.92);
    }

    .menu-item.active {
      background: white;
      color: #0b3666;
    }

    .main {
      display: grid;
      grid-template-rows: auto 1fr;
      background: #f8fafc;
    }

    .main-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding: 20px 24px;
      background: white;
      border-bottom: 1px solid var(--line);
    }

    .crumb {
      font-size: 14px;
      color: #64748b;
    }

    .title {
      margin-top: 4px;
      font-size: 30px;
      font-weight: 800;
      letter-spacing: -0.035em;
    }

    .pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .pill {
      padding: 10px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 800;
    }

    .pill.green {
      background: var(--green-bg);
      color: var(--green);
    }

    .pill.amber {
      background: var(--amber-bg);
      color: var(--amber);
    }

    .pill.sky {
      background: var(--nav-light);
      color: var(--accent);
    }

    .workspace {
      display: grid;
      grid-template-columns: 1fr 300px;
      min-height: 480px;
    }

    .map-wrap {
      padding: 16px;
      background: white;
      border-right: 1px solid var(--line);
    }

    .map-card {
      min-height: 470px;
      height: 100%;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 24px;
      background: white;
      display: grid;
      grid-template-rows: auto 1fr;
    }

    .map-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 12px 14px;
      background: #f8fafc;
      border-bottom: 1px solid var(--line);
    }

    .toolbar-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chip {
      padding: 8px 12px;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: white;
      font-size: 13px;
      font-weight: 600;
      color: #334155;
    }

    .chip.dark {
      background: #0f172a;
      border-color: #0f172a;
      color: white;
    }

    .map-area {
      position: relative;
      background:
        radial-gradient(circle at 28% 30%, rgba(59, 130, 246, 0.25), transparent 17%),
        radial-gradient(circle at 65% 45%, rgba(14, 165, 233, 0.22), transparent 15%),
        linear-gradient(135deg, #dbeafe 0%, #eff6ff 35%, #f8fafc 68%, #e2e8f0 100%);
    }

    .grid-overlay {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(148, 163, 184, 0.18) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148, 163, 184, 0.18) 1px, transparent 1px);
      background-size: 48px 48px;
    }

    .marker {
      position: absolute;
      width: 16px;
      height: 16px;
      border-radius: 999px;
      box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.8);
    }

    .m1 { left: 18%; top: 24%; background: #0284c7; }
    .m2 { left: 42%; top: 37%; background: #10b981; }
    .m3 { left: 58%; top: 54%; background: #f59e0b; }
    .m4 { left: 70%; top: 29%; background: #ef4444; }

    .ticket-card {
      position: absolute;
      left: 22%;
      top: 28%;
      width: 170px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid var(--line);
      border-radius: 18px;
      box-shadow: var(--shadow);
    }

    .ticket-card .k {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #64748b;
      font-weight: 800;
    }

    .ticket-card .v {
      margin-top: 6px;
      font-size: 14px;
      font-weight: 800;
    }

    .ticket-card .s {
      margin-top: 6px;
      font-size: 12px;
      color: #475569;
    }

    .map-note {
      position: absolute;
      left: 16px;
      bottom: 16px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid var(--line);
      border-radius: 18px;
      box-shadow: var(--shadow);
    }

    .map-note strong {
      display: block;
      font-size: 14px;
    }

    .map-note span {
      font-size: 12px;
      color: #475569;
    }

    .side-panel {
      padding: 16px;
      background: #f8fafc;
    }

    .side-card {
      padding: 16px;
      background: white;
      border: 1px solid var(--line);
      border-radius: 24px;
      box-shadow: var(--shadow);
    }

    .tab-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tab {
      padding: 8px 12px;
      background: #f1f5f9;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #334155;
    }

    .side-title {
      margin-top: 18px;
      font-size: 15px;
      font-weight: 800;
    }

    .search {
      width: 100%;
      margin-top: 10px;
      padding: 12px 14px;
      border-radius: 16px;
      border: 1px solid #cbd5e1;
      font-size: 14px;
    }

    .box {
      margin-top: 16px;
      padding: 14px;
      border-radius: 18px;
      background: #f8fafc;
    }

    .box .k {
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 800;
    }

    .box ul {
      margin: 10px 0 0;
      padding-left: 18px;
      color: #334155;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .tag {
      padding: 8px 10px;
      border-radius: 999px;
      background: white;
      border: 1px solid var(--line);
      font-size: 12px;
      font-weight: 700;
      color: #334155;
    }

    .dark-box {
      margin-top: 16px;
      padding: 14px;
      border-radius: 18px;
      background: #0f172a;
      color: white;
    }

    .dark-box p {
      margin: 8px 0 0;
      color: #cbd5e1;
      font-size: 13px;
      line-height: 1.6;
    }

    section {
      padding: 84px 0;
      border-top: 1px solid var(--line);
    }

    h2 {
      margin: 0;
      font-size: 44px;
      line-height: 1.05;
      letter-spacing: -0.04em;
    }

    .cards3, .cards4 {
      display: grid;
      gap: 18px;
      margin-top: 38px;
    }

    .cards3 { grid-template-columns: repeat(3, 1fr); }
    .cards4 { grid-template-columns: repeat(4, 1fr); }

    .card {
      padding: 28px;
      background: white;
      border: 1px solid var(--line);
      border-radius: 28px;
      box-shadow: var(--shadow);
    }

    .icon {
      width: 48px;
      height: 48px;
      margin-bottom: 18px;
      border-radius: 16px;
      background: #e0f2fe;
    }

    .preview-block {
      width: 100%;
      height: 120px;
      margin-bottom: 18px;
      border-radius: 22px;
      background: linear-gradient(145deg, #dbeafe 0%, #eff6ff 50%, #f8fafc 100%);
    }

    .card h3 {
      margin: 0;
      font-size: 26px;
      letter-spacing: -0.03em;
    }

    .card p {
      margin: 14px 0 0;
      color: #475569;
      line-height: 1.7;
    }

    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 0.9fr;
      gap: 24px;
    }

    .form-card, .info-card {
      padding: 28px;
      background: white;
      border: 1px solid var(--line);
      border-radius: 28px;
      box-shadow: var(--shadow);
    }

    .form-grid {
      display: grid;
      gap: 14px;
      margin-top: 22px;
    }

    input, textarea {
      width: 100%;
      padding: 14px 16px;
      border-radius: 18px;
      border: 1px solid #cbd5e1;
      font-size: 14px;
      font-family: inherit;
    }

    textarea {
      min-height: 140px;
      resize: vertical;
    }

    .submit {
      width: max-content;
      padding: 14px 20px;
      border: none;
      border-radius: 999px;
      background: #0f172a;
      color: white;
      font-weight: 800;
      cursor: pointer;
    }

    .footer {
      background: white;
      border-top: 1px solid var(--line);
    }

    .footer-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
      max-width: 1240px;
      margin: 0 auto;
      padding: 26px 24px;
    }

    .footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      font-size: 14px;
      font-weight: 600;
      color: #475569;
    }

    @media (max-width: 1100px) {
      .hero { grid-template-columns: 1fr; }
      .cards3 { grid-template-columns: 1fr; }
      .cards4 { grid-template-columns: repeat(2, 1fr); }
      .contact-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 900px) {
      .shell-grid { grid-template-columns: 1fr; }
      .sidebar { display: none; }
      .workspace { grid-template-columns: 1fr; }
      .side-panel { display: none; }
      h1 { font-size: 44px; }
      h2 { font-size: 34px; }
      .stats { grid-template-columns: 1fr; }
      .nav { display: none; }
    }

    @media (max-width: 640px) {
      .cards4 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="container topbar-inner">
      <div class="brand">CrewProof</div>
      <nav class="nav">
        <a href="#home">Home</a>
        <a href="#platform">Platform</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#roles">Roles</a>
        <a href="#contact">Contact</a>
      </nav>
      <a class="cta" href="#contact">Book demo</a>
    </div>
  </header>

  <main class="container">
    <section id="home" class="hero" style="border-top:none;">
      <div>
        <div class="eyebrow">Telecom operations, 811 workflows, maps, and crews in one platform</div>
        <h1>Run telecom jobs, field updates, and redlines from one system</h1>
        <div class="lead">
          CrewProof gives admins, PMs, and crews one place to manage jobs, documents,
          extracted emails, maps, statuses, approvals, 811 workflows, and closeout data
          without digging through disconnected tools.
        </div>

        <div class="actions">
          <a class="btn-dark" href="#platform">Explore platform</a>
          <a class="btn-light" href="#contact">Talk to sales</a>
        </div>

        <div class="stats">
          <div class="stat">
            <div class="label">Active jobs</div>
            <div class="value">126</div>
          </div>
          <div class="stat">
            <div class="label">Open 811 items</div>
            <div class="value">19</div>
          </div>
          <div class="stat">
            <div class="label">Docs tracked</div>
            <div class="value">842</div>
          </div>
        </div>
      </div>

      <div class="shell">
        <div class="shell-grid">
          <aside class="sidebar">
            <small>CrewProof</small>
            <h3>Operations</h3>

            <div class="project-box">
              <div class="k">Active project</div>
              <div class="v">Beaver Rd Fiber Build</div>
            </div>

            <div class="menu">
              <div class="menu-item active">Overview</div>
              <div class="menu-item">Jobs</div>
              <div class="menu-item">811 / Tickets</div>
              <div class="menu-item">Permits</div>
              <div class="menu-item">Inspections</div>
              <div class="menu-item">Documents</div>
              <div class="menu-item">Extracted Emails</div>
              <div class="menu-item">CrewProof Sheets</div>
              <div class="menu-item">Redlines</div>
              <div class="menu-item">Team Check-In</div>
            </div>
          </aside>

          <div class="main">
            <div class="main-head">
              <div>
                <div class="crumb">Project / Overview</div>
                <div class="title">Beaver Rd - Overview Map</div>
              </div>

              <div class="pill-row">
                <div class="pill green">14 jobs active</div>
                <div class="pill amber">3 approvals needed</div>
                <div class="pill sky">7 tickets open</div>
              </div>
            </div>

            <div class="workspace">
              <div class="map-wrap">
                <div class="map-card">
                  <div class="map-toolbar">
                    <div class="toolbar-group">
                      <div class="chip">Satellite</div>
                      <div class="chip">Layers</div>
                    </div>
                    <div class="toolbar-group">
                      <div class="chip dark">Overview</div>
                    </div>
                  </div>

                  <div class="map-area">
                    <div class="grid-overlay"></div>
                    <div class="marker m1"></div>
                    <div class="marker m2"></div>
                    <div class="marker m3"></div>
                    <div class="marker m4"></div>

                    <div class="ticket-card">
                      <div class="k">Ticket</div>
                      <div class="v">811-20491</div>
                      <div class="s">Locate due tomorrow</div>
                    </div>

                    <div class="map-note">
                      <strong>Live project view</strong>
                      <span>Jobs, documents, permits, and ticket overlays</span>
                    </div>
                  </div>
                </div>
              </div>

              <aside class="side-panel">
                <div class="side-card">
                  <div class="tab-row">
                    <div class="tab">Markers</div>
                    <div class="tab">Permits</div>
                    <div class="tab">Tasks</div>
                    <div class="tab">Layers</div>
                  </div>

                  <div class="side-title">Filter & search</div>
                  <input class="search" placeholder="Search jobs, tickets, docs..." />

                  <div class="box">
                    <div class="k">Status summary</div>
                    <ul>
                      <li>Open jobs: 14</li>
                      <li>Pending permits: 5</li>
                      <li>Missing docs: 2</li>
                      <li>Latest field update: 18 min ago</li>
                    </ul>
                  </div>

                  <div class="box">
                    <div class="k">Accessible modules</div>
                    <div class="tags">
                      <span class="tag">Jobs</span>
                      <span class="tag">Docs</span>
                      <span class="tag">Emails</span>
                      <span class="tag">Sheets</span>
                      <span class="tag">Map</span>
                      <span class="tag">811</span>
                      <span class="tag">Redlines</span>
                    </div>
                  </div>

                  <div class="dark-box">
                    <strong>Admin controls</strong>
                    <p>Role and tier access determines which jobs, docs, maps, and workflows are visible.</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="platform">
      <div class="eyebrow">Platform modules</div>
      <h2>Everything needed to keep telecom work visible and organized</h2>

      <div class="cards3">
        <div class="card">
          <div class="icon"></div>
          <h3>Job and crew management</h3>
          <p>Create jobs, assign crews, track statuses, and keep every project moving from intake to closeout.</p>
        </div>
        <div class="card">
          <div class="icon"></div>
          <h3>811 and locate workflow</h3>
          <p>Organize tickets, permits, approvals, and underground workflow requirements in one operational view.</p>
        </div>
        <div class="card">
          <div class="icon"></div>
          <h3>Field updates and redlines</h3>
          <p>Capture real-time progress, map updates, documents, and as-built changes without losing job context.</p>
        </div>
      </div>
    </section>

    <section id="how-it-works">
      <div class="eyebrow">How it works</div>
      <h2>A cleaner way to move jobs from intake to closeout</h2>

      <div class="cards4">
        <div class="card">
          <div class="preview-block"></div>
          <h3>1. Intake the job</h3>
          <p>Pull in jobs from emails, documents, and system records so project information starts organized.</p>
        </div>
        <div class="card">
          <div class="preview-block"></div>
          <h3>2. Assign and control work</h3>
          <p>Set statuses, route work to PMs, crews, or contractors, and control access based on role and tier.</p>
        </div>
        <div class="card">
          <div class="preview-block"></div>
          <h3>3. Track field activity</h3>
          <p>Monitor crews, maps, ticket progress, documents, and live updates from the field.</p>
        </div>
        <div class="card">
          <div class="preview-block"></div>
          <h3>4. Close out with proof</h3>
          <p>Finish with redlines, reports, documents, and a job history that is easy to review later.</p>
        </div>
      </div>
    </section>

    <section id="roles">
      <div class="eyebrow">Built for every role</div>
      <h2>Give each person the right view of the job</h2>

      <div class="cards3">
        <div class="card">
          <h3>Admins</h3>
          <p>Control access, visibility, workflows, documents, and system-level settings across all jobs.</p>
        </div>
        <div class="card">
          <h3>Project managers</h3>
          <p>See job status, documents, quantities, permits, tickets, and next actions without chasing data.</p>
        </div>
        <div class="card">
          <h3>Crews and contractors</h3>
          <p>Get the jobs, maps, tickets, and updates they need without extra clutter or hidden workflow steps.</p>
        </div>
      </div>
    </section>

    <section id="contact">
      <div class="contact-grid">
        <div class="form-card">
          <div class="eyebrow">Get in touch</div>
          <h2>See how CrewProof fits your operation</h2>
          <div class="form-grid">
            <input placeholder="Name *" />
            <input placeholder="Email address *" />
            <input placeholder="Company *" />
            <textarea placeholder="Tell us about your workflow"></textarea>
            <button class="submit">Request demo</button>
          </div>
        </div>

        <div class="info-card">
          <div class="eyebrow">Contact</div>
          <h2 style="font-size:34px;">Talk to the CrewProof team</h2>
          <div style="margin-top:24px;color:#334155;line-height:1.9;">
            <p><strong>Email:</strong><br>csumner@managingwisely.net</p>
            <p><strong>Location:</strong><br>Atlanta, GA US</p>
            <p><strong>Best fit:</strong><br>Telecom contractors<br>Utility field teams<br>Project managers and operations leaders</p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <div class="brand" style="font-size:26px;">CrewProof</div>
      <div class="footer-links">
        <a href="#contact">Book demo</a>
        <a href="#platform">Platform</a>
        <a href="#contact">Privacy Policy</a>
      </div>
    </div>
  </footer>
</body>
</html>
"""

OUTPUT_FILE = Path("crewproof_local_preview.html")
HOST = "127.0.0.1"
PORT = 8000


def write_preview_file() -> None:
    OUTPUT_FILE.write_text(HTML, encoding="utf-8")
    print(f"Wrote {OUTPUT_FILE.resolve()}")


def serve_preview() -> None:
    os.chdir(OUTPUT_FILE.parent)
    server = HTTPServer((HOST, PORT), SimpleHTTPRequestHandler)
    url = f"http://{HOST}:{PORT}/{OUTPUT_FILE.name}"
    print(f"Serving CrewProof preview at {url}")

    try:
        webbrowser.open(url)
    except Exception:
        pass

    server.serve_forever()


def main() -> None:
    write_preview_file()
    serve_preview()


if __name__ == "__main__":
    main()

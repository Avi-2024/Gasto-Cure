# ClinixPulse UI/UX System Redesign — Technical Specification & Visual Architecture

## 1. Executive Summary & Intent

### 1.1 Intent & Why Now
ClinicRx has established a solid, reliable, offline-first clinical engine with complete patient management, master medicine formulary, pre-printed letterhead pad calibration, and WhatsApp follow-up reminders—backed by 109 passing unit and integration tests.

However, the existing visual interface is built on generic utility templates (standard Tailwind blues `#2563EB`, standard boxy cards, and plain layouts). The goal of this project is to execute a **complete, ground-up UI/UX redesign** that establishes **ClinixPulse**: an authentic, world-class outpatient operations platform for doctors and clinics.

The visual standard is calibrated against premier SaaS products like **Linear, Stripe, and Raycast**—prioritizing visual maturity, typography hierarchy, high-density data legibility, refined surfaces, and purposeful micro-interactions, while preserving **100% of the underlying business logic, state services, and test suites**.

---

## 2. Brand Identity & Design System: The ClinixPulse Language

### 2.1 Brand Concept & Philosophy
- **Brand Name:** ClinixPulse
- **Tagline:** *Secure outpatient operations platform. Every visit, securely in flow.*
- **Core Pillars:** Calm, Protective, Precise, Traceable, Reliable, Human-centered.
- **Key Motif:**
  - **Protected Boundary:** Hexagonal perimeter representing tenant isolation and clinic data protection.
  - **Flow Path:** Smooth continuous curve connecting the patient journey.
  - **Three Stage Nodes:**
    1. **Entry:** Registration, Check-in, Waiting Queue
    2. **Consultation:** Clinical action, Diagnosis, Rx Formulary Care Delivery
    3. **Closure:** Follow-up scheduling, Reminders, Prescription handover

### 2.2 Color Architecture
The design system moves entirely away from generic blue gradients, replacing them with ClinixPulse's organic, trustworthy forest and earth palette:

| Token Name | Hex Code | Role & Usage |
|---|---|---|
| `--clinixpulse-primary` | `#123A3A` | Deep Spruce Teal — Global sidebar, primary brand surfaces, high-contrast headings |
| `--clinixpulse-secondary` | `#287C75` | Lush Pine Teal — Interactive accents, active navigation states, primary buttons |
| `--clinixpulse-accent` | `#C9A45C` | Warm Ochre / Polished Amber — Stage 3 highlights, reminder cues, focus rings |
| `--clinixpulse-canvas` | `#F7FAF8` | Pale Mint/Neutral Canvas — Soft, glare-free background for long clinical days |
| `--clinixpulse-surface` | `#FFFFFF` | Pure White — Elevated cards, modals, sheets, and interactive controls |
| `--clinixpulse-border` | `#D9E6E2` | Soft Sage Border — Hairline structural separation without harsh contrast |
| `--clinixpulse-text-primary` | `#10201F` | Deep Slate-Teal — Ultra-readable primary text |
| `--clinixpulse-text-secondary` | `#4E6460` | Muted Slate — Subtitles, table labels, secondary metadata |
| `--clinixpulse-text-muted` | `#7D908C` | Neutral Grey-Teal — Timestamps, search placeholders, tertiary cues |
| `--clinixpulse-success` | `#2E7D5B` | Forest Green — Active patients, completed visits, positive vitals |
| `--clinixpulse-warning` | `#B7791F` | Deep Amber — Waiting queue, approaching follow-ups |
| `--clinixpulse-danger` | `#B94A48` | Crimson Rose — Allergies, overdue follow-ups, destructive actions |

### 2.3 Typography & Numerical Formatting
- **Headings & Display:** `Manrope`, sans-serif (weights 600, 700, 800) — clean geometric curves, friendly yet deeply authoritative.
- **UI Body & Controls:** `Inter`, sans-serif (weights 400, 500, 600) — optimal legibility across varying screen densities.
- **Data & Tables:** `font-variant-numeric: tabular-nums` — guarantees vertical alignment for blood pressure, pulse, weights, dates, and dosages.

### 2.4 Geometry, Surfaces & Shadows
- **Corner Radii:**
  - `rounded-lg` (8px): Badges, inline pills, compact inputs.
  - `rounded-xl` (12px): Standard buttons, dropdowns, table rows.
  - `rounded-2xl` (16px): Primary cards, drawers, modal dialogs.
  - `rounded-3xl` (24px): Hero banners, dashboard summary surfaces.
- **Elevation System:**
  - `shadow-xs`: `0 1px 2px rgba(18, 58, 58, 0.04)`
  - `shadow-sm`: `0 2px 8px rgba(18, 58, 58, 0.05)`
  - `shadow-md`: `0 8px 24px rgba(18, 58, 58, 0.07)`
  - `shadow-lg`: `0 16px 36px rgba(18, 58, 58, 0.10)`

---

## 3. Global Navigation & Layout Architecture

### 3.1 App Shell (`DashboardLayout`, `Sidebar`, `AppHeader`)
- **Left Navigation Sidebar:**
  - Background: Solid ClinixPulse Deep Teal (`#123A3A`) with subtle border `#1E4E4E`.
  - Brand Area: ClinixPulse SVG Hexagon brandmark with interconnected nodes, followed by clear wordmark "ClinixPulse" and clinic type badge.
  - Navigation Groups:
    - *Operations:*
      - Dashboard (`/dashboard`)
      - Patients (`/patients`)
      - Prescriptions History (`/prescriptions`)
      - New Prescription Studio (`/prescription/new`)
    - *Clinical Masters:*
      - Master Formulary (`/medicines`)
    - *Configuration:*
      - Settings & Print Calibration (`/settings`)
    - *Secondary Roles (accessible under role toggle):*
      - Appointments (`/appointments`), Billing (`/billing`), Reception (`/reception`) retain full route validity and receive ClinixPulse styling.
  - Active Nav Link: Soft Pine highlight (`bg-[#287C75] text-white shadow-sm`) with smooth spring transition.
  - Bottom Bar: Doctor profile pill with initials avatar and safe logout trigger.
- **Top Header Bar:**
  - Floating frosted card style (`bg-white/85 backdrop-blur-md border border-[#D9E6E2]`).
  - Left: Global instant patient quick search with `Ctrl+K` keyboard shortcut badge (opens search across all pages).
  - Right: Contextual Clinic Selector pill with live status dot, notification bell, and Doctor indicator.

---

## 4. Screen-by-Screen Redesign Specifications

### 4.1 Dashboard (`DashboardPage.jsx`)
- **Hero Banner:**
  - Replaces generic greeting with a modern welcome card featuring ClinixPulse's 3-node journey summary:
    - **Node 1: Entry:** Waiting Queue count (`localAppointments.getQueue().length`)
    - **Node 2: Consultation:** Consultations completed today (`localVisits` filtered by today's date)
    - **Node 3: Closure:** Scheduled Follow-ups & Reminders due within 2 days (`localVisits.getUpcomingFollowUps(2)`)
- **Quick Patient Search:**
  - Preserves `<QuickPatientSearch />` as the prominent inline hero search on Dashboard (with instant dropdown results, 1-click new patient trigger, and `Escape` key dismiss listener).
- **Follow-Up Reminders Widget:**
  - Completely restyled with clean status tags (`Today`, `Tomorrow`, `In 2 Days`, `Overdue`).
  - 1-click WhatsApp alert trigger opening formatted `wa.me` links with doctor & clinic details.
  - "Mark Reminded" action with persistent visual state.
- **Waiting Queue:**
  - Interactive table displaying patient wait times, reasons, and a prominent 1-click "Start Consultation" action navigating directly to `/prescription/new?patientId=...`.

### 4.2 Prescription Studio (`PrescriptionPage.jsx`)
- **Header & Patient Banner:**
  - Dynamic patient card displaying Patient Name, Age, Gender, Contact, and permanent ID.
- **Vitals Strip:**
  - 6-point clinical vitals grid (BP, Pulse, Blood Sugar, Weight, Temperature, Height) with contextual health indicator styling and tabular formatting.
- **Diagnosis & Complaints:**
  - Clinical complaint text area paired with quick diagnosis input.
- **Medicine Formulary Table (`MedicineTable.jsx` & `MedicineAutocomplete.jsx`):**
  - Instant autocomplete search linked to master medicine catalog.
  - Auto-fills default dosage, timing (Before Food / After Food), duration, and instructions.
  - Keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
  - Inline row controls for dosage frequency chips (`1-0-1`, `1-0-0`, `0-0-1`, `1-1-1`, `SOS`).
- **Follow-Up & Scheduling:**
  - Interactive chip selector (`7 Days`, `14 Days`, `30 Days`, `Custom Date`) with dynamic calendar preview.
- **Action Dock:**
  - Bottom floating dock with actions: Print Preview, Print Directly (incorporating top offset padding), and 1-Click WhatsApp Share.

### 4.3 Patient Directory & Profile Drawer (`PatientsPage.jsx`)
- **Directory Table:**
  - High-clarity tabular list displaying Patient ID, Name, Contact, Age/Gender, Last Visit, and Next Follow-Up.
  - Direct 1-click WhatsApp button and Edit button.
  - Supports URL query navigation: `?action=new` auto-opens Add Patient modal, `?patientId=...` auto-opens Profile drawer.
- **Profile Slide-Over Drawer (`PatientProfileDrawer.jsx`):**
  - Smooth slide-in panel with patient demographics, allergy alerts, and full chronological visit timeline.
  - Each visit card displays date, diagnosis, vitals, prescribed medicines, and reprint/WhatsApp share actions.
- **Add / Edit Patient Modal (`EditPatientModal.jsx`):**
  - Clean modal dialog preserving patient ID, with required field validations.

### 4.4 Master Medicine Management (`MedicinesPage.jsx`)
- **Formulary Grid:**
  - Master list of 38 Indian clinical formulations with quick search, category filtering (Antacid, Antibiotic, Analgesic, GI Motility, etc.), and active toggles.
- **Add / Edit Medicine Modal (`AddEditMedicineModal.jsx`):**
  - Preserves exact `Medicine Name *` input label (with placeholder `e.g. Pantoprazole 40mg (Pan-D)`) ensuring 100% schema and test compatibility, alongside strength, form, default dosage, timing, duration, and instructions.

### 4.5 Settings & Print Calibration (`SettingsPage.jsx` & `PrintSettingsTab.jsx`)
- **Letterhead Print Engine Calibration:**
  - Interactive millimeter offset slider (20mm to 140mm) controlling root CSS variables (`--print-top-offset`).
  - Dual Mode Toggle: *Pre-Printed Letterhead Pad Mode* (blanks digital header for physical pads) vs *Digital Letterhead Mode* (prints clinic header digitally).
  - Built-in Millimeter Calibration Ruler test print (`TestPrintSheet.jsx`).
- **Clinic Profile:**
  - Doctor name, clinic name, registration number, qualifications, phone, and address.
- **Data Backup & Restore:**
  - 1-click JSON export and full database restore.

---

## 5. Non-Goals & Anti-Goals

### Non-Goals
- Changing the underlying database/storage schema (`localStore.js` keys and structure remain strictly identical).
- Altering core routing paths (`/dashboard`, `/patients`, `/prescriptions`, `/prescription/new`, `/medicines`, `/settings` remain identical).
- Adding complex multi-tenant cloud backends or changing authentication into a 3rd-party SaaS provider (offline-first localStore remains the foundation).

### Anti-Goals
- **No generic AI-style purple/blue gradients:** The design must look like an authentic, high-end healthcare operations software product (ClinixPulse).
- **No breaking changes to automated tests:** All 109 existing unit, integration, and E2E tests MUST pass with 0 regressions.
- **No disruption to print calibration:** Physical letterhead pad top-margin offset slider and `@media print` CSS variables must work with pixel-perfect accuracy.

---

## 6. Approaches Considered & Selected

- **Approach 1 (Selected):** Unified Design System Refactor & In-Place Architectural Modernization.
  - Rewrites Tailwind design tokens, layouts, and components in-place.
  - Guarantees 100% test pass rate and uninterrupted business logic.
- **Approach 2 (Rejected):** Parallel Greenfield V2 Shell.
  - Duplicates existing routes and logic, risking out-of-sync code and broken test suites.
- **Approach 3 (Rejected):** Color/Token-only polish.
  - Rejected because the user explicitly requested a complete rethink of layouts, information architecture, and visual hierarchy.

---

## 7. Verification & Success Criteria

1. **Visual Quality:** The interface feels unmistakably premium, modern, calm, and trustworthy—matching the uploaded ClinixPulse brand identity sheet.
2. **Functionality Parity:** Every single existing feature (Patient CRUD, Formulary search & auto-fill, 6-point vitals, visit history timeline, pre-printed pad printing, and WhatsApp reminders) functions without flaw.
3. **Automated Test Suite:** All 8 test files (`localStore`, `MedicinesPage`, `MedicineAutocomplete`, `printSettings`, `prescriptionWorkflow`, `PatientManagement`, `FollowUpReminders`, and `endToEndWorkflow`) pass 100% green (109/109 tests).
4. **Production Build:** `npm run build` compiles cleanly with 0 syntax or bundling errors.

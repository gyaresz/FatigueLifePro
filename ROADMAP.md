# FatigueLife Pro - Development Roadmap

## Current Status
**Version:** v1.0.0 RC (Release Candidate)
**Status:** Stable / Code Freeze
**Focus:** Core Wirsching & Light implementation, Stability, User Education (Singularities).

---

## v1.1 Planned Features (Next Release)

### 1. Mean Stress Correction (Goodman)
**Problem:** The current version assumes fully reversed loading (Mean Stress = 0). Static loads (gravity, pretension) reduce fatigue life but are ignored.
**Solution:** Implement Goodman Mean Stress Correction.

**Technical Implementation Plan:**
1.  **New Inputs (ParametersSection.tsx):**
    *   `Mean Stress (Sigma_m)` [MPa] - User inputs the static stress at the hotspot.
    *   `Ultimate Tensile Strength (Rm)` [MPa] - Required for Goodman formula.

2.  **Mathematics (utils/math.ts):**
    *   The fatigue damage is calculated based on an *equivalent* alternating stress.
    *   Formula: 
        $$ \sigma_{RMS,eq} = \frac{\sigma_{RMS}}{1 - \frac{\sigma_{Mean}}{R_m}} $$
    *   Logic: We scale up the calculated RMS stress from the PSD before feeding it into the Wirsching damage equation.
    *   *Safety Check:* If $\sigma_{Mean} \ge R_m$, life is effectively 0 (static failure).

3.  **UI Updates:**
    *   Add "Static Load / Mean Stress" toggle in the Parameters section.
    *   Show both "Raw RMS" and "Equivalent RMS" in results.

### 2. Advanced Material Database
**Goal:** Reduce user error by providing preset materials.
*   Add a dropdown with common materials (Aluminium 6061-T6, Steel S355, Titanium Ti-6Al-4V).
*   Auto-fill $m$, $K$, and $R_m$ values.

---

## v1.2 Future Ideas

### 1. Steinberg Method (3-Band)
*   Alternative to Wirsching, popular in Electronics (PCB) cooling.
*   Assumes Gaussian distribution (1σ, 2σ, 3σ bins).

### 2. Miner's Rule Accumulator
*   Allow users to upload *multiple* PSD files (e.g., "Transportation X-axis", "Operation Y-axis").
*   Calculate damage for each event and sum them up ($D_{total} = \Sigma D_i$).

### 3. PDF Report Customization
*   Allow users to upload a company logo.
*   Add specific project fields (Part Number, Revision).

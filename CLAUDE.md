# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **KPR (Kredit Pemilikan Rumah / Home Mortgage) Simulation** web application built with vanilla HTML, CSS, and JavaScript. It calculates mortgage payments with various interest rate structures and supports prepayment scenarios.

## Running the Application

**No build process required.** Simply open `index.html` in a web browser.

```bash
# On macOS
open index.html

# Or use a simple HTTP server
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## File Structure

- **index.html** - Main HTML structure with form inputs and results display
- **style.css** - All styling including responsive design and modal styles
- **app.js** - Complete application logic (no modules or frameworks)

## Architecture Overview

### Global State
The application maintains three key global variables:
- `dataAngsuran[]` - Array of monthly payment objects, each containing:
  - `bulan` - Month number
  - `angsuran` - Monthly payment amount
  - `pokok` - Principal portion
  - `bunga` - Interest portion
  - `sisaPinjaman` - Remaining loan balance
  - `bungaTahunan` - Original annual interest rate for that period
- `riwayatPelunasan[]` - Array tracking all prepayment events
- `bulanDipilih` - Currently selected month index for prepayment operations

### Interest Rate Calculation Models

The application supports four distinct interest rate models:

1. **Fixed Rate (Bunga Fix)**: Single constant rate for entire loan term
   - Function: `hitungBungaFix()`

2. **Fixed + Floating Rate**: Fixed rate for initial period, then switches to floating rate
   - Function: `hitungBungaFixDanFloating()`
   - Triggered when user specifies `periodeFix` < total loan term

3. **Tiered Rates (Bunga Berjenjang)**: Multiple fixed rates for different periods
   - Function: `hitungBungaBerjenjang()`
   - Users can add multiple tiers dynamically

4. **Tiered + Floating**: Tiered rates followed by floating rate
   - Same function with `bungaFloating` parameter

### Key Calculation Functions

**Main Entry Point:**
```javascript
hitungKPR() // Validates inputs, routes to appropriate calculation function
```

**Interest Calculations (use standard amortization formula):**
- Monthly rate = Annual rate / 12 / 100
- Monthly payment = P × r × (1+r)^n / ((1+r)^n - 1)
- Where P=principal, r=monthly rate, n=remaining months

**Important:** When processing prepayments, the original `bungaTahunan` stored in each `dataAngsuran` entry is used to recalculate payments, NOT derived from the current payment structure. This preserves correct interest rates across fixed/floating/tiered periods.

### Prepayment System

**Modal-based UI flow:**
1. User clicks "Lunasi" button on any month row
2. `bukaPelunasan(index)` opens modal showing current loan state
3. User selects prepayment type (partial/full) and amount
4. `prosesPelunasan()` recalculates remaining payments using original interest rates
5. Prepayment event is saved to `riwayatPelunasan[]`
6. Table updates with special yellow-highlighted row showing prepayment details

**Prepayment row display:** After a month with prepayment, a special `.pelunasan-row` is inserted showing:
- Prepayment amount
- Old vs new monthly payment
- New principal/interest proportion percentages

## Dynamic UI Behavior

The form dynamically shows/hides sections based on user selections:

- **Interest type selector** toggles between Fixed and Tiered sections
- **Period fix input** (in Fixed mode) conditionally shows Floating rate input if period < loan term
- **Tiered mode** always shows optional floating rate input for period after last tier
- **Add tier button** dynamically creates new tier input groups with remove buttons

## Display and Formatting

- `tampilkanHasil()` - Renders complete payment schedule table
- `formatRupiah()` - Formats numbers as Indonesian Rupiah (Rp X.XXX.XXX)
- Table rows alternate colors with hover effects
- Prepayment event rows have distinct yellow background (`.pelunasan-row`)

## Working with This Codebase

**Adding new interest models:**
1. Create new calculation function following pattern of `hitungBungaFix()`
2. Each monthly entry MUST include `bungaTahunan` field for prepayment recalculations
3. Add UI section in `index.html` for new parameters
4. Update `hitungKPR()` routing logic

**Modifying calculations:**
- All interest calculations use monthly compounding
- Prepayment recalculations use the stored `bungaTahunan` from `dataAngsuran[i].bungaTahunan`
- Never derive interest rate from `bunga/sisaPinjaman` ratio as this breaks with prepayments

**Styling:**
- Main gradient theme: `#667eea` to `#764ba2` (purple gradient)
- Pelunasan rows: `#fff3cd` background with `#ffc107` borders
- All form inputs have consistent styling in `.form-group`
- Modal uses fixed positioning with semi-transparent overlay

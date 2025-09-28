# OPCP IPS FHIR Scaffold (JSON) — Canonical Structure

This document describes the **stabilized** OPCP International Patient Summary (IPS) format we are using, and
ships with a ready-to-fill JSON scaffold: `ips-ips-scaffold.json`.

> **Key principles**
> - The file is an IPS **document Bundle**; `entry[0]` is always the **Composition**.
> - Sections are present **only when data exists** (no empty sections).
> - Clinical diagnostics (labs, imaging, DRs, vitals) live **under the care-setting section** for the
>   Encounter they belong to — not in global results/imaging sections.
> - The ABO/Rh **blood group** Observation (LOINC `882-1`) is treated as a **stable patient attribute** and
>   referenced from **Demographics & Identifiers**.
> - All datetimes use **ISO 8601** with **explicit offset** (e.g., `2025-10-01T11:20:00-04:00`).

---

## 1) Bundle

- `resourceType`: `Bundle`
- `type`: `document`
- `meta.profile`: `http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips`
- `identifier` (URN/UUID) — stable per document instance
- `timestamp`: latest event time (ISO 8601 with offset)
- `entry[0]`: **Composition** (IPS)

The scaffold includes minimal **Patient** and **Organization** entries and example **Encounter**s for each care setting.

---

## 2) Composition (IPS)

- `meta.profile`: `http://hl7.org/fhir/uv/ips/StructureDefinition/Composition-uv-ips`
- `status`: `final`
- `type`: LOINC **60591-5** “Patient summary Document”
- `identifier`: stable `urn:uuid:` (recommend v5 derived from Bundle identifier)
- `date`: document issue/update datetime
- `title`: free text
- `subject`: Patient (fullUrl)
- `author[]`: Organization(s) (fullUrl)

### 2.1 Sections and canonical order

Only include sections with data. When present, sections appear in this order:

1. **Demographics & Identifiers** — LOINC **45970-1**  
   - Must include the **Patient** entry and may include stable demographic Observations (e.g., ABO/Rh 882-1).

2. **Allergies** — LOINC **48765-2**  
   - Entries: `AllergyIntolerance`

3. **Problem/Diagnosis** — LOINC **11450-4** (Problem list)  
   - Entries: `Condition` (current diagnoses/problems)

4. **Medications (Maintenance)** — LOINC **10160-0** (History of medication use)  
   - Entries: `MedicationStatement` (ongoing meds)

5. **Operational timeline (care settings)** — **no global Results/Imaging sections**. Each care-setting section holds the **Encounter** and any diagnostics/procedures/notes that occurred during that Encounter. The canonical sequence:

   - Point of Injury (POI)  
   - Casualty Evacuation (CASEVAC)  
   - Ambulance Exchange Point (AXP)  
   - Medical Evacuation (MEDEVAC)  
   - **Role 1 PHEC** (Pre‑Hospital Emergency Care)  
   - **Role 1 PHC** (Primary Healthcare)  
   - Forward TACEVAC  
   - Role 2  
   - Rear TACEVAC  
   - Role 3  
   - STRATEVAC

   For each care-setting section:
   - Include **one Encounter reference** (at minimum).  
   - Add other entries that **belong to that Encounter** (e.g., `Observation`, `DiagnosticReport`, `ImagingStudy`, `Procedure`, `MedicationAdministration`, `CarePlan`, etc.).

---

## 3) Encounters (care settings)

Each care-setting is realized as an **Encounter** resource and referenced from its section.

### 3.1 Encounter fields (minimal)

- `class` — recommend:
  - POI/AXP/PHC: `AMB`
  - PHEC/CASEVAC/MEDEVAC/FWD/REAR/STRATEVAC: `EMER`
  - Role 2 / Role 3: `IMP`
- `type` — use **SNOMED CT** where available (e.g., A&E service, inter‑facility transfer, aeromedical evacuation). The scaffold includes a `text` placeholder — replace with codings.
- `subject` — Patient (fullUrl)
- `period.start` / `period.end` — contiguous timeline with correct offsets

> **Contiguity rule:** Ensure periods are **non‑overlapping and contiguous** across the pathway unless clinically justified.

---

## 4) Diagnostics placement rule

- If a diagnostic resource (`Observation`, `DiagnosticReport`, `ImagingStudy`) has `encounter.reference`, **place its entry** in the section that references the **same Encounter**.
- If missing `encounter`:
  - If timestamp falls within an Encounter period → place under that Encounter’s section.
  - Otherwise (e.g., baseline) → either omit or place in **Demographics** (ABO/Rh pattern) or a small **Unassigned diagnostics (pre‑incident)** section (optional).

---

## 5) Identifiers & stability

- `Bundle.identifier` and `Composition.identifier` should be **stable URNs**.  
  We recommend `Composition.identifier` = v5 UUID derived from `(Bundle.identifier.system|value)` to keep it stable across saves.

---

## 6) Date/time and timezone

- Use **ISO 8601** with explicit timezone offset (example: `2025-10-01T11:20:00-04:00`).  
- Store times in UTC internally if you like, but always serialize with the **offset** for this dossier.

---

## 7) Notes for implementers

- **No empty sections**. If a section has no entries, drop the section (or use `section.emptyReason` only if you have a deliberate rationale).
- Put **Composition** first in `Bundle.entry`.
- Validate against the IPS IG profiles for Bundle, Composition, Patient, etc.
- Keep **section codes** where IPS defines them (Demographics, Allergies, Problems, Medications). Operational sections don’t require a `code` unless you choose a sensible coding — titles are sufficient.

---

## 8) What to fill in the scaffold

- Replace all `REPLACE-*` values (identifiers, names, addresses).
- Replace Encounter `type.text` with appropriate **SNOMED CT** codings.
- Add clinical entries (`Procedure`, `MedicationAdministration`, `Observation`, etc.) under the **right care-setting section** and link them with `encounter.reference`.

---

## 9) Files

- Scaffold JSON: **ips-ips-scaffold.json**  
- This spec: **ips-ips-spec.md**


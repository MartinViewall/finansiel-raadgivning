# Finansiel Rådgivning – Projektkontekst

Dette dokument sikrer kontinuitet på tværs af chat-sessioner i dette Manus Project.
Læs dette dokument i starten af enhver ny udviklingsopgave.

---

## Projektidentitet

- **Projektnavn:** `finansiel-raadgivning`
- **Projektsti:** `/home/ubuntu/finansiel-raadgivning`
- **Live URL (intern):** `https://finansraad-3cvu5yux.manus.space`
- **Alternativ URL:** `https://serenfinans.manus.space`
- **GitHub:** `https://github.com/MartinViewall/finansiel-raadgivning`
- **Seneste checkpoint:** `7a917b00`
- **Adgangskode:** Sat som `APP_PASSWORD` i Secrets (Holte2026!)

---

## Formål

Internt rådgivningsværktøj til en uvildig finansiel rådgivningsvirksomhed.
Bruges til at illustrere betydningen af finansielle valg overfor kunder — ikke til offentlig brug.

---

## Tech Stack

| Lag | Teknologi |
|---|---|
| Frontend | React 19 + Tailwind 4 + Recharts |
| Backend | Express 4 + tRPC 11 |
| Database | MySQL/TiDB (Manus-managed) |
| ORM | Drizzle ORM |
| Auth | Adgangskodebeskyttelse via `APP_PASSWORD` env-variabel |
| Sprog | Dansk UI, dansk talformat (tusindtalsseparator: `.`, decimal: `,`) |

---

## Databaseskema

### `investment_products`
```
id              INT AUTO_INCREMENT PK
name            VARCHAR(255)       -- Fuldt produktnavn inkl. selskab og risiko
company         VARCHAR(255)       -- Selskabsnavn (f.eks. "PFA", "Nordea Pension Mix")
riskLevel       VARCHAR(100)       -- Risikoniveau (f.eks. "Høj", "Middel", "Lav")
yearsToPension  INT NULL           -- År til pension (f.eks. 10, 15, 20)
aop             DECIMAL(5,2) NULL  -- Årlige omkostninger i procent
nhmId           VARCHAR(100) NULL  -- Eksternt NHM-ID fra Excel-filen
description     TEXT NULL
color           VARCHAR(7)         -- Hex-farve til graf (f.eks. "#E63946")
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

### `annual_returns`
```
id              INT AUTO_INCREMENT PK
productId       INT FK → investment_products.id
year            INT                -- Årstal (f.eks. 2021)
returnPct       DECIMAL(8,4)       -- Afkast i procent (f.eks. 11.7 = 11,7%)
createdAt       TIMESTAMP
```

**Vigtig note:** 498 produkter og 4.914 årsafkast (2006–2025) er importeret fra Excel-filen `Return_Yearly_202602.xlsx`.

---

## Nøglefiler

```
server/routers.ts          ← Alle tRPC-procedures inkl. calculator.project
server/db.ts               ← Database-helpers
drizzle/schema.ts          ← Drizzle-skema (kilde til sandhed for DB-struktur)
client/src/pages/Calculator.tsx     ← Hoved-beregnerside
client/src/pages/Products.tsx       ← Produktadministrationsside
client/src/components/ProductSelector.tsx  ← 3-trins kaskade-produktvælger
client/src/components/DashboardLayout.tsx  ← Sidebar-layout
client/src/contexts/PasswordGateContext.tsx ← Adgangskodebeskyttelse (Context)
client/src/pages/PasswordGate.tsx   ← Login-skærm
```

---

## Projektionsmotor (kritisk viden)

Fremskrivningen bruger **faktiske historiske årsafkast cyklisk** — IKKE et gennemsnit.

```ts
function projectPortfolio(
  initialCapital: number,
  annualContribution: number,
  historicalReturns: number[],  // sorteret ældste→nyeste, 2026 EKSKLUDERET
  horizonYears: number
): { year: number; value: number }[]
```

**Eksempel:** 1.000.000 kr., 0 kr. indbetaling, afkast [10%, -5%, 12%], 3 år:
- År 0: 1.000.000
- År 1: 1.100.000 (× 1,10)
- År 2: 1.045.000 (× 0,95)
- År 3: 1.170.400 (× 1,12)

**Pensionsfremskrivning i boblerne** bruger derimod `projectWithRate` (fast gennemsnitsrate) — ikke den cykliske funktion.

---

## Produktvælger (3-trins kaskade)

Komponenten `ProductSelector.tsx` filtrerer i tre trin:
1. **Selskab** — dropdown med alle unikke `company`-værdier
2. **Risikoniveau** — filtreret på valgt selskab
3. **År til pension** — filtreret på valgt selskab + risikoniveau

Rådgiveren kan vælge op til 3 produkter til sammenligning. Det første valgte produkt markeres automatisk som "Nuværende" (baseline).

---

## UI-beslutninger og designregler

- **Farvepalette:** Dyb navy (`#0a1628`) baggrund, guld (`#b8963e`) accent, hvid tekst
- **Fonte:** Inter (brødtekst), Playfair Display (overskrifter)
- **Tusindtalsseparator:** Dansk format — punktum som tusindtalsseparator, komma som decimal (2.000.000 kr.)
- **Y-akse:** Starter ved laveste datapunkt × 0,9 (10% buffer) — aldrig ved 0
- **2026 ekskluderet:** Indeværende ufuldstændige år vises kun som orientering i tabellen, aldrig i beregninger
- **Ø/år\*:** Beregnes for de seneste N år svarende til valgt tidshorisont (ikke hele perioden)
- **Max 3 produkter** i grafen ad gangen for overskuelighed

---

## Kendte faldgruber — undgå disse fejl

1. **Cyklisk vs. gennemsnit:** Grafen SKAL bruge cykliske faktiske afkast. Brug IKKE gennemsnit til grafen.
2. **2026-filtrering:** Filtrer altid `year < new Date().getFullYear()` fra inden beregning.
3. **PasswordGate som Context:** Adgangskodestatus er en React Context (`PasswordGateContext`), IKKE lokal state. Brug aldrig `useState` til dette — det bryder synkroniseringen.
4. **Produktfarver:** Tildeles automatisk fra en fast palette i `ProductSelector`. Ændr ikke farvelogikken uden at teste alle 3-produkt-kombinationer.
5. **Drizzle-migration:** Kør altid `pnpm drizzle-kit generate` → læs SQL → `webdev_execute_sql`. Kør ALDRIG `drizzle-kit push` direkte.

---

## Gennemførte features (status marts 2026)

- [x] Adgangskodebeskyttet login (APP_PASSWORD)
- [x] Produktdatabase med 498 produkter importeret fra Excel
- [x] Årsafkast 2006–2025 (4.914 datapunkter)
- [x] 3-trins kaskade-produktvælger (Selskab → Risiko → År til pension)
- [x] Fremskrivningsgraf med faktiske historiske afkast (cyklisk)
- [x] Sammenlignende summary-kort med slutværdi og delta vs. baseline
- [x] Pensionsfremskrivning i summary-kort (År til pension + manuel afkastforskel %)
- [x] Historisk afkasttabel med år-fra/til filter
- [x] Ø/år\* beregnet for valgt tidshorisont
- [x] Y-akse med 10% buffer (ikke fra 0)
- [x] Dansk tusindtalsseparator i alle talindtastninger
- [x] Produktadministrationsside (tilføj/rediger/slet produkter og afkast)
- [x] Excel-importscript (`/home/ubuntu/import_excel.py`)

---

## Planlagte næste features (ikke implementeret endnu)

- [ ] Excel-upload via UI — månedlig opdatering af afkastdata uden at køre script manuelt
- [ ] Omkostningsberegner — ÅOP-baseret sammenligning (administration + forsikring)
- [ ] PDF-rapport — kundevendt rapport med graf, tabel og ansvarsfraskrivelse

---

## Excel-import (til månedlige opdateringer)

Scriptet ligger på: `/home/ubuntu/import_excel.py`
Kopi i skill: `/home/ubuntu/skills/financial-advisory-tool/references/import_excel.py`

Kør med:
```bash
DATABASE_URL='<hent fra server process env>' python3.11 /home/ubuntu/import_excel.py
```

Excel-filformat forventes med kolonner: `NHM_ID`, `Name`, `Company`, `Risk`, `YearsToPension`, `AOP`, og årskolonner som `2006`, `2007`, ..., `2025`, `2026`.

---

## Skill

En genanvendelig skill er oprettet:
`/home/ubuntu/skills/financial-advisory-tool/SKILL.md`

Den indeholder arkitektur, projektionsmotor-implementering og importscript til brug i fremtidige lignende projekter.

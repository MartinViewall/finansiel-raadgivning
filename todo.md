# Finansiel Rådgivning – TODO

## Database & Backend
- [x] Define schema: `investment_products` table (id, name, description, color, createdAt, updatedAt)
- [x] Define schema: `annual_returns` table (id, productId, year, returnPct, createdAt)
- [x] Generate and apply migration SQL
- [x] DB helpers: getProducts, getProductWithReturns, upsertProduct, deleteProduct, upsertReturn, deleteReturn
- [x] tRPC router: products.list, products.get, products.create, products.update, products.delete
- [x] tRPC router: returns.upsert, returns.delete
- [x] tRPC router: calculator.project (projection engine)
- [x] Password protection: simple PIN/password stored as env secret, checked on app load

## Frontend
- [x] Global design system: elegant color palette (deep navy/gold/white), Inter font, subtle shadows
- [x] Dashboard layout with sidebar navigation
- [x] Password gate page (lock screen before app access)
- [x] Product management page: list products, add/edit/delete with inline return data per year
- [x] Return calculator page: inputs (initial capital, annual contribution, horizon, product selection)
- [x] Projection chart: Recharts line chart with colored lines per product, end-value cards
- [x] Summary cards above chart (like inspiration image): show final value + delta vs baseline
- [x] Assumption note below chart (e.g. "Baseret på historiske afkast – ikke garanti for fremtidige afkast")
- [x] Responsive and polished UI throughout

## Testing
- [x] Vitest: projection engine calculation correctness
- [x] Vitest: password gate + projection engine (10 tests passing)

## Fase 2 – Excel-import og forbedringer

- [x] Tusindtalsseparator "." i alle talindtastninger (2.000.000 kr.)
- [x] Udvid databaseskema med company, riskLevel, yearsToPension, aop, nhmId felter
- [x] Importer alle 498 produkter fra Excel inkl. årsafkast 2006–2026 (4.914 afkastpunkter)
- [x] 3-trins kaskade produktvælger: Selskab → Risikoniveau → År til pension
- [x] Opdater produktadministrationssiden til at vise de nye felter (company/risk/years visible in list)

## Fase 3 – UX-forbedringer

- [x] Udelad 2026 fra beregning og graf (ufuldstændigt år)
- [x] År-fra/til filter på historisk afkasttabel i beregneren
- [x] Vis fulde produktnavne i produktvælger (ingen afskæring)
- [x] Reducer unødvendig luft i venstre/højre margen på beregnerside

## Fase 4 – Graf og pensionsfremskrivning

- [x] Y-akse starter ved laveste datapunkt minus 10% buffer (ikke 0)
- [x] Ø/år* beregnes for de seneste X år svarende til valgt tidshorisont (ikke hele perioden)
- [x] Venstre panel: tilføj "År til pension" og "Afkastforskel %" (forududfyldt med Ø/år-forskel, kan overskrives)
- [x] Boblerne over grafen viser ekstra linje: "Ved pension om X år: +Y kr." baseret på pensionsparametrene
- [x] Grafen ændres ikke – kun boblerne udvides

## Fase 5 – Bugfix: Beregningsmotor

- [x] Fix fremskrivningsmotor: brug horisontbaseret gennemsnitsafkast (Ø/Når) som fast rate fremfor cyklisk gentagelse af historiske år
- [x] Verificer at graf og slutværdier nu matcher Ø/år*-tallene i tabellen

## Fase 6 – Korrekt grafberegning

- [x] Graf bruger faktiske årsafkast år for år (cyklisk gentagelse ved fremskrivning ud over historik)
- [x] Boblernes slutværdi beregnes også med faktiske årsafkast (ikke gennemsnit)
- [x] Ø/år* i tabel og pensionsfremskrivning i boblerne forbliver gennemsnitsbaseret

## Fase 7 – Excel-upload via UI

- [x] Backend: Express multipart upload endpoint `/api/upload-excel` der modtager .xlsx-fil
- [x] Backend: Parse Excel med exceljs npm-pakke (samme logik som import_excel.py)
- [x] Backend: Upsert produkter og afkast — opdater eksisterende, tilføj nye, bevar uberørte
- [x] Backend: Returnér importresultat (antal opdaterede/nye produkter, nye afkastpunkter, fejl)
- [x] Frontend: Upload-sektion på Produktsiden med drag-and-drop eller fil-vælger
- [x] Frontend: Vis importresultat-opsummering efter upload (tabel med ændringer)
- [x] Frontend: Fejlhåndtering — vis tydelig besked hvis fil har forkert format
- [x] Test: Verificer at upsert ikke sletter eksisterende data der ikke er i den nye fil

## Fase 8 – Omkostningsberegner

- [x] Opret ny side: `client/src/pages/CostCalculator.tsx`
- [x] Inputfelter: År til Pension, Depot (kr.), Årlig indbetaling (kr.), Omkostning i dag (%), Omkostning ny (%)
- [x] Fast afkast 6,5% (ikke vist i UI)
- [x] Beregning 1 – Årlig besparelse (i dag): Årlige omkostninger i kr. i dag, Årlige omkostninger i kr. fremadrettet, Årlig besparelse
- [x] Beregning 2 – Effekt med rentes rente: Fremtidig værdi af den akkumulerede besparelse over pensionshorisonten
- [x] Tusindtalsseparator på alle talindtastninger og resultater
- [x] Tilføj rute i App.tsx og navigationspunkt "Omkostningsberegner" i sidebar

## Fase 8b – Rettelse af beregningsmodel i Omkostningsberegner

- [x] Ret beregning til Excel-model: FV(netto-afkast_ny) − FV(netto-afkast_i_dag), dvs. depot × (1 + r − cost)^n for hvert scenarie
- [x] Vis depotets slutværdi i begge scenarier i resultatkortene
- [x] Opdater "Effekt med rentes rente"-kortet til at vise forskel i slutværdi (ikke annuitetsformel)

## Fase 9 – Overførsel og år-for-år tabel i Omkostningsberegner

- [x] Opret delt React context (CalculatorContext) med depot, årlig indbetaling og år til pension
- [x] Afkastberegneren skriver sine værdier til contexten når de ændres
- [x] Omkostningsberegneren læser fra contexten som startværdier (kan overskrives lokalt)
- [x] Vis lille "Overført fra Afkastberegner"-badge når værdier er hentet fra context
- [x] Tilføj sammenklappelig år-for-år tabel under resultatkort 2
- [x] Tabellen viser: År, Depotværdi (ÅOP i dag), Depotværdi (ÅOP ny), Forskel
- [x] Tusindtalsseparator i tabellen, alternerende rækkefarver

## Fase 10 – Navy farvetema og PDF-rapport

- [x] Opdater global farvepalette til mørk navy (sidebar, kort, accenter) i index.css
- [x] Tilpas DashboardLayout sidebar til navy baggrund med lyse tekster
- [x] Backend: Installer pdfkit og byg /api/generate-pdf endpoint
- [x] Backend: PDF-sektioner: forside (klientnavn, rådgivernavn, dato), omkostningsanalyse, afkastsammenligning
- [x] Backend: Endpoint modtager JSON-payload med valgte sektioner og beregningsdata
- [x] Frontend: "Generer rapport"-knap tilgængelig fra begge beregnersider
- [x] Frontend: Modal med felter til klientnavn, rådgivernavn og valg af sektioner (Omkostningsberegner / Afkastberegner / Begge)
- [x] Frontend: PDF downloades direkte i browseren ved klik
- [x] Test: Verificer at PDF genereres korrekt med begge sektioner

## Fase 11 – Bevar state ved navigation

- [x] Udvid CalculatorContext til at gemme alle Afkastberegner-inputs: initialCapital, annualContribution, horizonYears, selectedProductIds, pensionYearsRaw, pensionReturnOverride, tableYearFrom, tableYearTo
- [x] Udvid CalculatorContext til at gemme alle Omkostningsberegner-inputs: depot, annualContribution, yearsToPension, costTodayPct, costNewPct
- [x] Afkastberegneren initialiserer sin state fra context (ikke hardkodede defaults)
- [x] Omkostningsberegneren initialiserer sin state fra context (ikke hardkodede defaults)
- [x] Begge sider skriver ændringer løbende til context så state bevares ved navigation

## Fase 12 – Målberegner

- [x] Opret ny side: `client/src/pages/GoalCalculator.tsx`
- [x] Mode 1 – Opsparing til engangsmål: Inputfelter: Mål v. pension (kr.), Depot i dag (kr.), År til pension, Afkast (%). Resultat: Krævet årlig indbetaling for at nå målet
- [x] Mode 2 – Opsparing til løbende udbetaling: Inputfelter: Ønsket årlig udbetaling (kr.), Udbetalingsperiode (år), Depot i dag (kr.), År til pension, Afkast (%). Resultat: Krævet kapital ved pension + krævet årlig indbetaling
- [x] Viser supplerende info: Hvad depot i dag vokser til, manglende beløb, og krævet månedlig indbetaling
- [x] Tusindtalsseparator på alle tal-inputs og resultater
- [x] Tilføj rute `/goal-calculator` i App.tsx og navigationspunkt "Målberegner" i sidebar
- [x] Udvid CalculatorContext med state for GoalCalculator (alle inputs bevares ved navigation)
- [x] PDF-modal understøtter GoalCalculator-data som valgbar sektion

## Fase 13 – Målberegner i PDF-rapport

- [x] Udvid `server/generatePdf.ts` med en `goalSection` der viser mode, inputs og resultater
- [x] Opdater `server/pdfRouter.ts` til at modtage og videresende `goalData` payload
- [x] Opdater `client/src/components/PdfReportModal.tsx` med "Målberegner" som valgbar sektion
- [x] Opdater `client/src/pages/GoalCalculator.tsx` til at sende goalData til modalen
- [x] Opdater `client/src/pages/Calculator.tsx` og `CostCalculator.tsx` til at sende goalData fra context

## Fase 14 – Self-hosting forberedelse

- [x] Audit Manus-specifikke afhængigheder (OAuth, database URL, storage, LLM, notifications)
- [x] Fjern/erstat Manus OAuth — brug kun PasswordGate (allerede implementeret)
- [x] Tilpas database-forbindelse til standard MySQL (fjern Manus-specifikke env-navne)
- [x] Tilpas filupload/storage til lokal disk eller S3-kompatibel (MinIO)
- [x] Opret `docker-compose.yml` med app + MySQL
- [x] Opret `.env.example` med alle nødvendige miljøvariabler
- [x] Skriv `DEPLOY.md` med trin-for-trin deploymentguide

## Fase 15 – Sammenklappelige paneler i Afkastberegner

- [x] Flyt Pensionsfremskrivning-boksen til under Produkter i layoutet
- [x] Tilføj collapse-toggle (ChevronUp/Down) i øverste højre hjørne af "Parametre"-boksen
- [x] Tilføj collapse-toggle i øverste højre hjørne af "Produkter"-boksen
- [x] Tilføj collapse-toggle i øverste højre hjørne af "Pensionsfremskrivning"-boksen
- [x] Bevar collapse-state i CalculatorContext så det huskes ved navigation

## Fase 16 – Din Økonomiske Kapacitet

- [x] Opret `client/src/pages/CapacityCalculator.tsx`
- [x] Globale parametre: År til pension, Udbetalingsperiode, Ønsket månedligt forbrug, Civilstatus (Enlig/Par)
- [x] Miljø 1 – Pension: formue, månedlig indbetaling, afkast, PAL-skat, udbetalingsskat — korrekt annuitetsformel med månedligt effektivt afkast
- [x] Miljø 2 – Frie midler: formue, månedlig opsparing, afkast, beskatningssats — løbende beskatning af afkast
- [x] Miljø 3 – Friværdi: Mode A (beregn) og Mode B (direkte input), slider for anvendt %, skattefri udbetaling
- [x] Miljø 4 – Selskabsmidler: formue, månedlig opsparing, afkast, selskabsskat, udbytteskat
- [x] Offentlige ydelser: folkepension, pensionstillæg, ATP — enlig/par satser
- [x] Hook-tal øverst: "X kr./md. efter skat i Y år" — stort og centralt
- [x] Gap-analyse: grøn/rød indikator mod ønsket forbrug
- [x] Stacked bar chart (Recharts): fem komponenter + rød stiplet referencelinje + tooltip
- [x] Foldbare paneler (accordion) for hvert miljø — starter sammenfoldet
- [x] Scenariesammenligning: "Gem som Scenarie A" → side-by-side sammenligning
- [x] Edge cases: afkast=0%, friværdi negativ, år til pension=0
- [x] Tilføj rute `/capacity-calculator` i App.tsx og "Din Øk. Kapacitet" i sidebar
- [x] Installer Recharts: allerede installeret

## Fase 17 – Kapacitetsberegner: state-persistence og layout-fix

- [x] Udvid CalculatorContext med alle CapacityCalculator state-felter
- [x] CapacityCalculator læser startværdier fra context og skriver ændringer tilbage løbende
- [x] Ret for meget luft/padding i venstre side af CapacityCalculator-layoutet

## Fase 18 – Ensret venstremargin på alle beregnersider

- [x] Ret CostCalculator: erstat `max-w-5xl mx-auto` med `w-full max-w-[1400px] px-2`
- [x] Ret GoalCalculator: erstat `p-6 max-w-5xl mx-auto` med `w-full max-w-[1400px] px-2`
- [x] Ret CapacityCalculator: fjern DashboardLayout-wrapper og brug `w-full max-w-[1400px] px-2`

## Fase 19 – Ret pensionsberegning til at matche Excel-model

- [x] Ret calcFV til årsrente + årsindbetalinger (annuity due) i stedet for månedlig compounding
- [x] Ret annuityPayment til årsrente + årsudbetalinger (annuity due) i stedet for månedlig
- [x] Månedlig udbetaling = årsbeløb / 12 × (1-skat) — ikke månedlig annuitet
- [x] Verificer: 1.000.000 depot, 0 indbetaling, 6%, PAL 15,3%, 10 år, 20 år udbetaling, 38% skat → FV=1.641.660, månedlig=6.522
- [x] Verificer: 1.000.000 depot, 60.000 indbetaling, 6%, PAL 15,3%, 10 år, 20 år udbetaling, 38% skat → FV=2.437.728, månedlig=9.685

## Fase 20 – Ensret formler + vis formue v. pension

- [x] Calculator.tsx: allerede korrekt (årsrente annuity due) — ingen rettelse nødvendig
- [x] CostCalculator.tsx: allerede korrekt (årsrente annuity due) — ingen rettelse nødvendig
- [x] CapacityCalculator.tsx: vis "Formue v. pension" som synlig linje i tabellen for hvert aktiv (pension, frie midler, selskab) — allerede implementeret

## Fase 21 – Eksport og import af beregnerdata

- [x] Calculator.tsx: tilføj "Gem" (eksport til JSON) og "Indlæs" (import fra JSON) knapper
- [x] CostCalculator.tsx: tilføj eksport/import
- [x] GoalCalculator.tsx: tilføj eksport/import
- [x] CapacityCalculator.tsx: tilføj eksport/import
- [x] JSON-filer navngives med beregnertype og dato, fx "afkast-2026-03-30.json"
- [x] Import validerer at filen er den rigtige beregnertype inden indlæsning

## Fase 22 – Fire ændringer

- [x] Fix 1: Gem/Hent gemmer alle fire beregnere i én samlet JSON-fil (ikke per beregner)
- [x] Fix 2: Ret produktvælger i Afkastberegneren så nye/importerede produkter kan vælges
- [x] Fix 3: Udvid produktredigering til alle parametre: selskab, risikoniveau, år til pension, ÅOP, NHM-id
- [x] Fix 4: Tilføj download-knap til eksempel Excel-fil på upload-siden

## Fase 23 – Ø/år i produktkort (Afkastberegner)

- [x] Hvert produktkort øverst viser Ø/år* (horisontbaseret gennemsnit) under slutværdien
- [x] Sammenligningskort (2. og 3. produkt) viser delta Ø/år (forskel ift. første produkt)

## Fase 24 – Afkastforskelberegner

- [x] Opret ReturnDiffCalculator.tsx baseret på CostCalculator-struktur
- [x] Inputs: Depot, Årlig indbetaling, Afkast i dag (%), Alternativt afkast (%), År til pension
- [x] Beregning: FV for begge afkast (annuity due, årsrente)
- [x] Resultatkort øverst: Depot v. pension (afkast i dag), Depot v. pension (alternativt afkast), Samlet merværdi
- [x] Graf: år-for-år tabel (sammenklappelig)
- [x] Tabel: År, Depot (i dag), Depot (alternativt), Forskel
- [x] Eksport/import via CalculatorIOBar (inkluderet i samlet scenariefil- [x] Registrer rute /return-diff-calculator i App.tsx
- [x] Tilføj til sidebar-navigation
- [x] Opdater useCalculatorIO hook til at inkludere den nye beregner

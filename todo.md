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
- [ ] PDF-modal understøtter GoalCalculator-data som valgbar sektion

## Fase 13 – Målberegner i PDF-rapport

- [x] Udvid `server/generatePdf.ts` med en `goalSection` der viser mode, inputs og resultater
- [x] Opdater `server/pdfRouter.ts` til at modtage og videresende `goalData` payload
- [x] Opdater `client/src/components/PdfReportModal.tsx` med "Målberegner" som valgbar sektion
- [x] Opdater `client/src/pages/GoalCalculator.tsx` til at sende goalData til modalen
- [x] Opdater `client/src/pages/Calculator.tsx` og `CostCalculator.tsx` til at sende goalData fra context

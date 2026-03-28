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

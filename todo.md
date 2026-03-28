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

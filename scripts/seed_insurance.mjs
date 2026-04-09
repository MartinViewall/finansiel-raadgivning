import { createConnection } from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
const url = new URL(dbUrl);
const conn = await createConnection({
  host: url.hostname,
  port: parseInt(url.port || '3306'),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

// Delete existing data to allow re-seeding
await conn.query('DELETE FROM insurance_base_prices');
await conn.query('DELETE FROM insurance_companies');
await conn.query('DELETE FROM insurance_salary_scale');
await conn.query('ALTER TABLE insurance_companies AUTO_INCREMENT = 1');
await conn.query('ALTER TABLE insurance_base_prices AUTO_INCREMENT = 1');
await conn.query('ALTER TABLE insurance_salary_scale AUTO_INCREMENT = 1');

// Insert companies
const companies = [
  { name: 'Velliv', useEaFormula: 0, sortOrder: 1 },
  { name: 'PFA',    useEaFormula: 0, sortOrder: 2 },
  { name: 'EA',     useEaFormula: 1, sortOrder: 3 },
  { name: 'Nordea', useEaFormula: 0, sortOrder: 4 },
  { name: 'Danica', useEaFormula: 0, sortOrder: 5 },
];
for (const c of companies) {
  await conn.query('INSERT INTO insurance_companies (name, useEaFormula, sortOrder, isActive) VALUES (?, ?, ?, 1)', [c.name, c.useEaFormula, c.sortOrder]);
}
console.log('✓ Companies inserted');

// Get company IDs
const [rows] = await conn.query('SELECT id, name FROM insurance_companies ORDER BY sortOrder');
const ids = {};
for (const r of rows) ids[r.name] = r.id;
console.log('Company IDs:', ids);

// Base prices
// coverageType: erhvervsevne, praemiefritagelse, livsforsikring, kritisksygdom, sundhedsordning, administration
// Standard formula: (løn × dækningspct × ratePct) / baselinePct + fixedKr
// EA formula:       løn × ratePct + fixedKr
// Præmiefritagelse: Årlig indbetaling × ratePct
// Livsforsikring:   løn × livspct × ratePct
// Kritisk Sygdom:   beløb × ratePct
// Sundhedsordning:  fixedKr (flat price)
// Administration:   fixedKr (flat price)

const prices = [
  // Velliv
  [ids.Velliv, 'erhvervsevne',     0.01472267, 0,       0.4],
  [ids.Velliv, 'praemiefritagelse',0.04968000, 0,       1.0],
  [ids.Velliv, 'livsforsikring',   0.00114700, 0,       1.0],
  [ids.Velliv, 'kritisksygdom',    0.00756600, 0,       1.0],
  [ids.Velliv, 'sundhedsordning',  0,          2500,    1.0],
  [ids.Velliv, 'administration',   0,          0,       1.0],
  // PFA
  [ids.PFA, 'erhvervsevne',     0.00864000, 600,    0.4],
  [ids.PFA, 'praemiefritagelse',0.01800000, 0,      1.0],
  [ids.PFA, 'livsforsikring',   0.00128000, 0,      1.0],
  [ids.PFA, 'kritisksygdom',    0.00840000, 0,      1.0],
  [ids.PFA, 'sundhedsordning',  0,          2076,   1.0],
  [ids.PFA, 'administration',   0,          222,    1.0],
  // EA (useEaFormula=1)
  [ids.EA, 'erhvervsevne',     0.01960000, 0,      0.4],
  [ids.EA, 'praemiefritagelse',0.02400000, 0,      1.0],
  [ids.EA, 'livsforsikring',   0.00200000, 0,      1.0],
  [ids.EA, 'kritisksygdom',    0.00850000, 0,      1.0],
  [ids.EA, 'sundhedsordning',  0,          2784,   1.0],
  [ids.EA, 'administration',   0,          0,      1.0],
  // Nordea
  [ids.Nordea, 'erhvervsevne',     0.00826872, 0,       0.4],
  [ids.Nordea, 'praemiefritagelse',0.02959100, 0,       1.0],
  [ids.Nordea, 'livsforsikring',   0.00249012, 0,       1.0],
  [ids.Nordea, 'kritisksygdom',    0.00850200, 0,       1.0],
  [ids.Nordea, 'sundhedsordning',  0,          3172.20, 1.0],
  [ids.Nordea, 'administration',   0,          0,       1.0],
  // Danica (same as Nordea)
  [ids.Danica, 'erhvervsevne',     0.00826872, 0,       0.4],
  [ids.Danica, 'praemiefritagelse',0.02959100, 0,       1.0],
  [ids.Danica, 'livsforsikring',   0.00249012, 0,       1.0],
  [ids.Danica, 'kritisksygdom',    0.00850200, 0,       1.0],
  [ids.Danica, 'sundhedsordning',  0,          3172.20, 1.0],
  [ids.Danica, 'administration',   0,          0,       1.0],
];

for (const [companyId, coverageType, ratePct, fixedKr, baselinePct] of prices) {
  await conn.query(
    'INSERT INTO insurance_base_prices (companyId, coverageType, ratePct, fixedKr, baselinePct) VALUES (?, ?, ?, ?, ?)',
    [companyId, coverageType, ratePct, fixedKr, baselinePct]
  );
}
console.log('✓ Base prices inserted:', prices.length, 'rows');

// Salary scale
const salaryScale = [
  [254999, 0.15], [255000, 0.17], [265000, 0.18], [275000, 0.21],
  [285000, 0.23], [295000, 0.26], [305000, 0.28], [315000, 0.30],
  [325000, 0.32], [335000, 0.34], [345000, 0.35], [355000, 0.37],
  [365000, 0.39], [375000, 0.40], [385000, 0.41], [395000, 0.43],
  [405000, 0.45], [415000, 0.46], [425000, 0.48], [435000, 0.50],
  [445000, 0.52], [455000, 0.54], [465000, 0.56], [475000, 0.57],
  [485000, 0.59], [495000, 0.60], [505000, 0.61], [515000, 0.63],
  [525000, 0.64], [535000, 0.65], [545000, 0.66], [555000, 0.67],
  [565000, 0.69], [575000, 0.70], [585000, 0.71], [595000, 0.72],
  [605000, 0.73], [615000, 0.74], [625000, 0.75], [635000, 0.76],
  [655000, 0.77], [665000, 0.78], [685000, 0.79], [705000, 0.80],
];

for (const [salaryUpTo, coveragePct] of salaryScale) {
  await conn.query(
    'INSERT INTO insurance_salary_scale (salaryUpTo, coveragePct) VALUES (?, ?)',
    [salaryUpTo, coveragePct]
  );
}
console.log('✓ Salary scale inserted:', salaryScale.length, 'rows');

await conn.end();
console.log('\nSeed complete!');

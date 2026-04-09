-- Seed insurance companies
INSERT INTO insurance_companies (name, useEaFormula, sortOrder, isActive) VALUES
  ('Velliv', 0, 1, 1),
  ('PFA',    0, 2, 1),
  ('EA',     1, 3, 1),
  ('Nordea', 0, 4, 1),
  ('Danica', 0, 5, 1);

-- Seed base prices
-- coverageType values:
--   'erhvervsevne'     : standard=(løn × dækningspct × ratePct) / baselinePct + fixedKr, EA=løn × ratePct + fixedKr
--   'praemiefritagelse': Årlig indbetaling × ratePct
--   'livsforsikring'   : løn × livspct × ratePct
--   'kritisksygdom'    : beløb × ratePct  (baselinePct = reference amount stored in fixedKr as baseline)
--   'sundhedsordning'  : fixed kr (ratePct=0, fixedKr=price)
--   'administration'   : fixed kr (ratePct=0, fixedKr=price)

-- Velliv (id=1)
-- erhvervsevne: rate=1.4722666...% baseline=0.40
INSERT INTO insurance_base_prices (companyId, coverageType, ratePct, fixedKr, baselinePct) VALUES
  (1, 'erhvervsevne',     0.01472267, 0,      0.4000),
  (1, 'praemiefritagelse',0.04968000, 0,      1.0000),
  (1, 'livsforsikring',   0.00114700, 0,      1.0000),
  (1, 'kritisksygdom',    0.00756600, 0,      1.0000),
  (1, 'sundhedsordning',  0,          2500,   1.0000),
  (1, 'administration',   0,          0,      1.0000);

-- PFA (id=2)
-- erhvervsevne: rate=0.864% baseline=0.40, fixedKr=600
-- admin: 222 kr fixed
INSERT INTO insurance_base_prices (companyId, coverageType, ratePct, fixedKr, baselinePct) VALUES
  (2, 'erhvervsevne',     0.00864000, 600,    0.4000),
  (2, 'praemiefritagelse',0.01800000, 0,      1.0000),
  (2, 'livsforsikring',   0.00128000, 0,      1.0000),
  (2, 'kritisksygdom',    0.00840000, 0,      1.0000),
  (2, 'sundhedsordning',  0,          2076,   1.0000),
  (2, 'administration',   0,          222,    1.0000);

-- EA (id=3) — useEaFormula=1: erhvervsevne = løn × ratePct + fixedKr
-- rate=1.96% baseline irrelevant for EA
INSERT INTO insurance_base_prices (companyId, coverageType, ratePct, fixedKr, baselinePct) VALUES
  (3, 'erhvervsevne',     0.01960000, 0,      0.4000),
  (3, 'praemiefritagelse',0.02400000, 0,      1.0000),
  (3, 'livsforsikring',   0.00200000, 0,      1.0000),
  (3, 'kritisksygdom',    0.00850000, 0,      1.0000),
  (3, 'sundhedsordning',  0,          2784,   1.0000),
  (3, 'administration',   0,          0,      1.0000);

-- Nordea (id=4)
-- erhvervsevne: rate=0.826872% baseline=0.40
INSERT INTO insurance_base_prices (companyId, coverageType, ratePct, fixedKr, baselinePct) VALUES
  (4, 'erhvervsevne',     0.00826872, 0,      0.4000),
  (4, 'praemiefritagelse',0.02959100, 0,      1.0000),
  (4, 'livsforsikring',   0.00249012, 0,      1.0000),
  (4, 'kritisksygdom',    0.00850200, 0,      1.0000),
  (4, 'sundhedsordning',  0,          3172.20,1.0000),
  (4, 'administration',   0,          0,      1.0000);

-- Danica (id=5) — same prices as Nordea
INSERT INTO insurance_base_prices (companyId, coverageType, ratePct, fixedKr, baselinePct) VALUES
  (5, 'erhvervsevne',     0.00826872, 0,      0.4000),
  (5, 'praemiefritagelse',0.02959100, 0,      1.0000),
  (5, 'livsforsikring',   0.00249012, 0,      1.0000),
  (5, 'kritisksygdom',    0.00850200, 0,      1.0000),
  (5, 'sundhedsordning',  0,          3172.20,1.0000),
  (5, 'administration',   0,          0,      1.0000);

-- Salary scale (Lønskala) — TAEE coverage percentage by salary band
INSERT INTO insurance_salary_scale (salaryUpTo, coveragePct) VALUES
  (254999, 0.15),
  (255000, 0.17),
  (265000, 0.18),
  (275000, 0.21),
  (285000, 0.23),
  (295000, 0.26),
  (305000, 0.28),
  (315000, 0.30),
  (325000, 0.32),
  (335000, 0.34),
  (345000, 0.35),
  (355000, 0.37),
  (365000, 0.39),
  (375000, 0.40),
  (385000, 0.41),
  (395000, 0.43),
  (405000, 0.45),
  (415000, 0.46),
  (425000, 0.48),
  (435000, 0.50),
  (445000, 0.52),
  (455000, 0.54),
  (465000, 0.56),
  (475000, 0.57),
  (485000, 0.59),
  (495000, 0.60),
  (505000, 0.61),
  (515000, 0.63),
  (525000, 0.64),
  (535000, 0.65),
  (545000, 0.66),
  (555000, 0.67),
  (565000, 0.69),
  (575000, 0.70),
  (585000, 0.71),
  (595000, 0.72),
  (605000, 0.73),
  (615000, 0.74),
  (625000, 0.75),
  (635000, 0.76),
  (655000, 0.77),
  (665000, 0.78),
  (685000, 0.79),
  (705000, 0.80);

import { calculateElectricityBill } from '@/lib/tariff';

type DemoMonth = { month: string; energyKwh: number; wasteKg: number; categories: Record<string, number> };
type DemoData = {
  income: number;
  months: DemoMonth[];
  bills: Array<Record<string, any>>;
  accounts: Array<Record<string, any>>;
  transactions: Array<Record<string, any>>;
  goals: Array<Record<string, any>>;
  reminders?: Array<Record<string, any>>;
  purchases?: Array<Record<string, any>>;
  gamification: { points: number; level: number; levelName: string; nextLevelPoints: number; progress: number };
};

const KEY = 'gemelo-demo-data-v1';
const levelNames = ['Principiante', 'Consciente', 'Eco-Guerrero', 'Campeón Sostenible'];

async function loadData(): Promise<DemoData> {
  const cached = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
  if (cached) return JSON.parse(cached) as DemoData;
  const response = await fetch('/demo-data.json');
  return await response.json() as DemoData;
}

function saveData(data: DemoData) {
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

function monthPurchaseSummary(data: DemoData) {
  return data.months.flatMap((month) => Object.entries(month.categories).map(([category, totalBs]) => ({
    month: month.month,
    category,
    totalBs,
    totalCo2Kg: Number((totalBs * 0.01).toFixed(2)),
    count: 1,
  })));
}

function monthEnergySummary(data: DemoData) {
  return data.months.map((month) => ({
    month: month.month,
    totalKwh: month.energyKwh,
    totalCostBs: data.bills.find((bill) => bill.month === month.month)?.totalBs ?? calculateElectricityBill(month.energyKwh).totalBs,
    totalCo2: Number((month.energyKwh * 0.5).toFixed(2)),
    count: 1,
  }));
}

function monthFoodSummary(data: DemoData) {
  return data.months.map((month) => ({ month: month.month, totalKg: month.wasteKg, totalCo2: Number((month.wasteKg * 2.5).toFixed(2)), count: 1 }));
}

function dashboard(data: DemoData) {
  const current = data.months[data.months.length - 1];
  const purchaseRows = monthPurchaseSummary(data);
  const energyRows = monthEnergySummary(data);
  const foodRows = monthFoodSummary(data);
  const currentSpent = Object.values(current.categories).reduce((sum, value) => sum + value, 0);
  const monthTransactions = data.transactions.filter((tx) => String(tx.timestamp ?? '').startsWith(current.month));
  const financeExpenses = monthTransactions.filter((tx) => tx.type === 'expense');
  const expenseTotal = financeExpenses.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const savingsSpent = financeExpenses.filter((tx) => String(tx.category).toLowerCase() === 'savings').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const spendingTrend = data.months.map((month) => ({
    month: month.month,
    amountBs: Object.values(month.categories).reduce((sum, value) => sum + value, 0)
      + data.transactions.filter((tx) => tx.type === 'expense' && String(tx.timestamp ?? '').startsWith(month.month)).reduce((sum, tx) => sum + Number(tx.amount), 0),
  }));
  const needsSpent = currentSpent - (current.categories.ocio ?? 0) + financeExpenses
    .filter((tx) => !['ocio', 'wants', 'savings'].includes(String(tx.category).toLowerCase()))
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const needsLimit = data.income * 0.5;
  const priorEnergy = data.months.slice(0, -1).reduce((sum, item) => sum + item.energyKwh, 0) / Math.max(1, data.months.length - 1);
  const priorWaste = data.months.slice(0, -1).reduce((sum, item) => sum + item.wasteKg, 0) / Math.max(1, data.months.length - 1);
  const alerts = [];
  if (current.energyKwh > priorEnergy * 1.1) alerts.push({ type: 'energy', message: 'El consumo de energía supera en más de 10% tu promedio.' });
  if (current.wasteKg > priorWaste * 1.2) alerts.push({ type: 'waste', message: 'El desperdicio supera en más de 20% tu nivel habitual.' });
  if (needsSpent >= needsLimit * 0.9) alerts.push({ type: 'budget', message: 'Tus necesidades alcanzaron 90% del límite mensual.' });
  return {
    purchases: purchaseRows,
    energy: { summary: energyRows },
    food: { summary: foodRows },
    gamification: data.gamification,
    profile: data.gamification,
    month: current.month,
    spentBs: currentSpent + expenseTotal,
    availableBs: data.income - currentSpent - expenseTotal,
    budget: {
      incomeBs: data.income,
      needs: { limitBs: needsLimit, spentBs: needsSpent },
      wants: {
        limitBs: data.income * 0.3,
        spentBs: (current.categories.ocio ?? 0) + financeExpenses
          .filter((tx) => ['ocio', 'wants'].includes(String(tx.category).toLowerCase()))
          .reduce((sum, tx) => sum + Number(tx.amount), 0),
      },
      savings: { targetBs: data.income * 0.2, spentBs: savingsSpent },
    },
    accounts: data.accounts,
    alerts,
    spendingTrend,
    co2Kg: Number((currentSpent * 0.01 + current.energyKwh * 0.5 + current.wasteKg * 2.5).toFixed(2)),
    timestamp: new Date().toISOString(),
  };
}

function award(data: DemoData, points: number) {
  const total = data.gamification.points + points;
  const thresholds = [0, 101, 501, 1501];
  const level = total >= 1501 ? 4 : total >= 501 ? 3 : total >= 101 ? 2 : 1;
  const next = thresholds[level] ?? total;
  data.gamification = {
    points: total,
    level,
    levelName: levelNames[level - 1],
    nextLevelPoints: next,
    progress: level >= 4 ? 100 : Math.round(((total - thresholds[level - 1]) / (next - thresholds[level - 1])) * 100),
  };
}

function predict(values: number[]) {
  const count = values.length;
  const xMean = (count - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / count;
  const slope = values.reduce((sum, value, index) => sum + (index - xMean) * (value - yMean), 0)
    / Math.max(1, values.reduce((sum, _value, index) => sum + (index - xMean) ** 2, 0));
  const intercept = yMean - slope * xMean;
  const residuals = values.map((value, index) => value - (intercept + slope * index));
  const deviation = Math.sqrt(residuals.reduce((sum, residual) => sum + residual ** 2, 0) / count);
  const predictions = Array.from({ length: 6 }, (_, index) => Math.max(0, intercept + slope * (count + index)));
  return {
    predictions,
    lo: predictions.map((value) => Math.max(0, value - deviation)),
    hi: predictions.map((value) => value + deviation),
    lo3: predictions.map((value) => Math.max(0, value - 3 * deviation)),
    hi3: predictions.map((value) => value + 3 * deviation),
    residualStdDev: deviation,
    is_preliminary: count < 8,
    label: count < 8 ? 'Predicción preliminar' : 'Proyección',
  };
}

function predictions(data: DemoData) {
  const histories = {
    gasto: data.months.map((month) => Object.values(month.categories).reduce((sum, value) => sum + value, 0)),
    energia: data.months.map((month) => month.energyKwh),
    desperdicio: data.months.map((month) => month.wasteKg),
    co2: data.months.map((month) => Object.values(month.categories).reduce((sum, value) => sum + value * 0.01, 0) + month.energyKwh * 0.5 + month.wasteKg * 2.5),
  };
  return Object.fromEntries(Object.entries(histories).map(([key, values]) => [key, {
    history: values,
    months_6: predict(values),
    is_preliminary: values.length < 8,
  }]));
}

function simulate(data: DemoData, request: Record<string, number>) {
  const months = Math.max(1, Math.min(24, Number(request.months ?? request.horizonMonths ?? 6)));
  const energyPct = Number(request.energy ?? request.energyReductionPct ?? 0);
  const wastePct = Number(request.waste ?? request.wasteReductionPct ?? 0);
  const purchasesPct = Number(request.purchases ?? request.purchaseChangePct ?? 0);
  const current = data.months[data.months.length - 1];
  const purchases = Object.values(current.categories).reduce((sum, value) => sum + value, 0);
  const energyKwh = current.energyKwh;
  const wasteKg = current.wasteKg;
  const energySaved = energyKwh * energyPct / 100 * months;
  const wasteSaved = wasteKg * wastePct / 100 * months;
  const purchasesSaved = purchases * purchasesPct / 100 * months;
  const baselineEnergyBill = calculateElectricityBill(energyKwh).totalBs;
  const scenarioEnergyKwh = energyKwh * (1 - energyPct / 100);
  const scenarioEnergyBill = scenarioEnergyKwh > 0 ? calculateElectricityBill(scenarioEnergyKwh).totalBs : 0;
  const scenarioPurchases = purchases * (1 - purchasesPct / 100);
  const scenarioWaste = wasteKg * (1 - wastePct / 100);
  const periodMonths = Array.from({ length: months }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() + index + 1);
    return date.toISOString().slice(0, 7);
  });
  const baseline = {
    months: periodMonths,
    purchasesBs: periodMonths.map(() => purchases),
    energyKWh: periodMonths.map(() => energyKwh),
    foodWasteKg: periodMonths.map(() => wasteKg),
    co2Kg: periodMonths.map(() => Number((purchases * 0.01 + energyKwh * 0.5 + wasteKg * 2.5).toFixed(2))),
  };
  const scenario = {
    months: periodMonths,
    purchasesBs: periodMonths.map(() => scenarioPurchases),
    energyKWh: periodMonths.map(() => scenarioEnergyKwh),
    foodWasteKg: periodMonths.map(() => scenarioWaste),
    co2Kg: periodMonths.map(() => Number((scenarioPurchases * 0.01 + scenarioEnergyKwh * 0.5 + scenarioWaste * 2.5).toFixed(2))),
  };
  const totalBsSaved = (baselineEnergyBill - scenarioEnergyBill) * months + wasteSaved * 20 + purchasesSaved;
  return {
    baseline,
    scenario,
    impact: {
      totalBsSaved: Number(totalBsSaved.toFixed(2)),
      totalCo2SavedKg: Number((energySaved * 0.5 + wasteSaved * 2.5 + purchasesSaved * 0.01).toFixed(2)),
      energySavedKWh: Number(energySaved.toFixed(2)),
      wasteReductionKg: Number(wasteSaved.toFixed(2)),
    },
  };
}

export async function fetchDemoAPI(endpoint: string, options: { method?: string; body?: unknown } = {}) {
  const method = options.method ?? 'GET';
  const url = new URL(endpoint, 'http://demo.local');
  const path = url.pathname;
  const body = (options.body ?? {}) as Record<string, any>;
  const data = await loadData();
  const current = data.months[data.months.length - 1];
  let response: unknown = null;

  if (path === '/api/dashboard') response = dashboard(data);
  else if (path === '/api/bills/calculate' && method === 'POST') response = calculateElectricityBill(Number(body.kWh));
  else if (path === '/api/bills' && method === 'GET') response = [...data.bills].reverse();
  else if (path === '/api/bills' && method === 'POST') {
    const calculated = calculateElectricityBill(Number(body.kWh));
    const bill = { ...calculated, kWh: Number(body.kWh), month: body.month, householdId: body.householdId ?? 'hogar_001', id: `demo-bill-${body.month}` };
    data.bills = [bill, ...data.bills.filter((entry) => entry.month !== body.month)];
    const monthly = data.months.find((entry) => entry.month === body.month);
    if (monthly) monthly.energyKwh = bill.kWh;
    award(data, 3);
    saveData(data);
    response = bill;
  } else if (path === '/api/purchases' && method === 'GET') response = data.purchases ?? data.months.flatMap((month) => Object.entries(month.categories).map(([category, amountBs]) => ({ id: `seed-${month.month}-${category}`, item: category, category, amountBs, timestamp: `${month.month}-15T12:00:00.000Z` }))).reverse();
  else if (path === '/api/purchases/summary') response = monthPurchaseSummary(data);
  else if (path === '/api/purchases' && method === 'POST') {
    const category = String(body.category ?? 'alimentos');
    current.categories[category] = (current.categories[category] ?? 0) + Number(body.amountBs);
    award(data, 5);
    const purchase = { id: `demo-purchase-${Date.now()}`, ...body, timestamp: new Date().toISOString(), co2EstimateKg: Number((Number(body.amountBs) * 0.01).toFixed(2)) };
    data.purchases ??= [];
    data.purchases.unshift(purchase);
    saveData(data);
    response = purchase;
  } else if (path === '/api/energy/summary') response = { summary: monthEnergySummary(data) };
  else if (path === '/api/energy/readings' && method === 'GET') response = monthEnergySummary(data);
  else if (path === '/api/energy/readings' && method === 'POST') {
    current.energyKwh = Number(body.kWh);
    award(data, Number(body.kWh) < 5 ? 15 : 3);
    saveData(data);
    response = { id: `demo-energy-${Date.now()}`, ...body, co2EstimateKg: current.energyKwh * 0.5 };
  } else if (path === '/api/food/waste-summary') response = { summary: monthFoodSummary(data) };
  else if (path === '/api/food' && method === 'GET') response = [];
  else if (path === '/api/food' && method === 'POST') response = { id: `demo-food-${Date.now()}`, ...body, status: 'stored' };
  else if (path.startsWith('/api/food/') && method === 'PATCH') {
    const status = path.endsWith('/consume') ? 'consumed' : path.endsWith('/waste') ? 'wasted' : body.status;
    if (status === 'consumed') award(data, 10);
    if (status === 'wasted') { award(data, -5); current.wasteKg += Number(body.quantityKg ?? 1); }
    saveData(data);
    response = { status };
  } else if (path === '/api/predict' || path === '/api/predictions' || path === '/api/simulation/predict') response = predictions(data);
  else if (path === '/api/simulate' || path === '/api/simulation/simulate') response = simulate(data, body);
  else if (path.startsWith('/api/gamification/profile')) response = data.gamification;
  else if (path.startsWith('/api/gamification/achievements')) response = [];
  else if (path.startsWith('/api/gamification/points-history')) response = [];
  else if (path === '/api/gamification/leaderboard') response = [{ householdId: 'hogar_001', points: data.gamification.points, level: data.gamification.level, levelName: data.gamification.levelName }];
  else if (path === '/api/food/reminders' && method === 'GET') response = data.reminders ?? [];
  else if (path === '/api/food/reminders' && method === 'POST') {
    const reminder = { id: `demo-reminder-${Date.now()}`, ...body, status: 'pending' };
    data.reminders ??= [];
    data.reminders.push(reminder);
    saveData(data);
    response = reminder;
  }
  else if (path === '/api/finances/accounts' && method === 'GET') response = data.accounts;
  else if (path === '/api/finances/accounts' && method === 'POST') {
    const account = { id: `demo-account-${Date.now()}`, ...body, balance: Number(body.balance ?? 0) };
    if (!['cash', 'bank', 'savings'].includes(body.type) || account.balance < 0) throw new Error('Tipo de cuenta o saldo inicial inválido.');
    data.accounts.push(account);
    saveData(data);
    response = account;
  } else if (path === '/api/finances/transactions' && method === 'GET') response = data.transactions;
  else if (path === '/api/finances/transactions' && method === 'POST') {
    const account = data.accounts.find((entry) => entry.id === body.accountId);
    const amount = Number(body.amount);
    if (!account || !Number.isFinite(amount) || amount <= 0 || !['income', 'expense'].includes(body.type)) throw new Error('La transacción requiere cuenta, tipo y monto válido.');
    const balance = Number(account.balance);
    if (body.type === 'expense' && balance < amount) throw new Error('Saldo insuficiente para registrar el egreso.');
    account.balance = balance + (body.type === 'income' ? amount : -amount);
    const transaction = { id: `demo-tx-${Date.now()}`, ...body, timestamp: new Date().toISOString() };
    data.transactions.unshift(transaction);
    saveData(data);
    response = transaction;
  }
  else if (path === '/api/finances/goals' && method === 'GET') response = data.goals;
  else if (path === '/api/finances/goals' && method === 'POST') {
    if (!String(body.name ?? '').trim() || Number(body.targetAmount) <= 0) throw new Error('La meta requiere nombre y monto objetivo válido.');
    const goal = { id: `demo-goal-${Date.now()}`, currentAmount: 0, ...body, targetAmount: Number(body.targetAmount) };
    data.goals.push(goal);
    saveData(data);
    response = goal;
  }
  else if (path === '/api/finances/budgets' && method === 'GET') response = [{ month: current.month, needsLimit: data.income * 0.5, wantsLimit: data.income * 0.3, savingsTarget: data.income * 0.2 }];
  else if (path === '/api/finances/budgets' && method === 'POST') response = { id: `demo-budget-${Date.now()}`, month: body.month, needsLimit: Number(body.needsLimit), wantsLimit: Number(body.wantsLimit), savingsTarget: Number(body.savingsTarget) };
  else if (path === '/api/budget' || path === '/api/finances/budget') {
    if (method === 'PUT') { data.income = Number(body.income); saveData(data); }
    response = { householdId: 'hogar_001', income: data.income, needsLimit: data.income * 0.5, wantsLimit: data.income * 0.3, savingsTarget: data.income * 0.2 };
  } else if (path === '/api/invoices/scan' && method === 'POST') response = { success: false, confidence: 'low', requiresConfirmation: true, message: 'Modo demo: ingresa manualmente los datos de la factura para revisarlos.' };
  else if ((path === '/api/invoices/confirm' || path === '/api/invoices') && method === 'POST') {
    const category = body.category ?? 'alimentos';
    current.categories[category] = (current.categories[category] ?? 0) + Number(body.total);
    const expiring = Array.isArray(body.items) ? body.items.filter((item: any) => item.perishability && Number(item.estimatedExpiryDays) > 0) : [];
    data.reminders ??= [];
    for (const item of expiring) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Math.min(60, Number(item.estimatedExpiryDays)));
      data.reminders.push({ id: `demo-reminder-${Date.now()}-${data.reminders.length}`, name: item.name, expiresAt: expiresAt.toISOString().slice(0, 10), status: 'pending' });
    }
    award(data, 5);
    saveData(data);
    response = { id: `demo-invoice-${Date.now()}`, ...body, status: 'confirmed' };
  }

  return response;
}
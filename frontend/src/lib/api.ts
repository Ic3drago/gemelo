const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  isFormData?: boolean;
}

async function fetchAPI<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T | null> {
  try {
    const { method = 'GET', body, isFormData = false } = options;

    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const init: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      init.body = isFormData ? (body as FormData) : JSON.stringify(body);
    }

    const res = await fetch(`${API_URL}${endpoint}`, init);

    if (!res.ok) {
      console.warn(`[API] ${method} ${endpoint} → ${res.status}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[API] ${endpoint}`, err);
    return null;
  }
}

export const api = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboard: (householdId = 'hogar_001') =>
    fetchAPI(`/api/dashboard?householdId=${householdId}`),

  // ── Purchases ──────────────────────────────────────────────────────────────
  getPurchases: (params = '') =>
    fetchAPI(`/api/purchases${params ? '?' + params : ''}`),

  getPurchasesSummary: (householdId = 'hogar_001') =>
    fetchAPI(`/api/purchases/summary?householdId=${householdId}`),

  createPurchase: (data: {
    householdId: string;
    category: string;
    item: string;
    amountBs: number;
    qty?: number;
    unit?: string;
  }) => fetchAPI('/api/purchases', { method: 'POST', body: data }),

  // ── Energy ─────────────────────────────────────────────────────────────────
  getEnergyReadings: (params = '') =>
    fetchAPI(`/api/energy/readings${params ? '?' + params : ''}`),

  getEnergySummary: (householdId = 'hogar_001') =>
    fetchAPI(`/api/energy/summary?householdId=${householdId}`),

  createEnergyReading: (data: {
    householdId: string;
    kWh: number;
    deviceType?: string;
  }) => fetchAPI('/api/energy/readings', { method: 'POST', body: data }),

  // ── Food ───────────────────────────────────────────────────────────────────
  getFood: (params = '') =>
    fetchAPI(`/api/food${params ? '?' + params : ''}`),

  getFoodWasteSummary: (householdId = 'hogar_001') =>
    fetchAPI(`/api/food/waste-summary?householdId=${householdId}`),

  createFood: (data: {
    householdId: string;
    name: string;
    category: string;
    qty: number;
  }) => fetchAPI('/api/food', { method: 'POST', body: data }),

  wasteFood: (id: string) =>
    fetchAPI(`/api/food/${id}/waste`, { method: 'PATCH' }),

  consumeFood: (id: string) =>
    fetchAPI(`/api/food/${id}/consume`, { method: 'PATCH' }),

  // ── Gamification ───────────────────────────────────────────────────────────
  getProfile: (householdId = 'hogar_001') =>
    fetchAPI(`/api/gamification/profile/${householdId}`),

  getAchievements: (householdId = 'hogar_001') =>
    fetchAPI(`/api/gamification/achievements?householdId=${householdId}`),

  getPointsHistory: (householdId = 'hogar_001') =>
    fetchAPI(`/api/gamification/points-history/${householdId}`),

  // ── Simulation & Predictions ───────────────────────────────────────────────
  simulate: (data: {
    householdId: string;
    horizonMonths: number;
    wasteReductionPct: number;
    energyReductionPct: number;
    purchaseChangePct: number;
  }) => fetchAPI('/api/simulate', { method: 'POST', body: data }),

  predictSimulation: (data: { householdId: string; horizonMonths?: number }) =>
    fetchAPI('/api/simulation/predict', { method: 'POST', body: data }),

  getPredictions: (householdId = 'hogar_001') =>
    fetchAPI(`/api/predict?householdId=${householdId}`),

  // ── Finances ───────────────────────────────────────────────────────────────
  getFinances: (householdId = 'hogar_001') =>
    fetchAPI(`/api/finances?householdId=${householdId}`),

  getAccounts: (householdId = 'hogar_001') =>
    fetchAPI(`/api/finances/accounts?householdId=${householdId}`),

  getTransactions: (householdId = 'hogar_001', params = '') =>
    fetchAPI(`/api/finances/transactions?householdId=${householdId}${params ? '&' + params : ''}`),

  createTransaction: (data: {
    householdId: string;
    description: string;
    amountBs: number;
    type: 'income' | 'expense';
    category?: string;
  }) => fetchAPI('/api/finances/transactions', { method: 'POST', body: data }),

  getBudgets: (householdId = 'hogar_001') =>
    fetchAPI(`/api/finances/budgets?householdId=${householdId}`),

  getGoals: (householdId = 'hogar_001') =>
    fetchAPI(`/api/finances/goals?householdId=${householdId}`),

  createGoal: (data: { householdId: string; name: string; targetBs: number }) =>
    fetchAPI('/api/finances/goals', { method: 'POST', body: data }),

  // ── Invoices / OCR ─────────────────────────────────────────────────────────
  scanInvoice: (formData: FormData) =>
    fetchAPI('/api/invoices/scan', { method: 'POST', body: formData, isFormData: true }),

  saveInvoice: (data: {
    householdId: string;
    store: string;
    date: string;
    total: number;
    items?: Array<{ name: string; price: string }>;
  }) => fetchAPI('/api/invoices', { method: 'POST', body: data }),
};

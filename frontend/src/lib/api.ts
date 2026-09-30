import { fetchDemoAPI } from '@/lib/demo';

// `NEXT_PUBLIC_*` values are inlined at build time, so this must be resolved
// statically. When no API base URL is provided (for example a Vercel deploy with
// no backend attached) we fall back to the in-browser demo dataset instead of
// firing requests at a dead host, so the UI always has something to render.
const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() ?? '';
const FORCE_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const USE_DEMO = FORCE_DEMO || !/^https?:\/\//.test(CONFIGURED_API_URL);
const API_URL = USE_DEMO ? '' : CONFIGURED_API_URL.replace(/\/$/, '');

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  isFormData?: boolean;
}

async function fetchAPI<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T | null> {
  try {
    const { method = 'GET', body, isFormData = false } = options;
    if (USE_DEMO) {
      return await fetchDemoAPI(endpoint, { method, body }) as T | null;
    }

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

    const data = (await res.json()) as T;
    if (data && typeof data === 'object' && 'error' in data && data.error === true) {
      const apiError = data as { message?: unknown };
      console.warn(`[API] ${method} ${endpoint} → ${String(apiError.message ?? 'request failed')}`);
      return null;
    }

    return data;
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
    quantity?: number;
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

  // ── Electricity bills ──────────────────────────────────────────────────────
  calculateBill: (data: { kWh: number }) =>
    fetchAPI('/api/bills/calculate', { method: 'POST', body: data }),

  createBill: (data: { householdId?: string; kWh: number; month: string }) =>
    fetchAPI('/api/bills', { method: 'POST', body: data }),

  getBills: (householdId = 'hogar_001') =>
    fetchAPI(`/api/bills?householdId=${householdId}`),

  // ── Food ───────────────────────────────────────────────────────────────────
  getFood: (params = '') =>
    fetchAPI(`/api/food${params ? '?' + params : ''}`),

  getFoodWasteSummary: (householdId = 'hogar_001') =>
    fetchAPI(`/api/food/waste-summary?householdId=${householdId}`),

  createFood: (data: {
    householdId: string;
    name: string;
    category: string;
    quantityKg: number;
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

  getLeaderboard: () => fetchAPI('/api/gamification/leaderboard'),

  getFoodReminders: (householdId = 'hogar_001') =>
    fetchAPI(`/api/food/reminders?householdId=${householdId}`),

  // ── Simulation & Predictions ───────────────────────────────────────────────
  simulate: (data: {
    householdId?: string;
    months: number;
    waste: number;
    energy: number;
    purchases: number;
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
    accountId: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
  }) => fetchAPI('/api/finances/transactions', { method: 'POST', body: data }),

  getBudgets: (householdId = 'hogar_001') =>
    fetchAPI(`/api/finances/budgets?householdId=${householdId}`),

  createBudget: (data: { month: string; needsLimit: number; wantsLimit: number; savingsTarget: number }) =>
    fetchAPI('/api/finances/budgets', { method: 'POST', body: data }),

  getGoals: (householdId = 'hogar_001') =>
    fetchAPI(`/api/finances/goals?householdId=${householdId}`),

  createGoal: (data: { name: string; targetAmount: number; targetDate?: string }) =>
    fetchAPI('/api/finances/goals', { method: 'POST', body: data }),

  getHouseholdBudget: (householdId = 'hogar_001') =>
    fetchAPI(`/api/budget?householdId=${householdId}`),

  setHouseholdBudget: (data: { householdId?: string; income: number }) =>
    fetchAPI('/api/budget', { method: 'PUT', body: data }),

  // ── Invoices / OCR ─────────────────────────────────────────────────────────
  scanInvoice: (formData: FormData) =>
    fetchAPI('/api/invoices/scan', { method: 'POST', body: formData, isFormData: true }),

  saveInvoice: (data: {
    householdId: string;
    store: string;
    date: string;
    nit?: string;
    number?: string;
    category?: string;
    total: number;
    items?: Array<{ name: string; price: string; category?: string; perishability?: boolean; estimatedExpiryDays?: number | null }>;
  }) => fetchAPI('/api/invoices/confirm', { method: 'POST', body: data }),
};

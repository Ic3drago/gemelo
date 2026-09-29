const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API call failed: ${endpoint}`, err);
    return null;
  }
}

export const api = {
  // Dashboard
  getDashboard: (householdId = 'hogar_001') => fetchAPI(`/api/dashboard?householdId=${householdId}`),
  
  // Purchases
  getPurchases: (params = '') => fetchAPI(`/api/purchases${params ? '?' + params : ''}`),
  getPurchasesSummary: () => fetchAPI('/api/purchases/summary?householdId=hogar_001'),
  createPurchase: (data: any) => fetchAPI('/api/purchases', { method: 'POST', body: JSON.stringify(data) }),
  
  // Energy
  getEnergyReadings: (params = '') => fetchAPI(`/api/energy/readings${params ? '?' + params : ''}`),
  getEnergySummary: () => fetchAPI('/api/energy/summary?householdId=hogar_001'),
  createEnergyReading: (data: any) => fetchAPI('/api/energy/readings', { method: 'POST', body: JSON.stringify(data) }),
  
  // Food
  getFood: (params = '') => fetchAPI(`/api/food${params ? '?' + params : ''}`),
  getFoodWasteSummary: () => fetchAPI('/api/food/waste-summary?householdId=hogar_001'),
  createFood: (data: any) => fetchAPI('/api/food', { method: 'POST', body: JSON.stringify(data) }),
  wasteFood: (id: string) => fetchAPI(`/api/food/${id}/waste`, { method: 'PATCH' }),
  consumeFood: (id: string) => fetchAPI(`/api/food/${id}/consume`, { method: 'PATCH' }),
  
  // Gamification
  getProfile: (householdId = 'hogar_001') => fetchAPI(`/api/gamification/profile/${householdId}`),
  getAchievements: (householdId = 'hogar_001') => fetchAPI(`/api/gamification/achievements?householdId=${householdId}`),
  getPointsHistory: (householdId = 'hogar_001') => fetchAPI(`/api/gamification/points-history/${householdId}`),
  
  // Simulation
  simulate: (data: any) => fetchAPI('/api/simulate', { method: 'POST', body: JSON.stringify(data) }),
  predictSimulation: (data: any) => fetchAPI('/api/simulation/predict', { method: 'POST', body: JSON.stringify(data) }),

  // Finances & Invoices
  getFinances: () => fetchAPI('/api/finances?householdId=hogar_001'),
  scanInvoice: (formData: FormData) => fetchAPI('/api/invoices/scan', { method: 'POST', body: formData as any }), // Note: Don't set Content-Type for FormData
  saveInvoice: (data: any) => fetchAPI('/api/invoices', { method: 'POST', body: JSON.stringify(data) })
};

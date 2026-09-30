const API_URL = 'http://localhost:3000/api';
const fs = require('fs');
const path = require('path');

const products = [
  { name: 'Arroz', price: 25, category: 'alimentos', unit: 'kg' },
  { name: 'Fideos', price: 8, category: 'alimentos', unit: 'bolsa' },
  { name: 'Aceite', price: 18, category: 'alimentos', unit: 'litro' },
  { name: 'Azúcar', price: 12, category: 'alimentos', unit: 'kg' },
  { name: 'Carne de res', price: 45, category: 'alimentos', unit: 'kg' },
  { name: 'Pollo', price: 35, category: 'alimentos', unit: 'kg' },
  { name: 'Papa', price: 10, category: 'alimentos', unit: 'arroba' },
  { name: 'Cebolla', price: 5, category: 'alimentos', unit: 'cuartilla' },
  { name: 'Tomate', price: 8, category: 'alimentos', unit: 'kg' },
  { name: 'Chuño', price: 15, category: 'alimentos', unit: 'cuartilla' },
  { name: 'Quinua', price: 22, category: 'alimentos', unit: 'kg' },
  { name: 'Leche', price: 8, category: 'alimentos', unit: 'litro' },
  { name: 'Pan', price: 3, category: 'alimentos', unit: 'bolsa' },
  { name: 'Huevos', price: 12, category: 'alimentos', unit: 'docena' },
  { name: 'Gas', price: 25, category: 'servicios', unit: 'garrafa' },
  { name: 'Pasaje de minibús', price: 2.5, category: 'transporte', unit: 'viaje' },
  { name: 'Jabón', price: 7, category: 'hogar', unit: 'barra' },
  { name: 'Detergente', price: 15, category: 'hogar', unit: 'bolsa' },
  { name: 'Salteña', price: 5, category: 'ocio', unit: 'unidad' },
  { name: 'Api', price: 3, category: 'ocio', unit: 'vaso' },
  { name: 'Ingredientes de llajwa', price: 8, category: 'alimentos', unit: 'varios' }
];

async function waitGateway() {
  console.log("Waiting for API Gateway...");
  while (true) {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) {
        console.log("Gateway is ready.");
        break;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function seedData() {
  const householdId = 'hogar_001';
  const now = new Date('2026-09-30T00:00:00Z');

  console.log("Seeding purchases...");
  for (let month = 0; month < 6; month++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - month);
    for (let i = 0; i < 30; i++) {
      const prod = products[(i + month) % products.length];
      const date = new Date(d);
      date.setDate(Math.floor(Math.random() * 28) + 1);
      
      await fetch(`${API_URL}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          category: prod.category,
          item: prod.name,
          amountBs: prod.price,
          quantity: 1,
          unit: prod.unit,
          timestamp: date.toISOString()
        })
      });
    }
  }

  console.log("Seeding monthly electricity bills...");
  const monthlyKwh = [255, 241, 236, 224, 228, 221];
  for (let month = 0; month < 6; month++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - month);
    const monthKey = d.toISOString().slice(0, 7);
    await fetch(`${API_URL}/bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ householdId, kWh: monthlyKwh[month], month: monthKey })
    });
  }

  await fetch(`${API_URL}/budget`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ householdId, income: 4200 })
  });

  console.log("Seeding food items...");
  const foodsCreated = [];
  for (let month = 0; month < 6; month++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - month);
    for (let i = 0; i < 15; i++) {
      const prod = products[Math.floor(Math.random() * products.length)];
      const date = new Date(d);
      date.setDate(Math.floor(Math.random() * 28) + 1);
      
      const res = await fetch(`${API_URL}/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          name: prod.name,
          category: prod.category,
          quantityKg: 1 + Math.random() * 2,
          createdAt: date.toISOString()
        })
      });
      if (res.ok) {
        const item = await res.json();
        foodsCreated.push(item);
      }
    }
  }

  console.log("Updating food status (consumed/wasted)...");
  for (let index = 0; index < foodsCreated.length; index++) {
    const item = foodsCreated[index];
    const rand = (index % 10) / 10;
    let status = 'stored';
    if (rand < 0.6) status = 'consumed';
    else if (rand < 0.9) status = 'wasted';
    
    if (status !== 'stored') {
      await fetch(`${API_URL}/food/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, occurredAt: item.createdAt })
      });
    }
  }
  
  console.log("Seeding finances...");
  // 1. Create Accounts
  const accountsRes = await Promise.all([
    fetch(`${API_URL}/finances/accounts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Efectivo', type: 'cash', balance: 500 }) }),
    fetch(`${API_URL}/finances/accounts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Banco', type: 'bank', balance: 3500 }) }),
    fetch(`${API_URL}/finances/accounts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Ahorros', type: 'savings', balance: 1200 }) })
  ]);
  const accounts = await Promise.all(accountsRes.map(res => res.json()));
  const bankAcc = accounts.find(a => a.type === 'bank');

  // 2. Create Goal
  await fetch(`${API_URL}/finances/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Fondo de emergencia', targetAmount: 5000, currentAmount: 1200, targetDate: new Date(now.getTime() + 180*24*60*60*1000).toISOString() })
  });

  // 3. Transactions (Salary and fixed expenses for the last 6 months)
  for (let month = 0; month < 6; month++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - month);
    d.setDate(1); // 1st of the month
    
    // Income
    await fetch(`${API_URL}/finances/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: bankAcc.id, amount: 4200, type: 'income', category: 'income', isRecurring: true, timestamp: d.toISOString() })
    });

    // Rent
    const rentDate = new Date(d); rentDate.setDate(5);
    await fetch(`${API_URL}/finances/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: bankAcc.id, amount: 1500, type: 'expense', category: 'needs', isRecurring: true, timestamp: rentDate.toISOString() })
    });
  }

  const demoData = {
    income: 4200,
    months: [
      { month: '2026-04', energyKwh: 221, wasteKg: 5.4, categories: { alimentos: 1880, servicios: 490, transporte: 210, ocio: 320, hogar: 160 } },
      { month: '2026-05', energyKwh: 228, wasteKg: 6.1, categories: { alimentos: 1940, servicios: 510, transporte: 190, ocio: 280, hogar: 240 } },
      { month: '2026-06', energyKwh: 224, wasteKg: 5.8, categories: { alimentos: 2010, servicios: 500, transporte: 230, ocio: 310, hogar: 190 } },
      { month: '2026-07', energyKwh: 236, wasteKg: 7.2, categories: { alimentos: 2050, servicios: 520, transporte: 210, ocio: 350, hogar: 210 } },
      { month: '2026-08', energyKwh: 241, wasteKg: 7.1, categories: { alimentos: 2090, servicios: 505, transporte: 220, ocio: 300, hogar: 180 } },
      { month: '2026-09', energyKwh: 255, wasteKg: 8.5, categories: { alimentos: 850, servicios: 400, transporte: 140, ocio: 330, hogar: 250 } }
    ],
    bills: [
      { month: '2026-04', kWh: 221, totalBs: 226.49, co2Kg: 110.5 }, { month: '2026-05', kWh: 228, totalBs: 235.02, co2Kg: 114 },
      { month: '2026-06', kWh: 224, totalBs: 230.14, co2Kg: 112 }, { month: '2026-07', kWh: 236, totalBs: 244.77, co2Kg: 118 },
      { month: '2026-08', kWh: 241, totalBs: 250.87, co2Kg: 120.5 }, { month: '2026-09', kWh: 255, totalBs: 264.28, co2Kg: 127.5 }
    ],
    accounts: [{ id: 'demo-cash', name: 'Efectivo', type: 'cash', balance: 500 }, { id: 'demo-bank', name: 'Banco', type: 'bank', balance: 3500 }, { id: 'demo-savings', name: 'Ahorro', type: 'savings', balance: 1200 }],
    transactions: Array.from({ length: 6 }, (_, index) => {
      const d = new Date('2026-09-01T12:00:00Z');
      d.setUTCMonth(d.getUTCMonth() - (5 - index));
      const month = d.toISOString().slice(0, 7);
      return [
        { id: `seed-income-${month}`, description: 'Ingreso mensual', amount: 4200, type: 'income', category: 'income', timestamp: `${month}-01T12:00:00.000Z` },
        { id: `seed-rent-${month}`, description: 'Alquiler', amount: 1500, type: 'expense', category: 'needs', timestamp: `${month}-05T12:00:00.000Z` }
      ];
    }).flat(),
    goals: [{ id: 'demo-goal-1', name: 'Fondo de emergencia', targetAmount: 5000, currentAmount: 1200, targetDate: '2027-03-29' }],
    gamification: { points: 86, level: 1, levelName: 'Principiante', nextLevelPoints: 101, progress: 85 }
  };
  fs.writeFileSync(path.join(__dirname, '../frontend/public/demo-data.json'), `${JSON.stringify(demoData, null, 2)}\n`);
  console.log("Seed and frontend demo data generated.");
}

async function run() {
  await waitGateway();
  await seedData();
}

run();

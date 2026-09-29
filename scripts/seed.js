const API_URL = 'http://localhost:3000/api';

const products = [
  { name: 'Arroz', price: 25, category: 'mercado', unit: 'kg' },
  { name: 'Fideos', price: 8, category: 'mercado', unit: 'bolsa' },
  { name: 'Aceite', price: 18, category: 'mercado', unit: 'litro' },
  { name: 'Azúcar', price: 12, category: 'mercado', unit: 'kg' },
  { name: 'Carne de res', price: 45, category: 'carnes', unit: 'kg' },
  { name: 'Pollo', price: 35, category: 'carnes', unit: 'kg' },
  { name: 'Papa', price: 10, category: 'verduras', unit: 'arroba' },
  { name: 'Cebolla', price: 5, category: 'verduras', unit: 'cuartilla' },
  { name: 'Tomate', price: 8, category: 'verduras', unit: 'kg' },
  { name: 'Chuño', price: 15, category: 'mercado', unit: 'cuartilla' },
  { name: 'Quinua', price: 22, category: 'mercado', unit: 'kg' },
  { name: 'Leche', price: 8, category: 'lacteos', unit: 'litro' },
  { name: 'Pan', price: 3, category: 'panaderia', unit: 'bolsa' },
  { name: 'Huevos', price: 12, category: 'mercado', unit: 'docena' },
  { name: 'Gas', price: 25, category: 'servicios', unit: 'garrafa' },
  { name: 'Jabón', price: 7, category: 'limpieza', unit: 'barra' },
  { name: 'Detergente', price: 15, category: 'limpieza', unit: 'bolsa' },
  { name: 'Salteña', price: 5, category: 'snacks', unit: 'unidad' },
  { name: 'Api', price: 3, category: 'snacks', unit: 'vaso' },
  { name: 'Llajwa ingredients', price: 8, category: 'verduras', unit: 'varios' }
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
      const prod = products[Math.floor(Math.random() * products.length)];
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

  console.log("Seeding energy readings...");
  for (let month = 0; month < 6; month++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - month);
    // Higher consumption in winter (June-August)
    const isWinter = d.getMonth() >= 5 && d.getMonth() <= 7;
    for (let i = 1; i <= 30; i++) {
      const date = new Date(d);
      date.setDate(i);
      
      const kwh = isWinter ? (10 + Math.random() * 5) : (8 + Math.random() * 5);
      
      await fetch(`${API_URL}/energy/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          deviceType: 'general',
          kWh: kwh,
          timestamp: date.toISOString()
        })
      });
    }
  }

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
          quantityKg: 1 + Math.random() * 2
        })
      });
      if (res.ok) {
        const item = await res.json();
        foodsCreated.push(item);
      }
    }
  }

  console.log("Updating food status (consumed/wasted)...");
  for (const item of foodsCreated) {
    const rand = Math.random();
    let status = 'stored';
    if (rand < 0.6) status = 'consumed';
    else if (rand < 0.9) status = 'wasted';
    
    if (status !== 'stored') {
      await fetch(`${API_URL}/food/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
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
    body: JSON.stringify({ name: 'Fondo de Emergencia', targetAmount: 5000, currentAmount: 1200, targetDate: new Date(now.getTime() + 180*24*60*60*1000).toISOString() })
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
      body: JSON.stringify({ accountId: bankAcc.id, amount: 4500, type: 'income', category: 'Salario', isRecurring: true, timestamp: d.toISOString() })
    });

    // Rent
    const rentDate = new Date(d); rentDate.setDate(5);
    await fetch(`${API_URL}/finances/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: bankAcc.id, amount: 1500, type: 'expense', category: 'Alquiler', isRecurring: true, timestamp: rentDate.toISOString() })
    });
  }

  console.log("Seeding complete!");
}

async function run() {
  await waitGateway();
  await seedData();
}

run();

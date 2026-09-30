const API_URL = 'http://localhost:3000/api';

const products = [
  { name: 'Arroz', price: 25, category: 'mercado', unit: 'kg' },
  { name: 'Fideos', price: 8, category: 'mercado', unit: 'bolsa' },
  { name: 'Aceite', price: 18, category: 'mercado', unit: 'litro' },
  { name: 'Leche', price: 8, category: 'lacteos', unit: 'litro' },
  { name: 'Pan', price: 3, category: 'panaderia', unit: 'bolsa' }
];

async function waitGateway() {
  console.log("Live Generator: Waiting for API Gateway...");
  while (true) {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log("Live Generator: Gateway ready. Starting event generation...");
}

async function run() {
  await waitGateway();
  const householdId = 'hogar_001';

  while (true) {
    const waitTime = 3000 + Math.random() * 2000;
    await new Promise(r => setTimeout(r, waitTime));

    const rand = Math.random();
    if (rand < 0.025) {
      const now = new Date();
      const month = now.toISOString().slice(0, 7);
      const kWh = 180 + Math.random() * 100;
      await fetch(`${API_URL}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId, month, kWh })
      });
      console.log(`[${now.toISOString()}] Emitted electricity bill: ${kWh.toFixed(1)} kWh`);
    } else if (rand < 0.4) {
      // Purchase
      const prod = products[Math.floor(Math.random() * products.length)];
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
          timestamp: new Date().toISOString()
        })
      });
      console.log(`[${new Date().toISOString()}] Emitted Purchase: ${prod.name}`);
    } else if (rand < 0.7) {
      // Energy
      const kwh = 0.5 + Math.random() * 2.5;
      await fetch(`${API_URL}/energy/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          deviceType: 'live_test',
          kWh: kwh,
          timestamp: new Date().toISOString()
        })
      });
      console.log(`[${new Date().toISOString()}] Emitted Energy Reading: ${kwh.toFixed(2)} kWh`);
    } else if (rand < 0.9) {
      // Food
      const prod = products[Math.floor(Math.random() * products.length)];
      await fetch(`${API_URL}/food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          name: prod.name,
          category: prod.category,
          quantityKg: 1
        })
      });
      console.log(`[${new Date().toISOString()}] Emitted Food Registration: ${prod.name}`);
    } else {
      // Waste
      try {
        const res = await fetch(`${API_URL}/food?householdId=${householdId}`);
        if (res.ok) {
          const foods = await res.json();
          const storedFoods = foods.filter(f => f.status === 'stored');
          if (storedFoods.length > 0) {
            const f = storedFoods[Math.floor(Math.random() * storedFoods.length)];
            await fetch(`${API_URL}/food/${f.id}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'wasted' })
            });
            console.log(`[${new Date().toISOString()}] Emitted Food Waste: ${f.name}`);
          }
        }
      } catch (e) {}
    }
  }
}

run();

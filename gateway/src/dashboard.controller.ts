import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Controller()
export class DashboardController {
  constructor(private readonly httpService: HttpService) {}

  @Get('api/dashboard')
  async getDashboard(@Query('householdId') householdId: string) {
    if (!householdId) {
      throw new BadRequestException('householdId es obligatorio.');
    }

    const requests = [
      this.httpService.axiosRef.get(`${process.env.PURCHASES_URL}/purchases/summary`, { params: { householdId } }).then(res => res.data),
      this.httpService.axiosRef.get(`${process.env.ENERGY_URL}/energy/summary`, { params: { householdId } }).then(res => res.data),
      this.httpService.axiosRef.get(`${process.env.FOOD_URL}/food/waste-summary`, { params: { householdId } }).then(res => res.data),
      this.httpService.axiosRef.get(`${process.env.GAMIFICATION_URL}/gamification/profile/${householdId}`).then(res => res.data),
      this.httpService.axiosRef.get(`${process.env.FINANCES_URL}/finances/budget`, { params: { householdId } }).then(res => res.data),
      this.httpService.axiosRef.get(`${process.env.FINANCES_URL}/finances/transactions`).then(res => res.data),
      this.httpService.axiosRef.get(`${process.env.FINANCES_URL}/finances/accounts`).then(res => res.data),
    ];

    const results = await Promise.allSettled(requests);
    const value = (index: number, fallback: any) => results[index].status === 'fulfilled' ? results[index].value : fallback;
    const purchases = value(0, []);
    const energy = value(1, { summary: [] });
    const food = value(2, { summary: [] });
    const profile = value(3, null);
    const budget = value(4, { income: 0 });
    const transactions = value(5, []);
    const accounts = value(6, []);
    const month = new Date().toISOString().slice(0, 7);
    const purchaseRows = Array.isArray(purchases) ? purchases : [];
    const energyRows = energy?.summary ?? [];
    const foodRows = food?.summary ?? [];
    const financeRows = Array.isArray(transactions) ? transactions : [];
    const currentPurchases = purchaseRows.filter(row => row.month === month);
    const currentEnergy = energyRows.filter(row => row.month === month);
    const currentFood = foodRows.filter(row => row.month === month);
    const currentTransactions = financeRows.filter(row => String(row.timestamp ?? '').startsWith(month) && row.type === 'expense');
    const categorySpending = currentPurchases.reduce((totals, row) => {
      const amount = Number(row.totalBs) || 0;
      totals.all += amount;
      if (String(row.category).toLowerCase() === 'ocio') totals.wants += amount;
      else totals.needs += amount;
      return totals;
    }, { all: 0, needs: 0, wants: 0 });
    const financeSpending = currentTransactions.reduce((total, row) => total + (Number(row.amount) || 0), 0);
    const financeSavings = currentTransactions
      .filter(row => String(row.category).toLowerCase() === 'savings')
      .reduce((total, row) => total + (Number(row.amount) || 0), 0);
    const spendingByMonth = new Map<string, number>();
    for (const row of purchaseRows) {
      spendingByMonth.set(row.month, (spendingByMonth.get(row.month) ?? 0) + (Number(row.totalBs) || 0));
    }
    for (const row of financeRows.filter(item => item.type === 'expense')) {
      const txMonth = String(row.timestamp ?? '').slice(0, 7);
      if (txMonth) spendingByMonth.set(txMonth, (spendingByMonth.get(txMonth) ?? 0) + (Number(row.amount) || 0));
    }
    const spendingTrend = Array.from(spendingByMonth.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-6)
      .map(([trendMonth, amountBs]) => ({ month: trendMonth, amountBs: Number(amountBs.toFixed(2)) }));
    const needsSpent = categorySpending.needs + currentTransactions
      .filter(row => !['ocio', 'wants', 'savings'].includes(String(row.category).toLowerCase()))
      .reduce((total, row) => total + (Number(row.amount) || 0), 0);
    const wantsSpent = categorySpending.wants + currentTransactions
      .filter(row => ['ocio', 'wants'].includes(String(row.category).toLowerCase()))
      .reduce((total, row) => total + (Number(row.amount) || 0), 0);
    const income = Number(budget?.income) || 0;
    const needsLimit = income * 0.5;
    const wantsLimit = income * 0.3;
    const savingsTarget = income * 0.2;
    const energyKwh = currentEnergy.reduce((total, row) => total + (Number(row.totalKwh) || 0), 0);
    const wasteKg = currentFood.reduce((total, row) => total + (Number(row.totalKg) || 0), 0);
    const average = (rows: any[], field: string) => {
      const previous = rows.filter(row => row.month !== month).map(row => Number(row[field]) || 0);
      return previous.length ? previous.reduce((total, amount) => total + amount, 0) / previous.length : 0;
    };
    const alerts: Array<{ type: string; message: string }> = [];
    const averageEnergy = average(energyRows, 'totalKwh');
    const averageWaste = average(foodRows, 'totalKg');
    if (averageEnergy > 0 && energyKwh > averageEnergy * 1.1) {
      alerts.push({ type: 'energy', message: 'El consumo de energía supera en más de 10% tu promedio.' });
    }
    if (averageWaste > 0 && wasteKg > averageWaste * 1.2) {
      alerts.push({ type: 'waste', message: 'El desperdicio supera en más de 20% tu nivel habitual.' });
    }
    if (needsLimit > 0 && needsSpent >= needsLimit * 0.9) {
      alerts.push({ type: 'budget', message: 'Tus necesidades alcanzaron 90% del límite mensual.' });
    }
    const spent = categorySpending.all + financeSpending;
    const available = income - spent;

    return {
      purchases,
      energy,
      food,
      gamification: profile,
      profile,
      month,
      spentBs: Number(spent.toFixed(2)),
      availableBs: Number(available.toFixed(2)),
      budget: {
        incomeBs: income,
        needs: { limitBs: Number(needsLimit.toFixed(2)), spentBs: Number(needsSpent.toFixed(2)) },
        wants: { limitBs: Number(wantsLimit.toFixed(2)), spentBs: Number(wantsSpent.toFixed(2)) },
        savings: { targetBs: Number(savingsTarget.toFixed(2)), spentBs: Number(financeSavings.toFixed(2)) },
      },
      accounts,
      alerts,
      spendingTrend,
      co2Kg: Number((currentPurchases.reduce((total, row) => total + (Number(row.totalCo2Kg) || 0), 0)
        + currentEnergy.reduce((total, row) => total + (Number(row.totalCo2) || 0), 0)
        + currentFood.reduce((total, row) => total + (Number(row.totalCo2) || 0), 0)).toFixed(2)),
      timestamp: new Date()
    };
  }

  @Get('api/health')
  getHealth() {
    return { status: 'ok', service: 'gateway' };
  }
}

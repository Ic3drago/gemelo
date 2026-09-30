import { BadRequestException, Controller, Get, Post, Put, Patch, Body, Param, Query, UploadedFile, UseInterceptors, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api')
export class ProxyController {
  constructor(private readonly httpService: HttpService) {}

  private async forward(method: string, url: string, data?: any, params?: any) {
    try {
      const response = await this.httpService.axiosRef({
        method,
        url,
        data,
        params
      });
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data ?? { error: true, message: error.message || 'Servicio no disponible' },
        error.response?.status || 502,
      );
    }
  }

  @Post('purchases')
  async createPurchase(@Body() body: any) {
    return this.forward('POST', `${process.env.PURCHASES_URL}/purchases`, body);
  }

  @Get('purchases')
  async getPurchases(@Query() query: any) {
    return this.forward('GET', `${process.env.PURCHASES_URL}/purchases`, undefined, query);
  }

  @Get('purchases/summary')
  async getPurchasesSummary(@Query() query: any) {
    return this.forward('GET', `${process.env.PURCHASES_URL}/purchases/summary`, undefined, query);
  }

  @Post('energy/readings')
  async createEnergyReading(@Body() body: any) {
    return this.forward('POST', `${process.env.ENERGY_URL}/energy/readings`, body);
  }

  @Get('energy/readings')
  async getEnergyReadings(@Query() query: any) {
    return this.forward('GET', `${process.env.ENERGY_URL}/energy/readings`, undefined, query);
  }

  @Get('energy/summary')
  async getEnergySummary(@Query() query: any) {
    return this.forward('GET', `${process.env.ENERGY_URL}/energy/summary`, undefined, query);
  }

  @Post('bills/calculate')
  calculateBill(@Body() body: { kWh: number }) {
    return this.forward('POST', `${process.env.ENERGY_URL}/bills/calculate`, body);
  }

  @Post('bills')
  createBill(@Body() body: { kWh: number; month: string; householdId?: string }) {
    return this.forward('POST', `${process.env.ENERGY_URL}/bills`, body);
  }

  @Get('bills')
  getBills(@Query() query: any) {
    return this.forward('GET', `${process.env.ENERGY_URL}/bills`, undefined, query);
  }

  @Post('food')
  async createFood(@Body() body: any) {
    return this.forward('POST', `${process.env.FOOD_URL}/food`, body);
  }

  @Get('food')
  async getFood(@Query() query: any) {
    return this.forward('GET', `${process.env.FOOD_URL}/food`, undefined, query);
  }

  @Get('food/waste-summary')
  async getFoodWasteSummary(@Query() query: any) {
    return this.forward('GET', `${process.env.FOOD_URL}/food/waste-summary`, undefined, query);
  }

  @Get('food/reminders')
  getFoodReminders(@Query('householdId') householdId = 'hogar_001') {
    return this.forward('GET', `${process.env.FOOD_URL}/food/reminders`, undefined, { householdId });
  }

  @Post('food/reminders')
  createFoodReminder(@Body() body: any) {
    return this.forward('POST', `${process.env.FOOD_URL}/food/reminders`, body);
  }

  @Patch('food/:id/status')
  async updateFoodStatus(@Param('id') id: string, @Body() body: any) {
    return this.forward('PATCH', `${process.env.FOOD_URL}/food/${id}/status`, body);
  }

  @Patch('food/:id/waste')
  async wasteFood(@Param('id') id: string) {
    return this.forward('PATCH', `${process.env.FOOD_URL}/food/${id}/status`, { status: 'wasted' });
  }

  @Patch('food/:id/consume')
  async consumeFood(@Param('id') id: string) {
    return this.forward('PATCH', `${process.env.FOOD_URL}/food/${id}/status`, { status: 'consumed' });
  }

  @Get('gamification/profile/:householdId')
  async getProfile(@Param('householdId') householdId: string) {
    return this.forward('GET', `${process.env.GAMIFICATION_URL}/gamification/profile/${householdId}`);
  }

  @Get('gamification/profile')
  getDefaultProfile(@Query('householdId') householdId = 'hogar_001') {
    return this.forward('GET', `${process.env.GAMIFICATION_URL}/gamification/profile/${householdId}`);
  }

  @Get('gamification/achievements')
  async getAchievements(@Query() query: any) {
    return this.forward('GET', `${process.env.GAMIFICATION_URL}/gamification/achievements`, undefined, query);
  }

  @Get('gamification/leaderboard')
  getLeaderboard(@Query() query: any) {
    return this.forward('GET', `${process.env.GAMIFICATION_URL}/gamification/leaderboard`, undefined, query);
  }

  @Get('gamification/points-history/:householdId')
  async getPointsHistory(@Param('householdId') householdId: string) {
    return this.forward('GET', `${process.env.GAMIFICATION_URL}/gamification/points-history/${householdId}`);
  }

  @Post('simulate')
  async simulate(@Body() body: any) {
    return this.forward('POST', `${process.env.SIMULATION_URL}/simulate`, body);
  }

  @Get('predict')
  async predict(@Query() query: any) {
    return this.forward('GET', `${process.env.SIMULATION_URL}/predict`, undefined, query);
  }

  @Get('predictions')
  getPredictions(@Query() query: any) {
    return this.forward('GET', `${process.env.SIMULATION_URL}/predict`, undefined, query);
  }

  @Post('simulation/simulate')
  simulateScenario(@Body() body: any) {
    return this.forward('POST', `${process.env.SIMULATION_URL}/simulate`, body);
  }

  @Post('retrain')
  async retrain() {
    return this.forward('POST', `${process.env.SIMULATION_URL}/retrain`);
  }

  // --- Invoices ---
  @Post('invoices/scan')
  @UseInterceptors(FileInterceptor('invoice'))
  async scanInvoice(@UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string }) {
    if (!file) throw new BadRequestException('Adjunta una imagen o PDF de la factura.');
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
    return this.forward('POST', `${process.env.INVOICES_URL}/scan`, formData);
  }

  @Post('invoices')
  async saveInvoice(@Body() body: any) {
    const total = Number(body.total);
    if (!Number.isFinite(total) || total <= 0) {
      throw new BadRequestException('El total de la factura debe ser mayor que cero.');
    }
    const details = [body.store, body.date].filter(Boolean).join(' - ');
    return this.forward('POST', `${process.env.PURCHASES_URL}/purchases`, {
      householdId: body.householdId || 'hogar_001',
      category: 'supermercado',
      item: details ? `Factura: ${details}` : 'Factura escaneada',
      amountBs: total,
      quantity: 1,
      unit: 'factura',
    });
  }

  @Post('invoices/confirm')
  async confirmInvoice(@Body() body: any) {
    const total = Number(body.total);
    if (!Number.isFinite(total) || total <= 0) {
      throw new BadRequestException('El total de la factura debe ser mayor que cero.');
    }
    const categories = ['alimentos', 'servicios', 'transporte', 'ocio', 'hogar'];
    const category = body.category || 'alimentos';
    if (!categories.includes(category)) {
      throw new BadRequestException(`Categoría inválida. Use: ${categories.join(', ')}.`);
    }
    if (Array.isArray(body.items) && body.items.some((item: any) => item.price !== undefined && (!Number.isFinite(Number(item.price)) || Number(item.price) < 0))) {
      throw new BadRequestException('Cada precio de ítem debe ser un monto igual o mayor que cero.');
    }
    if (Array.isArray(body.items) && body.items.some((item: any) => item.category && !categories.includes(item.category))) {
      throw new BadRequestException(`La categoría de cada ítem debe ser una de: ${categories.join(', ')}.`);
    }
    const details = [body.store, body.date, body.number, body.nit ? `NIT ${body.nit}` : null].filter(Boolean).join(' - ');
    const names = Array.isArray(body.items)
      ? body.items.map((item: any) => String(item.name || '').trim()).filter(Boolean).join(', ')
      : '';
    const purchase = await this.forward('POST', `${process.env.PURCHASES_URL}/purchases`, {
      householdId: body.householdId || 'hogar_001',
      category,
      item: names || (details ? `Factura: ${details}` : 'Factura confirmada'),
      amountBs: total,
      quantity: 1,
      unit: 'factura',
    });
    const perishableItems = Array.isArray(body.items) ? body.items.filter((item: any) => item.perishability && Number(item.estimatedExpiryDays) > 0) : [];
    const reminderResults = await Promise.allSettled(perishableItems.map((item: any) => {
      const days = Math.min(60, Math.max(1, Math.floor(Number(item.estimatedExpiryDays))));
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
      return this.forward('POST', `${process.env.FOOD_URL}/food/reminders`, {
        householdId: body.householdId || 'hogar_001',
        name: String(item.name).trim(),
        expiresAt: expiresAt.toISOString(),
      });
    }));
    const reminders = reminderResults.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
    return { purchase, reminders };
  }

  // --- Finances ---
  @Get('finances/*')
  async getFinances(@Param('0') path: string, @Query() query: any) {
    return this.forward('GET', `${process.env.FINANCES_URL}/finances/${path}`, undefined, query);
  }

  @Post('finances/*')
  async postFinances(@Param('0') path: string, @Body() body: any) {
    return this.forward('POST', `${process.env.FINANCES_URL}/finances/${path}`, body);
  }

  @Put('finances/*')
  async putFinances(@Param('0') path: string, @Body() body: any) {
    return this.forward('PUT', `${process.env.FINANCES_URL}/finances/${path}`, body);
  }

  @Get('budget')
  getBudget(@Query() query: any) {
    return this.forward('GET', `${process.env.FINANCES_URL}/finances/budget`, undefined, query);
  }

  @Put('budget')
  putBudget(@Body() body: any) {
    return this.forward('PUT', `${process.env.FINANCES_URL}/finances/budget`, body);
  }
}

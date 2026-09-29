import { Controller, Get, Post, Body } from '@nestjs/common';
import { FinancesService } from './finances.service';

@Controller('finances')
export class FinancesController {
  constructor(private readonly financesService: FinancesService) {}

  @Get('health')
  healthCheck() {
    return { status: 'ok', service: 'finances' };
  }

  @Get('accounts')
  getAccounts() {
    return this.financesService.getAccounts();
  }
  @Post('accounts')
  createAccount(@Body() body: any) {
    return this.financesService.createAccount(body);
  }

  @Get('transactions')
  getTransactions() {
    return this.financesService.getTransactions();
  }
  @Post('transactions')
  addTransaction(@Body() body: any) {
    return this.financesService.addTransaction(body);
  }

  @Get('goals')
  getGoals() {
    return this.financesService.getGoals();
  }
  @Post('goals')
  createGoal(@Body() body: any) {
    return this.financesService.createGoal(body);
  }

  @Get('budgets')
  getBudgets() {
    return this.financesService.getBudgets();
  }
  @Post('budgets')
  createBudget(@Body() body: any) {
    return this.financesService.createBudget(body);
  }
}

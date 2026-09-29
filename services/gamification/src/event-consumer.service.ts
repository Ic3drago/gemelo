import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { GamificationService } from './gamification.service';

@Injectable()
export class EventConsumerService implements OnModuleInit {
  private readonly logger = new Logger(EventConsumerService.name);

  constructor(private readonly gamificationService: GamificationService) {}

  async onModuleInit() {
    this.connectToRabbitMQ();
  }

  private async connectToRabbitMQ(retries = 10) {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    while (retries > 0) {
      try {
        const conn = await amqp.connect(rabbitUrl);
        const channel = await conn.createChannel();

        const exchange = 'household.events';
        await channel.assertExchange(exchange, 'topic', { durable: true });

        const q = await channel.assertQueue('gamification.events', { durable: true });

        // Bind all required routing keys
        await channel.bindQueue(q.queue, exchange, 'purchase.registered');
        await channel.bindQueue(q.queue, exchange, 'energy.reading');
        await channel.bindQueue(q.queue, exchange, 'food.consumed');
        await channel.bindQueue(q.queue, exchange, 'food.wasted');

        this.logger.log('Connected to RabbitMQ and listening to gamification.events');

        channel.consume(q.queue, async (msg) => {
          if (msg) {
            try {
              const content = JSON.parse(msg.content.toString());
              const routingKey = msg.fields.routingKey;
              const householdId = content.householdId || 'hogar_001';

              await this.processEvent(routingKey, householdId, content);

              channel.ack(msg);
            } catch (error) {
              this.logger.error(`Error processing message: ${error.message}`);
              channel.nack(msg, false, false);
            }
          }
        });
        break;
      } catch (err) {
        retries -= 1;
        this.logger.warn(`Failed to connect to RabbitMQ. Retries left: ${retries}`);
        await new Promise(res => setTimeout(res, 3000));
      }
    }
  }

  private async processEvent(routingKey: string, householdId: string, content: any) {
    if (routingKey === 'purchase.registered') {
      const item = content.item || 'Producto';
      await this.gamificationService.awardPoints(householdId, 5, `Compra registrada: ${item}`, routingKey);
    } else if (routingKey === 'energy.reading') {
      const kwh = content.kWh || 0;
      if (kwh < 5) {
        await this.gamificationService.awardPoints(householdId, 15, 'Lectura energética eficiente', routingKey);
      } else {
        await this.gamificationService.awardPoints(householdId, 3, 'Lectura registrada', routingKey);
      }
    } else if (routingKey === 'food.consumed') {
      const name = content.name || 'Alimento';
      await this.gamificationService.awardPoints(householdId, 10, `Alimento consumido sin desperdiciar: ${name}`, routingKey);
    } else if (routingKey === 'food.wasted') {
      const name = content.name || 'Alimento';
      await this.gamificationService.awardPoints(householdId, -5, `Desperdicio de alimento: ${name}`, routingKey);
    }

    await this.gamificationService.checkAchievements(householdId);
  }
}

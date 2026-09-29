import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { GamificationService } from './gamification.service';
import { PointsPolicy } from './domain/points-policy';

/**
 * Adaptador de infraestructura: traduce mensajes RabbitMQ a llamadas de dominio.
 * No contiene ninguna regla de negocio — esas viven en PointsPolicy.
 */
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

              // Traducir el evento de infraestructura a una award de dominio
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

  /**
   * Obtiene la award correspondiente de PointsPolicy (dominio) y la aplica.
   * Este método es solo un despachador — sin condicionales de negocio propios.
   */
  private async processEvent(
    routingKey: string,
    householdId: string,
    content: any,
  ): Promise<void> {
    let award: { points: number; reason: string } | null = null;

    switch (routingKey) {
      case 'purchase.registered':
        award = PointsPolicy.forPurchase(content.item || 'Producto');
        break;
      case 'energy.reading':
        award = PointsPolicy.forEnergyReading(content.kWh || 0);
        break;
      case 'food.consumed':
        award = PointsPolicy.forFoodConsumed(content.name || 'Alimento');
        break;
      case 'food.wasted':
        award = PointsPolicy.forFoodWasted(content.name || 'Alimento');
        break;
      default:
        this.logger.warn(`Evento desconocido ignorado: ${routingKey}`);
    }

    if (award) {
      await this.gamificationService.awardPoints(
        householdId,
        award.points,
        award.reason,
        routingKey,
      );
      await this.gamificationService.checkAchievements(householdId);
    }
  }
}

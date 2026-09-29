import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private connection: any;
  private channel: any;
  private readonly logger = new Logger(RabbitMQService.name);
  private readonly exchange = 'household.events';

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      try {
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
        this.logger.log('Connected to RabbitMQ');
        return;
      } catch (err: any) {
        this.logger.warn(`RabbitMQ connection attempt ${i + 1}/${maxRetries} failed, retrying in 3s...`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    this.logger.error('Failed to connect to RabbitMQ after all retries');
  }

  async publish(routingKey: string, data: any) {
    if (!this.channel) {
      this.logger.warn('RabbitMQ channel not ready, attempting reconnect...');
      await this.connect();
    }
    try {
      this.channel.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(data)),
        { persistent: true, contentType: 'application/json' }
      );
      this.logger.log(`Published event: ${routingKey}`);
    } catch (err: any) {
      this.logger.error(`Failed to publish event: ${err.message}`);
    }
  }
}

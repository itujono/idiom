import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
  base: {
    app: "daily-idioms",
  },
});

// Create child loggers for different components
export const appLogger = logger.child({ component: "app" });
export const discordLogger = logger.child({ component: "discord" });
export const idiomsLogger = logger.child({ component: "idioms" });

// Metrics tracking
class Metrics {
  private messagesSent: number = 0;
  private idiomsSent: number = 0;
  private errors: number = 0;
  private lastDeliveryTime?: Date;
  private deliveryTimes: number[] = [];

  incrementMessagesSent() {
    this.messagesSent++;
    this.logMetrics();
  }

  incrementIdiomsSent(count: number) {
    this.idiomsSent += count;
    this.logMetrics();
  }

  incrementErrors() {
    this.errors++;
    this.logMetrics();
  }

  recordDeliveryTime() {
    const now = new Date();
    if (this.lastDeliveryTime) {
      const timeDiff = now.getTime() - this.lastDeliveryTime.getTime();
      this.deliveryTimes.push(timeDiff);
      // Keep only last 100 delivery times
      if (this.deliveryTimes.length > 100) {
        this.deliveryTimes.shift();
      }
    }
    this.lastDeliveryTime = now;
    this.logMetrics();
  }

  getAverageDeliveryTime(): number {
    if (this.deliveryTimes.length === 0) return 0;
    const sum = this.deliveryTimes.reduce((a, b) => a + b, 0);
    return sum / this.deliveryTimes.length;
  }

  private logMetrics() {
    logger.info({
      metrics: {
        messagesSent: this.messagesSent,
        idiomsSent: this.idiomsSent,
        errors: this.errors,
        averageDeliveryTime: `${(this.getAverageDeliveryTime() / 1000).toFixed(
          2
        )}s`,
      },
    });
  }

  getMetrics() {
    return {
      messagesSent: this.messagesSent,
      idiomsSent: this.idiomsSent,
      errors: this.errors,
      averageDeliveryTime: `${(this.getAverageDeliveryTime() / 1000).toFixed(
        2
      )}s`,
    };
  }
}

export const metrics = new Metrics();

import { IdiomsDiscordService, PhrasesDiscordService } from './discord';
import { IdiomsService } from './idioms';
import { PhrasesService } from './phrases';
import { appLogger as logger } from './logger';
import { CronJob } from 'cron';

export interface ServicesStatus {
  idioms_discord: boolean;
  phrases_discord: boolean;
  idioms: boolean;
  phrases: boolean;
  cron: boolean;
}

export class ServicesContainer {
  private idiomsDiscordService: IdiomsDiscordService | null = null;
  private phrasesDiscordService: PhrasesDiscordService | null = null;
  private idiomsService: IdiomsService | null = null;
  private phrasesService: PhrasesService | null = null;
  private cronJobs: CronJob[] = [];

  private status: ServicesStatus = {
    idioms_discord: false,
    phrases_discord: false,
    idioms: false,
    phrases: false,
    cron: false,
  };

  async initialize() {
    try {
      const IDIOMS_WEBHOOK_URL = process.env.IDIOMS_WEBHOOK_URL;
      const PHRASES_WEBHOOK_URL = process.env.PHRASES_WEBHOOK_URL;

      if (IDIOMS_WEBHOOK_URL) {
        this.idiomsDiscordService = new IdiomsDiscordService(IDIOMS_WEBHOOK_URL);
        this.status.idioms_discord = true;
      } else {
        logger.warn('IDIOMS_WEBHOOK_URL not provided, idioms Discord service will be disabled');
      }

      if (PHRASES_WEBHOOK_URL) {
        this.phrasesDiscordService = new PhrasesDiscordService(PHRASES_WEBHOOK_URL);
        this.status.phrases_discord = true;
      } else {
        logger.warn('PHRASES_WEBHOOK_URL not provided, phrases Discord service will be disabled');
      }

      this.idiomsService = new IdiomsService();
      this.status.idioms = true;

      this.phrasesService = new PhrasesService();
      this.status.phrases = true;

      if (this.areAllServicesReady()) {
        this.initializeCronJobs();
        this.status.cron = true;
      }
    } catch (error) {
      logger.error({ error }, 'Error initializing services');
      throw error;
    }
  }

  private initializeCronJobs() {
    // Schedule daily idioms delivery (1:00 AM UTC / 8:00 AM GMT+7)
    this.cronJobs.push(
      new CronJob(
        '0 1 * * *',
        async () => {
          try {
            logger.info('Starting scheduled idioms delivery');
            const dailyIdioms = await this.idiomsService!.getRandomIdioms();
            await this.idiomsDiscordService!.sendIdioms(dailyIdioms);
            logger.info('Daily idioms sent successfully');
          } catch (error) {
            logger.error({ error }, 'Failed to send daily idioms');
          }
        },
        null,
        true,
        'UTC'
      )
    );

    // Schedule daily phrases delivery (7:00 AM UTC / 2:00 PM GMT+7)
    this.cronJobs.push(
      new CronJob(
        '0 7 * * *',
        async () => {
          try {
            logger.info('Starting scheduled phrases delivery');
            const dailyPhrases = await this.phrasesService!.getPhrases(3);
            await this.phrasesDiscordService!.sendPhrases(dailyPhrases);
            logger.info('Daily phrases sent successfully');
          } catch (error) {
            logger.error({ error }, 'Failed to send daily phrases');
          }
        },
        null,
        true,
        'UTC'
      )
    );
  }

  private areAllServicesReady(): boolean {
    return !!(this.idiomsService && this.idiomsDiscordService && this.phrasesService && this.phrasesDiscordService);
  }

  getStatus(): ServicesStatus {
    return { ...this.status };
  }

  getIdiomsService(): IdiomsService | null {
    return this.idiomsService;
  }

  getPhrasesService(): PhrasesService | null {
    return this.phrasesService;
  }

  getIdiomsDiscordService(): IdiomsDiscordService | null {
    return this.idiomsDiscordService;
  }

  getPhrasesDiscordService(): PhrasesDiscordService | null {
    return this.phrasesDiscordService;
  }
}

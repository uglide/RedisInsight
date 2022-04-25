import { ReadStream } from 'fs';
import {
  Injectable, Logger, NotFoundException, OnModuleDestroy,
} from '@nestjs/common';
import { LogFile } from 'src/modules/profiler/models/log-file';
import ERROR_MESSAGES from 'src/constants/error-messages';
import { ProfilerAnalyticsService } from 'src/modules/profiler/profiler-analytics.service';

@Injectable()
export class LogFileProvider implements OnModuleDestroy {
  private logger = new Logger('LogFileProvider');

  private profilerLogFiles: Map<string, LogFile> = new Map();

  constructor(private analyticsService: ProfilerAnalyticsService) {}

  /**
   * Get or create Profiler Log File to work with
   * @param instanceId
   * @param id
   */
  getOrCreate(instanceId: string, id: string): LogFile {
    if (!this.profilerLogFiles.has(id)) {
      this.profilerLogFiles.set(id, new LogFile(instanceId, id, this.analyticsService.getEventsEmitters()));
    }

    return this.profilerLogFiles.get(id);
  }

  /**
   * Get Profiler Log File or throw an error
   * @param id
   */
  get(id: string): LogFile {
    if (!this.profilerLogFiles.has(id)) {
      throw new NotFoundException(ERROR_MESSAGES.PROFILER_LOG_FILE_NOT_FOUND);
    }

    return this.profilerLogFiles.get(id);
  }

  /**
   * Get ReadableStream for download and filename
   * Delete file after download finished
   * @param id
   */
  async getDownloadData(id): Promise<{ stream: ReadStream, filename: string }> {
    this.logger.debug('getDownloadData', id);
    const logFile = await this.get(id);
    this.logger.debug('getDownloadData:logFile', logFile as any);
    const stream = await logFile.getReadStream();
    const result = { stream, filename: logFile.getFilename() };

    this.logger.debug('getDownloadData:result', result as any);
    return result;
  }

  onModuleDestroy() {
    this.profilerLogFiles.forEach((logFile) => {
      try {
        logFile.destroy();
      } catch (e) {
        // process other files on error
      }
    });
  }
}

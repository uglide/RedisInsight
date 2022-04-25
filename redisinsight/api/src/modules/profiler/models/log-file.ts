import { join } from 'path';
import * as fs from 'fs-extra';
import { ReadStream, WriteStream } from 'fs';
import config from 'src/utils/config';
import { FileLogsEmitter } from 'src/modules/profiler/emitters/file.logs-emitter';
import { TelemetryEvents } from 'src/constants';
import { Logger } from '@nestjs/common';

const DIR_PATH = config.get('dir_path');
const PROFILER = config.get('profiler');

export class LogFile {
  private logger = new Logger('LogFile');

  private readonly filePath: string;

  private startTime: Date;

  private writeStream: WriteStream;

  private emitter: FileLogsEmitter;

  private readonly clientObservers: Map<string, string> = new Map();

  private idleSince: number = 0;

  private alias: string;

  private analyticsEvents: Map<TelemetryEvents, Function>;

  public readonly instanceId: string;

  public readonly id: string;

  constructor(instanceId: string, id: string, analyticsEvents?: Map<TelemetryEvents, Function>) {
    this.instanceId = instanceId;
    this.id = id;
    this.alias = id;
    this.filePath = join(DIR_PATH.tmpDir, this.id);
    this.startTime = new Date();
    this.analyticsEvents = analyticsEvents || new Map();
    this.logger.debug('LogFile:constructor', this as any);
  }

  /**
   * Get or create file write stream to write logs
   */
  getWriteStream(): WriteStream {
    if (!this.writeStream) {
      fs.ensureFileSync(this.filePath);
      this.writeStream = fs.createWriteStream(this.filePath, { flags: 'a' });
    }
    this.writeStream.on('error', () => {});

    this.logger.debug('LogFile:getWriteStream', this as any);

    return this.writeStream;
  }

  /**
   * Get readable stream of the logs file
   * Used to download file using http server
   */
  getReadStream(): ReadStream {
    fs.ensureFileSync(this.filePath);
    const stream = fs.createReadStream(this.filePath);
    stream.on('error', (e) => {
      this.logger.debug('getReadStream:onStreamError', e as any);
    });
    stream.once('end', () => {
      stream.destroy();
      try {
        this.analyticsEvents.get(TelemetryEvents.ProfilerLogDownloaded)(this.instanceId, this.getFileSize());
      } catch (e) {
        this.logger.debug('LogFile:getReadStream:once.end_ERROR', this as any);
        // ignore analytics errors
      }
      this.logger.debug('LogFile:getReadStream:once.end_SUCCESS', this as any);
      // logFile.destroy();
    });

    this.logger.debug('LogFile:getReadStream', this as any);

    return stream;
  }

  /**
   * Get or create logs emitter to use on each 'monitor' event
   */
  getEmitter(): FileLogsEmitter {
    if (!this.emitter) {
      this.emitter = new FileLogsEmitter(this);
    }

    this.logger.debug('LogFile:getEmitter', this as any);

    return this.emitter;
  }

  /**
   * Generate file name
   */
  getFilename(): string {
    this.logger.debug('LogFile:getFilename', this as any);

    return `${this.alias}-${this.startTime.getTime()}-${Date.now()}`;
  }

  getFileSize(): number {
    this.logger.debug('LogFile:getFileSize', this as any);

    const stats = fs.statSync(this.filePath);
    return stats.size;
  }

  setAlias(alias: string) {
    this.logger.debug('LogFile:setAlias', this as any);

    this.alias = alias;
  }

  addProfilerClient(id: string) {
    this.clientObservers.set(id, id);
    this.idleSince = 0;

    this.logger.debug('LogFile:addProfilerClient', this as any);
  }

  removeProfilerClient(id: string) {
    this.clientObservers.delete(id);

    if (!this.clientObservers.size) {
      this.idleSince = Date.now();

      setTimeout(() => {
        if (this?.idleSince && Date.now() - this.idleSince >= PROFILER.logFileIdleThreshold) {
          this.logger.debug('LogFile:removeProfilerClient_setTimeout', this as any);

          this.destroy();
        }
      }, PROFILER.logFileIdleThreshold);
    }

    this.logger.debug('LogFile:removeProfilerClient', this as any);
  }

  /**
   * Remove file and delete write stream after finish
   */
  destroy() {
    try {
      this.writeStream?.close();
      this.writeStream = null;
      const size = this.getFileSize();
      fs.unlink(this.filePath);

      this.analyticsEvents.get(TelemetryEvents.ProfilerLogDeleted)(this.instanceId, size);

      this.logger.debug('LogFile:destroy_SUCCESS', this as any);
    } catch (e) {
      this.logger.debug('LogFile:destroy_ERROR', this as any);
      // ignore error
    }
  }
}

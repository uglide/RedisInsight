import { Socket } from 'socket.io';
import { debounce } from 'lodash';
import { WsException } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ProfilerServerEvents } from 'src/modules/profiler/constants';
import { ILogsEmitter } from 'src/modules/profiler/interfaces/logs-emitter.interface';
import { IMonitorData } from 'src/modules/profiler/interfaces/monitor-data.interface';
import ERROR_MESSAGES from 'src/constants/error-messages';

export class ProfilerClient {
  private logger = new Logger('ProfilerClient');

  public readonly id: string;

  private readonly client: Socket;

  private logsEmitters: Map<string, ILogsEmitter> = new Map();

  private filters: any[];

  private readonly debounce: any;

  private items: any[];

  private emitted: number = 0;

  private time = 0;

  private heap = 0;

  private interval;

  constructor(id: string, client: Socket) {
    this.id = id;
    this.client = client;
    this.items = [];
    this.debounce = debounce(() => {
      if (!this.heap) {
        this.heap = process.memoryUsage().heapUsed;
      }
      if (this.items.length) {
        this.emitted += this.items.length;
        this.logsEmitters.forEach((emitter) => {
          emitter.emit(this.items);
        });
        this.items = [];
      }
    }, 10, {
      maxWait: 50,
    });
    this.interval = setInterval(this.throughput.bind(this), 1000);
  }

  throughput() {
    const time = Date.now() - this.time;
    console.log(
      '__________throughput',
      this.emitted,
      `${(this.emitted / time).toFixed(3)} Kops/s`,
      `heapUsed: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
    );
    this.time = Date.now();
    this.emitted = 0;
  }

  public handleOnData(payload: IMonitorData) {
    // console.log('___payload', payload)
    const {
      time, args, source, database,
    } = payload;

    this.items.push({
      time, args, source, database,
    });

    this.debounce();
  }

  public handleOnDisconnect() {
    clearInterval(this.interval);
    this.client.emit(
      ProfilerServerEvents.Exception,
      new WsException(ERROR_MESSAGES.NO_CONNECTION_TO_REDIS_DB),
    );
  }

  public addLogsEmitter(emitter: ILogsEmitter) {
    this.logsEmitters.set(emitter.id, emitter);
    emitter.addProfilerClient(this.id);
    this.logCurrentState();
  }

  async flushLogs() {
    this.logsEmitters.forEach((emitter) => emitter.flushLogs());
  }

  public destroy() {
    this.logsEmitters.forEach((emitter) => emitter.removeProfilerClient(this.id));
    clearInterval(this.interval);
  }

  /**
   * Logs useful information about current state for debug purposes
   * @private
   */
  private logCurrentState() {
    this.logger.debug(
      `Emitters: ${this.logsEmitters.size}`,
    );
  }
}

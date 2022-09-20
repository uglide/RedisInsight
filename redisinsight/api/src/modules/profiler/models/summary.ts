import { IMonitorData } from 'src/modules/profiler/interfaces/monitor-data.interface';
import { sortBy } from 'lodash';

const COMMANDS = {
  ttl: { pos: 1 },
  type: { pos: 1 },
  set: { pos: 1 },
  lpush: { pos: 1 },
  sadd: { pos: 1 },
  zadd: { pos: 1 },
  hset: { pos: 1 },
  'json.set': { pos: 1 },
};
const DELIMITER = ':';

export class Summary {
  private topKeys = new Map();

  private topNsp = new Map();

  private topCommands = new Map();

  private topClients = new Map();

  public handleOnData(log: IMonitorData) {
    // const {
    //   time, args, source, database,
    // } = payload;
    this.analyze([log]);
    //
    // this.items.push({
    //   time, args, source, database,
    // });
    //
    // this.debounce();
  }

  public analyze(logs: any[]) {
    logs.forEach((log) => {
      const {
        time, args, source, database,
      } = log;
      const command = args[0].toLowerCase();
      this.topClients.set(source, (this.topClients.get(source) || 0) + 1);
      this.topCommands.set(command, (this.topCommands.get(command) || 0) + 1);
      this.getKeys(command, args).forEach((key) => {
        this.addTopKey(key);
        this.addTopNsp(key);
      });
    });
  }

  private addTopNsp(key: string) {
    const pos = key.indexOf(DELIMITER);
    if (pos > -1) {
      const nsp = key.slice(0, pos);
      this.topNsp.set(nsp, (this.topNsp.get(nsp) || 0) + 1);
    }
  }

  private addTopKey(key: string) {
    this.topKeys.set(key, (this.topKeys.get(key) || 0) + 1);
    if (this.topKeys.size > 10_000) {
      this.recalculateTopKeys();
    }
  }

  private recalculateTopKeys() {
    const start = Date.now();
    console.time('rec');
    const top1000 = sortBy(
      [...this.topKeys.keys()].map((k) => ([k, this.topKeys.get(k)])),
      (arr) => arr[1],
    ).reverse().slice(0, 1000);

    this.topKeys = new Map();
    top1000.forEach((k) => {
      this.topKeys.set(k[0], k[1]);
    });

    console.log('========================== ========================== =========rec: ', `${Date.now() - start} ms`);
  }

  private getKeys(command: string, args: string[]): string[] {
    if (COMMANDS[command]) {
      return [args[COMMANDS[command].pos]];
    }

    return [];
  }

  public getSummary() {
    const summary = {
      topClients: [...this.topClients.keys()].map((k) => ([k, this.topClients.get(k)])),
      topCommands: [...this.topCommands.keys()].map((k) => ([k, this.topCommands.get(k)])),
      topKeys: this.topKeys.size,
      topNsp: this.topNsp.size,
      // topKeys: [...this.topKeys.keys()].map((k) => ([k, this.topKeys.get(k)])),
      // topNsp: [...this.topNsp.keys()].map((k) => ([k, this.topNsp.get(k)])),
    };

    console.log('____SUMMAMRY', summary);
    return summary;
  }
}

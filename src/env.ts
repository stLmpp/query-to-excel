import { homedir } from 'os';
import { resolve, join } from 'path';

export class Env {
  static configPath = resolve(process.env.EXCEL_CONFIG_PATH ?? join(`${homedir()}`, 'excel_config.json'));
}

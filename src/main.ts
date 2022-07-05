import { CronJob } from 'cron';
import { Workbook, Worksheet } from 'exceljs';
import { DataSource } from 'typeorm';

import { Config } from './config';
import { Logger } from './logger';
import { AnyObject } from './types';

class App {
  private constructor(
    private readonly config: Config,
    private readonly workbook: Workbook,
    private readonly dataSource: DataSource
  ) {
    this._worksheet = this._getOrCreateWorksheet();
  }

  private _worksheet: Worksheet;

  private _getOrCreateWorksheet(): Worksheet {
    let worksheet = this.workbook.worksheets.find(_worksheet => _worksheet.name === this.config.worksheet);
    if (!worksheet) {
      worksheet = this.workbook.addWorksheet(this.config.worksheet);
    }
    return worksheet;
  }

  private _initializeCron(): void {
    const cronJob = new CronJob(this.config.time, () => this._runQueryAndUpdateExcel().catch(Logger.error));
    cronJob.start();
  }

  private async _runQueryAndUpdateExcel(): Promise<void> {
    Logger.log('Querying database');
    const data: AnyObject[] = (await this.dataSource.query(this.config.query)) ?? [];
    if (!data.length) {
      Logger.warn('Query has returned no results.');
    }
    Logger.log('Updating worksheet');
    this.workbook.removeWorksheet(this.config.worksheet);
    this._worksheet = this.workbook.addWorksheet(this.config.worksheet);
    const firstRow = this._worksheet.getRow(1);
    for (const [colIndex, col] of this.config.columns.entries()) {
      firstRow.getCell(colIndex + 1).value = col;
    }
    firstRow.commit();
    for (const [index, item] of data.entries()) {
      const rowIndex = index + 2;
      const row = this._worksheet.getRow(rowIndex);
      for (const [colIndex, col] of this.config.columns.entries()) {
        row.getCell(colIndex + 1).value = item[col];
      }
      row.commit();
    }
    Logger.log('Saving worksheet');
    await this.workbook.xlsx.writeFile(this.config.excel);
  }

  async init(): Promise<this> {
    this._initializeCron();
    try {
      await this._runQueryAndUpdateExcel();
    } catch (error) {
      Logger.error(error);
    }
    return this;
  }

  static async init(): Promise<App> {
    Logger.log('Getting config file');
    const config = await Config.create();
    Logger.log('Getting excel file');
    const workbook = await new Workbook().xlsx.readFile(config.excel);
    Logger.log('Connecting to the database');
    const dataSource = await new DataSource({ ...config.database, logging: true }).initialize();
    return new App(config, workbook, dataSource).init();
  }
}

async function main(): Promise<void> {
  Logger.log('Initializing...');
  await App.init();
}

main()
  .then()
  .catch(error => {
    Logger.error(error);
    process.exit(1);
  });

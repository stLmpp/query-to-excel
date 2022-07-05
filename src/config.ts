import { readFile } from 'fs/promises';

import { plainToInstance, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  validate,
  ValidateNested,
} from 'class-validator';

import { Env } from './env';

export enum ConfigDatabaseType {
  mysql = 'mysql',
  mssql = 'mssql',
  mariadb = 'mariadb',
}

export class ConfigDatabase {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  host!: string;

  @IsDefined()
  @IsNumber()
  @IsPositive()
  port!: number;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  database!: string;

  @IsDefined()
  @IsEnum(ConfigDatabaseType)
  type!: ConfigDatabaseType;
}

export class Config {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  excel!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  worksheet!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  time!: string;

  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  columns!: string[];

  @IsDefined()
  @ValidateNested({ each: true })
  @Type(() => ConfigDatabase)
  database!: ConfigDatabase;

  static async create(): Promise<Config> {
    const file = await readFile(Env.configPath);
    const json: Config = JSON.parse(file.toString('utf8'));
    const instance = plainToInstance(Config, json);
    const errors = await validate(instance, { whitelist: true });
    if (errors.length) {
      throw new Error('Invalid config file');
    }
    return instance;
  }
}

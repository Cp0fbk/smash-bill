import { Type, plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnvironment)
  @IsOptional()
  NODE_ENV: NodeEnvironment = NodeEnvironment.Development;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT = 4000;

  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL is required and cannot be empty' })
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  CORS_ORIGIN = 'http://localhost:3000';

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  JWT_SECRET = 'dev-jwt-secret-change-in-production';

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CALLBACK_URL?: string;

  @IsString()
  @IsOptional()
  ZALO_APP_ID?: string;

  @IsString()
  @IsOptional()
  ZALO_APP_SECRET?: string;

  @IsString()
  @IsOptional()
  ZALO_CALLBACK_URL?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  VIETQR_IMAGE_BASE_URL = 'https://img.vietqr.io/image';

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  VIETQR_DEFAULT_TEMPLATE = 'compact2';
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formattedErrors = errors
      .map((err) => {
        const constraints = err.constraints ? Object.values(err.constraints).join(', ') : 'invalid';
        return `${err.property}: ${constraints}`;
      })
      .join('; ');
    throw new Error(`Invalid environment configuration: ${formattedErrors}`);
  }

  return validatedConfig;
}

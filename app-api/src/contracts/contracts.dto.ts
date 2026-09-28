import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class SolicitudPlanDto {
  @ApiProperty({ example: 'premium', enum: ['basico', 'premium', 'elite'] })
  @IsIn(['basico', 'premium', 'elite'])
  tipoSolicitado: 'basico' | 'premium' | 'elite';

  @ApiPropertyOptional({ example: 'Queremos reportes avanzados.' })
  @IsOptional() @IsString() mensaje?: string;
}

export class SolicitudBajaDto {
  @ApiProperty({ example: 'Cierre temporal del gimnasio' })
  @IsString() @MinLength(5, { message: 'Explica brevemente el motivo' })
  motivo: string;

  @ApiPropertyOptional() @IsOptional() @IsString() comentario?: string;
}

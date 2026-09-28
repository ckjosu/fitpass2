import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ConfiguracionDto {
  @ApiPropertyOptional({ enum: ['claro', 'oscuro'] })
  @IsOptional() @IsIn(['claro', 'oscuro']) tema?: 'claro' | 'oscuro';

  @ApiPropertyOptional({ enum: ['naranja', 'azul', 'verde', 'morado'] })
  @IsOptional() @IsIn(['naranja', 'azul', 'verde', 'morado'])
  colorAcento?: 'naranja' | 'azul' | 'verde' | 'morado';

  @ApiPropertyOptional({ enum: ['en_linea', 'tolerancia_sin_conexion'] })
  @IsOptional() @IsIn(['en_linea', 'tolerancia_sin_conexion'])
  modoValidacion?: 'en_linea' | 'tolerancia_sin_conexion';

  @ApiPropertyOptional({ example: 300, description: 'Cuánto vive el código QR, en segundos' })
  @IsOptional() @IsInt() @Min(60) @Max(1800) toleranciaSegundos?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() avisarPorCorreo?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() avisarAccesosDenegados?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() avisarIncidencias?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FiltroHistorialDto {
  @ApiPropertyOptional({ example: '2026-09-01' }) @IsOptional() @IsString() desde?: string;
  @ApiPropertyOptional({ example: '2026-09-14' }) @IsOptional() @IsString() hasta?: string;
  @ApiPropertyOptional({ enum: ['permitido', 'denegado'] })
  @IsOptional() @IsIn(['permitido', 'denegado', 'reingreso']) resultado?: 'permitido' | 'denegado' | 'reingreso';
  @ApiPropertyOptional({ description: 'Busca por nombre de cliente o codigo leido' })
  @IsOptional() @IsString() buscar?: string;
  @ApiPropertyOptional({ example: 1 }) @IsOptional() pagina?: number;
  @ApiPropertyOptional({ example: 15 }) @IsOptional() porPagina?: number;
}

export class CapacidadDto {
  @ApiProperty({ example: 120, description: 'Cuantas personas caben al mismo tiempo' })
  @IsInt({ message: 'Escribe un numero entero' })
  @Min(1, { message: 'El aforo debe ser mayor a 0' })
  @Max(5000)
  capacidadMaxima: number;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class FiltroHistorialDto {
  @ApiPropertyOptional({ example: '2026-09-01' }) @IsOptional() @IsString() desde?: string;
  @ApiPropertyOptional({ example: '2026-09-14' }) @IsOptional() @IsString() hasta?: string;
  @ApiPropertyOptional({ enum: ['permitido', 'denegado'] })
  @IsOptional() @IsIn(['permitido', 'denegado']) resultado?: 'permitido' | 'denegado';
  @ApiPropertyOptional({ description: 'Busca por nombre de cliente o codigo leido' })
  @IsOptional() @IsString() buscar?: string;
  @ApiPropertyOptional({ example: 1 }) @IsOptional() pagina?: number;
  @ApiPropertyOptional({ example: 15 }) @IsOptional() porPagina?: number;
}

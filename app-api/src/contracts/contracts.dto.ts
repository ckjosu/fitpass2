import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class SolicitudBajaDto {
  @ApiProperty({ example: 'Cierre temporal del gimnasio' })
  @IsString() @MinLength(5, { message: 'Explica brevemente el motivo' })
  motivo: string;

  @ApiPropertyOptional() @IsOptional() @IsString() comentario?: string;
}

export class PrecioVisitaDto {
  @ApiProperty({ example: 30, description: 'Lo que cobra el gimnasio por cada dia que entra un socio Gymred' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Escribe un precio valido' })
  @Min(1, { message: 'El precio debe ser mayor a 0' })
  @Max(10000)
  precio: number;
}

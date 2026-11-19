import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class FiltroResenasDto {
  @ApiPropertyOptional({ enum: ['todas', 'sin_responder', 'respondidas'] })
  @IsOptional() @IsIn(['todas', 'sin_responder', 'respondidas'])
  filtro?: 'todas' | 'sin_responder' | 'respondidas';

  @ApiPropertyOptional({ example: 5, description: 'Solo las de esa calificacion' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5)
  estrellas?: number;
}

export class RespuestaResenaDto {
  @ApiProperty({ example: 'Gracias por venir, te esperamos pronto.' })
  @IsString()
  @MinLength(2, { message: 'Escribe tu respuesta' })
  @MaxLength(500, { message: 'La respuesta puede tener hasta 500 caracteres' })
  respuesta: string;
}

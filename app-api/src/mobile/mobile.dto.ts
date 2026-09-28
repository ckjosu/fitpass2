import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ContratarPlanDto {
  @ApiProperty({ example: 2, description: 'Id del plan de la plataforma' })
  @IsInt() idPlan: number;

  @ApiPropertyOptional({ example: 'tarjeta' })
  @IsOptional() @IsString() metodo?: string;
}

export class EntrarDto {
  @ApiProperty({
    example: 'FP.FP-LEC-0001.9A3C7E1B5D02',
    description: 'El codigo que muestra la pantalla de la entrada',
  })
  @IsString() codigo: string;
}

export class ResenaDto {
  @ApiProperty({ example: 5 }) @IsInt() @Min(1) @Max(5) calificacion: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comentario?: string;
}

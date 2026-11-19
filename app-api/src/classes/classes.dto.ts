import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Matches, Max,
  MaxLength, Min, MinLength, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HorarioClaseDto {
  @ApiProperty({ example: 1, description: '1 = lunes ... 7 = domingo' })
  @IsInt() @Min(1) @Max(7)
  diaSemana: number;

  @ApiProperty({ example: '07:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, { message: 'Escribe la hora como 07:00' })
  horaInicio: string;
}

export class ClaseDto {
  @ApiPropertyOptional({ example: 46, description: 'Tipo de clase del catalogo (categoria clases)' })
  @IsOptional() @IsInt()
  idCatalogo?: number;

  @ApiPropertyOptional({ example: 'Spinning avanzado', description: 'Solo si no esta en el catalogo' })
  @IsOptional() @IsString() @MinLength(3) @MaxLength(80)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Karla Uc' })
  @IsOptional() @IsString() @MaxLength(100)
  instructor?: string;

  @ApiPropertyOptional({ example: 'Trae toalla y agua.' })
  @IsOptional() @IsString() @MaxLength(300)
  descripcion?: string;

  @ApiProperty({ example: 45 })
  @IsInt() @Min(15, { message: 'La clase dura al menos 15 minutos' }) @Max(240)
  duracionMin: number;

  @ApiProperty({ example: 15, description: 'Lugares por sesion' })
  @IsInt() @Min(1, { message: 'El cupo debe ser de al menos 1' }) @Max(300)
  cupo: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean()
  activa?: boolean;

  @ApiProperty({ type: [HorarioClaseDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Agrega al menos un horario' })
  @ArrayMaxSize(42)
  @ValidateNested({ each: true })
  @Type(() => HorarioClaseDto)
  horarios: HorarioClaseDto[];
}

export class ReservarDto {
  @ApiProperty({ example: 12, description: 'Id del horario (sale de la lista de sesiones)' })
  @IsInt()
  idHorario: number;

  @ApiProperty({ example: '2026-11-23' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha va como AAAA-MM-DD' })
  fecha: string;
}

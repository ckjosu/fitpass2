import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

const CATEGORIAS = ['peso_libre', 'maquinas', 'cardio', 'funcional', 'clases', 'otro'];

export class CrearEquipoDto {
  @ApiProperty({ example: 'Prensa de piernas' })
  @IsString() @MinLength(2, { message: 'Escribe el nombre del equipo' }) @MaxLength(120)
  nombre: string;

  @ApiProperty({ example: 'maquinas', enum: CATEGORIAS })
  @IsIn(CATEGORIAS) categoria: any;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) descripcion?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional() @IsInt() @Min(1) @Max(999) cantidad?: number;

  @ApiPropertyOptional({ enum: ['disponible', 'fuera_de_servicio'] })
  @IsOptional() @IsIn(['disponible', 'fuera_de_servicio'])
  situacion?: 'disponible' | 'fuera_de_servicio';
}

export class ActualizarEquipoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) nombre?: string;
  @ApiPropertyOptional({ enum: CATEGORIAS }) @IsOptional() @IsIn(CATEGORIAS) categoria?: any;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) descripcion?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(999) cantidad?: number;
  @ApiPropertyOptional({ enum: ['disponible', 'fuera_de_servicio'] })
  @IsOptional() @IsIn(['disponible', 'fuera_de_servicio'])
  situacion?: 'disponible' | 'fuera_de_servicio';
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

const CATEGORIAS = ['peso_libre', 'maquinas', 'cardio', 'funcional', 'clases', 'otro'];

export class CrearEquipoDto {
  @ApiPropertyOptional({
    example: 11,
    description:
      'Id del equipo en el catalogo. Es la forma recomendada: el nombre y la ' +
      'categoria se toman del catalogo y asi no se captura el mismo aparato ' +
      'escrito de varias formas.',
  })
  @IsOptional() @IsInt() idCatalogo?: number;

  @ApiPropertyOptional({
    example: 'Maquina de remo adaptada',
    description: 'Solo si el equipo no esta en el catalogo.',
  })
  @IsOptional() @IsString() @MinLength(2, { message: 'Escribe el nombre del equipo' }) @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({ example: 'maquinas', enum: CATEGORIAS })
  @IsOptional() @IsIn(CATEGORIAS) categoria?: any;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) descripcion?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional() @IsInt() @Min(1) @Max(999) cantidad?: number;

  @ApiPropertyOptional({ enum: ['disponible', 'fuera_de_servicio'] })
  @IsOptional() @IsIn(['disponible', 'fuera_de_servicio'])
  situacion?: 'disponible' | 'fuera_de_servicio';
}

export class ActualizarEquipoDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() idCatalogo?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) nombre?: string;
  @ApiPropertyOptional({ enum: CATEGORIAS }) @IsOptional() @IsIn(CATEGORIAS) categoria?: any;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) descripcion?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(999) cantidad?: number;
  @ApiPropertyOptional({ enum: ['disponible', 'fuera_de_servicio'] })
  @IsOptional() @IsIn(['disponible', 'fuera_de_servicio'])
  situacion?: 'disponible' | 'fuera_de_servicio';
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CrearIncidenciaDto {
  @ApiProperty({ example: 'Cinta de correr #2' })
  @IsString() @MinLength(2, { message: 'Escribe qué equipo es' }) @MaxLength(120)
  equipo: string;

  @ApiProperty({ example: 'La banda se traba al subir la velocidad' })
  @IsString() @MinLength(5, { message: 'Describe brevemente la falla' }) @MaxLength(160)
  titulo: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(600) descripcion?: string;

  @ApiPropertyOptional({ enum: ['baja', 'media', 'alta'] })
  @IsOptional() @IsIn(['baja', 'media', 'alta']) prioridad?: 'baja' | 'media' | 'alta';
}

export class ActualizarIncidenciaDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) equipo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) titulo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(600) descripcion?: string;
  @ApiPropertyOptional({ enum: ['baja', 'media', 'alta'] })
  @IsOptional() @IsIn(['baja', 'media', 'alta']) prioridad?: 'baja' | 'media' | 'alta';
  @ApiPropertyOptional({ enum: ['pendiente', 'en_progreso', 'resuelto'] })
  @IsOptional() @IsIn(['pendiente', 'en_progreso', 'resuelto'])
  situacion?: 'pendiente' | 'en_progreso' | 'resuelto';
}

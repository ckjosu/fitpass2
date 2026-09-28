import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString,
  Max, Min, ValidateNested,
} from 'class-validator';

export class DatosGimnasioDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nombre?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() calle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() colonia?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ciudad?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() estado?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() codigoPostal?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefono?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitud?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitud?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() capacidadMaxima?: number;
  @ApiPropertyOptional({ example: 'gimnasio' })
  @IsOptional() @IsIn(['gimnasio','crossfit','yoga','box','funcional']) categoria?: string;
}

export class HorarioDto {
  @ApiProperty({ example: 1, description: '1 = lunes ... 7 = domingo' })
  @IsInt() @Min(1) @Max(7) diaSemana: number;
  @ApiPropertyOptional({ example: '06:00:00' }) @IsOptional() @IsString() horaApertura?: string;
  @ApiPropertyOptional({ example: '22:00:00' }) @IsOptional() @IsString() horaCierre?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() cerrado?: boolean;
}

export class HorariosDto {
  @ApiProperty({ type: [HorarioDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => HorarioDto)
  horarios: HorarioDto[];
}

export class FotoDto {
  @ApiProperty({ example: '/uploads/mi-foto.jpg' }) @IsString() url: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() portada?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() orden?: number;
}

export class ServicioDto {
  @ApiProperty({ example: 'Spinning' }) @IsString() nombre: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() activo?: boolean;
}

export class AmenidadDto {
  @ApiProperty({ example: 'Regaderas' }) @IsString() nombre: string;
  @ApiPropertyOptional({ example: 'shower' }) @IsOptional() @IsString() icono?: string;
}

export class PrecioDto {
  @ApiProperty({ example: 'mes', enum: ['visita','semana','quincena','mes','anual'] })
  @IsIn(['visita','semana','quincena','mes','anual']) concepto: any;
  @ApiProperty({ example: 599 }) @IsNumber() monto: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() activo?: boolean;
}

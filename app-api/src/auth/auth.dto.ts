import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ricardo@ironhouse.mx' })
  @IsEmail({}, { message: 'Escribe un correo valido' })
  email: string;

  @ApiProperty({ example: 'Gymred123' })
  @IsString()
  @MinLength(6, { message: 'La contrasena debe tener al menos 6 caracteres' })
  password: string;
}

export class RegistroDuenoDto {
  @ApiProperty({ example: 'Ana Lopez' }) @IsString() nombre: string;
  @ApiProperty({ example: 'ana@migym.mx' }) @IsEmail() email: string;
  @ApiProperty({ example: 'Gymred123' }) @IsString() @MinLength(6) password: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() telefono?: string;

  @ApiProperty({ example: 'Gimnasio Fuerza' }) @IsString() nombreGimnasio: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() calle?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() colonia?: string;
  @ApiProperty({ required: false, example: 'Merida' }) @IsOptional() @IsString() ciudad?: string;
  @ApiProperty({ required: false, example: 'gimnasio' })
  @IsOptional() @IsIn(['gimnasio','crossfit','yoga','box','funcional']) categoria?: string;
}

export class RegistroClienteDto {
  @ApiProperty() @IsString() nombre: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(6) password: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() telefono?: string;
}

export class CambiarPasswordDto {
  @ApiProperty() @IsString() actual: string;
  @ApiProperty() @IsString() @MinLength(6) nueva: string;
}

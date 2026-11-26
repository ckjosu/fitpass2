# Modelo de negocio

Solo paga el socio. Los gimnasios se afilian **gratis**.

| Plan | Precio | Días | Entra a | Fondo para gimnasios (70%) |
|---|---|---|---|---|
| Esencial | $400 al mes | 15 al mes | Gimnasios Esencial | $280 |
| Plus | $800 al mes | 30 al mes | Gimnasios Esencial y Completo | $560 |

Se cuenta por **día**: un gimnasio por día, y el socio puede salir y volver a entrar ese mismo
día sin gastar otro. Esas reentradas no se le pagan al gimnasio.

De cada membresía, **70%** es el fondo del socio para pagar sus visitas y **30%** es para Gymred.

## Cómo se le paga a cada gimnasio

1. **Precio con tope.** Cada visita vale el precio que pone el dueño, máximo $30 si el
   gimnasio es Esencial o $45 si es Completo (peso libre, máquinas y cardio).
2. **El fondo es el límite.** Si las visitas de un socio pasan su fondo, cada visita se
   multiplica por `factor = fondo / total`.
3. **Lo que sobra es de Gymred.** Se cierra el último día del mes y se paga el día 5.

## Ejemplo

| | Ana | Luis |
|---|---|---|
| Plan y fondo | Esencial → $280 | Plus → $560 |
| Visitas | 12 a un gimnasio de $30 | 20 a un gimnasio Completo de $35 |
| Total | $360 | $700 |
| Factor | 280 / 360 = 0.778 | 560 / 700 = 0.8 |
| Recibe el gimnasio | $280 ($23.33 por visita) | $560 ($28 por visita) |
| Gana Gymred | $120 | $240 |

El cálculo está en `app-api/src/common/tarifas.ts`.

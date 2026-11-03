# Gym PWA — Especificación visual (Home) · v1

Fuente: contrato JSON del usuario (Fitness app home screen). Modo claro único, una sola marca (`#F2704F`).
Base de diseño: 393×852 (iPhone 15 Pro, el del contrato). **iPhone 18 Pro: dimensiones no verificadas [revisar]** → el layout es fluido (ancho = 100 %, padding lateral 20 px) y usa `env(safe-area-inset-*)`, así que no depende del tamaño exacto. Barra de estado/Dynamic Island las pone iOS; no se dibujan.

## 1. Paleta (tokens)
| Token Tailwind | Hex | Uso |
|---|---|---|
| `canvas` | #F2F2EF | fondo app |
| `card` | #FFFFFF | tarjetas, botones redondos, nav |
| `ink` | #111111 | texto |
| `muted` | #8A8A90 | secundario, iconos inactivos |
| `brand` | #F2704F | avatar, activo nav, "Siguiente", acciones primarias, anillo 1 |
| `calories` | #F5A524 | anillo 2 (series) |
| `active` | #4C8DFF | anillo 3 (volumen) |
| `heart` | #FF4D6D | solo dato de pulso/minutos |

Reglas: sin modo oscuro; ámbar/azul/rosa solo en datos de anillo/estadística, nunca como acción. Contraste: texto blanco sobre `brand` ≈ 3,0:1 → solo ≥14 px semibold (aceptable para etiquetas grandes/bold; no usar para texto pequeño regular).

## 2. Tipografía
Inter (variable). Headings 600, body 400. Escala: saludo 26/32 · título sección 20/26 · título fila 16/22 600 · estadística 20/24 600 `tabular-nums` · meta 12–14 `muted`.

## 3. Tailwind (extend)
```js
colors: { canvas:'#F2F2EF', card:'#FFFFFF', ink:'#111111', muted:'#8A8A90', brand:'#F2704F', calories:'#F5A524', active:'#4C8DFF', heart:'#FF4D6D' },
fontFamily: { sans: ['"Inter Variable"','Inter','system-ui','sans-serif'] },
borderRadius: { card:'24px', pill:'999px' },
boxShadow: { card:'0 1px 2px rgba(17,17,17,.04), 0 8px 24px rgba(17,17,17,.05)', nav:'0 8px 32px rgba(17,17,17,.14)' }
```
CSS clave:
```css
.card{background:#fff;border-radius:24px;box-shadow:var(--shadow-card)}
.pb-nav{padding-bottom:calc(112px + env(safe-area-inset-bottom))} /* nada tras la nav */
.pt-safe{padding-top:max(env(safe-area-inset-top),12px)}
```

## 4. Estructura y medidas (de arriba a abajo)
| Bloque | Spec |
|---|---|
| Contenedor | `px-5` (20), `pt-safe`, `pb-nav` |
| Header | flex between. Avatar 44×44 `rounded-full bg-brand`, inicial blanca 18/600. Derecha: 2 botones 44×44 `rounded-full bg-card shadow-card`, gap 12 (buscar, campana) |
| Saludo | `mt-6`, 26/32 semibold. Subtítulo 14 `muted` `mt-1` |
| Tarjeta actividad | `card mt-5 p-5`, flex gap 20. Izq.: 3 anillos concéntricos ~104 px, trazo 10 px, pista 12 % opacidad, extremos redondeados: exterior brand, medio calories, interior active. Der.: grid 2×2 (gap-x 12, gap-y 16), punto 8 px de color + etiqueta 12 muted + valor 20/600 |
| Cabecera sección | `mt-7`, "Rutina" 20/600 + "Ver todo" 14/600 brand a la derecha |
| Fila de rutina | `card p-3 gap-4`, separación entre filas 12. Miniatura 64×64 `rounded-2xl` (foto), texto: meta 12 muted / título 16 semibold truncado / detalle 13 muted. Estado: hecho = círculo 32 brand con check blanco; siguiente = pill brand `px-3 py-1` 12/600 blanco; resto = sin marca |
| Nav flotante | fixed bottom, `px-5`, `pb: max(safe-area,16px)`. Píldora blanca `max-w-[400px] p-2 rounded-full shadow-nav`. Ítem 48 alto: activo = pill brand `px-4` + icono relleno blanco + etiqueta 14/600 blanca; inactivos 48×48 icono outline `muted`. 4 destinos: Inicio, Rutinas, Progreso, Perfil |

## 5. Estados y táctil
- Todo objetivo ≥ 44 px; feedback `active:scale-95` 100 ms.
- Foco visible (teclado/ratón): anillo 2 px brand.
- Estados de fila: pendiente / siguiente / hecha hoy / en curso (tarjeta con borde 2 px brand + botón "Continuar").
- Estado vacío (sin sesiones): anillos a 0 con pista visible, texto "Empieza tu primer entreno".
- `prefers-reduced-motion`: sin animación de anillos.

## 6. Adaptación al uso real (gimnasio)
El contrato es de una app de bienestar (pasos, bpm). Con el Excel (5 días: Espalda-Trapecio-Tríceps / Pecho-Hombro-Tríceps / Pierna / Espalda-Hombro-Bíceps / Pecho-Hombro-Tríceps, semanas 1–17 con descargas) no hay pulso ni pasos, así que: anillos = días/semana (brand), series (calories), volumen (active); estadísticas = Días, Series, Volumen, Minutos. Mantiene composición y colores del contrato; los datos son los del usuario.

## 7. Pantalla de entrenamiento (no está en el contrato; propuesta coherente)
- Cabecera con día + semana; ejercicio como tarjeta; **serie = fila de 56 px** con peso (stepper ±2,5 kg), reps (±1) y botón check 48×48 brand.
- Al marcar serie: cronómetro de descanso (valor "Desc." del Excel: 45 s / 3 min…) en hoja inferior: número 56/600 tabular, anillo brand, botones −15 s / +15 s / Saltar. Vibración + sonido al terminar.
- Sobrecarga progresiva: chip bajo el ejercicio "Hoy: 70 kg × 8" con objetivo sugerido (regla en `progression.js`); en descarga, chip neutro "Descarga".
- Bottom sheet y botón principal por encima de la nav (la nav se oculta en esta pantalla).

## 8. Reglas del contrato pendientes
- **"Fotografía realista"**: el Excel no trae imágenes y no tengo fotos reales de los ejercicios. Hoy las miniaturas son un componente genérico (`Thumb.jsx`). Para cumplirlo hacen falta fotos propias o con licencia; no presento imágenes de IA como foto real. Decisión pendiente del usuario.
- iPhone 18 Pro: confirmar tamaño en dispositivo real [revisar].

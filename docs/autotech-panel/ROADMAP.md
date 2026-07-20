# AutoTech Panel — Roadmap (rama privada)

Producto 3 del ecosistema AutoTech. Desarrollo en silencio en `feature/autotech-panel`.

## Visión

Capa de personalización digital para la experiencia en el vehículo: temas, widgets y estilo propio. No depende de un modelo específico (ej. Kia Picanto).

## Qué NO es la v1

- Hackear firmware de radio de fábrica
- Soporte universal de todos los autos desde el día uno
- Hardware propio (fase posterior, solo si hay demanda)

## Fases

### Fase 0 — Investigación (actual)

- [ ] Documentar decisiones técnicas en este archivo
- [ ] Probar dongle CarPlay inalámbrico y límites de personalización iOS/Android
- [ ] Definir si la app móvil vive en repo separado (`autotech-panel-app`)

### Fase 1 — Web (Astro, esta rama)

- [ ] Landing waitlist (`src/pages/panel.astro`) — solo cuando AutoTech Digital tenga más alcance
- [ ] Marketplace web de temas (catálogo + previews)
- [ ] Cuentas y suscripción (Stripe + auth)

### Fase 2 — App móvil

- [ ] React Native o Swift/Kotlin para CarPlay / Android Auto
- [ ] 3–5 temas premium + versión gratuita
- [ ] Lanzamiento a lista de espera

### Fase 3 — Escala

- [ ] Marketplace con creadores (comisión 30%)
- [ ] Integración con AutoMatch (tema sugerido según vehículo)
- [ ] OTA de temas

## Modelo de negocio

| Canal | Precio orientativo |
|-------|-------------------|
| Suscripción Pro | $4.99–9.99 USD/mes |
| Tema individual | $3–15 USD |
| B2B concesionario | Paquete en entrega del vehículo |

## Stack previsto

| Capa | Tecnología |
|------|------------|
| Marketing / waitlist | Astro (este repo) |
| App en el auto | React Native o nativo |
| API | Node/TypeScript + PostgreSQL |
| Assets temas | R2 / S3 + CDN |

## Sinergia ecosistema

```
AutoTech Digital  →  audiencia
AutoMatch         →  datos del vehículo y preferencias
AutoTech Panel    →  retención y suscripción
```

## Ramas y scripts

```powershell
.\scripts\switch-to-autotech-panel.ps1   # entrar a Panel
.\scripts\switch-from-autotech-panel.ps1 # volver a main
.\scripts\stash-autotech-panel.ps1      # guardar WIP Panel
.\scripts\restore-autotech-panel.ps1    # recuperar WIP Panel
```

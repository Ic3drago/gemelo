# Gemelo Digital de Consumo del Hogar 🌱

![ODS 12](https://upload.wikimedia.org/wikipedia/commons/b/b2/Sustainable_Development_Goal_12.svg)

Un sistema de microservicios para monitorizar y simular el impacto ambiental del consumo doméstico, alineado con el **Objetivo de Desarrollo Sostenible (ODS) 12: Producción y Consumo Responsables**.

## 🏗️ Arquitectura

```text
[Cliente Web/App] --HTTP--> [API Gateway (Puerto 3000)]
                                  |
                                  +--> [Servicio Compras (Puerto 3001)] ---> (PostgreSQL) ---> RabbitMQ
                                  |
                                  +--> [Servicio Energía (Puerto 3002)] ---> (PostgreSQL) ---> RabbitMQ
                                  |
                                  +--> [Servicio Alimentos (Puerto 3003)] -> (PostgreSQL) ---> RabbitMQ
                                  |
                                  +--> [Servicio Gamificación (Puerto 3004)] -> (PostgreSQL) <- RabbitMQ
                                  |
                                  +--> [Servicio Simulación (Puerto 8000)] (Python/FastAPI)
```

## 📋 Prerrequisitos

- Docker y Docker Compose
- Node.js 18+ (solo para ejecutar scripts locales)

## 🚀 Inicio Rápido

1. **Levantar todos los servicios:**
   ```bash
   docker compose up --build -d
   ```
2. **Cargar datos de prueba (seed):**
   ```bash
   node scripts/seed.js
   ```
   *Espera a que el API Gateway esté listo antes de insertar los datos.*
3. **Ver la aplicación:**
   Abre http://localhost:4000 (o el puerto configurado del frontend).

## 📊 Event Contracts (RabbitMQ)

| Evento | Publicador | Consumidor | Payload Ejemplo |
|--------|------------|------------|-----------------|
| `purchase.registered` | Compras | Gamificación | `{ "householdId": "hogar_1", "amountBs": 100 }` |
| `energy.reading` | Energía | Gamificación | `{ "householdId": "hogar_1", "kWh": 12.5 }` |
| `food.status_changed` | Alimentos | Gamificación | `{ "householdId": "hogar_1", "status": "wasted" }` |

## 🔌 API Endpoints

### API Gateway (Puerto 3000)
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/purchases` | POST/GET | Gestionar compras y huella CO2. |
| `/api/energy/readings` | POST/GET | Gestionar consumo eléctrico. |
| `/api/food` | POST/GET | Gestionar inventario de comida. |
| `/api/gamification/leaderboard`| GET | Ver clasificación. |
| `/api/simulation/simulate` | POST | Ejecutar simulación predictiva. |

## 🎮 Reglas de Gamificación

Definidas en `services/gamification/src/domain/points-policy.ts`:

| Evento | Puntos |
|--------|--------|
| Compra registrada | +5 |
| Lectura energética eficiente (< 5 kWh) | +15 |
| Lectura energética normal | +3 |
| Alimento consumido | +10 |
| Alimento desperdiciado | -5 |

Niveles definidos en `services/gamification/src/domain/leveling-policy.ts`:

| Nivel | Nombre | Puntos mínimos |
|-------|--------|----------------|
| 1 | Principiante | 0 |
| 2 | Consciente | 101 |
| 3 | Eco-Guerrero | 501 |
| 4 | Campeón Sostenible | 1501 |

## 🔮 Metodología de Simulación

El servicio de simulación (Python/FastAPI) recopila 6 meses de datos históricos.
Utiliza **Regresión Lineal** (vía `scikit-learn`) para proyectar tendencias futuras de consumo (horizonte configurable en meses).
Aplica porcentajes de reducción de escenario para calcular:
- Ahorros económicos (Bs)
- Reducción de Huella de Carbono (Kg CO2)
- Métricas de desperdicio y consumo

Los factores de conversión están centralizados en `services/simulation/app/domain/carbon_factors.py`.

## ♻️ Factores de Carbono (única fuente de verdad)

Todos los cálculos de CO₂ del sistema usan las mismas constantes de dominio:

| Factor | Valor | Ubicación |
|--------|-------|-----------|
| kg CO₂ / kWh eléctrico | 0.5 | `CarbonFactor.KG_CO2_PER_KWH` (energy) · `CarbonFactors.KG_CO2_PER_KWH` (simulation) |
| kg CO₂ / kg alimento desperdiciado | 2.5 | `CO2_KG_PER_KG_WASTED` (food) · `CarbonFactors.KG_CO2_PER_KG_WASTE` (simulation) |
| kg CO₂ / Bs de compra | 0.01 | `PurchaseCategory.CO2_FACTOR_PER_BS` (purchases) · `CarbonFactors.KG_CO2_PER_BS_PURCHASE` (simulation) |
| Bs ahorrados / kWh reducido | 0.89 | `CarbonFactor.BS_PER_KWH` (energy) · `CarbonFactors.BS_SAVINGS_PER_KWH` (simulation) |

## 🏛️ Modelo de Dominio (DDD)

Cada servicio aplica los principios de Domain-Driven Design. A continuación, los objetos de dominio clave:

### Value Objects

| Archivo | Qué encapsula |
|---------|---------------|
| `services/energy/src/carbon-factor.vo.ts` | Factor kWh→CO₂ y tarifa Bs/kWh; inmutable |
| `services/purchases/src/purchase-category.vo.ts` | Categorías válidas de compra y su factor CO₂ por Bs |
| `services/food/src/food-status.vo.ts` | Estados del alimento y transiciones permitidas (`stored → consumed/wasted`) |

### Comportamiento en Entidades (Aggregates)

| Entidad | Comportamiento agregado |
|---------|------------------------|
| `EnergyReading` | `applyCarbon()` — calcula CO₂ y costo usando `CarbonFactor` |
| `Purchase` | `applyCarbon()` — calcula CO₂ según categoría; `getCategory()` |
| `Food` | `transitionTo(status)` — valida la transición y aplica CO₂ si es desperdicio |
| `Account` | `applyIncome()`, `applyExpense()`, `applyTransaction()` — guarda la invariante de balance |

### Domain Services / Policies

| Archivo | Responsabilidad |
|---------|----------------|
| `services/gamification/src/domain/leveling-policy.ts` | Calcula nivel a partir de puntos acumulados |
| `services/gamification/src/domain/points-policy.ts` | Define cuántos puntos otorga cada evento de dominio |
| `services/simulation/app/domain/carbon_factors.py` | Factores de conversión CO₂ y métodos de cálculo de impacto |

### Separación de capas (por servicio)

```
Controller / Route handler   →  solo HTTP: deserializar request, llamar service, serializar response
Service (Application layer)  →  orquestar: llamar entidades/VOs, persistir, publicar eventos
Entity / Aggregate           →  reglas de negocio: invariantes, cálculos, transiciones de estado
Value Object / Policy        →  lógica de dominio reutilizable sin identidad propia
Infrastructure (RabbitMQ)    →  adaptar eventos externos → llamadas de dominio
```

## 🎓 Guía de Demostración

1. **Paso 1:** Ver el panel (dashboard) con el historial de los últimos 6 meses (cargado por el seed).
2. **Paso 2:** Registrar una nueva compra o cambiar el estado de un alimento, y observar cómo se actualizan los puntos en tiempo real (Gamificación).
3. **Paso 3:** Utilizar los controles de simulación (sliders) para ajustar hábitos de consumo y ver el impacto proyectado a futuro.

## ⚡ Generador de Eventos en Vivo

Para simular actividad constante en el sistema, ejecuta:
```bash
node scripts/live-generator.js
```
Esto creará eventos aleatorios cada 3-5 segundos (compras, uso de energía, desperdicio de comida) para ver la arquitectura orientada a eventos en acción.

## 💻 Tech Stack y Simplificaciones

- **Backend:** NestJS, TypeORM, PostgreSQL
- **Mensajería:** RabbitMQ (amqplib)
- **Simulación:** Python, FastAPI, Scikit-Learn
- **Scripts:** Node.js (Fetch nativo)

*Simplificaciones:* Se omiten configuraciones complejas de seguridad/autenticación para mantener el enfoque en la arquitectura ODS 12.

## 🚪 Referencia de Puertos

| Servicio | Puerto |
|----------|--------|
| API Gateway | 3000 |
| Compras | 3001 |
| Energía | 3002 |
| Alimentos | 3003 |
| Gamificación| 3004 |
| Simulación | 8000 |
| Frontend | 4000 |
| RabbitMQ | 5672, 15672 |
| PostgreSQL | 5432 |

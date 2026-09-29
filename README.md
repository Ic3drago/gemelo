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

- **+10 pts** por cada compra registrada.
- **-5 pts** por cada kg de comida desperdiciada (`wasted`).
- **+15 pts** por comida consumida (`consumed`).
- **+5 pts** por mantener consumo energético bajo (condicionado a lógica de backend).

## 🔮 Metodología de Simulación

El servicio de simulación (Python/FastAPI) recopila 6 meses de datos históricos. 
Utiliza **Regresión Lineal** (vía `scikit-learn`) para proyectar tendencias futuras de consumo (horizonte configurable en meses). 
Aplica porcentajes de reducción de escenario para calcular:
- Ahorros económicos (Bs)
- Reducción de Huella de Carbono (Kg CO2)
- Metricas de desperdicio y consumo.

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
# gemelo

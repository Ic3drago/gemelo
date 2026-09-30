# Gemelo Digital de Consumo del Hogar

Aplicación educativa para observar, proyectar y simular el consumo doméstico, alineada con el ODS 12: Producción y Consumo Responsables. La plataforma relaciona compras, energía, desperdicio de alimentos, finanzas y gamificación.

> La tarifa eléctrica y los factores de conversión son referenciales y editables. No representan valores oficiales ni sustituyen una factura real.

## Arquitectura

```text
PWA Next.js :4000 → API Gateway NestJS :3000
                         ├── Compras NestJS :3001 ── PostgreSQL / RabbitMQ
                         ├── Energía NestJS :3002 ── PostgreSQL / RabbitMQ
                         ├── Alimentos NestJS :3003 ─ PostgreSQL / RabbitMQ
                         ├── Gamificación NestJS :3004 ─ PostgreSQL ← RabbitMQ
                         ├── Facturas FastAPI/OCR :3005
                         ├── Finanzas NestJS :3006 ─ PostgreSQL / RabbitMQ
                         └── Simulación FastAPI :8000 ─ scikit-learn
```

Finanzas permanece como servicio propio porque cuentas, balances, transacciones, recurrencias y metas tienen invariantes independientes de Compras. El gateway agrega lecturas del resto de los servicios para construir el dashboard. PostgreSQL se ejecuta como instancia compartida en desarrollo y cada servicio usa su base lógica.

Los servicios NestJS separan controladores HTTP, servicios de aplicación, entidades y value objects/policies. FastAPI separa las rutas del motor de simulación y de los factores de carbono. RabbitMQ conserva el exchange `household.events` y los contratos existentes.

## Endpoints del Gateway

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del gateway |
| GET | `/api/dashboard?householdId=hogar_001` | Compras, energía, comida, perfil, gasto disponible, 50/30/20, huella, alertas y cuentas |
| POST/GET | `/api/purchases` | Registra y consulta compras; monto positivo y categoría válida |
| GET | `/api/purchases/summary` | Totales mensuales agrupados por categoría |
| POST/GET | `/api/energy/readings` | Registra y consulta lecturas de energía |
| GET | `/api/energy/summary` | Totales mensuales de kWh, Bs y CO₂ |
| POST | `/api/bills/calculate` | Calcula tramos, cargo fijo, alumbrado, total y CO₂ sin guardar |
| POST/GET | `/api/bills` | Guarda/reemplaza la factura del mes y consulta el historial |
| POST/GET | `/api/food` | Registra y consulta alimentos |
| PATCH | `/api/food/:id/status` | Transiciona alimento de `stored` a `consumed` o `wasted` |
| GET | `/api/food/waste-summary` | Resumen mensual de desperdicio |
| POST/GET | `/api/food/reminders` | Crea y consulta recordatorios de vencimiento pendientes |
| GET | `/api/gamification/profile?householdId=hogar_001` | Puntos, nivel, avance y puntos faltantes |
| GET | `/api/gamification/achievements` | Logros del hogar |
| GET | `/api/gamification/points-history/:householdId` | Historial de puntos |
| GET | `/api/gamification/leaderboard` | Clasificación existente |
| GET | `/api/predict` o `/api/predictions` | Predicciones a 1, 3 y 6 meses, con rango |
| POST | `/api/simulate` o `/api/simulation/simulate` | Simula reducciones de energía, desperdicio y compras |
| POST | `/api/retrain` | Actualiza errores de predicción registrados |
| GET/POST | `/api/finances/accounts` | Cuentas efectivo, banco y ahorro |
| GET/POST | `/api/finances/transactions` | Ingresos y egresos; actualizan el balance de la cuenta |
| GET/POST | `/api/finances/goals` | Metas de ahorro y aporte semanal sugerido |
| GET/POST | `/api/finances/budgets` | Límites mensuales heredados |
| GET/PUT | `/api/budget` | Consulta y configura ingreso mensual del hogar |
| POST | `/api/invoices/scan` | Extrae datos de imagen con OCR; la respuesta requiere revisión |
| POST | `/api/invoices/confirm` | Confirma la factura y publica una compra; crea recordatorios perecibles estimados |
| POST | `/api/invoices` | Ruta de guardado manual heredada, conservada por compatibilidad |

Las llamadas a `/api/simulation/simulate` admiten el contrato actual `{ "energy": 10, "waste": 20, "purchases": 5, "months": 6 }`, con porcentajes entre 0 y 100. También se conservan `householdId`, `horizonMonths`, `energyReductionPct`, `wasteReductionPct` y `purchaseChangePct` para clientes existentes.

Las solicitudes con montos, kWh o cantidades inválidas devuelven HTTP 400/422 con mensajes concretos. El dashboard puede devolver las secciones disponibles aunque un servicio individual no responda.

## Eventos RabbitMQ

| Evento | Publicador | Consumidor |
|---|---|---|
| `purchase.registered` | Compras | Gamificación |
| `energy.reading` | Energía | Gamificación |
| `food.status_changed` | Alimentos, contrato existente | Consumidores existentes |
| `food.consumed` / `food.wasted` | Alimentos | Gamificación |
| `bill.saved` | Energía | Gamificación (+3 puntos) |
| `finance.transaction.added` | Finanzas | Consumidores disponibles |

Los payloads de los eventos existentes se mantienen. La lectura de energía derivada de una factura sigue publicándose para consumidores, pero Gamificación evita sumar el premio de lectura además del premio `bill.saved`.

## Tarifa eléctrica referencial

La configuración vive en `services/energy/src/electricity-tariff.vo.ts` y en el factor usado por Simulación. Se aplican tramos progresivos: primeros 30 kWh a Bs 0,75; siguientes 70 kWh a Bs 0,89; siguientes 100 kWh a Bs 1,00; excedente a Bs 1,15. Se añaden cargo fijo de Bs 5 y alumbrado público de 6% sobre el cargo por energía. El factor usado es 0,5 kg CO₂/kWh.

Comprobación del ejemplo: 252 kWh producen Bs 244,60 por energía + Bs 5,00 fijo + Bs 14,68 de alumbrado = **Bs 264,28** y **126 kg CO₂**. Todos los parámetros están marcados como referenciales en el código.

## Predicciones y simulación

El motor ajusta regresión lineal a la historia mensual y expone proyección central, bandas de 1 y 3 desviaciones estándar residuales y detección de anomalías. Con menos de ocho meses el resultado se marca `is_preliminary` y la interfaz muestra “Predicción preliminar”.

El ahorro estima la diferencia entre facturas progresivas, Bs 20 por kilogramo de alimento evitado y el gasto de compras reducido. CO₂ evitado usa los factores centralizados de energía, desperdicio y gasto. Los valores son estimaciones demostrativas.

| Factor | Valor referencial | Código |
|---|---:|---|
| CO₂ por kWh eléctrico | 0,5 kg/kWh | `services/energy/src/carbon-factor.vo.ts`, `services/simulation/app/domain/carbon_factors.py` |
| CO₂ por kg desperdiciado | 2,5 kg/kg | `services/food/src/food.entity.ts`, `services/simulation/app/domain/carbon_factors.py` |
| CO₂ por gasto | 0,01 kg/Bs | `services/purchases/src/purchase-category.vo.ts`, `services/simulation/app/domain/carbon_factors.py` |
| Ahorro al evitar desperdicio | Bs 20/kg | `services/simulation/app/domain/carbon_factors.py` |

Son coeficientes simplificados para fines educativos y requieren validación antes de cualquier uso oficial.

## Reglas de dominio

- Categorías de compra: `alimentos`, `servicios`, `transporte`, `ocio` y `hogar`. `ocio` se considera deseo; las demás, necesidad. Categorías heredadas se traducen a las categorías canónicas.
- Presupuesto 50/30/20: 50% necesidades, 30% deseos y 20% ahorro.
- Alertas: energía sobre 110% del promedio histórico, desperdicio sobre 120% de lo normal y necesidades al menos al 90% del límite.
- Gamificación: compra +5; lectura eficiente (<5 kWh) +15; lectura normal +3; comida consumida +10; comida desperdiciada -5; factura guardada +3.
- Niveles: Principiante desde 0; Consciente desde 101; Eco-Guerrero desde 501; Campeón Sostenible desde 1501 puntos.
- `Account.applyIncome`, `applyExpense` y `applyTransaction` protegen balances y evitan egresos superiores al saldo. Las transacciones recurrentes se generan de forma idempotente al iniciar/consultar finanzas y actualizan la cuenta dentro de una transacción.
- Las metas exponen saldo pendiente y aporte semanal sugerido según la fecha objetivo.

## Facturas y OCR

Facturas acepta imágenes con Tesseract en español. Los datos extraídos se muestran para revisión y el guardado ocurre solo al confirmar. La pantalla también permite introducirlos manualmente, incluidos datos de PDF: el OCR actual de PDF no está implementado. Los perecibles detectados sugieren una fecha aproximada de cinco días y la confirmación crea un recordatorio pendiente; todavía no hay servicio de notificaciones push.

## Ejecución local y Docker

Requisitos: Docker Compose y Node.js 18 o posterior para scripts.

```bash
docker compose up --build -d
node scripts/seed.js
```

El seed espera al gateway, genera compras en cinco categorías, lecturas/facturas de seis meses (221, 228, 224, 236, 241 y 255 kWh), alimentos consumidos/desperdiciados, cuentas y un ingreso mensual de Bs 4.200. También regenera `frontend/public/demo-data.json`. La interfaz queda en `http://localhost:4000` y el gateway en `http://localhost:3000`.

Para actividad continua ejecuta `node scripts/live-generator.js`; incluye compras, energía, alimentos y facturas ocasionales.

## Pruebas unitarias

Con las dependencias de desarrollo instaladas, desde cada carpeta de servicio:

```bash
npm --prefix services/energy test
npm --prefix services/gamification test
npm --prefix services/food test
npm --prefix services/finances test
cd services/simulation && python -m unittest discover -s tests -v
```

Las pruebas cubren el ejemplo de tarifa de Bs 264,28, puntos/niveles, transiciones de alimentos, invariante de balance, regresión/rangos y ahorro del simulador.

## Modo demo sin backend

La interfaz contiene un adaptador local que lee `frontend/public/demo-data.json` y persiste cambios en `localStorage`. Cálculos de factura, predicción, simulación, niveles y presupuesto siguen las fórmulas documentadas.

```bash
cp frontend/.env.demo frontend/.env.local
cd frontend
npm install
npm run dev
```

El servidor Next.js usa el puerto 4000. Para alternar a backend, elimina `NEXT_PUBLIC_DEMO_MODE` o configúralo como `false`. El seed repone el fixture base.

El modo demo también se activa solo: si `NEXT_PUBLIC_API_URL` falta, está vacía o no es una URL `http(s)`, `src/lib/api.ts` conmuta al adaptador local. No hace falta tocar nada para levantar la interfaz sin backend.

## Tema claro y oscuro

`tailwind.config.js` usa `darkMode: 'class'`, así que el tema se controla desde `src/lib/theme.ts`. La preferencia (sistema / claro / oscuro) se guarda en `localStorage` bajo `gemelo-theme`, el `ThemeToggle` de la barra lateral y de la landing la modifica, y `layout.tsx` inyecta un script anti-parpadeo para evitar el destello blanco al recargar.

Todos los tokens de color viven en `src/app/globals.css` en dos bloques: `:root` para el tema claro y `.dark` para el oscuro. Es importante mantener el orden **claro → oscuro** en el archivo: el CSS más reciente gana, y una capa `prefers-color-scheme` intercalada realimenta la variable que acaba de escribir. La landing usa además su propio juego `--l-*` con override `.dark .landing-page`, porque su paleta es distinta a la de la aplicación.

Antes de dar por buena una combinación de colores, comprueba el contraste: el texto blanco sobre `forest-600` o `sky-600` se queda en 3,3:1 y 4,1:1, por debajo del 4,5:1 que exige WCAG AA. Los botones primarios y los avisos usan `brand-700` (9,6:1) y los tonos 700 en rosa, cielo y ámbar.

## Animaciones

`src/lib/animations.ts` envuelve anime.js v4 con helpers que respetan `prefers-reduced-motion` y limpian sus instancias al desmontar: `revealOnScroll`, `staggerIn`, `countUp`, `countUpAll`, `drawLine`, `scrollProgress`, `heroIntro`, `float`, `pulse`, `tiltOnHover` y `animateDisclosure`, más los hooks `useAnimationEffect` y `useRevealOnScroll`.

Los hooks solo se ejecutan en el cliente, y el script del tema se inyecta como `dangerouslySetInnerHTML` porque tiene que ejecutarse antes de la primera pintura.

## Despliegue en Vercel

El `vercel.json` de la raíz compila solo el frontend (`cd frontend`), publica `frontend/.next` y activa los encabezados de la PWA. Los servicios NestJS, el gateway, PostgreSQL, RabbitMQ y la carpeta `infra/` quedan fuera del deploy mediante `.vercelignore`.

Conecta el repositorio en Vercel y define estas variables de entorno:

| Variable | Valor | Efecto |
| --- | --- | --- |
| `NEXT_PUBLIC_DEMO_MODE` | `true` | Frontend autónomo con datos locales, sin backend. |
| `NEXT_PUBLIC_API_URL` | `https://tu-gateway` | Conecta con el gateway real. Ignorada si la anterior es `true`. |
| `NEXT_PUBLIC_SITE_URL` | `https://tu-dominio.vercel.app` | URL canónica y etiquetas OpenGraph. Opcional. |

Si no defines ninguna, la app detecta que no hay URL válida y entra en modo demo por su cuenta, así que el deploy nunca queda en blanco esperando un gateway inexistente.

Dos detalles propios de Vercel: `next.config.js` desactiva el `output: 'standalone'` cuando detecta `VERCEL`, porque Vercel sirve el build por su cuenta; y las variables `NEXT_PUBLIC_*` se **incrustan durante el build**, por lo que cambiarlas exige redeploy, no un simple reinicio.

## Despliegue con Docker

```bash
docker compose up --build -d
```

La imagen del frontend recibe `NEXT_PUBLIC_API_URL` como *build arg* (ver `docker-compose.yml`), porque las variables `NEXT_PUBLIC_*` también quedan incrustadas en el bundle. Las carpetas del proyecto incluyen `.dockerignore` para que `node_modules` y `.next` del host no se cuelen en la imagen.

## Despliegue y Google Sites

La política HTTP no añade `X-Frame-Options: DENY`. En Google Sites: **Insertar → Incorporar → Por URL**, pega `https://tu-dominio.vercel.app/app` y ajusta el alto del marco. El origen del gateway y CORS deben permitir el dominio desde el que se accede a servicios reales; el modo demo no necesita gateway.

## Guion de demostración en cinco pasos

1. Abrir Inicio y revisar gasto disponible, presupuesto, alertas y huella.
2. En Luz, calcular 252 kWh, guardar la factura y ver el historial.
3. Volver al panel y revisar el cambio en la proyección y el presupuesto.
4. En Futuro, reducir desperdicio o energía y comparar el ahorro estimado.
5. Registrar una compra o un alimento y mostrar los puntos en Logros.

## Estado del prototipo

Este checkout no contiene la carpeta `prototype/` indicada en el encargo y tampoco incluye metadatos `.git`. Por ello no fue posible cotejar o mover `prototype/server.js` y `prototype/index.html`, cambiar a `feature/prototipo-integracion` ni crear commits. La integración se implementó usando los servicios presentes y la especificación funcional; el prototipo original podrá archivarse en `docs/prototype/` cuando esté disponible.
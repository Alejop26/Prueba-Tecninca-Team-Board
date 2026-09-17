# Portal de equipo con tablero de notas

Aplicación web para que un equipo gestione su acceso, sus usuarios y un
tablero compartido de notas tipo post-it, con dashboard de métricas.

- **Backend**: Node.js + Express + MongoDB (Mongoose), JWT para autenticación.
- **Frontend**: React + Vite + Bootstrap 5.
- **Infraestructura**: Docker Compose para local; EC2 + Lambda + API Gateway
  + S3 + CloudFront para AWS (ver `infra/README.md`).

## Tiempo empleado

*14 horas*

## Ejecución local

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:4000/api

La primera vez, crea las cuentas de demostración:

```bash
docker compose exec backend npm run seed
```

### Sin Docker

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

## Cuentas de demostración

| Rol           | Email          | Contraseña |
|---------------|----------------|------------|
| Administrador | admin@demo.com | Admin123!  |
| Usuario       | user@demo.com  | User123!   |

Un usuario nuevo se crea desde **Usuarios** (solo visible para
administradores): nombre, email, contraseña inicial y rol. Accede después
con esas credenciales en `/login`. La contraseña se guarda como hash bcrypt,
nunca en texto plano.

## Funcionalidad

### Acceso y usuarios
- Login/logout con JWT. Los usuarios inactivos no pueden iniciar sesión ni
  seguir usando el área autenticada: cada request revalida `active` contra
  la base de datos, no solo la validez del token.
- Panel de administración (`/users`, solo admin): listar, crear, cambiar rol
  y activar/desactivar usuarios. El backend impide dejar el sistema sin
  ningún administrador activo (`backend/src/routes/users.routes.js`).

### Tablero compartido
- Lienzo libre con notas post-it arrastrables (posición x/y persistida al
  soltar). Título, texto y estado se editan directamente sobre la nota y se
  confirman con "Guardar". El color de cada nota refleja su estado.
- Todos los usuarios activos pueden crear, editar, mover y eliminar
  cualquier nota del tablero.

### Dashboard
- Total de notas y distribución por estado. La lógica de cálculo vive en
  `backend/src/services/metrics.js` y la reutilizan tanto la ruta Express
  (`/api/dashboard`, usada en local) como el handler de AWS Lambda
  (`backend/lambda/metrics.js`, usado en producción vía API Gateway).

## Persistencia

MongoDB con un volumen Docker (`mongo-data`). Los datos sobreviven a
reinicios del contenedor mientras no se borre el volumen
(`docker compose down -v` sí lo eliminaría).

## Arquitectura y despliegue en AWS

Ver [`infra/README.md`](infra/README.md) para el diagrama, los parámetros y
los pasos de `deploy.sh` / `destroy.sh` (EC2 para la API, Lambda + API
Gateway para el dashboard, S3 + CloudFront para el frontend).

## Limitaciones y pendientes conocidos

- No se ha desplegado una URL pública de demostración; el despliegue en AWS
  se entrega como infraestructura como código, no como entorno ya corriendo.
- La AMI de `ec2-api.yaml` está fijada a un id de ejemplo para
  `us-east-1`; hay que actualizarla si se despliega en otra región.
- No hay tests automatizados (fuera del alcance de las 8 horas disponibles).
- El acceso de la Lambda a MongoDB en EC2 se simplifica abriendo el puerto
  27017 a un CIDR en vez de usar peering/VPC endpoints (detalle y alternativa
  en `infra/README.md`).

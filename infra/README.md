# Arquitectura y despliegue en AWS

```
                ┌────────────────────┐
   Usuario ───► │ CloudFront (HTTPS) │──► S3 (build de React, privado)
                └────────────────────┘
                          │  llamadas fetch del SPA
                          ▼
        ┌───────────────────────────────┐      ┌───────────────────────────┐
        │ EC2 (Docker): API Express      │      │ API Gateway ─► Lambda      │
        │ + MongoDB                      │◄────►│ (métricas del dashboard)  │
        │  /api/auth /api/notes /api/users        └───────────────────────────┘
        └───────────────────────────────┘
```

- **EC2**: corre `docker-compose.prod.yml` (backend Express + MongoDB) dentro
  de un contenedor Docker, tal como pide el enunciado.
- **Lambda**: calcula y sirve las métricas del dashboard reutilizando
  `backend/src/services/metrics.js`. Se conecta al mismo MongoDB que corre en
  EC2 (o a un MongoDB Atlas, si se prefiere no depender de la instancia).
- **S3 + CloudFront**: alojan el build estático de React. El bucket es
  privado; CloudFront accede vía Origin Access Control.

## Requisitos previos

- AWS CLI y AWS SAM CLI instalados y configurados (`aws configure`).
- Un par de claves EC2 ya creado en la región de destino.
- Una VPC con al menos una subnet pública (puede ser la VPC por defecto).
- El repositorio del proyecto accesible por git (para que EC2 lo clone en el
  arranque vía `user data`).

## Parámetros a definir antes de desplegar

| Variable      | Descripción                                             |
|---------------|----------------------------------------------------------|
| `VPC_ID`      | Id de la VPC (`aws ec2 describe-vpcs`).                   |
| `SUBNET_ID`   | Subnet pública dentro de esa VPC.                         |
| `KEY_NAME`    | Nombre del par de claves EC2 para SSH.                    |
| `REPO_URL`    | URL git del repositorio a clonar en la instancia.         |
| `JWT_SECRET`  | Secreto para firmar los tokens de sesión.                 |
| `MONGO_URI`   | Opcional. Si no se define, se usa la IP pública de EC2:27017 (ver nota de seguridad abajo). |
| `AWS_REGION`  | Región de despliegue (por defecto `us-east-1`).           |

## Desplegar

```bash
export VPC_ID=vpc-xxxx
export SUBNET_ID=subnet-xxxx
export KEY_NAME=mi-llave
export REPO_URL=https://github.com/mi-usuario/team-board.git
export JWT_SECRET=$(openssl rand -hex 32)

./infra/scripts/deploy.sh
```

El script, en orden:
1. Despliega EC2 (API + Mongo en Docker) con CloudFormation.
2. Compila y despliega la Lambda de métricas con AWS SAM, apuntando al
   MongoDB de EC2.
3. Despliega S3 + CloudFront, compila el frontend con las URLs de API
   generadas y sube el build.

## Retirar todo

```bash
./infra/scripts/destroy.sh
```

Borra los tres stacks de CloudFormation (frontend, métricas, API) y vacía el
bucket S3 antes de eliminarlo.

## Ejecutar la Lambda en local

```bash
cd infra/sam
sam build --template-file template.yaml
sam local start-api --env-vars env.local.json --docker-network team-board_default
```

`--docker-network team-board_default` conecta la Lambda emulada a la misma
red que crea `docker compose up` en la raíz del proyecto, para que pueda
resolver el hostname `mongo`.

## Nota de seguridad (entrega de prueba técnica)

Para simplificar la entrega, `ec2-api.yaml` abre el puerto 27017 de MongoDB
a un CIDR (parámetro `LambdaAccessCidr`, vacío por defecto) para que la
Lambda pueda leer las notas sin gestionar peering ni VPC endpoints
adicionales. En un entorno productivo real, la Lambda debería desplegarse en
la misma VPC (parámetros `VpcSubnetIds` / `VpcSecurityGroupIds` del template
SAM) y el acceso a Mongo debería restringirse a esa security group, no a un
CIDR abierto; o directamente usar un servicio gestionado (MongoDB Atlas /
DocumentDB) con su propio control de acceso.

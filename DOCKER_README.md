# Net Worth Tracker - Docker Setup

## Quick Start (One Command)

```bash
./start.sh
```

Then open: http://localhost:3000

## Scripts

| Script | Description |
|--------|-------------|
| `./start.sh` | Start the app (builds if needed) |
| `./stop.sh` | Stop the app |
| `./rebuild.sh` | Rebuild with latest changes |
| `./logs.sh` | View live logs |

## Making New Versions

### Method 1: Rebuild with script
```bash
./rebuild.sh
```

### Method 2: Manual rebuild
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Versioning

Current version: See `VERSION` file

To bump version:
```bash
echo "1.0.1" > VERSION
git add VERSION
git commit -m "Bump version to 1.0.1"
git tag v1.0.1
git push origin v1.0.1
```

## Services

- **Frontend**: http://localhost:3000 (Next.js)
- **Backend API**: http://localhost:8000 (FastAPI)
- **API Docs**: http://localhost:8000/docs
- **Database**: PostgreSQL on port 5432

## Environment

Create a `.env` file in root (optional):

```env
POSTGRES_ADMIN_USER=postgres
POSTGRES_ADMIN_PASSWORD=your_password
POSTGRES_DB=nw_tracker
POSTGRES_PORT=5432
BACKEND_PORT=8000
FRONTEND_PORT=3000
JWT_SECRET_KEY=your-secret-key-here
```

## Data Persistence

All data is stored in Docker volumes and persists between restarts.
To completely reset: `docker-compose down -v`

# CivicGuard AI

Citizen Grievance-to-Action & Public Health Risk Automator.

This repository is scaffolded around the SRS you provided:

- Backend: FastAPI
- Citizen app: React + Vite
- Admin dashboard: Streamlit
- Database: PostgreSQL/Supabase with a direct connection for backend startup
- Weather: Open-Meteo
- ML: MobileNetV2-style training workflow with a demo-safe fallback classifier
- Database: PostgreSQL/Supabase-ready for production and local startup

## Local run

1. Copy `.env.example` to `.env` and set your Supabase database password in `DATABASE_URL`.
2. Start the backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. Start the citizen app:

```bash
cd frontend
npm install
npm run dev
```

4. Start the dashboard:

```bash
cd admin-dashboard
pip install -r requirements.txt
streamlit run streamlit_app.py
```

5. Train the ML model in Colab or locally:

```bash
notebooks/mobilenetv2_training.ipynb
```

6. Apply the database schema for a PostgreSQL/Supabase deployment:

```bash
database/supabase_schema.sql
```

## Demo accounts

- `admin@civicguard.local` / `Admin@1234!`
- `officer@civicguard.local` / `Officer@1234!`
- `health@civicguard.local` / `Health@1234!`

## Notes

- The repo includes the production-ready architecture choices from the SRS.
- The ML training path is included, but the app also works with a deterministic fallback so the demo is not blocked on model training.
- For Supabase, set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` in `.env`. The publishable key is safe to share; the service-role key is only needed if you want server-side uploads to Supabase Storage.
- If you want the React frontend to talk to Supabase directly, also set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `frontend/.env.local` or copy them from `.env.example`.
- For PostgreSQL/Supabase, set `DATABASE_URL` to the Supabase direct connection string in `.env`.

## Supabase CLI

If you want to manage the backend schema with Supabase locally, run:

```bash
supabase login
supabase init
supabase link --project-ref oezknuwiteyqpmrevhzh
```

Then apply [database/supabase_schema.sql](database/supabase_schema.sql) to the linked project.

-- Create DDL user for Alembic migrations
-- This user can create, alter, and drop database objects
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'alembic_user') THEN
        CREATE ROLE alembic_user LOGIN PASSWORD 'alembic_password';
    END IF;
END
$$;

-- Create RW user for application
-- This user can read and write data but cannot modify schema
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user LOGIN PASSWORD 'app_password';
    END IF;
END
$$;

-- Create RO user for reporting
-- This user can only read data
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'reporting_user') THEN
        CREATE ROLE reporting_user LOGIN PASSWORD 'reporting_password';
    END IF;
END
$$;

-- Grant schema permissions to DDL user
GRANT USAGE ON SCHEMA public TO alembic_user;
GRANT CREATE ON SCHEMA public TO alembic_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO alembic_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO alembic_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO alembic_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO alembic_user;

-- Grant data permissions to RW user
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- Grant read-only permissions to RO user
GRANT USAGE ON SCHEMA public TO reporting_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporting_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO reporting_user;

-- Set up default privileges for alembic_user to grant permissions to app_user and reporting_user
-- This ensures that when alembic_user creates tables, app_user and reporting_user get access
ALTER DEFAULT PRIVILEGES FOR ROLE alembic_user IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE alembic_user IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO app_user;

ALTER DEFAULT PRIVILEGES FOR ROLE alembic_user IN SCHEMA public
    GRANT SELECT ON TABLES TO reporting_user;

-- Grant existing table permissions immediately
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    -- Grant permissions on all existing tables to app_user
    FOR table_rec IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO app_user', table_rec.tablename);
        EXECUTE format('GRANT SELECT ON TABLE %I TO reporting_user', table_rec.tablename);
    END LOOP;

    -- Grant permissions on all existing sequences to app_user
    FOR table_rec IN
        SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'
    LOOP
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO app_user', table_rec.sequencename);
    END LOOP;
END
$$;

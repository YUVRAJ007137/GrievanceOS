-- ==============================
-- ORGANIZATIONS
-- ==============================

CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auto-generate slug from name
CREATE OR REPLACE FUNCTION generate_org_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    base_slug TEXT;
    candidate TEXT;
    counter INT := 0;
BEGIN
    base_slug := trim(both '-' from regexp_replace(
        regexp_replace(lower(COALESCE(NEW.name, '')), '[^a-z0-9]+', '-', 'g'),
        '-+', '-', 'g'
    ));
    IF base_slug = '' THEN base_slug := 'org'; END IF;

    candidate := base_slug;
    LOOP
        IF NOT EXISTS (SELECT 1 FROM organizations WHERE slug = candidate AND id IS DISTINCT FROM NEW.id) THEN
            NEW.slug := candidate;
            RETURN NEW;
        END IF;
        counter := counter + 1;
        candidate := base_slug || '-' || counter;
    END LOOP;
END;
$$;

CREATE TRIGGER set_org_slug
    BEFORE INSERT OR UPDATE OF name ON organizations
    FOR EACH ROW EXECUTE FUNCTION generate_org_slug();

-- ==============================
-- DEPARTMENTS
-- ==============================

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_departments_org ON departments(organization_id);

-- ==============================
-- ORGANIZATION ADMINS
-- ==============================

CREATE TABLE organization_admins (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_org_admins_org ON organization_admins(organization_id);

-- ==============================
-- DEPARTMENT ADMINS
-- ==============================

CREATE TABLE department_admins (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,
    FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_dept_admins_org ON department_admins(organization_id);
CREATE INDEX idx_dept_admins_dept ON department_admins(department_id);

-- ==============================
-- USERS (CITIZENS)
-- ==============================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_users_org ON users(organization_id);

-- ==============================
-- COMPLAINTS
-- ==============================

CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    department_id INTEGER,
    user_id INTEGER NOT NULL,
    assigned_to INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,
    FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE SET NULL,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    FOREIGN KEY (assigned_to)
        REFERENCES department_admins(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_complaints_org ON complaints(organization_id);
CREATE INDEX idx_complaints_dept ON complaints(department_id);
CREATE INDEX idx_complaints_user ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================
-- COMPLAINT RESPONSES
-- ==============================

CREATE TABLE complaint_responses (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL,
    author_type VARCHAR(20) NOT NULL
        CHECK (author_type IN ('org_admin', 'dept_admin', 'user')),
    author_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id)
        REFERENCES complaints(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_responses_complaint ON complaint_responses(complaint_id);

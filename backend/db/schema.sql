-- MediTrack schema
-- Per CLAUDE.md section 5, with one addition: medications.is_active (soft delete),
-- needed for the "Delete/remove medication" flow in section 7, which requires
-- transaction history to survive the delete for audit purposes.

CREATE TABLE IF NOT EXISTS users (
    user_id       SERIAL PRIMARY KEY,
    username      VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'pharmacist',
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medications (
    medication_id        SERIAL PRIMARY KEY,
    name                  VARCHAR(100) NOT NULL,
    current_stock         INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    alert_threshold_days  INTEGER NOT NULL DEFAULT 5,
    status                VARCHAR(10) NOT NULL DEFAULT 'green', -- green / yellow / red
    department            VARCHAR(50),
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdrawal_transactions (
    transaction_id    SERIAL PRIMARY KEY,
    medication_id      INTEGER NOT NULL REFERENCES medications(medication_id),
    user_id             INTEGER NOT NULL REFERENCES users(user_id),
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    department          VARCHAR(50),
    transaction_type    VARCHAR(20) NOT NULL, -- withdrawal / restock
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_med_date ON withdrawal_transactions(medication_id, created_at);
CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(is_active);

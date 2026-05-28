-- Subscription Management Platform Schema (PostgreSQL)

-- Core User Profile
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    kyc_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plaid Items (Bank Connections)
CREATE TABLE linked_institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institution_name VARCHAR(100),
    encrypted_access_token TEXT NOT NULL,
    sync_status VARCHAR(50) DEFAULT 'IDLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plaid Accounts (Checking, Credit, etc.)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES linked_institutions(id) ON DELETE CASCADE,
    plaid_account_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    mask VARCHAR(4),
    type VARCHAR(50) NOT NULL,
    subtype VARCHAR(50),
    current_balance DECIMAL(10, 2),
    available_balance DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Identified Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    merchant_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_frequency VARCHAR(50),
    next_billing_date DATE,
    plaid_stream_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Variable Daily Expenses
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    merchant_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    category VARCHAR(50),
    transaction_date DATE,
    plaid_transaction_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telemetry & Audit Logic
CREATE TABLE activity_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    audit_period_start DATE NOT NULL,
    audit_period_end DATE NOT NULL,
    usage_minutes INT DEFAULT 0,
    cost_per_minute DECIMAL(10, 4),
    recommendation_triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gamification & ROI Tracking
CREATE TABLE savings_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    action_taken VARCHAR(50),
    monthly_amount_saved DECIMAL(10, 2) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Setup
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_logs ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy
CREATE POLICY "Users can only view their own data" ON users FOR SELECT USING (auth.uid() = id);
-- Add additional RLS policies for each table referencing user_id...

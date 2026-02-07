-- Add type column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'purchase';

-- Update existing transactions to have a default type
UPDATE transactions SET type = 'purchase' WHERE type IS NULL;
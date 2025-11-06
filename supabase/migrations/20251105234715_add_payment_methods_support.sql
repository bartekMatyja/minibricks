/*
  # Add Payment Methods Support

  1. Schema Changes
    - Add payment_method column to orders table
      - Supported values: 'credit_card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer', 'cash_on_delivery'
    - Add payment_status column to orders table
      - Values: 'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
    - Add payment_intent_id column for Stripe payment references
    - Add paypal_order_id column for PayPal transaction references
    - Add transaction_id column for general payment processor references
    - Add payment_processor column to identify which gateway was used
    - Add payment_metadata column (JSONB) to store additional payment details

  2. Indexes
    - Add index on payment_status for filtering orders by payment state
    - Add index on payment_method for analytics and reporting
    - Add index on payment_intent_id for Stripe webhook lookups

  3. Important Notes
    - All payment columns are nullable to support gradual migration
    - Default payment_status is 'pending' for new orders
    - payment_metadata stores extra information like last 4 digits, brand, etc.
    - Existing orders will have NULL values which can be updated later
*/

-- Add payment-related columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_intent_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_intent_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'paypal_order_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN paypal_order_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN transaction_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_processor'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_processor text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_metadata'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_metadata jsonb;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id);

-- Add check constraint for payment_method values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_payment_method_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
    CHECK (payment_method IN ('credit_card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer', 'cash_on_delivery'));
  END IF;
END $$;

-- Add check constraint for payment_status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
    CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'));
  END IF;
END $$;
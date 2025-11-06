/*
  # Create Orders Management System

  1. New Tables
    - `orders`
      - `id` (uuid, primary key) - Unique order identifier
      - `order_number` (text, unique) - Human-readable order number
      - `customer_first_name` (text) - Customer's first name
      - `customer_last_name` (text) - Customer's last name
      - `customer_email` (text) - Customer's email for confirmation
      - `shipping_address` (text) - Street address
      - `shipping_city` (text) - City
      - `shipping_state` (text) - State
      - `shipping_zip` (text) - ZIP code
      - `total_amount` (decimal) - Total order amount
      - `order_status` (text) - Order status (pending, processing, shipped, delivered)
      - `created_at` (timestamptz) - Order creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `order_items`
      - `id` (uuid, primary key) - Unique item identifier
      - `order_id` (uuid, foreign key) - Reference to orders table
      - `product_id` (integer) - Product ID from catalog
      - `product_name` (text) - Product name at time of order
      - `product_tagline` (text) - Product tagline
      - `price` (decimal) - Price per unit at time of order
      - `quantity` (integer) - Quantity ordered
      - `subtotal` (decimal) - Line item total (price * quantity)
      - `created_at` (timestamptz) - Item creation timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated admin access (future use)
    - Tables are secure by default with no public access
  
  3. Indexes
    - Index on order_number for quick lookups
    - Index on customer_email for customer order history
    - Index on order_id in order_items for fast joins
    - Index on created_at for date-based queries

  4. Important Notes
    - Order numbers are generated as "ORD-" + timestamp + random string
    - All prices stored as decimal(10,2) for accurate financial calculations
    - Timestamps use timestamptz for proper timezone handling
    - Foreign key constraint ensures data integrity between orders and items
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_first_name text NOT NULL,
  customer_last_name text NOT NULL,
  customer_email text NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  shipping_state text NOT NULL,
  shipping_zip text NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  order_status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id integer NOT NULL,
  product_name text NOT NULL,
  product_tagline text NOT NULL,
  price decimal(10,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies (restrictive by default - no public access)
-- Future: Can add policies for authenticated admin users to view orders
CREATE POLICY "Service role can manage orders"
  ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage order items"
  ON order_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
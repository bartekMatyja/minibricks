/*
  # Allow Anonymous Order Creation

  1. Security Updates
    - Add policy to allow anonymous users to INSERT orders
    - Add policy to allow anonymous users to INSERT order_items
    - These policies are write-only (INSERT only) for security
    - Anonymous users cannot read, update, or delete orders
  
  2. Important Notes
    - This enables public order submission from the checkout form
    - Orders are still protected - anonymous users cannot view existing orders
    - Only INSERT operations are allowed for anonymous users
    - All other operations require service_role access
*/

-- Allow anonymous users to create orders
CREATE POLICY "Allow anonymous users to create orders"
  ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to create order items
CREATE POLICY "Allow anonymous users to create order items"
  ON order_items
  FOR INSERT
  TO anon
  WITH CHECK (true);
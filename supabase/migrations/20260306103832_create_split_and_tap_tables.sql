/*
  # Split & Tap Database Schema

  ## Overview
  Creates the core database structure for the Split & Tap bill-splitting application.

  ## New Tables
  
  1. **sessions** - Bill splitting sessions
     - `id` (uuid, primary key) - Unique session identifier
     - `name` (text) - Event/restaurant name
     - `total_amount` (decimal) - Total bill amount
     - `tip` (decimal) - Optional tip amount
     - `tax` (decimal) - Optional tax amount
     - `created_by` (text) - Host name
     - `created_at` (timestamptz) - When session was created
     - `status` (text) - Session status: 'active', 'completed', 'cancelled'
     - `split_type` (text) - How to split: 'equal', 'items', 'custom'

  2. **participants** - People joining the bill
     - `id` (uuid, primary key) - Unique participant identifier
     - `session_id` (uuid, foreign key) - Links to sessions table
     - `name` (text) - Participant name
     - `amount_owed` (decimal) - Amount this participant owes
     - `paid` (boolean) - Whether participant has confirmed payment
     - `joined_at` (timestamptz) - When participant joined
     - `payment_method` (text) - How they joined: 'qr', 'ussd', 'sms'

  3. **items** - Individual bill items (optional)
     - `id` (uuid, primary key) - Unique item identifier
     - `session_id` (uuid, foreign key) - Links to sessions table
     - `name` (text) - Item name
     - `price` (decimal) - Item price
     - `quantity` (integer) - Number of items

  4. **participant_items** - Junction table for item assignments
     - `id` (uuid, primary key) - Unique identifier
     - `participant_id` (uuid, foreign key) - Links to participants table
     - `item_id` (uuid, foreign key) - Links to items table
     - `quantity` (decimal) - Quantity of item (supports splitting)

  ## Security
  - Enable RLS on all tables
  - Allow public read/write for demo purposes (can be restricted later)
*/

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  tip decimal(10,2) DEFAULT 0,
  tax decimal(10,2) DEFAULT 0,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  split_type text DEFAULT 'equal' CHECK (split_type IN ('equal', 'items', 'custom'))
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount_owed decimal(10,2) DEFAULT 0,
  paid boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  payment_method text DEFAULT 'qr' CHECK (payment_method IN ('qr', 'ussd', 'sms'))
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  quantity integer DEFAULT 1
);

-- Create participant_items junction table
CREATE TABLE IF NOT EXISTS participant_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity decimal(10,2) DEFAULT 1,
  UNIQUE(participant_id, item_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_participants_session_id ON participants(session_id);
CREATE INDEX IF NOT EXISTS idx_items_session_id ON items(session_id);
CREATE INDEX IF NOT EXISTS idx_participant_items_participant_id ON participant_items(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_items_item_id ON participant_items(item_id);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_items ENABLE ROW LEVEL SECURITY;

-- Create policies (open for demo - can be restricted later)
CREATE POLICY "Allow public read access to sessions"
  ON sessions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to sessions"
  ON sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to sessions"
  ON sessions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to participants"
  ON participants FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to participants"
  ON participants FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to participants"
  ON participants FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to items"
  ON items FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to items"
  ON items FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to items"
  ON items FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to participant_items"
  ON participant_items FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to participant_items"
  ON participant_items FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to participant_items"
  ON participant_items FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from participant_items"
  ON participant_items FOR DELETE
  TO anon
  USING (true);
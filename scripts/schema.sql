-- Database schema for the DAVR Recycling application

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  image VARCHAR(255),
  password VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  subtype VARCHAR(50),
  recyclable BOOLEAN DEFAULT TRUE,
  market_value_level VARCHAR(20),
  approximate_min_price DECIMAL(10, 2),
  approximate_max_price DECIMAL(10, 2),
  image_url VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);

-- Recycling Centers table
CREATE TABLE IF NOT EXISTS recycling_centers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  state VARCHAR(50),
  country VARCHAR(50) DEFAULT 'Germany',
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(255),
  description TEXT,
  opening_hours JSONB,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  owner_id INTEGER REFERENCES users(id),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(20) DEFAULT 'pending',
  rating DECIMAL(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_recycling_centers_city ON recycling_centers(city);
CREATE INDEX IF NOT EXISTS idx_recycling_centers_postal_code ON recycling_centers(postal_code);
CREATE INDEX IF NOT EXISTS idx_recycling_centers_owner ON recycling_centers(owner_id);

-- Recycling Center Offers table
CREATE TABLE IF NOT EXISTS recycling_center_offers (
  id SERIAL PRIMARY KEY,
  recycling_center_id INTEGER NOT NULL REFERENCES recycling_centers(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  min_quantity DECIMAL(10, 2),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (recycling_center_id, material_id)
);

-- Create indexes for offers
CREATE INDEX IF NOT EXISTS idx_offers_center ON recycling_center_offers(recycling_center_id);
CREATE INDEX IF NOT EXISTS idx_offers_material ON recycling_center_offers(material_id);
CREATE INDEX IF NOT EXISTS idx_offers_price ON recycling_center_offers(price);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  recycling_center_id INTEGER NOT NULL REFERENCES recycling_centers(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_center ON reviews(recycling_center_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Marketplace Listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  material_id INTEGER REFERENCES materials(id),
  price DECIMAL(10, 2) NOT NULL,
  quantity DECIMAL(10, 2),
  unit VARCHAR(20),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for marketplace listings
CREATE INDEX IF NOT EXISTS idx_listings_material ON marketplace_listings(material_id);
CREATE INDEX IF NOT EXISTS idx_listings_user ON marketplace_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_city ON marketplace_listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_status ON marketplace_listings(status);

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables to automatically update updated_at
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_materials_modtime
BEFORE UPDATE ON materials
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_recycling_centers_modtime
BEFORE UPDATE ON recycling_centers
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_recycling_center_offers_modtime
BEFORE UPDATE ON recycling_center_offers
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_reviews_modtime
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_marketplace_listings_modtime
BEFORE UPDATE ON marketplace_listings
FOR EACH ROW EXECUTE PROCEDURE update_modified_column(); 
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS route_points (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  route_date DATE NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_route_points_user_date_time
  ON route_points(user_id, route_date, recorded_at);

CREATE TABLE IF NOT EXISTS favorite_places (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(300) NOT NULL,
  address VARCHAR(300) NOT NULL,
  distance_meters DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (user_id, place_id)
);

CREATE DATABASE mechamod;

--\c mechamod

CREATE TABLE keycap(
    keycap_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    price INT,
    description VARCHAR(255),
    order_position INT,
    image_path VARCHAR(255),
    stl_path VARCHAR(255),
    quantity INT DEFAULT 0
);

CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    cart_id VARCHAR(255) NOT NULL,
    keycap_id INT REFERENCES keycap(keycap_id),
    quantity INT DEFAULT 0
);

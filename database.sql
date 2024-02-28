CREATE DATABASE mechamod;

--\c mechamod

CREATE TABLE keycap(
    keycap_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    price INT,
    description VARCHAR(255),
    order_position INT,
    image_path VARCHAR(512),
    quantity INT DEFAULT 0
);
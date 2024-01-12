CREATE DATABASE mechamod;

--\c mechamod

CREATE TABLE keycap(
    keycap_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    price INT,
    description VARCHAR(255),
    quantity INT DEFAULT 0
);
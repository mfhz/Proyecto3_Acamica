---- Tabla de Usuarios
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  user_name VARCHAR (60) NOT NULL,
  password VARCHAR (60) NOT NULL,
  full_name VARCHAR(60) NOT NULL,
  mail VARCHAR(60) NOT NULL,
  phone INT NOT NULL,
  address VARCHAR (60) NOT NULL,
  admin BOOLEAN NOT NULL DEFAULT FALSE,
  disabled BOOLEAN DEFAULT FALSE
);

---- Tabla de Ordenes
CREATE TABLE orders (
  order_id INT PRIMARY KEY AUTO_INCREMENT,
  status VARCHAR(60) NOT NULL,
  date DATETIME NOT NULL,
  description VARCHAR(150) NOT NULL,
  payment_method VARCHAR (60) NOT NULL,
  total FLOAT NOT NULL,
  user_id INT NOT NULL DEFAULT "0",
  isDisabled BOOLEAN DEFAULT FALSE,
  FOREIGN KEY(user_id) REFERENCES users(user_id)
);

---- Tabla de Productos
CREATE TABLE products (
  product_id INT PRIMARY KEY AUTO_INCREMENT,
  product_name VARCHAR (60) NOT NULL,
  price FLOAT NOT NULL,
  product_img VARCHAR(200) NOT NULL,
  description VARCHAR(150) NOT NULL,
  disabled BOOLEAN DEFAULT FALSE
);


---- Tabla del detalle del pedido
CREATE TABLE order_detail (
  order_product_id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT,
  product_id INT,
  product_amount INT NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(order_id),
  FOREIGN KEY(product_id) REFERENCES products(product_id)
);


---- Creación de Usuarios
INSERT INTO
  users
VALUES
  (
    NULL,
    "martin",
    "Mh2020-+",
    "Martin Felipe Henriquez",
    "martinn.henriquez@gmail.com",
    321801155,
    "Crr 45 # 67 Sur - 41",
    TRUE,
    FALSE
  );

INSERT INTO
  users
VALUES
  (
    NULL,
    "sebastian",
    "sebastian",
    "sebastian",
    "sebastian@gmail.com",
    1199998888,
    "Crr 46",
    FALSE,
    FALSE
  );

INSERT INTO
  users
VALUES
  (
    NULL,
    "luis",
    "luis",
    "luis",
    "Luis@gmail.com",
    0106926593,
    "Crr 47",
    FALSE,
    FALSE
  );

-- Creación de Productos
INSERT INTO
  products
VALUES
  (
    NULL,
    "Salchipapa",
    5800,
    "https://via.placeholder.com/732",
    "Papas a la francesa con salchicha picada",
    FALSE
  );

INSERT INTO
  products
VALUES
  (
    NULL,
    "Lasagna",
    9000,
    "https://via.placeholder.com/237",
    "Viene en cubierta de quesa con pollo y carne molida",
    FALSE
  );

INSERT INTO
  products
VALUES
  (
    NULL,
    "Tostadas a la francesa",
    3265,
    "https://via.placeholder.com/200",
    "Pan tajado cubierto de huevo acompañado con quesito",
    FALSE
  );

INSERT INTO
  products
VALUES
  (
    NULL,
    "Coca cola 450ml",
    2500,
    "https://via.placeholder.com/666",
    "Botella de Coca-Cola 450ml no retornable",
    FALSE
  );


-- Creacion de Ordenes
INSERT INTO
  orders
VALUES
  (
    NULL,
    "Entregado",
    NOW(),
    "1x Lasagna, 2x Coca Cola 450",
    "Tarjeta",
    11500,
    1,
    FALSE
  ),
  (
    NULL,
    "Cancelado",
    NOW(),
    "4x Coca Cola 450",
    "Efectivo",
    10000,
    2,
    FALSE
  ),
  (
    NULL,
    "Enviando",
    NOW(),
    "2x Tostadas a la Francesa",
    "Efectivo",
    6530,
    3,
    FALSE
  ),
  (
    NULL,
    "Preparando",
    NOW(),
    "2x Lasagna",
    "Tarjeta",
    18000,
    2,
    FALSE
  ),
  (
    NULL,
    "Confirmado",
    NOW(),
    "3x Salchipapa",
    "Tarjeta",
    17400,
    1,
    FALSE
  ),
  (
    NULL,
    "Nuevo",
    NOW(),
    "1x Salchipapa, 1x Coca Cola 450",
    "Efectivo",
    8300,
    3,
    FALSE
  );


-- Creacion Detalle de los pedido
INSERT INTO
  order_detail
VALUES
  (NULL, 1, 1, 1),
  (NULL, 1, 4, 2),
  (NULL, 2, 4, 4),
  (NULL, 3, 3, 2),
  (NULL, 4, 2, 2),
  (NULL, 5, 1, 3),
  (NULL, 6, 1, 1),
  (NULL, 6, 4, 1);



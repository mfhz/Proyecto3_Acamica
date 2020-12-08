---- Creación Tabla de Usuarios
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



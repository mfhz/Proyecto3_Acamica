/* Express */
const express = require('express');
const server = express();
/* JWT */
const jwt = require('jsonwebtoken');
const signing = 'mafhz';
/* DB Connection */
const { db_host, db_name, db_user, db_password, db_port } = require("./conexion.js");
const Sequelize = require('sequelize');
const sequelize = new Sequelize(`mysql://${db_user}:${db_password}@${db_host}:${db_port}/${db_name}`);
const { QueryTypes } = require("sequelize");
/* Middleware */
const bodyParser = require('body-parser');
/* CSP Seguridad */
const helmet = require('helmet');
/* Expresiones regular */
const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const passRegexp = /^(?=.*\d)(?=.*[a-záéíóúüñ]).*[A-ZÁÉÍÓÚÜÑ].*.[!#$%&'*+/=?^_`{|}~-]/;
const userRegexp = /^(?=.*[.!#$%&'*+/=?^`{|}~-])/;
const numberRegexp = /^[0-9]*$/;
const textRegexp =  /^[a-zA-Z ]+$/;

/* Server Setup */
server.use(helmet());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));
server.listen(3000, () => {
    console.log('Servivor Inicializado');
})


const validateOrderStatus = ["Nuevo", "Confirmado", "Preparando", "Enviando", "Entregado", "Cancelado"];

// Endpoints

/**** Productos ****/

///Endpoint donde se obtiene todos los productos
server.get('/delilah/v1/products', validateToken, async (req, res) => {
    const products = await obtenerDatosBD("products", "disabled", false, true);
	res.status(200).json(products);
});

///Endpoint donde se crean productos
server.post('/delilah/v1/products', validateToken, async (req, res) => {
    const { name, price, imgUrl, description } = req.body;
    const admin = req.tokenInfo.isAdmin;
    try {
        if (admin) {
            if (name && price && imgUrl && description) {
                const sendBD = await sequelize.query(
                    'INSERT INTO products (product_name, price, product_img, description) VALUES (:name, :price, :imgUrl, :description)',
                    { replacements: {name, price, imgUrl, description}}
                );
                console.log('Producto creado correctamente', sendBD);
                res.status(200).json(sendBD);
            } else {
                res.status(400).send('Todos los campos son necesarios')
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
    } catch (error) {
        console.log('Ah ocurrido un error....' + error);
    }
});

///Endpoint para buscar productos por su ID
server.get('/delilah/v1/products/:id', validateToken, async (req, res) => {
    const productId = req.params.id;
    const searchProductId = await obtenerDatosBD('products', 'product_id', productId);
    searchProductId ? res.status(200).json(searchProductId) : res.status(404).send('El ID ingresado no existe');
});


///Endpoint donde se modifican los productos por su ID
server.put('/delilah/v1/products/:id', validateToken, async (req, res) => {
    const productId = req.params.id;
    const admin = req.tokenInfo.isAdmin;
	try {
		if (admin) {
            const productBD = await obtenerDatosBD("products", "product_id", productId);
            if (productBD) {
                const { product_name, price, product_img, description, disabled } = req.body;
                // La propiedad filterEmptyProps saca los campos nulos o indefinidos y lo que si exista lo guarda en un nuevo objeto
                const productFilter = filterProps({ product_name, price, product_img, description, disabled });
                // En esta variable se guarda el objeto de los Props filtrados, en caso de que no hayan valores por defecto traera los que tiene en la BD
                const newProduct = { ...productBD, ...productFilter };
                console.log(productFilter);
                console.log(newProduct);
                const updateBD = await sequelize.query(
                    "UPDATE products SET product_name = :name, price = :price, product_img = :imgUrl, description = :description, disabled = :disabled WHERE product_id = :id",
                    {					
                        replacements: {
                            id: productId,
                            name: newProduct.product_name,
                            price: newProduct.price,
                            imgUrl: newProduct.product_img,
                            description: newProduct.description,
                            disabled: newProduct.disabled,
                        },
                    },				
                );
                res.status(200).send(`El producto con ID ${productId} se modificó correctamente`);
            } else {
                res.status(404).send("El ID ingresado no existe");
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }		
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}

	
});


///Endpoint donde elimina los productos por su ID
server.delete("/delilah/v1/products/:id", validateToken, async (req, res) => {
    const productId = req.params.id;
    const admin = req.tokenInfo.isAdmin;
	try {
		if (admin) {
            const productBD = await obtenerDatosBD("products", "product_id", productId);
            if (productBD) {
                const updateBD = await sequelize.query("UPDATE products SET disabled = true WHERE product_id = :id", {
                    replacements: {
                        id: productId,
                    },
                });
                res.status(200).send(`El producto con ID ${productId} se eliminó correctamente`);
            } else {
                res.status(404).send("El ID ingresado no existe");
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


/**** Usuarios ****/

///Endpoint al hacer login entrega token 
server.get("/delilah/v1/users/login", async (req, res) => {
	const { username, email, password } = req.body;
	try {
        const userBD = await obtenerDatosBD("users", "user_name", username);
		const emailBD = await obtenerDatosBD("users", "mail", email);
        if ((username || email) && password) {
            if (userBD.disabled || emailBD.disabled) {
                res.status(401).send("La cuenta está deshabilitada");
            } else if (userBD.password === password) {
                const token = generateToken({
                    user: userBD.user_name,
                    id: userBD.user_id,
                    isAdmin: userBD.admin,
                    isDisabled: userBD.disabled,
                });
                res.status(200).json(token);
            } else if (emailBD.password === password) {
                const token = generateToken({
                    user: emailBD.user_name,
                    id: emailBD.user_id,
                    isAdmin: emailBD.admin,
                    isDisabled: emailBD.disabled,
                });
                res.status(200).json(token);
            } else {
                res.status(400).send("Usuario/Correo o contraseña incorrectos");
            }
        } else {
            res.status(400).send("Se debe ingresar usuario/correo y contraseña");
        }
		
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para: traer todos los usuarios registrados solo por el administrador o si es usuario normal el detalle de la cuenta.
server.get("/delilah/v1/users", validateToken, async (req, res) => {
    const admin = req.tokenInfo.isAdmin;
    // const admin = false;
    const userId = req.tokenInfo.id;
    // const userId = 2;
    try {
        let filterUser = [];
        if (admin) {
            const userBD = await obtenerDatosBD("users", true, true, true);
            filterUser = userBD.map((account) => {
                delete account.password;
                return account;
            });
        } else {
            const userBD = await obtenerDatosBD("users", "user_id", userId, true);
            filterUser = userBD.map((account) => {
                delete account.password;
                delete account.admin;
                delete account.disabled;
                return account;
            });
        }
    
        if (filterUser.length > 0) {
            res.status(200).json(filterUser);
        } else { 
            res.status(404).json("El usuario ingresado no existe");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
});
    

///Endpoint para crear usuarios
server.post("/delilah/v1/users", validarUser, validarPass, validarNames, validarAddress, validarEmail, validarPhone, async (req, res) => {
	const { username, password, email, address, fullName, phone } = req.body;	
	try {
		const userBD = await obtenerDatosBD("users", "user_name", username);
		const emailBD = await obtenerDatosBD("users", "mail", email);
		if (userBD) {
			res.status(409).json("El usuario ingresado ya existe");
			return;
		}
		if (emailBD) {
			res.status(409).json("El correo ingresado ya existe");
			return;
		}
		if ((username && password && email && address && fullName && phone)) {
			const updateBD = await sequelize.query(
				"INSERT INTO users (user_name, password, full_name, mail, phone, address) VALUES (:username, :password, :fullName, :email, :phone, :address)",
				{ replacements: { username, password, fullName, email, phone, address } }
			);
			res.status(200).json("Usuario creado correctamente");
		} else {
			res.status(400).send("Todos los campos son necesarios para registrarse");
		}
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para actualizar informacion del usuario
server.put("/delilah/v1/users", validateToken, async (req, res) => {
    const token = req.tokenInfo;
    const usernameToken = token.user;
    try {
        const userBD = await obtenerDatosBD("users", "user_name", usernameToken);
        const userId = userBD.user_id;
        if (userBD) {
            const { user_name, full_name, mail, phone, address } = req.body;
            if (user_name || mail || address || full_name || phone) {
                const existingUsername = await obtenerDatosBD("users", "user_name", user_name);
                const existingEmail = await obtenerDatosBD("users", "mail", mail);
                if (compareDataBD(token.id, existingUsername.user_id)) {
                    res.status(409).json("El usuario ya existe, porfavor intenta con otro");
                    return;
                }
                if (compareDataBD(token.id, existingEmail.user_id)) {
                    res.status(409).json("El correo ya existe, porfavor intenta con otro");
                    return;
                }
                const userFilter = filterProps({ user_name, full_name, mail, phone, address });
                const newUser = { ...userBD, ...userFilter };
                const updateBD = await sequelize.query(
                    "UPDATE users SET user_name = :user, full_name = :fullName, mail = :mail, phone = :phone, address = :address WHERE user_id = :userId",
                    {
                        replacements: {
                            user: newUser.user_name,
                            fullName: newUser.full_name,
                            mail: newUser.mail,
                            phone: newUser.phone,
                            address: newUser.address,
                            userId: userId,
                        },
                    }
                );
                res.status(200).send("Usuario actualizado correctamente");
            } else {
                res.status(400).send("Debe haber por lo menos un campo para actualizar");
            }
        } else {
            res.status(404).json("El usuario ingresado no existe");
        }
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
});
    

///Endpoint para colocar el usuario actual deshabilitado
server.delete("/delilah/v1/users", validateToken, async (req, res) => {	
    try {
        const token = req.tokenInfo;
        const userId = token.id;
        const updateBD = await sequelize.query(`UPDATE users SET disabled = true WHERE user_id = :userId`, {
            replacements: {
                userId: userId,
            },
        });
        res.status(200).json("La cuenta se actualizó a estado deshabilitada");
    } catch (error) {
        res.status(500).send("Ah ocurrido un error...." + error);
    }
});
  

///Endpoint para buscar usuarios en especifico (Solo Administrador)
server.get("/delilah/v1/users/:username", validateToken, async (req, res) => {
    const token = req.tokenInfo;
	const username = req.params.username;
	try {
		if (token.isAdmin) {
            const userBD = await obtenerDatosBD("users", "user_name", username);
		    if (userBD) {
		    	res.status(200).json(userBD);
		    } else {
		    	res.status(404).json("El usuario ingresado no existe");
		    }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para actualizar usuario en especifico (Solo Administrador)
server.put("/delilah/v1/users/:username", validateToken, async (req, res) => {
    const usernameBody = req.params.username;
    const token = req.tokenInfo;
	try {
        if (token.isAdmin) {
            const { user_name, password, full_name, mail, phone, address, disabled } = req.body;
            if (user_name || password || mail || address || full_name || phone || disabled) {
                const userBD = await obtenerDatosBD("users", "user_name", usernameBody);
                const userId = userBD.user_id;
                console.log(userBD);
                if (!userBD) {
                    res.status(404).json("El usuario ingresado no existe");
                    return;
                }
                const existingUsername = await obtenerDatosBD("users", "user_name", user_name, true);
                const existingEmail = await obtenerDatosBD("users", "mail", mail, true);
                const repeatedUsername = existingUsername && existingUsername.map((user) => compareDataBD(userId, userBD.user_id));
                const repeatedEmail = existingEmail && existingEmail.map((user) => compareDataBD(userId, userBD.user_id));
                if (repeatedUsername && repeatedUsername.some((value) => value === true)) {
                    res.status(409).json("El usuario ya existe, porfavor intenta con otro");
                    return;
                }
                if (repeatedEmail && repeatedEmail.some((value) => value === true)) {
                    res.status(409).json("El correo ya existe, porfavor intenta con otro");
                    return;
                }
                const userFilter = filterProps({ user_name, password, full_name, mail, phone, address, disabled });
                const newUser = { ...userBD, ...userFilter };
                const update = await sequelize.query(
                    `UPDATE users SET user_name = :user, password = :pass, full_name = :fullname, mail = :mail, phone = :phone, address = :deliveryAddress, disabled = :disabled WHERE user_id = :userId`,
                    {
                        replacements: {
                            user: newUser.user_name,
                            pass: newUser.password,
                            fullname: newUser.full_name,
                            mail: newUser.mail,
                            phone: newUser.phone,
                            deliveryAddress: newUser.address,
                            userId: userId,
                            disabled: newUser.disabled,
                        },
                    }
                );
                res.status(200).send(`El usuario ${userBD.user_name} fue actualizado correctamente`);
            } else {
                res.status(400).send("Debe haber por lo menos un campo para actualizar");
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para colocar cualquier usuario deshabilitado
server.delete("/delilah/v1/users/:username", validateToken, async (req, res) => {
    const usernameBody = req.params.username;
    const token = req.tokenInfo;
	try {
		if (token.isAdmin) {
            const userBD = await obtenerDatosBD("users", "user_name", usernameBody);
            const userId = userBD.user_id;
            if (!userBD) {
                res.status(404).json("El usuario ingresado no existe");
                return;
            }
            const update = await sequelize.query("UPDATE users SET disabled = true WHERE user_id = :userId", {
                replacements: {
                    userId: userId,
                },
            });
            res.status(200).send(`El usuario ${userBD.user_name} se encuentra deshabilitado`);
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


/**** Pedidos ****/

///Endpoint donde trae las ordenes (Si es admin muestra todas las ordenes, si es usuario normal traer las ordenes que el mismo pidió)
server.get("/delilah/v1/orders", validateToken, async (req, res) => {
	try {
		let orders = [];
		if (req.tokenInfo.isAdmin) {
			orders = await sequelize.query(
				"SELECT * FROM orders INNER JOIN users ON orders.user_id = users.user_id ORDER BY date DESC;",
				{
					type: QueryTypes.SELECT,
				}
			);
		} else {
			const userID = req.tokenInfo.id;
			orders = await sequelize.query(
				"SELECT * FROM orders INNER JOIN users ON orders.user_id = users.user_id WHERE users.user_id = :id ORDER BY date DESC;",
				{
					replacements: { id: userID },
					type: QueryTypes.SELECT,
				}
			);
        }
        // Promesa donde por cada pedido se coloca el detalle del mismo generando un nuevo atributo mostrando el producto de ese pedido con su cantidad
		const currentOrders = await Promise.all(            
			orders.map(async (order) => {
				const orderDetail = await sequelize.query(
					"SELECT * FROM order_detail INNER JOIN products WHERE order_id = :id AND order_detail.product_id = products.product_id",
					{
						replacements: { id: order.order_id },
						type: QueryTypes.SELECT,
					}
                );
                order.orderDetail = orderDetail;
				return order;
			})
        );
		if (currentOrders.length > 0) {
			const orderFilter = orders.map((user) => {
				delete user.password;
				delete user.admin;
				delete user.disabled;
				return user;
			});
			res.status(200).json(orderFilter);
		} else {
			res.status(404).send("No se encuentran pedidos en estos momentos");
		}
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para crear las ordenes
server.post("/delilah/v1/orders", validateToken, async (req, res) => {
	const userId = req.tokenInfo.id;
    const { data, paymentMethod } = req.body;
    console.log(data);
    console.log(paymentMethod);
	try {
		if (data && paymentMethod) {
            const getOrderDetails = await Promise.all(
                data.map((product) => obtenerDatosBD("products", "product_id", product.product_id))                
            );
            console.log(getOrderDetails);
            if (getOrderDetails.some((product) => product.disabled)) {
                res.status(403).json("En estos momentos no hay disponible este producto");
            } else if (getOrderDetails.every((product) => !!product === true)) {
                const orderData = async () => {
                    let total = 0;
                    let description = "";
                    getOrderDetails.forEach((product, index) => {
                        console.log(product);
                        console.log(index);
                        total += product.price * data[index].amount;
                        description += `${data[index].amount}x ${product.product_name}, `;
                        console.log(total);
                        console.log(description);
                    });                
                    description = description.substring(0, description.length - 2);
                    return [total, description];
                };
                const [total, description] = await orderData();
                console.log([total, description]);
                const order = await sequelize.query(
                    "INSERT INTO orders (status, date, description, payment_method, total, user_id) VALUES (:status, :date, :description, :paymentMethod, :total, :userId)",
                    { replacements: { status: "Nuevo", date: new Date(), description, paymentMethod, total, userId } }
                );
                console.log(order);
                data.forEach(async (product) => {
                    const order_products = await sequelize.query(
                        "INSERT INTO order_detail (order_id, product_id, product_amount) VALUES (:orderID, :productID, :productAmount)",
                        { replacements: { orderID: order[0], productID: product.product_id, productAmount: product.amount } }
                    );
                });
                console.log(`La orden ${order[0]} fue creada`);
                res.status(200).json("La orden ha sido generada correctamente");
            } else {
                res.status(400).send("Los datos ingresados nos son válidos");
            }
        } else {
            res.status(400).send("Se debe especificar que producto y cantidad se va a adquirir");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para buscar pedidos por su ID
server.get("/delilah/v1/orders/:id", validateToken, async (req, res) => {
    const orderID = req.params.id;
    const admin = req.tokenInfo.isAdmin;
	try {
		if (admin) {
            const order = await sequelize.query(
                "SELECT * FROM orders INNER JOIN users ON orders.user_id = users.user_id WHERE orders.order_id = :id;",
                {
                    replacements: { id: orderID },
                    type: QueryTypes.SELECT,
                }
            );
            console.log(order);
            if (order.length > 0) {
                order[0].orderDetail = await sequelize.query(
                    "SELECT * FROM order_detail INNER JOIN products WHERE order_id = :id AND order_detail.product_id = products.product_id",
                    {
                        replacements: { id: order[0].order_id },
                        type: QueryTypes.SELECT,
                    }
                );
                delete order[0].password;
                delete order[0].admin;
                delete order[0].disabled;
                res.status(200).json(order);
            } else {
                res.status(404).send(`El pedido ingresado con ID ${orderID} no existe`);
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para actualizar los estados de las ordenes
server.put("/delilah/v1/orders/:id", validateToken, async (req, res) => {
    const orderID = req.params.id;
    const admin = req.tokenInfo.isAdmin;
	const { orderStatus } = req.body;
	try {
		if (admin) {
            const order = await sequelize.query("SELECT * FROM orders WHERE order_id = :id;", {
                replacements: { id: orderID },
                type: QueryTypes.SELECT,
            });
            if (order.length > 0) {
                if (validateOrderStatus.includes(orderStatus)) {
                    const update = await sequelize.query("UPDATE orders SET status = :status WHERE order_id = :id", {
                        replacements: {
                            id: orderID,
                            status: orderStatus,
                        },
                    });
                    res.status(200).send(`La orden con ID ${orderID} fue actualizada correctamente`);
                } else {
                    res.status(403).send("El estado que ingresaste no existe");
                }
            } else {
                res.status(404).send(`La orden con ID ${orderID} no existe`);
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


///Endpoint para deshabilitar un pedido en especifico
server.delete("/delilah/v1/orders/:id", validateToken, async (req, res) => {
    const orderID = req.params.id;
    const admin = req.tokenInfo.isAdmin;
	try {
		if (admin) {
            const orderBD = await obtenerDatosBD("orders", "order_id", orderID);
            if (orderBD) {
                const update = await sequelize.query("UPDATE orders SET isDisabled = true WHERE order_id = :order_id", {
                    replacements: {
                        order_id: orderID,
                    },
                });
                res.status(200).send(`La orden con ID ${orderID} se deshabilitó correctamente`);
            } else {
                res.status(404).send(`La orden con ID ${orderID} no existe`);
            }
        } else {
            res.status(401).json("Acceso denegado, la cuenta debe ser administrador");
        }
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}
});


// Middlewares & Functions

/**** Función donde consula a la BD ****/
async function obtenerDatosBD(tabla, tablaParametros = 'TRUE', input = 'TRUE', completo = false) {
	const results = await sequelize.query(`SELECT * FROM ${tabla} WHERE ${tablaParametros} = :replacementParam`, {
		replacements: { replacementParam: input },
		type: QueryTypes.SELECT,
    });
	return results.length > 0 ? (completo ? results :  results[0]) : false;
}

/**** Funcion donde verifica si un objeto tiene campos nulos o indefinidos y los que tienen valor los guarda en un nuevo objeto****/
function filterProps(obj) {
    Object.keys(obj).forEach((key) => !obj[key] && delete obj[key]);
	return obj;
}

/**** Función donde se genera el Token ****/
function generateToken(data) {
	return jwt.sign(data, signing, { expiresIn: "50m" });
}

/**** Función donde verifica si el usuario o correo ingresado ya existe en la BD ****/
function compareDataBD(token, body) {
	if (body && token === body) {
		console.log("El usuario o correo ya se encuentran en uso");
		return true;
	} else {
		return false;
	}
}

/**** Función para validar la firma del Token ****/
async function validateToken(req, res, next) {
	const tokenData = req.headers.authorization.split(" ")[1];
	try {
		const verification = jwt.verify(tokenData, signing);
		console.log('TOKEN')
		console.log(verification);
		const userBD = await obtenerDatosBD("users", "user_id", verification.id);
        const isDisabled = userBD.disabled;
		if (isDisabled) {
			res.status(401).send("Acceso denegado, la cuenta está deshabilitada");
		} else {
			req.tokenInfo = verification;
			next();
		}
	} catch (e) {
		res.status(401).json("El token es invalido");
	}
}


/**** Validación de Registro ****/

/// Valida varios parametros para el nombre del usuario al registrarse.
function validarUser(req, res, next) {
    // console.log(req.body);
    const i = usuarios.findIndex(c => {
        return c.usuario == req.body.user;
    });
    // console.log(!req.body.nombre);
    if (!req.body.user || req.body.user == '') {
        // console.log('El campo de usuario es obligatorio para registrarse');
        res.status(400).send('El campo de usuario no puede estar vacio y es obligatorio para registrarse');
    } else if (req.body.user.length < 5) {
        // console.log('Se requiere cinco o mas caracteres para el usuario');
        res.status(400).send('Se requiere cinco o mas caracteres para el usuario');
    } else if (userRegexp.test(req.body.user)) {
        res.status(400).send('El nombre de usuario solo puede contener el caracter especial “_“');
    } else if (req.body.user.length > 0) {
        let espacios = false;
        let cont = 0;
        for (let i = 0; i < req.body.user.length; i++) {
            if (req.body.user.charAt(cont) == " ")
                espacios = true;
                cont++;            
        }
        if (espacios) {
            res.status(400).send('El nombre de usuario no puede contener espacios en blanco');
        } else {
            next();
        }
    }
    
}

/// Valida el nombre ingresado
function validarNames(req, res, next) {
    if (!req.body.names || req.body.names == '') {
        res.status(400).send('El campo de nombres no puede estar vacío');
    } else if (!textRegexp.test(req.body.names)) {
        res.status(400).send('El campo de nombres no debe contener ningún dígito numérico ni caracter especial');                   
    } else {
        next();
    }   
}

/// Valida varios parametros para la contraseñña al registrarse.
function validarPass(req, res, next) {

    if (!req.body.password || req.body.password == '') {
        res.status(400).send('La contraseña no puede estar vacia y es un campo obligatorio para registrarse');
    } else if(req.body.password.length < 8) {
        res.status(400).send('La contraseña debe contener mínimo 8 caracteres');
    } else if (!passRegexp.test(req.body.password)) {
        res.status(400).send('La contraseña debe contener mayúsculas, minúsculas, al menos un dígito y un caracter especial');
    } else if (req.body.password.length > 0) {
        let espacios = false;
        let cont = 0;
        for (let i = 0; i < req.body.password.length; i++) {
            if (req.body.password.charAt(cont) == " ")
                espacios = true;
                cont++;            
        }
        if (espacios) {
            res.status(400).send('La contraseña no puede contener espacios en blanco');
        } else {
            next();
        }       
    }
}

/// Valida el correo al registrarse.
function validarEmail(req, res, next) {
    // console.log(req.body.correo);
    if (!req.body.email || req.body.email == '') {        
        res.status(400).send('El correo no puede estar vacio y es un campo obligatorio para registrarse');
    }else if (emailRegexp.test(req.body.email)) {
        return next();
    } else {
        res.status(400).send('El correo ingresado es incorrecto');
    }
}

// Valida campo numérico 
function validarPhone(req, res, next) {
    let number = req.body.phone.toString();
    if (!req.body.phone || req.body.phone == '') {
        res.status(400).send('El número telefónico no puede estar vacío');
    } else if (!numberRegexp.test(req.body.phone)) {
        res.status(400).send('El campo solo debe ser numérico');
    } else if (number.length != 10) {
        res.status(400).send('El número ingresado debe contener 10 dígitos');
    } else {
        next();
    }
}

//Validar campo de dirección
function validarAddress(req, res, next) {
    if (!req.body.address || req.body.address == '') {
        res.status(400).send('El campo de dirección es obligatorio');
    } else {
        next();       
    }
}



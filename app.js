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


// Endpoints

/**** Productos ****/
///Endpoint donde se obtiene todos los productos
server.get('/delilah/v1/products', async (req, res) => {
    const products = await obtenerDatosBD("products", "disabled", false, true);
	res.status(200).json(products);
});

///Endpoint donde se crean productos
server.post('/delilah/v1/products', async (req, res) => {
    const { name, price, imgUrl, description } = req.body;
    try {
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
    } catch (error) {
        console.log('Ah ocurrido un error....' + error);
    }
});

///Endpoint para buscar productos por su ID
server.get('/delilah/v1/products/:id', async (req, res) => {
    const productId = req.params.id;
    const searchProductId = await obtenerDatosBD('products', 'product_id', productId);
    searchProductId ? res.status(200).json(searchProductId) : res.status(404).send('El ID ingresado no existe');
});


///Endpoint donde se modifican los productos por su ID
server.put('/delilah/v1/products/:id', async (req, res) => {
    console.log('PUT');
    const productId = req.params.id;
	try {
		// const productFound = await getByParam("products", "productID", productId);
		const productBD = await obtenerDatosBD("products", "product_id", productId);
		if (productBD) {
			const { name, price, imgUrl, description, disabled } = req.body;
			// La propiedad filterEmptyProps saca los campos nulos o indefinidos y lo que si exista lo guarda en un nuevo objeto
			const productFilter = filterProps({ name, price, imgUrl, description, disabled });
			console.log(productFilter);
			// En esta variable se guarda el objeto de los Props filtrados, en caso de que no hayan valores por defecto traera los que tiene en la BD
			const newProduct = { ...productBD, ...productFilter };
			console.log('ACA');
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
	} catch (error) {
		res.status(500).send("Ah ocurrido un error...." + error);
	}

	
});


/// Endpoint donde elimina los productos por su ID
server.delete("/delilah/v1/products/:id", async (req, res) => {
	const productId = req.params.id;
	try {
		const productBD = await obtenerDatosBD("products", "product_id", productId);
		if (productBD) {
			const updateBD = await sequelize.query("UPDATE products SET disabled = true WHERE product_id = :id", {
				replacements: {
					id: productId,
				},
			});
			res.status(200).send(`El producto con ID ${productId} se eliminó correctamente`);
		}
	} catch (error) {
		res.status(404).send("El ID ingresado no existe");
	}
});












server.post('/register', validarUser, validarNames, validarEmail, validarPhone, validarAddress, validarPass,  (req, res) => {
    // console.log('ENTRO REGISTRO');
    res.status(200).json({mje: "Registro Exitoso", status: 200});
    
})

server.post('/login', (req, res) => {
    res.status(200).json({status: '200', user: `${req.body.user}`});
})



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
function filterProps(object) {
    Object.keys(object).forEach((key) => !object[key] && delete object[key]);
	return object;
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



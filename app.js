const express = require('express');
const server = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// const sequelize = require('./conexion.js');
const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const nameRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const passRegexp = /^(?=.*\d)(?=.*[a-záéíóúüñ]).*[A-ZÁÉÍÓÚÜÑ]/;

let usuarios = [{'usuario': 'prueba', 'correo': 'prueba@prueba.com', 'contrasenia': 'prueba123456', 'nombre': 'Juan'}];

server.use(helmet());
server.listen(3000, () => {
    console.log('Servivor Inicializado');
})
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

const limite = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10
})


server.post('/register', validarUser, validarPass, (req, res) => {
    // console.log('ENTRO REGISTRO');
    res.status(200).send('Usuario creado con éxito!');
})




// Middlewares Functions
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
        res.status(400).send('La contraseña debe contener mayúsculas minúsculas y al menos un dígito');
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

// function validarCorreo(req, res, next) {
//     // console.log(req.body.correo);
//     if (emailRegexp.test(req.body.email)) {        
//         return next();
//     } else {
//         res.status(200).json('El correo ingresado es incorrecto');
//     }
// }




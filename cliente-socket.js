const net = require('net');

// CAMBIA ESTA IP POR LA IP PÚBLICA ACTUAL DE TU AWS
const IP_AWS = '3.86.254.66'; 
const PUERTO = 6061;

const cliente = new net.Socket();

cliente.connect(PUERTO, IP_AWS, () => {
    console.log('Conectado al Socket TCP en AWS...');
    
    // 1. Probamos insertar un elemento
    const elemento = JSON.stringify({ nombre: "Estudiante Socket", rol_id: 1 });
    const comandoInsert = `{insert:${elemento}}`;
    console.log(`Enviando: ${comandoInsert}`);
    cliente.write(comandoInsert);
    
    // 2. Esperamos un segundo para que se guarde, y probamos el get
    setTimeout(() => {
        const comandoGet = '{get:1}'; // Obteniendo el usuario 1
        console.log(`Enviando: ${comandoGet}`);
        cliente.write(comandoGet);
    }, 1000);
});

cliente.on('data', (data) => {
    console.log('AWS responde: ' + data.toString());
});
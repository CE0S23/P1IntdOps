const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY, nombre TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY, nombre TEXT, rol_id INTEGER, FOREIGN KEY(rol_id) REFERENCES roles(id))");
});


const sendResponse = (res, statusCode, data) => {
    res.status(statusCode).json({ statusCode, data });
};

app.get('/usuarios', (req, res) => {
    db.all("SELECT * FROM usuarios", [], (err, rows) => {
        if (err) return sendResponse(res, 500, err.message);
        sendResponse(res, 200, rows);
    });
});

app.post('/usuarios', (req, res) => {
    const { nombre, rol_id } = req.body;
    db.run("INSERT INTO usuarios (nombre, rol_id) VALUES (?, ?)", [nombre, rol_id], function(err) {
        if (err) return sendResponse(res, 500, err.message);
        sendResponse(res, 201, { id: this.lastID, nombre, rol_id });
    });
});


app.delete('/usuarios/:id', (req, res) => {
    db.run("DELETE FROM usuarios WHERE id = ?", req.params.id, function(err) {
        if (err) return sendResponse(res, 500, err.message);
        sendResponse(res, 200, { eliminados: this.changes });
    });
});

app.get('/backup', (req, res) => {
    const backupPath = path.resolve(__dirname, `backup_${Date.now()}.sqlite`);
    fs.copyFile(dbPath, backupPath, (err) => {
        if (err) return sendResponse(res, 500, "Error al respaldar la base de datos");
        sendResponse(res, 200, { mensaje: "Respaldo exitoso", archivo: backupPath });
    });
});

// 10. Endpoint para Vaciar la BD
app.delete('/vaciar', (req, res) => {
    db.serialize(() => {
        db.run("DELETE FROM usuarios");
        db.run("DELETE FROM roles", (err) => {
            if (err) return sendResponse(res, 500, err.message);
            sendResponse(res, 200, { mensaje: "Base de datos vaciada correctamente" });
        });
    });
});

// --- MEJORA: SERVIDOR SOCKET TCP ---
const net = require('net');

const tcpServer = net.createServer((socket) => {
    socket.on('data', (data) => {
        const comando = data.toString().trim();
        
        // 1. Lógica para {insert:<element>}
        if (comando.startsWith('{insert:') && comando.endsWith('}')) {
            // Extrae el JSON que viene dentro del formato
            const elementoJson = comando.substring(8, comando.length - 1);
            try {
                const { nombre, rol_id } = JSON.parse(elementoJson);
                db.run("INSERT INTO usuarios (nombre, rol_id) VALUES (?, ?)", [nombre, rol_id], function(err) {
                    if (err) socket.write(`Error DB: ${err.message}\n`);
                    else socket.write(`Usuario insertado via Socket con ID: ${this.lastID}\n`);
                });
            } catch (error) {
                socket.write("Error: Formato JSON inválido.\n");
            }
        } 
        // 2. Lógica para {get:<element>}
        else if (comando.startsWith('{get:') && comando.endsWith('}')) {
            // Extrae el ID solicitado
            const id = comando.substring(5, comando.length - 1);
            db.get("SELECT * FROM usuarios WHERE id = ?", [id], (err, row) => {
                if (err) socket.write(`Error DB: ${err.message}\n`);
                else if (row) socket.write(JSON.stringify(row) + '\n');
                else socket.write("Usuario no encontrado\n");
            });
        } else {
            socket.write("Comando de socket no reconocido\n");
        }
    });
});

// Encendemos los servidores y los guardamos en variables
const server = app.listen(80, () => {
    console.log('Servidor backend ejecutándose en el puerto 80');
});

const tcp = tcpServer.listen(6061, () => {
    console.log('Servidor Socket TCP ejecutándose en el puerto 6061');
});

// Exportamos todo para que Jest pueda probarlo y apagarlo
module.exports = { app, server, tcp };

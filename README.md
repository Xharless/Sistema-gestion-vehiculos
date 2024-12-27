
Cosas echas y consideraciones
--
1. Conexion a sqlite3 y creacion de solicitud para agregar el vehiculo
2. Edicion de fechas 
3. Para empaquetar la aplicación, hay que hacer: 
        npx electron-packager . SGV --platform=win32 --arch=x64
4. Para que la BD se cree, debemos ejecutar node database.js para que se creen las tablas
5. Se actualizo el "package.js" para que al momento de hacer npm run build se cree un ejecutable que se instalará en el disco
6. Se entrega el ejecutable al usuario para que sea instalado en su PC, de esta forma, se instalará en le disco creando un acceso directo 
# SSH Connection Manager

Una aplicación de escritorio elegante para gestionar, guardar y conectar a servidores mediante SSH, desarrollada con Electron.

## Características

- **Gestión de perfiles SSH**: Crea, edita y elimina perfiles de conexión.
- **Favoritos**: Marca tus conexiones más utilizadas para un acceso rápido.
- **Terminal integrada**: Interactúa con tu servidor directamente desde la aplicación.
- **Autenticación flexible**: Soporta autenticación por contraseña y archivo de clave privada.
- **Interfaz moderna**: Diseño limpio e intuitivo para una experiencia de usuario óptima.

## Instalación

### Prerrequisitos

- Node.js
- npm o yarn

### Pasos de instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/cmurestudillos/ssh-manager.git
   cd ssh-manager
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o con yarn
   yarn install
   ```

3. Inicia la aplicación:
   ```bash
   npm start
   # o con yarn
   yarn start
   ```

## Uso

### Crear un nuevo perfil

1. Haz clic en el botón "Nueva Conexión".
2. Completa los campos requeridos (Nombre, Host, Puerto, Usuario).
3. Selecciona el tipo de autenticación:
   - **Contraseña**: Introduce la contraseña del servidor.
   - **Archivo de Clave**: Selecciona un archivo de clave privada.
4. Haz clic en "Guardar".

### Conectar a un servidor

1. Selecciona un perfil de la lista.
2. Haz clic en el botón "Conectar".
3. Una vez establecida la conexión, haz clic en "Abrir Terminal".
4. Interactúa con el servidor mediante la terminal integrada.

### Gestionar favoritos

- Haz clic en el ícono de corazón junto a cualquier perfil para marcarlo como favorito.
- Utiliza la pestaña "Favoritos" para ver solo los perfiles marcados.

## Tecnologías utilizadas

- [Electron](https://www.electronjs.org/): Framework para crear aplicaciones de escritorio con tecnologías web.
- [SSH2](https://github.com/mscdex/ssh2): Cliente SSH2 para Node.js.
- [Xterm.js](https://xtermjs.org/): Terminal para navegadores y aplicaciones web.

## Características de la terminal

- Ajuste de tamaño de fuente
- Limpieza de pantalla
- Redimensionamiento automático
- Soporte para comandos y secuencias de escape ANSI

## Desarrollo

### Estructura del proyecto

```
ssh-manager/
├── main.js                # Proceso principal de Electron
├── preload.js             # Script de precarga para comunicación segura
├── renderer.js            # Lógica de la interfaz de usuario
├── index.html             # Interfaz principal
├── styles.css             # Estilos CSS
└── package.json           # Dependencias y scripts
```

### Construir para producción

```bash
# Para Windows
npm run package:win

# Para macOS
npm run package:mac

# Para Linux
npm run package:linux
```

## Contribuir

1. Haz un fork del proyecto
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Realiza tus cambios (`git commit -m 'Add some amazing feature'`)
4. Sube los cambios a tu rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
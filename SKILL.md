# Skill: Ejecutar "npm run dev"

## Descripción

Esta skill guía al usuario para ejecutar el comando `npm run dev` en el contexto de un proyecto Node.js, asegurando que el entorno de desarrollo se inicie correctamente. Incluye pasos para verificar dependencias, resolver errores comunes y validar que el servidor está corriendo.

## Pasos del workflow

1. **Verificar dependencias**: Comprobar si la carpeta `node_modules` existe. Si no, ejecutar `npm install`.
2. **Ejecutar el comando**: Correr `npm run dev` en la raíz del proyecto.
3. **Monitorear la salida**: Revisar la terminal para mensajes de éxito o errores.
4. **Resolver errores comunes**:
   - Si falta un script `dev` en `package.json`, sugerir agregarlo o consultar la documentación del proyecto.
   - Si hay errores de dependencias, sugerir reinstalar (`npm install`) o borrar `node_modules` y `package-lock.json` y reinstalar.
5. **Validar ejecución**: Confirmar que el servidor está corriendo (por ejemplo, mensaje "Server running" o URL local activa).

## Criterios de finalización

- El servidor de desarrollo debe estar corriendo sin errores críticos.
- El usuario debe ver la URL local para acceder a la app.

## Ejemplo de prompts

- "Inicia el entorno de desarrollo con npm run dev"
- "¿Cómo soluciono errores al correr npm run dev?"
- "¿Por qué no arranca mi servidor con npm run dev?"

## Personalización sugerida

- Skill para automatizar la limpieza de dependencias (`npm ci` o borrado de `node_modules`).
- Skill para verificar y crear scripts en `package.json`.

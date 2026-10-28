# Mapa de Siniestros Viales – CABA 2025

PoC de datos georreferenciados · ISFT N° 199 · Tecnicatura Superior en Logística
Grupo: **Ayala Debora · Cabrera Martín · Sorrenti Pablo**

Recorrido: **Dataset → Supabase → React/Vite → deck.gl → Vercel**

**Pregunta que responde:** ¿Dónde se producen los siniestros viales en la Ciudad de Buenos Aires y qué tan graves son?

## Dataset

- **Fuente original:** [Buenos Aires Data – Víctimas de siniestros viales](https://data.buenosaires.gob.ar/dataset/victimas-siniestros-viales) (Observatorio de Movilidad y Seguridad Vial, GCBA), tabla HECHOS 2019–2025.
- **Copia utilizada:** el mismo archivo publicado en el repositorio [carlosdatasc/An-lisis_siniestros_viales](https://github.com/carlosdatasc/An-lisis_siniestros_viales) (`siniestros_viales_hechos.xlsx`), porque el portal no permitía la descarga directa.
- **Recorte:** muestra estratificada de **100 siniestros de 2025** con coordenadas y dirección: **30 mortales, 30 graves y 40 leves**, elegidos al azar dentro de cada grupo (semilla fija, siempre da el mismo resultado).
- ⚠️ **Las proporciones no son las reales:** en 2025 hubo 11.752 siniestros, de los cuales el 93,4% fue leve, el 5,8% grave y el 0,8% mortal. Se sobrerrepresentaron los graves y mortales para que los tres niveles se vean en el mapa.
- **Campos:** `nombre` = dirección · `categoria` = gravedad (Mortal / Grave / Leve) · `valor` = cantidad de víctimas · `fecha` · `comuna` · `descripcion` = participantes, tipo de vía y hora.
- El script `scripts/preparar_dataset.py` muestra exactamente cómo se generó `puntos.csv` a partir del Excel original.

---

## Qué hace la aplicación

- **4 indicadores** calculados con los datos de Supabase: siniestros registrados, víctimas en total, siniestros mortales y comuna con mayor concentración.
- **Mapa interactivo (deck.gl)** con zoom y desplazamiento.
- **ScatterplotLayer:** un punto por siniestro. El color indica la gravedad (rojo mortal, naranja grave, amarillo leve) y el tamaño, la cantidad de víctimas.
- **HeatmapLayer (desafío adicional, nivel 2):** mapa de calor de concentración. Se elige con los botones *Puntos / Mapa de calor / Ambos*.
- **Tooltip:** al pasar el mouse sobre un punto se ve dirección, gravedad, víctimas, fecha, comuna, participantes, tipo de vía y hora.

## Estructura

```
mapa-siniestros/
├── supabase/
│   ├── 01_crear_tabla.sql   ← crea la tabla "puntos" y el permiso de lectura
│   └── puntos.csv           ← dataset para importar (100 registros)
├── scripts/
│   └── preparar_dataset.py  ← cómo se armó puntos.csv desde el Excel oficial
├── src/
│   ├── App.jsx              ← indicadores, mapa, capas y tooltip
│   ├── supabaseClient.js    ← conexión a Supabase
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
└── .env.example             ← nombres de las variables de entorno
```

---

# Guía paso a paso (sin instalar nada en la compu)

Todo se hace desde el navegador. Calculen unos 45 minutos.

## Paso 1 – Crear las cuentas (una sola persona del grupo)

1. **GitHub:** entrar a https://github.com y crear una cuenta (*Sign up*).
2. **Supabase:** entrar a https://supabase.com → *Start your project* → *Continue with GitHub*.
3. **Vercel:** entrar a https://vercel.com → *Sign Up* → plan **Hobby** (gratis) → *Continue with GitHub*.

Iniciar sesión con GitHub en los tres sitios simplifica todo lo que sigue.

## Paso 2 – Crear la base de datos en Supabase

1. En Supabase: **New project**. Nombre: `mapa-siniestros`. Inventar una contraseña de base de datos (guardarla) y elegir la región **South America (São Paulo)**. Crear y esperar 1 o 2 minutos.
2. Menú izquierdo → **SQL Editor** → *New query*. Copiar todo el contenido de `supabase/01_crear_tabla.sql`, pegarlo y apretar **Run**. Debe decir *Success*.
3. Cargar los datos. Lo más simple: otra vez **SQL Editor** → *New query*, pegar todo `supabase/02_insertar_datos.sql` y apretar **Run**. Al final debe mostrar `registros_cargados = 100`.
   *(Alternativa: **Table Editor** → tabla **puntos** → **Insert** → **Import data from CSV** y subir `supabase/puntos.csv`.)*
4. Verificar que la tabla muestre **100 registros** con latitud, longitud, categoría y valor completos.

## Paso 3 – Copiar las claves de Supabase

En **Project Settings** (ícono de engranaje) → sección **API** (o **Data API / API Keys**, según la versión) copiar en un bloc de notas:

- **Project URL** → algo como `https://abcdxyz.supabase.co`
- **Clave pública** → la que se llama `anon` / `public` o `publishable`.

⚠️ **Nunca** usar la clave `service_role` / `secret`: esa da acceso total a la base.

## Paso 4 – Subir el código a GitHub

1. Descomprimir el `.zip` del proyecto en la compu.
2. En GitHub: botón **+** (arriba a la derecha) → **New repository**. Nombre: `mapa-siniestros`, **Public**, y *Create repository*.
3. En la página del repositorio vacío, hacer clic en **uploading an existing file**.
4. Abrir la carpeta `mapa-siniestros` descomprimida, seleccionar **todo su contenido** (no la carpeta en sí) y arrastrarlo a la página. Esperar que suban todos los archivos y apretar **Commit changes**.
5. Comprobar que en la raíz del repositorio se vean `package.json`, `index.html` y las carpetas `src` y `supabase`.

## Paso 5 – Publicar en Vercel

1. En Vercel: **Add New… → Project** → buscar el repositorio `mapa-siniestros` → **Import**.
2. *Framework Preset* debe decir **Vite** (lo detecta solo). No cambiar nada más.
3. Abrir **Environment Variables** y cargar estas dos (copiar los nombres exactos):

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | la Project URL del paso 3 |
   | `VITE_SUPABASE_ANON_KEY` | la clave pública del paso 3 |

4. Apretar **Deploy** y esperar 1 o 2 minutos.
5. Al terminar, Vercel muestra la URL pública (por ejemplo `https://mapa-siniestros.vercel.app`). Abrirla también desde el celular para comprobarla.

## Paso 6 – Armar la entrega

1. URL pública de Vercel.
2. Captura de pantalla del tablero (con el mapa y los indicadores visibles).
3. Link del repositorio de GitHub.
4. Dataset utilizado: `supabase/puntos.csv`.
5. Breve descripción (ver `DESCRIPCION_ENTREGA.md`).

---

## Si algo no funciona

| Qué pasa | Causa probable | Solución |
|---|---|---|
| Mensaje "Falta configurar VITE_SUPABASE_URL…" | Faltan las variables en Vercel | Cargarlas (paso 5.3) y luego *Deployments → ⋯ → Redeploy* |
| Indicadores en 0 y mapa vacío | Falta el permiso de lectura o la tabla está vacía | Volver a ejecutar `01_crear_tabla.sql` y revisar el Table Editor |
| "Supabase respondió con un error" | URL o clave mal copiadas | Revisar que no tengan espacios y redeployar |
| Los puntos aparecen en el océano | Latitud y longitud invertidas | En Buenos Aires la latitud es ≈ −34,6 y la longitud ≈ −58,4 |
| Vercel falla al construir | No se subieron todos los archivos | Confirmar que `package.json` esté en la raíz del repo |

Para revisar los datos que llegan (Etapa 4 del TP): en la página publicada, tecla **F12** → pestaña **Console** → aparece `Datos recibidos desde Supabase: [...]`.

## (Opcional) Correrlo en la compu

Requiere instalar Node.js desde https://nodejs.org. Luego, en la carpeta del proyecto:

```bash
cp .env.example .env    # y completar los dos valores
npm install
npm run dev             # abre http://localhost:5173
```

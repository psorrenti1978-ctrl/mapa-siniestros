import { useEffect, useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl/maplibre';
import { supabase, supabaseConfigurado } from './supabaseClient';

// Mapa base gratuito (CARTO), no necesita registro ni token.
const MAPA_BASE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// Vista inicial centrada en la Ciudad de Buenos Aires.
const VISTA_INICIAL = {
  longitude: -58.445,
  latitude: -34.615,
  zoom: 11.2,
  pitch: 0,
  bearing: 0,
};

// Color de cada punto según la gravedad del siniestro [R, G, B].
const COLORES = {
  Mortal: [200, 30, 45],
  Grave: [240, 130, 20],
  Leve: [230, 190, 40],
};

function grupoCategoria(categoria) {
  return COLORES[categoria] ? categoria : 'Leve';
}

function formatoFecha(fecha) {
  if (!fecha) return 'Sin fecha';
  const [a, m, d] = String(fecha).slice(0, 10).split('-');
  return d && m && a ? `${d}/${m}/${a}` : fecha;
}

export default function App() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState('puntos'); // 'puntos' | 'calor' | 'ambos'

  // Etapa 4: consultar la tabla "puntos" en Supabase.
  useEffect(() => {
    async function cargar() {
      if (!supabaseConfigurado) {
        setError(
          'Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver la guía, paso de variables de entorno).'
        );
        setCargando(false);
        return;
      }
      const { data, error } = await supabase
        .from('puntos')
        .select('id, nombre, categoria, latitud, longitud, valor, fecha, descripcion, comuna')
        .order('fecha', { ascending: true });

      console.log('Datos recibidos desde Supabase:', data, error);

      if (error) {
        setError(`Supabase respondió con un error: ${error.message}`);
      } else {
        // Nos quedamos solo con registros que tengan coordenadas válidas.
        setDatos(
          (data || []).filter(
            (d) => Number.isFinite(Number(d.latitud)) && Number.isFinite(Number(d.longitud))
          )
        );
      }
      setCargando(false);
    }
    cargar();
  }, []);

  // Etapa 7: indicadores calculados con los datos de Supabase.
  const indicadores = useMemo(() => {
    const total = datos.length;
    const victimas = datos.reduce((s, d) => s + (Number(d.valor) || 0), 0);
    // Casos críticos: siniestros con al menos una víctima mortal.
    const mortales = datos.filter((d) => grupoCategoria(d.categoria) === 'Mortal').length;

    const porComuna = {};
    datos.forEach((d) => {
      if (d.comuna != null && d.comuna !== '') {
        porComuna[d.comuna] = (porComuna[d.comuna] || 0) + 1;
      }
    });
    const [comunaTop, comunaCant] =
      Object.entries(porComuna).sort((a, b) => b[1] - a[1])[0] || [null, 0];

    return { total, victimas, mortales, comunaTop, comunaCant };
  }, [datos]);

  // Etapa 5 y desafío adicional: capas de deck.gl.
  const capas = useMemo(() => {
    const lista = [];
    if (vista === 'calor' || vista === 'ambos') {
      lista.push(
        new HeatmapLayer({
          id: 'calor-siniestros',
          data: datos,
          getPosition: (d) => [Number(d.longitud), Number(d.latitud)], // ¡LONGITUD primero!
          getWeight: (d) => Number(d.valor) || 1,
          radiusPixels: 45,
          intensity: 1.2,
          threshold: 0.04,
        })
      );
    }
    if (vista === 'puntos' || vista === 'ambos') {
      lista.push(
        new ScatterplotLayer({
          id: 'puntos-siniestros',
          data: datos,
          getPosition: (d) => [Number(d.longitud), Number(d.latitud)], // ¡LONGITUD primero!
          getFillColor: (d) => [...COLORES[grupoCategoria(d.categoria)], 220],
          getLineColor: [255, 255, 255],
          getRadius: (d) => 5 + (Number(d.valor) || 1) * 2,
          radiusUnits: 'pixels',
          lineWidthUnits: 'pixels',
          getLineWidth: 1.5,
          stroked: true,
          pickable: true,
          autoHighlight: true,
          highlightColor: [30, 60, 120, 255],
        })
      );
    }
    return lista;
  }, [datos, vista]);

  // Etapa 6: información al pasar el mouse sobre un punto.
  const tooltip = ({ object }) =>
    object && {
      html: `
        <div class="tt-titulo">${object.nombre ?? 'Siniestro'}</div>
        <div><b>Categoría:</b> ${object.categoria ?? '-'}</div>
        <div><b>Víctimas:</b> ${object.valor ?? '-'}</div>
        <div><b>Fecha:</b> ${formatoFecha(object.fecha)}</div>
        ${object.comuna ? `<div><b>Comuna:</b> ${object.comuna}</div>` : ''}
        ${object.descripcion ? `<div class="tt-desc">${object.descripcion}</div>` : ''}
      `,
      className: 'tooltip',
      style: {},
    };

  return (
    <div className="app">
      <header className="encabezado">
        <div>
          <p className="sobretitulo">PoC de datos georreferenciados · ISFT N° 199 · Logística</p>
          <h1>Mapa de Siniestros Viales · Ciudad de Buenos Aires 2025</h1>
          <p className="fuente">
            ¿Dónde se producen los siniestros viales y qué tan graves son? Muestra de 100
            siniestros de 2025 (30 mortales, 30 graves, 40 leves). Fuente: Buenos Aires Data –
            Observatorio de Movilidad y Seguridad Vial (GCBA). Grupo: Ayala Debora · Cabrera
            Martín · Sorrenti Pablo
          </p>
        </div>
      </header>

      <section className="indicadores">
        <Indicador valor={indicadores.total} etiqueta="Siniestros registrados" />
        <Indicador valor={indicadores.victimas} etiqueta="Víctimas en total" />
        <Indicador valor={indicadores.mortales} etiqueta="Siniestros mortales" critico />
        <Indicador
          valor={indicadores.comunaTop ? `Comuna ${indicadores.comunaTop}` : '-'}
          etiqueta={`Mayor concentración (${indicadores.comunaCant} siniestros)`}
        />
      </section>

      <main className="mapa-contenedor">
        <DeckGL
          initialViewState={VISTA_INICIAL}
          controller={true}
          layers={capas}
          getTooltip={tooltip}
        >
          <Map mapStyle={MAPA_BASE} attributionControl={true} />
        </DeckGL>

        <div className="panel">
          <div className="selector" role="group" aria-label="Tipo de visualización">
            {[
              ['puntos', 'Puntos'],
              ['calor', 'Mapa de calor'],
              ['ambos', 'Ambos'],
            ].map(([id, texto]) => (
              <button
                key={id}
                className={vista === id ? 'activo' : ''}
                onClick={() => setVista(id)}
              >
                {texto}
              </button>
            ))}
          </div>
          <div className="leyenda">
            {Object.entries(COLORES).map(([nombre, [r, g, b]]) => (
              <span key={nombre}>
                <i style={{ background: `rgb(${r},${g},${b})` }} />
                {nombre}
              </span>
            ))}
            <small>Color: gravedad. Tamaño: cantidad de víctimas.</small>
          </div>
        </div>

        {(cargando || error) && (
          <div className="aviso">
            {cargando ? 'Cargando datos desde Supabase…' : error}
          </div>
        )}
      </main>
    </div>
  );
}

function Indicador({ valor, etiqueta, critico }) {
  return (
    <div className={`indicador ${critico ? 'critico' : ''}`}>
      <span className="valor">
        {typeof valor === 'number' ? valor.toLocaleString('es-AR') : valor}
      </span>
      <span className="etiqueta">{etiqueta}</span>
    </div>
  );
}

# Genera supabase/puntos.csv a partir de siniestros_viales_hechos.xlsx (Buenos Aires Data).
# Uso: python preparar_dataset.py siniestros_viales_hechos.xlsx puntos.csv
#
# Recorte: siniestros de 2025 con coordenadas y dirección, MUESTRA ESTRATIFICADA de 100 casos:
#   30 mortales + 30 graves + 40 leves, elegidos al azar dentro de cada grupo (semilla fija = 2025,
#   así el resultado siempre es el mismo). Las proporciones NO son las reales de la ciudad:
#   en 2025 hubo 11.752 siniestros: 93,4% leves, 5,8% graves y 0,8% mortales.
import sys
import pandas as pd

src, out = sys.argv[1], sys.argv[2]
MUESTRA = {'MORTAL': 30, 'GRAVE': 30, 'LEVE': 40}

d = pd.read_excel(src)
num = lambda s: pd.to_numeric(s.astype(str).str.replace(',', '.').str.strip(), errors='coerce')
d['latitud'] = num(d.latitud_siniestro).round(6)
d['longitud'] = num(d.longitud_siniestro).round(6)
d = d[(d.anio_siniestro == 2025) & d.latitud.notna() & d.longitud.notna()
      & d.direccion_normalizada_siniestro.notna()]

m = pd.concat([d[d.gravedad_siniestro == g].sample(n, random_state=2025) for g, n in MUESTRA.items()])

m['categoria'] = m.gravedad_siniestro.map({'MORTAL': 'Mortal', 'GRAVE': 'Grave', 'LEVE': 'Leve'})
m['valor'] = num(m.numero_total_de_victimas).fillna(1).astype(int)
m['fecha'] = pd.to_datetime(m.fecha_siniestro).dt.strftime('%Y-%m-%d')
m['comuna'] = m.comuna_siniestro.astype(str).str.extract(r'(\d+)')[0].astype('Int64')

NOMBRES = {'PEATON': 'Peatón', 'MOTO': 'Moto', 'AUTO': 'Auto', 'BICICLETA': 'Bicicleta',
           'CAMION': 'Camión', 'TRANSPORTE PUBLICO': 'Transporte público', 'UTILITARIO': 'Utilitario',
           'MOVIL': 'Móvil', 'TAXI': 'Taxi', 'OBJETO FIJO': 'Objeto fijo', 'SD': 'sin datos',
           'MIXTO': 'Mixto', 'MONOPATIN': 'Monopatín', 'TREN': 'Tren', 'OTRO': 'Otro'}
bonito = lambda t: ' vs '.join(NOMBRES.get(x.strip(), x.strip().capitalize()) for x in str(t).split('-'))
VIA = {'AVENIDA': 'Avenida', 'CALLE': 'Calle', 'AV. GRAL. PAZ': 'Av. Gral. Paz', 'AUTOPISTA': 'Autopista'}

m['nombre'] = m.direccion_normalizada_siniestro.str.replace(r'\s+', ' ', regex=True).str.strip()
m['descripcion'] = (m.participantes_siniestro.map(bonito) + ' · '
                    + m.tipo_de_via_siniestro.map(VIA).fillna('Vía s/d') + ' · '
                    + m.hora_siniestro.astype(str).str[:5] + ' h')
m = m.sort_values(['fecha', 'hora_siniestro']).reset_index(drop=True)
m['id'] = range(1, len(m) + 1)

cols = ['id', 'nombre', 'categoria', 'latitud', 'longitud', 'valor', 'fecha', 'descripcion', 'comuna']
m[cols].to_csv(out, index=False, encoding='utf-8')
print(m[cols].head(6).to_string())
print(len(m), m.categoria.value_counts().to_dict(), 'victimas', m.valor.sum(),
      'comuna top', m.comuna.value_counts().head(2).to_dict())
# Proporciones reales del año completo, para citarlas en la entrega:
print((d.gravedad_siniestro.value_counts(normalize=True) * 100).round(1).to_dict(), len(d))

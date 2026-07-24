/**
 * Datos de fichas AutoMatch para scripts de seed (BD + catálogo).
 * Imágenes: rutas /img/... (subir a hosting) o URLs https completas.
 */

const CHERY_ICAR_IMAGES = {
  portada: "/img/chery-icar-03t/chery-icar-03t-portada.webp",
  exterior: "/img/chery-icar-03t/chery-icar-03t-exterior.webp",
  interior: "/img/chery-icar-03t/chery-icar-03t-interior.webp",
  aventura: "/img/chery-icar-03t/chery-icar-03t-aventura.webp",
  tecnologia: "/img/chery-icar-03t/chery-icar-03t-tecnologia.webp",
  seguridad: "/img/chery-icar-03t/chery-icar-03t-seguridad.webp",
};

const MINI_IMAGES = {
  portada: "/img/mini-cooper-electrico/mini-cooper-portada.webp",
  sub: "/img/mini-cooper-electrico/mini-cooper-subportada.webp",
  diseno: "/img/mini-cooper-electrico/mini-cooper-diseño.webp",
  interior: "/img/mini-cooper-electrico/mini-cooper-interior.webp",
  autonomia: "/img/mini-cooper-electrico/mini-cooper-autonomia.webp",
};

const FICHAS = {
  mini: {
    key: "mini",
    title: "Mini Cooper SE Eléctrico",
    plainParagraphs: `Titulo: Diseño urbano icónico | El Mini Cooper SE mantiene la silueta reconocible de la marca con detalles eléctricos sutiles: parrilla cerrada, llantas aerodinámicas de 17 pulgadas y franjas LED que lo hacen legible en ciudad.

Titulo: Interior y conectividad | Cabina compacta pero bien resuelta con pantalla circular de 8.8 pulgadas, Apple CarPlay inalámbrico y acabados personalizables. La posición de conducción baja refuerza el carácter deportivo urbano.

Titulo: Autonomía y carga | Batería de 42 kWh con hasta 280 km WLTP en ciclo mixto. Carga AC en pared y opción de carga rápida DC para recuperar el 80% en cerca de 30 minutos según infraestructura disponible.

Titulo: Dinámica y seguridad | 181 hp y 270 Nm entregan respuesta inmediata en arranques urbanos. Incluye 6 airbags, ABS, control de tracción y asistencias básicas para uso diario en Bogotá.

Titulo: Posición en Colombia | Referencia desde $185.900.000 COP en versiones nuevas. Ideal para quien busca un eléctrico premium compacto con fuerte identidad de marca y costos de operación bajos en trayectos cortos.`,
    subtitle:
      "Icónico y eléctrico. Perfecto para ciudad con tamaño compacto y autonomía de 280 km.",
    images: {
      image1: MINI_IMAGES.portada,
      image2: MINI_IMAGES.sub,
      image3: MINI_IMAGES.diseno,
      image4: MINI_IMAGES.interior,
      image5: MINI_IMAGES.autonomia,
      image6: MINI_IMAGES.portada,
    },
    galleryTexts: {
      img2: { line1: "Perfil compacto con presencia en avenida" },
      img3: { line1: "Detalles de diseño y acabados premium" },
      img4: { line1: "Cabina digital y confort urbano" },
      img5: { line1: "Autonomía pensada para el día a día" },
      img6: { line1: "Seguridad y asistencias para ciudad" },
    },
    catalogMeta: {
      tipo: "eléctrico",
      uso: "urbano",
      condicion: "nuevo",
      ciudad: "Bogotá",
      precio_cop: "185900000",
    },
    specs: {
      spec_segmento: "Hatchback eléctrico urbano",
      spec_origen: "Internacional (UK/Alemania)",
      spec_precio_estimado: "Desde $185.900.000 COP",
      spec_versiones: "Cooper SE",
      spec_motorizacion: "100% eléctrico (BEV)",
      spec_potencia_hp: "181",
      spec_torque_nm: "270",
      spec_bateria_autonomia: "42 kWh | Hasta 280 km WLTP",
      spec_bateria_kwh: "42",
      spec_autonomia_km: "280",
      spec_carga: "AC doméstica y DC rápida (hasta 80% en ~30 min)",
      spec_carga_ac_kw: "11",
      spec_carga_dc_kw: "50",
      spec_aceleracion_0_100: "7.3 s",
      spec_seguridad:
        "6 airbags, ABS, EBD, control de tracción y estabilidad",
      spec_equipamiento:
        'Pantalla 8.8", Apple CarPlay, cámara de reversa, crucero, aire automático, Bluetooth',
      spec_pros:
        "Diseño icónico, manejo ágil, costo de uso bajo en ciudad, marca premium accesible",
      spec_contras:
        "Autonomía limitada en viajes largos, maletero 211 L, precio premium vs compactos",
      spec_competidores:
        "Peugeot e-208, Mazda MX-30, Honda e, Fiat 500e, Nissan Leaf",
      spec_traccion: "Delantera",
      spec_precio_cop: "185900000",
    },
  },

  "chery-icar": {
    key: "chery-icar",
    title: "Chery iCAR 03T REEV",
    plainParagraphs: `Titulo: Lanzamiento y preventa en Colombia | Chery Colombia abrió la preventa del iCAR 03T REEV como primer vehículo de rango extendido de la marca en el país. Las primeras 200 unidades se ofrecen a $124.990.000; la segunda fase queda en $129.990.000 con reserva de $1.000.000 y entrega estimada para octubre de 2026. La preventa está activa en chery.com.co y en la red de 22 concesionarios respaldados por Grupo Vardí.

Titulo: Diseño aventurero de silueta cuadrada | El iCAR 03T apuesta por una carrocería de corte cuadrado, 4.503 mm de largo, 1.950 mm de ancho y 220 mm de despeje. Rines de 21 pulgadas en aluminio bitono, luces LED, techo panorámico con sunroof y acabados como Plata Estelar con techo negro refuerzan su carácter off-road urbano. Chery lo posiciona entre la ciudad entre semana y rutas de aventura el fin de semana, con vadeo de 600 mm.

Titulo: Cabina tech y confort premium | La cabina integra pantalla central de 15,6 pulgadas FHD, tablero digital de 9,2 pulgadas, Apple CarPlay y Android Auto inalámbricos, cargador inalámbrico de 50 W y reconocimiento de voz. Los asientos delanteros son eléctricos, ventilados y con climatización bi-zona. El acabado interior negro integral busca un ambiente tecnológico sin renunciar al confort de un SUV premium.

Titulo: REEV 422 hp, 4x4 y autonomía combinada +800 km | No es un híbrido convencional: las ruedas se mueven siempre con dos motores eléctricos (422 hp y 505 Nm) y tracción integral iWD 4x4. El motor 1.5 TGDI funciona solo como generador. Autonomía eléctrica de hasta 160 km (NEDC) o 170 km (CLTC) con batería LFP CATL de 34,31 kWh; autonomía combinada superior a 800 km con tanque de 12 galones. Acelera de 0 a 100 km/h en 5,1 s y carga DC 90 kW del 30 al 80% en 20 minutos.

Titulo: ADAS, garantía y veredicto local | Incorpora 6 airbags, 11 ADAS, 13 sensores y cámara 540° con transparencia de carrocería. Garantía de 8 años o 200.000 km para vehículo y batería, con red de 22 talleres. Compite con Deepal S05 y otros REEV 4x4 en precio agresivo. Para Colombia, el 03T une electrificación real en ciudad, respaldo de gasolina en ruta y un precio competitivo para un 4x4 de 422 hp.`,
    subtitle:
      "Rango extendido 4x4 con 422 hp: preventa en Colombia desde $124.990.000 y entregas estimadas para octubre de 2026.",
    images: {
      image1: CHERY_ICAR_IMAGES.portada,
      image2: CHERY_ICAR_IMAGES.exterior,
      image3: CHERY_ICAR_IMAGES.interior,
      image4: CHERY_ICAR_IMAGES.aventura,
      image5: CHERY_ICAR_IMAGES.tecnologia,
      image6: CHERY_ICAR_IMAGES.seguridad,
    },
    galleryTexts: {
      img2: { line1: "Silueta cuadrada y presencia off-road urbana" },
      img3: { line1: "Cabina tech con pantalla 15,6 pulgadas" },
      img4: { line1: "iWD 4x4 y modos de manejo para aventura" },
      img5: { line1: "Carga rápida DC y conectividad inalámbrica" },
      img6: { line1: "ADAS y cámara 540° con transparencia" },
    },
    catalogMeta: {
      tipo: "eléctrico",
      uso: "familiar",
      condicion: "nuevo",
      ciudad: "Bogotá",
      precio_cop: "129990000",
    },
    specs: {
      spec_segmento: "SUV compacto eléctrico de rango extendido (REEV) / aventura 4x4",
      spec_origen: "China (iCAR / Chery; comercializado por Chery Colombia — Grupo Vardí)",
      spec_precio_estimado: "Desde $129.990.000 COP (2.ª fase preventa)",
      spec_versiones: "iCAR 03T REEV — versión única iWD 4x4",
      spec_motorizacion: "REEV: 2 motores eléctricos + generador 1.5 TGDI",
      spec_potencia_hp: "422",
      spec_torque_nm: "505",
      spec_bateria_autonomia:
        "LFP CATL 34,31 kWh | EV 160-170 km | Combinada +800 km",
      spec_bateria_kwh: "34,31",
      spec_autonomia_km: "170",
      spec_carga: "DC 90 kW: 30–80% en 20 min | AC: 20–100% en 4,4 h",
      spec_carga_ac_kw: "7,4",
      spec_carga_dc_kw: "90",
      spec_aceleracion_0_100: "≤5,1 s",
      spec_seguridad:
        "6 airbags, 11 ADAS, 13 sensores, cámara 540°, TPMS, estructura de aluminio",
      spec_equipamiento:
        'Pantalla 15,6" FHD, tablero 9,2", CarPlay/Android Auto inalámbrico, carga inalámbrica 50 W, 8 altavoces, bi-zona, asientos ventilados, techo panorámico, keyless, rines 21", 9 modos de manejo',
      spec_pros:
        "422 hp y 4x4 a precio agresivo, autonomía combinada +800 km, garantía 8 años/200.000 km, red de 22 concesionarios",
      spec_contras:
        "Versión única sin 2WD, autonomía EV pura limitada (~170 km), entregas desde octubre 2026",
      spec_competidores: "Deepal S05 REEV, Voyah Free, BYD Song Plus DM-i",
      spec_traccion: "Integral inteligente iWD · 4x4",
      spec_precio_cop: "129990000",
    },
    catalogId: "chery-icar-03t-reev",
  },
};

module.exports = { FICHAS, CHERY_ICAR_IMAGES, MINI_IMAGES };

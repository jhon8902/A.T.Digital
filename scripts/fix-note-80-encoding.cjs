require('dotenv/config');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
  });

  const title = 'Deepal S05 E-Max: diseño inteligente y enfoque eléctrico para el día a día';
  const subtitle = 'Evaluamos su propuesta en autonomía, experiencia digital, confort y eficiencia para entender por qué puede ser uno de los SUV eléctricos más interesantes del segmento.';
  const content = `El Deepal S05 E-Max llega con una propuesta clara: acercar la movilidad eléctrica a usuarios que buscan equilibrio entre tecnología, estética y funcionalidad diaria. Su planteamiento combina una plataforma moderna con un enfoque práctico para ciudad y trayectos interurbanos, priorizando una conducción cómoda, silenciosa y eficiente.

En diseño exterior, el modelo apuesta por líneas limpias, superficies bien definidas y una firma visual que transmite modernidad sin excesos. La lectura general del vehículo es de un SUV compacto con presencia, pensado para quienes valoran una imagen actual pero también un formato fácil de usar en tráfico urbano, estacionamientos y desplazamientos frecuentes.

La cabina refuerza la experiencia digital con una disposición centrada en el conductor, buena visibilidad y una arquitectura interior que busca simplicidad en la interacción. Materiales, ergonomía y espacios de uso cotidiano se orientan a ofrecer comodidad para conductor y acompañantes, con una experiencia que se siente moderna desde el primer contacto.

A nivel mecánico, el S05 E-Max se beneficia de las ventajas típicas de la propulsión eléctrica: respuesta inmediata del par, aceleración progresiva y operación silenciosa. El resultado es una conducción más fluida, especialmente en ciudad, con una sensación de control que favorece maniobras, recuperaciones y trayectos diarios de ritmo variable.

En tecnología y valor de uso, el enfoque está en conectividad, asistencias de conducción y gestión eficiente de energía. Más allá de la ficha técnica puntual, su propuesta gana fuerza cuando se analiza el costo total de propiedad: menor mantenimiento, consumo optimizado y una experiencia de movilidad alineada con la transición energética del mercado.`;

  const result = await pool.query(
    `UPDATE notes
     SET title = $1,
         subtitle = $2,
         content = $3,
         image1 = $4,
         image2 = $5,
         image3 = $6,
         image4 = $7,
         image5 = $8,
         image6 = $9
     WHERE id = 80
     RETURNING id, title, subtitle, image1, image2, image3, image4, image5, image6`,
    [
      title,
      subtitle,
      content,
      '/img/volvo-ex90-electrico/volvo-ex90-portada.webp',
      '/img/volvo-ex90-electrico/volvo-ex90-interior.webp',
      '/img/volvo-ex90-electrico/volvo-ex90-motor.webp',
      '/img/volvo-ex90-electrico/volvo-ex90-tecnologia.webp',
      '/img/volvo-ex90-electrico/volvo-ex90-subportada.webp',
      '/img/volvo-ex90-electrico/volvo-ex90-portada.webp',
    ]
  );

  console.log(JSON.stringify(result.rows[0], null, 2));
  await pool.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

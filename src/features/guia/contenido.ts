/**
 * Contenido de la guía interactiva (`/guia`): lo que el técnico le explica al
 * doctor al entregar el sistema.
 *
 * Cada paso tiene un `id` estable (`doc-3`): es la clave con la que la API
 * guarda lo que se marca y se escribe, así que **un id publicado no se
 * renombra ni se reutiliza**. Los textos admiten `**negrita**` y `` `código` ``.
 * Los ejemplos usan pacientes inventados: nunca datos de personas reales.
 */

export type Quien = "doctor" | "recepcion" | "admin" | "todos"

export const QUIEN: Record<Quien, string> = {
  doctor: "Doctor",
  recepcion: "Recepción",
  admin: "Administración",
  todos: "Cualquiera",
}

export type PasoGuia = {
  id: string
  quien: Quien
  titulo: string
  /** Pantalla del sistema donde se hace; se abre en otra pestaña. */
  ir?: string
  /** Por qué existe y qué problema le resuelve a la clínica. */
  porque: string
  pasos: string[]
  esperado: string[]
}

export type SeccionGuia = {
  id: string
  titulo: string
  /** Lo que el técnico dice al abrir la sección. */
  resumen: string
  /** Con qué cuenta se recorre. */
  cuenta?: string
  pasos: PasoGuia[]
}

export const BIENVENIDA = {
  saludo: "Doctor, le entrego DentalMaster",
  parrafos: [
    "Esta guía es mi forma de acompañarlo mientras usted prueba el sistema por primera vez. Está ordenada como se vive un día en la clínica: primero lo suyo, la consulta; luego lo que hace su equipo en recepción y en caja; y al final lo de administración.",
    "En cada paso le explico **para qué sirve**, **qué hacer** y **qué debería ver**. Pruébelo en el sistema (el botón «Abrir en el sistema» le abre otra pestaña) y vuelva aquí a marcarlo.",
  ],
  comoMarcar: [
    { etiqueta: "Funciona", texto: "hice lo que dice y vi lo que debía ver." },
    { etiqueta: "Falla", texto: "algo no salió como dice o dio un error. Cuénteme qué vio." },
    { etiqueta: "Duda / mejorar", texto: "salió, pero no lo entendí o lo haría distinto." },
  ],
  consejos: [
    "Use **pacientes de práctica inventados**, nunca pacientes reales.",
    "Todo lo que marque y escriba **se guarda solo** en el sistema; no hay botón de guardar.",
    "Puede dejar la guía y volver: el enlace de esta página lo trae de vuelta justo donde iba.",
    "Si algo no lo convence aunque «funcione», márquelo como duda y escriba por qué. Eso es lo más valioso que me puede dar.",
  ],
}

export const SECCIONES: SeccionGuia[] = [
  {
    id: "inicio",
    titulo: "1 · Entrar y conocer el sistema",
    resumen:
      "Lo primero: entrar, saber dónde está cada cosa y dominar tres atajos que le ahorran clics todo el día.",
    cuenta: "Entre con la cuenta que le entregué. Según su rol verá más o menos opciones del menú.",
    pasos: [
      {
        id: "ini-1",
        quien: "todos",
        titulo: "Entrar al sistema y leer el menú",
        ir: "/",
        porque:
          "Cada persona entra con su propia cuenta y el menú se ajusta a lo que le toca hacer. Así recepción no ve las cuentas de la clínica y cada acción queda a nombre de quien la hizo.",
        pasos: ["Abra el sistema y entre con su correo y su contraseña.", "Mire el menú de la izquierda."],
        esperado: [
          "Entra sin errores y llega a «Hoy» (o a la guía de primeros pasos si la clínica está recién creada).",
          "El menú muestra sólo lo que su rol puede usar. Administración ve además Gastos, Informes y Configuración.",
        ],
      },
      {
        id: "ini-2",
        quien: "todos",
        titulo: "Los tres atajos de teclado",
        porque:
          "Buscar un paciente, dar de alta a uno nuevo y agendar una cita se hacen cien veces al día. No deberían exigir buscar un botón.",
        pasos: [
          "Pulse `Ctrl K` (o `⌘K` en Mac): abre el buscador de pacientes.",
          "Pulse `F1`: paciente nuevo.",
          "Pulse `F2`: cita nueva.",
          "Cierre cada ventana con `Esc`.",
        ],
        esperado: [
          "Los tres se abren desde cualquier pantalla.",
          "Al cerrar, queda donde estaba.",
        ],
      },
    ],
  },
  {
    id: "doctor",
    titulo: "2 · Su consulta: atender a un paciente",
    resumen:
      "Esta es la parte suya. Recorremos una atención completa: ficha médica, odontograma, plan de tratamiento, la consulta, el implante, la receta y la firma.",
    cuenta:
      "Entre como doctor. Si aún no tiene un paciente de práctica, créelo con `F1` (ver el paso rec-2).",
    pasos: [
      {
        id: "doc-1",
        quien: "doctor",
        titulo: "Ficha médica y alertas",
        ir: "/pacientes",
        porque:
          "Antes de tocar al paciente usted debe saber de un vistazo si es alérgico o tiene un riesgo. Las alergias y las condiciones de riesgo alto suben a la cabecera del expediente, donde no se pueden pasar por alto.",
        pasos: [
          "Abra a su paciente de práctica y, en la pestaña «Ficha médica», pulse «Crear ficha».",
          "Marque una alergia a la penicilina como **severa**, una al látex como **leve** y la condición «Diabetes mellitus».",
          "Añada un medicamento y pulse «Guardar ficha».",
        ],
        esperado: [
          "La cabecera muestra «alertas clínicas»: la penicilina y la diabetes en rojo, el látex en ámbar.",
          "Cada alerta dice su gravedad con letras, no sólo con color.",
        ],
      },
      {
        id: "doc-2",
        quien: "doctor",
        titulo: "El expediente de un vistazo",
        ir: "/pacientes",
        porque:
          "La cabecera responde lo primero que usted pregunta al abrir un expediente: quién es, qué riesgo tiene y cuánto debe. La franja de abajo se calcula sola; nadie la redacta, así que nunca queda desactualizada.",
        pasos: ["Abra el expediente de su paciente de práctica."],
        esperado: [
          "Cabecera con su código, edad y teléfono con formato `(809) 555-0100`.",
          "Una franja con próxima cita, última consulta, plan y seguro («Particular» si no tiene).",
          "Seis pestañas: Historial, Odontograma, Ficha médica, Documentos, Citas y Cuenta.",
        ],
      },
      {
        id: "doc-3",
        quien: "doctor",
        titulo: "Marcar en el odontograma con el pincel",
        ir: "/pacientes",
        porque:
          "Es el corazón clínico: el mapa de la boca. Usted elige una condición (el «pincel») y toca el diente. Una barra sobre el dibujo le dice siempre qué pincel tiene y a dónde pulsar, para que nunca marque sin saberlo.",
        pasos: [
          "En «Odontograma», si no existe, pulse «Dentición permanente».",
          "En la paleta, pestaña «Hallazgos», elija «Caries». La barra dirá «Pincel: Caries · Existente».",
          "Pulse la cara del centro de la pieza 37 y luego una cara lateral.",
          "Elija «Ausente por extracción» y pulse cualquier parte de la 38.",
          "Vuelva a pulsar una cara ya marcada de la 37 con «Caries»: se quita.",
          "En la tabla de lo marcado, pulse «Quitar» en una fila.",
        ],
        esperado: [
          "Las caras se pintan al instante y la tabla dice, por ejemplo, «37 · Caries · O · Clase I».",
          "Al sumar la cara lateral pasa a «Clase II»: la clase se calcula sola.",
          "«Ausente» se registra en la pieza completa aunque pulse una cara.",
          "Pulsar de nuevo lo ya puesto lo quita, y «Quitar» borra la fila entera.",
        ],
      },
      {
        id: "doc-4",
        quien: "doctor",
        titulo: "Lo hecho, lo propuesto y las versiones",
        ir: "/pacientes",
        porque:
          "El mismo odontograma sirve de diagnóstico y de plan visual. El estado no cambia el color, cambia la textura (sólido: existente o hecho; rayado: planificado), y lo propuesto nunca tapa un hallazgo real. Cada versión es una foto fechada que no se sobrescribe.",
        pasos: [
          "Pestaña «Restauraciones» → «Restauración de resina»; en «Se registra como» elija «Planificado» y pulse una cara con caries.",
          "Pulse «Nueva versión», escriba el motivo y «Crear versión».",
          "En la línea de tiempo pulse «v1».",
        ],
        esperado: [
          "La cara sigue viéndose como caries, con la marca de lo propuesto encima.",
          "Aparece «v2 · vigente»; la v1 avisa que es histórica y no deja marcar.",
        ],
      },
      {
        id: "doc-5",
        quien: "doctor",
        titulo: "Abrir un plan de tratamiento",
        ir: "/pacientes",
        porque:
          "El plan es la carpeta clínica del paciente: agrupa lo que usted cotiza y las consultas en que lo ejecuta. Una consulta también puede ir suelta, sin plan, cuando no hace falta.",
        pasos: [
          "En Historial pulse «Nuevo plan».",
          "Elija doctor, título «Operatoria e implante», especialidad y la tarifa particular, y «Abrir plan».",
        ],
        esperado: ["Aparece la tarjeta del plan con su código `PT-…`, estado «Abierto» y «Sin ítems cotizados»."],
      },
      {
        id: "doc-6",
        quien: "doctor",
        titulo: "Cotizar: los ítems del plan",
        porque:
          "Cada ítem es un servicio sobre una pieza, con su precio de la tarifa: usted no lo teclea. Lo que el servicio exige se le dice antes de que falle, y lo cotizado con pieza se dibuja solo en el odontograma como «planificado».",
        pasos: [
          "En el plan pulse «Plan y presupuesto».",
          "En «Añadir al plan» elija «Resina · 1 superficie» (escriba «resina» para buscar).",
          "Escriba pieza `26` y cara `O`, y pulse «Añadir».",
          "Añada «Implante dental unitario (cirugía)» en la pieza `46`.",
          "Con el lápiz, ponga 10 % de descuento a la resina.",
          "Abra la pestaña Odontograma.",
        ],
        esperado: [
          "Sin pieza ni cara, el sistema se lo dice en un aviso ámbar y deshabilita «Añadir».",
          "El total del plan refleja el descuento.",
          "En el odontograma, la 26 aparece rayada (planificado) y la 46 con el implante planificado.",
          "Si quita un ítem del plan, su dibujo planificado desaparece.",
        ],
      },
      {
        id: "doc-7",
        quien: "doctor",
        titulo: "Presupuesto y estado del plan",
        porque:
          "El paciente decide con un papel en la mano. La propia página del plan es el presupuesto imprimible, y el plan avanza por estados para que se sepa qué se aceptó y qué no.",
        pasos: [
          "Pulse «Marcar presupuesto entregado» y luego «Aceptado por el paciente».",
          "Pulse «Imprimir presupuesto» y mire la vista previa.",
        ],
        esperado: [
          "La insignia cambia en cada paso y sólo ofrece los pasos válidos.",
          "Impreso: membrete de la clínica con logo, datos del paciente, ítems por fase, total y línea de firma, sin botones.",
        ],
      },
      {
        id: "doc-8",
        quien: "doctor",
        titulo: "Registrar la consulta",
        ir: "/pacientes",
        porque:
          "Es el gesto central. Una sola línea ejecutada genera el cargo, pinta el odontograma, marca el ítem del plan como hecho y descuenta los insumos de su receta. Todo a la vez, para que la clínica, la caja y el almacén no puedan discrepar.",
        pasos: [
          "En la tarjeta del plan pulse «Consulta».",
          "En «Pendiente en el plan» pulse la resina de la 26: entra como línea.",
          "Escriba un diagnóstico y pulse «Registrar consulta».",
          "Mire Historial y Odontograma.",
        ],
        esperado: [
          "La consulta aparece dentro del plan con su «Pendiente RD$ …».",
          "El plan pasa a «En curso» y dice «1 de 2 ítems hechos».",
          "La 26 pasa de rayada a sólida (completada).",
        ],
      },
      {
        id: "doc-9",
        quien: "doctor",
        titulo: "Fotos de la consulta",
        porque:
          "Cada consulta guarda sus fotos. El tipo de archivo lo decide el contenido, no el nombre, así que nadie sube algo disfrazado.",
        pasos: ["En la fila de la consulta pulse «+ Foto» y elija una imagen.", "Pulse la miniatura."],
        esperado: [
          "La miniatura aparece en esa consulta.",
          "El visor la muestra grande y permite descargarla y corregir tipo, título, pieza y fecha.",
        ],
      },
      {
        id: "doc-10",
        quien: "doctor",
        titulo: "Un implante, con su lote",
        porque:
          "Si un fabricante retira un producto, usted debe saber a qué pacientes se lo colocó. Por eso el lote es obligatorio, y una línea con implante registrado ya no se puede quitar de su consulta.",
        pasos: [
          "Registre otra «Consulta» del plan añadiendo el implante de la 46.",
          "En la línea del implante pulse «Registrar lote».",
          "Elija el sistema, escriba un lote inventado y las medidas, y «Registrar implante».",
          "En Odontograma, baje a «Implantes», pulse «Seguimiento» y registre un «Control» y luego una «Carga protésica».",
        ],
        esperado: [
          "La línea dice «· lote registrado».",
          "En «Implantes» está con pieza, sistema, lote y la colocación como primer hito.",
          "La carga lo deja como «Cargado».",
        ],
      },
      {
        id: "doc-11",
        quien: "doctor",
        titulo: "Recetar contra una alergia",
        ir: "/pacientes",
        porque:
          "La receta se cruza con las alergias de la ficha. Si choca, no se guarda hasta que usted lo confirme a conciencia: es una red de seguridad, no un estorbo.",
        pasos: [
          "En su paciente pulse «Receta».",
          "Añada `Amoxicilina 500 mg` con su dosis y pulse «Guardar receta».",
          "Lea el aviso. Cambie el medicamento o pulse «Recetar de todos modos».",
          "Abra la receta con el icono de imprimir.",
        ],
        esperado: [
          "Un aviso rojo dice que choca con la alergia a la penicilina.",
          "La receta impresa lleva el membrete, doctor, paciente y cada medicamento con sus indicaciones.",
        ],
      },
      {
        id: "doc-12",
        quien: "doctor",
        titulo: "Emitir un documento y firmarlo",
        ir: "/pacientes",
        porque:
          "Los consentimientos y constancias se rellenan solos con los datos del paciente y de la clínica. Una vez emitido, el documento ya no cambia: si algo está mal se anula y se emite otro. La firma va por un enlace que sirve sólo para ese documento.",
        pasos: [
          "«Nuevo documento» → «Consentimiento informado · se firma».",
          "Revise el texto y «Emitir documento».",
          "En la lista pulse «Firmar» → «Generar enlace de firma» → «Abrir para firmar aquí».",
          "Escriba nombre y cédula, firme con el ratón o el dedo y «Firmar y enviar».",
          "Vuelva al expediente.",
        ],
        esperado: [
          "El texto llega con nombre, cédula, doctor y datos de la clínica ya puestos; lo que no pudo rellenar queda señalado.",
          "La página de firma no tiene menú ni deja navegar a otra parte.",
          "El documento pasa de «Pendiente de firma» a «Firmado por …».",
        ],
      },
      {
        id: "doc-13",
        quien: "doctor",
        titulo: "Fotos y exámenes del expediente",
        ir: "/pacientes",
        porque:
          "Radiografías, tomografías y analíticas que no son de una consulta concreta. Sólo se ven con sesión iniciada: no existe un enlace público a un examen.",
        pasos: [
          "Baje a «Fotos y exámenes» y pulse «Subir».",
          "Elija una imagen o un PDF, tipo «Panorámica», un título, y «Subir».",
          "Ábralo. Luego intente subir un archivo de texto renombrado a `.jpg`.",
        ],
        esperado: [
          "Aparece como una ficha más, con su miniatura.",
          "El archivo falso se rechaza: «Sólo se admiten imágenes (JPG, PNG, WebP) y PDF».",
        ],
      },
      {
        id: "doc-14",
        quien: "doctor",
        titulo: "Seguro del paciente y cobertura",
        ir: "/pacientes",
        porque:
          "La póliza se ve en la franja de resumen. Con la tarifa de una ARS, el presupuesto estima lo que cubre el seguro; el cargo sigue siendo del paciente, y lo que pague la ARS entra después como un pago más.",
        pasos: [
          "Pulse el lápiz de «Seguro» y añada una ARS con un número de póliza.",
          "Cree otro plan con la tarifa de esa ARS, añada un ítem y mire el total.",
        ],
        esperado: [
          "La franja pasa de «Particular» a la ARS y su póliza.",
          "El presupuesto añade «Cubre … (estimado)» y «A pagar por el paciente».",
        ],
      },
    ],
  },
  {
    id: "recepcion",
    titulo: "3 · Recepción: pacientes y agenda",
    resumen:
      "Así trabaja su equipo en el mostrador. Usted no tiene que hacerlo, pero sí conviene que lo vea una vez para saber qué le llega ya resuelto a su consultorio.",
    cuenta: "Salga y entre con la cuenta de recepción, o recorra estos pasos como administración.",
    pasos: [
      {
        id: "rec-1",
        quien: "recepcion",
        titulo: "El menú de recepción",
        ir: "/",
        porque:
          "Recepción lleva la agenda y la caja, pero no toca lo clínico ni las cuentas de la clínica. El menú se filtra por rol y la API rechaza lo mismo aunque alguien escriba la dirección a mano.",
        pasos: ["Entre como recepción.", "Escriba a mano en la barra `/configuracion` y `/informes`."],
        esperado: [
          "El menú tiene Hoy, Agenda, Pacientes, Caja, Inventario y Catálogo; no Gastos, Informes ni Configuración.",
          "Esas direcciones lo devuelven al inicio o no cargan datos.",
        ],
      },
      {
        id: "rec-2",
        quien: "recepcion",
        titulo: "Alta rápida de un paciente",
        porque:
          "En el mostrador basta el nombre; lo demás se completa después. El número de expediente lo pone el sistema, sin huecos ni repetidos.",
        pasos: [
          "Pulse `F1` y escriba Nombres **Juan Carlos**, Apellidos **Peña Rosario**.",
          "En «Celular» escriba sólo los dígitos `8095550142`.",
          "Ponga una cédula mal escrita (`123`) y guarde; luego una buena (`40211122234`).",
          "Elija un doctor tratante escribiendo en el desplegable.",
        ],
        esperado: [
          "La máscara forma `(809) 555-0142` mientras escribe.",
          "La cédula incorrecta se rechaza junto al campo sin perder lo demás; la buena queda `402-1112223-4`.",
          "Se abre su expediente con un código `PAC-…`.",
        ],
      },
      {
        id: "rec-3",
        quien: "recepcion",
        titulo: "Segundo paciente y búsqueda sin tildes",
        porque:
          "El buscador encuentra por nombre, expediente, cédula o teléfono sin importar tildes ni mayúsculas. Nadie debería perder un paciente por escribir «Gomez» sin acento.",
        pasos: [
          "Cree con `F1` a **María Altagracia Gómez Lantigua**, celular 809 777 0002.",
          "Pulse `Ctrl K` y escriba `gomez`, luego `pena`, luego `7770002`.",
          "Pulse Enter sobre un resultado.",
        ],
        esperado: [
          "«gomez» encuentra a Gómez; «pena», a Peña; el teléfono se encuentra por sus dígitos.",
          "Enter abre el expediente del primer resultado, nunca el de una búsqueda anterior.",
        ],
      },
      {
        id: "rec-4",
        quien: "recepcion",
        titulo: "Agendar una cita",
        ir: "/agenda",
        porque:
          "Una cita ocupa a un doctor y, si se indica, un sillón. Elegir el servicio propone la duración. También se agenda pulsando un hueco de la rejilla, que ya trae día, hora y doctor.",
        pasos: [
          "Pulse `F2`.",
          "Busque a Juan Carlos, elija doctor, unidad, un servicio y hoy a las 11:00 a. m.",
          "Guarde.",
        ],
        esperado: [
          "El bloque aparece en la agenda en su día y hora, con el color de «Pendiente».",
          "En el expediente, pestaña «Citas», está la cita; y la franja muestra «Próxima cita».",
        ],
      },
      {
        id: "rec-5",
        quien: "recepcion",
        titulo: "Choque de agenda y sobrecupo",
        ir: "/agenda",
        porque:
          "La base de datos impide dos citas vivas del mismo doctor o del mismo sillón a la misma hora. Solapar a propósito es posible, pero hay que decir por qué.",
        pasos: [
          "Agende a María con el mismo doctor, a la misma hora.",
          "Lea el aviso.",
          "Marque «Agendar como sobrecupo», escriba el motivo y guarde.",
        ],
        esperado: [
          "Primero se rechaza con un aviso ámbar que dice con quién choca.",
          "Con sobrecupo y motivo, se agenda.",
        ],
      },
      {
        id: "rec-6",
        quien: "recepcion",
        titulo: "Reprogramar y cancelar",
        ir: "/agenda",
        porque:
          "Reprogramar no crea otra cita: mueve la misma y deja rastro. Cancelada y «No asistió» liberan el hueco.",
        pasos: [
          "Pulse una cita para ver su detalle.",
          "«Reprogramar o editar»: cambie la hora, escriba por qué y guarde.",
          "Abra de nuevo el detalle y mire «Historial».",
          "Con el selector de estado, pásela a cancelada.",
        ],
        esperado: [
          "El bloque se mueve y el historial dice de qué hora a qué hora y cuándo.",
          "Tras cancelarla, en esa hora se puede agendar otra sin sobrecupo.",
        ],
      },
      {
        id: "rec-7",
        quien: "recepcion",
        titulo: "Las vistas de la agenda",
        ir: "/agenda",
        porque:
          "Semana para planificar, Día para trabajar (una columna por doctor o por sillón), Mes para ver la carga y saltar a un día, Lista para imprimir.",
        pasos: [
          "Cambie entre Semana, Día, Mes y Lista.",
          "En Día, alterne «Por doctor» y «Por unidad».",
          "Filtre por un doctor.",
          "Pulse «Imprimir» y mire la vista previa.",
        ],
        esperado: [
          "La vista, el día y el doctor quedan en la dirección: al recargar no se pierden.",
          "Impreso sale la lista de citas con el membrete de la clínica y su logo.",
        ],
      },
      {
        id: "rec-8",
        quien: "recepcion",
        titulo: "El tablero «Hoy»",
        ir: "/inicio",
        porque:
          "Las citas de hoy en tres columnas: Por llegar, En sala, Atendidos. Cada tarjeta ofrece sólo su paso siguiente; la cita nunca salta estados.",
        pasos: ["Con las citas de hoy, pulse «Confirmar» en una y luego «Llegó»."],
        esperado: [
          "La tarjeta pasa de «Por llegar» a «En sala» sin recargar.",
          "Arriba dice cuántas citas hay; las canceladas y ausencias van plegadas abajo.",
        ],
      },
      {
        id: "rec-9",
        quien: "recepcion",
        titulo: "Recordatorio por WhatsApp",
        ir: "/inicio",
        porque:
          "Bajo el tablero está la cola de mañana. El botón abre WhatsApp con el mensaje ya escrito y marca la cita como avisada. No envía nada solo: lo manda la persona desde su WhatsApp.",
        pasos: ["Agende una cita para mañana.", "En «Citas de mañana» pulse «Avisar por WhatsApp»."],
        esperado: [
          "Se abre WhatsApp con el recordatorio redactado: nombre, clínica, día, hora y doctor.",
          "Al volver, el botón dice «Avisado · reenviar» y el contador baja.",
        ],
      },
    ],
  },
  {
    id: "caja",
    titulo: "4 · Caja: cobrar",
    resumen:
      "El dinero cuelga del paciente: lo que debe son sus consultas y lo que entró son sus pagos. Los saldos no se teclean, se calculan.",
    cuenta: "Entre como recepción (o administración).",
    pasos: [
      {
        id: "caj-1",
        quien: "recepcion",
        titulo: "Cobrar una consulta y dar el recibo",
        ir: "/pacientes",
        porque:
          "«Cobrar» propone el saldo exacto de esa consulta, pero se puede abonar menos. El recibo lleva número correlativo y no cambia de monto: si está mal, se anula.",
        pasos: [
          "En su paciente, en la consulta de la resina, pulse «Cobrar».",
          "Cambie el monto a la mitad, método Efectivo, y «Registrar pago».",
          "Pulse «Imprimir recibo».",
        ],
        esperado: [
          "El monto propuesto era el saldo exacto.",
          "El recibo sale en formato ticket con logo, número, quién cobró y «Saldo pendiente».",
          "La consulta dice «abonado … de …» y el botón pasa a «Cobrar resto».",
        ],
      },
      {
        id: "caj-2",
        quien: "recepcion",
        titulo: "La cuenta del paciente",
        ir: "/pacientes",
        porque:
          "Total de consultas, pagado y balance, las consultas con saldo y cada recibo. Siempre concilian, porque salen de las líneas ejecutadas y de los pagos.",
        pasos: [
          "Abra la pestaña Cuenta.",
          "En un pago, pulse el lápiz y corrija el concepto.",
          "Pulse «Adjuntar» y suba la foto de un comprobante; ábrala con «Comprobante».",
        ],
        esperado: [
          "Las tres cifras cuadran con lo que hizo.",
          "El concepto corregido sale en el recibo; el monto y la fecha no se dejan tocar.",
        ],
      },
      {
        id: "caj-3",
        quien: "recepcion",
        titulo: "Pagar de más: el anticipo",
        porque:
          "Un pago es del paciente, no de una consulta. Lo que sobra queda como crédito a favor y se aplica solo a la próxima consulta.",
        pasos: ["Pulse «Registrar pago» y cobre más de lo que debe."],
        esperado: [
          "El balance pasa a «Crédito a favor».",
          "El pago dice cuánto quedó «sin aplicar»; en la próxima consulta se aplica solo.",
        ],
      },
      {
        id: "caj-4",
        quien: "admin",
        titulo: "Anular un pago",
        ir: "/pacientes",
        porque:
          "El dinero recibido no se borra. Se anula con motivo: conserva su número de recibo y sale de los balances. Sólo lo hace facturación o administración.",
        pasos: [
          "Entre como facturación o administración.",
          "En la cuenta del paciente pulse el icono de anular en un pago y escriba el motivo.",
        ],
        esperado: [
          "El pago queda tachado, con «Anulado» y su motivo.",
          "El balance vuelve a ser deuda. Como recepción, ese icono no aparece.",
        ],
      },
      {
        id: "caj-5",
        quien: "recepcion",
        titulo: "Comprobante fiscal (NCF)",
        ir: "/pacientes",
        porque:
          "La factura con NCF se emite sólo si el paciente la pide, sobre lo ya ejecutado. No genera deuda ni recibe pagos: es el comprobante. Toma el siguiente número del rango que autorizó la DGII.",
        pasos: [
          "Baje a «Comprobantes fiscales» y pulse «Emitir comprobante».",
          "Deje «Consumo (B02)» y las líneas marcadas, y «Emitir comprobante».",
          "Pruebe otra con «Crédito fiscal» sin RNC.",
        ],
        esperado: [
          "Sale la factura con su NCF, «Válido hasta», membrete e ITBIS exento.",
          "Esa línea ya no se ofrece para facturar: una línea no entra en dos comprobantes.",
          "Crédito fiscal sin RNC ni razón social no deja emitir.",
        ],
      },
      {
        id: "caj-6",
        quien: "recepcion",
        titulo: "La caja del día y su cierre",
        ir: "/caja",
        porque:
          "Lo cobrado hoy, por método. Cerrar es contar el efectivo y guardar la foto del día: no cambia aunque después se anule algo, y un descuadre exige explicación.",
        pasos: [
          "Abra Caja → Cobros.",
          "Pulse «Cerrar caja» y escriba un efectivo contado distinto del esperado.",
          "Explique la diferencia y cierre.",
        ],
        esperado: [
          "El total y el desglose por método coinciden con lo que cobró.",
          "Sin explicación no deja cerrar un descuadre.",
          "Queda «Caja cerrada» con cobrado, esperado, contado y diferencia.",
        ],
      },
      {
        id: "caj-7",
        quien: "recepcion",
        titulo: "Cuentas por cobrar",
        ir: "/caja",
        porque: "Quién debe, cuánto y desde cuándo. La antigüedad dice a quién llamar primero.",
        pasos: [
          "Abra la pestaña «Cuentas por cobrar».",
          "Busque por nombre sin tilde o por teléfono.",
          "Pulse «Imprimir».",
        ],
        esperado: [
          "Los tramos de antigüedad suman el total; los pacientes saldados no aparecen.",
          "Impreso sale el listado con el membrete de la clínica.",
        ],
      },
    ],
  },
  {
    id: "admin",
    titulo: "5 · Administración: gastos, almacén e informes",
    resumen:
      "Lo que le interesa al dueño de la clínica: cuánto entra, cuánto sale, qué hay en el almacén y cuánto produce cada doctor.",
    cuenta: "Entre como administración (o facturación para Gastos e Informes).",
    pasos: [
      {
        id: "adm-1",
        quien: "admin",
        titulo: "Registrar un gasto",
        ir: "/gastos",
        porque:
          "Todo lo que sale: del consultorio, honorarios de un doctor o personal. Lleva categoría, proveedor, NCF e ITBIS y la foto de la factura. Como un pago, se anula y no se borra.",
        pasos: [
          "Pulse «Registrar gasto».",
          "Complete fecha, monto, categoría, descripción y método; pruebe con proveedor y NCF (`B0100004512`).",
          "En la fila, «Adjuntar» la foto de la factura.",
          "Anule un gasto con su motivo.",
        ],
        esperado: [
          "El gasto entra en la lista y en el total por categoría.",
          "Un NCF mal formado se rechaza.",
          "El anulado queda tachado y fuera del total.",
        ],
      },
      {
        id: "adm-2",
        quien: "admin",
        titulo: "Una compra que entra al almacén",
        ir: "/gastos",
        porque:
          "Si lo comprado son insumos, el mismo gasto da su entrada al almacén: el dinero y la existencia nacen del mismo registro.",
        pasos: [
          "Registre un gasto y pulse «Añadir insumo comprado».",
          "Elija un insumo, una cantidad y su costo.",
          "Vaya a Inventario.",
        ],
        esperado: ["La existencia del insumo sube en esa cantidad.", "En sus «Movimientos» está la compra."],
      },
      {
        id: "adm-3",
        quien: "admin",
        titulo: "Inventario y kárdex",
        ir: "/inventario",
        porque:
          "La existencia no es un número que se edita: es la suma de los movimientos (compras, consumos, mermas, conteos). Así nadie «corrige» un faltante sin dejar rastro.",
        pasos: [
          "Abra «Movimientos» de un insumo.",
          "Marque «Sólo por reponer».",
          "Registre un «Conté el estante» con otra cantidad.",
        ],
        esperado: [
          "Está el consumo de la consulta que registró.",
          "Lo que está en su mínimo o por debajo lleva «Reponer».",
          "El conteo se guarda como ajuste por la diferencia; no pisa el historial.",
        ],
      },
      {
        id: "adm-4",
        quien: "admin",
        titulo: "Implantes por lote",
        ir: "/inventario",
        porque: "Si un fabricante retira un lote, hay que saber a quién llamar. Lo ven doctores y administración.",
        pasos: ["Baje a «Implantes por lote» y escriba el lote que registró."],
        esperado: ["Sale el paciente, con pieza, sistema, fecha y su teléfono."],
      },
      {
        id: "adm-5",
        quien: "admin",
        titulo: "Informe de la clínica",
        ir: "/informes",
        porque:
          "Ingresos (lo cobrado), gastos, neto, producción (lo ejecutado, cobrado o no) y lo que falta por cobrar; por doctor y por sillón.",
        pasos: ["Abra Informes.", "Use «Este mes», «Mes pasado» y «Este año».", "Pulse «Imprimir»."],
        esperado: [
          "Aparecen sus cobros y gastos de las pruebas.",
          "Neto = ingresos − gastos.",
          "Impreso sale con el membrete y sin controles.",
        ],
      },
      {
        id: "adm-6",
        quien: "doctor",
        titulo: "Su producción y su liquidación",
        ir: "/informes",
        porque:
          "Lo que usted hizo, lo cobrado por sus consultas —una a una, porque es la base de su comisión—, lo ya pagado y lo que queda por liquidar. Impreso es su hoja de liquidación, con firmas.",
        pasos: [
          "Como doctor, abra «Mi producción».",
          "Como administración, en Informes → «Doctores» elija al mismo doctor y compare.",
          "Pulse «Imprimir».",
        ],
        esperado: [
          "Producción, cobrado y comisión coinciden en las dos vistas.",
          "Un doctor ve sólo su reporte; el de otro se le niega.",
          "Impreso: «Reporte de producción y liquidación» con dos líneas de firma.",
        ],
      },
    ],
  },
  {
    id: "config",
    titulo: "6 · Puesta en marcha de la clínica",
    resumen:
      "Lo que se configura una sola vez, en este orden: sin doctores y sin unidades no se puede agendar, y sin una secuencia de NCF no se puede facturar.",
    cuenta: "Sólo administración. Si la clínica ya está configurada, revise que todo esté como lo espera.",
    pasos: [
      {
        id: "onb-1",
        quien: "admin",
        titulo: "La guía de primeros pasos",
        ir: "/",
        porque:
          "Una clínica recién creada no aterriza en un «Hoy» vacío: abre una guía de seis pasos. Sólo la clínica y un doctor son obligatorios, y mientras duran no hay menú lateral.",
        pasos: [
          "Con una clínica nueva, entre como administración.",
          "Intente ir a Agenda escribiendo la dirección a mano.",
        ],
        esperado: [
          "Cae en «Bienvenido a DentalMaster», sin menú lateral y sin botón de omitir.",
          "«Terminar configuración» está deshabilitado hasta completar lo obligatorio.",
        ],
      },
      {
        id: "cfg-1",
        quien: "admin",
        titulo: "Datos y logo de la clínica",
        ir: "/configuracion",
        porque:
          "Un solo sitio para el nombre, RNC, dirección, teléfono, WhatsApp, correo, web y logo. Todo el sistema los usa: menú, impresos, plantillas y recordatorios.",
        pasos: [
          "Abra Configuración (pestaña «Clínica»).",
          "Ponga los datos y «Guardar datos».",
          "Suba un logo PNG o JPG con «Subir logo». Pruebe también con un PDF.",
        ],
        esperado: [
          "Se guarda y la vista previa del membrete lo refleja.",
          "El teléfono se escribe solo como `(809) 555-0100`.",
          "El logo aparece arriba a la izquierda del menú.",
          "Un PDF como logo se rechaza.",
        ],
      },
      {
        id: "cfg-2",
        quien: "admin",
        titulo: "Unidades dentales (sillones)",
        ir: "/configuracion",
        porque: "La agenda no deja dos citas a la vez en el mismo sillón. Una unidad alquilada se marca como tal.",
        pasos: ["Pestaña «Unidades dentales» → «Nueva unidad».", "Cree «Unidad 1» y «Unidad 2» marcada como alquilada."],
        esperado: ["Aparecen en la lista; la alquilada, con su insignia.", "Se pueden elegir al agendar una cita."],
      },
      {
        id: "cfg-3",
        quien: "admin",
        titulo: "Doctores y su comisión",
        ir: "/configuracion",
        porque:
          "Cada doctor lleva su porcentaje de comisión, que se aplica sobre lo cobrado en la liquidación. El tratamiento «Dr(a).» lo pone la aplicación: no se escribe en el nombre.",
        pasos: [
          "Pestaña «Doctores» → «Nuevo doctor».",
          "Cree un doctor con comisión, especialidad, cédula, exequátur y teléfono.",
          "Intente guardar un teléfono de 7 dígitos.",
        ],
        esperado: [
          "Sale en la lista como «Dr(a). …».",
          "El teléfono incompleto se rechaza con «debe tener 10 dígitos» junto al campo.",
        ],
      },
      {
        id: "cfg-4",
        quien: "admin",
        titulo: "Usuarios y roles",
        ir: "/configuracion",
        porque:
          "Cada persona entra con su cuenta y su rol. Un usuario de rol doctor se enlaza con su ficha de doctor: de ahí salen «Mis citas» y «Mi producción».",
        pasos: [
          "Pestaña «Usuarios» → «Nuevo usuario».",
          "Cree una cuenta de Recepción y otra de Doctor enlazada a su ficha.",
          "Pruebe antes una contraseña floja, como `12345678`.",
        ],
        esperado: [
          "La contraseña floja se rechaza diciendo por qué (mínimo 12 caracteres, sin patrones previsibles).",
          "Los usuarios salen en la lista con su rol.",
        ],
      },
      {
        id: "cfg-5",
        quien: "admin",
        titulo: "Secuencia de comprobantes fiscales (NCF)",
        ir: "/configuracion",
        porque:
          "Cada factura toma el siguiente número del rango que autorizó la DGII. Sin una secuencia activa de ese tipo no se puede facturar. Cargue los rangos reales de la DGII.",
        pasos: [
          "Pestaña «Comprobantes fiscales» → «Cargar secuencia».",
          "Tipo «Consumo (B02)», con su rango y vigencia.",
        ],
        esperado: [
          "Muestra su rango, el siguiente número y cuántos quedan.",
          "Cargar un rango nuevo del mismo tipo cierra el anterior.",
        ],
      },
      {
        id: "cfg-6",
        quien: "admin",
        titulo: "Plantillas de documento",
        ir: "/configuracion",
        porque:
          "El texto base de constancias, consentimientos y cuidados, con variables (nombre del paciente, clínica…) que se rellenan al emitir.",
        pasos: ["Abra «Plantillas» y edite el texto de «Constancia de visita» (añada una línea).", "Guarde."],
        esperado: ["Aparecen las plantillas de base.", "El cambio rige para lo que se emita después; lo ya emitido no cambia."],
      },
      {
        id: "cfg-7",
        quien: "admin",
        titulo: "Catálogo: servicios, precios y tarifas",
        ir: "/catalogo",
        porque:
          "Lo que la clínica ofrece. Cada servicio dice si va sobre una pieza, qué pinta en el odontograma al completarse y su precio en cada tarifa. Una tarifa nueva nace copiando otra con un ajuste.",
        pasos: [
          "Mire «Servicios y precios» y busque `radiografia` sin tilde.",
          "«Nuevo servicio»: nombre, categoría, duración y un precio.",
          "Pestaña «Tarifas» → «Nueva tarifa» con un ajuste de `-10` y cobertura `80`.",
        ],
        esperado: [
          "«radiografia» encuentra «Radiografía panorámica».",
          "La tarifa nueva trae todos los precios un 10 % más bajos.",
          "La tarifa particular no se puede retirar.",
        ],
      },
      {
        id: "cfg-8",
        quien: "admin",
        titulo: "Insumos y receta de un servicio",
        ir: "/inventario",
        porque:
          "El almacén es un kárdex. Cada servicio puede tener una receta de insumos que se descuenta sola al ejecutarlo, y de ahí sale su costo y su margen.",
        pasos: [
          "En Inventario pulse «Nuevo insumo» con existencia inicial, mínima y costo.",
          "En Catálogo, abra los insumos de un servicio y añada cantidades; guarde.",
        ],
        esperado: [
          "Los insumos avisan «Reponer» al llegar al mínimo.",
          "La receta muestra el costo en insumos y el margen sobre el precio particular.",
        ],
      },
    ],
  },
  {
    id: "transversal",
    titulo: "7 · Lo que debe cumplirse en todo el sistema",
    resumen:
      "No son pantallas, son reglas que usted notará en cualquier parte. Márquelas con lo que fue viendo a lo largo del recorrido.",
    pasos: [
      {
        id: "tra-1",
        quien: "todos",
        titulo: "«Salir» cierra la sesión",
        porque: "Los equipos de clínica se comparten por turno: al salir, no debe quedar nada de la persona anterior.",
        pasos: ["Con cualquier usuario, pulse «Salir», abajo a la izquierda.", "Entre con otro usuario distinto."],
        esperado: ["Vuelve al formulario de entrada sin recargar.", "Al entrar con otro no se ve nada del anterior."],
      },
      {
        id: "tra-2",
        quien: "todos",
        titulo: "Todos los selectores tienen buscador",
        porque: "Con 47 servicios o muchos pacientes, nadie debería recorrer una lista con el dedo.",
        pasos: [
          "Pruebe en el doctor de una cita, el servicio de una consulta y los filtros de agenda y gastos.",
          "Dentro de una ventana, abra un selector y pulse `Esc`.",
        ],
        esperado: [
          "La lista se reduce mientras escribe, sin distinguir tildes.",
          "`Esc` cierra la lista, no la ventana.",
        ],
      },
      {
        id: "tra-3",
        quien: "todos",
        titulo: "Avisos con color e icono",
        porque:
          "Rojo para errores, ámbar para advertencias, verde para confirmaciones y azul para información. El color vivo se reserva a los mensajes y al dato clínico; nunca decora.",
        pasos: ["Provoque un choque de agenda.", "Deje vacío un dato obligatorio en un formulario y guarde."],
        esperado: [
          "El choque sale ámbar con triángulo.",
          "El error de campo sale rojo, junto al campo.",
        ],
      },
      {
        id: "tra-4",
        quien: "todos",
        titulo: "El membrete de la clínica en cada impreso",
        porque:
          "Todo lo que se imprime empieza con el mismo membrete. Cambiarlo en Configuración lo cambia en todos los impresos a la vez.",
        pasos: [
          "Mire la vista previa de impresión de un presupuesto, un recibo, una factura, una receta, un documento, la agenda y un informe.",
        ],
        esperado: [
          "Todos llevan el logo y los datos de su clínica.",
          "El recibo (80 mm) lleva una versión compacta y centrada.",
        ],
      },
      {
        id: "tra-5",
        quien: "todos",
        titulo: "Teléfonos y búsquedas coherentes",
        porque: "Un teléfono se escribe, se guarda y se muestra siempre igual, y las búsquedas ignoran tildes en todas partes.",
        pasos: [
          "Mire los teléfonos en la lista de pacientes, el expediente, el recibo y las cuentas por cobrar.",
          "Busque con y sin tildes en pacientes, servicios y gastos.",
        ],
        esperado: ["Siempre el mismo formato `(809) 555-0100`.", "«gomez» y «Gómez» dan el mismo resultado."],
      },
    ],
  },
]

/** Todos los pasos, en orden de lectura. */
export const TODOS_LOS_PASOS: PasoGuia[] = SECCIONES.flatMap((s) => s.pasos)

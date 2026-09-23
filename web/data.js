// Capítulos del video (segundos) y sonidos del apéndice de fonética.
const VIDEO_ID = "zb5YFaoXpKw";

const CHAPTERS = [
  { t: 16,   title: "Palabras básicas" },
  { t: 204,  title: "Frases esenciales" },
  { t: 484,  title: "Frases temporales" },
  { t: 536,  title: "Las horas" },
  { t: 616,  title: "Días de la semana" },
  { t: 684,  title: "Meses del año" },
  { t: 880,  title: "Estaciones y artículos" },
  { t: 940,  title: "Indicadores de lugar" },
  { t: 1012, title: "Pronombres personales" },
  { t: 1188, title: "Números cardinales" },
  { t: 1468, title: "Números ordinales" },
  { t: 1604, title: "Familia y relaciones" },
  { t: 1824, title: "Partes del cuerpo" },
  { t: 2004, title: "Verbos (acciones)" },
  { t: 2272, title: "La casa y objetos" },
  { t: 2568, title: "El barrio y la ciudad" },
  { t: 2652, title: "Tiendas y edificios" },
  { t: 2744, title: "Transporte" },
  { t: 2788, title: "Alimentos y comidas" },
  { t: 3312, title: "Alfabeto" },
  { t: 3376, title: "Principales sonidos" },
];

const SOUNDS = [
  { group: "Vocales abiertas y cerradas", t: 3376, items: [
    ["é", "e abierta", "café"], ["ê", "e cerrada", "você"],
    ["ó", "o abierta", "avó"], ["ô", "o cerrada", "avô"] ] },
  { group: "L final", t: 3376, items: [
    ["l final de sílaba", "suena u", "Brasil"], ["l final", "suena u", "calma"] ] },
  { group: "Nasales finales", t: 3436, items: [
    ["am", "áun", "falaram"], ["em", "éin", "homem"], ["im", "in", "sim"],
    ["om", "óun", "com"], ["um", "un", "um"], ["ã", "a nasal", "irmã"], ["õ", "o nasal", "limões"] ] },
  { group: "T y D + i", t: 3480, items: [
    ["ti", "chi", "tia"], ["te final átona", "chi", "sorte"],
    ["di", "dji", "dia"], ["de final átona", "dji", "idade"] ] },
  { group: "S y Z", t: 3528, items: [
    ["s entre vocales", "zumbido", "casa"], ["z", "zumbido", "realizar"],
    ["ss", "s", "confessar"], ["s tras consonante", "s", "cansado"] ] },
  { group: "Vocales finales átonas", t: 3564, items: [
    ["o final", "u", "livro"], ["e final", "i", "livre"] ] },
  { group: "B, V, D", t: 3564, items: [
    ["da, do", "d fuerte", "dedo"], ["b", "b (casi p)", "bom"], ["v", "v labiodental", "vida"] ] },
  { group: "R", t: 3620, items: [
    ["r inicial", "casi j", "rosa"], ["rr", "casi j", "carro"] ] },
  { group: "X y AS", t: 3664, items: [
    ["x", "z", "exato"], ["x", "cs", "táxi"], ["x", "ss", "próximo"],
    ["x", "sh", "baixo"], ["as tónica final", "aish", "mas"] ] },
  { group: "NH, LH, CH, G, J", t: 3760, items: [
    ["nh", "ñ", "vinho"], ["lh", "ll", "filho"], ["ch", "sh inglés", "chamada"],
    ["ge, gi", "y rioplatense", "gesto"], ["j", "y rioplatense", "jamais"] ] },
];

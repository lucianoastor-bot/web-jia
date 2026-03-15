// lib/speakers-data.ts

export type Speaker = {
  name: string
  role: string
  institution: string
  bio: string
  photo: string
  date: string
  time: string
  place: string
}

export const SPEAKERS: Speaker[] = [

  {
    name: 'Alan Turing',
    role: 'Matemático y científico de la computación',
    institution: 'Universidad de Cambridge',
    bio: 'Padre de la informática y la inteligencia artificial. Formuló el Test de Turing y sentó las bases teóricas de la computación moderna.',
    photo: '/speakers/turing.png',
    date: '11 de junio',
    time: '18:00 hs',
    place: 'Salón de Actos',
  },

    {
    name: 'Homero Simpson',
    role: 'Inspector de seguridad nuclear',
    institution: 'Planta Nuclear de Springfield',
    bio: 'Experto en gestión de riesgos tecnológicos con décadas de experiencia en entornos de alta criticidad. Pensador lateral e innovador involuntario.',
    photo: '/speakers/homero.png',
    date: '12 de junio',
    time: '10:00 hs',
    place: 'Bar de Moe',
  },

  {
    name: 'Albert Einstein',
    role: 'Físico teórico',
    institution: 'Universidad de Princeton',
    bio: 'Desarrolló la teoría de la relatividad especial y general, transformando nuestra comprensión del espacio, el tiempo y la energía.',
    photo: '/speakers/einstein.png',
    date: '10 de junio',
    time: '10:00 hs',
    place: 'Salón de Actos',
  },

  {
    name: 'Rudolf Carnap',
    role: 'Filósofo y lógico',
    institution: 'Universidad de Chicago',
    bio: 'Referente del positivismo lógico y el Círculo de Viena. Sus aportes a la filosofía del lenguaje y la lógica siguen siendo fundamentales.',
    photo: '/speakers/carnap.png',
    date: '10 de junio',
    time: '12:00 hs',
    place: 'Salón de Actos',
  },
  {
    name: 'Stephen Hawking',
    role: 'Físico teórico y cosmólogo',
    institution: 'Universidad de Cambridge',
    bio: 'Pionero en el estudio de los agujeros negros y la cosmología. Advirtió tempranamente sobre los riesgos existenciales de la inteligencia artificial.',
    photo: '/speakers/hawking.png',
    date: '11 de junio',
    time: '10:00 hs',
    place: 'Salón de Actos',
  },

]

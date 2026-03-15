const EJES = [
  {
    num: '01',
    title: 'Inteligencia Artificial y educación',
    desc: 'Reflexiones sobre el impacto de la IA en los procesos de enseñanza y aprendizaje, la formación docente y las transformaciones en las instituciones educativas.',
  },
  {
    num: '02',
    title: 'IA y producción artística y cultural',
    desc: 'Análisis de las tensiones y posibilidades que la IA introduce en la creación artística, la industria cultural y los procesos de producción simbólica.',
  },
  {
    num: '03',
    title: 'IA, escritura y traducción',
    desc: 'Exploración del rol de la IA en la producción textual, la traducción automática y sus consecuencias para la escritura académica y literaria.',
  },
  {
    num: '04',
    title: 'Filosofía de la Inteligencia Artificial',
    desc: 'Abordajes filosóficos sobre la naturaleza de la IA, la conciencia, la agencia y los fundamentos epistemológicos de los sistemas inteligentes.',
  },
  {
    num: '05',
    title: 'Problemas éticos del uso de la IA',
    desc: 'Discusión sobre los dilemas éticos que plantea el desarrollo y uso de la IA: sesgos, responsabilidad, transparencia y derechos digitales.',
  },
  {
    num: '06',
    title: 'Impacto en la sociedad, la economía y el trabajo',
    desc: 'Estudio de las transformaciones que la IA genera en el mercado laboral, las estructuras económicas y la organización social.',
  },
  {
    num: '07',
    title: 'IA, vínculos, salud mental y redes sociales',
    desc: 'Análisis de los efectos de la IA en las relaciones interpersonales, la salud mental, el bienestar y el uso de plataformas digitales.',
  },
  {
    num: '08',
    title: 'Inteligencia Artificial: utopía y distopía',
    desc: 'Reflexiones sobre los imaginarios sociales, narrativas culturales y representaciones del futuro que rodean al desarrollo de la IA.',
  },
]

export default function Ejes() {
  return (
    <section className="ejes" id="ejes">
      <div className="ejes__inner">

        <div className="section__eyebrow">Temáticas</div>
        <h2 className="section__title">Ejes temáticos</h2>

        <div className="ejes__grid">
          {EJES.map((eje) => (
            <div key={eje.num} className="eje-card">
              <span className="eje-card__num">{eje.num}</span>
              <h3 className="eje-card__title">{eje.title}</h3>
              <p className="eje-card__desc">{eje.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

import Flashcards from './Flashcards.jsx'
import Quiz from './Quiz.jsx'
import Checklist from './Checklist.jsx'
import Chart from './Chart.jsx'
import Note from './Note.jsx'

// The renderer registry: a plain lookup from block type -> component. Adding a
// new block type later means writing one component and adding one line here —
// no changes to App or the data flow. Small adapters translate each block's
// fields into the component's props.
const RENDERERS = {
  flashcards: ({ block }) => <Flashcards cards={block.cards} />,
  quiz: ({ block }) => <Quiz questions={block.questions} />,
  checklist: ({ block }) => <Checklist block={block} />,
  chart: ({ block }) => <Chart block={block} />,
  note: ({ block }) => <Note block={block} />,
}

// Shown when the model sends a block type we have no renderer for. This is the
// UI half of "handle unexpected output" — an unknown block degrades to a small
// notice instead of a crash or a blank screen.
function Unsupported({ block }) {
  return (
    <div className="block-fallback">
      This part came back as an unsupported type ("{block.type}"), so it isn't shown.
    </div>
  )
}

const LABELS = {
  flashcards: 'Flashcards',
  quiz: 'Quiz',
  checklist: 'Checklist',
  chart: 'Chart',
  note: 'Key idea',
}

export default function StudySet({ data }) {
  return (
    <section className="set">
      <h2 className="set__title">{data.title}</h2>

      <div className="set__blocks">
        {data.blocks.map((block, i) => {
          const Renderer = block.unsupported ? Unsupported : RENDERERS[block.type] || Unsupported
          return (
            <div className="block" key={i} style={{ animationDelay: `${i * 60}ms` }}>
              {!block.unsupported && LABELS[block.type] && (
                <div className="block__label">{LABELS[block.type]}</div>
              )}
              <Renderer block={block} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

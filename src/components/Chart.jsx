// A minimal horizontal bar chart. No chart library, the data is simple and a
// dependency isn't worth it. I normalise each bar against the largest value so
// it fills the available width proportionally.
export default function Chart({ block }) {
  const max = Math.max(...block.data.map((d) => d.value), 1)

  return (
    <div className="chart">
      <div className="chart__title">{block.title}</div>
      <ul className="chart__bars">
        {block.data.map((d, i) => (
          <li className="bar" key={i}>
            <span className="bar__label">{d.label}</span>
            <span className="bar__track">
              <span
                className="bar__fill"
                style={{ width: `${Math.round((d.value / max) * 100)}%` }}
              />
            </span>
            <span className="bar__value">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

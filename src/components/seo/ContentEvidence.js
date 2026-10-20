import styles from './Guide.module.css';

export default function ContentEvidence({ evidence }) {
  return <section className={styles.evidence}>
    <h2>{evidence.title}</h2>
    <p>{evidence.intro}</p>
    <div className={styles.tableScroll} role="region" aria-label={evidence.title} tabIndex={0}>
      <table className={styles.evidenceTable}>
        <caption>{evidence.title}</caption>
        <thead><tr>{evidence.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
        <tbody>{evidence.rows.map(([label, ...cells]) => <tr key={label}><th scope="row">{label}</th>{cells.map(cell => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
    <p>{evidence.closing}</p>
  </section>;
}

import styles from './Guide.module.css';

export default function ContentEvidence({ evidence, mobileStacked = false }) {
  return <section className={styles.evidence}>
    <h2>{evidence.title}</h2>
    <p>{evidence.intro}</p>
    <div className={`${styles.tableScroll} ${mobileStacked ? styles.mobileStacked : ''}`} role="region" aria-label={evidence.title} tabIndex={0}>
      <table className={styles.evidenceTable} role="table">
        <caption>{evidence.title}</caption>
        <thead role="rowgroup"><tr role="row">{evidence.columns.map(column => <th key={column} scope="col" role="columnheader">{column}</th>)}</tr></thead>
        <tbody role="rowgroup">{evidence.rows.map(([label, ...cells]) => <tr key={label} role="row"><th scope="row" role="rowheader">{mobileStacked && <span className={styles.mobileLabel} aria-hidden="true">{evidence.columns[0]}</span>}{label}</th>{cells.map((cell, index) => <td key={cell} role="cell">{mobileStacked && <span className={styles.mobileLabel} aria-hidden="true">{evidence.columns[index + 1]}</span>}{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
    <p>{evidence.closing}</p>
  </section>;
}

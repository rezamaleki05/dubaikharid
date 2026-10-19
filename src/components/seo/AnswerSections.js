import Link from 'next/link';
import styles from './Guide.module.css';

export default function AnswerSections({ answers, links = [] }) {
  return <div className={styles.answers}>
    {answers.map(([question, answer], index) => <section key={question} className={styles.answer}>
      <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div><h2>{question}</h2><p>{answer}</p></div>
    </section>)}
    {links.length > 0 && <nav aria-label="راهنماها و محصولات مرتبط" className={styles.related}>
      {links.map(([href, label]) => <Link href={href} key={href}>{label} ←</Link>)}
    </nav>}
  </div>;
}

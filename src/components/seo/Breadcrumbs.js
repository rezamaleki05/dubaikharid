import Link from 'next/link';
import styles from './Seo.module.css';

export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="مسیر صفحه" className={styles.breadcrumbs}>
      <ol>
        {items.map((item, index) => (
          <li key={item.path}>
            {index < items.length - 1 ? <Link href={item.path}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

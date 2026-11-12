"use client";
import Link from "next/link";
import { useRef } from "react";
import styles from "./AccessoryNavigation.module.css";
export default function AccessoryNavigation({ onNavigate }) {
  const ref = useRef(null);
  const close = () => {
    if (ref.current) ref.current.open = false;
    onNavigate?.();
  };
  return (
    <li className={styles.item}>
      <details ref={ref}>
        <summary>
          لپتاپ استوک <span aria-hidden="true">⌄</span>
        </summary>
        <div className={styles.panel}>
          <Link href="/stock-laptops" onClick={close}>
            همه لپتاپ‌های استوک
          </Link>
          <Link href="/laptop-accessories" onClick={close}>
            قطعات و لوازم لپ تاپ
          </Link>
        </div>
      </details>
    </li>
  );
}

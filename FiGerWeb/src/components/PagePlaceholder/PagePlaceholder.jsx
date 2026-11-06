import styles from './PagePlaceholder.module.css';

export default function PagePlaceholder({ title, subtitle, children }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </header>
      <div className={styles.box}>
        <p>Em construção.</p>
        {children}
      </div>
    </div>
  );
}

import Link from 'next/link';

import { getLatestAnnouncements } from './lib/announcements';
import { AnnouncementsCarousel } from './components/AnnouncementsCarousel';
import styles from './page.module.css';

export default async function HomePage() {
  const announcements = await getLatestAnnouncements();

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.brandTitle}>AIENC</h1>
          <p className={styles.brandSubtitle}>
            Asociación de Iglesias Evangélicas del Norte de Colombia
          </p>

          <p className={styles.lead}>
            Consulta anuncios recientes y accede a información institucional
            desde una interfaz más sólida y profesional.
          </p>

          <div className={styles.actions}>
            <Link href="/announcements" className={styles.primaryAction}>
              Ver anuncios
            </Link>
            <Link href="/info" className={styles.secondaryAction}>
              Información
            </Link>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Anuncios recientes</span>
            <strong className={styles.metricValue}>{announcements.length}</strong>
            <p className={styles.metricText}>
              Publicaciones destacadas cargadas desde el sistema actual.
            </p>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Plataforma oficial</span>
            <strong className={styles.metricValue}>AIENC</strong>
            <p className={styles.metricText}>
              Comunicaciones verificadas por la administración de la Asociación.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.featured}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>Contenido destacado</span>
            <h2 className={styles.sectionTitle}>Últimos anuncios publicados</h2>
          </div>
          <p className={styles.sectionText}>
            La vitrina principal del portal se enfoca en comunicados recientes
            con una lectura más clara y un recorrido visual mejor definido.
          </p>
        </div>

        <div className={styles.featuredGrid}>
          <div className={styles.carouselPanel}>
            <AnnouncementsCarousel announcements={announcements} />
          </div>

          <aside className={styles.sidePanel}>
            <Link href="/info" className={styles.sideCard}>
              <span className={styles.sideEyebrow}>Institucional</span>
              <h3 className={styles.sideTitle}>Información general</h3>
              <p className={styles.sideText}>
                Datos base del proyecto, contacto y referencias institucionales.
              </p>
            </Link>

            <Link href="/announcements" className={styles.sideCard}>
              <span className={styles.sideEyebrow}>Actualidad</span>
              <h3 className={styles.sideTitle}>Todos los anuncios</h3>
              <p className={styles.sideText}>
                Listado completo de comunicados con filtros por título y fecha.
              </p>
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

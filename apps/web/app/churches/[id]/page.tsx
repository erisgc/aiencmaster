import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPublicChurchById } from '@/app/lib/churches';
import styles from './page.module.css';

type ChurchPageProps = {
  params: Promise<{ id: string }>;
};

async function loadChurch(id: string) {
  try {
    return await getPublicChurchById(id);
  } catch (error) {
    if (error instanceof Error && error.message.includes('API error 404')) {
      notFound();
    }

    throw error;
  }
}

export default async function ChurchDetailPage({ params }: ChurchPageProps) {
  const { id } = await params;
  const church = await loadChurch(id);

  const mapsHref =
    church.mapsUrl ??
    (church.mapsLat != null && church.mapsLng != null
      ? `https://www.google.com/maps?q=${church.mapsLat},${church.mapsLng}`
      : null);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/churches" className={styles.backLink}>
          Volver a iglesias
        </Link>

        <section className={styles.hero}>
          {church.coverImageUrl ? (
            <Image
              src={church.coverImageUrl}
              alt={`Portada de ${church.name}`}
              fill
              className={styles.heroImg}
              sizes="100vw"
              priority
            />
          ) : (
            <div className={styles.heroFallback} aria-hidden="true" />
          )}

          <div className={styles.heroOverlay} />

          <div className={styles.heroInner}>
            <div className={styles.avatar}>
              {church.mainImageUrl ? (
                <Image
                  src={church.mainImageUrl}
                  alt={church.name}
                  fill
                  className={styles.avatarImg}
                  sizes="112px"
                />
              ) : (
                <div className={styles.avatarFallback} aria-hidden="true" />
              )}
            </div>

            <div className={styles.heroText}>
              <p className={styles.eyebrow}>Iglesia asociada</p>
              <h1 className={styles.title}>{church.name}</h1>
              <p className={styles.subtitle}>{church.city}</p>

              <div className={styles.heroMeta}>
                {church.address && <span>{church.address}</span>}
                {church.avgAttendance != null && (
                  <span>Promedio de asistencia: {church.avgAttendance}</span>
                )}
              </div>

              {mapsHref && (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.mapsLink}
                >
                  Ver ubicacion en Maps
                </a>
              )}
            </div>
          </div>
        </section>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Informacion general</h2>

            <dl className={styles.details}>
              <div className={styles.detailRow}>
                <dt>Ciudad</dt>
                <dd>{church.city}</dd>
              </div>

              {church.address && (
                <div className={styles.detailRow}>
                  <dt>Direccion</dt>
                  <dd>{church.address}</dd>
                </div>
              )}

              {church.representatives && (
                <div className={styles.detailRow}>
                  <dt>Representantes</dt>
                  <dd>{church.representatives}</dd>
                </div>
              )}

              {church.avgAttendance != null && (
                <div className={styles.detailRow}>
                  <dt>Promedio de asistencia</dt>
                  <dd>{church.avgAttendance}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Ubicacion</h2>

            {church.mapsLat != null && church.mapsLng != null ? (
              <div className={styles.coords}>
                <div className={styles.detailRow}>
                  <span>Latitud</span>
                  <strong>{church.mapsLat}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Longitud</span>
                  <strong>{church.mapsLng}</strong>
                </div>
              </div>
            ) : (
              <p className={styles.emptyText}>Esta iglesia aun no tiene una ubicacion publica registrada.</p>
            )}

            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className={styles.secondaryLink}
              >
                Abrir en Google Maps
              </a>
            )}
          </section>
        </div>

        {church.directors && church.directors.length > 0 && (
          <section className={styles.directorsSection}>
            <header className={styles.directorsHead}>
              <h2 className={styles.cardTitle}>Directores</h2>
              <span className={styles.directorsCount}>
                {church.directors.length}{' '}
                {church.directors.length === 1 ? 'persona' : 'personas'}
              </span>
            </header>

            <ul className={styles.directorsGrid}>
              {church.directors.map((d) => (
                <li key={d.id} className={styles.directorCard}>
                  <div className={styles.directorAvatarWrap}>
                    {d.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.photoUrl}
                        alt={d.displayName}
                        className={styles.directorAvatar}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.directorAvatarFallback}>
                        {d.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.directorBody}>
                    <strong className={styles.directorName}>
                      {d.displayName}
                    </strong>
                    {d.role && (
                      <span className={styles.directorRole}>{d.role}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

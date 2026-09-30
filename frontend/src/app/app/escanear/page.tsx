import { redirect } from 'next/navigation';

// The scan flow lives at /app/escaneo. /escanear stays as an alias so older
// bookmarks and shared links redirect instead of 404.
export default function EscanearAlias() {
  redirect('/app/escaneo');
}

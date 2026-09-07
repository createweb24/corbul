import Script from "next/script";

/**
 * Aplică alegerea explicită de temă înainte ca pagina să devină interactivă.
 *
 * Împărțirea rolurilor, ca tema să fie corectă în orice situație:
 *
 * 1. Preferința SISTEMULUI o rezolvă CSS-ul singur, prin
 *    `@media (prefers-color-scheme: light)` peste `:root:not([data-theme])`
 *    (globals.css §2b). Fără JavaScript, fără licărire, pe orice pagină —
 *    inclusiv pe cele livrate prin streaming.
 * 2. ALEGEREA cititorului (localStorage) o aplică acest script, punând
 *    `data-theme` pe <html>. Are prioritate în CSS față de regula de media.
 *
 * Se folosește `next/script` cu `beforeInteractive`, nu o etichetă <script>
 * scrisă de mână: Next o așază în învelișul inițial al documentului. O
 * etichetă obișnuită randată în <body> ajunge, pe paginile cu streaming
 * (404, rute dinamice), doar în payload-ul RSC și e inserată prin DOM — iar
 * scripturile inserate astfel nu se execută niciodată.
 */

export const THEME_STORAGE_KEY = "corbul_theme";

const SCRIPT = `(function(){try{
var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
if(s==="light"||s==="dark"){document.documentElement.setAttribute("data-theme",s)}
}catch(e){}})();`;

export function ThemeScript() {
  return (
    <Script
      id="corbul-theme"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}

export default ThemeScript;

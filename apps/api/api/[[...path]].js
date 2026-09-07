/**
 * Punctul de intrare când API-ul rulează ca funcție pe Vercel.
 *
 * Aceeași aplicație Nest ca `src/main.ts`, doar că nu ascultă pe un port:
 * Vercel îi dă cererea direct instanței Express dinăuntru. Se importă din
 * `dist/`, adică din codul deja compilat de `nest build` — Nest are nevoie de
 * metadatele de tip emise de TypeScript, pe care compilatorul rapid al
 * platformei nu le produce.
 *
 * Aplicația se construiește o singură dată per instanță și se refolosește la
 * cererile următoare (promisiunea e memorată, ca două cereri simultane pe o
 * instanță rece să nu pornească două aplicații).
 */
const { createApp } = require('../dist/bootstrap');

let starting;

function server() {
  if (!starting) {
    starting = createApp().then(async (app) => {
      await app.init();
      return app.getHttpAdapter().getInstance();
    });
  }
  return starting;
}

module.exports = async function handler(req, res) {
  const express = await server();
  express(req, res);
};

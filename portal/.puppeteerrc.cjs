const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Configura o diretório de cache do Puppeteer/Chrome dentro do projeto para persistir no Render
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};

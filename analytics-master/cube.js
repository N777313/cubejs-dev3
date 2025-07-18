const { query } = require("./fetch");

module.exports = {
  telemetry: false, // Отключаем отправку данных в Cube.js

  // Уникальная версия схемы для автоинвалидации кэша
  schemaVersion: async () => {
    try {
      const formItemTemplates = await query(`SELECT id FROM form_item_template`);
      const config = await query(`SELECT \`key\`, value FROM app_config_variable`);

      const formIds = formItemTemplates.map(r => r.id).join(',');
      const configHash = config.map(c => `${c.key}-${c.value}`).join(',');

      return `${formIds}-${configHash}`;
    } catch (err) {
      console.error("Ошибка в schemaVersion:", err);
      return 'local-dev-default-version';
    }
  },

  // Простая авторизация для разработки
  checkAuth: async (req, authorization) => {
    req.securityContext = {
      user: 1 // заглушка: "авторизованный пользователь"
    };
  },

  // Можно добавить другие параметры здесь
  // devServer: true,
  // logger: (msg, level) => { ... },
};

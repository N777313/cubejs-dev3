// Server options go here: https://cube.dev/docs/@cubejs-backend-server-core#options-reference
const UserError = require('@cubejs-backend/api-gateway/dist/src/UserError');
const cookieParser = require('cookie-parser')
const request = require('request')
const {query} = require("./fetch");
const tokens = [];

module.exports = {
  telemetry: false,
  schemaVersion: async ({ securityContext }) => {
    const formItemTemplates = await query(`
      SELECT id FROM form_item_template
    `);
    const config = await query(`
      SELECT \`key\`, value FROM app_config_variable
    `);

    return formItemTemplates.map(r => r.id).join(',') + config.map(c => `${c.key}-${c.value}`).join(',');
  },

  checkAuth: async (req, authorization) => {
    if (process.env.NODE_ENV === 'production' && process.env.AUTH_SERVICE_URL) {
      cookieParser()(req, null, () => {
      });
      const authCookieValue = req.cookies[process.env.AUTH_COOKIE_NAME];
      if (!authCookieValue) {
        throw new UserError("Not Authorized")
      }
      if (!tokens.includes(authCookieValue)) {
        const cj = request.jar();
        const authCookie = request.cookie(`${process.env.AUTH_COOKIE_NAME}=${authCookieValue}`)
        cj.setCookie(authCookie, process.env.AUTH_SERVICE_URL)
        request(process.env.AUTH_SERVICE_URL, {
          method: 'GET',
          jar: cj
        }, function (err, httpResponse, body) {
          if (err) {
            throw new UserError("Not Authorized")
          }
          tokens.push(authCookieValue);
          req.securityContext = {
            user: JSON.parse(body)
          }

        })
      }
    } else {
      req.securityContext = {
        user: 1
      }
    }
  }
};

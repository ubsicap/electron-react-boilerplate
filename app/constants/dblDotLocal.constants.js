export const dblDotLocalConfig = {
  getHttpDblDotLocalBaseUrl,
  FLASK_API_DEFAULT: 'http://127.0.0.1:44151',
  HTML_BASE_URL_REQUEST: 'DBL_DOT_LOCAL_CONFIG_HTML_BASE_URL_REQUEST',
  HTML_BASE_URL_RESPONSE: 'DBL_DOT_LOCAL_CONFIG_HTML_BASE_URL_RESPONSE',
  CONFIG_REQUEST_FAILURE: 'DBL_DOT_LOCAL_CONFIG_REQUEST_FAILURE'
};
export default dblDotLocalConfig;

function getHttpDblDotLocalBaseUrl() {
  return dblDotLocalConfig.FLASK_API_DEFAULT;
}

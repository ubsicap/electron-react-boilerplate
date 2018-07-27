import { dblDotLocalConfig } from '../constants/dblDotLocal.constants';
import { dblDotLocalService } from '../services/dbl_dot_local.service';

export const dblDotLocalConfigActions = {

};

export default dblDotLocalConfigActions;

export function loadHtmlBaseUrl() {
  return async dispatch => {
    dispatch(requestBaseUrl());
    try {
      const readable = await dblDotLocalService.htmlBaseUrl();
      const dblBaseUrl = await readable.text();
      dispatch(success(dblBaseUrl));
    } catch (readableError) {
      const errorMsg = await readableError.text();
      dispatch(failure(errorMsg));
    }
  };
  function requestBaseUrl() {
    return { type: dblDotLocalConfig.HTML_BASE_URL_REQUEST };
  }
  function success(dblBaseUrl) {
    return { type: dblDotLocalConfig.HTML_BASE_URL_RESPONSE, dblBaseUrl };
  }
  function failure(error) {
    return { type: dblDotLocalConfig.CONFIG_REQUEST_FAILURE, error };
  }
}

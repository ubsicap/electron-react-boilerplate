import uuidv1 from 'uuid/v1';
import { history } from '../store/configureStore';
import { reportConstants } from '../constants/report.constants';
import { navigationConstants } from '../constants/navigation.constants';
import { reportService } from '../services/report.service';
import { utilities } from '../utils/utilities';

export const reportActions = {
  openEntryReports,
  closeEntryReports,
  setupReportListeners,
  startReport,
  selectReportsToRun,
};

export function openEntryReports(bundleId) {
  return dispatch => {
    const url =
    utilities.buildRouteUrl(
      navigationConstants.NAVIGATION_ENTRY_REPORTS,
      { bundleId }
    );
    history.push(url);
    dispatch({ type: reportConstants.ENTRY_REPORTS_OPENED, bundleId });
    dispatch(setupReportListeners());
  };
}

export function closeEntryReports(bundleId) {
  history.push(navigationConstants.NAVIGATION_BUNDLES);
  return { type: reportConstants.ENTRY_REPORTS_OPENED, bundleId };
}

export function setupReportListeners() {
  return (dispatch, getState) => {
    const { authentication: { eventSource } } = getState();
    if (!eventSource) {
      console.error('EventSource undefined');
      return;
    }
    const dispatchListenStorerReport = (e) => dispatch(listenStorerReport(e));

    const listeners = {
      'storer/report': dispatchListenStorerReport
    };
    Object.keys(listeners).forEach((evType) => {
      const handler = listeners[evType];
      eventSource.addEventListener(evType, handler);
    });
    return dispatch({ type: reportConstants.REPORT_LISTENERS_STARTED, listeners });
  };
}

export function startReport(bundleId, reportType) {
  const uuid1 = uuidv1();
  const referenceToken = uuid1.substr(0, 5);
  switch (reportType) {
    case 'ChecksUseContent': {
      reportService.checksUseContent(bundleId, referenceToken);
      break;
    }
    default: {
      throw new Error(`Unhandled reportType: ${reportType}`);
    }
  }
  return {
    type: reportConstants.REPORT_STARTED, bundleId, referenceToken, reportType
  };
}

/*
  [2019-03-27 15:28:54,356] INFO storer: storer, report, 1a01, 13375b5d-5b8a-4d8a-8f0f-32397484fa17
 */
function listenStorerReport(event) {
  return (dispatch) => {
    const data = JSON.parse(event.data);
    const [referenceToken, reportId] = data.args;
    dispatch({
      type: reportConstants.REPORT_COMPLETED, referenceToken, reportId, date: Date.now()
    });
  };
}

export function selectReportsToRun(bundleId, selectedReportIds) {
  return { type: reportConstants.REPORTS_SELECTED_TO_RUN, bundleId, selectedReportIds };
}

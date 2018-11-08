import { bundleResourceManagerConstants } from '../constants/bundleResourceManager.constants';
import { utilities } from '../utils/utilities';

const initialState = {
  bundleId: null,
  mode: null,
  publicationsHealth: null
};

export function bundleManageResources(state = initialState, action) {
  switch (action.type) {
    case bundleResourceManagerConstants.OPEN_RESOURCE_MANAGER: {
      const { bundleId, mode } = action;
      return {
        ...initialState,
        bundleId,
        mode
      };
    }
    case bundleResourceManagerConstants.CLOSE_RESOURCE_MANAGER: {
      return initialState;
    }
    case bundleResourceManagerConstants.GET_MANIFEST_RESOURCES_RESPONSE: {
      const { manifestResources: rawManifestResources, storedFiles } = action;
      return {
        ...state,
        rawManifestResources,
        storedFiles
      };
    }
    case bundleResourceManagerConstants.UPDATE_MANIFEST_RESOURCES_REQUEST: {
      const {
        bundleId,
        fileToContainerPaths
      } = action;
      return {
        ...state,
        loading: true,
        progress: 0,
        updatingManifest: {
          bundleId,
          fileToContainerPaths
        }
      };
    }
    case bundleResourceManagerConstants.UPDATE_MANIFEST_RESOURCE_RESPONSE: {
      const {
        filePath,
      } = action;
      const { fileToContainerPaths, filesCompleted: filesCompletedPrev = [] }
       = state.updatingManifest;
      const filesCompleted = [...filesCompletedPrev, filePath];
      const filesDone = filesCompleted.length;
      const filesTotal = Object.keys(fileToContainerPaths).length;
      const progress = utilities.calculatePercentage(filesDone, filesTotal);
      const loading = state.loading && filesDone < filesTotal;
      return {
        ...state,
        loading,
        progress,
        updatingManifest: {
          ...state.updatingManifest,
          filesCompleted
        }
      };
    }
    case bundleResourceManagerConstants.UPDATE_MANIFEST_RESOURCE_DONE: {
      return {
        ...state,
        loading: false
      };
    }
    case bundleResourceManagerConstants.GET_BUNDLE_PUBLICATIONS_HEALTH_ERROR: {
      const {
        error, publications, errorMessage, goFix
      } = action;
      return {
        ...state,
        publicationsHealth: {
          error, publications, errorMessage, goFix
        }
      };
    }
    case bundleResourceManagerConstants.GET_BUNDLE_PUBLICATIONS_HEALTH_SUCCESS: {
      const { publications, medium, message, wizardsResults } = action;
      return {
        ...state,
        publicationsHealth: { publications, medium, message, wizardsResults }
      };
    }
    default: {
      return state;
    }
  }
}

export default bundleManageResources;
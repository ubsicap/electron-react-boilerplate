import { bundleResourceManagerConstants } from '../constants/bundleResourceManager.constants';
import { bundleConstants } from '../constants/bundle.constants';
import { utilities } from '../utils/utilities';
import { bundleEditMetadataConstants } from '../constants/bundleEditMetadata.constants';

const initialState = {
  isStoreMode: true,
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
        mode,
        autoSelectAllResources: mode === 'download'
      };
    }
    case bundleResourceManagerConstants.CLOSE_RESOURCE_MANAGER: {
      return initialState;
    }
    case bundleEditMetadataConstants.CLOSE_EDIT_METADATA: {
      return initialState;
    }
    case bundleConstants.UPDATE_BUNDLE: {
      const {
        mode,
        manifestResources: updatedManifestResources,
        storedFiles: updatedStoredFiles
      } = action.bundle;
      const { manifestResources: origManifestResources = {}, storedFiles: origStoredFiles = {} } = state;
      if (action.bundle.id !== state.bundleId && !(action.bundle.id in origManifestResources)) {
        return state;
      }
      const isStoreMode = mode === 'store';
      const bundleId = action.bundle.id;
      const origBundleManifestResources = origManifestResources[bundleId] || [];
      const bundleManifestResources = (updatedManifestResources.length === origBundleManifestResources.length &&
        Object.keys(updatedStoredFiles).length === Object.keys(origStoredFiles).length) ?
        state.bundleManifestResources : { rawManifestResources: updatedManifestResources, storedFiles: updatedStoredFiles };
      const manifestResources = { ...origManifestResources, [bundleId]: bundleManifestResources };
      return {
        ...state,
        isStoreMode,
        manifestResources
      };
    }
    case bundleResourceManagerConstants.GET_MANIFEST_RESOURCES_RESPONSE: {
      const { manifestResources: rawManifestResources, storedFiles, bundleId } = action;
      const { manifestResources: manifestResourcesOrig = {} } = state;
      const bundleManifestResources = { rawManifestResources, storedFiles };
      const manifestResources = { ...manifestResourcesOrig, [bundleId]: bundleManifestResources };
      return {
        ...state,
        manifestResources
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
    case bundleConstants.CREATE_FROM_DBL_REQUEST: {
      return {
        ...state,
        fetchingMetadata: true
      };
    }
    case bundleConstants.CREATE_FROM_DBL_SUCCESS: {
      return {
        ...state,
        fetchingMetadata: false
      };
    }
    case bundleConstants.CREATE_FROM_DBL_ERROR: {
      return {
        ...state,
        fetchingMetadata: false
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
      const {
        publications, medium, message, wizardsResults
      } = action;
      return {
        ...state,
        publicationsHealth: {
          publications, medium, message, wizardsResults
        }
      };
    }
    case bundleResourceManagerConstants.MAPPER_REPORT_SUCCESS: {
      const {
        uris, direction, report, options, overwrites
      } = action;
      const { mapperReports: mapperReportsOrig } = state;
      return {
        ...state,
        mapperReports: {
          ...mapperReportsOrig,
          [direction]: {
            uris, report, options, overwrites
          }
        }
      };
    }
    case bundleResourceManagerConstants.MAPPERS_SELECTED: {
      const { direction, mapperIds } = action;
      const { selectedMappers: selectedMappersOrig } = state;
      return {
        ...state,
        selectedMappers: { ...selectedMappersOrig, [direction]: mapperIds }
      };
    }
    case bundleResourceManagerConstants.RESOURCES_SELECTED: {
      const { selectedResourceIds } = action;
      return {
        ...state,
        selectedResourceIds,
        autoSelectAllResources: false
      };
    }
    case bundleResourceManagerConstants.REVISIONS_SELECTED: {
      const { selectedRevisionIds } = action;
      return {
        ...state,
        selectedRevisionIds
      };
    }
    case bundleResourceManagerConstants.UPDATE_ADDED_FILEPATHS: {
      const { addedFilePaths, fullToRelativePaths } = action;
      return {
        ...state,
        addedFilePaths,
        fullToRelativePaths
      };
    }
    case bundleResourceManagerConstants.UPDATE_FILE_STATS_SIZES: {
      const { fileSizes } = action;
      return {
        ...state,
        fileSizes
      };
    }
    default: {
      return state;
    }
  }
}

export default bundleManageResources;


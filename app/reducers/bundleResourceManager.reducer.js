import path from 'path';
import { bundleResourceManagerConstants } from '../constants/bundleResourceManager.constants';

const initialState = {
  bundleId: null,
  mode: null
};

export function bundleManageResources(state = initialState, action) {
  switch (action.type) {
    case bundleResourceManagerConstants.OPEN_RESOURCE_MANAGER: {
      const { bundleId, mode } = action;
      return {
        bundleId,
        mode
      };
    }
    case bundleResourceManagerConstants.CLOSE_RESOURCE_MANAGER: {
      return initialState;
    }
    case bundleResourceManagerConstants.MANIFEST_RESOURCES_RESPONSE: {
      const { manifestResources: rawManifestResources, storedFiles } = action;
      return {
        ...state,
        rawManifestResources,
        storedFiles
      };
    }
    default: {
      return state;
    }
  }
}

export default bundleManageResources;

import { bundleEditMetadataConstants } from '../constants/bundleEditMetadata.constants';

const initialState = {
  editingMetadata: null,
  formStructure: [],
  activeFormInputs: {},
  activeFormEdits: {}
};

const initialActiveFormState = {
  activeFormInputs: {},
  activeFormEdits: {},
  formFieldIssues: null,
  errorTree: null,
};

function changeStateForNewActiveForm(state, newState) {
  const { editingMetadata, formStructure } = state;
  return {
    editingMetadata,
    formStructure,
    ...initialActiveFormState,
    ...newState
  };
}

export function bundleEditMetadata(state = initialState, action) {
  switch (action.type) {
    case bundleEditMetadataConstants.OPEN_EDIT_METADATA: {
      return {
        ...state,
        editingMetadata: action.bundleId
      };
    }
    case bundleEditMetadataConstants.CLOSE_EDIT_METADATA: {
      return initialState;
    }
    case bundleEditMetadataConstants.METADATA_FILE_SHOW_REQUEST: {
      return { ...state, requestingShowMetadataFile: true };
    }
    case bundleEditMetadataConstants.METADATA_FILE_SAVED: {
      if (state.requestingShowMetadataFile) {
        return { ...state, showMetadataFile: action.metadataFile, requestingShowMetadataFile: false };
      }
      return state;
    }
    case bundleEditMetadataConstants.METADATA_FORM_STRUCTURE_REQUEST: {
      return {
        ...state,
        formStructureLoading: action.bundleId
      };
    }
    case bundleEditMetadataConstants.METADATA_FORM_STRUCTURE_UPDATED: {
      return {
        ...state,
        formStructure: action.formStructure,
        formStructureLoading: null
      };
    }
    case bundleEditMetadataConstants.METADATA_FORM_INPUTS_LOADED: {
      const { formKey, inputs } = action;
      const activeFormInputs = { [formKey]: inputs };
      return changeStateForNewActiveForm(state, { activeFormInputs });
    }
    case bundleEditMetadataConstants.METADATA_FORM_INPUT_EDITED: {
      const { inputName, newValue } = action;
      const activeFormEdits = { ...state.activeFormEdits, [inputName]: newValue };
      return {
        ...state,
        activeFormEdits
      };
    }
    case bundleEditMetadataConstants.METADATA_FORM_INSTANCE_DELETE_PROMPT_CONFIRM: {
      const { promptConfirm = true } = action;
      return {
        ...state,
        activeFormConfirmingDelete: promptConfirm
      };
    }
    case bundleEditMetadataConstants.METADATA_FORM_INSTANCE_DELETE_REQUEST: {
      return {
        ...state,
        activeFormDeleting: true
      };
    }
    case bundleEditMetadataConstants.METADATA_FORM_INSTANCE_DELETE_SUCCESS: {
      return {
        ...state,
        activeFormDeleting: false
      };
    }
    case bundleEditMetadataConstants.SAVE_METADATA_REQUEST: {
      const moveNext = action.moveNextStep;
      return {
        ...state,
        requestingSaveMetadata: true,
        shouldSaveActiveForm: true,
        wasMetadataSaved: false,
        moveNext
      };
    }
    case bundleEditMetadataConstants.SAVE_METADATA_SUCCESS: {
      return {
        ...state,
        requestingSaveMetadata: false,
        wasMetadataSaved: true,
        editedBundleId: action.bundleId,
        shouldSaveActiveForm: false
      };
    }
    case bundleEditMetadataConstants.SAVE_METADATA_FAILED: {
      const { error = {} } = action;
      const { field_issues: fieldIssues = [] } = error;
      const formFieldIssues = fieldIssues.reduce((acc, issue) => {
        const { formKey } = action;
        const [name, rule, value] = issue;
        const fieldError = { name, rule, value };
        const { [formKey]: formErrors = {} } = acc;
        return { ...acc, [formKey]: { ...formErrors, [name]: fieldError } };
      }, {});
      const errorTree = getErrorTree(formFieldIssues);
      return {
        ...state,
        requestingSaveMetadata: false,
        wasMetadataSaved: false,
        couldNotSaveMetadataMessage: null, /* todo */
        formFieldIssues,
        errorTree
      };
    }
    default: {
      return state;
    }
  }
}

function getParentErrorBranches(formKey, formErrors) {
  const branchKeys = formKey.split('/').reduce((acc, part) => {
    if (acc.length === 0) {
      return [part];
    }
    const lastKey = acc[acc.length - 1];
    return [...acc, `${lastKey}/${part}`];
  }, []);
  const parentErrorBranches = branchKeys.reduce(
    (acc, branchKey) => ({ ...acc, [branchKey]: { [formKey]: formErrors } }),
    {}
  );
  return parentErrorBranches;
}

function getErrorTree(formFieldIssues) {
  const errorTree = Object.keys(formFieldIssues).reduce(
    (accTree, formErrorEndpoint) => {
      const formErrors = formFieldIssues[formErrorEndpoint];
      const parentErrorBranches = getParentErrorBranches(formErrorEndpoint, formErrors);
      const combinedErrors = Object.keys(parentErrorBranches).reduce((accErrors, branchKey) => {
        const origErrors = accTree[branchKey] || {};
        const newErrors = parentErrorBranches[branchKey];
        return { ...accErrors, [branchKey]: { ...origErrors, ...newErrors } };
      }, {});
      return combinedErrors;
    },
    {}
  );
  return errorTree;
}

export default bundleEditMetadata;

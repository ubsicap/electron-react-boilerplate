import { bundleEditMetadataConstants } from '../constants/bundleEditMetadata.constants';
import editMetadataService from '../services/editMetadata.service';
import { bundleConstants } from '../constants/bundle.constants';
import { bundleResourceManagerConstants } from '../constants/bundleResourceManager.constants';
import { uploadFormConstants } from '../constants/uploadForm.constants';

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
  errorTree: null
};

function changeStateForNewActiveForm(state, newState) {
  const {
    editingMetadata,
    bundleToEdit,
    formStructure,
    metadataOverrides,
    formFieldIssues,
    errorTree
  } = state;
  return {
    editingMetadata,
    formStructure,
    metadataOverrides,
    ...initialActiveFormState,
    bundleToEdit,
    formFieldIssues,
    errorTree,
    ...newState
  };
}

export function bundleEditMetadata(state = initialState, action) {
  switch (action.type) {
    case bundleEditMetadataConstants.OPEN_EDIT_METADATA_REQUEST: {
      return {
        ...initialState,
        requestingRevision: action.bundleId,
        moveNext: action.moveNextStep
      };
    }
    case uploadFormConstants.UPLOAD_FORM_OPENED:
    case bundleEditMetadataConstants.OPEN_EDIT_METADATA: {
      const { bundleToEdit, bundleId: editingMetadata } = action;
      const { formFieldIssues, errorTree } = getFormErrorData(bundleToEdit);
      const [currentFormWithErrors, nextFormWithErrors] = Object.keys(
        formFieldIssues
      );
      const moveNext =
        action.moveNextStep ||
        (currentFormWithErrors ? { formKey: currentFormWithErrors } : null);
      return {
        ...state,
        requestingRevision: null,
        moveNext,
        editingMetadata,
        bundleToEdit,
        formFieldIssues,
        errorTree,
        currentFormWithErrors,
        nextFormWithErrors
      };
    }
    case bundleResourceManagerConstants.CLOSE_RESOURCE_MANAGER: {
      return initialState;
    }
    case uploadFormConstants.UPLOAD_FORM_CLOSED:
    case bundleEditMetadataConstants.CLOSE_EDIT_METADATA: {
      return initialState;
    }
    case bundleEditMetadataConstants.SET_EDIT_METADATA_MOVE_NEXT: {
      const { moveNextStep: moveNext } = action;
      return { ...state, moveNext };
    }
    case bundleEditMetadataConstants.METADATA_FILE_SHOW_REQUEST: {
      return {
        ...state,
        requestingShowMetadataFile: true,
        showMetadataFile: undefined
      };
    }
    case bundleEditMetadataConstants.METADATA_FILE_SAVED: {
      if (state.requestingShowMetadataFile) {
        return {
          ...state,
          showMetadataFile: action.metadataFile,
          requestingShowMetadataFile: false
        };
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
      const { metadataOverrides } = state;
      const formInputs = editMetadataService.getFormInputsWithOverrides(
        formKey,
        inputs,
        metadataOverrides
      );
      const activeFormInputs = { [formKey]: formInputs };
      const {
        currentFormWithErrors,
        nextFormWithErrors
      } = getNavigationFormsWithErrors(formKey);
      return changeStateForNewActiveForm(state, {
        activeFormInputs,
        currentFormWithErrors,
        nextFormWithErrors
      });
    }
    case bundleEditMetadataConstants.METADATA_FORM_INPUT_EDITED: {
      const { inputName, newValue } = action;
      const activeFormEdits = {
        ...state.activeFormEdits,
        [inputName]: newValue
      };
      return {
        ...state,
        activeFormEdits
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
    case bundleEditMetadataConstants.SET_METADATA_OVERRIDES: {
      const { metadataOverrides } = action;
      return {
        ...state,
        metadataOverrides
      };
    }
    case bundleEditMetadataConstants.SAVE_METADATA_REQUEST: {
      const { moveNextStep: moveNext, forceSave } = action;
      const { formKey: moveNextFormKey = null } = moveNext || {};
      const {
        currentFormWithErrors,
        nextFormWithErrors
      } = getNavigationFormsWithErrors(moveNextFormKey);
      return {
        ...state,
        requestingSaveMetadata: true,
        shouldSaveActiveForm: true,
        wasMetadataSaved: false,
        moveNext,
        forceSave,
        currentFormWithErrors,
        nextFormWithErrors
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
      const { error = {}, formKey } = action;
      const { formFieldIssues: formFieldIssuesAll } = state;
      const newFormFieldIssues = getFormErrors(formKey, error);
      const formFieldIssues = { ...formFieldIssuesAll, ...newFormFieldIssues };
      const errorTree = getErrorTree(formFieldIssues);
      const {
        currentFormWithErrors,
        nextFormWithErrors
      } = getNavigationFormsWithErrors(formKey);
      return {
        ...state,
        requestingSaveMetadata: false,
        wasMetadataSaved: false,
        couldNotSaveMetadataMessage: null /* todo */,
        formFieldIssues,
        errorTree,
        currentFormWithErrors,
        nextFormWithErrors
      };
    }
    case bundleConstants.UPDATE_BUNDLE: {
      if (
        !state.editingMetadata ||
        action.bundle.id !== state.bundleToEdit.id
      ) {
        return state;
      }
      const { bundle: bundleToEdit } = action;
      const { formFieldIssues, errorTree } = getFormErrorData(bundleToEdit);
      return {
        ...state,
        bundleToEdit,
        formFieldIssues,
        errorTree
      };
    }
    default: {
      return state;
    }
  }
  function getNavigationFormsWithErrors(formKey) {
    const {
      formFieldIssues = {},
      nextFormWithErrors: nextFormWithErrorsPrev
    } = state;
    const formErrorKeys = Object.keys(formFieldIssues);
    const formIndexWithError = formErrorKeys.indexOf(formKey);
    const currentFormWithErrors = formIndexWithError !== -1 ? formKey : null;
    const nextFormWithErrors =
      formIndexWithError !== -1
        ? formErrorKeys[(formIndexWithError + 1) % formErrorKeys.length]
        : nextFormWithErrorsPrev;
    return { currentFormWithErrors, nextFormWithErrors };
  }
}

function getFormErrorData(bundleToEdit) {
  const formsErrors = editMetadataService.getFormsErrors(
    bundleToEdit.formsErrorStatus
  );
  const formFieldIssues = Object.entries(formsErrors).reduce(
    (acc, [formKey, errorStatus]) => {
      const myformFieldIssues = getFormErrors(formKey, errorStatus);
      return { ...acc, ...myformFieldIssues };
    },
    {}
  );
  const errorTree = getErrorTree(formFieldIssues);
  return {
    formsErrors,
    formFieldIssues,
    errorTree
  };
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

function getFieldError(fieldIssue) {
  const [name, machineRule, origValue, rule] = fieldIssue;
  const value =
    origValue === 0 && machineRule === 'bad_arity_expected_1' ? '' : origValue;
  const fieldError = { name, rule, value, machineRule };
  return fieldError;
}

function getDocumentError(docIssue) {
  const [machineRule, name, rule] = docIssue;
  const docError = {
    name,
    rule,
    value: null,
    machineRule,
    isDocIssue: true
  };
  return docError;
}

function getErrors(formKey, formIssues, errorFactory) {
  const errors = formIssues.reduce((acc, issue) => {
    const fieldError = errorFactory(issue);
    const { name } = fieldError;
    const { [formKey]: formErrors = {} } = acc;
    return { ...acc, [formKey]: { ...formErrors, [name]: fieldError } };
  }, {});
  return errors;
}

function getFormErrors(formKey, errorStatus) {
  const { field_issues: fieldIssues, document_issues: docIssues } = errorStatus;
  const fieldErrors = getErrors(formKey, fieldIssues, getFieldError);
  const documentErrors = getErrors(formKey, docIssues, getDocumentError);
  return { ...fieldErrors, ...documentErrors };
}

function getErrorTree(formsErrors) {
  const errorTree = Object.keys(formsErrors).reduce(
    (accTree, formErrorEndpoint) => {
      const formErrors = formsErrors[formErrorEndpoint];
      const parentErrorBranches = getParentErrorBranches(
        formErrorEndpoint,
        formErrors
      );
      const combinedErrors = Object.keys(parentErrorBranches).reduce(
        (accErrors, branchKey) => {
          const origErrors = accTree[branchKey] || {};
          const newErrors = parentErrorBranches[branchKey];
          return { ...accErrors, [branchKey]: { ...origErrors, ...newErrors } };
        },
        {}
      );
      return { ...accTree, ...combinedErrors };
    },
    {}
  );
  return errorTree;
}

export default bundleEditMetadata;

import { createSelector } from 'reselect';

const editMetadataService = {
  getHasFormFieldsChanged,
  getFieldValues,
  getFormFieldValues,
  getKeyField,
  getIsRequired,
  getFormInputsWithOverrides,
  getIsMulti,
  makeGetFormsErrors,
  getFormsErrors
};

export default editMetadataService;

function getHasFormFieldsChanged(fields, activeFormEdits) {
  if (Object.keys(activeFormEdits).length === 0) {
    return false;
  }
  const editableFields = fields.filter(field => field.name);
  const allFieldValues = editableFields.reduce((acc, field) =>
    ({ ...acc, [field.name]: `${getFieldValues(field, activeFormEdits)}` }), {});
  const originalFieldValues = editableFields.reduce((acc, field) =>
    ({ ...acc, [field.name]: `${field.default}` }), {});
  const reallyChangedFields = Object.keys(allFieldValues)
    .filter(fieldKey => allFieldValues[fieldKey] !== originalFieldValues[fieldKey]);
  return reallyChangedFields.length !== 0;
}

function getFieldValues(field, activeFormEdits) {
  const { [field.name]: stateValue } = activeFormEdits;
  if (stateValue === undefined || stateValue === null) {
    return field.default || [''];
  }
  return Array.isArray(stateValue) ? stateValue : [stateValue];
}

function getIsRequired(field) {
  return !['?', '*'].includes(field.nValues) || field.type === 'key';
}

function getIsMulti(field) {
  return ['+', '*'].includes(field.nValues);
}

function getFormFieldValues(bundleId, formKey, fields, activeFormEdits) {
  // get the values for all required fields and all non-empty values optional fields.
  const keyField = getKeyField(fields);
  const fieldValues = fields.filter(field => field.name && field !== keyField)
    .reduce((acc, field) => {
      const values = getFieldValues(field, activeFormEdits);
      const isRequired = getIsRequired(field);
      if (isRequired || (values.length > 0 && `${values}`)) {
        const { type } = field;
        return { ...acc, [field.name]: { type, values } };
      }
      return acc;
    }, {});
  return fieldValues;
}

function getKeyField(fields) {
  const [keyField] = fields.filter(field => field.type === 'key');
  return keyField;
}


function getFormInputsWithOverrides(formKey, inputs, metadataOverrides) {
  const { [formKey]: formOverrides } = metadataOverrides || {};
  if (!formOverrides) {
    return inputs;
  }
  const overriddenFields = inputs.fields.map((field) => {
    const inputOverrides = formOverrides[field.name];
    if (!inputOverrides) {
      return field;
    }
    const overridenField = { ...field, ...inputOverrides, isOverridden: true };
    return overridenField;
  });
  return { ...inputs, fields: overriddenFields };
}

const getPropsFormsErrorStatus = (state, props) => props.formsErrorStatus;

function makeGetFormsErrors() {
  return createSelector(
    [getPropsFormsErrorStatus],
    getFormsErrors
  );
}

function getFormsErrors(formsErrorStatus) {
  const formsErrors = Object.entries(formsErrorStatus).reduce((acc, [formKey, errorStatus]) => {
    if (errorStatus.field_issues.length === 0 && errorStatus.document_issues.length === 0) {
      return acc;
    }
    return { ...acc, [`/${formKey}`]: { ...errorStatus } };
  }, {});
  return formsErrors;
}

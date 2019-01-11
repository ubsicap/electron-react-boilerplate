import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { withStyles } from '@material-ui/core/styles';
import Badge from '@material-ui/core/Badge';
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { Map } from 'immutable';
import Checkbox from '@material-ui/core/Checkbox';
import Toolbar from '@material-ui/core/Toolbar';
import NavigateNext from '@material-ui/icons/NavigateNext';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import OpenInNew from '@material-ui/icons/OpenInNew';
import Save from '@material-ui/icons/Save';
import classNames from 'classnames';
import Zoom from '@material-ui/core/Zoom';
import Tooltip from '@material-ui/core/Tooltip';
import { updateBundle } from '../actions/bundle.actions';
import { closeEditMetadata, saveFieldValuesForActiveForm, openMetadataFile } from '../actions/bundleEditMetadata.actions';
import { selectItemsToPaste } from '../actions/clipboard.actions';
import editMetadataService from '../services/editMetadata.service';
import EditMetadataStepper from './EditMetadataStepper';
import rowStyles from './DBLEntryRow.css';
import CopyForPasteButton from './CopyForPasteButton';

const { shell } = require('electron');

function mapStateToProps(state, props) {
  const { bundleEditMetadata, bundles } = state;
  const { bundleId } = props.match.params;
  const {
    showMetadataFile, currentFormWithErrors, nextFormWithErrors, formStructure
  } = bundleEditMetadata;
  const { addedByBundleIds } = bundles;
  const selectedBundle = bundleId ? addedByBundleIds[bundleId] : {};
  const getFormsErrors = editMetadataService.makeGetFormsErrors();
  const formsErrors = getFormsErrors(state, selectedBundle);
  const currentFormNumWithErrors = Object.keys(formsErrors).indexOf(currentFormWithErrors) + 1;
  const {
    requestingSaveMetadata = false,
    wasMetadataSaved = false,
    couldNotSaveMetadataMessage = null,
    moveNext = null
  } = bundleEditMetadata;
  return {
    open: Boolean(bundleId || false),
    bundleId,
    selectedBundle,
    requestingSaveMetadata,
    wasMetadataSaved,
    moveNext,
    couldNotSaveMetadataMessage,
    showMetadataFile,
    formsErrors,
    currentFormNumWithErrors,
    nextFormWithErrors,
    formStructure
  };
}

const mapDispatchToProps = {
  closeEditMetadata,
  saveFieldValuesForActiveForm,
  updateBundle,
  openMetadataFile,
  selectItemsToPaste
};

const materialStyles = theme => ({
  appBar: {
    position: 'sticky'
  },
  toolBar: {
    paddingLeft: '0px',
  },
  flex: {
    flex: 1,
  },
  leftIcon: {
    marginRight: theme.spacing.unit,
  },
  iconSmall: {
    fontSize: 20,
  },
  badge: {
    marginRight: theme.spacing.unit * 2,
    marginLeft: theme.spacing.unit
  },
});

type Props = {
  open: boolean,
  bundleId: string,
  selectedBundle: {},
  formsErrors: {},
  currentFormNumWithErrors: number,
  nextFormWithErrors: ?string,
  closeEditMetadata: () => {},
  updateBundle: () => {},
  classes: {},
  saveFieldValuesForActiveForm: () => {},
  openMetadataFile: () => {},
  selectItemsToPaste: () => {},
  wasMetadataSaved: boolean,
  showMetadataFile: ?string,
  moveNext: ?{},
  couldNotSaveMetadataMessage: ?string,
  requestingSaveMetadata: boolean,
  formStructure: {}
};

class EditEntryMetadataDialog extends PureComponent<Props> {
  props: Props;
  state = {
    sectionSelections: {},
  };

  componentDidUpdate(prevProps) {
    if (this.props.moveNext && this.props.moveNext.exit
      && this.props.wasMetadataSaved
      && !prevProps.wasMetadataSaved) {
      this.props.closeEditMetadata(this.props.bundleId);
      this.props.updateBundle(this.props.bundleId);
    } else if (this.props.couldNotSaveMetadataMessage &&
      this.props.couldNotSaveMetadataMessage !== prevProps.couldNotSaveMetadataMessage) {
      // TODO: post confirm message.
      // if confirmed: this.props.closeEditMetadata();
    }
    if (this.props.showMetadataFile && !prevProps.showMetadataFile) {
      shell.openExternal(this.props.showMetadataFile);
    }
  }

  handleClose = () => {
    this.props.saveFieldValuesForActiveForm({ moveNext: { exit: true } });
  };

  navigateToNextErrror = () => {
    const { nextFormWithErrors } = this.props;
    const moveNext = nextFormWithErrors ? { formKey: nextFormWithErrors } : null;
    this.props.saveFieldValuesForActiveForm({ moveNext });
  }

  handleReview = () => {
    this.props.openMetadataFile(this.props.bundleId);
  }

  conditionallyRenderSaveOrGotoErrorButton = () => {
    const { classes, formsErrors } = this.props;
    const formsErrorsCount = Object.keys(formsErrors).length;
    if (!formsErrorsCount) {
      return (
        <Button key="btnSave" color="inherit" disable={this.props.requestingSaveMetadata.toString()} onClick={this.handleClose}>
          <Save key="iconSave" className={classNames(classes.leftIcon, classes.iconSmall)} />
          Save
        </Button>
      );
    }
    const { currentFormNumWithErrors } = this.props;
    return (
      <Tooltip title="Navigate to next form with error">
        <Button key="btnGotoError" color="secondary" variant="contained" onClick={this.navigateToNextErrror}>
          {currentFormNumWithErrors || ''}
          <Badge key="badge" className={classes.badge} badgeContent={formsErrorsCount} color="error">
            <NavigateNext style={{ background: '#F8F6AE' }} color="action" key="navigateNext" className={classNames(classes.iconSmall)} />
          </Badge>
          Next
        </Button>
      </Tooltip>
    );
  }

  handleClickSectionSelection = event => {
    event.stopPropagation();
    event.preventDefault();
    const { value, checked } = event.target;
    const sectionSelections = { ...this.state.sectionSelections, [value]: checked };
    this.setState({ sectionSelections });
  };

  handleClickSelectAll = () => {
    const { formStructure } = this.props;
    const { sectionSelections: sectionSelectionsOrig = {} } = this.state;
    const areAllSelected = Object.keys(sectionSelectionsOrig).length === formStructure.length;
    const valueToSet = !areAllSelected;
    const sectionSelectionsMap =
      formStructure.map(step => step.id).reduce((acc, k) => acc.set(k, valueToSet), Map());
    const sectionSelections = sectionSelectionsMap.toObject();
    this.setState({ sectionSelections });
  }

  handleCopySections = () => {
    const { sectionSelections } = this.state;
    const sectionsSelected = Object.values(sectionSelections).filter(s => s);
    this.props.selectItemsToPaste(this.props.bundleId, sectionsSelected, 'metadata sections');
    this.handleClose();
  }

  render() {
    const {
      classes, open, selectedBundle = {}, bundleId, formStructure
    } = this.props;
    const { sectionSelections } = this.state;
    const sectionsSelected = Object.values(sectionSelections).filter(s => s);
    const { displayAs = {} } = selectedBundle;
    const { languageAndCountry, name } = displayAs;
    return (
      <Zoom in={open}>
        <div>
          <AppBar className={classes.appBar}>
            <Toolbar className={classes.toolBar}>
              <IconButton color="inherit" disable={this.props.requestingSaveMetadata.toString()} onClick={this.handleClose} aria-label="Close">
                <CloseIcon />
              </IconButton>
              <Typography variant="title" color="inherit" className={classes.flex}>
                Edit metadata: <span className={rowStyles.languageAndCountryLabel}>{languageAndCountry} </span> {name}
              </Typography>
              <Button key="btnOpenXml" color="inherit" disable={this.props.showMetadataFile} onClick={this.handleReview}>
                <OpenInNew className={classNames(classes.leftIcon, classes.iconSmall)} />
                Review
              </Button>
              <CopyForPasteButton
                key="btnCopyForPaste"
                classes={classes}
                color="inherit"
                onClick={this.handleCopySections}
                disabled={sectionsSelected.length === 0}
                selectedItems={sectionsSelected}
              />
              {this.conditionallyRenderSaveOrGotoErrorButton()}
            </Toolbar>
          </AppBar>
          <FormControlLabel
            style={{ paddingTop: '8px', paddingLeft: '55px' }}
            control={
              <Checkbox
                onChange={this.handleClickSelectAll}
                value="master"
                checked={formStructure.length > 0 && sectionsSelected.length === formStructure.length}
                indeterminate={sectionsSelected.length > 0 && sectionsSelected.length < formStructure.length}
              />
            }
            label={`Selected Sections (${sectionsSelected.length})`}
          />
          <EditMetadataStepper
            bundleId={bundleId}
            myStructurePath=""
            sectionSelections={sectionSelections}
            onClickSectionSelection={this.handleClickSectionSelection}
          />
        </div>
      </Zoom>
    );
  }
}

export default compose(
  withStyles(materialStyles, { name: 'EditEntryMetadataDialog' }),
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
)(EditEntryMetadataDialog);

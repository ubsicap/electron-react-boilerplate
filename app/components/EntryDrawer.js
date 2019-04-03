import React, { PureComponent } from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Drawer from '@material-ui/core/Drawer';
import MaterialUiList from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import OpenInNew from '@material-ui/icons/OpenInNew';
import { openMetadataFile, openEditMetadata } from '../actions/bundleEditMetadata.actions';
import { openResourceManager } from '../actions/bundleManageResources.actions';
import { openEntryReports } from '../actions/report.actions';
import { closeEntryDrawer } from '../actions/entryAppBar.actions';
import { ux } from '../utils/ux';


type Props = {
  classes: {},
  theme: {},
  bundleId: string,
  activeBundle: {},
  openDrawer: boolean,
  closeEntryDrawer: () => {},
  openMetadataFile: () => {},
  openEditMetadata: () => {},
  openResourceManager: () => {},
  openEntryReports: () => {}
};


function mapStateToProps(state, props) {
  const { id: bundleId } = props.activeBundle;
  return {
    bundleId,
    openDrawer: state.entryAppBar.openDrawer,
  };
}

const mapDispatchToProps = {
  openMetadataFile,
  openEditMetadata,
  openResourceManager,
  closeEntryDrawer,
  openEntryReports
};

const materialStyles = theme => ({
  ...ux.getDblRowStyles(theme),
  ...ux.getEntryDrawerStyles(theme),
  ...ux.getEntryUxStyles(theme)
});


class EntryDrawer extends PureComponent<Props> {
  props: Props;

  getResourceMode = () => {
    const { activeBundle } = this.props;
    const { status } = activeBundle;
    const mode = status === 'DRAFT' ? 'addFiles' : 'download';
    return mode;
  }

  getDrawerItems = () => (
    [
      {
        label: 'Metadata',
        icon: ux.getModeIcon('metadata'),
        handleClick: this.handleSwitchToMetadata
      },
      {
        label: 'Resources',
        icon: ux.getModeIcon(this.getResourceMode()),
        handleClick: this.handleSwitchToResources
      },
      {
        label: 'Revisions',
        icon: ux.getModeIcon('revisions'),
        handleClick: this.handleSwitchToRevisions
      },
      {
        label: 'Reports',
        icon: ux.getModeIcon('reports'),
        handleClick: this.handleSwitchToReports
      },
    ]
  );

  renderListItem = (item) => (
    <ListItem button key={item.label} onClick={item.handleClick}>
      <ListItemIcon>{item.icon}</ListItemIcon>
      <ListItemText primary={item.label} />
    </ListItem>
  );

  handleOpenMetadataXml = () => {
    this.props.openMetadataFile(this.props.bundleId);
  }

  handleSwitchToMetadata = () => {
    this.props.openEditMetadata(this.props.bundleId, undefined, false);
  }

  handleSwitchToResources = () => {
    const { bundleId } = this.props;
    const mode = this.getResourceMode();
    this.props.openResourceManager(bundleId, mode, false);
  }

  handleSwitchToRevisions = () => {
    const { bundleId } = this.props;
    this.props.openResourceManager(bundleId, 'revisions', false);
  }

  handleSwitchToReports = () => {
    const { bundleId } = this.props;
    this.props.openEntryReports(bundleId, 'reports');
  }

  render() {
    const {
      classes
    } = this.props;
    const items = this.getDrawerItems();
    const { theme, openDrawer } = this.props;
    return (
      <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor="left"
        open={openDrawer}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={this.props.closeEntryDrawer}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </div>
        <Divider />
        <MaterialUiList>
          <ListItem button key="metadataXml" onClick={this.handleOpenMetadataXml}>
            <ListItemIcon><OpenInNew /></ListItemIcon>
            <ListItemText primary="Review metadata.xml" />
          </ListItem>
        </MaterialUiList>
        <Divider />
        <MaterialUiList>
          {items.map(this.renderListItem)}
        </MaterialUiList>
        { /*
        <Divider />
        <MaterialUiList>
          {['Make Revision', 'Export To', 'Copy As'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </MaterialUiList>
        */}
      </Drawer>
    );
  }
}

export default compose(
  withStyles(materialStyles, { withTheme: true }),
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(EntryDrawer);

import React from 'react';
import Autosuggest from 'react-autosuggest';
import { DebounceInput } from 'react-debounce-input';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import Highlighter from 'react-highlight-words';
/* import Popper from '@material-ui/core/Popper'; */
import { withStyles } from '@material-ui/core/styles';

type Props = {
  classes: {},
  getSuggestions: () => {},
  onInputChanged: () => {}
};

function renderInputComponent(inputProps) {
  const {
    classes, inputRef = () => {}, ref, ...other
  } = inputProps;
  return (
    <DebounceInput
      debounceTimeout={300}
      element={TextField}
      fullWidth
      InputProps={{
        inputRef: node => {
          ref(node);
          inputRef(node);
        },
        classes: {
          input: classes.input,
        }
      }}
      {...other}
    />);
}

/*
function renderSuggestion(suggestion, { query, isHighlighted }) {
  const matches = match(suggestion.label, query);
  const parts = parse(suggestion.label, matches);

  return (
    <MenuItem selected={isHighlighted} component="div">
      <div>
        {parts.map((part, index) => {
          return part.highlight ? (
            <span key={String(index)} style={{ fontWeight: 500 }}>
              {part.text}
            </span>
          ) : (
            <strong key={String(index)} style={{ fontWeight: 300 }}>
              {part.text}
            </strong>
          );
        })}
      </div>
    </MenuItem>
  );
}
*/
/*
function getSuggestions(value) {
  const inputValue = value.trim().toLowerCase();
  const inputLength = inputValue.length;
  let count = 0;

  return inputLength === 0
    ? []
    : suggestions.filter(suggestion => {
      const keep =
        count < 5 && suggestion.label.toLowerCase().slice(0, inputLength) === inputValue;

      if (keep) {
        count += 1;
      }

      return keep;
    });
}
*/

function getSuggestionValue(suggestion) {
  return suggestion.label;
}

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  container: {
    position: 'relative',
  },
  suggestionsContainerOpen: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
  },
  suggestion: {
    display: 'block',
  },
  suggestionsList: {
    margin: 0,
    padding: 0,
    listStyleType: 'none',
  },
  divider: {
    height: theme.spacing.unit * 2,
  },
  highlighter: {
    backgroundColor: 'inherit',
    fontWeight: 'bold',
    padding: 0
  }
});

class IntegrationAutosuggest extends React.Component<Prop> {
  props: Props
  constructor(props) {
    super(props);
    this.state = {
      single: '',
      popper: '',
      suggestions: props.getSuggestions()
    };
  }
  popperNode = null;

  handleSuggestionsFetchRequested = ({ value, reason }) => {
    this.setState({
      suggestions: this.props.getSuggestions(value, reason),
    });
  };

  handleSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  handleSelected = (event, { suggestionValue: newValue, method }) => {
    // console.log('handleSelected');
    this.handleChange('single')(event, { newValue, method });
  }

  handleChange = name => (event, { newValue, method }) => {
    // console.log({ newValue, method });
    this.setState({
      [name]: newValue,
    }, this.props.onInputChanged(newValue, method));
  };

  shouldRenderSuggestions = () => true;

  renderSuggestion = (suggestion, { query, isHighlighted }) => {
    const searchWords = [query.trim()];
    const { classes } = this.props;
    return (
      <MenuItem selected={isHighlighted} component="div">
        <div>
          <Highlighter
            textToHighlight={suggestion.label}
            searchWords={searchWords}
            highlightClassName={classes.highlighter}
            autoEscape
          />
        </div>
      </MenuItem>
    );
  }

  render() {
    const { classes } = this.props;
    const { shouldRenderSuggestions, renderSuggestion } = this;

    const autosuggestProps = {
      renderInputComponent,
      suggestions: this.state.suggestions,
      onSuggestionsFetchRequested: this.handleSuggestionsFetchRequested,
      onSuggestionsClearRequested: this.handleSuggestionsClearRequested,
      onSuggestionSelected: this.handleSelected,
      getSuggestionValue,
      renderSuggestion,
      shouldRenderSuggestions
    };

    return (
      <div className={classes.root}>
        <Autosuggest
          {...autosuggestProps}
          inputProps={{
            classes,
            placeholder: 'Edit container',
            value: this.state.single,
            onChange: this.handleChange('single'),
          }}
          theme={{
            container: classes.container,
            suggestionsContainerOpen: classes.suggestionsContainerOpen,
            suggestionsList: classes.suggestionsList,
            suggestion: classes.suggestion,
          }}
          renderSuggestionsContainer={options => (
            <Paper {...options.containerProps} square>
              {options.children}
            </Paper>
          )}
        />
        {/*
        <div className={classes.divider} />
        <Autosuggest
          {...autosuggestProps}
          inputProps={{
            classes,
            label: 'Label',
            placeholder: 'With Popper',
            value: this.state.popper,
            onChange: this.handleChange('popper'),
            inputRef: node => {
              this.popperNode = node;
            },
            InputLabelProps: {
              shrink: true,
            },
          }}
          theme={{
            suggestionsList: classes.suggestionsList,
            suggestion: classes.suggestion,
          }}
          renderSuggestionsContainer={options => (
            <Popper anchorEl={this.popperNode} open={Boolean(options.children)}>
              <Paper
                square
                {...options.containerProps}
                style={{ width: this.popperNode ? this.popperNode.clientWidth : null }}
              >
                {options.children}
              </Paper>
            </Popper>
          )}
        /> */}
      </div>
    );
  }
}

export default withStyles(styles)(IntegrationAutosuggest);

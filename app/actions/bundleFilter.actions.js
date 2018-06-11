import split from 'split-string';
import { findChunks } from 'highlight-words-core';
import { bundleFilterConstants } from '../constants/bundleFilter.constants';

export const bundleFilterActions = {
  updateSearchInput,
  updateSearchResultsForBundleId,
  clearSearch
};

export default bundleFilterActions;

const canceledState = { isCanceled: true };

export function updateSearchInput(searchInput) {
  return (dispatch, getState) => {
    const trimmedSearchInput = searchInput.trim();
    /* NOTE: eslint complains about use of 'let' should be 'const'
     * but that results in "TypeError: Assignment to constant variable." 
     * See https://github.com/mishoo/UglifyJS2/issues/2842 */
    let searchKeywords = split(trimmedSearchInput, { separator: ' ' }); // eslint-disable-line prefer-const, max-len
    const { bundles, bundlesFilter } = getState();
    if (trimmedSearchInput.length > 0 && !bundles.loading) {
      const willRecomputeAllSearchResults = trimmedSearchInput !== bundlesFilter.searchInput;
      dispatch({
        type: bundleFilterConstants.UPDATE_SEARCH_INPUT,
        searchInput: trimmedSearchInput,
        searchInputRaw: searchInput,
        searchKeywords,
        willRecomputeAllSearchResults,
        bundles
      });
      if (!willRecomputeAllSearchResults) {
        return; // don't try to find new results yet
      }
      /* NOTE: eslint complains about use of 'let' should be 'const'
       * but that results in "TypeError: Assignment to constant variable." */
      let searchResults = getAllSearchResults(bundles.items, searchKeywords); // eslint-disable-line prefer-const, max-len
      if (searchResults === canceledState) {
        return; // cancel these results
      }
      dispatch(updateSearchResults(searchResults));
    } else {
      dispatch(clearSearch());
    }

    function updateSearchResults(searchResults) {
      return {
        type: bundleFilterConstants.UPDATE_SEARCH_RESULTS, searchResults
      };
    }
  };
}

function getAllSearchResults(searchableBundles, searchKeywords) {
  const searchResults = Object.values(searchableBundles).reduce((acc, searchableBundle) => {
    const bundleSearchResults = getBundleSearchResults(
      searchableBundle,
      searchKeywords,
      acc.chunks
    );
    const { chunks, matches } = bundleSearchResults;
    if (Object.keys(matches).length > 0) {
      return combineSearchResults(acc, searchableBundle, chunks, matches);
    }
    return acc;
  }, { bundlesMatching: {}, chunks: {}, matches: {} });
  return searchResults;
}

export function updateSearchResultsForBundleId(bundleId) {
  return (dispatch, getState) => {
    const { bundles } = getState();
    const searchableBundle = bundles.items.find(bundle => bundle.id === bundleId);
    if (!searchableBundle) {
      return;
    }
    dispatch(updateSearchResultsForBundle(searchableBundle));
  };
}

function updateSearchResultsForBundle(searchableBundle) {
  return (dispatch, getState) => {
    const { bundlesFilter } = getState();
    const { isSearchActive, searchKeywords } = bundlesFilter;
    if (!isSearchActive) {
      return;
    }
    const bundleSearchResults = getBundleSearchResults(searchableBundle, searchKeywords, {});
    const { chunks, matches } = bundleSearchResults;
    if (Object.keys(matches).length > 0) {
      dispatch(addSearchMatch(searchableBundle, chunks, matches));
    } else {
      dispatch(removeSearchMatch(searchableBundle));
    }
  };

  function addSearchMatch(bundle, chunks, matches) {
    return {
      type: bundleFilterConstants.ADD_SEARCH_MATCH, bundle, chunks, matches
    };
  }

  function removeSearchMatch(bundle) {
    return {
      type: bundleFilterConstants.REMOVE_SEARCH_MATCH, bundle
    };
  }
}
/*
findChunks({
  autoEscape,
  caseSensitive,
  sanitize,
  searchWords,
  textToHighlight})
*/
function getBundleSearchResults(searchableBundle, searchKeywords, chunksAcrossBundles) {
  const bundleSearchResults = Object.values(searchableBundle.displayAs).reduce((acc, searchable) => {
    let chunksForSearchable = chunksAcrossBundles[searchable];
    if (!chunksForSearchable) {
      const findChunkOptions = {
        autoEscape: true,
        searchWords: searchKeywords,
        textToHighlight: searchable
      };
      chunksForSearchable = findChunks(findChunkOptions);
    }
    const chunksInBundle = { [searchable]: chunksForSearchable };
    const hasMatches = chunksForSearchable.length > 0;
    const matches = hasMatches ? { ...acc.matches, ...chunksInBundle } : acc.matches;
    return {
      chunks: { ...acc.chunks, ...chunksInBundle },
      matches
    };
  }, {
    chunks: {},
    matches: {}
  });
  return bundleSearchResults;
}

function combineSearchResults(searchResults, bundle, chunks, matches) {
  const oldBundlesMatching = searchResults.bundlesMatching;
  const oldChunks = searchResults.chunks;
  const oldMatches = searchResults.matches;
  const key = bundle.id;
  const newMatches = matches;
  const newMatchingBundle = { [key]: newMatches };
  const newChunks = chunks;
  return {
    bundlesMatching: { ...oldBundlesMatching, ...newMatchingBundle },
    chunks: { ...oldChunks, ...newChunks },
    matches: { ...oldMatches, ...newMatches }
  };
}

export function clearSearch() {
  return { type: bundleFilterConstants.CLEAR_SEARCH_RESULTS };
}

import React from 'react/addons';
import Reflux from 'reflux';
import {Navigation} from 'react-router';

import searches from '../searches';
import mixins from '../mixins';
import stores from '../stores';
import bem from '../bem';
import mdl from '../libs/rest_framework/material';
import AssetRow from './assetrow';
import {
  parsePermissions,
  t,
} from '../utils';

var SearchCollectionList = React.createClass({
  mixins: [
    searches.common,
    Navigation,
    mixins.clickAssets,
    Reflux.connect(stores.selectedAsset),
    Reflux.ListenerMixin,
  ],
  getInitialState () {
    var selectedCategories = {
      'Draft': true,
      'Deployed': true, 
      'Archived': true
    }
    return {
      selectedCategories: selectedCategories,
    };
  },
  getDefaultProps () {
    return {
      assetRowClass: AssetRow,
      searchContext: 'default',
    };
  },
  componentDidMount () {
    this.listenTo(this.searchStore, this.searchChanged);
  },
  componentWillReceiveProps () {
    this.listenTo(this.searchStore, this.searchChanged);
  },
  searchChanged (searchStoreState) {
    this.setState(searchStoreState);
  },
  renderAssetRow (resource) {
    var currentUsername = stores.session.currentAccount && stores.session.currentAccount.username;
    var perm = parsePermissions(resource.owner, resource.permissions);
    var isSelected = stores.selectedAsset.uid === resource.uid;
    return (
        <this.props.assetRowClass key={resource.uid}
                      currentUsername={currentUsername}
                      perm={perm}
                      onActionButtonClick={this.onActionButtonClick}
                      isSelected={isSelected}
                      deleting={resource.deleting}
                      {...resource}
                        />
      );
  },
  toggleCategory(c) {
    return function (e) {
    var selectedCategories = this.state.selectedCategories;
    selectedCategories[c] = !selectedCategories[c];
      this.setState({
        selectedCategories: selectedCategories,
      });
    }.bind(this)
  },
  renderHeadings () {
    return (
        <bem.AssetListSorts className="mdl-grid">
          <bem.AssetListSorts__item m={'name'} className="mdl-cell mdl-cell--6-col mdl-cell--3-col-tablet">
            {t('Name')}
          </bem.AssetListSorts__item>
          <bem.AssetListSorts__item m={'owner'} className="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet">
            {t('Owner')}
          </bem.AssetListSorts__item>
          <bem.AssetListSorts__item m={'modified'} className="mdl-cell mdl-cell--3-col mdl-cell--2-col-tablet">
            {t('Last Modified')}
          </bem.AssetListSorts__item>
          <bem.AssetListSorts__item m={'questions'} className="mdl-cell mdl-cell--1-col mdl-cell--1-col-tablet">
            {t('Questions')}
          </bem.AssetListSorts__item>
        </bem.AssetListSorts>
      );
  },
  renderGroupedHeadings () {
    return (
        <bem.AssetListSorts className="mdl-grid">
          <bem.AssetListSorts__item m={'name'} className="mdl-cell mdl-cell--5-col mdl-cell--3-col-tablet">
            {t('Name')}
          </bem.AssetListSorts__item>
          <bem.AssetListSorts__item m={'owner'} className="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet">
            {t('Shared by')}
          </bem.AssetListSorts__item>
          <bem.AssetListSorts__item m={'created'} className="mdl-cell mdl-cell--2-col mdl-cell--hide-tablet">
            {t('Created')}
          </bem.AssetListSorts__item>
          <bem.AssetListSorts__item m={'modified'} className="mdl-cell mdl-cell--2-col mdl-cell--2-col-tablet">
            {t('Last Modified')}
          </bem.AssetListSorts__item>
          <bem.AssetListSorts__item m={'submissions'} className="mdl-cell mdl-cell--1-col mdl-cell--1-col-tablet">
            {t('Submissions')}
          </bem.AssetListSorts__item>
        </bem.AssetListSorts>
      );
  },
  renderGroupedResults () {
    return ['Deployed', 'Draft', 'Archived' /*, 'deleted'*/].map(
      (category) => {
        var categoryVisible = this.state.selectedCategories[category];
        if (this.state.defaultQueryCategorizedResultsLists[category].length > 0) {
          return [
            <bem.AssetList__heading m={[category, categoryVisible ? 'visible' : 'collapsed']} 
                                    // onClick={this.toggleCategory(category)}
                                    >
              {t(category)}
              {` (${this.state.defaultQueryCategorizedResultsLists[category].length})`}
            </bem.AssetList__heading>,
            <bem.AssetItems m={[category, categoryVisible ? 'visible' : 'collapsed']}>
              {this.renderGroupedHeadings()}
              {
                (()=>{
                  if (this.state.searchResultsDisplayed) {
                    return this.state.searchResultsCategorizedResultsLists[category].map(
                      this.renderAssetRow)
                  } else {
                    return this.state.defaultQueryCategorizedResultsLists[category].map(
                      this.renderAssetRow)
                  }
                })()
              }
            </bem.AssetItems>
          ];
        } else {
          return false;
        }
      }
    );    
  },

  refreshSearch () {
    this.searchValue.refresh();
  },
  render () {
    var s = this.state;
    if (this.props.searchContext.store.filterTags == 'asset_type:survey') {
      var display = 'grouped';
    } else {
      var display = 'regular';
    }
    return (
        <bem.List m={display}>
          {
            (()=>{
              if (display == 'regular') {
                return this.renderHeadings();
              }
            })()
          }
          <bem.AssetList>
          {
            (()=>{
              if (s.searchResultsDisplayed) {
                if (s.searchState === 'loading') {
                  return (
                    <bem.Loading>
                      <bem.Loading__inner>
                        <i />
                        {t('loading...')} 
                      </bem.Loading__inner>
                    </bem.Loading>
                  );
                } else if (s.searchState === 'done') {
                  if (display == 'grouped') {
                    return this.renderGroupedResults();
                  } else {
                    return s.searchResultsList.map(this.renderAssetRow);
                  }
                }
              } else {
                if (s.defaultQueryState === 'loading') {
                  return (
                    <bem.Loading>
                      <bem.Loading__inner>
                        <i />
                        {t('loading...')} 
                      </bem.Loading__inner>
                    </bem.Loading>
                  );
                } else if (s.defaultQueryState === 'done') {
                  if (s.defaultQueryCount < 1) {
                    if (s.defaultQueryFor.assetType == 'asset_type:survey') {
                      return (
                        <bem.Loading>
                          <bem.Loading__inner>
                            {t("Let's get started by creating your first project. Click the New button to create a new form.")} 
                          </bem.Loading__inner>
                        </bem.Loading>
                      );
                    } else {
                      return (
                        <bem.Loading>
                          <bem.Loading__inner>
                            {t("Let's get started by creating your first library question or question block. Click the New button to create a new question or block.")} 
                          </bem.Loading__inner>
                        </bem.Loading>
                      );
                    }
                  }

                  if (display == 'grouped') {
                    return this.renderGroupedResults();
                  } else {
                    return s.defaultQueryResultsList.map(this.renderAssetRow);
                  }
                }
              }
              // it shouldn't get to this point
              return false;
            })()
          }
          </bem.AssetList>
        </bem.List>
      );
  },
  componentDidUpdate() {
    mdl.upgradeDom();
  }
});

export default SearchCollectionList;

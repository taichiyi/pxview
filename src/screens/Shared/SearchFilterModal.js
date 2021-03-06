/* eslint-disable camelcase */

import React, { Component } from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import qs from 'qs';
import { List, ListItem } from 'react-native-elements';
import { SinglePickerMaterialDialog } from 'react-native-material-dialog';
import { connectLocalization } from '../../components/Localization';
import SearchIllustsBookmarkRangesPickerDialog from '../../components/SearchIllustsBookmarkRangesPickerDialog';
import SearchNovelsBookmarkRangesPickerDialog from '../../components/SearchNovelsBookmarkRangesPickerDialog';
import PXTouchable from '../../components/PXTouchable';
import {
  SEARCH_TYPES,
  SEARCH_PERIOD_TYPES,
  SCREENS,
} from '../../common/constants';
import { globalStyles, globalStyleVariables } from '../../styles';

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  searchFilterButtonContainer: {
    padding: 10,
    backgroundColor: '#fff',
  },
  searchFilterButton: {
    backgroundColor: globalStyleVariables.PRIMARY_COLOR,
    padding: 10,
    alignItems: 'center',
  },
  searchFilterButtonText: {
    color: '#fff',
  },
});

class SearchFilterModal extends Component {
  constructor(props) {
    super(props);
    const {
      searchFilter: {
        target,
        period,
        sort,
        start_date,
        end_date,
        bookmark_num_min,
        bookmark_num_max,
      },
    } = props.navigation.state.params;
    this.state = {
      target: target || 'partial_match_for_tags',
      period: period || SEARCH_PERIOD_TYPES.ALL,
      sort: sort || 'date_desc',
      startDate: start_date,
      endDate: end_date,
      likes: this.getSelectedLikesFilterValue(
        bookmark_num_min,
        bookmark_num_max,
      ),
      bookmarkNumMin: bookmark_num_min,
      bookmarkNumMax: bookmark_num_max,
      selectedFilterType: null,
      selectedPickerItem: null,
      filterList: this.getFilterList(true),
    };
  }

  getFilterList = init => {
    const { i18n, navigation, user } = this.props;
    const {
      searchFilter: { start_date, end_date },
      searchType,
    } = navigation.state.params;
    let targetOptions;
    if (searchType === SEARCH_TYPES.ILLUST) {
      targetOptions = [
        {
          value: 'partial_match_for_tags',
          label: i18n.searchTargetTagPartial,
        },
        {
          value: 'exact_match_for_tags',
          label: i18n.searchTargetTagTotal,
        },
        {
          value: 'title_and_caption',
          label: i18n.searchTargetTitleCaption,
        },
      ];
    } else {
      targetOptions = [
        {
          value: 'partial_match_for_tags',
          label: i18n.searchTargetTagPartial,
        },
        {
          value: 'text',
          label: i18n.searchTargetText,
        },
        {
          value: 'keyword',
          label: i18n.searchTargetKeyword,
        },
      ];
    }
    const extraPeriodOption = {};
    if (init) {
      if (start_date && end_date) {
        extraPeriodOption.value = SEARCH_PERIOD_TYPES.CUSTOM_DATE;
        extraPeriodOption.label = `${start_date} - ${end_date}`;
      }
    } else if (this.state.startDate && this.state.endDate) {
      extraPeriodOption.value = SEARCH_PERIOD_TYPES.CUSTOM_DATE;
      extraPeriodOption.label = `${this.state.startDate} - ${this.state
        .endDate}`;
    }
    let periodOptions = [
      {
        value: SEARCH_PERIOD_TYPES.ALL,
        label: i18n.searchPeriodAll,
      },
      {
        value: SEARCH_PERIOD_TYPES.LAST_DAY,
        label: i18n.searchPeriodLastDay,
      },
      {
        value: SEARCH_PERIOD_TYPES.LAST_WEEK,
        label: i18n.searchPeriodLastWeek,
      },
      {
        value: SEARCH_PERIOD_TYPES.LAST_MONTH,
        label: i18n.searchPeriodLastMonth,
      },
      {
        value: SEARCH_PERIOD_TYPES.LAST_HALF_YEAR,
        label: i18n.searchPeriodLastHalfYear,
      },
      {
        value: SEARCH_PERIOD_TYPES.LAST_YEAR,
        label: i18n.searchPeriodLastYear,
      },
      {
        value: SEARCH_PERIOD_TYPES.DATE,
        label: i18n.searchPeriodSpecifyDate,
      },
    ];
    if (extraPeriodOption.value) {
      periodOptions = [extraPeriodOption, ...periodOptions];
    }
    const filterOptions = [
      {
        key: 'target',
        options: targetOptions,
      },
      {
        key: 'period',
        options: periodOptions,
      },
      {
        key: 'sort',
        options: [
          {
            value: 'date_desc',
            label: i18n.searchOrderNewest,
          },
          {
            value: 'date_asc',
            label: i18n.searchOrderOldest,
          },
          {
            value: 'popularity',
            label: i18n.searchOrderPopularity,
          },
        ],
      },
    ];
    if (user.is_premium) {
      filterOptions.push({
        key: 'likes',
        options: [
          {
            value: null,
            label: i18n.searchLikesAll,
          },
        ],
      });
    }
    return filterOptions;
  };

  getSearchTypeName = type => {
    const { i18n } = this.props;
    switch (type) {
      case 'target':
        return i18n.searchTarget;
      case 'period':
        return i18n.searchPeriod;
      case 'sort':
        return i18n.searchOrder;
      case 'likes':
        return i18n.searchLikes;
      default:
        return '';
    }
  };

  getSelectedFilterName = (key, options) => {
    if (key !== 'likes') {
      return options.find(o => o.value === this.state[key]).label;
    }
    const { bookmarkNumMin, bookmarkNumMax } = this.state;
    if (!bookmarkNumMin && !bookmarkNumMax) {
      const { i18n } = this.props;
      return i18n.searchLikesAll;
    }
    if (!bookmarkNumMax) {
      return `${bookmarkNumMin}+`;
    }
    return `${bookmarkNumMin} - ${bookmarkNumMax}`;
  };

  getSelectedLikesFilterValue = (bookmarkNumMin, bookmarkNumMax) => {
    if (!bookmarkNumMin && !bookmarkNumMax) {
      return '';
    } else if (!bookmarkNumMax) {
      return `bookmarkNumMin=${bookmarkNumMin}`;
    }
    return `bookmarkNumMin=${bookmarkNumMin}&bookmarkNumMax=${bookmarkNumMax}`;
  };

  handleOnPressFilterOption = filterType => {
    const value = this.state[filterType];
    this.setState({
      selectedFilterType: filterType,
      selectedPickerItem: {
        label: '', // not important, only value is use to determine selected picker item
        value,
      },
    });
  };

  handleOnOkPickerDialog = result => {
    const { selectedFilterType, startDate, endDate } = this.state;
    if (selectedFilterType === 'period') {
      if (result.selectedItem.value === SEARCH_PERIOD_TYPES.DATE) {
        const { navigate } = this.props.navigation;
        navigate(SCREENS.SearchFilterPeriodDateModal, {
          onConfirmPeriodDate: this.handleOnConfirmPeriodDate,
          startDate,
          endDate,
        });
        this.setState({
          selectedFilterType: null,
        });
      } else {
        this.setState({
          [selectedFilterType]: result.selectedItem.value,
          selectedPickerItem: result.selectedItem,
          selectedFilterType: null,
          startDate: null,
          endDate: null,
        });
      }
    } else {
      const newState = {
        [selectedFilterType]: result.selectedItem.value,
        selectedPickerItem: result.selectedItem,
        selectedFilterType: null,
      };
      if (selectedFilterType === 'likes') {
        if (result.selectedItem.value) {
          const { bookmarkNumMin, bookmarkNumMax } = qs.parse(
            result.selectedItem.value,
          );
          newState.bookmarkNumMin = bookmarkNumMin;
          newState.bookmarkNumMax = bookmarkNumMax;
        } else {
          newState.bookmarkNumMin = null;
          newState.bookmarkNumMax = null;
        }
      }
      this.setState(newState);
    }
  };

  handleOnCancelPickerDialog = () => {
    this.setState({
      selectedFilterType: null,
    });
  };

  handleOnConfirmPeriodDate = (startDate, endDate) => {
    const { goBack } = this.props.navigation;
    goBack(null);
    this.setState(
      {
        startDate,
        endDate,
      },
      () => {
        this.setState({
          filterList: this.getFilterList(),
          period: SEARCH_PERIOD_TYPES.CUSTOM_DATE,
          selectedPickerItem: {
            value: SEARCH_PERIOD_TYPES.CUSTOM_DATE,
            label: `${startDate} - ${endDate}`,
          },
        });
      },
    );
  };

  handleOnPressApplyFilter = () => {
    const { onPressApplyFilter } = this.props.navigation.state.params;
    const {
      target,
      period,
      sort,
      startDate,
      endDate,
      bookmarkNumMin,
      bookmarkNumMax,
    } = this.state;
    onPressApplyFilter(
      target,
      period,
      sort,
      startDate,
      endDate,
      bookmarkNumMin,
      bookmarkNumMax,
    );
  };

  render() {
    const { i18n, navigationStateKey, navigation } = this.props;
    const { word, searchType } = navigation.state.params;
    const {
      selectedFilterType,
      selectedPickerItem,
      filterList,
      target,
      period,
      startDate,
      endDate,
    } = this.state;
    return (
      <SafeAreaView style={globalStyles.container}>
        <List containerStyle={styles.listContainer}>
          {filterList.map(list =>
            <ListItem
              key={list.key}
              title={this.getSearchTypeName(list.key)}
              subtitle={this.getSelectedFilterName(list.key, list.options)}
              onPress={() => this.handleOnPressFilterOption(list.key)}
              hideChevron
            />,
          )}
        </List>
        <View style={styles.searchFilterButtonContainer}>
          <PXTouchable
            onPress={this.handleOnPressApplyFilter}
            style={styles.searchFilterButton}
          >
            <Text style={styles.searchFilterButtonText}>
              {i18n.searchApplyFilter}
            </Text>
          </PXTouchable>
        </View>
        {selectedFilterType &&
          selectedFilterType !== 'likes' &&
          <SinglePickerMaterialDialog
            title={this.getSearchTypeName(selectedFilterType)}
            items={filterList
              .find(f => f.key === selectedFilterType)
              .options.map(option => ({
                value: option.value,
                label: option.label,
              }))}
            visible
            scrolled
            selectedItem={selectedPickerItem}
            okLabel={i18n.ok}
            cancelLabel={i18n.cancel}
            onCancel={this.handleOnCancelPickerDialog}
            onOk={this.handleOnOkPickerDialog}
          />}
        {selectedFilterType === 'likes' &&
          searchType === SEARCH_TYPES.ILLUST &&
          <SearchIllustsBookmarkRangesPickerDialog
            navigationStateKey={navigationStateKey}
            word={word}
            searchOptions={{
              target,
              period,
              start_date: startDate,
              end_date: endDate,
            }}
            selectedItem={selectedPickerItem}
            onCancel={this.handleOnCancelPickerDialog}
            onOk={this.handleOnOkPickerDialog}
          />}
        {selectedFilterType === 'likes' &&
          searchType === SEARCH_TYPES.NOVEL &&
          <SearchNovelsBookmarkRangesPickerDialog
            navigationStateKey={navigationStateKey}
            word={word}
            searchOptions={{
              target,
              period,
              start_date: startDate,
              end_date: endDate,
            }}
            selectedItem={selectedPickerItem}
            onCancel={this.handleOnCancelPickerDialog}
            onOk={this.handleOnOkPickerDialog}
          />}
      </SafeAreaView>
    );
  }
}

export default connectLocalization(
  connect((state, props) => ({
    user: state.auth.user,
    navigationStateKey: props.navigation.state.key,
  }))(SearchFilterModal),
);

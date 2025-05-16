const State = (() => {
  let rawData = [];
  let filtered = [];
  let sortState = { key: 'overallPerformanceScore', dir: 'desc' };
  let isDataProcessed = false;
  let showAllColumns = false;
  let staticBadgesActive = false;

  function setRows(newRows) {
    rawData = Array.isArray(newRows) ? newRows : [];
  }

  function setFiltered(newFilteredData) {
    filtered = Array.isArray(newFilteredData) ? newFilteredData : [];
  }

  function setSortState(key, dir) {
    sortState = { key, dir };
  }

  function setDataProcessed(status) {
    isDataProcessed = status;
  }

  function setShowAllColumns(status) {
    showAllColumns = status;
  }

  function setStaticBadgesActive(status) {
    staticBadgesActive = status;
  }

  function getRawData() {
    return rawData;
  }

  function getFilteredData() {
    return filtered;
  }

  function getSortState() {
    return sortState;
  }

  function getIsDataProcessed() {
    return isDataProcessed;
  }

  function getShowAllColumns() {
    return showAllColumns;
  }

  function getStaticBadgesActive() {
    return staticBadgesActive;
  }

  return {
    setRows,
    setFiltered,
    setSortState,
    setDataProcessed,
    setShowAllColumns,
    setStaticBadgesActive,
    getRawData,
    getFilteredData,
    getSortState,
    getIsDataProcessed,
    getShowAllColumns,
    getStaticBadgesActive
  };
})();

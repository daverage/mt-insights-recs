const UI = (() => {
  function renderTable() {
    if (!Dom.summaryContainer) {
      console.error("LOG_UI_RENDERTABLE_ERROR: Dom.summaryContainer is not found. Cannot render table.");
      return;
    }

    const tableContainer = Dom.summaryContainer;
    let tableHtml = '';

    if (!State.getFilteredData() || State.getFilteredData().length === 0) {
      tableHtml = '<p class="placeholder-text">No data to display for the current filters. Please upload a CSV or adjust filters.</p>';
      renderSummaryHeader();
      tableContainer.innerHTML = tableHtml;
      if (Actions && typeof Actions.updateActionButtonsState === 'function') {
        Actions.updateActionButtonsState();
      }
      return;
    }

    const columnsToRender = Config.allColumns;
    let finalColumns;

    if (State.getShowAllColumns()) {
      finalColumns = Config.allColumns;
    } else {
      finalColumns = Config.allColumns.filter(col => Config.coreColumnKeys.includes(col.key));
    }

    if (finalColumns.length === 0) {
      console.error("LOG_UI_RENDERTABLE_ERROR: finalColumns is EMPTY. Table will not have headers or data rows.");
      tableHtml = '<p class="content-error-text">Error: Table columns could not be determined.</p>';
      renderSummaryHeader();
      tableContainer.innerHTML = tableHtml;
      return;
    }

    tableHtml += '<table><thead><tr>';
    finalColumns.forEach(col => {
      let headerText = col.label || col.key;
      if (State.getSortState().key === col.key) {
        const arrow = State.getSortState().dir === 'asc' ? ' &uarr;' : ' &darr;';
        headerText += arrow;
      }
      tableHtml += `<th data-sort-key="${col.key}" title="${col.tooltip || ''}">${headerText}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    State.getFilteredData().forEach(row => {
      tableHtml += '<tr>';
      finalColumns.forEach(colDef => {
        let cellContent = '';
        if (colDef.key === 'badgeText') {
          if (row.flag) {
            cellContent = row.flag;
          } else {
            const badgeName = row.badgeText;
            const badgeDef = Config.badgeDefinitions.find(b => b.label === badgeName);
            if (badgeDef) {
              const iconClass = badgeDef.icon || '';
              const styleClass = badgeDef.styleClass || '';
              const tip = badgeDef.tip || badgeName;
              // Use unicode if present
              const unicode = badgeDef.unicode || '';
              cellContent = `<span class="badge-icon ${styleClass} custom-badge-tooltip" data-badgetooltip="${tip}" title="${tip}">${unicode ? unicode : `<i class=\"${iconClass}\"></i>`}</span>`;
            } else {
              cellContent = `<span class="badge-icon" title="${badgeName || ''}">${badgeName || '-'}</span>`;
            }
          }
        } else if (colDef.key === 'experience') {
          if (row.experienceUrl) {
            cellContent = `<a href="${row.experienceUrl}" class="experience-name-link" target="_blank" rel="noopener noreferrer"><strong class="experience-name-text">${row.experience}</strong></a>`;
          } else {
            cellContent = `<strong class="experience-name-text">${Utils.formatCellValue(row[colDef.key], colDef.key)}</strong>`;
          }
          if (row.actionName) {
            let actionHtml = ''
            if (row.actionUrl) {
              actionHtml += `<span class="action-label">Action:</span> <a href="${row.actionUrl}" class="action-name-link action-name" target="_blank" rel="noopener noreferrer">${row.actionName}</a>`;
            } else {
              actionHtml += `<span class="action-name-text action-name">${row.actionName}</span>`;
            }
            cellContent += `<div class="action-details">${actionHtml}</div>`;
          }
        } else {
          cellContent = Utils.formatCellValue(row[colDef.key], colDef.key, row.currencySymbol);
        }
        tableHtml += `<td>${cellContent}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';

    tableContainer.innerHTML = tableHtml;

    addSortingListeners();
    renderSummaryHeader();
    const definitionsCard = document.getElementById('definitionsCard');
    if (definitionsCard) {
      definitionsCard.style.display = 'block';
      definitionsCard.open = true;
    }
    renderDefinitionsKey();
    setupCustomBadgeTooltips();
    if (Actions && typeof Actions.updateActionButtonsState === 'function') {
      Actions.updateActionButtonsState();
    }
  }

  function updateFilters(badges, experiences) {
    Dom.badgeFilter.innerHTML = '';
    Dom.experienceFilter.innerHTML = '';
    Dom.experienceSearch.value = '';

    // badges is now an array of {key, label} objects
    const sortedBadges = badges.sort((a, b) => a.label.localeCompare(b.label));
    const sortedExperiences = [...experiences].sort();

    Dom.badgeFilter.innerHTML = '<option value="All" selected>All Badges</option>' +
      sortedBadges.map(b => `<option value="${b.key}">${b.label}</option>`).join('');
    Dom.experienceFilter.innerHTML = '<option value="All" selected>All Experiences</option>' +
      sortedExperiences.map(e => `<option value="${e}">${e}</option>`).join('');
  }

  function filterExperienceOptions() {
    const searchTerm = Dom.experienceSearch.value.toLowerCase();
    const options = Dom.experienceFilter.options;
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (option.value === 'All') {
        option.classList.remove('hidden');
        continue;
      }
      const optionText = option.textContent.toLowerCase();
      if (optionText.includes(searchTerm)) {
        option.classList.remove('hidden');
      } else {
        option.classList.add('hidden');
      }
    }
  }

  function scrollToSection(section) {
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderSummaryHeader() {
    if (!Dom.summaryHeader) {
      return;
    }
    Dom.summaryHeader.innerHTML = '';

    if (State.getIsDataProcessed()) {
      const downloadBtn = Dom.downloadBtn;
      const generatePromptBtn = Dom.generatePromptBtn;
      const generateAiReportBtn = Dom.generateAiReportBtn;
      const downloadWordBtn = Dom.downloadWordBtn;
      
      Dom.summaryHeader.appendChild(downloadBtn);
      Dom.summaryHeader.appendChild(generatePromptBtn);
      Dom.summaryHeader.appendChild(generateAiReportBtn);
      Dom.summaryHeader.appendChild(downloadWordBtn);
    } else {
      Dom.summaryHeader.innerHTML = '<p class="placeholder-text">Process a file to enable actions.</p>';
    }
  }

  function addSortingListeners() {
    const table = document.getElementById('summary');
    if (!table) {
      console.error("LOG_UI_SORTING_ERROR: Summary table not found for adding sort listeners.");
      return;
    }
    const headers = table.querySelectorAll('thead th');
    if (!headers || headers.length === 0) {
      return;
    }

    headers.forEach(th => {
      const sortKey = th.dataset.sortKey;
      if (sortKey) {
        th.classList.add('sortable-header');
        th.addEventListener('click', () => {
          let newDir = 'desc';
          if (State.getSortState().key === sortKey && State.getSortState().dir === 'desc') { 
            newDir = 'asc';
          } else if (State.getSortState().key === sortKey && State.getSortState().dir === 'asc') { 
            newDir = 'desc';
          }
          State.setSortState(sortKey, newDir); 
          Data.applyFilters(); 
        });
      }
    });
  }

  function renderDefinitionsKey() {
    if (!Dom.definitionsKeyContainer || !Dom.badgesKeyDiv || !Dom.calculatedColumnsKeyDiv) { 
      return;
    }

    let badgesHTML = '<h3>Badges Key</h3><ul>';
    Config.badgeDefinitions.forEach(badge => { 
      badgesHTML += `<li><strong>${badge.label} (<i class="${badge.icon}"></i>):</strong> ${badge.tip}<p>${badge.usage}</p></li>`;
    });
    badgesHTML += '</ul>';
    Dom.badgesKeyDiv.innerHTML = badgesHTML; 

    let calculatedColumnsHTML = '<h3>Calculated Metrics Key</h3><ul>';
    Config.calculatedColumnDefinitions.forEach(col => { 
      calculatedColumnsHTML += `<li><strong>${col.label}:</strong><span class="definition-usage-description">"${col.description}"<p>${col.usage}</p></span></li>`;
    });
    calculatedColumnsHTML += '</ul>';
    Dom.calculatedColumnsKeyDiv.innerHTML = calculatedColumnsHTML; 

    Dom.definitionsKeyContainer.style.display = 'block'; 
  }

  function updateAiReportActionsVisibility(type) {
    const buttons = [
        Dom.copyPromptTextBtn, 
        Dom.downloadPromptDataCsvBtn, 
        Dom.copyAiReportBtn, 
        Dom.downloadAiSourceDataCsvBtn,
        Dom.downloadWordBtnAiHeader
    ];

    buttons.forEach(btn => {
        if (btn) btn.classList.add('hidden');
    });

    if (type === 'prompt') {
        if (Dom.copyPromptTextBtn) {
          Dom.copyPromptTextBtn.classList.remove('hidden');
        }
        if (Dom.downloadPromptDataCsvBtn) {
          Dom.downloadPromptDataCsvBtn.classList.remove('hidden');
        }
    } else if (type === 'report') {
        if (Dom.copyAiReportBtn) {
          Dom.copyAiReportBtn.classList.remove('hidden');
        }
        if (Dom.downloadAiSourceDataCsvBtn) {
          Dom.downloadAiSourceDataCsvBtn.classList.remove('hidden');
        }
        if (Dom.downloadWordBtnAiHeader) {
          Dom.downloadWordBtnAiHeader.classList.remove('hidden');
        }
    }
  }

  function initialiseUI() {
    if (Dom.additionalInstructionsContainer) { 
      Dom.additionalInstructionsContainer.style.display = 'block'; 
    }
    if (Dom.additionalInstructionsTextarea) { 
      Dom.additionalInstructionsTextarea.disabled = true; 
    }
    if (Dom.charCountDisplay) { 
      Dom.charCountDisplay.textContent = '0/500'; 
    }

    renderSummaryHeader();
    renderDefinitionsKey();
    renderTable();
    Actions.updateActionButtonsState(); 
  }

  function setupCustomBadgeTooltips() {
    let tooltipDiv = document.getElementById('custom-badge-tooltip');
    if (!tooltipDiv) {
      tooltipDiv = document.createElement('div');
      tooltipDiv.id = 'custom-badge-tooltip';
      tooltipDiv.style.position = 'absolute';
      tooltipDiv.style.display = 'none';
      tooltipDiv.style.zIndex = '9999';
      tooltipDiv.className = 'custom-badge-tooltip-box';
      document.body.appendChild(tooltipDiv);
    }

    document.querySelectorAll('.badge-icon.custom-badge-tooltip').forEach(el => {
      el.removeEventListener('mouseenter', el._badgeTooltipEnter);
      el.removeEventListener('mouseleave', el._badgeTooltipLeave);
      el.removeEventListener('mousemove', el._badgeTooltipMove);
    });

    document.querySelectorAll('.badge-icon.custom-badge-tooltip').forEach(el => {
      el._badgeTooltipEnter = function(e) {
        const html = el.getAttribute('data-badgetooltip');
        if (!html) return;
        tooltipDiv.innerHTML = html;
        tooltipDiv.style.display = 'block';
        const rect = el.getBoundingClientRect();
        tooltipDiv.style.left = (window.scrollX + rect.right + 8) + 'px';
        tooltipDiv.style.top = (window.scrollY + rect.top) + 'px';
      };
      el._badgeTooltipMove = function(e) {
        tooltipDiv.style.left = (e.pageX + 12) + 'px';
        tooltipDiv.style.top = (e.pageY - 10) + 'px';
      };
      el._badgeTooltipLeave = function() {
        tooltipDiv.style.display = 'none';
      };
      el.addEventListener('mouseenter', el._badgeTooltipEnter);
      el.addEventListener('mousemove', el._badgeTooltipMove);
      el.addEventListener('mouseleave', el._badgeTooltipLeave);
    });
  }
  
  return {
    renderTable,
    renderSummaryHeader,
    updateFilters,
    filterExperienceOptions,
    scrollToSection,
    initialiseUI,
    renderDefinitionsKey,
    setupCustomBadgeTooltips,
    updateAiReportActionsVisibility
  };
})();

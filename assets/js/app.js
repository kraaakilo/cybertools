let allData = [];
let filteredData = [];
let currentSort = { column: null, ascending: true };

// Fuzzy search function
function fuzzyMatch(str, pattern) {
  str = str.toLowerCase();
  pattern = pattern.toLowerCase();

  let patternIdx = 0;
  let strIdx = 0;
  const patternLength = pattern.length;
  const strLength = str.length;

  while (patternIdx < patternLength && strIdx < strLength) {
    if (pattern[patternIdx] === str[strIdx]) {
      patternIdx++;
    }
    strIdx++;
  }

  return patternIdx === patternLength;
}

// Calculate fuzzy score
function fuzzyScore(str, pattern) {
  str = str.toLowerCase();
  pattern = pattern.toLowerCase();

  if (str.includes(pattern)) return 1000; // Exact substring match gets highest score

  let score = 0;
  let patternIdx = 0;
  let consecutiveBonus = 0;

  for (let i = 0; i < str.length && patternIdx < pattern.length; i++) {
    if (str[i] === pattern[patternIdx]) {
      score += 100 + consecutiveBonus;
      consecutiveBonus += 10;
      patternIdx++;
    } else {
      consecutiveBonus = 0;
    }
  }

  return patternIdx === pattern.length ? score : 0;
}

// Load JSON data
async function loadData() {
  try {
    const response = await fetch('resources.json');
    allData = await response.json();
    filteredData = [...allData];

    populateFilters();
    renderTable();
    updateStats();

    document.getElementById('loading').style.display = 'none';
    document.getElementById('resourceTable').style.display = 'table';
  } catch (error) {
    document.getElementById('loading').innerHTML =
      '❌ Error loading data. Make sure resources.json is in the same directory.';
    console.error('Error loading data:', error);
  }
}

// Populate filter dropdowns
function populateFilters() {
  const categories = [...new Set(allData.map(item => item.Category))].sort();
  const subcategories = [...new Set(allData.map(item => item.Subcategory))].sort();
  const types = [...new Set(allData.map(item => item.Type))].sort();
  const costs = [...new Set(allData.map(item => item.Cost))].sort();
  const skills = [...new Set(allData.map(item => item['Skill Level']))].sort();
  const priorities = [...new Set(allData.map(item => item.Priority))].sort();

  populateSelect('categoryFilter', categories);
  populateSelect('subcategoryFilter', subcategories);
  populateSelect('typeFilter', types);
  populateSelect('costFilter', costs);
  populateSelect('skillFilter', skills);
  populateSelect('priorityFilter', priorities);
}

function populateSelect(id, options) {
  const select = document.getElementById(id);
  const firstOption = select.options[0];
  select.innerHTML = '';
  select.appendChild(firstOption);

  options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    select.appendChild(opt);
  });
}

// Apply filters and search
function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.trim();
  const category = document.getElementById('categoryFilter').value;
  const subcategory = document.getElementById('subcategoryFilter').value;
  const type = document.getElementById('typeFilter').value;
  const cost = document.getElementById('costFilter').value;
  const skill = document.getElementById('skillFilter').value;
  const priority = document.getElementById('priorityFilter').value;

  filteredData = allData.filter(item => {
    if (category && item.Category !== category) return false;
    if (subcategory && item.Subcategory !== subcategory) return false;
    if (type && item.Type !== type) return false;
    if (cost && item.Cost !== cost) return false;
    if (skill && item['Skill Level'] !== skill) return false;
    if (priority && item.Priority !== priority) return false;
    return true;
  });

  // Apply fuzzy search
  if (searchTerm) {
    const searchResults = filteredData.map(item => {
      const searchableText = [
        item.Category,
        item.Subcategory,
        item['Resource Name'],
        item.Type,
        item.Description,
        item['URL/Source']
      ].join(' ');

      const score = fuzzyScore(searchableText, searchTerm);
      return { item, score };
    }).filter(result => result.score > 0);

    searchResults.sort((a, b) => b.score - a.score);
    filteredData = searchResults.map(result => result.item);
  }

  renderTable();
  updateStats();
}

// Sort data
function sortData(column) {
  if (currentSort.column === column) {
    currentSort.ascending = !currentSort.ascending;
  } else {
    currentSort.column = column;
    currentSort.ascending = true;
  }

  filteredData.sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];

    // Handle numeric values
    const aNum = parseFloat(aVal);
    const bNum = parseFloat(bVal);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return currentSort.ascending ? aNum - bNum : bNum - aNum;
    }

    // String comparison
    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();

    if (aVal < bVal) return currentSort.ascending ? -1 : 1;
    if (aVal > bVal) return currentSort.ascending ? 1 : -1;
    return 0;
  });

  updateSortIndicators();
  renderTable();
}

function updateSortIndicators() {
  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.column === currentSort.column) {
      th.classList.add(currentSort.ascending ? 'sort-asc' : 'sort-desc');
    }
  });
}

// Render table
function renderTable() {
  const tbody = document.getElementById('tableBody');
  const noResults = document.getElementById('noResults');
  const table = document.getElementById('resourceTable');

  if (filteredData.length === 0) {
    table.style.display = 'none';
    noResults.style.display = 'block';
    return;
  }

  table.style.display = 'table';
  noResults.style.display = 'none';

  tbody.innerHTML = filteredData.map(item => `
<tr>
<td>${escapeHtml(item.Category)}</td>
<td>${escapeHtml(item.Subcategory)}</td>
<td><strong>${escapeHtml(item['Resource Name'])}</strong></td>
<td>${escapeHtml(item.Type)}</td>
<td>${getBadge(item.Cost, item.Cost === 'Free' ? 'free' : 'paid')}</td>
<td><a href="${escapeHtml(item['URL/Source'])}" target="_blank" rel="noopener noreferrer" class="link">${truncate(item['URL/Source'], 40)}</a></td>
<td class="description">${escapeHtml(item.Description)}</td>
<td>${getBadge(item['Skill Level'], item['Skill Level'].toLowerCase())}</td>
<td>${getBadge(item.Priority, item.Priority.toLowerCase())}</td>
</tr>
`).join('');
}

function getBadge(text, type) {
  return `<span class="badge badge-${type}">${escapeHtml(text)}</span>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function truncate(str, length) {
  return str.length > length ? str.substring(0, length) + '...' : str;
}

function updateStats() {
  document.getElementById('resultCount').textContent = filteredData.length;
  document.getElementById('totalCount').textContent = allData.length;

  const filters = [];
  if (document.getElementById('categoryFilter').value) filters.push('Category');
  if (document.getElementById('subcategoryFilter').value) filters.push('Subcategory');
  if (document.getElementById('typeFilter').value) filters.push('Type');
  if (document.getElementById('costFilter').value) filters.push('Cost');
  if (document.getElementById('skillFilter').value) filters.push('Skill Level');
  if (document.getElementById('priorityFilter').value) filters.push('Priority');
  if (document.getElementById('searchInput').value) filters.push('Search');

  const filterStats = document.getElementById('filterStats');
  if (filters.length > 0) {
    filterStats.textContent = `Active filters: ${filters.join(', ')}`;
  } else {
    filterStats.textContent = 'No filters applied';
  }
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('categoryFilter').addEventListener('change', applyFilters);
document.getElementById('subcategoryFilter').addEventListener('change', applyFilters);
document.getElementById('typeFilter').addEventListener('change', applyFilters);
document.getElementById('costFilter').addEventListener('change', applyFilters);
document.getElementById('skillFilter').addEventListener('change', applyFilters);
document.getElementById('priorityFilter').addEventListener('change', applyFilters);

document.querySelectorAll('th.sortable').forEach(th => {
  th.addEventListener('click', () => sortData(th.dataset.column));
});

// Load data on page load
loadData();

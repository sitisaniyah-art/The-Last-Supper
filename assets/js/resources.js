// 加载资源数据
async function loadResources() {
  const response = await fetch('/_data/resources.yml');
  const yamlText = await response.text();
  const resources = jsyaml.load(yamlText);
  
  renderResources(resources);
  setupFilters(resources);
}

// 渲染资源卡片
function renderResources(resources) {
  const grid = document.getElementById('resources-grid');
  grid.innerHTML = '';
  
  resources.forEach(resource => {
    const card = document.createElement('div');
    card.className = 'resource-card';
    
    card.innerHTML = `
      <span class="resource-category">${resource.category} · ${resource.type}</span>
      <h3 class="resource-title">${resource.title}</h3>
      <div class="resource-meta">
        <span><i class="fas fa-user"></i> ${resource.uploader}</span>
        <span><i class="fas fa-calendar"></i> ${resource.date}</span>
        <span><i class="fas fa-download"></i> ${resource.downloads}</span>
        <span><i class="fas fa-star"></i> ${resource.rating}</span>
      </div>
      <p class="resource-description">${resource.description}</p>
      <div class="resource-tags">
        ${resource.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
      <div class="resource-actions">
        <a href="${resource.link}" class="download-btn" target="_blank">下载资源</a>
        <span><i class="fas fa-heart"></i> 收藏</span>
      </div>
    `;
    
    grid.appendChild(card);
  });
}

// 设置筛选功能
function setupFilters(resources) {
  const categoryFilter = document.getElementById('category-filter');
  const gradeFilter = document.getElementById('grade-filter');
  const searchInput = document.getElementById('resource-search');
  
  function filterResources() {
    const category = categoryFilter.value;
    const grade = gradeFilter.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    const filtered = resources.filter(resource => {
      const matchCategory = category === 'all' || resource.category === category;
      const matchGrade = grade === 'all' || resource.grade === grade;
      const matchSearch = resource.title.toLowerCase().includes(searchTerm) || 
                         resource.description.toLowerCase().includes(searchTerm) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      
      return matchCategory && matchGrade && matchSearch;
    });
    
    renderResources(filtered);
  }
  
  categoryFilter.addEventListener('change', filterResources);
  gradeFilter.addEventListener('change', filterResources);
  searchInput.addEventListener('input', filterResources);
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', loadResources);
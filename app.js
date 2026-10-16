const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

createApp({
  setup() {
    const currentView = ref('projects');
    const selectedProject = ref(null);
    const searchQuery = ref('');

    // Resizable sidebar
    const sidebarWidth = ref(256);
    const isResizing = ref(false);

    // Modals
    const showNewProjectModal = ref(false);
    const showAddPartToProjectModal = ref(false);
    const showNewInventoryModal = ref(false);
    const showNewShoppingModal = ref(false);
    const showNewFilamentModal = ref(false);
    const activeDatasheetUrl = ref(null);
    const qrBinModal = ref(null);
    const deleteTarget = ref(null);

    const projects = ref(JSON.parse(localStorage.getItem('maker_projects')) || [
      {
        id: 1,
        title: 'AI Desktop Voice Assistant',
        category: 'AI Device',
        status: 'In Progress',
        targetBudget: 50,
        description: 'An independent desk companion featuring an ESP32-S3 microcontroller, INMP441 digital microphone, and a 1.3-inch OLED display.',
        images: [],
        cadModels: [
          { name: 'Desktop Enclosure Base', url: 'https://printables.com', infill: '15% Gyroid', material: 'PLA', printTime: '2h 10m' }
        ],
        bom: [
          { name: 'ESP32-S3 WROOM Module', qty: 1, price: 6.50 },
          { name: 'INMP441 I2S Microphone', qty: 1, price: 3.20 },
          { name: '1.3" OLED Display', qty: 1, price: 5.00 }
        ],
        pinouts: [
          { mcuPin: 'GPIO 4', componentPin: 'SDA', notes: 'I2C Data Line' },
          { mcuPin: 'GPIO 5', componentPin: 'SCL', notes: 'I2C Clock Line' }
        ]
      }
    ]);

    const inventory = ref(JSON.parse(localStorage.getItem('maker_inventory')) || [
      { id: 1, name: 'ESP32-S3 WROOM', category: 'MCU', quantity: 4, location: 'Box 1 - Microcontrollers', datasheet: '' },
      { id: 2, name: 'Arduino Nano V3', category: 'MCU', quantity: 2, location: 'Box 1 - Microcontrollers', datasheet: '' }
    ]);

    const filamentSpools = ref(JSON.parse(localStorage.getItem('maker_filaments')) || [
      { id: 1, brand: 'Bambu Lab', material: 'PLA Basic', color: 'Cyan', totalGrams: 1000, remainingGrams: 750, temp: '215C', hexColor: '#06b6d4' }
    ]);

    const shoppingList = ref(JSON.parse(localStorage.getItem('maker_shopping')) || [
      { id: 1, name: '2S 450mAh LiPo Battery (XT30)', price: '12.50', link: 'https://www.aliexpress.com' }
    ]);

    const software = ref([
      { id: 1, title: 'FastLED Animation Template', language: 'C++', description: 'Custom LED strip routines for ESP32', snippet: '#include <FastLED.h>' }
    ]);

    const ideas = ref([
      { id: 1, title: 'Smart Plant Monitor', tag: 'IoT', details: 'Capacitive moisture sensor + ESP32 sending metrics via MQTT.' }
    ]);

    const newProject = ref({ title: '', category: 'Robotics', status: 'Planning', targetBudget: null, description: '' });
    const newBomPart = ref({ name: '', qty: 1, price: 0 });
    const newInventoryItem = ref({ name: '', category: '', quantity: 1, location: '', datasheet: '' });
    const newShoppingItem = ref({ name: '', price: '', link: '' });
    const newFilament = ref({ brand: '', material: 'PLA', color: 'Black', totalGrams: 1000, remainingGrams: 1000, temp: '210C' });

    const categoryRecommendations = {
      'Drone': [{ name: 'F4 Flight Controller', qty: 1, price: 35, selected: false }, { name: '1103 Motors', qty: 4, price: 12, selected: false }],
      'Robotics': [{ name: 'Arduino Nano V3', qty: 1, price: 4, selected: false }, { name: 'MG90S Servo', qty: 2, price: 3, selected: false }],
      'Smart Home / IoT': [{ name: 'ESP32-WROOM', qty: 1, price: 5, selected: false }, { name: 'DHT22 Sensor', qty: 1, price: 4, selected: false }],
      'AI Device': [{ name: 'Raspberry Pi Zero 2 W', qty: 1, price: 15, selected: false }, { name: 'USB Mic', qty: 1, price: 5, selected: false }],
      'Display / Media': [{ name: 'ESP32 Display Board', qty: 1, price: 12, selected: false }]
    };

    const recommendedOptions = ref([]);

    const updateRecommendedParts = () => {
      recommendedOptions.value = JSON.parse(JSON.stringify(categoryRecommendations[newProject.value.category] || []));
    };

    watch(showNewProjectModal, (val) => {
      if (val) {
        newProject.value = { title: '', category: 'Robotics', status: 'Planning', targetBudget: null, description: '' };
        updateRecommendedParts();
      }
    });

    watch(projects, val => localStorage.setItem('maker_projects', JSON.stringify(val)), { deep: true });
    watch(inventory, val => localStorage.setItem('maker_inventory', JSON.stringify(val)), { deep: true });
    watch(filamentSpools, val => localStorage.setItem('maker_filaments', JSON.stringify(val)), { deep: true });
    watch(shoppingList, val => localStorage.setItem('maker_shopping', JSON.stringify(val)), { deep: true });

    // Sidebar Resizing
    const startResize = (e) => {
      e.preventDefault();
      isResizing.value = true;
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopResize);
    };

    const handleMouseMove = (e) => {
      if (!isResizing.value) return;
      if (e.clientX >= 180 && e.clientX <= 500) sidebarWidth.value = e.clientX;
    };

    const stopResize = () => {
      isResizing.value = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
    };

    // Calculate BOM Total Cost
    const calculateProjectCost = (project) => {
      if (!project || !project.bom) return 0;
      return project.bom.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0).toFixed(2);
    };

    // Datasheet Previewer
    const openDatasheetModal = (url) => {
      activeDatasheetUrl.value = url;
    };

    // Storage Bin QR Code Generator
    const generateQrLabel = (location) => {
      qrBinModal.value = location;
      nextTick(() => {
        const qr = qrcode(0, 'L');
        qr.addData(`MakerOS Bin: ${location}`);
        qr.make();
        const container = document.getElementById('qrcode-container');
        if (container) container.innerHTML = qr.createImgTag(4);
      });
    };

    // Shareable Summary Report Generator
    const generateProjectReport = (project) => {
      const reportHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>${project.title} - MakerOS Report</title><style>body{font-family:sans-serif;padding:30px;background:#0f172a;color:#f8fafc;} h1{color:#38bdf8;} table{width:100%;border-collapse:collapse;margin:15px 0;} th,td{border:1px solid #334155;padding:8px;text-align:left;}</style></head>
        <body>
          <h1>${project.title} (${project.category})</h1>
          <p><strong>Status:</strong> ${project.status} | <strong>Calculated Cost:</strong> $${calculateProjectCost(project)}</p>
          <p>${project.description}</p>
          <h2>Bill of Materials</h2>
          <table><tr><th>Part Name</th><th>Qty</th><th>Unit Price</th></tr>
          ${project.bom.map(b => `<tr><td>${b.name}</td><td>${b.qty}</td><td>$${b.price || 0}</td></tr>`).join('')}
          </table>
        </body>
        </html>
      `;
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    };

    // 3D CAD Models
    const addCadModel = () => {
      if (!selectedProject.value) return;
      if (!selectedProject.value.cadModels) selectedProject.value.cadModels = [];
      selectedProject.value.cadModels.push({ name: '', url: '', infill: '20%', material: 'PLA', printTime: '' });
    };

    // Computeds
    const filteredProjects = computed(() => {
      if (!searchQuery.value) return projects.value;
      return projects.value.filter(p => p.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.value.toLowerCase()));
    });

    const filteredInventory = computed(() => {
      if (!searchQuery.value) return inventory.value;
      return inventory.value.filter(i => i.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || i.category.toLowerCase().includes(searchQuery.value.toLowerCase()));
    });

    const filteredShopping = computed(() => {
      if (!searchQuery.value) return shoppingList.value;
      return shoppingList.value.filter(s => s.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
    });

    const checkInventoryStock = (partName) => {
      return inventory.value.some(item => item.name.toLowerCase().includes(partName.toLowerCase()) && item.quantity > 0);
    };

    const sendPartToShopping = (part) => {
      shoppingList.value.push({ id: Date.now(), name: part.name, price: (part.price || 0).toString(), link: '' });
    };

    const addPinoutRow = () => {
      if (!selectedProject.value) return;
      if (!selectedProject.value.pinouts) selectedProject.value.pinouts = [];
      selectedProject.value.pinouts.push({ mcuPin: '', componentPin: '', notes: '' });
    };

    const removePinoutRow = (idx) => {
      if (selectedProject.value && selectedProject.value.pinouts) selectedProject.value.pinouts.splice(idx, 1);
    };

    const exportData = () => {
      const backup = { projects: projects.value, inventory: inventory.value, shoppingList: shoppingList.value, filamentSpools: filamentSpools.value };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `makeros-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const importData = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.projects) projects.value = data.projects;
          if (data.inventory) inventory.value = data.inventory;
          if (data.shoppingList) shoppingList.value = data.shoppingList;
          if (data.filamentSpools) filamentSpools.value = data.filamentSpools;
          alert('Workspace restored successfully!');
        } catch (err) {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    };

    const openProject = (project) => {
      selectedProject.value = project;
    };

    const addProject = () => {
      if (!newProject.value.title) return;
      const selectedBom = recommendedOptions.value.filter(rec => rec.selected).map(rec => ({ name: rec.name, qty: rec.qty, price: rec.price }));
      const newId = Date.now();
      projects.value.unshift({ id: newId, ...newProject.value, images: [], cadModels: [], bom: selectedBom, pinouts: [], justCreated: true });
      showNewProjectModal.value = false;
      setTimeout(() => {
        const found = projects.value.find(p => p.id === newId);
        if (found) found.justCreated = false;
      }, 3000);
    };

    const confirmDelete = (type, id) => { deleteTarget.value = { type, id }; };

    const executeDelete = () => {
      if (!deleteTarget.value) return;
      const { type, id } = deleteTarget.value;
      if (type === 'project') { projects.value = projects.value.filter(p => p.id !== id); selectedProject.value = null; }
      else if (type === 'inventory') inventory.value = inventory.value.filter(i => i.id !== id);
      else if (type === 'shopping') shoppingList.value = shoppingList.value.filter(s => s.id !== id);
      deleteTarget.value = null;
    };

    const addPartToProject = () => {
      if (!newBomPart.value.name || !selectedProject.value) return;
      if (!selectedProject.value.bom) selectedProject.value.bom = [];
      selectedProject.value.bom.push({ ...newBomPart.value });
      newBomPart.value = { name: '', qty: 1, price: 0 };
      showAddPartToProjectModal.value = false;
    };

    const removePartFromProject = (index) => {
      if (selectedProject.value) selectedProject.value.bom.splice(index, 1);
    };

    const addInventoryItem = () => {
      if (!newInventoryItem.value.name) return;
      inventory.value.push({ id: Date.now(), ...newInventoryItem.value });
      newInventoryItem.value = { name: '', category: '', quantity: 1, location: '', datasheet: '' };
      showNewInventoryModal.value = false;
    };

    const addShoppingItem = () => {
      if (!newShoppingItem.value.name) return;
      shoppingList.value.push({ id: Date.now(), ...newShoppingItem.value });
      newShoppingItem.value = { name: '', price: '', link: '' };
      showNewShoppingModal.value = false;
    };

    const addFilament = () => {
      if (!newFilament.value.brand) return;
      filamentSpools.value.push({ id: Date.now(), ...newFilament.value });
      newFilament.value = { brand: '', material: 'PLA', color: 'Black', totalGrams: 1000, remainingGrams: 1000, temp: '210C' };
      showNewFilamentModal.value = false;
    };

    const moveToInventory = (shopItem) => {
      inventory.value.push({ id: Date.now(), name: shopItem.name, category: 'Purchased Part', quantity: 1, location: 'Workbench', datasheet: '' });
      shoppingList.value = shoppingList.value.filter(s => s.id !== shopItem.id);
    };

    onMounted(() => { lucide.createIcons(); });
    watch([currentView, selectedProject, deleteTarget, searchQuery], () => { setTimeout(() => lucide.createIcons(), 50); });

    return {
      currentView,
      selectedProject,
      searchQuery,
      sidebarWidth,
      isResizing,
      projects,
      inventory,
      filamentSpools,
      shoppingList,
      software,
      ideas,
      filteredProjects,
      filteredInventory,
      filteredShopping,
      showNewProjectModal,
      showAddPartToProjectModal,
      showNewInventoryModal,
      showNewShoppingModal,
      showNewFilamentModal,
      activeDatasheetUrl,
      qrBinModal,
      deleteTarget,
      newProject,
      newBomPart,
      newInventoryItem,
      newShoppingItem,
      newFilament,
      recommendedOptions,
      updateRecommendedParts,
      openProject,
      addProject,
      confirmDelete,
      executeDelete,
      addPartToProject,
      removePartFromProject,
      addInventoryItem,
      addShoppingItem,
      addFilament,
      moveToInventory,
      checkInventoryStock,
      sendPartToShopping,
      addPinoutRow,
      removePinoutRow,
      exportData,
      importData,
      startResize,
      calculateProjectCost,
      openDatasheetModal,
      generateQrLabel,
      generateProjectReport,
      addCadModel
    };
  }
}).mount('#app');

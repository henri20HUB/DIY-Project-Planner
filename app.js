const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

createApp({
  setup() {
    const currentView = ref('guide'); // Default to guide/intro
    const selectedProject = ref(null);
    const searchQuery = ref('');

    // Resizable sidebar
    const sidebarWidth = ref(256);
    const isResizing = ref(false);

    // Drag and Drop state
    const draggedProject = ref(null);

    // Stopwatch state
    const stopwatchSeconds = ref(0);
    const stopwatchRunning = ref(false);
    let stopwatchInterval = null;

    // Web Serial state
    const serialConnected = ref(false);
    const serialLogs = ref([]);
    const serialInputText = ref('');
    let serialPort = null;

    // Calculator states
    const ohmsVolts = ref(5);
    const ohmsResistance = ref(220);
    const ledSourceV = ref(5);
    const ledForwardV = ref(2.1);
    const ledCurrentMa = ref(20);

    // Modals
    const showNewProjectModal = ref(false);
    const showAddPartToProjectModal = ref(false);
    const showNewInventoryModal = ref(false);
    const showNewShoppingModal = ref(false);
    const showNewMethodModal = ref(false);
    const activeDatasheetUrl = ref(null);
    const qrBinModal = ref(null);
    const deleteTarget = ref(null);

    const projects = ref(JSON.parse(localStorage.getItem('maker_projects')) || [
      {
        id: 1,
        title: 'AI Desktop Voice Assistant',
        category: 'AI Device',
        status: 'Prototyping',
        targetBudget: 50,
        description: 'An independent desk companion featuring an ESP32-S3 microcontroller, INMP441 digital microphone, and a 1.3-inch OLED display.',
        images: [],
        cadModels: [
          { name: 'Desktop Enclosure Base', url: 'https://printables.com', infill: '15% Gyroid', material: 'PLA', printTime: '2h 10m' }
        ],
        bom: [
          { name: 'ESP32-S3 WROOM Module', qty: 1, price: 6.50 },
          { name: 'INMP441 I2S Microphone', qty: 1, price: 3.20 }
        ],
        pinouts: [
          { mcuPin: 'GPIO 4', componentPin: 'SDA', notes: 'I2C Data Line' }
        ]
      }
    ]);

    const inventory = ref(JSON.parse(localStorage.getItem('maker_inventory')) || [
      { id: 1, name: 'ESP32-S3 WROOM', category: 'MCU', quantity: 1, minStock: 2, location: 'Box 1 - Microcontrollers', datasheet: '' }
    ]);

    const manufacturingMethods = ref(JSON.parse(localStorage.getItem('maker_methods')) || [
      { id: 1, name: 'FDM 3D Printing', category: 'Additive', enabled: true, description: 'Standard filament extrusion for enclosures and structural brackets.', materials: 'PLA, PETG, ABS, TPU', specs: 'Layer height: 0.1mm - 0.28mm' },
      { id: 2, name: 'SLA Resin Printing', category: 'Additive', enabled: true, description: 'Photopolymer resin printing for high-precision miniature parts and molds.', materials: 'Standard Resin, Tough Resin', specs: 'Layer height: 0.025mm - 0.05mm' },
      { id: 3, name: 'CNC Milling', category: 'Subtractive', enabled: true, description: 'Computer controlled milling for aluminum and hardwoods.', materials: '6061 Aluminum, Brass, Wood, Acrylic', specs: 'Tolerance: ±0.05mm' },
      { id: 4, name: 'Laser Cutting & Engraving', category: 'Thermal / Optics', enabled: true, description: 'High precision 2D sheet material cutting and panel etching.', materials: 'Plywood, Acrylic, Leather, Cardboard', specs: 'Beam width: 0.1mm' },
      { id: 5, name: 'Custom PCB Fabrication', category: 'Electronics', enabled: true, description: 'Surface-mount circuit board etching, solder paste, and reflow.', materials: 'FR4 Copper Clad, Solder Mask', specs: 'Min trace: 0.15mm' },
      { id: 6, name: 'Silicone Mold Casting', category: 'Forming', enabled: false, description: 'Pouring liquid silicone over master models to cast resin or wax parts.', materials: 'Platinum Silicone, Polyurethane Resin', specs: 'Shore Hardness: 10A - 30A' },
      { id: 7, name: 'Vacuum Thermoforming', category: 'Thermal', enabled: false, description: 'Heating plastic sheets over 3D printed molds with vacuum suction.', materials: 'PETG, HIPS, Polycarbonate', specs: 'Sheet thickness: 0.5mm - 2mm' },
      { id: 8, name: 'Bench Workworking & Fitting', category: 'Manual', enabled: true, description: 'Hand sawing, drilling, tapping, and filing for custom fitting.', materials: 'Hardwoods, Aluminum Extrusions', specs: 'Manual tolerances' }
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
    const newInventoryItem = ref({ name: '', category: '', quantity: 1, minStock: 2, location: '', datasheet: '' });
    const newShoppingItem = ref({ name: '', price: '', link: '' });
    const newMethod = ref({ name: '', category: '', description: '', materials: '', specs: '' });

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
    watch(manufacturingMethods, val => localStorage.setItem('maker_methods', JSON.stringify(val)), { deep: true });
    watch(shoppingList, val => localStorage.setItem('maker_shopping', JSON.stringify(val)), { deep: true });

    // Calculators
    const calculatedAmps = computed(() => {
      if (!ohmsResistance.value || ohmsResistance.value === 0) return 0;
      return (ohmsVolts.value / ohmsResistance.value).toFixed(2);
    });

    const calculatedLedResistor = computed(() => {
      if (!ledCurrentMa.value || ledCurrentMa.value === 0) return 0;
      const amps = ledCurrentMa.value / 1000;
      return Math.round((ledSourceV.value - ledForwardV.value) / amps);
    });

    // Stopwatch Logic
    const formatStopwatch = computed(() => {
      const hrs = Math.floor(stopwatchSeconds.value / 3600).toString().padStart(2, '0');
      const mins = Math.floor((stopwatchSeconds.value % 3600) / 60).toString().padStart(2, '0');
      const secs = (stopwatchSeconds.value % 60).toString().padStart(2, '0');
      return `${hrs}:${mins}:${secs}`;
    });

    const toggleStopwatch = () => {
      stopwatchRunning.value = !stopwatchRunning.value;
      if (stopwatchRunning.value) {
        stopwatchInterval = setInterval(() => { stopwatchSeconds.value++; }, 1000);
      } else {
        clearInterval(stopwatchInterval);
      }
    };

    // Web Serial API
    const connectSerial = async () => {
      if (!('serial' in navigator)) {
        alert('Web Serial API is not supported in this browser.');
        return;
      }
      try {
        serialPort = await navigator.serial.requestPort();
        await serialPort.open({ baudRate: 115200 });
        serialConnected.value = true;
        serialLogs.value.push('[System] Connected successfully to serial port.');

        while (serialPort.readable && serialConnected.value) {
          const textDecoder = new TextDecoderStream();
          const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable);
          const reader = textDecoder.readable.getReader();
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) serialLogs.value.push(value);
            }
          } catch (error) {
            console.error(error);
          } finally {
            reader.releaseLock();
          }
        }
      } catch (err) {
        console.error('Serial connection error:', err);
      }
    };

    const disconnectSerial = async () => {
      if (serialPort) {
        serialConnected.value = false;
        await serialPort.close();
        serialPort = null;
        serialLogs.value.push('[System] Serial port disconnected.');
      }
    };

    const sendSerialCommand = async () => {
      if (!serialPort || !serialPort.writable) return;
      const encoder = new TextEncoder();
      const writer = serialPort.writable.getWriter();
      await writer.write(encoder.encode(serialInputText.value + '\n'));
      serialLogs.value.push(`> ${serialInputText.value}`);
      serialInputText.value = '';
      writer.releaseLock();
    };

    // Drag and Drop & Strict Completion Animation Check
    const onDragStart = (proj) => { draggedProject.value = proj; };
    const onDrop = (targetStage) => {
      if (!draggedProject.value) return;
      changeProjectStage(draggedProject.value, targetStage);
      draggedProject.value = null;
    };
    const onStageSelectChange = (proj, newStage) => { changeProjectStage(proj, newStage); };

    const changeProjectStage = (proj, newStage) => {
      const previousStage = proj.status;
      proj.status = newStage;

      // STRICT CHECK: ONLY PLAY WHEN ENTERING COMPLETED FROM NON-COMPLETED
      if (previousStage !== 'Completed' && newStage === 'Completed') {
        proj.justCompleted = true;
        setTimeout(() => { proj.justCompleted = false; }, 2500);
      }
    };

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

    const calculateProjectCost = (project) => {
      if (!project || !project.bom) return 0;
      return project.bom.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0).toFixed(2);
    };

    const openDatasheetModal = (url) => { activeDatasheetUrl.value = url; };

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

    const addCadModel = () => {
      if (!selectedProject.value) return;
      if (!selectedProject.value.cadModels) selectedProject.value.cadModels = [];
      selectedProject.value.cadModels.push({ name: '', url: '', infill: '20%', material: 'PLA', printTime: '' });
    };

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
      const backup = { projects: projects.value, inventory: inventory.value, shoppingList: shoppingList.value, manufacturingMethods: manufacturingMethods.value };
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
          if (data.manufacturingMethods) manufacturingMethods.value = data.manufacturingMethods;
          alert('Workspace restored successfully!');
        } catch (err) {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    };

    const openProject = (project) => { selectedProject.value = project; };

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
      newInventoryItem.value = { name: '', category: '', quantity: 1, minStock: 2, location: '', datasheet: '' };
      showNewInventoryModal.value = false;
    };

    const addShoppingItem = () => {
      if (!newShoppingItem.value.name) return;
      shoppingList.value.push({ id: Date.now(), ...newShoppingItem.value });
      newShoppingItem.value = { name: '', price: '', link: '' };
      showNewShoppingModal.value = false;
    };

    const addManufacturingMethod = () => {
      if (!newMethod.value.name) return;
      manufacturingMethods.value.push({ id: Date.now(), enabled: true, ...newMethod.value });
      newMethod.value = { name: '', category: '', description: '', materials: '', specs: '' };
      showNewMethodModal.value = false;
    };

    const moveToInventory = (shopItem) => {
      inventory.value.push({ id: Date.now(), name: shopItem.name, category: 'Purchased Part', quantity: 1, minStock: 2, location: 'Workbench', datasheet: '' });
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
      manufacturingMethods,
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
      showNewMethodModal,
      activeDatasheetUrl,
      qrBinModal,
      deleteTarget,
      newProject,
      newBomPart,
      newInventoryItem,
      newShoppingItem,
      newMethod,
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
      addManufacturingMethod,
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
      addCadModel,
      onDragStart,
      onDrop,
      onStageSelectChange,
      stopwatchSeconds,
      stopwatchRunning,
      formatStopwatch,
      toggleStopwatch,
      ohmsVolts,
      ohmsResistance,
      calculatedAmps,
      ledSourceV,
      ledForwardV,
      ledCurrentMa,
      calculatedLedResistor,
      serialConnected,
      serialLogs,
      serialInputText,
      connectSerial,
      disconnectSerial,
      sendSerialCommand
    };
  }
}).mount('#app');

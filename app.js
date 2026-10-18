const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
  setup() {
    // Defaults to Interactive Masterclass ('guide') when visiting for the first time
    const currentView = ref('guide');
    const selectedProject = ref(null);
    const showNewProjectModal = ref(false);
    const showNewInventoryModal = ref(false);
    const showNewShoppingModal = ref(false);
    const draggedProject = ref(null);

    // Sidebar Resizer state
    const sidebarWidth = ref(260);
    const isResizing = ref(false);

    // Tutorial Chapters State & Sandbox
    const tutorialStep = ref(0);
    const demoCelebrationActive = ref(false);

    const tutorialChapters = ref([
      {
        title: 'Projects & BOM Budgeting',
        targetView: 'projects',
        btnText: 'Projects Workspace',
        description: 'Never lose track of what a hardware build costs. Create project cards, assign parts to your Bill of Materials (BOM) with inline editing, and monitor target budgets instantly.',
        bulletPoints: [
          'Inline editing for part names, quantities, and prices',
          'Automated budget calculation vs user-defined limits',
          'Professional shareable project report exports'
        ]
      },
      {
        title: 'Kanban Pipeline & Celebration',
        targetView: 'kanban',
        btnText: 'Kanban Pipeline',
        description: 'Drag and drop your engineering roadmap across stages from Planning to Completed. Moving items into Completed triggers our signature success celebration pulse.',
        bulletPoints: [
          'Smooth drag-and-drop board telemetry',
          'Strict state checks ensuring pulse fires only on completion',
          'Quick stage selector dropdowns for fast organization'
        ]
      },
      {
        title: 'Parts Inventory Management',
        targetView: 'inventory',
        btnText: 'Parts Inventory',
        description: 'Catalog all your loose microcontrollers, sensors, and passive components with designated storage bin locations so you never buy duplicates.',
        bulletPoints: [
          'Physical bin location tags (e.g., Box 1 - Microcontrollers)',
          'Stock quantity tracking and management',
          'Instant deletion and record updates'
        ]
      },
      {
        title: 'Web Serial USB Console',
        targetView: 'serial',
        btnText: 'Web Serial Console',
        description: 'Connect microcontrollers (ESP32, Arduino, Teensy) directly over USB using the Web Serial API to stream live logs and debug firmware in your browser.',
        bulletPoints: [
          'Native browser USB device port selector',
          'Live serial streaming monitor',
          'Command input line to send serial payloads'
        ]
      }
    ]);

    // Enhanced Parts Lexicon with Categories, Descriptions, How-it-works, and Images
    const lexiconSearch = ref('');
    const lexiconCategories = ref([
      {
        id: 'mcu',
        title: 'Microcomputers & Microcontrollers',
        icon: 'cpu',
        isOpen: true,
        overview: 'The brain of your project. MCUs process logic, read sensors, and control actuators, while single-board computers run full Linux operating systems.',
        howItWorks: 'Code is compiled and flashed onto flash memory. GPIO pins handle digital and analog signals, communicating via protocols like I2C, SPI, and UART.',
        items: [
          {
            name: 'ESP32-S3 Module',
            category: 'Microcontroller',
            avgCost: '$5.50',
            description: 'Powerful dual-core Xtensa MCU with integrated Wi-Fi and Bluetooth 5 LE.',
            bestFor: 'IoT dashboards, wireless data logging, smart home devices.',
            specs: '240MHz / 512KB SRAM / USB-OTG',
            image: 'https://images.unsplash.com/photo-1603732551681-2e9146399c15?auto=format&fit=crop&w=400&q=80'
          },
          {
            name: 'Raspberry Pi Pico W',
            category: 'Microcontroller',
            avgCost: '$6.00',
            description: 'RP2040 dual-core ARM Cortex-M0+ processor with onboard wireless chip.',
            bestFor: 'MicroPython scripting, USB device emulation, low-cost automation.',
            specs: '133MHz / 264KB SRAM / PIO state machines',
            image: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=400&q=80'
          },
          {
            name: 'Arduino Nano V3',
            category: 'Microcontroller',
            avgCost: '$4.00',
            description: 'Classic ATmega328P compact board popular for breadboard prototyping.',
            bestFor: 'Simple sensor nodes, beginner robotics, robust 5V logic projects.',
            specs: '16MHz / 32KB Flash / 2KB SRAM / 5V Logic',
            image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=400&q=80'
          }
        ]
      },
      {
        id: 'motors',
        title: 'Motors & Actuators',
        icon: 'activity',
        isOpen: false,
        overview: 'Convert electrical energy into mechanical motion, enabling robots, CNC machines, and automated mechanisms to move physical objects.',
        howItWorks: 'Steppers move in discrete angular steps for precision; servos use internal feedback loops to hold exact angles; DC motors spin continuously when powered.',
        items: [
          {
            name: 'NEMA 17 Stepper Motor',
            category: 'Stepper Motor',
            avgCost: '$14.00',
            description: 'Standard 4-wire bipolar stepper motor providing high holding torque at low speeds.',
            bestFor: '3D printers, CNC routers, linear slides, precision positioning.',
            specs: '1.8° Step Angle (200 steps/rev) / 1.5A per phase',
            image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'
          },
          {
            name: 'SG90 Micro Servo (9g)',
            category: 'Servo Motor',
            avgCost: '$2.50',
            description: 'Lightweight rotational servo motor controlled via PWM pulses (typically 0 to 180 degrees).',
            bestFor: 'RC steering, miniature robot grippers, camera pan/tilt mechanisms.',
            specs: '1.8 kg/cm stall torque / 4.8V DC operating voltage',
            image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=400&q=80'
          }
        ]
      },
      {
        id: 'sensors',
        title: 'Sensors & Transducers',
        icon: 'gauge',
        isOpen: false,
        overview: 'The eyes and ears of your electronics. Sensors detect environmental metrics like temperature, distance, motion, gas, and light.',
        howItWorks: 'Physical changes (resistance, capacitance, optical interruption) are converted into analog voltage levels or digital packets sent over I2C/SPI.',
        items: [
          {
            name: 'BME280 Environmental Sensor',
            category: 'Sensor',
            avgCost: '$5.00',
            description: 'Precision digital sensor measuring temperature, barometric pressure, and relative humidity.',
            bestFor: 'Weather stations, altimeters, indoor climate monitors.',
            specs: 'I2C/SPI Interface / ±1°C Temp Accuracy / Ultra-low power',
            image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80'
          },
          {
            name: 'HC-SR04 Ultrasonic Distance Sensor',
            category: 'Sensor',
            avgCost: '$1.50',
            description: 'Uses sonar echolocation to calculate distance to solid objects by measuring sound wave bounce time.',
            bestFor: 'Obstacle-avoiding robots, fluid level monitoring, proximity alarms.',
            specs: '2cm to 400cm range / 5V TTL / 15° measuring angle',
            image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80'
          }
        ]
      },
      {
        id: 'displays',
        title: 'Displays & Lighting (LEDs)',
        icon: 'sun',
        isOpen: false,
        overview: 'Provide visual telemetry, debugging readouts, and aesthetic lighting effects for user interfaces.',
        howItWorks: 'OLED panels light individual self-illuminating pixels without backlights; addressable LEDs (WS2812B) daisy-chain data signals to control RGB color per pixel.',
        items: [
          {
            name: '1.3" I2C OLED Display (128x64)',
            category: 'Display',
            avgCost: '$4.50',
            description: 'High-contrast monochrome organic LED screen communicating over 2-wire I2C.',
            bestFor: 'Menu systems, real-time sensor graphs, portable device status screens.',
            specs: 'SSD1306 Driver / White or Blue pixels / 3.3V-5V tolerant',
            image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&q=80'
          },
          {
            name: 'WS2812B Addressable LED Strip (1m / 60 LEDs)',
            category: 'Lighting',
            avgCost: '$9.00',
            description: 'Flexible silicone strip where every single LED has an embedded driver chip for custom color chases.',
            bestFor: 'Ambient case lighting, status indicator rings, reactive visual art pieces.',
            specs: '5V DC / 24-bit color control / Single data line protocol',
            image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'
          }
        ]
      }
    ]);

    const filteredLexiconCategories = computed(() => {
      if (!lexiconSearch.value) return lexiconCategories.value;
      const q = lexiconSearch.value.toLowerCase();
      
      // Return categories that match query or contain matching items
      return lexiconCategories.value.map(cat => {
        const matchingItems = cat.items.filter(item => 
          item.name.toLowerCase().includes(q) || 
          item.description.toLowerCase().includes(q) || 
          item.bestFor.toLowerCase().includes(q)
        );
        return {
          ...cat,
          isOpen: matchingItems.length > 0 ? true : cat.isOpen,
          items: matchingItems.length > 0 ? matchingItems : cat.items
        };
      }).filter(cat => cat.items.length > 0);
    });

    const addLexiconPartToShopping = (part) => {
      shoppingList.value.push({
        id: Date.now() + Math.random(),
        name: part.name,
        price: part.avgCost.replace('$', ''),
        link: 'https://aliexpress.com'
      });
      alert(`Added "${part.name}" to your Shopping Wishlist!`);
    };

    const currentChapter = computed(() => tutorialChapters.value[tutorialStep.value]);

    const nextTutorialStep = () => {
      if (tutorialStep.value < tutorialChapters.value.length - 1) tutorialStep.value++;
    };

    const prevTutorialStep = () => {
      if (tutorialStep.value > 0) tutorialStep.value--;
    };

    const jumpToView = (viewName) => {
      currentView.value = viewName;
      selectedProject.value = null;
    };

    const triggerDemoCelebration = () => {
      demoCelebrationActive.value = true;
      setTimeout(() => { demoCelebrationActive.value = false; }, 2500);
    };

    // Web Serial state
    const serialConnected = ref(false);
    const serialLogs = ref([]);
    const serialInputText = ref('');
    let serialPort = null;

    const projects = ref(JSON.parse(localStorage.getItem('maker_projects')) || [
      {
        id: 1,
        title: 'AI Desktop Voice Assistant',
        category: 'AI Device',
        status: 'Prototyping',
        targetBudget: 50,
        description: 'An independent desk companion featuring an ESP32-S3 microcontroller, INMP441 digital microphone, and a 1.3-inch OLED display.',
        bom: [
          { name: 'ESP32-S3 Module', qty: 1, price: 6.50 },
          { name: 'INMP441 Microphone', qty: 1, price: 3.20 }
        ]
      }
    ]);

    const inventory = ref(JSON.parse(localStorage.getItem('maker_inventory')) || [
      { id: 1, name: 'ESP32-S3 Module', quantity: 4, location: 'Box 1 - Microcontrollers' }
    ]);

    const shoppingList = ref(JSON.parse(localStorage.getItem('maker_shopping')) || [
      { id: 1, name: '2S 450mAh LiPo Battery', price: '12.50', link: 'https://aliexpress.com' }
    ]);

    const newProject = ref({ title: '', category: 'Robotics', targetBudget: null, description: '' });
    const newInventoryItem = ref({ name: '', quantity: 1, location: '' });
    const newShoppingItem = ref({ name: '', price: '', link: '' });

    watch(projects, val => localStorage.setItem('maker_projects', JSON.stringify(val)), { deep: true });
    watch(inventory, val => localStorage.setItem('maker_inventory', JSON.stringify(val)), { deep: true });
    watch(shoppingList, val => localStorage.setItem('maker_shopping', JSON.stringify(val)), { deep: true });

    // Sidebar Resizer Handlers
    const startResize = (e) => {
      e.preventDefault();
      isResizing.value = true;
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopResize);
    };

    const handleMouseMove = (e) => {
      if (!isResizing.value) return;
      if (e.clientX >= 220 && e.clientX <= 450) {
        sidebarWidth.value = e.clientX;
      }
    };

    const stopResize = () => {
      isResizing.value = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
    };

    // Web Serial Handlers
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
          serialPort.readable.pipeTo(textDecoder.writable);
          const reader = textDecoder.readable.getReader();
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) serialLogs.value.push(value);
            }
          } catch (err) {
            console.error(err);
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

    // Report Generator
    const generateProjectReport = (project) => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>${project.title} - MakerOS Report</title>
        <style>body{font-family:sans-serif;padding:30px;background:#0f172a;color:#f8fafc;} h1{color:#38bdf8;} table{width:100%;border-collapse:collapse;margin-top:15px;} th,td{border:1px solid #334155;padding:8px;text-align:left;font-size:13px;}</style>
        </head>
        <body>
          <h1>${project.title} (${project.category})</h1>
          <p><strong>Status:</strong> ${project.status} | <strong>Total Cost:</strong> $${calculateProjectCost(project)}</p>
          <p>${project.description}</p>
          <h3>Bill of Materials</h3>
          <table><tr><th>Component</th><th>Qty</th><th>Unit Price</th></tr>
          ${project.bom.map(b => `<tr><td>${b.name}</td><td>${b.qty}</td><td>$${b.price || 0}</td></tr>`).join('')}
          </table>
        </body></html>
      `;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    };

    // Drag and Drop Pipeline Handlers
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

      if (previousStage !== 'Completed' && newStage === 'Completed') {
        proj.justCompleted = true;
        setTimeout(() => { proj.justCompleted = false; }, 2500);
      }
    };

    const calculateProjectCost = (project) => {
      if (!project || !project.bom) return '0.00';
      return project.bom.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0).toFixed(2);
    };

    const openProject = (project) => { selectedProject.value = project; };

    const addProject = () => {
      if (!newProject.value.title) return;
      projects.value.unshift({ id: Date.now(), status: 'Planning', ...newProject.value, bom: [] });
      newProject.value = { title: '', category: 'Robotics', targetBudget: null, description: '' };
      showNewProjectModal.value = false;
    };

    const confirmDelete = (id) => {
      if (confirm('Delete this project?')) {
        projects.value = projects.value.filter(p => p.id !== id);
        selectedProject.value = null;
      }
    };

    const addPartToProject = () => {
      if (!selectedProject.value) return;
      if (!selectedProject.value.bom) selectedProject.value.bom = [];
      selectedProject.value.bom.push({ name: 'New Component', qty: 1, price: 0 });
    };

    const addInventoryItem = () => {
      if (!newInventoryItem.value.name) return;
      inventory.value.push({ id: Date.now(), ...newInventoryItem.value });
      newInventoryItem.value = { name: '', quantity: 1, location: '' };
      showNewInventoryModal.value = false;
    };

    const deleteInventoryItem = (id) => {
      inventory.value = inventory.value.filter(i => i.id !== id);
    };

    const addShoppingItem = () => {
      if (!newShoppingItem.value.name) return;
      shoppingList.value.push({ id: Date.now(), ...newShoppingItem.value });
      newShoppingItem.value = { name: '', price: '', link: '' };
      showNewShoppingModal.value = false;
    };

    const deleteShoppingItem = (id) => {
      shoppingList.value = shoppingList.value.filter(s => s.id !== id);
    };

    const moveToInventory = (item) => {
      inventory.value.push({ id: Date.now(), name: item.name, quantity: 1, location: 'Workbench Bin' });
      shoppingList.value = shoppingList.value.filter(s => s.id !== item.id);
    };

    const exportData = () => {
      const backup = { projects: projects.value, inventory: inventory.value, shoppingList: shoppingList.value };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `makeros-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
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
          alert('Workspace imported successfully.');
        } catch (err) {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    };

    onMounted(() => { lucide.createIcons(); });
    watch([currentView, selectedProject, tutorialStep, lexiconCategories], () => { setTimeout(() => lucide.createIcons(), 50); }, { deep: true });

    return {
      currentView,
      selectedProject,
      showNewProjectModal,
      showNewInventoryModal,
      showNewShoppingModal,
      projects,
      inventory,
      shoppingList,
      newProject,
      newInventoryItem,
      newShoppingItem,
      sidebarWidth,
      startResize,
      serialConnected,
      serialLogs,
      serialInputText,
      connectSerial,
      disconnectSerial,
      sendSerialCommand,
      generateProjectReport,
      openProject,
      addProject,
      confirmDelete,
      addPartToProject,
      addInventoryItem,
      deleteInventoryItem,
      addShoppingItem,
      deleteShoppingItem,
      moveToInventory,
      exportData,
      importData,
      calculateProjectCost,
      onDragStart,
      onDrop,
      onStageSelectChange,
      tutorialStep,
      tutorialChapters,
      lexiconCategories,
      lexiconSearch,
      filteredLexiconCategories,
      addLexiconPartToShopping,
      currentChapter,
      nextTutorialStep,
      prevTutorialStep,
      jumpToView,
      demoCelebrationActive,
      triggerDemoCelebration
    };
  }
}).mount('#app');

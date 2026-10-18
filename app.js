const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
  setup() {
    const currentView = ref('guide');
    const selectedProject = ref(null);
    const showNewProjectModal = ref(false);
    const showNewInventoryModal = ref(false);
    const showNewShoppingModal = ref(false);
    const projectToDelete = ref(null); // Personalized deletion state
    const draggedProject = ref(null);

    const sidebarWidth = ref(260);
    const isResizing = ref(false);

    const tutorialStep = ref(0);
    const demoCelebrationActive = ref(false);

    const tutorialChapters = ref([
      {
        title: 'Projects & BOM Budgeting',
        targetView: 'projects',
        btnText: 'Projects Workspace',
        description: 'Track build costs with project cards, BOM line items, and real-time budget calculations.',
        bulletPoints: ['Inline editing', 'Automated budget tracking', 'Report exports']
      },
      {
        title: 'Kanban Pipeline & Celebration',
        targetView: 'kanban',
        btnText: 'Kanban Pipeline',
        description: 'Drag and drop your engineering roadmap across build stages from Planning to Completed.',
        bulletPoints: ['Smooth drag-and-drop board', 'Completion celebration pulse', 'Quick dropdown selectors']
      },
      {
        title: 'Parts Inventory Management',
        targetView: 'inventory',
        btnText: 'Parts Inventory',
        description: 'Catalog loose hardware and storage locations so you never repurchase existing items.',
        bulletPoints: ['Storage bin tags', 'Stock quantity management', 'Instant record updates']
      },
      {
        title: 'Web Serial USB Console',
        targetView: 'serial',
        btnText: 'Web Serial Console',
        description: 'Connect microcontrollers directly over USB via the Web Serial API to view logs.',
        bulletPoints: ['Native browser USB port selector', 'Live telemetry monitor', 'Command line input']
      },
      {
        title: 'Parts Lexicon & Sourcing Directory',
        targetView: 'lexicon',
        btnText: 'Parts Lexicon',
        description: 'Browse text-optimized component categories and push parts directly to your shopping wishlist.',
        bulletPoints: ['Massive component catalog', 'Working principles & specs', 'Direct wishlist integration']
      },
      {
        title: 'DIY Project Lifecycle Guide',
        targetView: 'lifecycle',
        btnText: 'Lifecycle Course',
        description: 'A beginner-friendly 6-phase mastercourse taking you from an initial idea to a finished physical build.',
        bulletPoints: ['Structured milestones', 'Action item checklists', 'Breadboard prototyping tips']
      }
    ]);

    const lifecyclePhases = ref([
      {
        id: 1,
        title: 'Phase 1: Ideation & Feasibility Check',
        subtitle: 'Defining the goal and verifying what is physically possible',
        duration: '1-2 Days',
        description: 'Clearly define what problem your project solves and list core inputs and outputs.',
        actions: ['Write a 2-sentence mission statement.', 'Identify inputs (sensors, buttons).', 'Identify outputs (motors, screens).'],
        proTip: 'Keep your first build focused on a single function.'
      },
      {
        id: 2,
        title: 'Phase 2: Architecture & Component Selection',
        subtitle: 'Choosing the microcontroller, sensors, and power source',
        duration: '2-3 Days',
        description: 'Match your project requirements against microcontroller specs and compatible voltage rails.',
        actions: ['Select primary microcontroller.', 'Verify communication protocols (I2C/SPI).', 'Calculate total current draw.'],
        proTip: 'Always buy extra passive components (resistors, LEDs) in case of accidental damage.'
      },
      {
        id: 3,
        title: 'Phase 3: Breadboarding & Schematic Design',
        subtitle: 'Solderless prototyping and wiring validation',
        duration: '3-5 Days',
        description: 'Plug components into a solderless breadboard to test electrical connections.',
        actions: ['Connect power and ground rails.', 'Wire inputs and outputs.', 'Double-check polarity before powering.'],
        proTip: 'Never plug or unplug components while power is connected!'
      },
      {
        id: 4,
        title: 'Phase 4: Code & Firmware Development',
        subtitle: 'Writing logic and debugging via Serial output',
        duration: '4-7 Days',
        description: 'Write microcontroller code and test individual sensors one by one.',
        actions: ['Test example code per sensor.', 'Print diagnostic telemetry to Web Serial.', 'Combine logic into main loop.'],
        proTip: 'Use serial print statements liberally to inspect variable values.'
      },
      {
        id: 5,
        title: 'Phase 5: Assembly & Mechanical Integration',
        subtitle: 'Soldering, enclosures, and structural mounting',
        duration: '3-5 Days',
        description: 'Transfer your breadboard design onto a perf board or PCB and secure inside an enclosure.',
        actions: ['Solder permanent connections.', 'Mount switches and ports.', 'Secure internal wiring.'],
        proTip: 'Leave extra wire length inside enclosures for easier maintenance.'
      },
      {
        id: 6,
        title: 'Phase 6: Testing, Refinement & Documentation',
        subtitle: 'Stress testing, fixing edge cases, and logging notes',
        duration: 'Ongoing',
        description: 'Run your device continuously to verify stability and log your final BOM.',
        actions: ['Perform 24-hour power run test.', 'Log final parts into MakerOS.', 'Export shareable report.'],
        proTip: 'Store your working code in a version control repo like GitHub.'
      }
    ]);

    const lexiconSearch = ref('');
    const lexiconCategories = ref([
      {
        id: 'mcu',
        title: 'Microcontrollers & Single-Board Computers',
        icon: 'cpu',
        isOpen: true,
        overview: 'The computational cores of embedded systems. MCUs execute low-level firmware, while SBCs run full operating systems.',
        howItWorks: 'Code runs in onboard flash memory. GPIO pins interface with peripherals using SPI, I2C, or UART protocols.',
        items: [
          { name: 'ESP32-S3 DevKit', category: 'Microcontroller', avgCost: '$6.50', description: 'Dual-core 240MHz Xtensa processor with native Wi-Fi and BLE 5.', bestFor: 'IoT gateways & wireless devices', specs: '240MHz / 512KB SRAM / USB-OTG' },
          { name: 'Raspberry Pi Pico W', category: 'Microcontroller', avgCost: '$6.00', description: 'RP2040 dual-core ARM Cortex-M0+ with integrated wireless chip.', bestFor: 'MicroPython scripts & USB HID devices', specs: '133MHz / 264KB SRAM / PIO state machines' },
          { name: 'Arduino Nano V3', category: 'Microcontroller', avgCost: '$4.00', description: 'Classic ATmega328P compact board for breadboard prototyping.', bestFor: 'Beginner robotics & 5V logic sensors', specs: '16MHz / 32KB Flash / 5V Logic' },
          { name: 'Raspberry Pi 5 (8GB)', category: 'SBC', avgCost: '$80.00', description: 'High-performance Linux computer for heavy processing and machine vision.', bestFor: 'Edge AI servers & computer vision hubs', specs: 'Quad-core 2.4GHz ARM / 8GB LPDDR4' }
        ]
      },
      {
        id: 'passives',
        title: 'Passive Components (Resistors, Capacitors, Inductors)',
        icon: 'sliders',
        isOpen: false,
        overview: 'Foundational elements that shape voltage, limit current, filter noise, and store electrostatic energy.',
        howItWorks: 'Resistors restrict current (V=IR). Capacitors smooth voltage ripples by temporarily storing charge.',
        items: [
          { name: 'Carbon Film Resistor Kit (1/4W)', category: 'Passive', avgCost: '$7.00', description: 'Axial lead resistors for current limiting and pull-up/pull-down lines.', bestFor: 'LED current limiting & biasing transistors', specs: '5% Tolerance / 0.25W rating' },
          { name: 'Electrolytic Capacitor Assortment', category: 'Passive', avgCost: '$5.50', description: 'Polarized energy storage cells used across power rails to filter noise.', bestFor: 'Power supply filtering & decoupling', specs: '10uF to 470uF / Various voltages' },
          { name: 'Ceramic Disc Capacitors (100nF)', category: 'Passive', avgCost: '$3.00', description: 'Non-polarized capacitors for bypassing high-frequency noise to ground.', bestFor: 'Placing near IC power pins', specs: '50V rating / 100nF (0.1uF)' }
        ]
      },
      {
        id: 'semiconductors',
        title: 'Discrete Semiconductors (Diodes, Transistors, MOSFETs)',
        icon: 'zap',
        isOpen: false,
        overview: 'Active semiconductor components that switch or amplify electrical signals and control power flow.',
        howItWorks: 'Diodes permit current flow in one direction only. Transistors and MOSFETs act as electronic switches driven by gate/base voltages.',
        items: [
          { name: '1N4007 Rectifier Diodes (Pack of 50)', category: 'Semiconductor', avgCost: '$3.00', description: 'General-purpose silicon rectifier diodes protecting circuits from reverse polarity.', bestFor: 'Flyback suppression on inductive motor loads', specs: '1000V / 1A rating' },
          { name: '2N2222 NPN Transistors (Pack of 25)', category: 'Semiconductor', avgCost: '$2.50', description: 'Standard switching transistors to drive higher-current loads from microcontrollers.', bestFor: 'Driving small relays, buzzers, and LEDs', specs: '800mA max collector current' },
          { name: 'IRLZ44N Logic-Level MOSFET', category: 'Semiconductor', avgCost: '$1.50', description: 'Power MOSFET that switches fully open with 5V or 3.3V gate logic.', bestFor: 'PWM controlling DC motors and LED strips', specs: '55V / 47A max drain current' }
        ]
      },
      {
        id: 'wiring',
        title: 'Wiring, Cables & Interconnects',
        icon: 'git-commit',
        isOpen: false,
        overview: 'The physical nervous system connecting power supplies, data buses, and peripheral hardware.',
        howItWorks: 'Multi-strand copper conductors coated in flexible insulation minimize resistance and mechanical stress.',
        items: [
          { name: 'Dupont Jumper Wire Bundle (120 pcs)', category: 'Interconnect', avgCost: '$4.00', description: 'Flexible ribbon cables with pre-crimped pin headers for breadboards.', bestFor: 'Prototyping sensors & GPIO breakouts', specs: '20cm length / Male-Female-Male mixes' },
          { name: 'Silicone Hook-Up Wire Reel Kit (22 AWG)', category: 'Interconnect', avgCost: '$12.00', description: 'Flexible stranded tinned copper wire with high-temp silicone insulation.', bestFor: 'Permanent wiring & custom harnesses', specs: '6 vibrant colors / 30ft total' },
          { name: 'USB-C Shielded Data/Power Cable', category: 'Cable', avgCost: '$6.00', description: 'Heavy-gauge shielded copper cable supporting high-speed serial and power.', bestFor: 'Flashing MCUs & serial debugging', specs: 'USB 2.0 high-speed data pairs' }
        ]
      },
      {
        id: 'proto',
        title: 'Prototyping Boards & PCBs',
        icon: 'grid',
        isOpen: false,
        overview: 'Platforms used to build temporary or permanent electronic circuits without custom fabrication.',
        howItWorks: 'Breadboards use internal spring clips for solderless connections. Perf boards and PCBs use copper traces.',
        items: [
          { name: 'Solderless Breadboard (830 Tie Points)', category: 'Prototyping', avgCost: '$3.50', description: 'Reusable plastic block with internal spring clips and power rails.', bestFor: 'Initial circuit layout & testing', specs: '830 tie points / Adhesive backing' },
          { name: 'Double-Sided Perf Board Assortment', category: 'PCB', avgCost: '$5.00', description: 'FR4 fiberglass boards with plated through-holes for permanent soldering.', bestFor: 'Transitioning breadboard projects to permanent builds', specs: '1.6mm thickness / 2.54mm grid' }
        ]
      },
      {
        id: 'power',
        title: 'Power Supplies, Batteries & Regulation ICs',
        icon: 'battery-charging',
        isOpen: false,
        overview: 'Components responsible for generating, regulating, and storing electrical energy safely.',
        howItWorks: 'Linear or switching regulators step down higher voltages to stable 3.3V or 5V logic rails.',
        items: [
          { name: 'AMS1117 3.3V Voltage Regulator Module', category: 'Power', avgCost: '$1.00', description: 'Step-down voltage regulator converting 5V inputs down to stable 3.3V.', bestFor: 'Powering ESP32/ESP8266 modules', specs: '800mA max output current' },
          { name: 'TP4056 LiPo Battery Charger Board', category: 'Power', avgCost: '$0.80', description: 'Single-cell lithium battery charging module with micro-USB or USB-C input.', bestFor: 'Rechargeable portable project builds', specs: '1A max charge current with protection' }
        ]
      },
      {
        id: 'motors',
        title: 'Motors & Actuators',
        icon: 'activity',
        isOpen: false,
        overview: 'Electromechanical devices translating electrical currents into angular or linear motion.',
        howItWorks: 'Steppers move in discrete angular steps; servos use internal feedback circuits to hold precise angles.',
        items: [
          { name: 'NEMA 17 Stepper Motor', category: 'Actuator', avgCost: '$14.00', description: 'Hybrid bipolar stepper motor with high holding torque.', bestFor: '3D printers & CNC positioning stages', specs: '1.8° step angle / 1.2A rating' },
          { name: 'SG90 Micro Servo (9g)', category: 'Actuator', avgCost: '$2.50', description: 'Compact rotary actuator controlled via PWM pulses.', bestFor: 'Robotic grippers & camera pan/tilt', specs: '1.8 kg/cm torque / 4.8V limit' }
        ]
      },
      {
        id: 'sensors',
        title: 'Sensors & Transducers',
        icon: 'gauge',
        isOpen: false,
        overview: 'Transducers that capture environmental attributes and convert them into readable electrical data.',
        howItWorks: 'Sensing elements experience physical changes translated into digital data packets over I2C or SPI.',
        items: [
          { name: 'BME280 Environmental Sensor', category: 'Sensor', avgCost: '$5.00', description: 'Digital sensor measuring barometric pressure, temperature, and humidity.', bestFor: 'Weather stations & indoor monitors', specs: 'I2C/SPI / Low power consumption' },
          { name: 'HC-SR04 Ultrasonic Distance Sensor', category: 'Sensor', avgCost: '$1.50', description: 'Sonar echolocation sensor calculating distance to solid obstacles.', bestFor: 'Obstacle-avoiding robots', specs: '2cm to 400cm range / 5V TTL' }
        ]
      }
    ]);

    const filteredLexiconCategories = computed(() => {
      if (!lexiconSearch.value) return lexiconCategories.value;
      const q = lexiconSearch.value.toLowerCase();
      
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
        link: 'https://www.adafruit.com'
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
      { id: 1, name: '2S 450mAh LiPo Battery', price: '12.50', link: 'https://www.adafruit.com' }
    ]);

    const newProject = ref({ title: '', category: 'Robotics', targetBudget: null, description: '' });
    const newInventoryItem = ref({ name: '', quantity: 1, location: '' });
    const newShoppingItem = ref({ name: '', price: '', link: '' });

    watch(projects, val => localStorage.setItem('maker_projects', JSON.stringify(val)), { deep: true });
    watch(inventory, val => localStorage.setItem('maker_inventory', JSON.stringify(val)), { deep: true });
    watch(shoppingList, val => localStorage.setItem('maker_shopping', JSON.stringify(val)), { deep: true });

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

    // Personal Custom In-Page Delete Prompt Trigger
    const promptDeleteProject = (project) => {
      projectToDelete.value = project;
    };

    // Personalized Deletion Handler
    const confirmDeleteProject = () => {
      if (!projectToDelete.value) return;
      const targetId = projectToDelete.value.id;
      projects.value = projects.value.filter(p => p.id !== targetId);
      selectedProject.value = null;
      projectToDelete.value = null;
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
    watch([currentView, selectedProject, tutorialStep, lexiconCategories, projectToDelete], () => { setTimeout(() => lucide.createIcons(), 50); }, { deep: true });

    return {
      currentView,
      selectedProject,
      showNewProjectModal,
      showNewInventoryModal,
      showNewShoppingModal,
      projectToDelete,
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
      promptDeleteProject,
      confirmDeleteProject,
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
      lifecyclePhases,
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

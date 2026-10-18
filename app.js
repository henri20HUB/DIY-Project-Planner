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

    // Tutorial Chapters State & Sandbox (UPDATED with Lexicon & DIY Lifecycle)
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
      },
      {
        title: 'Parts Lexicon & Wishlist Integration',
        targetView: 'lexicon',
        btnText: 'Parts Lexicon',
        description: 'Browse curated electronic component categories with working principle descriptions, real hardware photos, and one-click additions to your Wishlist.',
        bulletPoints: [
          'Collapsible categories for microcontrollers, motors, passives, and cables',
          'Detailed specs, current limits, and recommended use cases',
          'Direct "+ Add to Shopping Wishlist" push buttons'
        ]
      },
      {
        title: 'DIY Project Lifecycle Guide',
        targetView: 'lifecycle',
        btnText: 'Lifecycle Course',
        description: 'A 6-phase beginner course walking through how to take a DIY hardware project from a blank page to a finished physical build with zero prior experience.',
        bulletPoints: [
          '6 structured phases: Ideation, Architecture, Breadboarding, Code, Assembly, Testing',
          'Action item checklists and pro-tips for avoiding beginner mistakes',
          'Breadboard-first prototyping guidelines'
        ]
      }
    ]);

    // New DIY Project Lifecycle Mastercourse Content
    const lifecyclePhases = ref([
      {
        id: 1,
        title: 'Phase 1: Ideation & Feasibility Check',
        subtitle: 'Defining the goal and verifying what is physically possible',
        duration: '1-2 Days',
        description: 'Before buying components, clearly define what problem your project solves and list the core inputs (sensors/buttons) and outputs (motors/displays) required.',
        actions: [
          'Write down a 2-sentence mission statement for the build.',
          'Identify necessary inputs (e.g., button press, temperature sensor).',
          'Identify necessary outputs (e.g., spinning a wheel, lighting an OLED screen).'
        ],
        proTip: 'Avoid "scope creep" on your first build. Keep your initial goal focused on a single function (e.g., turn on a fan when it gets warm).'
      },
      {
        id: 2,
        title: 'Phase 2: Architecture & Component Selection',
        subtitle: 'Choosing the microcontroller, sensors, and power source',
        duration: '2-3 Days',
        description: 'Match your project requirements against microcontroller specifications. Pick components that run at compatible voltage levels (typically 3.3V or 5V).',
        actions: [
          'Select a primary microcontroller (e.g., ESP32 for Wi-Fi, Arduino Nano for basic 5V sensors).',
          'Verify sensor communication protocols (I2C uses 2 pins, SPI uses 4 pins).',
          'Calculate total current draw to select an appropriate power supply or battery.'
        ],
        proTip: 'Always buy 1 or 2 extra passive components (resistors, LEDs, jumpers). They are inexpensive and easy to damage by mistake.'
      },
      {
        id: 3,
        title: 'Phase 3: Breadboarding & Schematic Design',
        subtitle: 'Solderless prototyping and wiring validation',
        duration: '3-5 Days',
        description: 'Plug your parts into a solderless breadboard to test electrical connections before committing to permanent soldering.',
        actions: [
          'Connect power and ground rails across your breadboard.',
          'Wire your microcontroller to inputs and outputs using jumper cables.',
          'Double-check polarity on electrolytic capacitors and LEDs before powering on.'
        ],
        proTip: 'Never plug or unplug components on a breadboard while power is connected. Always disconnect USB/power first!'
      },
      {
        id: 4,
        title: 'Phase 4: Code & Firmware Development',
        subtitle: 'Writing logic and debugging via Serial output',
        duration: '4-7 Days',
        description: 'Write microcontroller code using MicroPython, Arduino C++, or CircuitPython. Test individual sensors one by one before combining them into a single script.',
        actions: [
          'Test example code for each sensor individually.',
          'Print diagnostic telemetry to the Web Serial terminal for live debugging.',
          'Combine input triggers and output logic into a main loop.'
        ],
        proTip: 'Use `Serial.println()` liberally to inspect variable values in real-time.'
      },
      {
        id: 5,
        title: 'Phase 5: Assembly & Mechanical Integration',
        subtitle: 'Soldering, enclosures, and structural mounting',
        duration: '3-5 Days',
        description: 'Transfer your breadboard design onto a perf board or custom PCB, and secure components inside a 3D printed or custom acrylic enclosure.',
        actions: [
          'Solder permanent connections onto perf boards or custom PCBs.',
          'Mount switches, ports, and displays onto your enclosure walls.',
          'Secure internal wiring using heat-shrink tubing and zip ties.'
        ],
        proTip: 'Leave extra wire length inside enclosures to make maintenance and debugging easier.'
      },
      {
        id: 6,
        title: 'Phase 6: Testing, Refinement & Documentation',
        subtitle: 'Stress testing, fixing edge cases, and logging notes',
        duration: 'Ongoing',
        description: 'Run your device continuously to verify stability, clean up your source code repository, and record a final BOM in MakerOS.',
        actions: [
          'Perform a 24-hour continuous power run test.',
          'Log final component prices and bin locations into your MakerOS workspace.',
          'Export a shareable project report for your records.'
        ],
        proTip: 'Store your working code and schematics in a version control repo (e.g., GitHub) for easy recovery.'
      }
    ]);

    // Enhanced Specific Hardware Lexicon
    const lexiconSearch = ref('');
    const lexiconCategories = ref([
      {
        id: 'mcu',
        title: 'Microcomputers & Microcontrollers',
        icon: 'cpu',
        isOpen: true,
        overview: 'The computational cores of embedded systems. MCUs execute deterministic low-level firmware tasks, while SBCs manage full operating systems.',
        howItWorks: 'Firmware executes in onboard flash memory. General Purpose Input/Output (GPIO) pins interface with peripherals using SPI, I2C, or UART protocols.',
        items: [
          {
            name: 'ESP32-S3 DevKit Module',
            category: 'Microcontroller',
            avgCost: '$6.50',
            description: 'Dual-core 240MHz Xtensa processor featuring native Wi-Fi, BLE 5, and vector extension instructions for edge processing.',
            bestFor: 'IoT telemetry gateways, wireless devices, and smart automation hardware.',
            specs: '240MHz / 512KB SRAM / USB-OTG / 2.4GHz Wi-Fi',
            image: 'https://images.unsplash.com/photo-1603732551681-2e9146399c15?auto=format&fit=crop&w=500&q=80'
          },
          {
            name: 'Raspberry Pi Pico W',
            category: 'Microcontroller',
            avgCost: '$6.00',
            description: 'RP2040 silicon board featuring dual ARM Cortex-M0+ cores and an integrated Infineon Wi-Fi/BLE chip.',
            bestFor: 'MicroPython scripting, custom USB Human Interface Devices (HID), and educational IoT.',
            specs: '133MHz / 264KB SRAM / Programmable I/O (PIO)',
            image: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=500&q=80'
          }
        ]
      },
      {
        id: 'passives',
        title: 'Passive Components (Resistors & Capacitors)',
        icon: 'sliders',
        isOpen: false,
        overview: 'Essential foundational elements that do not source power but shape voltage, limit current, filter noise, and stabilize power rails.',
        howItWorks: 'Resistors restrict current flow following Ohm’s law (V=IR). Capacitors temporarily store and discharge electrostatic energy to smooth voltage ripple.',
        items: [
          {
            name: 'Carbon Film Resistor Kit (1/4W, 10Ω - 1MΩ)',
            category: 'Passive Component',
            avgCost: '$7.00',
            description: 'Standard through-hole axial resistors used for current limiting, pull-up/pull-down lines, and voltage division.',
            bestFor: 'LED current limiting, transistor biasing, logic line default states.',
            specs: '5% Tolerance / 0.25 Watt rating / Standard axial lead',
            image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=500&q=80'
          },
          {
            name: 'Electrolytic & Ceramic Decoupling Capacitors',
            category: 'Passive Component',
            avgCost: '$5.50',
            description: 'Energy storage cells placed across power input rails to filter out high-frequency electrical noise and transient voltage spikes.',
            bestFor: 'Power supply filtering, motor noise suppression, timing oscillator circuits.',
            specs: 'Values ranging from 22pF to 470uF / Various voltage ratings',
            image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80'
          }
        ]
      },
      {
        id: 'wiring',
        title: 'Wiring, Cables & Interconnects',
        icon: 'git-commit',
        isOpen: false,
        overview: 'The physical nervous system connecting power supplies, data buses, shields, and peripheral modules together.',
        howItWorks: 'Multi-strand copper conductors coated in flexible PVC/silicone insulation minimize resistance and mechanical fatigue during movement.',
        items: [
          {
            name: 'Dupont Jumper Wire Bundle (Male-to-Female/Male-to-Male)',
            category: 'Interconnect',
            avgCost: '$4.00',
            description: 'Flexible multi-colored ribbon wires with pre-crimped pin headers for quick breadboard and header pin interfacing.',
            bestFor: 'Prototyping sensors, connecting breakout boards to microcontroller pins.',
            specs: '20cm length / 40-pin ribbon / 2.54mm standard pitch',
            image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=500&q=80'
          },
          {
            name: 'USB-C to Data/Power Shielded Cable',
            category: 'Cable',
            avgCost: '$6.00',
            description: 'Heavy-gauge shielded copper cable supporting high-speed serial data transmission and high-current power delivery.',
            bestFor: 'Flashing microcontrollers, debugging via Web Serial, powering bench circuits.',
            specs: 'USB 2.0/3.1 high-speed data pairs / Foil shield drain wire',
            image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=500&q=80'
          }
        ]
      },
      {
        id: 'proto',
        title: 'Prototyping Boards (Breadboards & PCBs)',
        icon: 'grid',
        isOpen: false,
        overview: 'Platforms used to build temporary or permanent electronic circuits without immediately fabricating custom circuit boards.',
        howItWorks: 'Breadboards use internal spring-clip rows for solderless plug-and-play prototyping. Solder/perf boards and PCBs use copper traces to permanently connect soldered components.',
        items: [
          {
            name: 'Solderless Breadboard (830 Tie Points)',
            category: 'Prototyping',
            avgCost: '$3.50',
            description: 'Reusable plastic block with internal interconnecting metal spring clips arranged in rows and power distribution rails.',
            bestFor: 'Initial circuit layout, testing schematic behavior before soldering.',
            specs: '830 tie points / Dual power rails / Adhesive foam backing',
            image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=500&q=80'
          },
          {
            name: 'Double-Sided Prototype Perf Boards & Custom PCBs',
            category: 'PCB',
            avgCost: '$5.00',
            description: 'FR4 fiberglass boards with plated through-holes allowing makers to solder components into permanent layouts.',
            bestFor: 'Finalizing breadboard circuits into robust, permanent hardware modules.',
            specs: 'FR4 material / 1.6mm thickness / 2.54mm grid hole spacing',
            image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80'
          }
        ]
      },
      {
        id: 'motors',
        title: 'Motors & Actuators',
        icon: 'activity',
        isOpen: false,
        overview: 'Electromechanical devices that translate electrical currents into precise angular or linear mechanical work.',
        howItWorks: 'Steppers energize internal electromagnetic stator coils sequentially to lock onto specific step increments; servos use internal feedback circuits to lock positions.',
        items: [
          {
            name: 'NEMA 17 Stepper Motor',
            category: 'Actuator',
            avgCost: '$14.00',
            description: 'Hybrid bipolar stepper motor capable of high holding torque with precise 1.8-degree step increments.',
            bestFor: '3D printers, CNC positioning stages, and automated linear actuators.',
            specs: '1.8° Step Angle (200 steps/rev) / 1.2A rating',
            image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80'
          },
          {
            name: 'SG90 Micro Servo (9g)',
            category: 'Actuator',
            avgCost: '$2.50',
            description: 'Compact rotary actuator containing a DC motor, reduction gearbox, and control feedback potentiometer.',
            bestFor: 'Robotic grippers, mechanism steering flaps, and camera pan/tilt brackets.',
            specs: '1.8 kg/cm torque / 4.8V DC operating limit',
            image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=500&q=80'
          }
        ]
      },
      {
        id: 'sensors',
        title: 'Sensors & Transducers',
        icon: 'gauge',
        isOpen: false,
        overview: 'Transducers that capture environmental physical attributes and convert them into readable electrical signals.',
        howItWorks: 'Internal sensing elements experience physical changes (e.g., capacitance or optical breaks) translated into digital data values.',
        items: [
          {
            name: 'BME280 Environmental Sensor',
            category: 'Sensor',
            avgCost: '$5.00',
            description: 'High-precision digital sensor measuring barometric pressure, ambient temperature, and humidity simultaneously.',
            bestFor: 'Weather stations, indoor environmental trackers, and altitude logging.',
            specs: 'I2C / SPI communication / Low current consumption',
            image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80'
          }
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

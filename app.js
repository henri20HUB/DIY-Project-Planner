const { createApp, ref, onMounted, watch } = Vue;

createApp({
  setup() {
    const currentView = ref('projects');
    const selectedProject = ref(null);

    // Modals
    const showNewProjectModal = ref(false);
    const showAddPartToProjectModal = ref(false);
    const showNewInventoryModal = ref(false);
    const showNewShoppingModal = ref(false);

    // Pre-populated Projects with rich sample data
    const projects = ref(JSON.parse(localStorage.getItem('maker_projects')) || [
      {
        id: 1,
        title: 'AI Desktop Voice Assistant',
        category: 'AI Device',
        status: 'In Progress',
        description: 'An independent desk companion featuring an ESP32-S3 microcontroller, INMP441 digital microphone, and a 1.3-inch OLED display. Streams voice queries over Wi-Fi to a local LLM server.',
        bom: [
          { name: 'ESP32-S3 WROOM Module', qty: 1 },
          { name: 'INMP441 I2S Microphone', qty: 1 },
          { name: '1.3" SH1106 OLED Display', qty: 1 }
        ]
      },
      {
        id: 2,
        title: 'Micro FPV Quadcopter',
        category: 'Drone',
        status: 'Planning',
        description: 'A custom 2-inch ultra-light toothpick drone built around ExpressLRS (ELRS) protocol, 1103 brushless motors, and a 2S LiPo power setup for indoor/outdoor cinematic cruising.',
        bom: [
          { name: 'F4 12A AIO Flight Controller', qty: 1 },
          { name: '1103 8000KV Brushless Motors', qty: 4 },
          { name: 'Gemfan 2015 2-Blade Propellers', qty: 2 }
        ]
      },
      {
        id: 3,
        title: 'Desktop Robotic Arm',
        category: 'Robotics',
        status: 'Completed',
        description: 'A 4-axis articulated desktop arm powered by MG90S micro servos and controlled via an Arduino Nano with a custom joystick control pendant.',
        bom: [
          { name: 'Arduino Nano V3', qty: 1 },
          { name: 'MG90S Metal Gear Servo', qty: 4 },
          { name: 'Joystick Module', qty: 2 }
        ]
      }
    ]);

    // Pre-populated General Hardware Inventory
    const inventory = ref(JSON.parse(localStorage.getItem('maker_inventory')) || [
      { id: 1, name: 'ESP32-S3 WROOM', category: 'MCU', quantity: 4, location: 'Box 1 - Microcontrollers' },
      { id: 2, name: 'Arduino Nano V3', category: 'MCU', quantity: 2, location: 'Box 1 - Microcontrollers' },
      { id: 3, name: 'MG90S Metal Gear Servo', category: 'Actuator', quantity: 6, location: 'Box 3 - Motors' },
      { id: 4, name: 'INMP441 I2S Microphone', category: 'Sensor', quantity: 2, location: 'Box 2 - Sensors' },
      { id: 5, name: 'Breadboard 830-point', category: 'Tool', quantity: 3, location: 'Workbench Shelf' }
    ]);

    // Pre-populated Needed to Buy List
    const shoppingList = ref(JSON.parse(localStorage.getItem('maker_shopping')) || [
      { id: 1, name: '2S 450mAh LiPo Battery (XT30)', price: '12.50', link: 'https://aliexpress.com' },
      { id: 2, name: 'F4 12A AIO Flight Controller', price: '45.00', link: 'https://getfpv.com' }
    ]);

    const software = ref([
      { id: 1, title: 'FastLED Animation Template', language: 'C++', description: 'Custom LED strip routines for ESP32', snippet: '#include <FastLED.h>' },
      { id: 2, title: 'I2S Audio Streamer', language: 'C++', description: 'Captures raw audio from INMP441 mic', snippet: 'i2s_config_t i2s_config = { ... };' }
    ]);

    const ideas = ref([
      { id: 1, title: 'Smart Plant Monitor', tag: 'IoT', details: 'Capacitive moisture sensor + ESP32 sending metrics to phone via MQTT.' },
      { id: 2, title: 'Matrix LED Clock', tag: 'Display', details: '64x32 RGB LED panel syncing time via NTP server over Wi-Fi.' }
    ]);

    // Form states
    const newProject = ref({ title: '', category: 'Robotics', status: 'In Progress', description: '' });
    const newBomPart = ref({ name: '', qty: 1 });
    const newInventoryItem = ref({ name: '', category: '', quantity: 1, location: '' });
    const newShoppingItem = ref({ name: '', price: '', link: '' });

    // LocalStorage Watchers
    watch(projects, val => localStorage.setItem('maker_projects', JSON.stringify(val)), { deep: true });
    watch(inventory, val => localStorage.setItem('maker_inventory', JSON.stringify(val)), { deep: true });
    watch(shoppingList, val => localStorage.setItem('maker_shopping', JSON.stringify(val)), { deep: true });

    // Navigation & Project selection
    const openProject = (project) => {
      selectedProject.value = project;
    };

    const addProject = () => {
      if (!newProject.value.title) return;
      projects.value.push({
        id: Date.now(),
        ...newProject.value,
        bom: []
      });
      newProject.value = { title: '', category: 'Robotics', status: 'In Progress', description: '' };
      showNewProjectModal.value = false;
    };

    const deleteProject = (id) => {
      projects.value = projects.value.filter(p => p.id !== id);
      selectedProject.value = null;
    };

    const addPartToProject = () => {
      if (!newBomPart.value.name || !selectedProject.value) return;
      selectedProject.value.bom.push({ ...newBomPart.value });
      newBomPart.value = { name: '', qty: 1 };
      showAddPartToProjectModal.value = false;
    };

    const removePartFromProject = (index) => {
      if (selectedProject.value) {
        selectedProject.value.bom.splice(index, 1);
      }
    };

    const addInventoryItem = () => {
      if (!newInventoryItem.value.name) return;
      inventory.value.push({
        id: Date.now(),
        ...newInventoryItem.value
      });
      newInventoryItem.value = { name: '', category: '', quantity: 1, location: '' };
      showNewInventoryModal.value = false;
    };

    const deleteInventory = (id) => {
      inventory.value = inventory.value.filter(i => i.id !== id);
    };

    const addShoppingItem = () => {
      if (!newShoppingItem.value.name) return;
      shoppingList.value.push({
        id: Date.now(),
        ...newShoppingItem.value
      });
      newShoppingItem.value = { name: '', price: '', link: '' };
      showNewShoppingModal.value = false;
    };

    const deleteShopping = (id) => {
      shoppingList.value = shoppingList.value.filter(s => s.id !== id);
    };

    const moveToInventory = (shopItem) => {
      // Add to inventory
      inventory.value.push({
        id: Date.now(),
        name: shopItem.name,
        category: 'Purchased Part',
        quantity: 1,
        location: 'Workbench'
      });
      // Remove from shopping list
      deleteShopping(shopItem.id);
    };

    onMounted(() => {
      lucide.createIcons();
    });

    // Re-initialize icons on view switches
    watch([currentView, selectedProject], () => {
      setTimeout(() => lucide.createIcons(), 50);
    });

    return {
      currentView,
      selectedProject,
      projects,
      inventory,
      shoppingList,
      software,
      ideas,
      showNewProjectModal,
      showAddPartToProjectModal,
      showNewInventoryModal,
      showNewShoppingModal,
      newProject,
      newBomPart,
      newInventoryItem,
      newShoppingItem,
      openProject,
      addProject,
      deleteProject,
      addPartToProject,
      removePartFromProject,
      addInventoryItem,
      deleteInventory,
      addShoppingItem,
      deleteShopping,
      moveToInventory
    };
  }
}).mount('#app');

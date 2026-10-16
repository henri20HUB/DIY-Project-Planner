const { createApp, ref, onMounted, watch } = Vue;

createApp({
  setup() {
    const currentView = ref('projects');
    const selectedProject = ref(null);

    // Modals & Delete confirmation state
    const showNewProjectModal = ref(false);
    const showAddPartToProjectModal = ref(false);
    const showNewInventoryModal = ref(false);
    const showNewShoppingModal = ref(false);
    const deleteTarget = ref(null); // { type, id }

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
          { name: '1103 8000KV Brushless Motors', qty: 4 }
        ]
      }
    ]);

    const inventory = ref(JSON.parse(localStorage.getItem('maker_inventory')) || [
      { id: 1, name: 'ESP32-S3 WROOM', category: 'MCU', quantity: 4, location: 'Box 1 - Microcontrollers' },
      { id: 2, name: 'Arduino Nano V3', category: 'MCU', quantity: 2, location: 'Box 1 - Microcontrollers' },
      { id: 3, name: 'MG90S Metal Gear Servo', category: 'Actuator', quantity: 6, location: 'Box 3 - Motors' }
    ]);

    const shoppingList = ref(JSON.parse(localStorage.getItem('maker_shopping')) || [
      { id: 1, name: '2S 450mAh LiPo Battery (XT30)', price: '12.50', link: 'https://www.aliexpress.com' },
      { id: 2, name: 'F4 12A AIO Flight Controller', price: '45.00', link: 'https://www.getfpv.com' }
    ]);

    const software = ref([
      { id: 1, title: 'FastLED Animation Template', language: 'C++', description: 'Custom LED strip routines for ESP32', snippet: '#include <FastLED.h>' },
      { id: 2, title: 'I2S Audio Streamer', language: 'C++', description: 'Captures raw audio from INMP441 mic', snippet: 'i2s_config_t i2s_config = { ... };' }
    ]);

    const ideas = ref([
      { id: 1, title: 'Smart Plant Monitor', tag: 'IoT', details: 'Capacitive moisture sensor + ESP32 sending metrics via MQTT.' }
    ]);

    const newProject = ref({ title: '', category: 'Robotics', status: 'In Progress', description: '' });
    const newBomPart = ref({ name: '', qty: 1 });
    const newInventoryItem = ref({ name: '', category: '', quantity: 1, location: '' });
    const newShoppingItem = ref({ name: '', price: '', link: '' });

    watch(projects, val => localStorage.setItem('maker_projects', JSON.stringify(val)), { deep: true });
    watch(inventory, val => localStorage.setItem('maker_inventory', JSON.stringify(val)), { deep: true });
    watch(shoppingList, val => localStorage.setItem('maker_shopping', JSON.stringify(val)), { deep: true });

    const openProject = (project) => {
      selectedProject.value = project;
    };

    const addProject = () => {
      if (!newProject.value.title) return;
      projects.value.push({ id: Date.now(), ...newProject.value, bom: [] });
      newProject.value = { title: '', category: 'Robotics', status: 'In Progress', description: '' };
      showNewProjectModal.value = false;
    };

    const confirmDelete = (type, id) => {
      deleteTarget.value = { type, id };
    };

    const executeDelete = () => {
      if (!deleteTarget.value) return;
      const { type, id } = deleteTarget.value;

      if (type === 'project') {
        projects.value = projects.value.filter(p => p.id !== id);
        selectedProject.value = null;
      } else if (type === 'inventory') {
        inventory.value = inventory.value.filter(i => i.id !== id);
      } else if (type === 'shopping') {
        shoppingList.value = shoppingList.value.filter(s => s.id !== id);
      }
      deleteTarget.value = null;
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
      inventory.value.push({ id: Date.now(), ...newInventoryItem.value });
      newInventoryItem.value = { name: '', category: '', quantity: 1, location: '' };
      showNewInventoryModal.value = false;
    };

    const addShoppingItem = () => {
      if (!newShoppingItem.value.name) return;
      shoppingList.value.push({ id: Date.now(), ...newShoppingItem.value });
      newShoppingItem.value = { name: '', price: '', link: '' };
      showNewShoppingModal.value = false;
    };

    const moveToInventory = (shopItem) => {
      inventory.value.push({
        id: Date.now(),
        name: shopItem.name,
        category: 'Purchased Part',
        quantity: 1,
        location: 'Workbench'
      });
      shoppingList.value = shoppingList.value.filter(s => s.id !== shopItem.id);
    };

    onMounted(() => {
      lucide.createIcons();
    });

    watch([currentView, selectedProject, deleteTarget], () => {
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
      deleteTarget,
      newProject,
      newBomPart,
      newInventoryItem,
      newShoppingItem,
      openProject,
      addProject,
      confirmDelete,
      executeDelete,
      addPartToProject,
      removePartFromProject,
      addInventoryItem,
      addShoppingItem,
      moveToInventory
    };
  }
}).mount('#app');

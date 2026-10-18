const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
  setup() {
    const currentView = ref('guide');
    const selectedProject = ref(null);
    const showNewProjectModal = ref(false);
    const showNewInventoryModal = ref(false);
    const showNewShoppingModal = ref(false);
    const draggedProject = ref(null);

    // Sidebar Resizer state
    const sidebarWidth = ref(256);
    const isResizing = ref(false);

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
      if (e.clientX >= 200 && e.clientX <= 450) {
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
        setTimeout(() => { proj.justCompleted = false; }, 2000);
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
    watch([currentView, selectedProject], () => { setTimeout(() => lucide.createIcons(), 50); });

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
      onStageSelectChange
    };
  }
}).mount('#app');

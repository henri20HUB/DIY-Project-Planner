const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
  setup() {
    const currentView = ref('projects');
    const selectedProject = ref(null);
    const showNewProjectModal = ref(false);
    const showNewInventoryModal = ref(false);
    const draggedProject = ref(null);

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

    const newProject = ref({ title: '', category: 'Robotics', targetBudget: null, description: '' });
    const newInventoryItem = ref({ name: '', quantity: 1, location: '' });

    watch(projects, val => localStorage.setItem('maker_projects', JSON.stringify(val)), { deep: true });
    watch(inventory, val => localStorage.setItem('maker_inventory', JSON.stringify(val)), { deep: true });

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

    const exportData = () => {
      const backup = { projects: projects.value, inventory: inventory.value };
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
      projects,
      inventory,
      newProject,
      newInventoryItem,
      openProject,
      addProject,
      confirmDelete,
      addPartToProject,
      addInventoryItem,
      deleteInventoryItem,
      exportData,
      importData,
      calculateProjectCost,
      onDragStart,
      onDrop,
      onStageSelectChange
    };
  }
}).mount('#app');

const { createApp, ref } = Vue;

createApp({
    setup() {
        const activeModal = ref(null);
        const toast = ref({ show: false, message: '' });

        const showToast = (message) => {
            toast.value = { show: true, message };
            setTimeout(() => { toast.value.show = false; }, 3000);
        };

        const navigateTo = (screen) => {
            showToast(`Navigating to ${screen}...`);
        };

        const openModal = (modalName) => {
            activeModal.value = modalName;
        };

        const closeModal = () => {
            activeModal.value = null;
        };

        return { activeModal, toast, navigateTo, openModal, closeModal };
    }
}).mount('#app');

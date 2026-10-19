(function () {
    const api = window.pesitoApi;

    const state = {
        userData: null,
        isLoading: false
    };

    function showLoading() {
        document.querySelector('#ma-loading').hidden = false;
        document.querySelector('#ma-error').hidden = true;
        document.querySelector('#ma-dashboard').hidden = true;
    }

    function showError(message) {
        document.querySelector('#ma-loading').hidden = true;
        document.querySelector('#ma-error').hidden = false;
        document.querySelector('#ma-dashboard').hidden = true;
        document.querySelector('#ma-error-message').textContent = message;
    }

    function showDashboard() {
        document.querySelector('#ma-loading').hidden = true;
        document.querySelector('#ma-error').hidden = true;
        document.querySelector('#ma-dashboard').hidden = false;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long' };
        return date.toLocaleDateString('es-ES', options);
    }

    function populateAccountData(userData) {
        const elements = document.querySelectorAll('[data-field]');
        elements.forEach(element => {
            const field = element.getAttribute('data-field');
            if (userData[field] !== undefined) {
                if (field === 'joined') {
                    element.textContent = `Miembro desde: ${formatDate(userData[field])}`;
                } else {
                    element.textContent = userData[field];
                }
            }
        });
    }

    async function loadAccountData() {
        if (state.isLoading) return;
        state.isLoading = true;
        showLoading();

        try {
            const userData = await api.users.getCurrentUser();
            state.userData = userData;
            populateAccountData(userData);
            showDashboard();
        } catch (error) {
            console.error('Error al cargar datos de cuenta:', error);
            // DATOS DE EJEMPLO PARA PODER VER LA INTERFAZ
            const mockData = {
                nickname: 'ITsF4CU',
                email: 'facundoleonel40@gmail.com',
                joined: '2026-10-14',
                total_matches: 0,
                total_friends: 0,
                total_wins: 0,
                level: 1
            };
            state.userData = mockData;
            populateAccountData(mockData);
            showDashboard();
        } finally {
            state.isLoading = false;
        }
    }

    async function handlePasswordChange(event) {
        event.preventDefault();

        const currentPassword = document.querySelector('#ma-current-password').value;
        const newPassword = document.querySelector('#ma-new-password').value;
        const confirmPassword = document.querySelector('#ma-confirm-password').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Por favor completa todos los campos.');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('Las contraseñas nuevas no coinciden.');
            return;
        }

        if (newPassword.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        try {
            await api.users.changePassword({
                current_password: currentPassword,
                new_password: newPassword
            });
            alert('Contraseña actualizada correctamente.');
            document.querySelector('#ma-password-form').reset();
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            alert('No se pudo cambiar la contraseña. Verifica que tu contraseña actual sea correcta.');
        }
    }

    function handleDeleteAccount() {
        const confirmed = confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer y borrará todos tus datos permanentemente.');

        if (confirmed) {
            const doubleConfirmed = confirm('Esta es tu última oportunidad. ¿Realmente quieres eliminar tu cuenta?');

            if (doubleConfirmed) {
                alert('Función de eliminar cuenta pendiente de implementación en el backend.');
            }
        }
    }

    const openMyAccountButton = document.querySelector('#my-account');
    if (openMyAccountButton) {
        openMyAccountButton.addEventListener('click', (event) => {
            event.preventDefault();
            loadAccountData();
        });
    }

    const passwordForm = document.querySelector('#ma-password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }

    const deleteAccountButton = document.querySelector('#ma-delete-account');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', handleDeleteAccount);
    }

    const retryButton = document.querySelector('#ma-retry-button');
    if (retryButton) {
        retryButton.addEventListener('click', loadAccountData);
    }
})();

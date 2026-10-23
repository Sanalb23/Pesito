(function () {

    const base_url = "https://pesito-ejyz.onrender.com";

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
        const data = userData?.data || userData?.user || userData || {};
        const elements = document.querySelectorAll('.ma-profile-info [data-field]');
        elements.forEach(element => {
            const field = element.getAttribute('data-field');
            if (field === 'joined') {
                const joinedValue = data.joined || data.created_at || data.createdAt;
                if (joinedValue) {
                    element.textContent = `Miembro desde: ${formatDate(joinedValue)}`;
                }
            } else if (data[field] !== undefined && data[field] !== null) {
                element.textContent = data[field];
            }
        });
    }

    async function loadAccountData() {
        if (state.isLoading) return;
        state.isLoading = true;
        showLoading();

        try {
            const response = await fetch(`${base_url}/users/me`, {
                credentials: 'include'
            });
            const userData = await response.json();
            if (!response.ok) {
                throw new Error(userData?.message || `Error del servidor (${response.status})`);
            }
            state.userData = userData;
            populateAccountData(userData);
            showDashboard();
        } catch (error) {
            showError("Error al cargar datos de cuenta: " + error.message);
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

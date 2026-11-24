(function () {
    const RULE_TESTS = {
        length: (password) => password.length >= 8 && password.length <= 12,
        uppercase: (password) => /[A-Z]/.test(password),
        number: (password) => /\d/.test(password),
        symbol: (password) => /[^a-zA-Z0-9\s]/.test(password),
        'no-spaces': (password) => !/\s/.test(password)
    };

    const PASSWORD_REQUIREMENTS_MESSAGE = 'La contraseña debe tener entre 8 y 12 caracteres, incluir una mayúscula, un número y un símbolo, y no contener espacios.';

    function isValidPassword(password) {
        return typeof password === 'string'
            && password.length > 0
            && Object.values(RULE_TESTS).every((test) => test(password));
    }

    window.pesitoPasswordRules = {
        tests: RULE_TESTS,
        isValid: isValidPassword,
        message: PASSWORD_REQUIREMENTS_MESSAGE
    };

    const passwordInput = document.getElementById('regPassword');
    const requirementsList = document.getElementById('password-requirements');

    if (!passwordInput || !requirementsList) {
        return;
    }

    function updateRequirements() {
        const password = passwordInput.value;
        let allMet = password.length > 0;

        requirementsList.querySelectorAll('li[data-rule]').forEach((item) => {
            const test = RULE_TESTS[item.dataset.rule];
            const met = test ? test(password) : false;
            item.classList.toggle('met', met);
            if (!met) {
                allMet = false;
            }
        });

        return allMet;
    }

    passwordInput.addEventListener('input', updateRequirements);
    updateRequirements();

    window.registerPasswordRequirementsMet = updateRequirements;
})();

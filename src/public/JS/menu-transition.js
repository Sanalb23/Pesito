const FADE_DURATION_MS = 400;
const FADE_OUT_CLASS = 'fade-out';
const HIDDEN_CLASS = 'hidden';

const mainMenu = document.querySelector('.main-menu-container');
const matchRegisterMenu = document.querySelector('.match-register-menu');
const matchRegisterContent = document.querySelector('.match-register-content');
const userStatsMenu = document.querySelector('.user-stats-menu');
const userStatsContent = document.querySelector('.user-stats-content');
const myAccountMenu = document.querySelector('.my-account-menu');
const myAccountContent = document.querySelector('.my-account-content');
const myMatchesMenu = document.querySelector('.my-matches-menu');
const myMatchesContent = document.querySelector('.my-matches-content');
const friendsBackdrop = document.querySelector('.modal-backdrop');

const openMatchRegisterButton = document.querySelector('#match-register');
const backToMenuButton = document.querySelector('#back-to-menu');
const openUserStatsButton = document.querySelector('#user-stats');
const backFromStatsButton = document.querySelector('#back-from-stats');
const openMyAccountButton = document.querySelector('#my-account');
const backFromAccountButton = document.querySelector('#back-from-account');
const openMyMatchesButton = document.querySelector('#my-matches');
const backFromMatchesButton = document.querySelector('#back-from-matches');
const openMyMatchesButtonMobile = document.querySelector('#my-matches-mobile');
const openMatchRegisterButtonMobile = document.querySelector('#match-register-mobile');
const openUserStatsButtonMobile = document.querySelector('#user-stats-mobile');
const openFriendsButtonMobile = document.querySelector('#user-friends-mobile');
const openMyAccountButtonMobile = document.querySelector('#my-account-mobile');
const openFriendsButton = document.getElementById('user-friends');
const closeFriendsButton = document.getElementById('close-friends-modal');


function startFadeOut(content) {
    content.classList.add(FADE_OUT_CLASS);
}

function startFadeIn(content) {
    void content.offsetWidth;
    content.classList.remove(FADE_OUT_CLASS);
}

function hideContainer(container) {
    container.style.display = 'none';
}

function showContainer(container) {
    container.style.display = 'flex';
}

function switchSections(visibleContent, visibleContainer, nextContent, nextContainer) {
    startFadeOut(visibleContent);

    setTimeout(() => {
        hideContainer(visibleContainer);
        showContainer(nextContainer);
        startFadeOut(nextContent);
        startFadeIn(nextContent);
    }, FADE_DURATION_MS);
}

function openFriendsModal(event) {
    event.preventDefault();
    friendsBackdrop.classList.remove(HIDDEN_CLASS);
}

function closeFriendsModal() {
    friendsBackdrop.classList.add(HIDDEN_CLASS);
}

function goToMatchRegister(event) {
    event.preventDefault();
    switchSections(mainMenu, mainMenu, matchRegisterContent, matchRegisterMenu);
}

function goBackToMainMenu() {
    switchSections(matchRegisterContent, matchRegisterMenu, mainMenu, mainMenu);
}

function goToUserStats(event) {
    event.preventDefault();
    switchSections(mainMenu, mainMenu, userStatsContent, userStatsMenu);
}

function goBackFromUserStats() {
    switchSections(userStatsContent, userStatsMenu, mainMenu, mainMenu);
}

function goToMyAccount(event) {
    event.preventDefault();
    switchSections(mainMenu, mainMenu, myAccountContent, myAccountMenu);
}

function goBackFromAccount() {
    switchSections(myAccountContent, myAccountMenu, mainMenu, mainMenu);
}

function goToMyMatches(event) {
    event.preventDefault();
    switchSections(mainMenu, mainMenu, myMatchesContent, myMatchesMenu);
}

function goBackFromMatches() {
    switchSections(myMatchesContent, myMatchesMenu, mainMenu, mainMenu);
}


openMatchRegisterButton.addEventListener('click', goToMatchRegister);

if (backToMenuButton) {
    backToMenuButton.addEventListener('click', goBackToMainMenu);
}

openUserStatsButton.addEventListener('click', goToUserStats);

if (backFromStatsButton) {
    backFromStatsButton.addEventListener('click', goBackFromUserStats);
}

if (openMyAccountButton) {
    openMyAccountButton.addEventListener('click', goToMyAccount);
}

if (backFromAccountButton) {
    backFromAccountButton.addEventListener('click', goBackFromAccount);
}

if (openMyMatchesButton) {
    openMyMatchesButton.addEventListener('click', goToMyMatches);
}

if (backFromMatchesButton) {
    backFromMatchesButton.addEventListener('click', goBackFromMatches);
}

// Botones del bottom nav para móviles
if (openMyMatchesButtonMobile) {
    openMyMatchesButtonMobile.addEventListener('click', goToMyMatches);
}

if (openMatchRegisterButtonMobile) {
    openMatchRegisterButtonMobile.addEventListener('click', goToMatchRegister);
}

if (openUserStatsButtonMobile) {
    openUserStatsButtonMobile.addEventListener('click', goToUserStats);
}

if (openFriendsButtonMobile) {
    openFriendsButtonMobile.addEventListener('click', openFriendsModal);
}

if (openMyAccountButtonMobile) {
    openMyAccountButtonMobile.addEventListener('click', goToMyAccount);
}

openFriendsButton.addEventListener('click', openFriendsModal);
closeFriendsButton.addEventListener('click', closeFriendsModal);

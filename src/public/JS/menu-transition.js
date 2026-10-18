const FADE_DURATION_MS = 400;
const FADE_OUT_CLASS = 'fade-out';
const HIDDEN_CLASS = 'hidden';

const mainMenu = document.querySelector('.main-menu-container');
const matchRegisterMenu = document.querySelector('.match-register-menu');
const matchRegisterContent = document.querySelector('.match-register-content');
const userStatsMenu = document.querySelector('.user-stats-menu');
const userStatsContent = document.querySelector('.user-stats-content');
const friendsBackdrop = document.querySelector('.modal-backdrop');

const openMatchRegisterButton = document.querySelector('#match-register');
const backToMenuButton = document.querySelector('#back-to-menu');
const openUserStatsButton = document.querySelector('#user-stats');
const backFromStatsButton = document.querySelector('#back-from-stats');
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


openMatchRegisterButton.addEventListener('click', goToMatchRegister);

if (backToMenuButton) {
    backToMenuButton.addEventListener('click', goBackToMainMenu);
}

openUserStatsButton.addEventListener('click', goToUserStats);

if (backFromStatsButton) {
    backFromStatsButton.addEventListener('click', goBackFromUserStats);
}

openFriendsButton.addEventListener('click', openFriendsModal);
closeFriendsButton.addEventListener('click', closeFriendsModal);

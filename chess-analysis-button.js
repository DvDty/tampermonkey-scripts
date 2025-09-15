// ==UserScript==
// @name         Chess Analysis Button
// @namespace    https://www.chess.com/
// @version      0.3.6
// @description  Add a button to chess.com to import and analyze games on lichess.org
// @author       DeGandalf
// @match        https://www.chess.com/*a*i*
// @match        https://lichess.org/*
// @grant        GM_xmlhttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// ==/UserScript==

// You only need to change this, if you get an error.
const YOUR_CHESSCOM_USERNAME = 'XXXXXXXX';

// Waits asynchronously
// Use like: await wait(100);
function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

// Waits for an element to load.
// Times out after 10 seconds
async function waitForElement(querySelector) {
    let elem = document.querySelector(querySelector);
    let i = 0;
    // Is the the element still not found? Try again
    while(!elem && i < 100) {
        await wait(100);
        elem = document.querySelector(querySelector);
        i++;
    }

    if(!elem){
        console.log('Couldn\'t find element ' + querySelector);
    }

    return elem;
}


if(window.location.origin.includes('chess.com')) {
    // This code only gets executed on chess.com

    // Waits for a share button, which gets used to get the pgn string
    async function waitForShareButton(querySelector){
        let shareBtn = await waitForElement(querySelector);
        if (!shareBtn) {
            // No share button found
            // This might be, because the game is still ongoing
            if(window.location.href.includes('game/live') && !window.location.href.includes('analysis')){
                // So if the url matches, we wait instead of returning.
                while(!shareBtn) {
                    await wait(3000);
                    shareBtn = document.querySelector(querySelector);
                }
            } else {
                // Else we assume we are on a different sub site of chess.com and cancel
                return;
            }
        }

        return shareBtn;
    }

    // Add a button to the page
    async function addImportButton() {

        // Get the sidebar
        const sidebar = await Promise.any([waitForElement('.sidebar-component'), waitForElement('#board-layout-sidebar')]);
        if (!sidebar) return;

        // Wait until we have a share button on the page
        const shareBtn = await waitForShareButton('.share');
        if(!shareBtn) return;

        // Add the button to the sidebar
        const btn = document.createElement('button');
        btn.innerText = 'Analyze on Lichess.org';
        btn.addEventListener('click', importAndAnalyze);
        btn.setAttribute('class', 'ui_v5-button-component ui_v5-button-primary');
        btn.setAttribute('style', 'margin-left: 0; margin-right: 0; margin-top: 7px; margin-bottom: 7px;');

        sidebar.appendChild(btn);

        // Remove button, when a new game starts
        while(document.querySelector('.share')){
            await wait(2000);
        }

        btn.remove();
        addImportButton();
    }

    // Sends a request to lichess.org to analyse the game and then opens the site.
    async function importAndAnalyze() {
        const shareBtn = await waitForElement('.share');
        if (!shareBtn) return;

        // Queries the pgn string from the share button
        shareBtn.click();
        const pgnElement = await waitForElement('.share-menu-tab-image-component');
        const closeBtn = await waitForElement('div.x');

        const pgn = pgnElement.getAttribute("pgn");

        closeBtn.click();

        // Create a FormData object to hold the POST data
        const data = new FormData();

        data.append('pgn', pgn);
        data.append('analyse',	true);

        // Make the POST request to lichess.org/import
        GM_xmlhttpRequest({
            method: 'POST',
            url: 'https://lichess.org/import',
			headers: {
                "Origin": "https://lichess.org"
            },
            data: data,
            onload: handleImportResponse
        });
    }

    // Opens a new tab with the analysis
    async function handleImportResponse(response) {
        // Open the URL in a new tab
        const popup = window.open(response.finalUrl);

        // Sets the chess.com username
        let name = await waitForElement('#board-layout-player-bottom > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > a:nth-child(1)');
        GM.setValue('chessusername', name.innerText);
    }

    // Add the button when the page loads
    addImportButton();

} else if (window.location.origin.includes('lichess.org')) {
    // This code only gets executed on lichess.org

    // Triggers a mouse event
    function triggerMouseEvent(node, eventType) {
        let clickEvent = document.createEvent('MouseEvents');
        clickEvent.initEvent (eventType, true, true);
        node.dispatchEvent (clickEvent);
    }

    (async function() {

        // Gets the chess.com username
        let name = await GM.getValue('chessusername', YOUR_CHESSCOM_USERNAME);
        console.log('chess.com username: ' + name);
        if (name === 'XXXXXXXX') {
            alert('Error, when automatically fetching chess.com username. Please enter it manually at the top of the script instead of XXXXXXXX');
        }

        // Enables the local analysis for better results
        if(!document.querySelector('.ceval.enabled')){
            (await waitForElement('.ceval > .switch > label')).click();
        }

        // Get the name of the black player
        const nameElement = await waitForElement('.player.color-icon.is.black.text .user-link');
        if (nameElement && nameElement.innerText.includes(name)) {

            let piece = await waitForElement('cg-board piece');
            if(!piece.style.cssText.includes("translate(0px)")) return;

            // if necessary flip the board
            let menuButton = await waitForElement('.analyse__controls.analyse-controls > .fbt');
            if(!menuButton) return;

            triggerMouseEvent(menuButton, "mousedown");

            let flipBtn = await waitForElement('.action-menu .action-menu__tools a');
            flipBtn.click();

            triggerMouseEvent(menuButton, "mousedown");
        }

    })();
}

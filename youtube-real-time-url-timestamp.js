// ==UserScript==
// @name         YouTube URL Realtime timestamp
// @version      1.0
// @description  Updates the URL with the current timestamp of the video in real time.
// @author       DvDty
// @match        https://www.youtube.com/watch?v=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(function() {
    setInterval(function() {
        const player = document.getElementById('movie_player');

        let url = window.location.href;
        let regex = new RegExp('[?&]v(=([^&#]*)|&|#|$)')
        let results = regex.exec(url);

        let videoId = decodeURIComponent(results[2].replace(/\+/g, ' '));

        let time = Math.floor(player.getCurrentTime());

        window.history.replaceState('watch', 'YouTube', '/watch?v=' + videoId + '&t=' + time);
    }, 10000);
})();

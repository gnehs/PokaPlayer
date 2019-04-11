if ('serviceWorker' in navigator) { //註冊一個假的 sw
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            // console.log('serviceWorker registered');
        }).catch(registrationError => {
            console.log('serviceWorker registration failed: ', registrationError);
        });
    });
}
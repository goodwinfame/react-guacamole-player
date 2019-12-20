/**
 * 工具函数
*/

export function zeroPad(value: number) {
    return String(value).padStart(2, "0");
}

export function formatTime(value: number) {

    // Round provided value down to whole seconds
    value = Math.floor((value || 0) / 1000);

    // Separate seconds into logical groups of seconds, minutes,
    // hours, etc.
    const groups = [ "1", "24", "60", "60" ];
    for (let i = groups.length - 1; i >= 0; i--) {
        let placeValue = groups[i];
        groups[i] = zeroPad(value % Number(placeValue));
        value = Math.floor(value / Number(placeValue));
    }

    // Format groups separated by colons, stripping leading zeroes and
    // groups which are entirely zeroes, leaving at least minutes and
    // seconds
    const formatted = groups.join(':');
    return (/^[0:]*([0-9]{2}(?::[0-9]{1,2})+)$/.exec(formatted) || [])[1];

}

export const delay = (ms: number = 0) => new Promise(resolve=>window.setTimeout(resolve, ms));


export function debounce(delay: number = 500) {
    let timer: any;
    
    return (callback: Function) => {
        if(timer) {
            window.clearTimeout(timer);
        }

        timer = window.setTimeout(()=>{
            callback();
            timer = null;
        }, delay);
    }
}


export function listener(event: any, callback: (e: any)=>void) {
    window.addEventListener(event, callback);
    return {
        cancel: () => {
            window.removeEventListener(event, callback);
        }
    }
}
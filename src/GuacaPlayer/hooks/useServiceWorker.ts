/**
 * service worker调用
*/

import { useEffect, useState } from "react";


export default function useServiceWorker() {
    const [state, setState] = useState<null | boolean>(null);
  
    useEffect(()=>{
        if ('serviceWorker' in navigator) {
            //判断是否已经注册
            const wsUrl = 'service-worker.js';
            const ws = window.navigator.serviceWorker;
            ws.getRegistration(wsUrl)
                .then(e=>{
                    if(!e) {
                        navigator.serviceWorker.register(wsUrl, {
                            scope: '/',
                        })
                            .then(registration=>{
                                setState(true);
                                console.log('Registration successful, scope is:', registration.scope);
                            })
                            .catch(error=>{
                                setState(false)
                                console.log('Service worker registration failed, error:', error);

                            });
                    } else {
                        setState(true);
                        console.log("Service worker registed")
                    }
                })

          
        } else {
            setState(false)
            console.log("Service worker not supported")
        }
      
    }, [])


    return state;

}
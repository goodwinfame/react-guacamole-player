/**
 * 加载进度控制
*/

import { useState, useEffect, useMemo } from "react";

export type translation = {
    "btn.loading": string;
    "btn.cancel": string;
    "message.player.initing": string;
    "message.player.error": string;
    "message.player.pause": string;

}
export default function useTranlation(callback?: (defaultTranslation: translation)=>translation) {

    const defaultTranslation = useMemo(()=>(
        {
            "btn.loading": "LOADING...",
            "btn.cancel": "CANCEL",
            "message.player.initing": "The player is initializing, please wait...",
            "message.player.error": "Failed to load the file, please check the file's availability.",
            "message.player.pause": "Click to start play",
    
        }
    ),[]);

    const [translation, setTranslation] = useState(defaultTranslation);

    useEffect(()=>{
        if(callback) {
            const newTranslation = callback.call(undefined, defaultTranslation);
            setTranslation({...defaultTranslation, ...newTranslation});
        }
        
    }, [callback])

    
	return translation;
}
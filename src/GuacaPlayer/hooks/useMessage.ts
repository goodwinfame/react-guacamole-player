/**
 * 加载进度控制
*/

import { useState, useEffect } from "react";
import { translation } from './useTranslation';

interface Props {
    initState: "uninit" | "initing" | "inited" | "error";
    translation: translation
}
export default function useMessage({initState, translation}: Props) {
    const [visibility, setVisibility] = useState(false);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(()=>{

        if(initState === "uninit" || initState === "initing") {
            setLoading(true);
            setText(translation["message.player.initing"])
        } else {
            setLoading(false)
        }
    
        if(initState === "inited") {
            setVisibility(false)
        } else {
            setVisibility(true);
        }
    
        if(initState === "error") {
            setText(translation["message.player.error"])
        }
    }, [initState, translation])

	return {
        visibility,
        loading,
        text
    };
}
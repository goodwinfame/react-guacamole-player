/**
 * 通用hook
 * 用于返回更新前的对象prevProps
*/

import { useEffect, useMemo } from "react";

type mutationCallback = (mutations: MutationRecord[], observer: MutationObserver) => void;
export default function useMutaionObserver(el: HTMLDivElement | null, callback: mutationCallback = ()=>{}) {

    const observer = useMemo(()=>{
        return new MutationObserver(callback)
    }, [callback])


    useEffect(()=>{
        if(el && el.parentElement && observer) {
            observer.observe(el.parentElement, {attributes: true});
            return ()=>{
                observer.disconnect();
            }
        }
    }, [el, observer])

}
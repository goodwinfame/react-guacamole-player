import ReactDom from 'react-dom';
import React, { useState, useEffect } from 'react';
import GuacaPlayer from './GuacaPlayer';
import './index.less'


const Container: React.FC = () => {
    const [src, setSrc] = useState<undefined | string>();

    useEffect(()=>{
        //js不支持反向预查（/(?<=(\?(\w|\W)*url\=))([^&])+(?=&?)/）
        const querys = window.location.search.replace(/\?/, "").split("&");
        for(let query of querys) {
            const [key, value] = query.split("=")
            if(key === "url") {
                setSrc(value);
            }
        }

      
    }, [])
 
    return (
        <GuacaPlayer src={src}/>

    )
}


ReactDom.render(
    <Container />,
    document.getElementById('root')
);
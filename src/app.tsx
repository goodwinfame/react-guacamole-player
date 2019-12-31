import React, { useState, useRef, ReactNode, useEffect } from 'react';
import GuacaPlayer from './GuacaPlayer'

const App: React.FC = () => {
    const [inputValue, setInputValue] = useState("");
    const [src, setSrc] = useState("");

    
    return (
        <div className={"app"}>
            <div className={"input"}>
                <input defaultValue={src} onChange={(e)=>{
                    setInputValue(e.target.value)
                }}/>
                <button onClick={()=>{
                    setSrc(inputValue)
                }}>Load</button>
            </div>
            <div className={"app-player-wrapper"}>
                <GuacaPlayer src={src}/>

               
            </div>
        </div>
    )
}


export default App
import ReactDom from 'react-dom';
import React, { useState } from 'react';
import App from './app'

const Container: React.FC = () => {
    
    return (
        <div style={{display: "flex"}}>
            <App />
            {/* <App /> */}
        </div>
    )
}


ReactDom.render(
    <Container />,
    document.getElementById('root')
);
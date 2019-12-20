
/**
 * 发起xhr请求获取文件
*/
export interface Response {
    status: number;
    file: Blob;
    contentRange: string | null;
}

let headers: {[k: string]: string} | undefined;

export function setHeader(headers?: object) {
    if(headers) {
        headers = headers
    }
}

export default function get(url: string, rangeStart: number = 0, rangeEnd: number | undefined, trunkSize: number = 5242880) {

    return new Promise<Response>((resolve, reject)=>{
        let xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){
            if(xhr.readyState === 4){
                if(xhr.status === 200 || xhr.status === 206){
                    resolve({
                        status: xhr.status,
                        file: xhr.response,
                        contentRange: xhr.getResponseHeader("Content-Range")
                    });
                } else {
                    reject(xhr);
                }
            }
        }
    
        xhr.open('get', url, true);
        xhr.setRequestHeader("Range", `bytes=${rangeStart}-${rangeEnd !== undefined?rangeEnd:(rangeStart + trunkSize)}`);

        for(let i in headers) {
            xhr.setRequestHeader(i, headers[i]);

        }

        xhr.responseType = "blob";
        xhr.send();
    });

   
}
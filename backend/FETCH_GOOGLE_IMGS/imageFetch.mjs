//AUTHOR : ROHAN PHUTKE
//DATE : 01.02.2025
//IMAGE MODULE API SET

//TO RUN THE CODE : node imageFetch.mjs
//***********ATTENTION********* : If proxy is set use this code

import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxy = 'http://username:password@172.31.2.4:8080';
const agent = new HttpsProxyAgent(proxy);

const apiKey = 'API_KEY';
const searchEngineId = 'SEARCH_ENGINE_ID';
const query = 'blockchain understanding diagrams';

const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image`;

fetch(apiUrl, { agent }) // Pass the proxy agent
  .then(response => response.json())
  .then(data => {
    if (data.items) {
      data.items.forEach(item => {
        console.log(item.link);
      });
    } else {
      console.log('No images found.');
    }
  })
  .catch(error => console.error('Error:', error));




//***NO PROXY USE THIS CODE : */

// import fetch from 'node-fetch';

// const apiKey = 'API_KEY';
// const searchEngineId = 'SEARCH_ENGINE_ID';
// const query = 'blockchain understanding diagrams';

// const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image`;

// fetch(apiUrl) // 👈 No proxy needed now
//   .then(response => response.json())
//   .then(data => {
//     if (data.items) {
//       data.items.forEach(item => {
//         console.log(item.link);
//       });
//     } else {
//       console.log('No images found.');
//     }
//   })
//   .catch(error => console.error('Error:', error));

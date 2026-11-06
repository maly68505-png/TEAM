// Builds the installable app (docs/index.html) from hashimoto-fit.html.
// Run after editing hashimoto-fit.html:  node build-app.js
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/hashimoto-fit.html','utf8');
const head=`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1F6F62">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="فراشتي">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<style>:root{padding-top:env(safe-area-inset-top,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
`;
const tail=`
<script>if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}</script>
</body>
</html>
`;
// split <title>/<meta>/<link>/<style> (head part) from the body markup
const i=src.indexOf('</style>')+'</style>'.length;
fs.writeFileSync(__dirname+'/docs/index.html',head+src.slice(0,i)+'\n</head>\n<body>\n'+src.slice(i)+tail);
console.log('docs/index.html built');

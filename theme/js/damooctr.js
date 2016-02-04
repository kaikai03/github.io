var hjs=document.createElement('script');
hjs.setAttribute('id','blabla');
document.body.appendChild(hjs);
var inPage = true;
var http_protocol = ('https:' == document.location.protocol) ? ' https://api.hitokoto.us:214' : ' http://api.hitokoto.us'
var kotoba = http_protocol+'/rand?encode=jsc&fun=blabla'

function leavePage(){
            inPage = false;
            console.log('leavePage ');
        }
        
function comebackPage(){
            inPage = true;
            console.log('comebackPage ');
        }
        
function dududu(){
    setTimeout(function(){
        if(inPage){
            document.body.removeChild(document.getElementById('blabla')); 
            var hjs=document.createElement('script');
            hjs.setAttribute('id','blabla');
            hjs.setAttribute('src',kotoba);
            document.body.appendChild(hjs);
        }
        dududu();
        },Math.round(Math.random()*9000));
}

window.onload=function(){ 
	damoo.emit({ text: '欢迎光临', color: "#FFF", shadow: { color: "#f49" }});
	dududu()
} 

function blabla(bla){
    damoo.emit({ text: bla["author"]+"："+bla["hitokoto"], color: "#FFF", shadow: { color: "#f49" }});
    ukagaka.insert_kotoba(bla["hitokoto"])
}

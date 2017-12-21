var hjs=document.createElement('script');
hjs.setAttribute('id','blabla');
document.body.appendChild(hjs);


var inPage = true;
var http_protocol = ('https:' == document.location.protocol) ? ' https://sslapi.hitokoto.cn' : ' http://api.hitokoto.cn'
var kotoba = http_protocol+'/?encode=json'

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
            document.body.removeChild(document.getElementById('blabla')); 
            var hjs=document.createElement('script');
            hjs.setAttribute('id','blabla');
            hjs.setAttribute('src',kotoba);
            document.body.appendChild(hjs);
            
            var hjs2=document.getElementById('blabla')
            console.log(hjs2);
            console.log(hjs2.src);
            
	damoo.emit({ text: '欢迎光临----右舷弹幕启动', color: "#FFF", shadow: { color: "#f49" }});
	damoo.emit({ text: '由于资源问题弹幕话痨模式已关闭', color: "#FFF", shadow: { color: "#f49" }});
    ukagaka.insert_kotoba('由于资源问题,弹幕话痨模式已关闭')
    //dududu()
} 

function blabla(bla){
    damoo.emit({ text: bla["hitokoto"]+" by "+bla["from"], color: "#FFF", shadow: { color: "#f49" }});
    ukagaka.insert_kotoba(bla["hitokoto"])
}

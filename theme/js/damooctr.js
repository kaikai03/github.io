var hjs=document.createElement('script');
hjs.setAttribute('id','blabla');
document.body.appendChild(hjs);


var inPage = true;
var http_protocol = ('https:' == document.location.protocol) ? 'https://v1.hitokoto.cn' : 'http://v1.hitokoto.cn'
var kotoba = http_protocol+'/?encode=json'

function leavePage(){
            inPage = false;
            console.log('leavePage ');
        }
        
function comebackPage(){
            inPage = true;
            console.log('comebackPage ');
        }
        
function getKotoba(){
  var xhr = new XMLHttpRequest();
  xhr.open('get', kotoba);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      var data = JSON.parse(xhr.responseText);
      blabla(data)
    }
  }
  xhr.send();
}

function dududu(){
    setTimeout(function(){
        if(inPage){
        //     document.body.removeChild(document.getElementById('blabla')); 
        //     var hjs=document.createElement('script');
        //     hjs.setAttribute('id','blabla');
        //     hjs.setAttribute('src',kotoba);
        //     document.body.appendChild(hjs);
        getKotoba();
        }
        
        dududu();
        },Math.round(Math.random()*10000));
}

window.onload=function(){ 
            // document.body.removeChild(document.getElementById('blabla')); 
            // var hjs=document.createElement('script');
            // hjs.setAttribute('id','blabla');
            // hjs.setAttribute('src',kotoba);
            // document.body.appendChild(hjs);
            
            // var hjs2=document.getElementById('blabla')
            // console.log(hjs2);
            // console.log(hjs2.src);
            
	damoo.emit({ text: '欢迎光临----右舷弹幕启动', color: "#FFF", shadow: { color: "#f49" }});
	//damoo.emit({ text: '由于资源问题弹幕话痨模式已关闭', color: "#FFF", shadow: { color: "#f49" }});
    //ukagaka.insert_kotoba('由于资源问题,弹幕话痨模式已关闭')
    setTimeout(function(){getKotoba();},Math.round(Math.random()*5000));
    setTimeout(function(){getKotoba();},Math.round(Math.random()*8000));
    dududu()
} 

function blabla(bla){
    damoo.emit({ text: bla["hitokoto"]+" by "+bla["from"], color: "#FFF", shadow: { color: "#f49" }});
    ukagaka.insert_kotoba(bla["hitokoto"])
}

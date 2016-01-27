
$(document.body).append('<ukagaka id = "ukagaka"></ukagaka>'); 
$("ukagaka").append("<div id='ukagaka_panel'>" +
    "<div class='ukagaka_img'><div id='ukagaka_img'></div></div>" +
        
    "<div class='ukagaka_box'>" +
        "<div class='ukagaka_msg' id='ukagaka_msgbox'>" +
            "测试版" +
        "</div>"+
    "</div>"+
"</div>" )

ukagaka = new Object();

ukagaka.oldText = ukagaka.newText = null;


ukagaka.insert_kotoba = function(bla){
    ukagaka.newText = bla;
}

ukagaka.sayAnima = function(bla){
    $("#ukagaka_msgbox").hide("normal",function(){
        $("#ukagaka_msgbox").text(bla);
        $("#ukagaka_msgbox").show("slow",function(){})
    })
}


ukagaka.sawaru = function(){
    css_value="transparent url('/ukagaka/surface000"+parseInt(4*Math.random())+".png') no-repeat scroll 0% 0%";
    $("#ukagaka_img").css("background",css_value);
}

ukagaka.say_loop = function(){
        setTimeout(function(){
            if(ukagaka.oldText != ukagaka.newText){
                ukagaka.oldText = ukagaka.newText;
                ukagaka.sayAnima(ukagaka.oldText);
            }
            ukagaka.say_loop();
            },Math.round(Math.random()*9000));
        }


$("#ukagaka_panel").ready(function(){
    var dragging = false;
    var iX, iY, originX, originY;
    $("#ukagaka_panel").mousedown(function(e) {
        dragging = true;
        originX = e.clientX
        originY = e.clientY
        iX = e.clientX - this.offsetLeft;
        iY = e.clientY - this.offsetTop;
        this.setCapture && this.setCapture();
        return false;
    });
    document.onmousemove = function(e) {
        if (dragging) {
        var e = e || window.event;
        var oX = e.clientX - iX;
        var oY = e.clientY - iY;
        $("#ukagaka_panel").css({"left":oX + "px", "top":oY + "px"});
        return false;
        }
    };
    $(document).mouseup(function(e) {
        var e = e || window.event;
        var oX = e.clientX - originX;
        var oY = e.clientY - originY;
        if ((Math.abs(oX)+Math.abs(oY))<5){ukagaka.sawaru();}
        dragging = false;
        $("#ukagaka_panel")[0].releaseCapture();
        e.cancelBubble = true;
    });
    
    
    
    ukagaka.say_loop();

});

var NS = 'http://www.w3.org/2000/svg';
var URL = window.URL;
var GAME;
/*
 * define variables:
 */
//colors need to be defined classes in css
var COLORS = ["orange", "blue", "gray"];
//number of rectangles in height, width is computed dependently
var RECTS = 8;
//divergence from standard rectangles, should be at least 2
var DIV = 4;


$(document).ready(function() {
   //hide original input
   $("#input").hide().change(function(e){
       var images = [];
       $(e.target.files).each(function(i, el) {
           if(el.type.search(/image\/*/) > -1) {
               images.push(el);
           }
       });
       GAME = new Game(images);
       GAME.start();
   });
   //onclick trigger input
   $("p").click(function() {
       $("#input").click();
   });
   //resize handler
   $(window).resize(function() {
       var svg = $("#svg");
       var img = $("#riddle");
       if(svg.length > 0 && img.length > 0) {
           svg.height(img.height())
                .width(img.width())
                .css("left", img[0].x)
                .css("top", img[0].y);
       }
   });
});

//creates a new game of DalliKlick, assumes images is an array of images,
//containing at least one image
var Game = function(images) {
    var current = 0;
    //array with image urls for all images
    var urls = [];
    //create image urls for all images
    $(images).each(function(i, el){
        type = el.type.split('/');
        //filter jpeg and png
        if(type.length == 2 && ['jpeg', 'png'].indexOf(type[1]) >= 0){
            console.log(el);
            urls.push(URL.createObjectURL(el));
        }
    });
    //start a game
    this.start = function() {
        new Riddle(urls[current]);
    }
    //create riddle for next image if exists, else end game
    this.next = function() {
        current++;
        if(current < urls.length) {
            new Riddle(urls[current]);
        } else {
            this.end();
        }
    };
    //on game end
    //optional message to display
    this.end = function(message) {
        var s = typeof message !== "undefined" ? message : "Danke für's Mitspielen"
        $("body").html('<div id="content"><img src="logo.png"/><p>'
             + s + '</p></div>');
    }
}

var Riddle = (function(imageUrl) {
    var finished;
    //constructor
    function Riddle(imageUrl) {
        finished = false;
        //hide everything until riddle is created
        toggleShade(true);
        var img = document.createElement("img");
        img.id = "riddle";
        img.src = imageUrl;
        img.onload = function() {
            var color = COLORS[Math.floor(Math.random()*COLORS.length)];
            //svg height
            var h = img.height();
            //svg width
            var w = img.width();
            //vertices in height
            var hNum = RECTS;
            // width between vertices
            var interval = img.height() / hNum;
            //vertices in width
            var wNum =  Math.ceil(img.width() / interval);
            //max difference to standard rectangle
            var diff = interval/DIV;
            // temporary save last row for the next rectangles
            var lastRow = new Array();
            //create svg and append to content
            $('<div id="svg"></div>').appendTo('#content');
            var svg = document.createElementNS(NS, "svg");
            $(svg).appendTo('#svg')
                .attr({
                    "height" : "100%",
                    "width" : "100%"
                })
            svg.setAttributeNS(null, "viewBox", "0 0 " + w + " " + h);
            //position svg div
            $("#svg").css("left", $("#riddle")[0].x)
                .css("top", $("#riddle")[0].y)
                .height(h)
                .width(w+2);
            for (var i = 0; i <= hNum; i++) {
                // new temporary row
                var tmpRow = new Array();
                for (var j = 0; j <= wNum; j++) {
                    var tmp = new Vertice();
                    tmp.x = j * interval;
                    tmp.y = i * interval;
                    // if edge only randomize the edge direction
                    if(j!=0 && j!=wNum) {
                         tmp.x += randPosNeg()*diff;
                    }
                    if(i!=0 && i!=hNum){
                        tmp.y += randPosNeg()*diff;
                    }
                    tmpRow[j] = tmp;
                    //if not first row, add polygon to svg
                    if(i > 0 && j > 0) {
                        var polygon = document.createElementNS(NS, "polygon");
                        var s = lastRow[j-1].toString() + " " + lastRow[j].toString()
                            + " " + tmpRow[j].toString() + " " + tmpRow[j-1].toString();
                        $(polygon).attr("points", s).attr("class", color).appendTo('svg');
                    }
                }
                lastRow = tmpRow;
            }
            //show everything
            toggleShade();
            //register eventHandlers;
            eventHandlers();
        }
        img = $(img);
        //append riddle to content
        $('#content').html(img);
    }
    // randomly returns +1 and -1
    function randPosNeg() {
        return Math.random()>0.5? 1 : -1;
    }

    //function to animate the uncovering
    var running = false;
    function fade(step) {
        var single = typeof step !== "boolean" ? false : step;
        if(running || single) {
            var pols = $("polygon:not([style])");
            //stop animation if no visible polygons
            if(pols.length < 1) {
                running = false;
                finished = true;
            }
            //select random polygon and fade out
            pols.filter(":eq(" + Math.floor(Math.random() * pols.length) + ")").fadeOut(500, fade);
        }
    }

    //toggle a shade over the whole window
    function toggleShade(bool) {
        var on = typeof bool === "boolean" ? bool : false;
        var shader = $("#shade").length > 0 ? $("#shade") : $('<div id="shade"></div>').appendTo("body");
        if(on) {
            shader.show();
        } else {
            shader.hide();
        }
    }
    //
    Riddle.prototype.handlers = function(){
        this.eventHandlers();
    }

    var handlers = false;
    function eventHandlers() {
        if(!handlers) {
            //arrow keys are only detected on keydown, not keypress
            $(document).on("keydown.riddle", function(e){
            switch(e.keyCode) {
                //spacebar
                case 32:
                    //toggle running
                    running = running? false: true;
                    fade();
                    break;
                //right
                case 39:
                    //if finished go to next riddle
                    if(finished) {
                        GAME.next();
                        break;
                    }
                    //if running stop, else uncover next rectangle
                    if(running){
                        running = false;
                    } else {
                        fade(true);
                    }
                    break;
                //enter
                case 13:
                    //uncover whole picture
                    running = false;
                    finished = true;
                    $("polygon:not([style])").fadeOut(500);
                    eventHandlers();
                    break;
                }
            });
            handlers = true;
        }
    }
    return Riddle;
})();
var Vertice = function() {
    this.x;
    this.y;
}
Vertice.prototype.toString = function() {
    return this.x + ',' + this.y;
};

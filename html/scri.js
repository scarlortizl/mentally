class Position {
  constructor(x,y) {
    this.x = x;
    this.y = y; 
  }
}

class EmptyTile {
  constructor(x,y) {
    this.x = x;
    this.y = y; 
  }
  
  getPosition() {
    return new Position(this.x,this.y);
  }
  
  update(x,y) {
    this.x = x;
    this.y = y;
  }
}

class Tile {
  constructor (x,y,value) {
    this.x = x;
    this.y = y;
    this.value = value; 
    
    //create tile element
    let span = document.createElement('span');
    span.setAttribute('class', 'tiles');
    this.element=span;
    //append element to board
    $('#board').append(this.element);
    
    this.render();
  }
  
  render () {
    $(this.getElement()).text(this.value);
    $(this.getElement()).css({
      top: this.x * 85 +'px',
      left: this.y * 85 +'px'      
    });
    if(this.getValue()>2048) {
      $(this.getElement()).addClass('tile-super');
    }
    else {
      $(this.getElement()).addClass('tile-' + this.getValue());
    }    
  }
  
  getElement () {
    return this.element;
  }
  
  getPosition() {
    return new Position(this.x,this.y);
  }
  
  slideTo (position,callback) {
    this.x=position.x;
    this.y=position.y;
    
    $(this.getElement()).animate({
      top: position.x * 85 +'px',
      left: position.y * 85 +'px',
    },'fast',callback);
  }
  
  destroy () {
    $(this.getElement()).remove();
  }
  
  getValue () {
    return this.value;
  }
  
  setValue (value) {
    this.value=value;    
  }  
  
  zoomIn () {
    window.animatelo.zoomIn(this.getElement(), {
  duration: 200});
  }
}

class Board {  
  constructor() {
    this.tiles=[];
    this.score=0;
    this.spawnOnSlide=false;
    this.init();    
  }
  
  init() {
    $('.blanks').each(function(index,ele) {
    let x=parseInt(index / 4);
    let y=index % 4;
    $(ele).css({
       top: (x*85)+'px',
       left: (y*85)+'px'      
      });      
    });
    
  }
  
  setScore (value) {
    this.score=value;
    $('#score').text(this.score);
  }
  
  getScore() {
    return this.score;
  }
  
  getTile (x,y) {
    for(let tile of this.tiles) {
      if(tile.x==x && tile.y==y)
        return tile;
    }
    return undefined;
  }
  
  swipe (direction) {
    let sets=[];    
    for(let x=0; x<4; x++) {
      let set=[];
      for(let y=0; y<4; y++) {
        switch(direction){
          case "LEFT": {
            let tile=this.getTile(x,y);
            if(tile) {
              set.push(tile);  
            }
            else {
              set.push(new EmptyTile(x,y));  
            }
          }                        
          break;
          case "RIGHT": {            
            let tile=this.getTile(x,3-y);
            if(tile) {
              set.push(tile);  
            }
            else {
              set.push(new EmptyTile(x,3-y));  
            }
          }            
          break;
          case "DOWN": {
            let tile=this.getTile(3-y,x);
            if(tile) {
              set.push(tile);  
            }
            else {
              set.push(new EmptyTile(3-y,x));  
            }
          }            
          break;
          case "UP": {
           let tile=this.getTile(y,x);
            if(tile) {
              set.push(tile);  
            }
            else {
              set.push(new EmptyTile(y,x));  
            } 
          }            
          break;
        }
      }
      sets.push(set);
    }
        
    for (let set of sets) {
      this.slide(set);
    }
    
    if(this.spawnOnSlide) {
      this.spawnTile(); 
      this.spawnOnSlide=false;
    }    
  }
  
  newGame () {
    for(let tile of this.tiles) {
      tile.destroy();
    }    
    this.tiles=[];    
    for(let i=0; i<2; i++) {
      this.spawnTile();
    }
    this.setScore(0);
  }
  
  spawnTile () {
    let positions=this.getEmptyPositions();
    let index=this.getRandomRange(0,positions.length-1);
    let position=positions[index];
    let tile = new Tile(position.x,position.y, this.getRandomValue());
    tile.zoomIn();
    this.tiles.push(tile);
  }
  
  getRandomValue() {
    let values=[2];
    if(this.getScore() > 0) {
      values.push(4);
    }
    return values[this.getRandomRange(0, values.length-1)];
  }
  
  getEmptyPositions () {
    let positions=[];
    for(let x=0; x<4; x++) {
      for(let y=0; y<4; y++) {
        if(!this.getTile(x,y)) {
          positions.push(new Position(x,y));
        }          
      }
    }
    return positions;
  }
  
  slide (set) {       
    for (let i=0; i<set.length; i++) {
      let tile=set[i];
      if(i>0) {        
        if(tile instanceof Tile) {          
          let previousTiles=set.slice(0,i);          
          
          let filledTile=previousTiles.filter(t=> t instanceof Tile).reverse().shift();          
          //if same value is found in previous tile
          //merge tiles and replace current tile with empty
          if(filledTile && filledTile.getValue() == tile.getValue()) {
            let index=set.indexOf(filledTile);            
            set[index]= tile;
            set[i]=new EmptyTile(tile.x, tile.y);
            let newPos=filledTile.getPosition();
            let board=this;
            tile.setValue(tile.getValue()*2);
            this.tiles.splice( this.tiles.indexOf(filledTile), 1);
            tile.slideTo(newPos, function() {
              filledTile.destroy();              
              board.setScore( board.getScore() + tile.getValue());
              tile.render();
              tile.zoomIn();              
            });            
            
            this.spawnOnSlide=true;
          } 
          //if empty tiles found in previous tiles
          //switch tiles and update positions
          else {            
            let emptyTile=previousTiles.filter( t => t instanceof EmptyTile).shift();
            if(emptyTile) {                         
              let index=set.indexOf(emptyTile);
              set[index]=tile;
              set[i]=emptyTile;
              let newPos = emptyTile.getPosition();
              emptyTile.update( tile.x, tile.y);
              tile.slideTo(newPos, function() {
                
              });
              
              this.spawnOnSlide=true;
            } 
          }
        }  
      }      
    }
  }
  
  getRandomRange(min,max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

let board=new Board();
board.newGame();

$(document).keydown(function(e) {
    switch(e.which) {
        case 37: // left
        board.swipe("LEFT");
        break;

        case 38: // up
        board.swipe("UP");
        break;

        case 39: // right
        board.swipe("RIGHT");
        break;

        case 40: // down
        board.swipe("DOWN");
        break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
});

$(document).on('swipeleft',function(e,data){
  board.swipe("LEFT");
  e.preventDefault();
});
$(document).on('swiperight',function(e,data){
  board.swipe("RIGHT");
  e.preventDefault();
});
$(document).on('swipeup',function(e,data){
  board.swipe("UP");
  e.preventDefault();
});
$(document).on('swipedown',function(e,data){
  board.swipe("DOWN");
  e.preventDefault();
});

$('#restart').click(function(){
  board.newGame();
});
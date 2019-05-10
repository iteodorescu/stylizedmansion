"use strict";

//////////////////////////////////////////////////////////
// COLOR

// stores rgba channels
// all components in the range [0, 1]
// provides conversion to/from other color spaces
//////////////////////////////////////////////////////////

// TODO don't go through prototype chain for get/set pixel functions
// TODO make pixel just a typed array

function Pixel(r, g, b, a) {
  if (typeof r === "string") {
    // hex string
    var bigint = parseInt(r.substring(1), 16);
    this.r = ((bigint >> 16) & 255) / 255;
    this.g = ((bigint >> 8) & 255) / 255;
    this.b = (bigint & 255) / 255;
    this.a = 1;
  } else {
    if (a === undefined) {
      a = 1;
    }
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
}

// make sure pixel values are between 0 and 255
Pixel.prototype.clamp = function() {
  this.r = this.r < 0 ? 0 : this.r > 1 ? 1 : this.r;
  this.g = this.g < 0 ? 0 : this.g > 1 ? 1 : this.g;
  this.b = this.b < 0 ? 0 : this.b > 1 ? 1 : this.b;
  this.a = this.a < 0 ? 0 : this.a > 1 ? 1 : this.a;
};

// Constrain val to the range [min, max]
function clamp(val, min, max) {
  /* Shorthand for:
  * if (val < min) {
  *   return min;
  * } else if (val > max) {
  *   return max;
  * } else {
  *   return val;
  * }
  */
  return ((val < min) ? min : ((val > max) ? max : val));
}

// copy value from web color code like '#a2881f' into pixel
Pixel.prototype.fromHex = function(hex) {
  var bigint = parseInt(hex.substring(1), 16);
  this.r = ((bigint >> 16) & 255) / 255;
  this.g = ((bigint >> 8) & 255) / 255;
  this.b = (bigint & 255) / 255;
  this.a = 1;
};

// convert to hex (returns string)
Pixel.prototype.toHex = function() {
  var r = Math.round(this.r) * 255;
  var g = Math.round(this.g) * 255;
  var b = Math.round(this.b) * 255;
  return (
    "#" +
    (r < 16 ? "0" : "") +
    r.toString(16) +
    (g < 16 ? "0" : "") +
    g.toString(16) +
    (b < 16 ? "0" : "") +
    b.toString(16)
  );
};

// copy value from HSL into pixel
// fromHSL( h, s, l ), where each is a number
// fromHSL( hsl ), where hsl is an array containing the values
Pixel.prototype.fromHSL = function(hOrHsl, s, l) {
  if (hOrHsl !== null && typeof hOrHsl === "object") {
    var h = h.h;
    s = h.s;
    l = h.l;
  } else {
    var h = hOrHsl;
  }
  var m1, m2;
  m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
  m1 = l * 2 - m2;
  var hueToRGB = function(m1, m2, h) {
    h = h < 0 ? h + 1 : h > 1 ? h - 1 : h;
    if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
    if (h * 2 < 1) return m2;
    if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
    return m1;
  };
  this.r = hueToRGB(m1, m2, h + 1 / 3);
  this.g = hueToRGB(m1, m2, h);
  this.b = hueToRGB(m1, m2, h - 1 / 3);
  /*
  let r = Math.round(hueToRGB(m1, m2, h + 1 / 3));
  let g = Math.round(hueToRGB(m1, m2, h));
  let b = Math.round(hueToRGB(m1, m2, h - 1 / 3));
  let pix = new Pixel(r,g,b,1);
  return pix;
  */
};

// convert to HSL (returns values in an object)
Pixel.prototype.toHSL = function() {
  var r = this.r,
    g = this.g,
    b = this.b;
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2; // correct

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  //return new Pixel(h, s, l, 1);
  return {
    h: h,
    s: s,
    l: l,
  };
};


Pixel.prototype.toRGB = function() {
  //assert(this.colorSpace === "hsl", "input pixel color space must be hsl");

  var h = this.r;
  var s = this.g;
  var l = this.b;

  var m1, m2;
  m2 = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
  m1 = l * 2 - m2;
  var hueToRGB = function( m1, m2, h ) {
    h = ( h < 0 ) ? h + 1 : ((h > 1) ? h - 1 : h);
    if ( h * 6 < 1 ) return m1 + (m2 - m1) * h * 6;
    if ( h * 2 < 1 ) return m2;
    if ( h * 3 < 2 ) return m1 + (m2 - m1) * (0.66666 - h) * 6;
    return m1;
  };
  this.r = hueToRGB( m1, m2, h + 1 / 3 );
  this.g = hueToRGB( m1, m2, h         );
  this.b = hueToRGB( m1, m2, h - 1 / 3 );
};

Pixel.prototype.copy = function() {
  return new Pixel(this.r, this.g, this.b, this.a);
};

// PIXEL ARITHMETIC OPERATORS
// alpha is not affected by these

// adds argument p to this, returns this
Pixel.prototype.plus = function(p) {
  this.r += p.r;
  this.g += p.g;
  this.b += p.b;
  return this;
};

// subtracts argument p to this, returns this
Pixel.prototype.minus = function(p) {
  this.r -= p.r;
  this.g -= p.g;
  this.b -= p.b;
  return this;
};

// multiplies components by scalar s, returns this
Pixel.prototype.multipliedBy = function(s) {
  this.r *= s;
  this.g *= s;
  this.b *= s;
  return this;
};

// divides components by scalar s, returns this
Pixel.prototype.dividedBy = function(s) {
  s = 1 / s;
  this.r *= s;
  this.g *= s;
  this.b *= s;
  return this;
};

// copies this pixel, adds argument p to it, returns the new pixel
Pixel.prototype.copyAdd = function(p) {
  var q = new Pixel(0, 0, 0);
  q.r = this.r + p.r;
  q.g = this.g + p.g;
  q.b = this.b + p.b;
  q.a = this.a;
  return q;
};

// copies this pixel, subtracts argument p to it, returns the new pixel
Pixel.prototype.copySub = function(p) {
  var q = new Pixel(0, 0, 0);
  q.r = this.r - p.r;
  q.g = this.g - p.g;
  q.b = this.b - p.b;
  q.a = this.a;
  return q;
};

// make sure pixel values are between 0 and 255
Pixel.prototype.clamp = function() {
  this.r = Math.min( 1, Math.max( this.r,  0 ) );
  this.g = Math.min( 1, Math.max( this.g,  0 ) );
  this.b = Math.min( 1, Math.max( this.b,  0 ) );
  this.a = Math.min( 1, Math.max( this.a,  0 ) );
};

// scale values by argument s and return result in new pixel
Pixel.prototype.copyMultiplyScalar = function(s) {
  var q = new Pixel(0, 0, 0);
  q.r = this.r * s;
  q.g = this.g * s;
  q.b = this.b * s;
  q.a = this.a;
  return q;
};

// scale values by inverse of argument s and return result in new pixel
Pixel.prototype.copyDivideScalar = function(s) {
  var q = new Pixel(0, 0, 0);
  s = 1 / s;
  q.r = this.r * s;
  q.g = this.g * s;
  q.b = this.b * s;
  q.a = this.a;
  return q;
};

//////////////////////////////////////////////////////////
// IMG
//////////////////////////////////////////////////////////

// width and height in pixels
// data an array of numbers with components in range [0, 255] (like that in ImageData)
// if data isn't supplied, image is cleared to white
function Image(width, height, data) {
  // non-integer dimensions cause weird behavior
  this.width = Math.floor(width);
  this.height = Math.floor(height);
  if (data === undefined) {
    data = new Uint8ClampedArray(width * height * 4);
    for (var i = 0; i < data.length; i++) {
      data[i] = 0;
    }
  }
  this.data = data;
}

// clears to transparent
Image.prototype.clear = function() {
  for (var i = 0; i < this.data.length; i++) {
    if (i % 4 == 3) {
      this.data[i] = 255;
    } else {
      this.data[i] = 0;
    }
  }
};

Image.prototype.display = function() {
  var canvas = Main.canvas;
  var context = Main.context;

  context.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = this.width;
  canvas.height = this.height;

  context.putImageData(this.getImgData(), 0, 0);
};

Image.prototype.copy = function() {
  var data = new Uint8ClampedArray(this.width * this.height * 4);
  for (var i = 0; i < data.length; i++) {
    data[i] = this.data[i];
  }
  return new Image(this.width, this.height, data);
};

Image.prototype.blur = function(sigma) {
  var newImg = this.copy();
  const winR = Math.round(sigma*3);
  for (let y = 0; y < this.height; y++) {
    for (let x = 0; x < this.width; x++) {
      // horizontal kernel multiplying
      let sum0 = 0;
      let sum1 = 0;
      let sum2 = 0;
      let gSum = 0;
      let i;
      for(i = x-winR; i <= x+winR; i++) {
        // get the pixel val, muliply by the gausian function
        // keep track of the weighted sum of
        if (i >= 0 && i < this.width && y < this.height){
          let pix = this.getPixel(i, y);
          
          let gauss = Math.exp((-1*(i-x)*(i-x))/(2*sigma*sigma));
          gSum += gauss;
          // debugger
          sum0 += pix.r*gauss;
          sum1 += pix.g*gauss;
          sum2 += pix.b*gauss;
        }
      }
      let pixel = new Pixel(0,0,0,1);
      pixel.r = clamp(sum0/gSum,0,1);
      pixel.g = clamp(sum1/gSum), 0,1 ;
      pixel.b = clamp(sum2/gSum, 0, 1);
      newImg.setPixel(x, y, pixel);

    }
  }
  // var newImg2 = newImg.copy();
  for (let x = 0; x < this.width; x++) {
    for (let y = 0; y < this.height; y++) {
      let sum0 = 0;
      let sum1 = 0;
      let sum2 = 0;
      let gSum = 0;
      let i;
      for(i = y-winR; i <= y+winR; i++) {
          // get the pixel val, muliply by the gausian function
          // keep track of the weighted sum of
          if (x >= 0 && i >= 0 && x < this.width && i < this.height){
              let pix = newImg.getPixel(x, i);
              
              let gauss = Math.exp((-1*(i-y)*(i-y))/(2*sigma*sigma));
              gSum += gauss;
              sum0 += pix.r*gauss;
              sum1 += pix.g*gauss;
              sum2 += pix.b*gauss;
          }  
      }
      let pixel = new Pixel(0,0,0,1);
      pixel.r = clamp(sum0/gSum,0,1);
      pixel.g = clamp(sum1/gSum), 0,1 ;
      pixel.b = clamp(sum2/gSum, 0, 1);
      this.setPixel(x, y, pixel);
    }
  }
}


Image.prototype.getImgData = function() {
  // this function should be this one-liner, but it only works in firefox and safari:
  // return new ImageData( this.data, this.width, this.height );

  // instead here is an ugly way to convert our data to ImageData object
  // this is a workaround because Chrome does not yet implement the constructor above
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var imageData = ctx.createImageData(this.width, this.height);
  imageData.data.set(this.data);
  return imageData;
};

// pixelIndex calls inlined for performance
// NOTE: x and y must be integers
Image.prototype.getPixel = function(x, y) {
  var index = 4 * (y * this.width + x);
  var color = new Pixel(
    this.data[index] / 255,
    this.data[index + 1] / 255,
    this.data[index + 2] / 255,
    this.data[index + 3] / 255
  );
  // var color2 = [this.data[index], this.data[index+1], this.data[index+2], this.data[index+3]];
  return color;
};

Image.prototype.setPixel = function(x, y, color) {
  if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
    var index = 4 * (y * this.width + x);
    this.data[index] = color.r * 255;
    this.data[index + 1] = color.g * 255;
    this.data[index + 2] = color.b * 255;
    this.data[index + 3] = color.a * 255; // always opaque
  }
};

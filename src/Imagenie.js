/* global define*/
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root.Imagenie = factory(root);
  }
})(this,
  function () {
    'use strict';

    var _images = [];

    /**
     * Helper object
     * @type {{log: Function}}
     */
    var Helper = {
      /**
       * Logs messages to console
       */
      log: function() {
        if (Config.debug) {
          console.log.apply(console, arguments);
        }
      },

      /**
       * Checks if a string is a valid URL
       * @param {string} strText Text to check
       * @returns {boolean} True if text is a valid URL, false otherwise
       */
      isURL: function (strText) {
        return strText.search(/^https?:\/\//) >= 0;
      }
    };

    /**
     * Configuration object
     * @type {{debug: boolean}}
     */
    var Config = {
      // Is dev environment?
      debug: true
    };

    var Canvas = {
      _init: function () {
        Canvas.canvas = document.createElement('canvas');
        Canvas.context = Canvas.canvas.getContext('2d')
      },
      reset: function (intWidth, intHeight) {
        Canvas.canvas.height = intHeight;
        Canvas.canvas.width = intWidth;
        Canvas.context.clearRect (0 , 0, intWidth, intHeight);
      },
      drawImage: function (objImage, intX, intY, intWidth, intHeight) {
        Canvas.reset(intWidth, intHeight);
        Canvas.context.drawImage(objImage, intX, intY, intWidth, intHeight);
      },
      cropImage: function (objImage, intSX, intSY, intSWidth, intSHeight, intDX, intDY, intDWidth, intDHeight) {
        Canvas.clear(intSWidth, intSHeight);
        Canvas.context.drawImage(objImage, intSX, intSY, intSWidth, intSHeight, intDX, intDY, intDWidth, intDHeight);
      },
      getImageData: function (intX, intY, intWidth, intHeight) {
        return Canvas.context.getImageData(intX, intY, intWidth, intHeight);
      }
    };
    Canvas._init();

    function Imagenie (input) {
      /**
       * Initialization function
       */
      (function init () {
        // Check if images argument is a string ot an array:
        if (typeof input === 'string') {
          // Check if string is a URL:
          if (Helper.isURL(input)) {
            Helper.log('Image URL');
            // TODO
          }
          // Check if string is an image(s) selector:
          else if (document.querySelectorAll(input).length > 0) {
            Helper.log('Image elements selector');

            [].forEach.call(document.querySelectorAll(input), function(elem) {
              if (elem.nodeName === 'IMG') {
                elem.dataset.src = elem.src;
                _images.push({
                  elem: elem,
                  source: _getDataUrl(elem)
                });
              }
            });
          }
        }
        // Check if argument is an array (could be an array of one of the two options above)
        else if (Array.isArray(input)) {
          Helper.log('Array of something');
          // TODO
        }
        // Check if argument is an array (could be an array of one of the two options above)
        else if (input.constructor.name === 'NodeList') {
          Helper.log('Image elements collection');
          [].forEach.call(input, function(elem) {
            if (elem.nodeName === 'IMG') {
              elem.dataset.src = elem.src;
              _images.push({
                elem: elem,
                source: _getDataUrl(elem)
              });
            }
          });
        }
      })();
    }

    /**
     * Local shortcut to get image's data
     * @param {HTMLElement} objImage Image element
     * @returns {[number]} Array of pixels. Each pixel is represented by 4 values: RGBA
     * @private
     */
    function _getImageDataArray (objImage) {
      // Draw image on canvas:
      Canvas.drawImage(objImage, 0, 0, objImage.width, objImage.height);
      // Get image data:
      return Canvas.getImageData(0, 0, objImage.width, objImage.height).data;
    }

    /**
     * Local shortcut to get image's data url (base64)
     * @param {HTMLElement} objImage Image element
     * @returns {string} Base64 representation of image data
     * @private
     */
    function _getDataUrl (objImage, strType) {
      // Draw image on canvas:
      Canvas.drawImage(objImage, 0, 0, objImage.width, objImage.height);
      // Get image data:
      return Canvas.canvas.toDataURL();
    }

    /**
     * Manipulates pixels data
     * @param {function} fncManipulation Manipulation function
     * @private
     */
    function _manipulatePixel (fncManipulation) {
      _images.forEach(function (image) {
        var objImageData,
          data;

        // Draw image on canvas:
        Canvas.drawImage(image.elem, 0, 0, image.elem.width, image.elem.height);
        // Get image data:
        objImageData = Canvas.getImageData(0, 0, image.elem.width, image.elem.height);
        data = objImageData.data;
        // Subtract from each pixel's RGB component 255 (inversion):
        for(var i = 0, len = data.length; i < len; i += 4) {
          fncManipulation(data, i);
        }
        // Update canvas:
        Canvas.context.putImageData(objImageData, 0, 0);
        // Update image:
        image.elem.src = Canvas.canvas.toDataURL();
      });
    };

    /**
     * Gets image dimension (x, y)
     * @returns [{src: {string}, width: {number}, height: {number}}] Width, height and source of image(s)
     */
    Imagenie.prototype.size = function () {
      return _images.map(function (objImage) {
        return {
          src: objImage.elem.dataset.src,
          displayWidth: objImage.elem.width,
          displayHeight: objImage.elem.height,
          naturalWidth: objImage.elem.naturalWidth,
          naturalHeight: objImage.elem.naturalHeight
        };
      });
    };

    /**
     * Gets image pixel RGBA values
     * @param {number} intX X coordinate of a pixel
     * @param {number} intY Y coordinate of a pixel
     * @returns [{r: {number}, g: {number}, b: {number}, a: {number}}] RGBA value of image(s) pixel
     */
    Imagenie.prototype.pixel = function (intX, intY) {
      if (intX >= 0 && intY >= 0) {
        return _images.map(function (objImage) {
          var arrData = _getImageDataArray(objImage.elem);

          return {
            r: arrData[((objImage.elem.width * intY) + intX) * 4],
            g: arrData[((objImage.elem.width * intY) + intX) * 4 + 1],
            b: arrData[((objImage.elem.width * intY) + intX) * 4 + 2],
            a: arrData[((objImage.elem.width * intY) + intX) * 4 + 3]
          }
        });
      }
    };

    /**
     * Checks if image contains alpha chanel
     * @returns [{boolean}] Transparency flag of image(s), true if it contains transparency, false otherwise
     */
    Imagenie.prototype.transparency = function () {
      return _images.map(function (objImage) {
        var arrData = _getImageDataArray(objImage);

        for(var y = 0; y < objImage.elem.height; y++) {
          for(var x = 0; x < objImage.elem.width; x++) {
            if (arrData[((objImage.elem.width * y) + x) * 4 + 3] < 255) {
              return true;
            }
          }
        }

        return false;
      });
    };

    /**
     * Crops an image
     * @param {number} intX The x coordinate where to start clipping
     * @param {number} intY The y coordinate where to start clipping
     * @param {number} intWidth The width of the clipped image
     * @param {number} intHeight The height of the clipped image
     * @returns {Imagenie} for chainability
     */
    Imagenie.prototype.crop = function (intX, intY, intWidth, intHeight) {
      if (intX >= 0 && intY >= 0 && intWidth > 0 && intHeight > 0) {
        _images.forEach(function (objImage) {
          // Draw image on canvas:
          Canvas.cropImage(objImage.elem, intX, intY, intWidth, intHeight, 0, 0, intWidth, intHeight);
          // Update image:
          objImage.elem.src = Canvas.canvas.toDataURL();
        });
      }

      return this;
    };

    /**
     * Adds opacity to all pixels in picture
     * @param {number} dcmOpacity Opacity level from 0 to 1
     * @param {boolean} blnIgnoreTransparent If set to true, transparent pixels opacity won't be overwritten
     * @returns {Imagenie} for chainability
     */
    Imagenie.prototype.alpha = function (dcmOpacity, blnIgnoreTransparent) {
      if (dcmOpacity >= 0 && dcmOpacity <= 1) {
        _manipulatePixel(function (arrPixel, i) {
          if (!blnIgnoreTransparent || arrPixel[i + 3] > 0) {
            arrPixel[i + 3] = dcmOpacity * 255;
          }
        });
      }

      return this;
    };

    /**
     * Scales image (preserves ratio)
     * @param {number} dcmScale Scaling degree greater than 0
     * @returns {Imagenie} for chainability
     */
    Imagenie.prototype.scale = function (dcmScale) {
      if (dcmScale > 0) {
        _images.forEach(function (objImage) {
          // Draw image on canvas:
          Canvas.drawImage(objImage.elem, 0, 0, objImage.elem.width * Math.max(0, dcmScale), objImage.elem.height * Math.max(0, dcmScale));
          // Update image:
          objImage.elem.src = Canvas.canvas.toDataURL();
        });
      }

      return this;
    };

    /**
     * Resets image to its original state
     * @returns {Imagenie} for chainability
     */
    Imagenie.prototype.reset = function () {
      _images.forEach(function (objImage) {
        objImage.elem.src = objImage.source;
      });

      return this;
    };

    /**
     * Converts image colors to Grayscale
     * @returns {Imagenie} for chainability
     */
    Imagenie.prototype.grayscale = function () {
      _manipulatePixel(function (arrPixel, i) {
        var brightness = 0.34 * arrPixel[i] + 0.5 * arrPixel[i + 1] + 0.16 * arrPixel[i + 2];

        arrPixel[i] = brightness;
        arrPixel[i + 1] = brightness;
        arrPixel[i + 2] = brightness;
      });

      return this;
    };

    /**
     * Flips image(s) horizontally
     * @returns {Imagenie} for chainability
     */
    Imagenie.prototype.mirror = function () {
      _images.forEach(function (objImage) {
        Canvas.reset(objImage.elem.width, objImage.elem.height);
        Canvas.context.save();
        Canvas.context.translate(objImage.elem.width / 2, objImage.elem.height / 2);
        // Flip canvas horizontally:
        Canvas.context.scale(-1, 1);
        // Draw image on canvas:
        Canvas.context.drawImage(objImage.elem, -objImage.elem.width / 2, -objImage.elem.height / 2, objImage.elem.width, objImage.elem.height);
        Canvas.context.restore();

        // Update image:
        objImage.elem.src = Canvas.canvas.toDataURL();
      });

      return this;
    };

    /**
     * Pixelate image(s)
     * @param {number} intPercent Percent of pixelation, 10 to 100. The lower the more pixelate image(s) get
     * @returns {Imagenie} for chainability
     */
    //Imagenie.prototype.pixelate = function (intPercent) {
    //  if(intPercent >= 0 && intPercent <= 100) {
    //    _images.forEach(function (objImage) {
    //      var h, w;
    //
    //      Canvas.reset(objImage.elem.width, objImage.elem.height);
    //      h = objImage.elem.height * intPercent * 0.01;
    //      w = objImage.elem.width * intPercent * 0.01;
    //      Canvas.context.mozImageSmoothingEnabled = false;
    //      Canvas.context.webkitImageSmoothingEnabled = false;
    //      Canvas.context.imageSmoothingEnabled = false;
    //      // Draw image on canvas:
    //      Canvas.context.drawImage(objImage.elem, 0, 0, w, h);
    //      Canvas.context.drawImage(Canvas.canvas, 0, 0, w, h, 0, 0, objImage.elem.width, objImage.elem.height);
    //
    //      // Update image:
    //      objImage.elem.src = Canvas.canvas.toDataURL();
    //    });
    //  }
    //
    //  return this;
    //};

    /**
     * Resizes image(s)
     * @param {number} intWidth Images new width
     * @param {number} intHeight Images new height
     * @returns {Imagenie} for chainability
     */
    Imagenie.prototype.resize = function (intWidth, intHeight) {
      if (intWidth >= 0 && intHeight >= 0) {
        _images.forEach(function (objImage) {
          // Draw image on canvas:
          Canvas.drawImage(objImage.elem, 0, 0, Math.max(0, intWidth), Math.max(0, intHeight));
          // Update image:
          objImage.elem.src = Canvas.canvas.toDataURL();
        });
      }

      return this;
    };

    /**
     * Rotates image(s)
     * @param {number} intDegrees The rotation angle in degrees
     * @returns {Imagenie} for chainability
     */
    Imagenie.prototype.rotate = function (intDegrees) {
      if (intDegrees >= 0) {
        _images.forEach(function (objImage) {
          Canvas.reset(objImage.elem.width, objImage.elem.height);
          Canvas.context.save();
          Canvas.context.translate(objImage.elem.width / 2, objImage.elem.height / 2);
          // Rotate canvas:
          Canvas.context.rotate((intDegrees % 360)  * Math.PI / 180);
          // Draw image on canvas:
          Canvas.context.drawImage(objImage.elem, -objImage.elem.width / 2, -objImage.elem.height / 2, objImage.elem.width, objImage.elem.height);
          Canvas.context.restore();

          // Update image:
          objImage.elem.src = Canvas.canvas.toDataURL();
        });
      }

      return this;
    };

    /**
     * Inverts image(s) colors
     * @returns {Imagenie} for chainability
     */
    Imagenie.prototype.invert = function () {
      _manipulatePixel(function (arrPixel, i) {
        arrPixel[i] = 255 - arrPixel[i];
        arrPixel[i + 1] = 255 - arrPixel[i + 1];
        arrPixel[i + 2] = 255 - arrPixel[i + 2];
      });

      return this;
    };

    /**
     * Swap one color to another
     * @param {r,g,b,a} objFromColor RGBA value to search for. Notice that you don't have to specify all properties
     * @param {r,g,b,a} objToColor RGBA value to replace with
     * @returns {Imagenie} for chainability
     */
    Imagenie.prototype.swap = function (objFromColor, objToColor) {
      if (objFromColor && objToColor) {
        _manipulatePixel(function (arrPixel, i) {
          if ((!objFromColor.r || objFromColor.r === arrPixel[i]) &&
            (!objFromColor.g || objFromColor.g === arrPixel[i + 1]) &&
            (!objFromColor.b || objFromColor.b === arrPixel[i + 2]) &&
            (!objFromColor.a || objFromColor.a === arrPixel[i + 3])) {
            ['r', 'g', 'b', 'a'].forEach(function (chanel, index) {
              if (objToColor.hasOwnProperty(chanel)) {
                arrPixel[i + index] = objToColor[chanel];
              }
            });
          }
        });
      }

      return this;
    };

    return Imagenie;

  });